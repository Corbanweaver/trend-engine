from fastapi import APIRouter, HTTPException
import httpx
from pydantic import BaseModel, Field
from app.apify_client import APIFY_API_BASE, apify_token
from app.tiktok_client import (
    build_tiktok_actor_input,
    configured_tiktok_actor_id,
    tiktok_hashtag_info,
    tiktok_trending_search,
)

router = APIRouter(prefix="/tiktok", tags=["tiktok"])


class TikTokSearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=200)
    max_results: int = Field(default=6, ge=1, le=20)


class TikTokVideo(BaseModel):
    id: str
    description: str
    author: str
    author_nickname: str
    play_count: int
    like_count: int
    comment_count: int
    share_count: int
    cover: str
    url: str


class TikTokSearchResponse(BaseModel):
    query: str
    videos: list[TikTokVideo]


class TikTokHashtagResponse(BaseModel):
    hashtag: str
    views: int
    videos: int


@router.get("/provider-status")
async def provider_status():
    actor_id = configured_tiktok_actor_id()
    return {
        "apify_token_configured": bool(apify_token()),
        "actor_id": actor_id,
        "actor_id_configured": bool(actor_id),
    }


@router.get("/provider-probe")
async def provider_probe(query: str = "fitness viral"):
    token = apify_token()
    actor_id = configured_tiktok_actor_id()
    actor_input = build_tiktok_actor_input(query, 1)
    if not token or not actor_id:
        return {
            "apify_token_configured": bool(token),
            "actor_id": actor_id,
            "status_code": None,
            "detail": "Apify token or actor id is missing.",
        }

    url = f"{APIFY_API_BASE}/acts/{actor_id.replace('/', '~')}/run-sync-get-dataset-items"
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                url,
                params={"token": token, "limit": 1, "clean": "true"},
                json=actor_input,
            )
    except Exception as exc:
        return {
            "apify_token_configured": True,
            "actor_id": actor_id,
            "status_code": None,
            "input_hashtags": actor_input.get("hashtags", []),
            "detail": str(exc)[:500],
        }

    body_text = response.text[:800]
    item_count = None
    first_item_keys: list[str] = []
    try:
        data = response.json()
        if isinstance(data, list):
            item_count = len(data)
            if data and isinstance(data[0], dict):
                first_item_keys = sorted(list(data[0].keys()))[:40]
    except Exception:
        pass

    return {
        "apify_token_configured": True,
        "actor_id": actor_id,
        "status_code": response.status_code,
        "input_hashtags": actor_input.get("hashtags", []),
        "input_keys": sorted(actor_input.keys()),
        "item_count": item_count,
        "first_item_keys": first_item_keys,
        "body_preview": body_text,
    }


@router.post("/search", response_model=TikTokSearchResponse)
async def search_tiktok(body: TikTokSearchRequest):
    if not body.query.strip():
        raise HTTPException(status_code=422, detail="query must not be empty.")

    try:
        results = await tiktok_trending_search(body.query, body.max_results)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TikTok search failed: {str(e)}")

    videos = [TikTokVideo(**v) for v in results]
    return TikTokSearchResponse(query=body.query, videos=videos)


@router.get("/hashtag/{hashtag}", response_model=TikTokHashtagResponse)
async def get_hashtag_info(hashtag: str):
    hashtag = hashtag.strip().lstrip("#")
    if not hashtag or len(hashtag) > 80:
        raise HTTPException(status_code=422, detail="hashtag must be 1-80 characters.")
    try:
        info = await tiktok_hashtag_info(hashtag)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Hashtag lookup failed: {str(e)}")

    return TikTokHashtagResponse(**info)
