import os
import logging

import httpx

APIFY_API_BASE = "https://api.apify.com/v2"
INSTAGRAM_ACTOR_ID = "apify~instagram-scraper"
logger = logging.getLogger(__name__)


def _to_int(value: object) -> int:
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return 0


def _map_apify_instagram_item(item: dict) -> dict:
    media_type_raw = str(item.get("type") or item.get("mediaType") or "").upper()
    if media_type_raw in ("VIDEO", "REEL", "REELS"):
        media_type = "VIDEO"
    elif media_type_raw in ("CAROUSEL", "SIDECAR", "CAROUSEL_ALBUM"):
        media_type = "CAROUSEL_ALBUM"
    else:
        media_type = "IMAGE"

    caption = str(item.get("caption") or item.get("text") or "")
    if len(caption) > 200:
        caption = caption[:200] + "..."

    media_url = (
        item.get("displayUrl")
        or item.get("imageUrl")
        or item.get("videoUrl")
        or item.get("url")
        or ""
    )
    permalink = item.get("url") or item.get("postUrl") or ""
    thumbnail_url = item.get("displayUrl") or item.get("thumbnailUrl") or ""

    return {
        "id": str(item.get("id") or item.get("shortCode") or ""),
        "caption": caption,
        "media_type": media_type,
        "media_url": str(media_url),
        "permalink": str(permalink),
        "thumbnail_url": str(thumbnail_url),
        "timestamp": str(item.get("timestamp") or item.get("takenAtTimestamp") or ""),
        "like_count": _to_int(item.get("likesCount") or item.get("likes")),
        "comments_count": _to_int(item.get("commentsCount") or item.get("comments")),
    }


async def _run_apify_instagram_actor(query: str, max_results: int) -> list[dict]:
    token = os.environ.get("APIFY_API_TOKEN", "").strip()
    if not token:
        logger.warning("Instagram search skipped: APIFY_API_TOKEN missing.")
        return []

    normalized = query.strip().strip("#").lower()
    actor_input = {
        "searchType": "hashtag",
        "search": normalized,
        "resultsType": "posts",
        "resultsLimit": max_results,
        "addParentData": False,
    }

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    params = {"token": token}
    url = f"{APIFY_API_BASE}/acts/{INSTAGRAM_ACTOR_ID}/run-sync-get-dataset-items"

    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            resp = await client.post(url, params=params, headers=headers, json=actor_input)
            if resp.status_code >= 400:
                logger.error("Instagram Apify call failed (%s): %s", resp.status_code, resp.text)
                return []
            resp.raise_for_status()
            data = resp.json()
            print(f"Instagram Apify raw response for query '{query}': {data}")
            return data if isinstance(data, list) else []
    except Exception as e:
        logger.exception("Instagram Apify call exception: %s", e)
        return []


async def search_instagram(query: str, max_results: int = 5) -> list[dict]:
    media_items = await _run_apify_instagram_actor(query, max_results)
    results: list[dict] = []
    for item in media_items[:max_results]:
        if not isinstance(item, dict):
            continue
        mapped = _map_apify_instagram_item(item)
        if not mapped["id"] and not mapped["permalink"]:
            continue
        results.append(mapped)
    logger.info("Instagram mapped results for query '%s': %s", query, len(results))
    return results
