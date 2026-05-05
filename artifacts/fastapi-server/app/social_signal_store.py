from __future__ import annotations

import hashlib
import json
import logging
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import text

from app.database import SessionLocal

logger = logging.getLogger(__name__)

SOCIAL_PLATFORMS = {"youtube", "tiktok", "instagram", "pinterest", "x", "reddit"}
DEFAULT_CACHE_TTL_MINUTES = 45


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def stable_signal_id(platform: str, niche: str, query: str, item: dict[str, Any]) -> str:
    identity = (
        item.get("url")
        or item.get("permalink")
        or item.get("link")
        or item.get("webVideoUrl")
        or item.get("id")
        or item.get("video_id")
        or item.get("pin_id")
        or item.get("title")
        or item.get("caption")
        or json.dumps(item, sort_keys=True, default=str)[:300]
    )
    raw = f"{platform}|{niche.strip().lower()}|{query.strip().lower()}|{identity}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:40]


def _to_int(value: object) -> int:
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return 0


def _first_str(item: dict[str, Any], keys: list[str]) -> str:
    for key in keys:
        value = item.get(key)
        if value is not None and value != "":
            return str(value)
    return ""


def _engagement(platform: str, item: dict[str, Any]) -> int:
    if platform == "youtube":
        return _to_int(item.get("view_count") or item.get("views"))
    if platform == "tiktok":
        return (
            _to_int(item.get("play_count") or item.get("views"))
            + _to_int(item.get("like_count") or item.get("likes")) * 2
            + _to_int(item.get("comment_count") or item.get("comments")) * 4
            + _to_int(item.get("share_count") or item.get("shares")) * 5
        )
    if platform == "instagram":
        return _to_int(item.get("like_count") or item.get("likes")) * 2 + _to_int(
            item.get("comments_count") or item.get("comment_count") or item.get("comments")
        ) * 4
    if platform == "x":
        return (
            _to_int(item.get("likes") or item.get("like_count"))
            + _to_int(item.get("retweets") or item.get("retweet_count")) * 3
            + _to_int(item.get("replies") or item.get("reply_count")) * 4
            + _to_int(item.get("views") or item.get("view_count"))
        )
    if platform == "reddit":
        return _to_int(item.get("score") or item.get("engagement"))
    return _to_int(item.get("engagement") or item.get("score"))


def normalize_signal(
    platform: str,
    niche: str,
    query: str,
    item: dict[str, Any],
    *,
    source: str,
) -> dict[str, Any]:
    if platform == "youtube":
        title = _first_str(item, ["title"])
        text_value = _first_str(item, ["description", "snippet"])
        url = _first_str(item, ["url", "link"])
        thumbnail = _first_str(item, ["thumbnail", "thumbnail_url"])
        author = _first_str(item, ["channel", "author"])
    elif platform == "tiktok":
        title = _first_str(item, ["title", "description", "text"])[:140]
        text_value = _first_str(item, ["description", "text"])
        url = _first_str(item, ["url", "webVideoUrl", "link"])
        thumbnail = _first_str(item, ["cover", "thumbnail", "thumbnail_url", "coverUrl"])
        author = _first_str(item, ["author", "author_nickname", "username"])
    elif platform == "instagram":
        title = _first_str(item, ["title", "caption", "description"])[:140]
        text_value = _first_str(item, ["caption", "description", "text"])
        url = _first_str(item, ["permalink", "url", "link"])
        thumbnail = _first_str(item, ["thumbnail_url", "media_url", "image_url"])
        author = _first_str(item, ["ownerUsername", "owner_username", "username", "author"])
    elif platform == "pinterest":
        title = _first_str(item, ["title", "description"]) or "Pinterest pin"
        text_value = _first_str(item, ["description", "title"])
        url = _first_str(item, ["link", "url"])
        thumbnail = _first_str(item, ["image_url", "thumbnail_url"])
        author = _first_str(item, ["pinner", "pinner_name", "username", "board_name"])
    elif platform == "x":
        title = _first_str(item, ["title", "text", "snippet"])[:140]
        text_value = _first_str(item, ["text", "snippet", "title"])
        url = _first_str(item, ["url", "link"])
        thumbnail = _first_str(item, ["thumbnail_url", "image_url"])
        author = _first_str(item, ["author", "username", "userName"])
    elif platform == "reddit":
        title = _first_str(item, ["title"])
        text_value = _first_str(item, ["selftext", "text", "snippet"])
        url = _first_str(item, ["url", "permalink", "link"])
        thumbnail = _first_str(item, ["thumbnail", "thumbnail_url"])
        author = _first_str(item, ["author", "subreddit"])
    else:
        title = _first_str(item, ["title", "caption", "description", "text"])
        text_value = _first_str(item, ["text", "description", "caption", "snippet"])
        url = _first_str(item, ["url", "link", "permalink"])
        thumbnail = _first_str(item, ["thumbnail_url", "image_url", "thumbnail"])
        author = _first_str(item, ["author", "username"])

    return {
        "id": stable_signal_id(platform, niche, query, item),
        "platform": platform,
        "niche": niche.strip().lower() or "general",
        "query": query.strip().lower(),
        "title": title[:240],
        "text": text_value[:1200],
        "url": url[:1000],
        "thumbnail_url": thumbnail[:1000],
        "author": author[:240],
        "engagement": _engagement(platform, item),
        "source": source[:80],
        "raw_json": json.dumps(item, ensure_ascii=False, default=str),
        "fetched_at": utc_now(),
    }


def cache_items(
    platform: str,
    niche: str,
    query: str,
    items: list[dict[str, Any]],
    *,
    source: str,
) -> int:
    if platform not in SOCIAL_PLATFORMS or not items:
        return 0

    rows = [
        normalize_signal(platform, niche, query, item, source=source)
        for item in items
        if isinstance(item, dict)
    ]
    if not rows:
        return 0

    db = SessionLocal()
    try:
        dialect = db.bind.dialect.name if db.bind is not None else ""
        if dialect == "postgresql":
            statement = text(
                """
                INSERT INTO trend_signals (
                    id, platform, niche, query, title, text, url, thumbnail_url,
                    author, engagement, source, raw_json, fetched_at
                )
                VALUES (
                    :id, :platform, :niche, :query, :title, :text, :url,
                    :thumbnail_url, :author, :engagement, :source,
                    CAST(:raw_json AS jsonb), :fetched_at
                )
                ON CONFLICT (id) DO UPDATE SET
                    title = EXCLUDED.title,
                    text = EXCLUDED.text,
                    url = EXCLUDED.url,
                    thumbnail_url = EXCLUDED.thumbnail_url,
                    author = EXCLUDED.author,
                    engagement = EXCLUDED.engagement,
                    source = EXCLUDED.source,
                    raw_json = EXCLUDED.raw_json,
                    fetched_at = EXCLUDED.fetched_at
                """
            )
        else:
            statement = text(
                """
                INSERT OR REPLACE INTO trend_signals (
                    id, platform, niche, query, title, text, url, thumbnail_url,
                    author, engagement, source, raw_json, fetched_at
                )
                VALUES (
                    :id, :platform, :niche, :query, :title, :text, :url,
                    :thumbnail_url, :author, :engagement, :source, :raw_json,
                    :fetched_at
                )
                """
            )

        db.execute(statement, rows)
        db.commit()
        return len(rows)
    except Exception as exc:
        db.rollback()
        logger.warning("Could not cache %s signals for '%s': %s", platform, query, exc)
        return 0
    finally:
        db.close()


def cached_items(
    platform: str,
    niche: str,
    query: str,
    *,
    max_results: int,
    max_age_minutes: int = DEFAULT_CACHE_TTL_MINUTES,
) -> list[dict[str, Any]]:
    if platform not in SOCIAL_PLATFORMS:
        return []

    cutoff = utc_now() - timedelta(minutes=max(max_age_minutes, 1))
    db = SessionLocal()
    try:
        rows = db.execute(
            text(
                """
                SELECT raw_json, title, text, url, thumbnail_url, author, engagement, source
                FROM trend_signals
                WHERE platform = :platform
                  AND niche = :niche
                  AND query = :query
                  AND fetched_at >= :cutoff
                ORDER BY engagement DESC, fetched_at DESC
                LIMIT :limit
                """
            ),
            {
                "platform": platform,
                "niche": niche.strip().lower() or "general",
                "query": query.strip().lower(),
                "cutoff": cutoff,
                "limit": max(max_results, 1),
            },
        ).mappings()

        out: list[dict[str, Any]] = []
        for row in rows:
            raw = row.get("raw_json")
            item: dict[str, Any] = {}
            if isinstance(raw, dict):
                item = dict(raw)
            elif isinstance(raw, str) and raw:
                try:
                    parsed = json.loads(raw)
                    item = parsed if isinstance(parsed, dict) else {}
                except json.JSONDecodeError:
                    item = {}
            item.setdefault("title", row.get("title") or "")
            item.setdefault("description", row.get("text") or "")
            item.setdefault("url", row.get("url") or "")
            item.setdefault("thumbnail_url", row.get("thumbnail_url") or "")
            item.setdefault("author", row.get("author") or "")
            item.setdefault("engagement", row.get("engagement") or 0)
            item.setdefault("platform", platform)
            item.setdefault("source", row.get("source") or "cache")
            out.append(item)
        return out
    except Exception as exc:
        logger.warning("Could not read cached %s signals for '%s': %s", platform, query, exc)
        return []
    finally:
        db.close()
