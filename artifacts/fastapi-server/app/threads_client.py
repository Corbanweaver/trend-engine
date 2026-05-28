import logging
from urllib.parse import quote

from app.apify_client import common_search_input, configured_actor_id, run_actor_items
from app.web_search_client import web_search

logger = logging.getLogger(__name__)


def _to_int(value: object) -> int:
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return 0


def _first_str(item: dict, keys: list[str]) -> str:
    for key in keys:
        value = item.get(key)
        if value is not None and value != "":
            if isinstance(value, (dict, list)):
                continue
            return str(value).strip()
    return ""


def _is_threads_url(url: str) -> bool:
    lower = url.lower()
    if "threads.net/" not in lower:
        return False
    blocked = ["/login", "/privacy", "/terms", "/about", "/download"]
    if any(part in lower for part in blocked):
        return False
    return "/post/" in lower or "/t/" in lower


def _normalize_threads_url(url: str) -> str:
    normalized = url.rstrip()
    for suffix in ["/embed/", "/embed"]:
        if normalized.endswith(suffix):
            return normalized[: -len(suffix)]
    return normalized


def _fallback_threads_links(query: str, max_results: int) -> list[dict]:
    searches = [query]
    words = query.strip().split()
    if len(words) >= 2:
        searches.extend([f"{query} viral", f"{query} discussion"])
    else:
        searches.extend([f"{query} viral", f"{query} tips"])

    return [
        {
            "id": f"threads-search-{i}",
            "title": f"Search Threads: {sq}",
            "author": "Threads Search",
            "url": f"https://www.threads.net/search?q={quote(sq)}",
            "snippet": "",
            "thumbnail_url": "",
            "source": "fallback-search-link",
        }
        for i, sq in enumerate(searches[:max_results])
    ]


async def _run_apify_threads_actor(
    query: str,
    max_results: int,
    timeout_seconds: float | None = None,
) -> list[dict]:
    actor_id = configured_actor_id("APIFY_THREADS_ACTOR_ID")
    if not actor_id:
        return []
    actor_input = {
        **common_search_input(query, max_results),
        "startUrls": [{"url": f"https://www.threads.net/search?q={quote(query)}"}],
    }
    data = await run_actor_items(
        actor_id,
        actor_input,
        max_results=max_results,
        timeout_seconds=timeout_seconds,
    )
    results: list[dict] = []
    seen: set[str] = set()
    for item in data:
        mapped = _map_threads_item(item)
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


def _map_threads_item(item: dict) -> dict | None:
    author_obj = item.get("author") if isinstance(item.get("author"), dict) else {}
    user_obj = item.get("user") if isinstance(item.get("user"), dict) else {}
    author = (
        _first_str(item, ["author", "username", "userName", "handle"])
        or _first_str(author_obj, ["username", "userName", "handle", "name"])
        or _first_str(user_obj, ["username", "userName", "handle", "name"])
    )
    post_id = _first_str(item, ["id", "postId", "post_id", "pk", "code"])
    text = _first_str(item, ["text", "caption", "description", "title", "snippet"])
    url = _first_str(item, ["url", "postUrl", "post_url", "permalink", "link"])
    if not url and author and post_id:
        url = f"https://www.threads.net/@{author}/post/{post_id}"
    url = _normalize_threads_url(url)

    thumbnail = _first_str(
        item,
        [
            "thumbnail_url",
            "thumbnailUrl",
            "image_url",
            "imageUrl",
            "displayUrl",
            "media_url",
            "mediaUrl",
        ],
    )
    media = item.get("media")
    if not thumbnail and isinstance(media, list):
        for entry in media:
            if isinstance(entry, dict):
                thumbnail = _first_str(
                    entry,
                    ["thumbnail_url", "thumbnailUrl", "image_url", "imageUrl", "url"],
                )
                if thumbnail:
                    break

    if not (text or url):
        return None
    return {
        "id": post_id or url or text,
        "title": text[:240] or "Threads post",
        "author": author or "Threads",
        "url": url,
        "snippet": text[:280],
        "thumbnail_url": thumbnail,
        "created_at": _first_str(item, ["timestamp", "createdAt", "created_at", "takenAt"]),
        "likes": _to_int(item.get("likes") or item.get("likeCount") or item.get("like_count")),
        "replies": _to_int(item.get("replies") or item.get("replyCount") or item.get("reply_count")),
        "reposts": _to_int(item.get("reposts") or item.get("repostCount") or item.get("shareCount")),
        "views": _to_int(item.get("views") or item.get("viewCount")),
    }


async def threads_search(
    query: str,
    max_results: int = 5,
    timeout_seconds: float | None = None,
) -> list[dict]:
    apify_results = await _run_apify_threads_actor(
        query,
        max_results,
        timeout_seconds=timeout_seconds,
    )
    if apify_results:
        return apify_results

    results: list[dict] = []
    seen: set[str] = set()
    search_queries = [
        f"site:threads.net/@ {query}",
        f"site:threads.net {query} threads",
    ]

    for search_query in search_queries:
        try:
            rows = await web_search(search_query, max_results=max_results * 2)
        except Exception as exc:
            logger.warning("Threads organic search failed for '%s': %s", search_query, exc)
            continue

        for row in rows:
            if not isinstance(row, dict):
                continue
            url = str(row.get("url") or "").strip()
            if not _is_threads_url(url) or url in seen:
                continue
            url = _normalize_threads_url(url)
            seen.add(url)
            title = str(row.get("title") or "").strip()
            snippet = str(row.get("snippet") or "").strip()
            results.append(
                {
                    "id": url,
                    "title": (title or snippet or "Threads post")[:240],
                    "author": "Threads",
                    "url": url,
                    "snippet": snippet[:280],
                    "thumbnail_url": "",
                    "source": "web-search",
                }
            )
            if len(results) >= max_results:
                return results

    return results or _fallback_threads_links(query, max_results)
