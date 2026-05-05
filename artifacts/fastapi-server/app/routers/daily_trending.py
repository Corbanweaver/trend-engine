"""Aggregated cross-platform signals for the public trending dashboard."""
from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone
from urllib.parse import quote

from fastapi import APIRouter, Depends

from app.models import (
    DailyPlatformSection,
    DailyTrendItem,
    DailyTrendingResponse,
    TrendSignalRefreshRequest,
    TrendSignalRefreshResponse,
)
from app.google_news_client import google_news_search
from app.google_trends_client import google_trends_search
from app.security import require_operational_key
from app.social_signal_fetcher import fetch_platform_signals, refresh_social_cache

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/trending", tags=["trending"])
ALLOWED_REFRESH_PLATFORMS = {"youtube", "tiktok", "instagram", "pinterest", "x", "reddit"}


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


def _items_from_instagram(rows: object) -> list[DailyTrendItem]:
    if not isinstance(rows, list):
        return []
    out: list[DailyTrendItem] = []
    for row in rows[:8]:
        if not isinstance(row, dict):
            continue
        caption = str(row.get("caption", "") or row.get("title", "") or "").strip()
        if not caption:
            caption = "Instagram/Reels result"
        meta = "Instagram"
        likes = row.get("like_count") or row.get("likes") or 0
        try:
            if int(likes) > 0:
                meta = f"{int(likes):,} likes"
        except (TypeError, ValueError):
            pass
        out.append(
            DailyTrendItem(
                title=caption[:120],
                subtitle="Instagram/Reels",
                url=str(row.get("permalink", "") or row.get("url", "") or row.get("link", "") or ""),
                meta=meta,
            )
        )
    return out


def _items_from_pinterest(rows: object) -> list[DailyTrendItem]:
    if not isinstance(rows, list):
        return []
    out: list[DailyTrendItem] = []
    for row in rows[:8]:
        if not isinstance(row, dict):
            continue
        title = str(row.get("title", "") or "").strip()
        if not title:
            title = "Pinterest pin"
        board = str(row.get("board_name", "") or "").strip()
        out.append(
            DailyTrendItem(
                title=title,
                subtitle=board or "Pinterest",
                url=str(row.get("link", "") or row.get("url", "") or ""),
                meta="Visual search",
            )
        )
    return out


def _items_from_x(rows: object) -> list[DailyTrendItem]:
    if not isinstance(rows, list):
        return []
    out: list[DailyTrendItem] = []
    for row in rows[:8]:
        if not isinstance(row, dict):
            continue
        title = str(row.get("title", "") or row.get("snippet", "") or "").strip()
        if not title:
            title = "X post"
        out.append(
            DailyTrendItem(
                title=title[:120],
                subtitle=str(row.get("author", "") or "X"),
                url=str(row.get("url", "") or ""),
                meta="Live conversation",
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

@router.get("/daily", response_model=DailyTrendingResponse)
async def get_daily_trending():
    """Cross-platform snapshot for the live trending page (raw signals only)."""
    loop_ts = datetime.now(timezone.utc).isoformat()

    coros = [
        _safe(google_trends_search("viral trends"), {}),
        _safe(google_news_search("top stories United States today", max_results=14), []),
        _safe(fetch_platform_signals("youtube", "viral trends", max_results=8, days_back=3), []),
        _safe(fetch_platform_signals("tiktok", "viral trends", max_results=8, days_back=3), []),
        _safe(fetch_platform_signals("instagram", "viral trends", max_results=8, days_back=3), []),
        _safe(fetch_platform_signals("pinterest", "viral trends", max_results=8, days_back=3), []),
        _safe(fetch_platform_signals("x", "viral trends", max_results=8, days_back=3), []),
        _safe(fetch_platform_signals("reddit", "global viral pulse", max_results=8, days_back=3), []),
    ]

    results = await asyncio.gather(*coros)
    gdata, news, yt, tt, instagram, pinterest, x_posts, reddit = results

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
            key="instagram",
            label="Instagram Reels",
            items=_items_from_instagram(instagram),
        ),
        DailyPlatformSection(
            key="pinterest",
            label="Pinterest",
            items=_items_from_pinterest(pinterest),
        ),
        DailyPlatformSection(
            key="x",
            label="X",
            items=_items_from_x(x_posts),
        ),
        DailyPlatformSection(
            key="reddit",
            label="Reddit",
            items=_items_from_reddit(reddit),
        ),
    ]

    return DailyTrendingResponse(updated_at=loop_ts, sections=sections)


@router.post(
    "/refresh-cache",
    response_model=TrendSignalRefreshResponse,
    dependencies=[Depends(require_operational_key)],
)
async def refresh_trending_cache(body: TrendSignalRefreshRequest):
    platforms = [
        platform.strip().lower()
        for platform in body.platforms
        if platform.strip().lower() in ALLOWED_REFRESH_PLATFORMS
    ]
    skipped = [
        platform.strip().lower()
        for platform in body.platforms
        if platform.strip().lower() not in ALLOWED_REFRESH_PLATFORMS
    ]
    cached = await refresh_social_cache(
        [niche for niche in body.niches if niche.strip()],
        platforms,
        max_results=body.max_results,
        days_back=7,
    )
    return TrendSignalRefreshResponse(
        updated_at=datetime.now(timezone.utc).isoformat(),
        cached=cached,
        skipped_platforms=skipped,
    )
