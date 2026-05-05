import logging
from urllib.parse import quote

from app.apify_client import common_search_input, configured_actor_id, run_actor_items
from app.web_search_client import web_search

logger = logging.getLogger(__name__)


def _clean_title(title: str) -> str:
    cleaned = title.strip()
    for suffix in [" / X", " | X", " on X", " / Twitter", " | Twitter"]:
        if cleaned.endswith(suffix):
            cleaned = cleaned[: -len(suffix)].strip()
    return cleaned or "X post"


def _is_x_url(url: str) -> bool:
    lower = url.lower()
    return (
        ("x.com/" in lower or "twitter.com/" in lower)
        and "/search" not in lower
        and "/hashtag/" not in lower
        and "/intent/" not in lower
    )


def _fallback_x_links(query: str, max_results: int) -> list[dict]:
    searches = [query]
    words = query.strip().split()
    if len(words) >= 2:
        searches.extend([f"{query} viral", f"{query} thread"])
    else:
        searches.extend([f"{query} viral", f"{query} tips"])

    return [
        {
            "id": f"x-search-{i}",
            "title": f"Search X: {sq}",
            "author": "X Search",
            "url": f"https://x.com/search?q={quote(sq)}&src=typed_query&f=live",
            "snippet": "",
            "thumbnail_url": "",
        }
        for i, sq in enumerate(searches[:max_results])
    ]


async def _run_apify_x_actor(
    query: str,
    max_results: int,
    timeout_seconds: float | None = None,
) -> list[dict]:
    actor_id = configured_actor_id("APIFY_X_ACTOR_ID") or configured_actor_id("APIFY_TWITTER_ACTOR_ID")
    if not actor_id:
        return []
    actor_input = {
        **common_search_input(query, max_results),
        "searchMode": "live",
        "sort": "Latest",
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
        mapped = _map_apify_x_item(item)
        if not mapped:
            continue
        key = mapped.get("url") or mapped.get("id") or mapped.get("title")
        if key in seen:
            continue
        seen.add(str(key))
        results.append(mapped)
        if len(results) >= max_results:
            break
    return results


def _map_apify_x_item(item: dict) -> dict | None:
    post_id = item.get("id") or item.get("tweetId") or item.get("tweet_id")
    title = (
        item.get("text")
        or item.get("full_text")
        or item.get("title")
        or item.get("description")
        or item.get("snippet")
        or ""
    )
    author_obj = item.get("author") if isinstance(item.get("author"), dict) else {}
    author = (
        item.get("author")
        if isinstance(item.get("author"), str)
        else author_obj.get("userName") or author_obj.get("username") or author_obj.get("name")
    )
    url = item.get("url") or item.get("tweetUrl") or item.get("tweet_url") or ""
    if not url and post_id and author:
        url = f"https://x.com/{author}/status/{post_id}"

    thumbnail = (
        item.get("thumbnail_url")
        or item.get("thumbnailUrl")
        or item.get("image")
        or item.get("imageUrl")
        or ""
    )
    media = item.get("media")
    if not thumbnail and isinstance(media, list):
        for entry in media:
            if isinstance(entry, dict):
                thumbnail = str(entry.get("media_url_https") or entry.get("url") or entry.get("preview_image_url") or "")
                if thumbnail:
                    break

    if not (title or url):
        return None
    return {
        "id": str(post_id or url or title),
        "title": _clean_title(str(title))[:240],
        "author": str(author or "X"),
        "url": str(url),
        "snippet": str(title)[:280],
        "thumbnail_url": str(thumbnail),
        "likes": item.get("likes") or item.get("likeCount") or item.get("like_count") or 0,
        "retweets": item.get("retweets") or item.get("retweetCount") or item.get("retweet_count") or 0,
        "replies": item.get("replies") or item.get("replyCount") or item.get("reply_count") or 0,
        "views": item.get("views") or item.get("viewCount") or item.get("view_count") or 0,
    }


async def search_x(
    query: str,
    max_results: int = 5,
    timeout_seconds: float | None = None,
) -> list[dict]:
    """Find X/Twitter posts via public search results, with safe search-link fallback."""

    apify_results = await _run_apify_x_actor(
        query,
        max_results,
        timeout_seconds=timeout_seconds,
    )
    if apify_results:
        return apify_results

    results: list[dict] = []
    seen: set[str] = set()
    search_queries = [
        f"site:x.com {query}",
        f"site:twitter.com {query}",
    ]

    for search_query in search_queries:
        try:
            rows = await web_search(search_query, max_results=max_results * 2)
        except Exception as e:
            logger.warning("X organic search failed for '%s': %s", search_query, e)
            continue

        for row in rows:
            if not isinstance(row, dict):
                continue
            url = str(row.get("url") or "").strip()
            if not _is_x_url(url) or url in seen:
                continue
            seen.add(url)
            results.append(
                {
                    "id": url,
                    "title": _clean_title(str(row.get("title") or "")),
                    "author": "X",
                    "url": url,
                    "snippet": str(row.get("snippet") or "")[:280],
                    "thumbnail_url": "",
                }
            )
            if len(results) >= max_results:
                return results

    return results or _fallback_x_links(query, max_results)
