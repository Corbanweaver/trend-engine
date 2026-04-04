from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.instagram_client import search_instagram

router = APIRouter(prefix="/instagram", tags=["instagram"])


class InstagramSearchRequest(BaseModel):
    query: str
    max_results: int = Field(default=5, ge=1, le=20)


class InstagramPost(BaseModel):
    id: str
    caption: str
    media_type: str
    media_url: str
    permalink: str
    thumbnail_url: str
    timestamp: str
    like_count: int
    comments_count: int


class InstagramSearchResponse(BaseModel):
    query: str
    posts: list[InstagramPost]


@router.post("/search", response_model=InstagramSearchResponse)
async def search_ig(body: InstagramSearchRequest):
    if not body.query.strip():
        raise HTTPException(status_code=422, detail="query must not be empty.")

    try:
        results = await search_instagram(body.query, body.max_results)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Instagram search failed: {str(e)}")

    posts = [InstagramPost(**p) for p in results]
    return InstagramSearchResponse(query=body.query, posts=posts)
