from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.multi_reddit_client import multi_reddit_ingest, get_subreddits_for_niche

router = APIRouter(prefix="/reddit", tags=["reddit"])


class RedditSearchRequest(BaseModel):
    niche: str = "fitness"
    max_per_sub: int = Field(default=10, ge=1, le=25)


class RedditPost(BaseModel):
    id: str
    title: str
    subreddit: str
    score: int
    num_comments: int
    url: str
    selftext: str


class RedditSearchResponse(BaseModel):
    niche: str
    subreddits: list[str]
    posts: list[RedditPost]


@router.post("/multi-search", response_model=RedditSearchResponse)
async def multi_search(body: RedditSearchRequest):
    if not body.niche.strip():
        raise HTTPException(status_code=422, detail="niche must not be empty.")

    subreddits = get_subreddits_for_niche(body.niche)

    try:
        posts = await multi_reddit_ingest(body.niche, body.max_per_sub)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Reddit search failed: {str(e)}")

    items = [RedditPost(**p) for p in posts]
    return RedditSearchResponse(niche=body.niche, subreddits=subreddits, posts=items)
