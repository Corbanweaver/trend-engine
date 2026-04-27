import os
import json
import asyncio
import logging
try:
    import replicate
except ModuleNotFoundError:
    replicate = None  # type: ignore[assignment]

logger = logging.getLogger(__name__)
_ai_semaphore = asyncio.Semaphore(3)

from fastapi import APIRouter, HTTPException
from openai import OpenAI

from app.models import TrendIdeasRequest, TrendIdeasResponse, TrendIdea, VideoIdea
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

router = APIRouter(prefix="/trend-ideas", tags=["trend-ideas"])
REPLICATE_MODEL = "black-forest-labs/flux-schnell"

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


def get_openai_client() -> OpenAI:
    base_url = os.environ.get("AI_INTEGRATIONS_OPENAI_BASE_URL")
    api_key = os.environ.get("AI_INTEGRATIONS_OPENAI_API_KEY", "placeholder")
    if not base_url:
        raise HTTPException(status_code=503, detail="OpenAI integration not configured.")
    return OpenAI(base_url=base_url, api_key=api_key)


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


def _extract_replicate_output_url(output) -> str:
    if isinstance(output, str):
        return output
    if isinstance(output, list) and output:
        first = output[0]
        return str(first) if first else ""
    return ""


async def generate_idea_thumbnail(niche: str, topic: str, idea: VideoIdea) -> str:
    if replicate is None:
        logger.warning("Replicate package not installed; skipping thumbnail generation.")
        return ""

    token = os.environ.get("REPLICATE_API_TOKEN", "").strip()
    logger.info("Replicate token found: %s", "yes" if bool(token) else "no")
    if not token:
        logger.warning("Skipping Replicate thumbnail generation because REPLICATE_API_TOKEN is missing.")
        return ""

    title = (idea.optimized_title or "").strip() or (idea.hook or "").strip() or "viral short-form video"
    concept = (idea.idea or "").strip()
    prompt = (
        f"Cinematic social media thumbnail for a short-form video. "
        f"Niche: {niche}. Topic: {topic}. Title: {title}. Concept: {concept}. "
        "Bold composition, high contrast lighting, modern creator aesthetic, vibrant colors, clean background, no text, no watermark."
    )
    try:
        def _run_replicate() -> str:
            os.environ["REPLICATE_API_TOKEN"] = token
            output = replicate.run(
                REPLICATE_MODEL,
                input={
                    "prompt": prompt,
                    "aspect_ratio": "16:9",
                    "output_format": "jpg",
                    "output_quality": 85,
                },
            )
            return _extract_replicate_output_url(output)

        loop = asyncio.get_event_loop()
        url = await loop.run_in_executor(None, _run_replicate)
        logger.info("Replicate thumbnail generated successfully for topic '%s': %s", topic, bool(url))
        return url
    except Exception as e:
        logger.exception("Replicate thumbnail generation failed with exception: %s", e)

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
        _safe_fetch(multi_reddit_ingest(niche, max_per_sub=5), []),
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
    print(f"STARTING MEDIA GATHER FOR: {topic}")
    print(f"Calling Instagram search for niche: {instagram_query}")
    coros = [
        _safe_fetch(youtube_search(search_query, max_results=4), []),
        _safe_fetch(search_instagram(instagram_query, max_results=4), []),
        _safe_fetch(tiktok_trending_search(search_query, max_results=3), []),
        _safe_fetch(google_news_search(search_query, max_results=4), []),
        _safe_fetch(hn_search(search_query, max_results=3), []),
        _safe_fetch(web_search(f"{search_query} trending", max_results=4), []),
        _safe_fetch(pinterest_search(search_query, max_results=4), []),
        _safe_fetch(medium_search(search_query, max_results=4), []),
    ]
    youtube, instagram_results, tiktok, news, hn, web, pins, articles = await asyncio.gather(*coros)
    print(f"INSTAGRAM RESULTS: {len(instagram_results)} items")
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

    news = topic_media.get("google_news", [])
    if news:
        parts.append("Topic news:\n" + "\n".join(f"- {a['title']}" for a in news[:4]))

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
        thumbnail_coros = [generate_idea_thumbnail(niche, topic, idea) for idea in ideas]
        thumbnail_results = await asyncio.gather(*thumbnail_coros, return_exceptions=True)
        for idx, result in enumerate(thumbnail_results):
            if isinstance(result, str):
                ideas[idx].thumbnail_url = result
            elif isinstance(result, Exception):
                logger.warning("Thumbnail generation error for topic '%s': %s", topic, result)
        generated_count = sum(1 for idea in ideas if (idea.thumbnail_url or "").strip())
        logger.info(
            "Replicate thumbnails generated for topic '%s': %s/%s",
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
