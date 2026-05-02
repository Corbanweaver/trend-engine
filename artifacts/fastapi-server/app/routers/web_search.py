from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.web_search_client import web_search, search_trending_content

router = APIRouter(prefix="/web-search", tags=["web-search"])


class WebSearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=200)
    max_results: int = Field(default=10, ge=1, le=20)


class WebResult(BaseModel):
    title: str
    url: str
    snippet: str
    source: str


class WebSearchResponse(BaseModel):
    query: str
    results: list[WebResult]


@router.post("/search", response_model=WebSearchResponse)
async def search_web(body: WebSearchRequest):
    if not body.query.strip():
        raise HTTPException(status_code=422, detail="query must not be empty.")

    try:
        results = await web_search(body.query, body.max_results)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Web search failed: {str(e)}")

    items = [WebResult(**r) for r in results]
    return WebSearchResponse(query=body.query, results=items)


@router.post("/trending", response_model=WebSearchResponse)
async def trending_content(body: WebSearchRequest):
    if not body.query.strip():
        raise HTTPException(status_code=422, detail="query must not be empty.")

    try:
        results = await search_trending_content(body.query, body.max_results)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Trending search failed: {str(e)}")

    items = [WebResult(**r) for r in results]
    return WebSearchResponse(query=body.query, results=items)
