import os
import httpx

_connection_settings = None


async def _get_access_token() -> str:
    global _connection_settings

    if (
        _connection_settings
        and _connection_settings.get("settings", {}).get("expires_at")
    ):
        import datetime
        expires = _connection_settings["settings"]["expires_at"]
        from datetime import datetime as dt, timezone
        if dt.fromisoformat(expires.replace("Z", "+00:00")).timestamp() > dt.now(timezone.utc).timestamp():
            return _connection_settings["settings"]["access_token"]

    hostname = os.environ.get("REPLIT_CONNECTORS_HOSTNAME")
    repl_identity = os.environ.get("REPL_IDENTITY")
    web_repl_renewal = os.environ.get("WEB_REPL_RENEWAL")

    if repl_identity:
        x_replit_token = f"repl {repl_identity}"
    elif web_repl_renewal:
        x_replit_token = f"depl {web_repl_renewal}"
    else:
        raise RuntimeError("X-Replit-Token not found for repl/depl")

    if not hostname:
        raise RuntimeError("REPLIT_CONNECTORS_HOSTNAME not set")

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"https://{hostname}/api/v2/connection",
            params={"include_secrets": "true", "connector_names": "youtube"},
            headers={
                "Accept": "application/json",
                "X-Replit-Token": x_replit_token,
            },
        )
        resp.raise_for_status()
        data = resp.json()

    items = data.get("items", [])
    if not items:
        raise RuntimeError("YouTube not connected")

    _connection_settings = items[0]
    settings = _connection_settings.get("settings", {})
    token = settings.get("access_token") or (
        settings.get("oauth", {}).get("credentials", {}).get("access_token")
    )

    if not token:
        raise RuntimeError("YouTube access token not found")

    return token


async def youtube_search(query: str, max_results: int = 5) -> list[dict]:
    try:
        token = await _get_access_token()
    except RuntimeError:
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
            },
            headers={"Authorization": f"Bearer {token}"},
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
