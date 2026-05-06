import json
import asyncio
import logging

logger = logging.getLogger(__name__)
_ai_semaphore = asyncio.Semaphore(3)

from fastapi import APIRouter, Depends, HTTPException, Header
from app.security import (
    expensive_endpoint_rate_limit,
    require_digest_key,
    require_operational_key_if_configured,
)
from app.openai_client import get_openai_client

from app.models import (
    TrendIdeasRequest,
    TrendIdeasResponse,
    TrendIdea,
    VideoIdea,
    TrendDigestTopicsResponse,
    IdeaEnrichmentRequest,
    HooksResponse,
    HashtagsResponse,
    FullScriptResponse,
)
from app.youtube_client import youtube_search
from app.instagram_client import search_instagram
from app.tiktok_client import tiktok_trending_search
from app.google_news_client import google_news_search
from app.google_trends_client import google_trends_search
from app.web_search_client import web_search
from app.multi_reddit_client import multi_reddit_ingest
from app.pinterest_client import pinterest_search
from app.medium_client import medium_search
from app.x_client import search_x
from app.apify_client import apify_timeout_seconds
from app.social_signal_fetcher import cached_or_fetch, fetch_platform_signals

router = APIRouter(
    prefix="/trend-ideas",
    tags=["trend-ideas"],
    dependencies=[
        Depends(require_operational_key_if_configured),
        Depends(expensive_endpoint_rate_limit("trend-ideas")),
    ],
)
RECENCY_DAYS = 7

SYSTEM_PROMPT = """You are a warm, practical short-form content strategist.

Given a trending topic, a niche, and real-time data from multiple sources, generate exactly 3 viral short-form video ideas.

Voice and quality bar:
- Write like a helpful creator texting a friend a good idea.
- Keep the tone warm, simple, specific, and human.
- Avoid hype, fear bait, corporate phrases, and generic AI wording.
- Never use phrases like "game-changing", "unlock", "ultimate", "secret", "insane", "you won't believe", or "this changes everything".
- The first response should be a short idea card, not a finished script.

Rules for EVERY idea:
- HOOK: One short spoken line, 6-12 words. Make it curious but gentle.
- OPTIMIZED_TITLE: Natural creator title, under 42 characters.
- ANGLE: One plain sentence, under 18 words.
- IDEA: One concrete sentence, under 24 words. Say what to film, not a whole strategy.
- SCRIPT: Return an empty string. The user can click "Full script" if they want the script.
- HASHTAGS: Include 4-6 relevant hashtags. No random viral tags.
- SEO_DESCRIPTION: One simple sentence, under 18 words.
- Ground each idea in the provided real-time context and trends. Reference timely themes where relevant.

Return your response as a JSON array with exactly 3 objects, each having "hook", "angle", "idea", "script", "hashtags" (array of strings), "optimized_title", and "seo_description" keys.
Return ONLY the JSON array, no markdown, no commentary, and no extra text."""

TOPIC_DISCOVERY_PROMPT = """You are a trend analyst. Given the following real-time data about the "{niche}" niche, identify the TOP 3 most viral-worthy trending topics right now.

For each topic, return a short 2-5 word topic name that a content creator could make a video about.

Return ONLY a JSON array of 3 strings. Example: ["topic one", "topic two", "topic three"]

Real-time data:
{context}"""

HOOK_VARIATIONS_PROMPT = """You are a warm short-form video strategist. Given the niche, trending topic, and video concept below, write exactly 5 distinct opening hooks for the same idea.

Rules:
- Each hook must be one short spoken line, 6-12 words.
- Use different angles: curiosity, confession, tiny lesson, contrast, or relatable moment.
- Sound like a real creator, not marketing copy.
- Keep it kind and specific. No clickbait, no hype words, no fake urgency.
- Return ONLY a JSON array of 5 strings. No markdown, no keys, no commentary.

Niche: {niche}
Trending topic: {trend}
Title: {title}
Current hook (for reference): {hook}
Angle: {angle}
Concept: {idea}"""

TRENDING_HASHTAGS_PROMPT = """You are a TikTok/Instagram/Shorts growth expert. For the video concept below, suggest exactly 10 hashtags that feel trending and discoverable in 2026.

Rules:
- Mix broad reach tags with niche-specific tags.
- Hashtags must be relevant to the trend and concept (no random viral tags).
- Return each tag WITHOUT the # symbol in the JSON (the client will display #).
- Use camelCase or single words where appropriate for platform search.
- Return ONLY a JSON array of 10 strings. No markdown or extra text.

Niche: {niche}
Trending topic: {trend}
Title: {title}
Hook: {hook}
Angle: {angle}
Concept: {idea}"""

FULL_SCRIPT_PROMPT = """You are an expert short-form scriptwriter. Write a complete spoken script for a single vertical video.

Requirements:
- Total length 45-60 seconds when read aloud at a natural pace (about 110-160 words).
- First person, conversational, warm, and specific.
- Include: hook, 3 clear beats, and a soft call-to-action.
- Match the niche voice and the specific angle.
- Use optional brief stage directions in [brackets] only where genuinely helpful.
- Avoid generic AI phrasing, hype, and over-explaining.
- Do not use markdown headings; plain text with line breaks is fine.

Niche: {niche}
Trending topic: {trend}
Title: {title}
Hook (starting point): {hook}
Angle: {angle}
Concept: {idea}
Existing short script (may extend or replace as needed for length): {script}"""


def _text_value(value: object) -> str:
    return str(value or "").strip()


def _clamp_words(value: object, max_words: int, max_chars: int) -> str:
    text = " ".join(_text_value(value).split())
    if not text:
        return ""
    words = text.split()
    if len(words) > max_words:
        text = " ".join(words[:max_words]).rstrip(".,;:") + "..."
    if len(text) > max_chars:
        text = text[: max_chars - 3].rstrip(" .,;:") + "..."
    return text


def _normalized_hashtags(value: object) -> list[str]:
    if not isinstance(value, list):
        return []
    tags: list[str] = []
    seen: set[str] = set()
    for item in value:
        tag = _text_value(item).lstrip("#")
        if not tag:
            continue
        key = tag.lower()
        if key in seen:
            continue
        seen.add(key)
        tags.append(tag)
        if len(tags) >= 6:
            break
    return tags


def parse_ideas_json(raw: str) -> list[VideoIdea]:
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        lines = cleaned.splitlines()
        lines = [l for l in lines if not l.strip().startswith("```")]
        cleaned = "\n".join(lines)
    try:
        data = json.loads(cleaned)
        if isinstance(data, list):
            return [
                VideoIdea(
                    hook=_clamp_words(item.get("hook", ""), 14, 120),
                    angle=_clamp_words(item.get("angle", ""), 22, 160),
                    idea=_clamp_words(item.get("idea", ""), 30, 220),
                    script="",
                    hashtags=_normalized_hashtags(item.get("hashtags", [])),
                    optimized_title=_clamp_words(item.get("optimized_title", ""), 8, 60),
                    seo_description=_clamp_words(item.get("seo_description", ""), 22, 170),
                    thumbnail_url=_text_value(item.get("thumbnail_url", "")),
                )
                for item in data[:3]
            ]
    except json.JSONDecodeError:
        pass
    return [
        VideoIdea(
            hook=_clamp_words(cleaned, 12, 100),
            angle="",
            idea=_clamp_words(cleaned, 24, 180),
            script="",
        )
    ]


def parse_topics_json(raw: str) -> list[str]:
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        lines = cleaned.splitlines()
        lines = [l for l in lines if not l.strip().startswith("```")]
        cleaned = "\n".join(lines)
    try:
        data = json.loads(cleaned)
        if isinstance(data, list):
            return [str(t) for t in data[:3]]
    except json.JSONDecodeError:
        pass
    return [cleaned[:50]]


def _strip_code_fence(raw: str) -> str:
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        lines = cleaned.splitlines()
        lines = [l for l in lines if not l.strip().startswith("```")]
        cleaned = "\n".join(lines)
    return cleaned


def parse_json_string_array(raw: str, max_items: int, exact: int | None = None) -> list[str]:
    cleaned = _strip_code_fence(raw)
    try:
        data = json.loads(cleaned)
        if isinstance(data, list):
            out: list[str] = []
            cap = exact if exact is not None else max_items
            for item in data:
                if isinstance(item, str) and item.strip():
                    out.append(item.strip())
                if len(out) >= cap:
                    break
            if exact is not None:
                if len(out) < exact:
                    return []
                return out[:exact]
            return out[:max_items]
    except json.JSONDecodeError:
        pass
    return []


def normalize_hashtag_tag(tag: str) -> str:
    t = tag.strip()
    if t.startswith("#"):
        t = t[1:].strip()
    return t


async def _chat_completion_text(client, system: str | None, user: str, max_tokens: int) -> str:
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": user})

    async with _ai_semaphore:
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: client.chat.completions.create(
                model="gpt-5.2",
                max_completion_tokens=max_tokens,
                messages=messages,
            ),
        )
    return response.choices[0].message.content or ""


async def _safe_fetch(coro, default, timeout=10.0):
    try:
        return await asyncio.wait_for(coro, timeout=timeout)
    except Exception as e:
        logger.warning("Source fetch failed: %s", e)
        return default


def _first_str(item: dict, keys: list[str]) -> str:
    for key in keys:
        value = item.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return ""


def _organic_thumbnail_urls(topic_media: dict) -> list[str]:
    candidates: list[str] = []
    source_specs = [
        ("youtube", ["thumbnail", "thumbnail_url"]),
        ("pinterest", ["image_url", "thumbnail_url"]),
        ("instagram", ["thumbnail_url", "media_url", "image_url"]),
        ("tiktok", ["cover", "thumbnail", "thumbnail_url", "coverUrl"]),
        ("x", ["thumbnail_url", "image_url"]),
    ]
    for bucket, keys in source_specs:
        rows = topic_media.get(bucket, [])
        if not isinstance(rows, list):
            continue
        for row in rows:
            if not isinstance(row, dict):
                continue
            url = _first_str(row, keys)
            if url.startswith("http://") or url.startswith("https://"):
                candidates.append(url)

    seen: set[str] = set()
    unique: list[str] = []
    for url in candidates:
        if url in seen:
            continue
        seen.add(url)
        unique.append(url)
    return unique


def attach_organic_thumbnails(ideas: list[VideoIdea], topic_media: dict) -> None:
    thumbnails = _organic_thumbnail_urls(topic_media)
    if not thumbnails:
        return
    for index, idea in enumerate(ideas):
        if not (idea.thumbnail_url or "").strip():
            idea.thumbnail_url = thumbnails[index % len(thumbnails)]


async def discover_trends(niche: str) -> tuple[list[str], dict]:
    coros = [
        _safe_fetch(google_news_search(niche, max_results=8), []),
        _safe_fetch(google_trends_search(niche), {}, timeout=15.0),
        _safe_fetch(web_search(f"{niche} trending viral 2026", max_results=8), []),
        _safe_fetch(fetch_platform_signals("reddit", niche, max_results=6, days_back=RECENCY_DAYS), []),
        _safe_fetch(fetch_platform_signals("youtube", niche, max_results=6, days_back=RECENCY_DAYS), []),
        _safe_fetch(fetch_platform_signals("instagram", niche, max_results=6, days_back=RECENCY_DAYS), []),
        _safe_fetch(fetch_platform_signals("tiktok", niche, max_results=6, days_back=RECENCY_DAYS), []),
        _safe_fetch(fetch_platform_signals("pinterest", niche, max_results=6, days_back=RECENCY_DAYS), []),
        _safe_fetch(fetch_platform_signals("x", niche, max_results=6, days_back=RECENCY_DAYS), []),
    ]
    news, trends_data, web_results, reddit_posts, youtube, instagram, tiktok, pins, x_posts = await asyncio.gather(*coros)

    context_parts = []
    if news:
        context_parts.append("News headlines:\n" + "\n".join(f"- {a['title']}" for a in news[:8]))
    rq = (trends_data or {}).get("related_queries", [])
    ts = (trends_data or {}).get("trending_searches", [])
    if rq:
        context_parts.append("Google Trends related:\n" + "\n".join(f"- {q['query']}" for q in rq[:8]))
    if ts:
        context_parts.append("Currently trending: " + ", ".join(ts[:8]))
    if web_results:
        context_parts.append("Web articles:\n" + "\n".join(f"- {r['title']}" for r in web_results[:8]))
    if reddit_posts:
        context_parts.append("Reddit discussions:\n" + "\n".join(f"- r/{p['subreddit']}: {p['title']}" for p in reddit_posts[:8]))
    if youtube:
        context_parts.append("YouTube Shorts:\n" + "\n".join(f"- {v.get('title', '')}" for v in youtube[:6]))
    if instagram:
        context_parts.append("Instagram/Reels signals:\n" + "\n".join(f"- {p.get('caption', '')}" for p in instagram[:6]))
    if tiktok:
        context_parts.append("TikTok signals:\n" + "\n".join(f"- {v.get('description', '')}" for v in tiktok[:6]))
    if pins:
        context_parts.append("Pinterest pins:\n" + "\n".join(f"- {p.get('title', '')}" for p in pins[:6]))
    if x_posts:
        context_parts.append("X conversations:\n" + "\n".join(f"- {p.get('title', '')}" for p in x_posts[:6]))

    raw_sources = {
        "google_news": news,
        "google_trends": trends_data,
        "web_search": web_results,
        "reddit_multi": reddit_posts,
        "youtube": youtube,
        "instagram": instagram,
        "tiktok": tiktok,
        "pinterest": pins,
        "x": x_posts,
    }

    return context_parts, raw_sources


async def gather_topic_media(niche: str, topic: str) -> dict:
    search_query = f"{niche} {topic}"
    instagram_query = search_query.strip()
    timeout_seconds = apify_timeout_seconds(background=False)
    logger.info("Starting media gather for topic '%s'", topic)
    logger.info("Calling Instagram search for niche '%s'", instagram_query)
    coros = [
        _safe_fetch(cached_or_fetch(
            "youtube",
            niche,
            search_query,
            max_results=5,
            fetch=lambda: youtube_search(search_query, max_results=5, days_back=RECENCY_DAYS),
            source="youtube-api",
        ), []),
        _safe_fetch(cached_or_fetch(
            "instagram",
            niche,
            instagram_query,
            max_results=5,
            fetch=lambda: search_instagram(
                instagram_query,
                max_results=5,
                timeout_seconds=timeout_seconds,
            ),
            source="apify-instagram",
        ), []),
        _safe_fetch(cached_or_fetch(
            "tiktok",
            niche,
            search_query,
            max_results=5,
            fetch=lambda: tiktok_trending_search(
                search_query,
                max_results=5,
                days_back=RECENCY_DAYS,
                timeout_seconds=timeout_seconds,
            ),
            source="apify-tiktok",
        ), []),
        _safe_fetch(cached_or_fetch(
            "x",
            niche,
            search_query,
            max_results=5,
            fetch=lambda: search_x(
                search_query,
                max_results=5,
                timeout_seconds=timeout_seconds,
            ),
            source="apify-x",
        ), []),
        _safe_fetch(google_news_search(search_query, max_results=4), []),
        _safe_fetch(web_search(f"{search_query} trending", max_results=4), []),
        _safe_fetch(cached_or_fetch(
            "pinterest",
            niche,
            search_query,
            max_results=5,
            fetch=lambda: pinterest_search(
                search_query,
                max_results=5,
                timeout_seconds=timeout_seconds,
            ),
            source="apify-pinterest",
        ), []),
        _safe_fetch(medium_search(search_query, max_results=4), []),
    ]
    youtube, instagram_results, tiktok, x_posts, news, web, pins, articles = await asyncio.gather(*coros)
    logger.info("Instagram results for topic '%s': %s items", topic, len(instagram_results))
    youtube_tagged = [{**item, "platform": "youtube"} for item in youtube if isinstance(item, dict)]
    instagram_tagged = [{**item, "platform": "instagram"} for item in instagram_results if isinstance(item, dict)]
    tiktok_tagged = [{**item, "platform": "tiktok"} for item in tiktok if isinstance(item, dict)]
    x_tagged = [{**item, "platform": "x"} for item in x_posts if isinstance(item, dict)]
    return {
        "youtube": youtube_tagged,
        "instagram": instagram_tagged,
        "tiktok": tiktok_tagged,
        "x": x_tagged,
        "google_news": news,
        "hackernews": [],
        "web_search": web,
        "pinterest": pins,
        "medium": articles,
    }


def build_context_prompt(niche: str, topic: str, discovery_context: list[str], topic_media: dict) -> str:
    parts = [f"Niche: {niche}\nTrending topic: {topic}\n"]
    parts.extend(discovery_context)

    yt = topic_media.get("youtube", [])
    if yt:
        parts.append("Popular YouTube videos:\n" + "\n".join(f"- {v.get('title', '')}" for v in yt[:4]))

    ig = topic_media.get("instagram", [])
    if ig:
        parts.append("Popular Instagram posts:\n" + "\n".join(f"- {p.get('caption', '')}" for p in ig[:4]))

    tt = topic_media.get("tiktok", [])
    if tt:
        parts.append("Popular TikTok videos:\n" + "\n".join(f"- {v.get('description', '')}" for v in tt[:4]))

    xp = topic_media.get("x", [])
    if xp:
        parts.append("X conversations:\n" + "\n".join(f"- {p.get('title', '')}" for p in xp[:4]))

    news = topic_media.get("google_news", [])
    if news:
        parts.append("Topic news:\n" + "\n".join(f"- {a['title']}" for a in news[:4]))

    web = topic_media.get("web_search", [])
    if web:
        parts.append("Web articles:\n" + "\n".join(f"- {r.get('title', '')}" for r in web[:4]))

    pins = topic_media.get("pinterest", [])
    if pins:
        parts.append("Pinterest pins:\n" + "\n".join(f"- {p.get('title', '')}" for p in pins[:4]))

    articles = topic_media.get("medium", [])
    if articles:
        parts.append("Medium articles:\n" + "\n".join(f"- {a.get('title', '')}" for a in articles[:4]))

    return "\n\n".join(parts)


async def _process_topic(client, niche: str, topic: str, discovery_context: list[str]) -> TrendIdea:
    try:
        media = await gather_topic_media(niche, topic)
        context = build_context_prompt(niche, topic, discovery_context, media)

        async with _ai_semaphore:
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: client.chat.completions.create(
                    model="gpt-5.2",
                    max_completion_tokens=1200,
                    messages=[
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": context},
                    ],
                ),
            )
        raw = response.choices[0].message.content or ""
        ideas = parse_ideas_json(raw)
        attach_organic_thumbnails(ideas, media)

        return TrendIdea(
            trend=topic,
            ideas=ideas,
            example_videos=media.get("youtube", [])[:4],
            instagram_posts=media.get("instagram", [])[:4],
            tiktok_videos=media.get("tiktok", [])[:4],
            x_posts=media.get("x", [])[:4],
            google_news=media.get("google_news", [])[:4],
            google_trends_data={},
            hackernews_stories=media.get("hackernews", [])[:3],
            web_results=media.get("web_search", [])[:4],
            reddit_posts=[],
            pinterest_pins=media.get("pinterest", [])[:4],
            medium_articles=media.get("medium", [])[:4],
        )
    except Exception as e:
        logger.error("Failed to process topic '%s': %s", topic, e)
        return TrendIdea(
            trend=topic,
            ideas=[VideoIdea(hook="Analysis unavailable", angle="", idea=f"Could not generate ideas: {e}", script="", thumbnail_url="")],
            example_videos=[],
            instagram_posts=[],
            tiktok_videos=[],
            x_posts=[],
        )


@router.post("/", response_model=TrendIdeasResponse)
async def get_trend_ideas(body: TrendIdeasRequest = TrendIdeasRequest()):
    niche = body.niche or "fitness"
    client = get_openai_client()

    discovery_context, raw_sources = await discover_trends(niche)

    if not any(discovery_context):
        raise HTTPException(status_code=404, detail="Could not discover trends for this niche. Try again.")

    context_text = "\n\n".join(discovery_context)
    prompt = TOPIC_DISCOVERY_PROMPT.format(niche=niche, context=context_text)

    loop = asyncio.get_event_loop()
    topic_response = await loop.run_in_executor(
        None,
        lambda: client.chat.completions.create(
            model="gpt-5.2",
            max_completion_tokens=256,
            messages=[{"role": "user", "content": prompt}],
        ),
    )
    topics = parse_topics_json(topic_response.choices[0].message.content or "")

    topic_coros = [_process_topic(client, niche, t, discovery_context) for t in topics]
    results = await asyncio.gather(*topic_coros)

    for r, src_key in [(raw_sources.get("reddit_multi", []), "reddit_posts"), (raw_sources.get("google_trends", {}), "google_trends_data")]:
        for res in results:
            if src_key == "reddit_posts" and not res.reddit_posts:
                raw_reddit = (r if isinstance(r, list) else [])[:6]
                res.reddit_posts = [
                    ({**post, "platform": "reddit"} if isinstance(post, dict) else post)
                    for post in raw_reddit
                ]
            elif src_key == "google_trends_data" and not res.google_trends_data:
                res.google_trends_data = r if isinstance(r, dict) else {}

    return TrendIdeasResponse(niche=niche, trend_ideas=list(results))


@router.post("/digest-topics", response_model=TrendDigestTopicsResponse)
async def get_digest_topics(
    body: TrendIdeasRequest = TrendIdeasRequest(),
    x_trend_digest_key: str | None = Header(default=None, alias="X-Trend-Digest-Key"),
):
    """
    Returns the top 3 trending topic names for a niche without generating full video ideas.
    Used by the weekly email digest. Optional TREND_DIGEST_KEY env locks this endpoint.
    """
    require_digest_key(x_trend_digest_key)
    niche = body.niche or "fitness"
    client = get_openai_client()

    discovery_context, _ = await discover_trends(niche)

    if not any(discovery_context):
        raise HTTPException(status_code=404, detail="Could not discover trends for this niche. Try again.")

    context_text = "\n\n".join(discovery_context)
    prompt = TOPIC_DISCOVERY_PROMPT.format(niche=niche, context=context_text)

    loop = asyncio.get_event_loop()
    topic_response = await loop.run_in_executor(
        None,
        lambda: client.chat.completions.create(
            model="gpt-5.2",
            max_completion_tokens=256,
            messages=[{"role": "user", "content": prompt}],
        ),
    )
    topics = parse_topics_json(topic_response.choices[0].message.content or "")

    return TrendDigestTopicsResponse(niche=niche, topics=topics)


@router.post("/generate-hooks", response_model=HooksResponse)
async def generate_hooks(body: IdeaEnrichmentRequest):
    client = get_openai_client()
    title = (body.optimized_title or "").strip() or (body.hook or "").strip() or "Video idea"
    prompt = HOOK_VARIATIONS_PROMPT.format(
        niche=body.niche or "general",
        trend=body.trend,
        title=title,
        hook=(body.hook or "").strip(),
        angle=(body.angle or "").strip(),
        idea=(body.idea or "").strip(),
    )
    raw = await _chat_completion_text(client, None, prompt, max_tokens=256)
    hooks = parse_json_string_array(raw, max_items=8, exact=5)
    hooks = [_clamp_words(hook, 14, 120) for hook in hooks]
    if len(hooks) != 5:
        raise HTTPException(status_code=502, detail="Could not parse 5 hooks from model response.")
    return HooksResponse(hooks=hooks)


@router.post("/generate-hashtags", response_model=HashtagsResponse)
async def generate_hashtags(body: IdeaEnrichmentRequest):
    client = get_openai_client()
    title = (body.optimized_title or "").strip() or (body.hook or "").strip() or "Video idea"
    prompt = TRENDING_HASHTAGS_PROMPT.format(
        niche=body.niche or "general",
        trend=body.trend,
        title=title,
        hook=(body.hook or "").strip(),
        angle=(body.angle or "").strip(),
        idea=(body.idea or "").strip(),
    )
    raw = await _chat_completion_text(client, None, prompt, max_tokens=256)
    tags = parse_json_string_array(raw, max_items=12)
    normalized = []
    seen: set[str] = set()
    for tag in tags:
        n = normalize_hashtag_tag(tag)
        if not n or len(n) > 80:
            continue
        key = n.lower()
        if key in seen:
            continue
        seen.add(key)
        normalized.append(n)
        if len(normalized) >= 10:
            break
    if len(normalized) < 10:
        raise HTTPException(status_code=502, detail="Could not generate 10 distinct hashtags.")
    return HashtagsResponse(hashtags=normalized[:10])


@router.post("/generate-full-script", response_model=FullScriptResponse)
async def generate_full_script(body: IdeaEnrichmentRequest):
    client = get_openai_client()
    title = (body.optimized_title or "").strip() or (body.hook or "").strip() or "Video idea"
    prompt = FULL_SCRIPT_PROMPT.format(
        niche=body.niche or "general",
        trend=body.trend,
        title=title,
        hook=(body.hook or "").strip(),
        angle=(body.angle or "").strip(),
        idea=(body.idea or "").strip(),
        script=(body.script or "").strip(),
    )
    raw = await _chat_completion_text(client, None, prompt, max_tokens=1024)
    script = raw.strip()
    if not script:
        raise HTTPException(status_code=502, detail="Empty script from model.")
    return FullScriptResponse(script=script)
