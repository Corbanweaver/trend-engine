import httpx
import re
import json
import logging
from urllib.parse import quote

logger = logging.getLogger(__name__)


async def medium_search(query: str, max_results: int = 6) -> list[dict]:
    results = []

    try:
        results = await _medium_tag_feed(query, max_results)
    except Exception as e:
        logger.warning("Medium tag feed failed: %s", e)

    if not results:
        try:
            results = await _medium_scrape_search(query, max_results)
        except Exception as e:
            logger.warning("Medium scrape search failed: %s", e)

    if not results:
        results = _generate_medium_links(query, max_results)

    return results


async def _medium_tag_feed(query: str, max_results: int) -> list[dict]:
    results = []
    tag = query.lower().replace(" ", "-")

    async with httpx.AsyncClient(
        timeout=12.0,
        headers={
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        follow_redirects=True,
    ) as client:
        resp = await client.get(f"https://medium.com/tag/{tag}")
        if resp.status_code == 200:
            text = resp.text
            results = _parse_medium_html(text, max_results, query)

    return results


def _parse_medium_html(text: str, max_results: int, query: str) -> list[dict]:
    results = []

    apollo_match = re.search(
        r'window\.__APOLLO_STATE__\s*=\s*(\{.*?\});?\s*</script>',
        text,
        re.DOTALL,
    )
    if apollo_match:
        try:
            apollo = json.loads(apollo_match.group(1))
            for key, val in apollo.items():
                if not isinstance(val, dict):
                    continue
                if val.get("__typename") == "Post" or "title" in val:
                    title = val.get("title", "")
                    if not title:
                        continue
                    slug = val.get("slug") or val.get("uniqueSlug") or ""
                    post_id = val.get("id") or (key.split(":")[1] if ":" in key else "")
                    creator = val.get("creator") or {}
                    author = ""
                    if isinstance(creator, dict):
                        author = creator.get("name", "")
                    elif isinstance(creator, str) and creator in apollo:
                        author = apollo[creator].get("name", "")

                    claps = val.get("clapCount") or val.get("totalClapCount") or 0
                    reading_time = val.get("readingTime") or 0
                    subtitle = val.get("subtitle") or (val.get("previewContent", {}).get("subtitle", "") if isinstance(val.get("previewContent"), dict) else "")

                    image_id = val.get("previewImage", {}).get("id", "") if isinstance(val.get("previewImage"), dict) else ""
                    image_url = f"https://miro.medium.com/v2/resize:fit:400/{image_id}" if image_id else ""

                    url = f"https://medium.com/p/{post_id}" if post_id else f"https://medium.com/tag/{query.lower().replace(' ', '-')}"

                    results.append({
                        "title": title[:200],
                        "url": url,
                        "author": author,
                        "claps": int(claps) if claps else 0,
                        "reading_time": round(float(reading_time), 1) if reading_time else 0,
                        "subtitle": (subtitle or "")[:200],
                        "image_url": image_url,
                    })
                    if len(results) >= max_results:
                        break
        except (json.JSONDecodeError, TypeError, KeyError):
            pass

    if not results:
        article_pattern = re.findall(
            r'<article[^>]*>(.*?)</article>',
            text,
            re.DOTALL,
        )
        for article_html in article_pattern[:max_results]:
            title_match = re.search(r'<h[23][^>]*>(.*?)</h[23]>', article_html, re.DOTALL)
            link_match = re.search(r'href="(/[^"]*?[a-f0-9]{10,}[^"]*)"', article_html)
            author_match = re.search(r'data-testid="authorName"[^>]*>(.*?)<', article_html, re.DOTALL)
            img_match = re.search(r'<img[^>]+src="(https://miro\.medium\.com/[^"]+)"', article_html)

            if title_match:
                title = re.sub(r'<[^>]+>', '', title_match.group(1)).strip()
                link = ""
                if link_match:
                    link = "https://medium.com" + link_match.group(1)
                author = re.sub(r'<[^>]+>', '', author_match.group(1)).strip() if author_match else ""
                image_url = img_match.group(1) if img_match else ""

                results.append({
                    "title": title[:200],
                    "url": link or f"https://medium.com/tag/{query.lower().replace(' ', '-')}",
                    "author": author,
                    "claps": 0,
                    "reading_time": 0,
                    "subtitle": "",
                    "image_url": image_url,
                })

    return results[:max_results]


async def _medium_scrape_search(query: str, max_results: int) -> list[dict]:
    results = []
    async with httpx.AsyncClient(
        timeout=12.0,
        headers={
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            "Accept": "text/html",
        },
        follow_redirects=True,
    ) as client:
        resp = await client.get(
            f"https://medium.com/search?q={quote(query)}",
        )
        if resp.status_code == 200:
            results = _parse_medium_html(resp.text, max_results, query)
    return results


def _generate_medium_links(query: str, max_results: int) -> list[dict]:
    tag = query.lower().replace(" ", "-")
    searches = [
        (query, f"https://medium.com/tag/{tag}"),
        (f"{query} guide", f"https://medium.com/search?q={quote(query + ' guide')}"),
        (f"{query} tips", f"https://medium.com/search?q={quote(query + ' tips')}"),
        (f"{query} trends", f"https://medium.com/search?q={quote(query + ' trends')}"),
    ]

    results = []
    for title, url in searches[:max_results]:
        results.append({
            "title": f"Browse Medium: {title}",
            "url": url,
            "author": "Medium",
            "claps": 0,
            "reading_time": 0,
            "subtitle": f"Discover {query} articles on Medium",
            "image_url": "",
        })
    return results
