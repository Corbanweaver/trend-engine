import httpx

HN_API = "https://hacker-news.firebaseio.com/v0"


async def hn_top_stories(max_results: int = 10) -> list[dict]:
    results = []
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"{HN_API}/topstories.json")
            resp.raise_for_status()
            story_ids = resp.json()[:max_results]

            for sid in story_ids:
                r = await client.get(f"{HN_API}/item/{sid}.json")
                if r.status_code == 200:
                    item = r.json()
                    if item and item.get("type") == "story":
                        results.append({
                            "id": item.get("id", 0),
                            "title": item.get("title", ""),
                            "url": item.get("url", ""),
                            "score": item.get("score", 0),
                            "comments": item.get("descendants", 0),
                            "author": item.get("by", ""),
                            "hn_link": f"https://news.ycombinator.com/item?id={item.get('id', 0)}",
                        })
    except Exception:
        pass

    return results


async def hn_search(query: str, max_results: int = 10) -> list[dict]:
    results = []
    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            resp = await client.get(
                "https://hn.algolia.com/api/v1/search",
                params={
                    "query": query,
                    "tags": "story",
                    "hitsPerPage": max_results,
                },
            )
            resp.raise_for_status()
            hits = resp.json().get("hits", [])

            for hit in hits:
                results.append({
                    "id": hit.get("objectID", ""),
                    "title": hit.get("title", ""),
                    "url": hit.get("url", ""),
                    "score": hit.get("points", 0),
                    "comments": hit.get("num_comments", 0),
                    "author": hit.get("author", ""),
                    "hn_link": f"https://news.ycombinator.com/item?id={hit.get('objectID', '')}",
                })
    except Exception:
        pass

    return results
