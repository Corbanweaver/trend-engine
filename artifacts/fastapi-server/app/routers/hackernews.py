from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.hackernews_client import hn_search, hn_top_stories

router = APIRouter(prefix="/hackernews", tags=["hackernews"])


class HNSearchRequest(BaseModel):
    query: str
    max_results: int = Field(default=10, ge=1, le=30)


class HNStory(BaseModel):
    id: str
    title: str
    url: str
    score: int
    comments: int
    author: str
    hn_link: str


class HNSearchResponse(BaseModel):
    query: str
    stories: list[HNStory]


class HNTopResponse(BaseModel):
    stories: list[HNStory]


@router.post("/search", response_model=HNSearchResponse)
async def search_hn(body: HNSearchRequest):
    if not body.query.strip():
        raise HTTPException(status_code=422, detail="query must not be empty.")

    try:
        results = await hn_search(body.query, body.max_results)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"HN search failed: {str(e)}")

    stories = [HNStory(**{**s, "id": str(s["id"])}) for s in results]
    return HNSearchResponse(query=body.query, stories=stories)


@router.get("/top", response_model=HNTopResponse)
async def top_stories(limit: int = 10):
    try:
        results = await hn_top_stories(min(limit, 30))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"HN top stories failed: {str(e)}")

    stories = [HNStory(**{**s, "id": str(s["id"])}) for s in results]
    return HNTopResponse(stories=stories)
