import os
from urllib.parse import quote

import httpx

APIFY_API_BASE = "https://api.apify.com/v2"
TIKTOK_ACTOR_ID = "clockworks/free-tiktok-scraper"


async def _run_apify_tiktok_actor(query: str, max_results: int) -> list[dict]:
    token = os.environ.get("APIFY_API_TOKEN", "").strip()
    if not token:
        return []

    # Keep the input broad and minimal; actor schemas can evolve.
    # We submit multiple commonly accepted fields to improve compatibility.
    actor_input = {
        "query": query,
        "search": query,
        "keyword": query,
        "searchTerms": [query],
        "maxItems": max_results,
        "resultsPerPage": max_results,
    }

    url = f"{APIFY_API_BASE}/acts/{TIKTOK_ACTOR_ID}/run-sync-get-dataset-items"
    params = {"token": token, "limit": max_results}

    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            resp = await client.post(url, params=params, json=actor_input)
            resp.raise_for_status()
            data = resp.json()
            return data if isinstance(data, list) else []
    except Exception:
        return []


def _to_int(value: object) -> int:
    try:
        return int(float(value))  # supports numeric strings
    except (TypeError, ValueError):
        return 0


def _map_apify_tiktok_item(item: dict) -> dict:
    author_obj = item.get("authorMeta") if isinstance(item.get("authorMeta"), dict) else {}
    stats_obj = item.get("stats") if isinstance(item.get("stats"), dict) else {}
    video_obj = item.get("videoMeta") if isinstance(item.get("videoMeta"), dict) else {}

    video_id = str(item.get("id") or item.get("videoId") or "")
    author = (
        author_obj.get("name")
        or item.get("author")
        or item.get("authorUsername")
        or item.get("authorName")
        or ""
    )
    description = (item.get("text") or item.get("desc") or item.get("description") or "")[:200]
    cover = (
        item.get("webVideoUrl")
        or item.get("cover")
        or item.get("thumbnail")
        or video_obj.get("coverUrl")
        or ""
    )
    url = item.get("webVideoUrl") or item.get("url") or ""
    if not url and video_id:
        if author:
            url = f"https://www.tiktok.com/@{author}/video/{video_id}"
        else:
            url = f"https://www.tiktok.com/video/{video_id}"

    return {
        "id": video_id,
        "description": description,
        "author": str(author),
        "author_nickname": str(author_obj.get("nickName") or item.get("authorNickname") or ""),
        "play_count": _to_int(
            item.get("playCount")
            or item.get("views")
            or stats_obj.get("playCount")
            or stats_obj.get("viewCount")
        ),
        "like_count": _to_int(item.get("diggCount") or item.get("likes") or stats_obj.get("diggCount")),
        "comment_count": _to_int(item.get("commentCount") or item.get("comments") or stats_obj.get("commentCount")),
        "share_count": _to_int(item.get("shareCount") or item.get("shares") or stats_obj.get("shareCount")),
        "cover": str(cover),
        "url": str(url),
    }


async def tiktok_trending_search(query: str, max_results: int = 6) -> list[dict]:
    raw_items = await _run_apify_tiktok_actor(query, max_results)
    results = [_map_apify_tiktok_item(item) for item in raw_items[:max_results] if isinstance(item, dict)]
    # Preserve older behavior: if provider returns nothing, keep a soft fallback.
    results = [r for r in results if r.get("id") or r.get("url")]

    if not results:
        results = await _creative_center_fallback(query, max_results)

    return results


async def _creative_center_fallback(query: str, max_results: int) -> list[dict]:
    results = []
    try:
        async with httpx.AsyncClient(
            timeout=10.0,
            headers={
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
                "Accept": "application/json",
            },
            follow_redirects=True,
        ) as client:
            resp = await client.get(
                "https://ads.tiktok.com/creative_radar_api/v1/popular_trend/hashtag/list",
                params={
                    "page": 1,
                    "limit": max_results,
                    "period": 7,
                    "country_code": "US",
                    "sort_by": "popular",
                },
            )
            if resp.status_code == 200:
                data = resp.json()
                hashtags = data.get("data", {}).get("list", [])
                for tag in hashtags:
                    name = tag.get("hashtag_name", "")
                    if query.lower() not in name.lower() and name.lower() not in query.lower():
                        continue
                    results.append({
                        "id": str(tag.get("hashtag_id", "")),
                        "description": f"#{name} — {format_count(tag.get('publish_cnt', 0))} videos, {format_count(tag.get('video_view', 0))} views",
                        "author": "TikTok Trending",
                        "author_nickname": "TikTok Creative Center",
                        "play_count": tag.get("video_view", 0),
                        "like_count": 0,
                        "comment_count": 0,
                        "share_count": 0,
                        "cover": "",
                        "url": f"https://www.tiktok.com/tag/{name}",
                    })
    except Exception:
        pass

    if not results:
        tag = query.replace(" ", "").lower()
        words = query.strip().split()
        searches = [query]
        if len(words) >= 2:
            searches.append(f"{query} tips")
            searches.append(f"{query} viral")
        else:
            searches.append(f"{query} tips")
            searches.append(f"{query} motivation")
            searches.append(f"{query} viral")

        for i, sq in enumerate(searches[:max_results]):
            results.append({
                "id": f"search-{i}",
                "description": f"Browse TikTok: '{sq}'",
                "author": "TikTok Search",
                "author_nickname": "",
                "play_count": 0,
                "like_count": 0,
                "comment_count": 0,
                "share_count": 0,
                "cover": "",
                "url": f"https://www.tiktok.com/search?q={quote(sq)}",
            })

    return results


async def tiktok_hashtag_info(hashtag: str) -> dict:
    tag = hashtag.strip("#").lower()
    items = await _run_apify_tiktok_actor(f"#{tag}", max_results=20)
    if not items:
        return {"hashtag": tag, "views": 0, "videos": 0}

    total_views = 0
    for item in items:
        if not isinstance(item, dict):
            continue
        stats_obj = item.get("stats") if isinstance(item.get("stats"), dict) else {}
        total_views += _to_int(
            item.get("playCount")
            or item.get("views")
            or stats_obj.get("playCount")
            or stats_obj.get("viewCount")
        )

    return {"hashtag": tag, "views": total_views, "videos": len(items)}


def format_count(n: int) -> str:
    if n >= 1_000_000_000:
        return f"{n / 1_000_000_000:.1f}B"
    if n >= 1_000_000:
        return f"{n / 1_000_000:.1f}M"
    if n >= 1_000:
        return f"{n / 1_000:.1f}K"
    return str(n)
