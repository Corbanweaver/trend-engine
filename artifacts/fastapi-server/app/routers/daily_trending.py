"""Aggregated cross-platform signals for the public trending dashboard."""
from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone
from urllib.parse import quote

from fastapi import APIRouter

from app.models import DailyPlatformSection, DailyTrendItem, DailyTrendingResponse
from app.google_news_client import google_news_search
from app.google_trends_client import google_trends_search
from app.hackernews_client import hn_top_stories
from app.multi_reddit_client import multi_reddit_ingest
from app.tiktok_client import tiktok_trending_search
from app.youtube_client import youtube_search

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/trending", tags=["trending"])


async def _safe(coro, default, timeout: float = 14.0):
    try:
        return await asyncio.wait_for(coro, timeout=timeout)
    except Exception as e:
        logger.warning("daily_trending fetch failed: %s", e)
        return default


def _items_from_google_trends(data: object) -> list[DailyTrendItem]:
    if not isinstance(data, dict):
        return []
    items: list[DailyTrendItem] = []
    seen: set[str] = set()

    for t in (data.get("trending_searches") or [])[:12]:
        title = str(t).strip()
        if not title or title.lower() in seen:
            continue
        seen.add(title.lower())
        q = quote(title)
        items.append(
            DailyTrendItem(
                title=title,
                subtitle="Trending search — United States",
                url=f"https://www.google.com/search?q={q}",
                meta="Live index",
            )
        )

    for rq in (data.get("related_queries") or [])[:10]:
        if not isinstance(rq, dict):
            continue
        title = str(rq.get("query", "")).strip()
        if not title or title.lower() in seen:
            continue
        seen.add(title.lower())
        q = quote(title)
        val = rq.get("value", "")
        meta = f"+{val}% breakout" if val else "Related query"
        items.append(
            DailyTrendItem(
                title=title,
                subtitle="Related query",
                url=f"https://www.google.com/search?q={q}",
                meta=meta,
            )
        )

    return items[:14]


def _items_from_news(rows: object) -> list[DailyTrendItem]:
    if not isinstance(rows, list):
        return []
    out: list[DailyTrendItem] = []
    for row in rows[:12]:
        if not isinstance(row, dict):
            continue
        title = str(row.get("title", "")).strip()
        if not title:
            continue
        src = str(row.get("source", "") or "").strip()
        out.append(
            DailyTrendItem(
                title=title,
                subtitle=src or "News",
                url=str(row.get("link", "") or ""),
                meta="Google News",
            )
        )
    return out


def _items_from_youtube(rows: object) -> list[DailyTrendItem]:
    if not isinstance(rows, list):
        return []
    out: list[DailyTrendItem] = []
    for row in rows[:8]:
        if not isinstance(row, dict):
            continue
        title = str(row.get("title", "")).strip()
        if not title:
            continue
        ch = str(row.get("channel", "") or "").strip()
        out.append(
            DailyTrendItem(
                title=title,
                subtitle=ch or "YouTube Shorts",
                url=str(row.get("url", "") or ""),
                meta="Short-form",
            )
        )
    return out


def _items_from_tiktok(rows: object) -> list[DailyTrendItem]:
    if not isinstance(rows, list):
        return []
    out: list[DailyTrendItem] = []
    for row in rows[:8]:
        if not isinstance(row, dict):
            continue
        desc = str(row.get("description", "")).strip()
        author = str(row.get("author", "") or row.get("author_nickname", "") or "").strip()
        title = desc[:120] if desc else (author or "TikTok clip")
        plays = row.get("play_count") or 0
        meta = "TikTok"
        try:
            if int(plays) > 0:
                meta = f"{int(plays):,} views · TikTok"
        except (TypeError, ValueError):
            pass
        out.append(
            DailyTrendItem(
                title=title,
                subtitle=f"@{author}" if author else "Discover",
                url=str(row.get("url", "") or ""),
                meta=meta,
            )
        )
    return out


def _items_from_reddit(rows: object) -> list[DailyTrendItem]:
    if not isinstance(rows, list):
        return []
    out: list[DailyTrendItem] = []
    for row in rows[:10]:
        if not isinstance(row, dict):
            continue
        title = str(row.get("title", "")).strip()
        if not title:
            continue
        sub = str(row.get("subreddit", "") or "").strip()
        score = row.get("score", 0)
        try:
            sc = int(score)
        except (TypeError, ValueError):
            sc = 0
        out.append(
            DailyTrendItem(
                title=title,
                subtitle=f"r/{sub}" if sub else "Reddit",
                url=str(row.get("url", "") or ""),
                meta=f"{sc:,} pts" if sc else "Reddit",
            )
        )
    return out


def _items_from_hn(rows: object) -> list[DailyTrendItem]:
    if not isinstance(rows, list):
        return []
    out: list[DailyTrendItem] = []
    for row in rows[:10]:
        if not isinstance(row, dict):
            continue
        title = str(row.get("title", "")).strip()
        if not title:
            continue
        url = str(row.get("url", "") or "").strip()
        if not url:
            url = str(row.get("hn_link", "") or "")
        score = row.get("score", 0)
        try:
            sc = int(score)
        except (TypeError, ValueError):
            sc = 0
        cm = row.get("comments", 0)
        try:
            ccount = int(cm)
        except (TypeError, ValueError):
            ccount = 0
        meta = f"{sc} pts · {ccount} comments"
        out.append(
            DailyTrendItem(
                title=title,
                subtitle="Hacker News",
                url=url,
                meta=meta,
            )
        )
    return out


@router.get("/daily", response_model=DailyTrendingResponse)
async def get_daily_trending():
    """Cross-platform snapshot for the live trending page (no AI — raw signals)."""
    loop_ts = datetime.now(timezone.utc).isoformat()

    coros = [
        _safe(google_trends_search("viral trends"), {}),
        _safe(google_news_search("top stories United States today", max_results=14), []),
        _safe(youtube_search("viral shorts trending today", max_results=8, days_back=3), []),
        _safe(tiktok_trending_search("viral trend", max_results=8, days_back=3), []),
        _safe(multi_reddit_ingest("global viral pulse", max_per_sub=5, days_back=3), []),
        _safe(hn_top_stories(max_results=10), []),
    ]

    results = await asyncio.gather(*coros)
    gdata, news, yt, tt, reddit, hn = results

    sections = [
        DailyPlatformSection(
            key="google_trends",
            label="Google Trends",
            items=_items_from_google_trends(gdata),
        ),
        DailyPlatformSection(
            key="news",
            label="Breaking & News",
            items=_items_from_news(news),
        ),
        DailyPlatformSection(
            key="youtube",
            label="YouTube Shorts",
            items=_items_from_youtube(yt),
        ),
        DailyPlatformSection(
            key="tiktok",
            label="TikTok",
            items=_items_from_tiktok(tt),
        ),
        DailyPlatformSection(
            key="reddit",
            label="Reddit",
            items=_items_from_reddit(reddit),
        ),
        DailyPlatformSection(
            key="hackernews",
            label="Hacker News",
            items=_items_from_hn(hn),
        ),
    ]

    return DailyTrendingResponse(updated_at=loop_ts, sections=sections)
