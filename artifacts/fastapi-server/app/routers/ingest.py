import os
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
import praw

from app.database import get_db
from app.models import IngestResponse, RedditPost

router = APIRouter(prefix="/ingest", tags=["ingest"])

SUBREDDIT = "fitness"
POST_LIMIT = 25


def get_reddit_client() -> praw.Reddit:
    client_id = os.environ.get("REDDIT_CLIENT_ID")
    client_secret = os.environ.get("REDDIT_CLIENT_SECRET")
    if not client_id or not client_secret:
        raise HTTPException(
            status_code=503,
            detail="Reddit credentials not configured. Set REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET.",
        )
    return praw.Reddit(
        client_id=client_id,
        client_secret=client_secret,
        user_agent="FastAPIRedditIngester/1.0",
    )


@router.post("/reddit", response_model=IngestResponse)
def ingest_reddit(db: Session = Depends(get_db)):
    reddit = get_reddit_client()
    subreddit = reddit.subreddit(SUBREDDIT)

    ingested = 0
    skipped = 0
    posts_out: list[RedditPost] = []

    for submission in subreddit.hot(limit=POST_LIMIT):
        post_text = submission.selftext or submission.title
        engagement = submission.score + submission.num_comments
        created_at = datetime.fromtimestamp(submission.created_utc, tz=timezone.utc)

        existing = db.execute(
            text("SELECT id FROM reddit_posts WHERE id = :id"),
            {"id": submission.id},
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
                "id": submission.id,
                "text": post_text,
                "engagement": engagement,
                "created_at": created_at,
            },
        )
        db.commit()
        ingested += 1
        posts_out.append(
            RedditPost(
                id=submission.id,
                text=post_text,
                engagement=engagement,
                created_at=created_at,
            )
        )

    return IngestResponse(ingested=ingested, skipped=skipped, posts=posts_out)
