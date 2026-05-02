from fastapi import APIRouter, HTTPException
from typing import Annotated

from pydantic import BaseModel, Field
from app.google_trends_client import google_trends_search, google_trends_interest

router = APIRouter(prefix="/google-trends", tags=["google-trends"])


class GoogleTrendsRequest(BaseModel):
    query: str = Field(min_length=1, max_length=200)
    geo: str = Field(default="US", min_length=0, max_length=10)


class GoogleTrendsResponse(BaseModel):
    query: str
    related_queries: list[dict]
    related_topics: list[dict]
    trending_searches: list[str]


class InterestRequest(BaseModel):
    keywords: list[Annotated[str, Field(min_length=1, max_length=80)]] = Field(
        min_length=1,
        max_length=5,
    )
    geo: str = Field(default="US", min_length=0, max_length=10)


@router.post("/search", response_model=GoogleTrendsResponse)
async def search_trends(body: GoogleTrendsRequest):
    if not body.query.strip():
        raise HTTPException(status_code=422, detail="query must not be empty.")

    try:
        result = await google_trends_search(body.query, body.geo)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Google Trends search failed: {str(e)}")

    return GoogleTrendsResponse(**result)


@router.post("/interest")
async def get_interest(body: InterestRequest):
    if not body.keywords:
        raise HTTPException(status_code=422, detail="keywords must not be empty.")

    try:
        result = await google_trends_interest(body.keywords, body.geo)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Interest lookup failed: {str(e)}")

    return {"keywords": body.keywords, "interest": result}
