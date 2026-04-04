import os
import httpx

GRAPH_API_BASE = "https://graph.facebook.com/v21.0"


async def _get_instagram_user_id(token: str) -> str:
    stored_id = os.environ.get("INSTAGRAM_BUSINESS_ACCOUNT_ID", "")

    async with httpx.AsyncClient(timeout=10.0) as client:
        if stored_id and stored_id != "unknown":
            resp = await client.get(
                f"{GRAPH_API_BASE}/{stored_id}",
                params={"access_token": token, "fields": "id,username"},
            )
            if resp.status_code == 200:
                return stored_id

        resp = await client.get(
            f"{GRAPH_API_BASE}/me/accounts",
            params={
                "access_token": token,
                "fields": "id,name,instagram_business_account",
            },
        )
        resp.raise_for_status()
        pages = resp.json().get("data", [])

        for page in pages:
            ig = page.get("instagram_business_account")
            if ig:
                return ig["id"]

    raise RuntimeError(
        "No Instagram Business account found. Make sure your Instagram is a Business/Creator account linked to a Facebook Page."
    )


async def instagram_hashtag_search(hashtag: str, ig_user_id: str, token: str, max_results: int = 5) -> list[dict]:
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(
            f"{GRAPH_API_BASE}/ig_hashtag_search",
            params={
                "q": hashtag.strip("#").lower(),
                "user_id": ig_user_id,
                "access_token": token,
            },
        )
        resp.raise_for_status()
        data = resp.json()
        hashtag_ids = data.get("data", [])

        if not hashtag_ids:
            return []

        hashtag_id = hashtag_ids[0]["id"]

        resp2 = await client.get(
            f"{GRAPH_API_BASE}/{hashtag_id}/top_media",
            params={
                "user_id": ig_user_id,
                "fields": "id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,like_count,comments_count",
                "access_token": token,
            },
        )
        resp2.raise_for_status()
        media_items = resp2.json().get("data", [])

    results = []
    for item in media_items[:max_results]:
        media_type = item.get("media_type", "")
        if media_type not in ("VIDEO", "CAROUSEL_ALBUM", "IMAGE"):
            continue

        caption = item.get("caption", "")
        if len(caption) > 200:
            caption = caption[:200] + "..."

        results.append({
            "id": item.get("id", ""),
            "caption": caption,
            "media_type": media_type,
            "media_url": item.get("media_url", ""),
            "permalink": item.get("permalink", ""),
            "thumbnail_url": item.get("thumbnail_url", ""),
            "timestamp": item.get("timestamp", ""),
            "like_count": item.get("like_count", 0),
            "comments_count": item.get("comments_count", 0),
        })

    return results


async def search_instagram(query: str, max_results: int = 5) -> list[dict]:
    token = os.environ.get("INSTAGRAM_ACCESS_TOKEN", "")
    if not token:
        return []

    try:
        ig_user_id = await _get_instagram_user_id(token)
    except RuntimeError:
        return []

    hashtag = query.replace(" ", "").lower()
    try:
        return await instagram_hashtag_search(hashtag, ig_user_id, token, max_results)
    except Exception:
        return []
