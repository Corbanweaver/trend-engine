import httpx
import json
import re
from urllib.parse import quote


async def tiktok_trending_search(query: str, max_results: int = 6) -> list[dict]:
    results = []
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.tiktok.com/",
    }

    try:
        async with httpx.AsyncClient(
            timeout=15.0,
            headers=headers,
            follow_redirects=True,
        ) as client:
            encoded = quote(query)
            resp = await client.get(
                f"https://www.tiktok.com/search?q={encoded}",
            )
            if resp.status_code == 200:
                text = resp.text
                matches = re.findall(
                    r'"ItemModule"\s*:\s*(\{.+?\})\s*,\s*"UserModule"',
                    text,
                    re.DOTALL,
                )
                if matches:
                    try:
                        items_data = json.loads(matches[0])
                        for vid_id, item in list(items_data.items())[:max_results]:
                            author = item.get("author", "")
                            stats = item.get("stats", {})
                            video_info = item.get("video", {})
                            results.append({
                                "id": vid_id,
                                "description": (item.get("desc", "") or "")[:200],
                                "author": author if isinstance(author, str) else author.get("uniqueId", ""),
                                "author_nickname": item.get("nickname", ""),
                                "play_count": int(stats.get("playCount", 0)),
                                "like_count": int(stats.get("diggCount", 0)),
                                "comment_count": int(stats.get("commentCount", 0)),
                                "share_count": int(stats.get("shareCount", 0)),
                                "cover": video_info.get("cover", "") if isinstance(video_info, dict) else "",
                                "url": f"https://www.tiktok.com/@{author}/video/{vid_id}" if isinstance(author, str) else f"https://www.tiktok.com/video/{vid_id}",
                            })
                    except (json.JSONDecodeError, TypeError):
                        pass

                if not results:
                    sigi_match = re.search(
                        r'<script id="SIGI_STATE"[^>]*>(.*?)</script>',
                        text,
                        re.DOTALL,
                    )
                    if sigi_match:
                        try:
                            sigi = json.loads(sigi_match.group(1))
                            item_module = sigi.get("ItemModule", {})
                            for vid_id, item in list(item_module.items())[:max_results]:
                                author = item.get("author", "")
                                stats = item.get("stats", {})
                                video_info = item.get("video", {})
                                results.append({
                                    "id": vid_id,
                                    "description": (item.get("desc", "") or "")[:200],
                                    "author": author if isinstance(author, str) else "",
                                    "author_nickname": item.get("nickname", ""),
                                    "play_count": int(stats.get("playCount", 0)),
                                    "like_count": int(stats.get("diggCount", 0)),
                                    "comment_count": int(stats.get("commentCount", 0)),
                                    "share_count": int(stats.get("shareCount", 0)),
                                    "cover": video_info.get("cover", "") if isinstance(video_info, dict) else "",
                                    "url": f"https://www.tiktok.com/@{author}/video/{vid_id}",
                                })
                        except (json.JSONDecodeError, TypeError):
                            pass
    except Exception:
        pass

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
    try:
        async with httpx.AsyncClient(
            timeout=10.0,
            headers={
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            },
            follow_redirects=True,
        ) as client:
            resp = await client.get(f"https://www.tiktok.com/tag/{tag}")
            if resp.status_code == 200:
                text = resp.text
                view_match = re.search(r'"viewCount"\s*:\s*(\d+)', text)
                video_match = re.search(r'"videoCount"\s*:\s*(\d+)', text)
                return {
                    "hashtag": tag,
                    "views": int(view_match.group(1)) if view_match else 0,
                    "videos": int(video_match.group(1)) if video_match else 0,
                }
    except Exception:
        pass

    return {"hashtag": tag, "views": 0, "videos": 0}


def format_count(n: int) -> str:
    if n >= 1_000_000_000:
        return f"{n / 1_000_000_000:.1f}B"
    if n >= 1_000_000:
        return f"{n / 1_000_000:.1f}M"
    if n >= 1_000:
        return f"{n / 1_000:.1f}K"
    return str(n)
