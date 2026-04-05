import feedparser
import httpx
from urllib.parse import quote


async def google_news_search(query: str, max_results: int = 10) -> list[dict]:
    encoded = quote(query)
    url = f"https://news.google.com/rss/search?q={encoded}&hl=en-US&gl=US&ceid=US:en"

    results = []
    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            resp = await client.get(url)
            if resp.status_code != 200:
                return results

        feed = feedparser.parse(resp.text)

        for entry in feed.entries[:max_results]:
            source = ""
            if hasattr(entry, "source") and hasattr(entry.source, "title"):
                source = entry.source.title

            results.append({
                "title": entry.get("title", ""),
                "link": entry.get("link", ""),
                "published": entry.get("published", ""),
                "source": source,
                "summary": (entry.get("summary", "") or "")[:200],
            })
    except Exception:
        pass

    return results


async def google_news_trending(niche: str, max_results: int = 10) -> list[dict]:
    return await google_news_search(f"{niche} trending", max_results)
