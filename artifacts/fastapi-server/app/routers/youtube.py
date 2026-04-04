from fastapi import APIRouter, HTTPException
from app.models import YouTubeSearchRequest, YouTubeSearchResponse, YouTubeVideo
from app.youtube_client import youtube_search

router = APIRouter(prefix="/youtube", tags=["youtube"])


@router.post("/search", response_model=YouTubeSearchResponse)
async def search_youtube(body: YouTubeSearchRequest):
    if not body.query.strip():
        raise HTTPException(status_code=422, detail="query must not be empty.")

    try:
        results = await youtube_search(body.query, body.max_results)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"YouTube search failed: {str(e)}")

    videos = [YouTubeVideo(**v) for v in results]
    return YouTubeSearchResponse(query=body.query, videos=videos)
