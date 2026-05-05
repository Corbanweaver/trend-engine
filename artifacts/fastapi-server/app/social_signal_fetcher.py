from __future__ import annotations

import asyncio
import logging
import os
from collections.abc import Awaitable, Callable

from app.instagram_client import search_instagram
from app.multi_reddit_client import multi_reddit_ingest
from app.pinterest_client import pinterest_search
from app.social_signal_store import cache_items, cached_items
from app.tiktok_client import tiktok_trending_search
from app.youtube_client import youtube_search
from app.x_client import search_x

logger = logging.getLogger(__name__)

FetchFactory = Callable[[], Awaitable[list[dict]]]


def cache_ttl_minutes() -> int:
    raw = os.environ.get("TREND_SIGNAL_CACHE_TTL_MINUTES", "").strip()
    if raw:
        try:
            return max(int(raw), 1)
        except ValueError:
            pass
    return 45


async def cached_or_fetch(
    platform: str,
    niche: str,
    query: str,
    *,
    max_results: int,
    fetch: FetchFactory,
    source: str,
    force_refresh: bool = False,
    min_cached: int = 1,
) -> list[dict]:
    cached: list[dict] = []
    if not force_refresh:
        cached = cached_items(
            platform,
            niche,
            query,
            max_results=max_results,
            max_age_minutes=cache_ttl_minutes(),
        )
        if len(cached) >= min(min_cached, max_results):
            return cached[:max_results]

    try:
        live_rows = await fetch()
    except Exception as exc:
        logger.warning("Live %s fetch failed for '%s': %s", platform, query, exc)
        return cached[:max_results]

    rows = [row for row in live_rows[:max_results] if isinstance(row, dict)]
    if rows:
        cache_items(platform, niche, query, rows, source=source)
        return rows
    return cached[:max_results]


def platform_query(platform: str, niche: str) -> str:
    cleaned = niche.strip() or "viral trends"
    if platform == "youtube":
        return f"{cleaned} viral shorts"
    if platform == "tiktok":
        return f"{cleaned} viral"
    if platform == "instagram":
        return f"{cleaned} reels"
    if platform == "pinterest":
        return f"{cleaned} ideas"
    if platform == "x":
        return f"{cleaned} viral"
    if platform == "reddit":
        return cleaned
    return cleaned


async def fetch_platform_signals(
    platform: str,
    niche: str,
    *,
    max_results: int,
    days_back: int = 7,
    force_refresh: bool = False,
) -> list[dict]:
    query = platform_query(platform, niche)
    if platform == "youtube":
        return await cached_or_fetch(
            platform,
            niche,
            query,
            max_results=max_results,
            fetch=lambda: youtube_search(query, max_results=max_results, days_back=days_back),
            source="youtube-api",
            force_refresh=force_refresh,
        )
    if platform == "tiktok":
        return await cached_or_fetch(
            platform,
            niche,
            query,
            max_results=max_results,
            fetch=lambda: tiktok_trending_search(query, max_results=max_results, days_back=days_back),
            source="apify-tiktok",
            force_refresh=force_refresh,
        )
    if platform == "instagram":
        return await cached_or_fetch(
            platform,
            niche,
            query,
            max_results=max_results,
            fetch=lambda: search_instagram(query, max_results=max_results),
            source="apify-instagram",
            force_refresh=force_refresh,
        )
    if platform == "pinterest":
        return await cached_or_fetch(
            platform,
            niche,
            query,
            max_results=max_results,
            fetch=lambda: pinterest_search(query, max_results=max_results),
            source="apify-pinterest",
            force_refresh=force_refresh,
        )
    if platform == "x":
        return await cached_or_fetch(
            platform,
            niche,
            query,
            max_results=max_results,
            fetch=lambda: search_x(query, max_results=max_results),
            source="apify-x",
            force_refresh=force_refresh,
        )
    if platform == "reddit":
        return await cached_or_fetch(
            platform,
            niche,
            query,
            max_results=max_results,
            fetch=lambda: multi_reddit_ingest(query, max_per_sub=max_results, days_back=days_back),
            source="reddit-rss",
            force_refresh=force_refresh,
        )
    return []


async def refresh_social_cache(
    niches: list[str],
    platforms: list[str],
    *,
    max_results: int,
    days_back: int = 7,
) -> dict[str, int]:
    counts: dict[str, int] = {}

    async def run_one(niche: str, platform: str) -> None:
        rows = await fetch_platform_signals(
            platform,
            niche,
            max_results=max_results,
            days_back=days_back,
            force_refresh=True,
        )
        counts[f"{niche.strip().lower()}:{platform}"] = len(rows)

    tasks = [
        run_one(niche, platform)
        for niche in niches
        for platform in platforms
        if niche.strip() and platform.strip()
    ]
    if tasks:
        await asyncio.gather(*tasks)
    return counts
