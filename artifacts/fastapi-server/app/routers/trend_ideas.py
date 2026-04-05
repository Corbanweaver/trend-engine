import os
import json
import asyncio
import logging

logger = logging.getLogger(__name__)
_ai_semaphore = asyncio.Semaphore(3)
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text as sql_text
from openai import OpenAI

from app.database import get_db
from app.models import TrendIdeasRequest, TrendIdeasResponse, TrendIdea, VideoIdea
from app.routers.trends import extract_topics
from app.youtube_client import youtube_search
from app.instagram_client import search_instagram
from app.tiktok_client import tiktok_trending_search
from app.google_news_client import google_news_search
from app.google_trends_client import google_trends_search
from app.hackernews_client import hn_search
from app.web_search_client import web_search
from app.multi_reddit_client import multi_reddit_ingest

router = APIRouter(prefix="/trend-ideas", tags=["trend-ideas"])

SYSTEM_PROMPT = """You are an elite viral content strategist who has generated millions of views on TikTok, Instagram Reels, and YouTube Shorts.

Given a trending topic, a niche, and real-time data from multiple sources (Reddit, Google Trends, Google News, Hacker News, web articles), generate exactly 3 viral short-form video ideas.

Rules for EVERY idea:
- The HOOK must stop the scroll in under 2 seconds. Use curiosity gaps, bold claims, or pattern interrupts. Never start generic.
- The ANGLE must be contrarian, surprising, or counterintuitive. Challenge common beliefs. Avoid generic advice.
- The IDEA should be specific enough to film immediately — include the format (POV, listicle, story, reaction, experiment, etc.)
- The SCRIPT should be a complete 30-60 second video script with the hook opening line, 3-4 talking points, and a call-to-action. Write it in first person as if the creator is speaking to camera. Keep it punchy and conversational.
- Use the real data provided to make ideas timely and specific. Reference actual trends, news, or discussions when possible.

Return your response as a JSON array with exactly 3 objects, each having "hook", "angle", "idea", and "script" keys. Return ONLY the JSON array, no other text."""


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
                )
                for item in data[:3]
            ]
    except json.JSONDecodeError:
        pass
    return [VideoIdea(hook=cleaned[:100], angle="", idea=cleaned, script="")]


async def _safe_fetch(coro, default, timeout=10.0):
    try:
        return await asyncio.wait_for(coro, timeout=timeout)
    except Exception as e:
        logger.warning("Source fetch failed: %s", e)
        return default


async def gather_source_data(niche: str, topic: str) -> dict:
    search_query = f"{niche} {topic}"
    hashtag_query = f"{niche}{topic.replace(' ', '')}"

    keys = ["youtube", "instagram", "tiktok", "google_news", "google_trends", "hackernews", "web_search", "reddit_multi"]

    coros = [
        _safe_fetch(youtube_search(search_query, max_results=3), []),
        _safe_fetch(search_instagram(hashtag_query, max_results=3), []),
        _safe_fetch(tiktok_trending_search(search_query, max_results=3), []),
        _safe_fetch(google_news_search(search_query, max_results=5), []),
        _safe_fetch(google_trends_search(topic), {}, timeout=15.0),
        _safe_fetch(hn_search(search_query, max_results=5), []),
        _safe_fetch(web_search(f"{search_query} trending viral", max_results=5), []),
        _safe_fetch(multi_reddit_ingest(niche, max_per_sub=5), []),
    ]

    values = await asyncio.gather(*coros)
    return dict(zip(keys, values))


def build_context_prompt(niche: str, topic: str, sources: dict) -> str:
    parts = [f"Niche: {niche}\nTrending topic: {topic}\n"]

    news = sources.get("google_news", [])
    if news:
        headlines = [f"- {a['title']} ({a.get('source', '')})" for a in news[:5]]
        parts.append(f"Recent news:\n" + "\n".join(headlines))

    trends = sources.get("google_trends", {})
    related = trends.get("related_queries", [])
    if related:
        queries = [f"- {q['query']}" for q in related[:8]]
        parts.append(f"Google Trends related searches:\n" + "\n".join(queries))

    trending = trends.get("trending_searches", [])
    if trending:
        parts.append(f"Currently trending on Google: {', '.join(trending[:5])}")

    hn = sources.get("hackernews", [])
    if hn:
        titles = [f"- {s['title']} ({s['score']} pts)" for s in hn[:5]]
        parts.append(f"Hacker News discussions:\n" + "\n".join(titles))

    web = sources.get("web_search", [])
    if web:
        articles = [f"- {r['title']}: {r['snippet'][:80]}" for r in web[:5]]
        parts.append(f"Web articles:\n" + "\n".join(articles))

    reddit = sources.get("reddit_multi", [])
    relevant = [p for p in reddit if topic.lower() in p.get("title", "").lower()][:5]
    if not relevant:
        relevant = reddit[:5]
    if relevant:
        posts = [f"- r/{p['subreddit']}: {p['title']} ({p['score']} upvotes)" for p in relevant]
        parts.append(f"Reddit discussions:\n" + "\n".join(posts))

    return "\n\n".join(parts)


async def _process_trend(client, niche: str, trend_topic: str) -> TrendIdea:
    try:
        sources = await gather_source_data(niche, trend_topic)
        context = build_context_prompt(niche, trend_topic, sources)

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

        return TrendIdea(
            trend=trend_topic,
            ideas=ideas,
            example_videos=sources.get("youtube", []),
            instagram_posts=sources.get("instagram", []),
            tiktok_videos=sources.get("tiktok", []),
            google_news=sources.get("google_news", [])[:5],
            google_trends_data=sources.get("google_trends", {}),
            hackernews_stories=sources.get("hackernews", [])[:5],
            web_results=sources.get("web_search", [])[:5],
            reddit_posts=sources.get("reddit_multi", [])[:10],
        )
    except Exception as e:
        logger.error("Failed to process trend '%s': %s", trend_topic, e)
        return TrendIdea(
            trend=trend_topic,
            ideas=[VideoIdea(hook="Analysis unavailable", angle="", idea=f"Could not generate ideas for this trend: {e}", script="")],
            example_videos=[],
            instagram_posts=[],
            tiktok_videos=[],
        )


@router.post("/", response_model=TrendIdeasResponse)
async def get_trend_ideas(body: TrendIdeasRequest = TrendIdeasRequest(), db: Session = Depends(get_db)):
    rows = db.execute(
        sql_text("SELECT title, engagement FROM reddit_posts WHERE title != '' ORDER BY created_at DESC LIMIT 200")
    ).fetchall()

    texts = [(row[0], row[1]) for row in rows]
    trends = extract_topics(texts)

    if not trends:
        raise HTTPException(status_code=404, detail="No trends found. Try ingesting posts first.")

    client = get_openai_client()
    niche = body.niche or "fitness"

    trend_coros = [_process_trend(client, niche, t.topic) for t in trends]
    result = await asyncio.gather(*trend_coros)

    return TrendIdeasResponse(niche=niche, trend_ideas=list(result))
