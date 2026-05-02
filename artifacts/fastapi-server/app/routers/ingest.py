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
from app.security import require_operational_key

router = APIRouter(prefix="/ingest", tags=["ingest"])

SUBREDDIT = "fitness"
POST_LIMIT = 50
RSS_URL = f"https://www.reddit.com/r/{SUBREDDIT}/hot.rss?limit={POST_LIMIT}"


def clean_html(raw: str) -> str:
    cleaned = re.sub(r"<!--.*?-->", "", raw)
    cleaned = re.sub(r"<[^>]+>", " ", cleaned)
    cleaned = html.unescape(cleaned)
    return re.sub(r"\s+", " ", cleaned).strip()


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


@router.post("/reddit", response_model=IngestResponse, dependencies=[Depends(require_operational_key)])
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

        title = entry.get("title", "").strip()
        summary = entry.get("summary", "")
        body = clean_html(summary) if summary else title

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
                INSERT INTO reddit_posts (id, title, text, engagement, created_at)
                VALUES (:id, :title, :text, :engagement, :created_at)
            """),
            {
                "id": post_id,
                "title": title,
                "text": body,
                "engagement": 0,
                "created_at": created_at,
            },
        )
        db.commit()
        ingested += 1
        posts_out.append(
            RedditPost(
                id=post_id,
                text=title,
                engagement=0,
                created_at=created_at,
            )
        )

    return IngestResponse(ingested=ingested, skipped=skipped, posts=posts_out)
