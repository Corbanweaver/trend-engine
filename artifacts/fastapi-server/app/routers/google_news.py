from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.google_news_client import google_news_search

router = APIRouter(prefix="/google-news", tags=["google-news"])


class NewsSearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=200)
    max_results: int = Field(default=10, ge=1, le=30)


class NewsArticle(BaseModel):
    title: str
    link: str
    published: str
    source: str
    summary: str


class NewsSearchResponse(BaseModel):
    query: str
    articles: list[NewsArticle]


@router.post("/search", response_model=NewsSearchResponse)
async def search_news(body: NewsSearchRequest):
    if not body.query.strip():
        raise HTTPException(status_code=422, detail="query must not be empty.")

    try:
        results = await google_news_search(body.query, body.max_results)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"News search failed: {str(e)}")

    articles = [NewsArticle(**a) for a in results]
    return NewsSearchResponse(query=body.query, articles=articles)
