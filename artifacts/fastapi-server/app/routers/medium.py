from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.medium_client import medium_search

router = APIRouter(prefix="/medium", tags=["medium"])


class MediumSearchRequest(BaseModel):
    query: str
    max_results: int = Field(default=6, ge=1, le=20)


class MediumArticle(BaseModel):
    title: str
    url: str
    author: str
    claps: int
    reading_time: float
    subtitle: str
    image_url: str


class MediumSearchResponse(BaseModel):
    query: str
    articles: list[MediumArticle]


@router.post("/search", response_model=MediumSearchResponse)
async def search_medium(body: MediumSearchRequest):
    if not body.query.strip():
        raise HTTPException(status_code=422, detail="query must not be empty.")

    try:
        results = await medium_search(body.query, body.max_results)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Medium search failed: {str(e)}")

    articles = [MediumArticle(**a) for a in results]
    return MediumSearchResponse(query=body.query, articles=articles)
