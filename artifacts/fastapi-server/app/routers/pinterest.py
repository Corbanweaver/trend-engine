from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.pinterest_client import pinterest_search

router = APIRouter(prefix="/pinterest", tags=["pinterest"])


class PinterestSearchRequest(BaseModel):
    query: str
    max_results: int = Field(default=6, ge=1, le=20)


class PinterestPin(BaseModel):
    pin_id: str
    title: str
    image_url: str
    link: str
    board_name: str
    pinner: str


class PinterestSearchResponse(BaseModel):
    query: str
    pins: list[PinterestPin]


@router.post("/search", response_model=PinterestSearchResponse)
async def search_pinterest(body: PinterestSearchRequest):
    if not body.query.strip():
        raise HTTPException(status_code=422, detail="query must not be empty.")

    try:
        results = await pinterest_search(body.query, body.max_results)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pinterest search failed: {str(e)}")

    pins = [PinterestPin(**p) for p in results]
    return PinterestSearchResponse(query=body.query, pins=pins)
