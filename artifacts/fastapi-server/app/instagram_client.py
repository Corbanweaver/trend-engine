import os
from urllib.parse import quote

import httpx


async def search_instagram(query: str, max_results: int = 5) -> list[dict]:
    token = os.environ.get("APIFY_API_TOKEN", "").strip()
    if not token:
        return []
    try:
        tag = query.strip().lstrip("#").lower()
        if not tag:
            return []
        tag_in_url = quote(tag, safe="")
        actor_input = {
            "directUrls": [
                f"https://www.instagram.com/explore/tags/{tag_in_url}/",
            ],
            "resultsType": "posts",
            "resultsLimit": max_results,
            "addParentData": False,
        }
        url = f"https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items"
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(url, params={"token": token}, json=actor_input)
            print(f"Instagram Apify status: {resp.status_code}")
            print(f"Instagram Apify response: {resp.text[:500]}")
            if resp.status_code != 200:
                return []
            data = resp.json()
            return data[:max_results] if isinstance(data, list) else []
    except Exception as e:
        print(f"Instagram error: {e}")
        return []
