import os
import json
import asyncio
import logging

logger = logging.getLogger(__name__)
_ai_semaphore = asyncio.Semaphore(3)
_image_semaphore = asyncio.Semaphore(2)

from fastapi import APIRouter, Depends, HTTPException, Header
from openai import OpenAI
from app.security import expensive_endpoint_rate_limit, require_digest_key
from app.openai_client import get_openai_client, get_openai_image_client

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
from app.hackernews_client import hn_search
from app.web_search_client import web_search
from app.multi_reddit_client import multi_reddit_ingest
from app.pinterest_client import pinterest_search
from app.medium_client import medium_search

router = APIRouter(
    prefix="/trend-ideas",
    tags=["trend-ideas"],
    dependencies=[Depends(expensive_endpoint_rate_limit("trend-ideas"))],
)
RECENCY_DAYS = 7
OPENAI_IMAGE_MODEL = os.environ.get("OPENAI_IMAGE_MODEL", "gpt-image-1")
OPENAI_IMAGE_SIZE = os.environ.get("OPENAI_IMAGE_SIZE", "1536x1024")
OPENAI_IMAGE_QUALITY = os.environ.get("OPENAI_IMAGE_QUALITY", "low")
OPENAI_IDEA_IMAGE_FORMAT = os.environ.get("OPENAI_IDEA_IMAGE_FORMAT", "webp")


def int_env(name: str, default: int, minimum: int, maximum: int) -> int:
    try:
        value = int(os.environ.get(name, str(default)))
    except ValueError:
        return default
    return max(minimum, min(maximum, value))


OPENAI_IDEA_IMAGE_COMPRESSION = int_env("OPENAI_IDEA_IMAGE_COMPRESSION", 70, 0, 100)
OPENAI_IDEA_IMAGES_PER_TOPIC = int_env("OPENAI_IDEA_IMAGES_PER_TOPIC", 3, 0, 3)

SYSTEM_PROMPT = """You are a world-class short-form content creator and strategist known for making ideas feel human, bold, and impossible to scroll past.

Given a trending topic, a niche, and real-time data from multiple sources, generate exactly 3 viral short-form video ideas.

Voice and quality bar:
- Write like a top creator talking to a real audience, not like an AI assistant.
- Tone should be exciting, inspiring, and conversational.
- Avoid robotic phrasing, corporate buzzwords, and generic filler.
- Every output should feel specific, current, and immediately filmable.

Rules for EVERY idea:
- HOOK: Create a punchy first line that grabs attention in under 2 seconds. Use curiosity, stakes, contrast, or a bold claim.
- OPTIMIZED_TITLE: Make it sound natural and conversational, like a creator headline someone would actually click. Keep it under 60 characters.
- ANGLE: Provide a clear, actionable content angle with a strong point of view (surprising, contrarian, or overlooked).
- IDEA: Give a concrete concept and format (POV, list, story, reaction, experiment, tutorial, etc.) with enough detail to execute right away.
- SCRIPT: Write a complete 30-60 second script in first person with:
  1) strong hook opening line,
  2) 3-4 concise talking beats,
  3) an engaging call-to-action.
  Keep the pacing tight and natural, as if spoken on camera.
- HASHTAGS: Include 5-8 hashtags optimized for TikTok/Instagram/YouTube Shorts. Mix broad trending tags with niche tags.
- SEO_DESCRIPTION: Write a compelling 1-2 sentence description that is search-friendly without sounding spammy.
- Ground each idea in the provided real-time context and trends. Reference timely themes where relevant.

Return your response as a JSON array with exactly 3 objects, each having "hook", "angle", "idea", "script", "hashtags" (array of strings), "optimized_title", and "seo_description" keys.
Return ONLY the JSON array, no markdown, no commentary, and no extra text."""

TOPIC_DISCOVERY_PROMPT = """You are a trend analyst. Given the following real-time data about the "{niche}" niche, identify the TOP 3 most viral-worthy trending topics right now.

For each topic, return a short 2-5 word topic name that a content creator could make a video about.

Return ONLY a JSON array of 3 strings. Example: ["topic one", "topic two", "topic three"]

Real-time data:
{context}"""

HOOK_VARIATIONS_PROMPT = """You are a viral short-form video strategist. Given the niche, trending topic, and video concept below, write exactly 5 distinct opening hooks for the same idea.

Rules:
- Each hook must be one or two punchy sentences that stop the scroll (under 160 characters each).
- Use different angles: curiosity, controversy, story, pattern-interrupt, social proof, or urgency — do not repeat the same structure.
- Sound like a real creator, not marketing copy.
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
- Total length 60-90 seconds when read aloud at a natural pace (about 150-240 words).
- First person, conversational, strong hook in the first line.
- Include: hook, 3-5 clear beats (each beat can be a short paragraph or labeled section), pattern refreshes, and a memorable call-to-action.
- Match the niche voice and the specific angle.
- Use optional brief stage directions in [brackets] only where helpful — not for every line.
- Do not use markdown headings; plain text with line breaks is fine.

Niche: {niche}
Trending topic: {trend}
Title: {title}
Hook (starting point): {hook}
Angle: {angle}
Concept: {idea}
Existing short script (may extend or replace as needed for length): {script}"""


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
                    hook=item.get("hook", ""),
                    angle=item.get("angle", ""),
                    idea=item.get("idea", ""),
                    script=item.get("script", ""),
                    hashtags=item.get("hashtags", []),
                    optimized_title=item.get("optimized_title", ""),
                    seo_description=item.get("seo_description", ""),
                    thumbnail_url=item.get("thumbnail_url", ""),
                )
                for item in data[:3]
            ]
    except json.JSONDecodeError:
        pass
    return [VideoIdea(hook=cleaned[:100], angle="", idea=cleaned, script="")]


def build_thumbnail_prompt(niche: str, topic: str, idea: VideoIdea) -> str:
    title = (idea.optimized_title or "").strip() or (idea.hook or "").strip() or "viral short-form video"
    concept = (idea.idea or "").strip()
    angle = (idea.angle or "").strip()
    visual_subject = " ".join(
        part.strip()
        for part in [niche, topic, title, concept, angle]
        if part and part.strip()
    )[:420]
    return (
        "Create a polished vertical-social idea card image for a content creator.\n"
        f"Niche: {niche}\n"
        f"Trend: {topic}\n"
        f"Idea: {visual_subject}\n\n"
        "Visual direction: premium editorial thumbnail, cinematic lighting, vivid but tasteful colors, "
        "clear focal subject, high contrast, realistic detail, modern creator economy aesthetic. "
        "No text, no captions, no logos, no watermarks, no UI mockups, no letterforms."
    )


async def generate_idea_thumbnail(client: OpenAI, niche: str, topic: str, idea: VideoIdea) -> str:
    prompt = build_thumbnail_prompt(niche, topic, idea)
    try:
        async with _image_semaphore:
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: client.images.generate(
                    model=OPENAI_IMAGE_MODEL,
                    prompt=prompt,
                    n=1,
                    size=OPENAI_IMAGE_SIZE,
                    quality=OPENAI_IMAGE_QUALITY,
                    output_format=OPENAI_IDEA_IMAGE_FORMAT,
                    output_compression=OPENAI_IDEA_IMAGE_COMPRESSION,
                ),
            )
        image_data = response.data[0].b64_json
        if not image_data:
            logger.warning("OpenAI image generation returned no image data for topic '%s'.", topic)
            return ""
        logger.info("OpenAI idea-card image generated for topic '%s'.", topic)
        return f"data:image/{OPENAI_IDEA_IMAGE_FORMAT};base64,{image_data}"
    except Exception as e:
        logger.warning("OpenAI idea-card image generation failed for topic '%s': %s", topic, e)

    return ""


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


async def discover_trends(niche: str) -> tuple[list[str], dict]:
    coros = [
        _safe_fetch(google_news_search(niche, max_results=8), []),
        _safe_fetch(google_trends_search(niche), {}, timeout=15.0),
        _safe_fetch(web_search(f"{niche} trending viral 2026", max_results=8), []),
        _safe_fetch(multi_reddit_ingest(niche, max_per_sub=5, days_back=RECENCY_DAYS), []),
    ]
    news, trends_data, web_results, reddit_posts = await asyncio.gather(*coros)

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

    raw_sources = {
        "google_news": news,
        "google_trends": trends_data,
        "web_search": web_results,
        "reddit_multi": reddit_posts,
    }

    return context_parts, raw_sources


async def gather_topic_media(niche: str, topic: str) -> dict:
    search_query = f"{niche} {topic}"
    instagram_query = niche.strip()
    logger.info("Starting media gather for topic '%s'", topic)
    logger.info("Calling Instagram search for niche '%s'", instagram_query)
    coros = [
        _safe_fetch(youtube_search(search_query, max_results=4, days_back=RECENCY_DAYS), []),
        _safe_fetch(search_instagram(instagram_query, max_results=4), []),
        _safe_fetch(tiktok_trending_search(search_query, max_results=3, days_back=RECENCY_DAYS), []),
        _safe_fetch(google_news_search(search_query, max_results=4), []),
        _safe_fetch(hn_search(search_query, max_results=3), []),
        _safe_fetch(web_search(f"{search_query} trending", max_results=4), []),
        _safe_fetch(pinterest_search(search_query, max_results=4), []),
        _safe_fetch(medium_search(search_query, max_results=4), []),
    ]
    youtube, instagram_results, tiktok, news, hn, web, pins, articles = await asyncio.gather(*coros)
    logger.info("Instagram results for topic '%s': %s items", topic, len(instagram_results))
    youtube_tagged = [{**item, "platform": "youtube"} for item in youtube if isinstance(item, dict)]
    instagram_tagged = [{**item, "platform": "instagram"} for item in instagram_results if isinstance(item, dict)]
    tiktok_tagged = [{**item, "platform": "tiktok"} for item in tiktok if isinstance(item, dict)]
    return {
        "youtube": youtube_tagged,
        "instagram": instagram_tagged,
        "tiktok": tiktok_tagged,
        "google_news": news,
        "hackernews": hn,
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
        parts.append("Popular TikTok videos:\n" + "\n".join(f"- {v.get('title', '')}" for v in tt[:3]))

    news = topic_media.get("google_news", [])
    if news:
        parts.append("Topic news:\n" + "\n".join(f"- {a['title']}" for a in news[:4]))

    hn = topic_media.get("hackernews", [])
    if hn:
        parts.append("Hacker News stories:\n" + "\n".join(f"- {s.get('title', '')}" for s in hn[:3]))

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
                    max_completion_tokens=2048,
                    messages=[
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": context},
                    ],
                ),
            )
        raw = response.choices[0].message.content or ""
        ideas = parse_ideas_json(raw)
        thumbnail_ideas = ideas[:OPENAI_IDEA_IMAGES_PER_TOPIC]
        thumbnail_results = []
        if thumbnail_ideas:
            image_client = get_openai_image_client()
            thumbnail_coros = [
                generate_idea_thumbnail(image_client, niche, topic, idea)
                for idea in thumbnail_ideas
            ]
            thumbnail_results = await asyncio.gather(*thumbnail_coros, return_exceptions=True)
        for idx, result in enumerate(thumbnail_results):
            if isinstance(result, str):
                ideas[idx].thumbnail_url = result
            elif isinstance(result, Exception):
                logger.warning("Thumbnail generation error for topic '%s': %s", topic, result)
        generated_count = sum(1 for idea in ideas if (idea.thumbnail_url or "").strip())
        logger.info(
            "OpenAI idea-card images generated for topic '%s': %s/%s",
            topic,
            generated_count,
            len(ideas),
        )

        return TrendIdea(
            trend=topic,
            ideas=ideas,
            example_videos=media.get("youtube", [])[:4],
            instagram_posts=media.get("instagram", [])[:4],
            tiktok_videos=media.get("tiktok", [])[:3],
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
    raw = await _chat_completion_text(client, None, prompt, max_tokens=512)
    hooks = parse_json_string_array(raw, max_items=8, exact=5)
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
    raw = await _chat_completion_text(client, None, prompt, max_tokens=384)
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
    raw = await _chat_completion_text(client, None, prompt, max_tokens=2048)
    script = raw.strip()
    if not script:
        raise HTTPException(status_code=502, detail="Empty script from model.")
    return FullScriptResponse(script=script)
