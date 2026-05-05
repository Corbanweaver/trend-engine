import logging
from urllib.parse import quote

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


async def search_x(query: str, max_results: int = 5) -> list[dict]:
    """Find X/Twitter posts via public search results, with safe search-link fallback."""

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
