import re
import html
import feedparser
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database import get_db
from app.models import IngestResponse, RedditPost

router = APIRouter(prefix="/ingest", tags=["ingest"])

SUBREDDIT = "fitness"
POST_LIMIT = 25
RSS_URL = f"https://www.reddit.com/r/{SUBREDDIT}/hot.rss?limit={POST_LIMIT}"


def parse_published(entry: dict) -> datetime:
    published = entry.get("published") or entry.get("updated", "")
    if published:
        try:
            return parsedate_to_datetime(published)
        except Exception:
            pass
    return datetime.now(timezone.utc)


def extract_post_id(entry: dict) -> str:
    link = entry.get("id") or entry.get("link", "")
    parts = link.rstrip("/").split("/")
    if "comments" in parts:
        idx = parts.index("comments")
        if idx + 1 < len(parts):
            return parts[idx + 1]
    return link.split("/")[-1] if link else ""


@router.post("/reddit", response_model=IngestResponse)
def ingest_reddit(db: Session = Depends(get_db)):
    feed = feedparser.parse(RSS_URL)

    if feed.bozo and not feed.entries:
        raise HTTPException(status_code=502, detail="Failed to fetch RSS feed from Reddit.")

    ingested = 0
    skipped = 0
    posts_out: list[RedditPost] = []

    for entry in feed.entries[:POST_LIMIT]:
        post_id = extract_post_id(entry)
        if not post_id:
            continue

        title = entry.get("title", "")
        summary = entry.get("summary", "")
        raw = summary if summary and len(summary) > len(title) else title
        cleaned = re.sub(r"<[^>]+>", " ", raw)
        cleaned = re.sub(r"<!--.*?-->", "", cleaned)
        cleaned = html.unescape(cleaned)
        post_text = re.sub(r"\s+", " ", cleaned).strip()

        created_at = parse_published(entry)

        existing = db.execute(
            text("SELECT id FROM reddit_posts WHERE id = :id"),
            {"id": post_id},
        ).fetchone()

        if existing:
            skipped += 1
            continue

        db.execute(
            text("""
                INSERT INTO reddit_posts (id, text, engagement, created_at)
                VALUES (:id, :text, :engagement, :created_at)
            """),
            {
                "id": post_id,
                "text": post_text,
                "engagement": 0,
                "created_at": created_at,
            },
        )
        db.commit()
        ingested += 1
        posts_out.append(
            RedditPost(
                id=post_id,
                text=post_text,
                engagement=0,
                created_at=created_at,
            )
        )

    return IngestResponse(ingested=ingested, skipped=skipped, posts=posts_out)
