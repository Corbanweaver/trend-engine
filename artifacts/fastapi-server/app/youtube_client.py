import os
import httpx

YOUTUBE_API_KEY = os.environ.get("YOUTUBE_API_KEY", "")


async def youtube_search(query: str, max_results: int = 5) -> list[dict]:
    api_key = YOUTUBE_API_KEY or os.environ.get("YOUTUBE_API_KEY", "")
    if not api_key:
        return []

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(
            "https://www.googleapis.com/youtube/v3/search",
            params={
                "part": "snippet",
                "q": query,
                "type": "video",
                "maxResults": max_results,
                "order": "relevance",
                "videoDuration": "short",
                "key": api_key,
            },
        )

        if resp.status_code == 403:
            error_data = resp.json()
            errors = error_data.get("error", {}).get("errors", [])
            if any(e.get("reason") == "quotaExceeded" for e in errors):
                return _quota_exceeded_placeholder(query)
            resp.raise_for_status()

        resp.raise_for_status()
        data = resp.json()

    results = []
    for item in data.get("items", []):
        snippet = item.get("snippet", {})
        video_id = item.get("id", {}).get("videoId", "")
        results.append({
            "video_id": video_id,
            "title": snippet.get("title", ""),
            "channel": snippet.get("channelTitle", ""),
            "thumbnail": snippet.get("thumbnails", {}).get("high", {}).get("url", ""),
            "published_at": snippet.get("publishedAt", ""),
            "url": f"https://www.youtube.com/watch?v={video_id}",
            "embed_url": f"https://www.youtube.com/embed/{video_id}",
        })

    return results


def _quota_exceeded_placeholder(query: str) -> list[dict]:
    search_url = f"https://www.youtube.com/results?search_query={query.replace(' ', '+')}&sp=EgIYAQ%253D%253D"
    return [{
        "video_id": "",
        "title": f"Search YouTube for: {query}",
        "channel": "YouTube API quota exceeded — resets daily",
        "thumbnail": "",
        "published_at": "",
        "url": search_url,
        "embed_url": "",
        "quota_exceeded": True,
    }]


async def youtube_trending_videos(niche: str, max_results: int = 10) -> list[dict]:
    query = f"{niche} short form video tips"
    return await youtube_search(query, max_results)
