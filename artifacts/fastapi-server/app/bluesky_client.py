import logging
from datetime import datetime, timedelta, timezone
from urllib.parse import quote

import httpx

logger = logging.getLogger(__name__)

BLUESKY_SEARCH_URLS = [
    "https://api.bsky.app/xrpc/app.bsky.feed.searchPosts",
    "https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts",
]


def _as_dict(value: object) -> dict:
    return value if isinstance(value, dict) else {}


def _to_int(value: object) -> int:
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return 0


def _first_str(item: dict, keys: list[str]) -> str:
    for key in keys:
        value = item.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return ""


def _image_from_embed(embed: object) -> str:
    data = _as_dict(embed)
    images = data.get("images")
    if isinstance(images, list):
        for image in images:
            image_data = _as_dict(image)
            url = _first_str(image_data, ["fullsize", "thumb", "thumbnail", "url"])
            if url:
                return url

    external = _as_dict(data.get("external"))
    url = _first_str(external, ["thumb", "thumbnail", "url"])
    if url:
        return url

    record = _as_dict(data.get("record"))
    return _image_from_embed(record.get("embed")) if record else ""


def _post_url(post: dict) -> str:
    author = _as_dict(post.get("author"))
    handle = _first_str(author, ["handle"])
    uri = _first_str(post, ["uri"])
    rkey = uri.rstrip("/").split("/")[-1] if uri.startswith("at://") else ""
    if handle and rkey:
        return f"https://bsky.app/profile/{quote(handle, safe='.-_')}/post/{quote(rkey, safe='')}"
    return _first_str(post, ["url", "permalink"])


def _map_bluesky_post(post: dict) -> dict | None:
    record = _as_dict(post.get("record"))
    author = _as_dict(post.get("author"))
    text = _first_str(record, ["text"]) or _first_str(post, ["text", "title"])
    url = _post_url(post)
    post_id = _first_str(post, ["cid", "uri", "id"]) or url or text
    if not (text or url):
        return None

    return {
        "id": post_id,
        "title": text[:240] or "Bluesky post",
        "author": _first_str(author, ["displayName", "handle"]) or "Bluesky",
        "handle": _first_str(author, ["handle"]),
        "url": url,
        "snippet": text[:280],
        "thumbnail_url": _image_from_embed(post.get("embed")),
        "created_at": _first_str(record, ["createdAt"]) or _first_str(post, ["indexedAt"]),
        "likes": _to_int(post.get("likeCount")),
        "reposts": _to_int(post.get("repostCount")),
        "replies": _to_int(post.get("replyCount")),
        "quotes": _to_int(post.get("quoteCount")),
    }


async def bluesky_search(
    query: str,
    max_results: int = 6,
    days_back: int = 7,
) -> list[dict]:
    """Search public Bluesky posts through the official AppView API."""
    cleaned = query.strip()
    if not cleaned:
        return []

    since = datetime.now(timezone.utc) - timedelta(days=max(days_back, 1))
    params = {
        "q": cleaned,
        "limit": max(1, min(max_results, 25)),
        "sort": "top",
        "since": since.isoformat().replace("+00:00", "Z"),
    }
    payload: object = {}
    async with httpx.AsyncClient(
        timeout=10.0,
        headers={"User-Agent": "TrendEngine/1.0"},
        follow_redirects=True,
    ) as client:
        for url in BLUESKY_SEARCH_URLS:
            try:
                response = await client.get(url, params=params)
                if response.status_code >= 400:
                    logger.warning(
                        "Bluesky search at %s failed with HTTP %s.",
                        url,
                        response.status_code,
                    )
                    continue
                payload = response.json()
                break
            except Exception as exc:
                logger.warning("Bluesky search at %s failed for '%s': %s", url, cleaned, exc)
    if not isinstance(payload, dict):
        return []

    posts = payload.get("posts") if isinstance(payload, dict) else []
    if not isinstance(posts, list):
        return []

    results: list[dict] = []
    seen: set[str] = set()
    for post in posts:
        if not isinstance(post, dict):
            continue
        mapped = _map_bluesky_post(post)
        if not mapped:
            continue
        key = str(mapped.get("url") or mapped.get("id") or mapped.get("title"))
        if key in seen:
            continue
        seen.add(key)
        results.append(mapped)
        if len(results) >= max_results:
            break
    return results
