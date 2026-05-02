import os
import logging
import re
from urllib.parse import quote

import httpx

logger = logging.getLogger(__name__)
APIFY_API_BASE = "https://api.apify.com/v2"
DEFAULT_INSTAGRAM_ACTOR_ID = "apify/instagram-scraper"


def _to_int(value: object) -> int:
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return 0


def _first_str(item: dict, keys: list[str]) -> str:
    for key in keys:
        value = item.get(key)
        if value is not None and value != "":
            return str(value)
    return ""


def _image_from_item(item: dict) -> str:
    display_url = _first_str(
        item,
        [
            "displayUrl",
            "display_url",
            "imageUrl",
            "image_url",
            "thumbnailUrl",
            "thumbnail_url",
            "mediaUrl",
            "media_url",
        ],
    )
    if display_url:
        return display_url

    images = item.get("images") or item.get("image_versions2")
    if isinstance(images, dict):
        for value in images.values():
            if isinstance(value, dict):
                url = _first_str(value, ["url", "src"])
                if url:
                    return url
            elif isinstance(value, str) and value:
                return value
    return ""


def _instagram_url(item: dict, shortcode: str) -> str:
    direct_url = _first_str(item, ["url", "permalink", "postUrl", "post_url"])
    if direct_url:
        return direct_url
    if shortcode:
        return f"https://www.instagram.com/p/{shortcode}/"
    return ""


def _candidate_hashtags(query: str, limit: int = 4) -> list[str]:
    cleaned = query.strip().lstrip("#").lower()
    words = [w for w in re.split(r"[^a-z0-9]+", cleaned) if w]
    candidates: list[str] = []

    def add(value: str) -> None:
        tag = re.sub(r"[^a-z0-9_]", "", value.lower()).strip("_")
        if tag and tag not in candidates:
            candidates.append(tag)

    if words:
        add("".join(words))
        if len(words) > 1:
            add(words[0])
            add(words[-1])
            add("".join(words[:2]))
    else:
        add(cleaned)

    return candidates[:limit]


def _fallback_hashtag_results(query: str, max_results: int) -> list[dict]:
    return [
        {
            "id": f"instagram-hashtag-{tag}",
            "caption": f"Instagram hashtag scan for #{tag}",
            "media_type": "hashtag",
            "media_url": "",
            "permalink": f"https://www.instagram.com/explore/tags/{quote(tag, safe='')}/",
            "thumbnail_url": "",
            "timestamp": "",
            "like_count": 0,
            "comments_count": 0,
        }
        for tag in _candidate_hashtags(query, max_results)
    ][:max_results]


def _map_instagram_item(item: dict) -> dict | None:
    shortcode = _first_str(item, ["shortCode", "shortcode", "code"])
    post_id = _first_str(item, ["id", "pk", "postId", "post_id"]) or shortcode
    caption = _first_str(item, ["caption", "text", "description", "alt"])
    if not caption and isinstance(item.get("edge_media_to_caption"), dict):
        edges = item["edge_media_to_caption"].get("edges")
        if isinstance(edges, list) and edges:
            node = edges[0].get("node") if isinstance(edges[0], dict) else {}
            if isinstance(node, dict):
                caption = str(node.get("text") or "")

    media_type = _first_str(item, ["type", "mediaType", "media_type", "__typename"])
    image_url = _image_from_item(item)
    permalink = _instagram_url(item, shortcode)
    timestamp = _first_str(item, ["timestamp", "takenAt", "taken_at", "createdAt", "created_at"])

    if not (post_id or permalink or caption):
        return None

    return {
        "id": post_id or permalink,
        "caption": caption[:500],
        "media_type": media_type or "post",
        "media_url": image_url,
        "permalink": permalink,
        "thumbnail_url": image_url,
        "timestamp": timestamp,
        "like_count": _to_int(
            item.get("likesCount")
            or item.get("likes")
            or item.get("likeCount")
            or item.get("like_count")
        ),
        "comments_count": _to_int(
            item.get("commentsCount")
            or item.get("comments")
            or item.get("commentCount")
            or item.get("comments_count")
        ),
    }


async def search_instagram(query: str, max_results: int = 5) -> list[dict]:
    token = os.environ.get("APIFY_API_TOKEN", "").strip()
    if not token:
        logger.warning("APIFY_API_TOKEN is not configured; returning Instagram hashtag fallback links.")
        return _fallback_hashtag_results(query, max_results)
    try:
        tags = _candidate_hashtags(query)
        if not tags:
            return _fallback_hashtag_results(query, max_results)
        actor_id = os.environ.get("APIFY_INSTAGRAM_ACTOR_ID", DEFAULT_INSTAGRAM_ACTOR_ID).strip()
        actor_input = {
            "directUrls": [
                f"https://www.instagram.com/explore/tags/{quote(tag, safe='')}/"
                for tag in tags
            ],
            "resultsType": "posts",
            "resultsLimit": max_results,
            "addParentData": False,
            "search": query,
            "searchLimit": max_results,
        }
        url = f"{APIFY_API_BASE}/acts/{actor_id.replace('/', '~')}/run-sync-get-dataset-items"
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(url, params={"token": token}, json=actor_input)
            if resp.status_code != 200:
                logger.warning("Instagram Apify request failed with status %s", resp.status_code)
                return _fallback_hashtag_results(query, max_results)
            data = resp.json()
            if not isinstance(data, list):
                return _fallback_hashtag_results(query, max_results)
            normalized = []
            seen: set[str] = set()
            for item in data:
                if not isinstance(item, dict):
                    continue
                mapped = _map_instagram_item(item)
                if not mapped:
                    continue
                key = mapped.get("permalink") or mapped.get("id") or mapped.get("caption")
                if key in seen:
                    continue
                seen.add(str(key))
                normalized.append(mapped)
                if len(normalized) >= max_results:
                    break
            return normalized or _fallback_hashtag_results(query, max_results)
    except Exception as e:
        logger.warning("Instagram search failed: %s", e)
        return _fallback_hashtag_results(query, max_results)
