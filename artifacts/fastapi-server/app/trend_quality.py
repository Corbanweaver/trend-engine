from __future__ import annotations

import hashlib
import json
import logging
import math
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import text

from app.database import SessionLocal

logger = logging.getLogger(__name__)

SOCIAL_BUCKETS = {
    "youtube": "example_videos",
    "instagram": "instagram_posts",
    "tiktok": "tiktok_videos",
    "x": "x_posts",
    "reddit": "reddit_posts",
    "pinterest": "pinterest_pins",
}

PLATFORM_LABELS = {
    "youtube": "YouTube",
    "instagram": "Instagram",
    "tiktok": "TikTok",
    "x": "X",
    "reddit": "Reddit",
    "pinterest": "Pinterest",
}

MIN_ROW_SCORE = {
    "youtube": 30,
    "tiktok": 28,
    "instagram": 18,
    "x": 18,
    "reddit": 16,
    "pinterest": 12,
}


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _num(value: object) -> float:
    try:
        if value in (None, ""):
            return 0
        return float(str(value).replace(",", ""))
    except (TypeError, ValueError):
        return 0


def _int(value: object) -> int:
    return int(_num(value))


def _first_num(item: dict[str, Any], keys: list[str]) -> int:
    for key in keys:
        value = _int(item.get(key))
        if value > 0:
            return value
    return 0


def _first_str(item: dict[str, Any], keys: list[str]) -> str:
    for key in keys:
        value = item.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return ""


def _parse_datetime(value: object) -> datetime | None:
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    if isinstance(value, (int, float)) and value > 0:
        try:
            if value > 10_000_000_000:
                value = value / 1000
            return datetime.fromtimestamp(value, tz=timezone.utc)
        except (OSError, ValueError):
            return None
    if not isinstance(value, str) or not value.strip():
        return None
    raw = value.strip()
    if raw.isdigit():
        return _parse_datetime(float(raw))
    for candidate in [raw, raw.replace("Z", "+00:00")]:
        try:
            parsed = datetime.fromisoformat(candidate)
            return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)
        except ValueError:
            continue
    return None


def _published_at(item: dict[str, Any]) -> datetime | None:
    for key in [
        "published_at",
        "publishedAt",
        "created_at",
        "createdAt",
        "createTime",
        "createTimestamp",
        "timestamp",
        "takenAt",
        "taken_at",
        "date",
        "pubDate",
        "fetched_at",
    ]:
        parsed = _parse_datetime(item.get(key))
        if parsed:
            return parsed
    return None


def _age_hours(item: dict[str, Any]) -> float:
    published = _published_at(item)
    if not published:
        return 168.0
    return max((_now() - published).total_seconds() / 3600, 1.0)


def _format_count(value: float) -> str:
    n = float(value)
    if n >= 1_000_000_000:
        return f"{n / 1_000_000_000:.1f}B"
    if n >= 1_000_000:
        return f"{n / 1_000_000:.1f}M"
    if n >= 1_000:
        return f"{n / 1_000:.0f}K"
    return str(int(n))


def _title(item: dict[str, Any], platform: str) -> str:
    value = _first_str(
        item,
        ["title", "description", "caption", "text", "snippet", "seo_description"],
    )
    if value:
        return " ".join(value.split())[:90]
    return f"{PLATFORM_LABELS.get(platform, platform.title())} signal"


def platform_metrics(platform: str, item: dict[str, Any]) -> dict[str, int]:
    views = _first_num(
        item,
        [
            "view_count",
            "viewCount",
            "views",
            "play_count",
            "playCount",
            "video_view",
            "impressions",
        ],
    )
    likes = _first_num(
        item,
        ["like_count", "likeCount", "likes", "diggCount", "hearts", "heart_count"],
    )
    comments = _first_num(
        item,
        ["comment_count", "commentCount", "comments", "comments_count", "num_comments"],
    )
    shares = _first_num(item, ["share_count", "shareCount", "shares", "retweets", "repins"])
    saves = _first_num(item, ["save_count", "saveCount", "saves", "repin_count"])
    score = _first_num(item, ["score", "engagement"])

    if platform == "youtube" and views <= 0:
        views = score
    if platform == "reddit":
        likes = max(likes, score)
    if platform == "pinterest":
        likes = max(likes, saves)

    weighted = max(score, views, likes * 3 + comments * 8 + shares * 12 + saves * 5)
    return {
        "views": int(views),
        "likes": int(likes),
        "comments": int(comments),
        "shares": int(shares),
        "saves": int(saves),
        "engagement": int(weighted),
    }


def is_low_value_fallback(platform: str, item: dict[str, Any]) -> bool:
    source = str(item.get("source") or "").lower()
    url = str(item.get("url") or item.get("link") or "").lower()
    title = _title(item, platform).lower()
    if "fallback" in source or "quota exceeded" in title:
        return True
    if any(phrase in title for phrase in ["browse tiktok", "browse pinterest", "search x:", "search youtube for"]):
        return True
    return (
        platform in {"tiktok", "pinterest", "x"}
        and "/search" in url
        and platform_metrics(platform, item)["engagement"] <= 0
    )


def score_source_item(platform: str, item: dict[str, Any]) -> dict[str, Any]:
    metrics = platform_metrics(platform, item)
    age_hours = _age_hours(item)
    engagement = metrics["engagement"]
    views = metrics["views"]
    velocity = engagement / max(age_hours, 1)
    freshness = 0
    if age_hours <= 24:
        freshness = 18
    elif age_hours <= 72:
        freshness = 13
    elif age_hours <= 168:
        freshness = 8
    elif age_hours <= 720:
        freshness = 3

    if is_low_value_fallback(platform, item):
        score = 0
    else:
        size_score = min(42, math.log10(max(engagement, views, 1) + 1) * 8)
        velocity_score = min(28, math.log10(velocity + 1) * 9)
        interaction_score = min(
            16,
            math.log10(metrics["likes"] + metrics["comments"] * 4 + metrics["shares"] * 8 + 1) * 5,
        )
        evidence_bonus = 4 if engagement > 0 else 0
        score = round(size_score + velocity_score + interaction_score + freshness + evidence_bonus)

    enriched = dict(item)
    enriched["trend_item_score"] = int(max(score, 0))
    enriched["trend_engagement"] = engagement
    enriched["trend_views"] = views
    enriched["trend_velocity"] = round(velocity, 2)
    enriched["trend_age_hours"] = round(age_hours, 1)
    return enriched


def ranked_quality_rows(platform: str, rows: list[dict], *, max_results: int = 5) -> list[dict]:
    scored = [
        score_source_item(platform, row)
        for row in rows
        if isinstance(row, dict) and not is_low_value_fallback(platform, row)
    ]
    scored.sort(
        key=lambda row: (
            _int(row.get("trend_item_score")),
            _int(row.get("trend_engagement")),
            -_num(row.get("trend_age_hours")),
        ),
        reverse=True,
    )
    threshold = MIN_ROW_SCORE.get(platform, 14)
    strong = [row for row in scored if _int(row.get("trend_item_score")) >= threshold]
    if strong:
        return strong[:max_results]
    return [row for row in scored if _int(row.get("trend_item_score")) >= 8][: min(max_results, 2)]


def rank_topic_media(media: dict[str, list[dict]]) -> dict[str, list[dict]]:
    ranked = dict(media)
    for platform in SOCIAL_BUCKETS:
        rows = media.get(platform, [])
        if isinstance(rows, list):
            ranked[platform] = ranked_quality_rows(platform, rows, max_results=5)
    return ranked


def _platform_rows(media: dict[str, list[dict]]) -> list[tuple[str, dict[str, Any]]]:
    rows: list[tuple[str, dict[str, Any]]] = []
    for platform in SOCIAL_BUCKETS:
        for row in media.get(platform, []) or []:
            if isinstance(row, dict):
                rows.append((platform, row))
    return rows


def _best_source_label(platform: str, row: dict[str, Any]) -> str:
    metrics = platform_metrics(platform, row)
    age = _num(row.get("trend_age_hours")) or _age_hours(row)
    if metrics["views"] > 0:
        metric = f"{_format_count(metrics['views'])} views"
    elif metrics["engagement"] > 0:
        metric = f"{_format_count(metrics['engagement'])} engagement"
    else:
        metric = "fresh source"
    if age <= 48:
        when = "in the last 48h"
    elif age <= 168:
        when = "this week"
    elif age <= 720:
        when = "this month"
    else:
        when = "recently"
    return f"{PLATFORM_LABELS.get(platform, platform.title())}: {metric} {when}"


def previous_topic_snapshot(niche: str, topic: str) -> dict[str, Any] | None:
    db = SessionLocal()
    try:
        row = db.execute(
            text(
                """
                SELECT score, total_engagement, platform_count, created_at
                FROM trend_topic_snapshots
                WHERE niche = :niche
                  AND topic = :topic
                  AND created_at >= :cutoff
                ORDER BY created_at DESC
                LIMIT 1
                """
            ),
            {
                "niche": niche.strip().lower(),
                "topic": topic.strip().lower(),
                "cutoff": _now() - timedelta(days=7),
            },
        ).mappings().first()
        return dict(row) if row else None
    except Exception as exc:
        logger.warning("Could not read trend snapshot for '%s': %s", topic, exc)
        return None
    finally:
        db.close()


def record_topic_snapshot(niche: str, topic: str, quality: dict[str, Any]) -> None:
    db = SessionLocal()
    try:
        created_at = _now()
        raw_id = f"{niche.strip().lower()}|{topic.strip().lower()}|{created_at.isoformat()}"
        snapshot_id = hashlib.sha256(raw_id.encode("utf-8")).hexdigest()[:40]
        dialect = db.bind.dialect.name if db.bind is not None else ""
        if dialect == "postgresql":
            statement = text(
                """
                INSERT INTO trend_topic_snapshots (
                    id, niche, topic, score, total_engagement, platform_count,
                    stage, evidence_json, created_at
                )
                VALUES (
                    :id, :niche, :topic, :score, :total_engagement,
                    :platform_count, :stage, CAST(:evidence_json AS jsonb),
                    :created_at
                )
                """
            )
        else:
            statement = text(
                """
                INSERT INTO trend_topic_snapshots (
                    id, niche, topic, score, total_engagement, platform_count,
                    stage, evidence_json, created_at
                )
                VALUES (
                    :id, :niche, :topic, :score, :total_engagement,
                    :platform_count, :stage, :evidence_json, :created_at
                )
                """
            )
        db.execute(
            statement,
            {
                "id": snapshot_id,
                "niche": niche.strip().lower(),
                "topic": topic.strip().lower(),
                "score": _int(quality.get("score")),
                "total_engagement": _int(quality.get("total_engagement")),
                "platform_count": _int(quality.get("platform_count")),
                "stage": str(quality.get("stage") or ""),
                "evidence_json": json.dumps(quality.get("evidence", []), ensure_ascii=False),
                "created_at": created_at,
            },
        )
        db.execute(
            text("DELETE FROM trend_topic_snapshots WHERE created_at < :cutoff"),
            {"cutoff": created_at - timedelta(days=30)},
        )
        db.commit()
    except Exception as exc:
        db.rollback()
        logger.warning("Could not record trend snapshot for '%s': %s", topic, exc)
    finally:
        db.close()


def score_topic(niche: str, topic: str, media: dict[str, list[dict]]) -> dict[str, Any]:
    rows = [(platform, score_source_item(platform, row)) for platform, row in _platform_rows(media)]
    rows.sort(key=lambda pair: _int(pair[1].get("trend_item_score")), reverse=True)

    platforms = {platform for platform, row in rows if _int(row.get("trend_item_score")) > 0}
    total_engagement = sum(platform_metrics(platform, row)["engagement"] for platform, row in rows)
    max_engagement = max([platform_metrics(platform, row)["engagement"] for platform, row in rows] or [0])
    max_velocity = max([_num(row.get("trend_velocity")) for _, row in rows] or [0])
    fresh_rows = sum(1 for _, row in rows if _num(row.get("trend_age_hours")) <= 168)
    top_scores = sum(_int(row.get("trend_item_score")) for _, row in rows[:5])
    platform_bonus = min(20, max(len(platforms) - 1, 0) * 7)
    freshness_bonus = min(12, fresh_rows * 3)
    score = min(100, round(top_scores / 3 + platform_bonus + freshness_bonus))

    previous = previous_topic_snapshot(niche, topic)
    growth_percent = 0
    if previous:
        old_engagement = max(_int(previous.get("total_engagement")), 1)
        growth_percent = round(((total_engagement - old_engagement) / old_engagement) * 100)
        if growth_percent >= 40:
            score = min(100, score + 10)

    if max_engagement >= 500_000 or score >= 86:
        stage = "Big right now"
    elif growth_percent >= 40 or max_velocity >= 900 or score >= 72:
        stage = "Rising fast"
    elif len(platforms) >= 3 and score >= 58:
        stage = "Cross-platform"
    elif fresh_rows >= 2 and score >= 44:
        stage = "Early trend"
    else:
        stage = "Watchlist"

    evidence = [_best_source_label(platform, row) for platform, row in rows[:3]]
    if len(platforms) >= 2:
        evidence.append(f"Found across {len(platforms)} platforms")
    if growth_percent >= 25:
        evidence.append(f"Up {growth_percent}% since the last scan")

    if stage == "Big right now":
        reason = "This has large current engagement, so creators can tap into demand that already exists."
    elif stage == "Rising fast":
        reason = "This is gaining attention quickly compared with its age."
    elif stage == "Cross-platform":
        reason = "This is showing up across multiple platforms, which is a stronger trend signal."
    elif stage == "Early trend":
        reason = "This is fresh and starting to collect enough signals to watch."
    else:
        reason = "This has some relevant signals, but it needs more momentum before it is a strong trend."

    quality = {
        "score": int(score),
        "stage": stage,
        "reason": reason,
        "evidence": evidence[:4],
        "total_engagement": int(total_engagement),
        "max_engagement": int(max_engagement),
        "max_velocity": round(max_velocity, 2),
        "platform_count": len(platforms),
        "fresh_signal_count": fresh_rows,
        "growth_percent": growth_percent,
    }
    record_topic_snapshot(niche, topic, quality)
    return quality


def discovery_signal_context(raw_sources: dict[str, Any]) -> str:
    rows: list[tuple[str, dict[str, Any]]] = []
    source_map = {
        "youtube": "youtube",
        "instagram": "instagram",
        "tiktok": "tiktok",
        "pinterest": "pinterest",
        "x": "x",
        "reddit_multi": "reddit",
    }
    for source_key, platform in source_map.items():
        source_rows = raw_sources.get(source_key, [])
        if not isinstance(source_rows, list):
            continue
        for row in source_rows:
            if isinstance(row, dict):
                rows.append((platform, score_source_item(platform, row)))

    rows = [
        (platform, row)
        for platform, row in rows
        if _int(row.get("trend_item_score")) >= MIN_ROW_SCORE.get(platform, 14)
    ]
    rows.sort(key=lambda pair: _int(pair[1].get("trend_item_score")), reverse=True)
    if not rows:
        return ""

    lines = ["Ranked live momentum signals:"]
    for platform, row in rows[:12]:
        lines.append(
            f"- {_title(row, platform)} ({_best_source_label(platform, row)}, signal score {_int(row.get('trend_item_score'))})"
        )
    return "\n".join(lines)
