import httpx
from urllib.parse import quote


async def web_search(query: str, max_results: int = 10) -> list[dict]:
    results = []

    try:
        results = await _duckduckgo_search(query, max_results)
    except Exception:
        pass

    if not results:
        try:
            results = await _google_scrape_fallback(query, max_results)
        except Exception:
            pass

    return results


async def _duckduckgo_search(query: str, max_results: int) -> list[dict]:
    results = []
    async with httpx.AsyncClient(
        timeout=10.0,
        headers={
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        },
        follow_redirects=True,
    ) as client:
        resp = await client.get(
            "https://html.duckduckgo.com/html/",
            params={"q": query},
        )
        if resp.status_code == 200:
            text = resp.text
            import re
            links = re.findall(
                r'<a[^>]+class="result__a"[^>]*href="([^"]*)"[^>]*>(.*?)</a>',
                text,
                re.DOTALL,
            )
            snippets = re.findall(
                r'<a[^>]+class="result__snippet"[^>]*>(.*?)</a>',
                text,
                re.DOTALL,
            )

            for i, (url, title) in enumerate(links[:max_results]):
                title_clean = re.sub(r"<[^>]+>", "", title).strip()
                snippet = ""
                if i < len(snippets):
                    snippet = re.sub(r"<[^>]+>", "", snippets[i]).strip()

                if url.startswith("//"):
                    url = "https:" + url
                if "/l/?" in url or "uddg=" in url:
                    import urllib.parse
                    parsed = urllib.parse.parse_qs(urllib.parse.urlparse(url).query)
                    extracted = parsed.get("uddg", [None])[0]
                    if extracted:
                        url = extracted

                results.append({
                    "title": title_clean,
                    "url": url,
                    "snippet": snippet[:200],
                    "source": "DuckDuckGo",
                })

    return results


async def _google_scrape_fallback(query: str, max_results: int) -> list[dict]:
    return []


async def search_trending_content(niche: str, max_results: int = 10) -> list[dict]:
    queries = [
        f"{niche} trending topics 2025",
        f"{niche} viral content ideas",
    ]

    all_results = []
    seen_urls = set()

    for q in queries:
        results = await web_search(q, max_results=max_results)
        for r in results:
            if r["url"] not in seen_urls:
                seen_urls.add(r["url"])
                all_results.append(r)

    return all_results[:max_results]
