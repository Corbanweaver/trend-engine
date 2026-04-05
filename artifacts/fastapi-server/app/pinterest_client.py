import httpx
import re
import json
import logging
from urllib.parse import quote

logger = logging.getLogger(__name__)


async def pinterest_search(query: str, max_results: int = 6) -> list[dict]:
    results = []
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
    }

    try:
        async with httpx.AsyncClient(
            timeout=15.0,
            headers=headers,
            follow_redirects=True,
        ) as client:
            encoded = quote(query)
            resp = await client.get(
                f"https://www.pinterest.com/search/pins/?q={encoded}",
            )
            if resp.status_code == 200:
                text = resp.text
                results = _parse_pinterest_html(text, max_results)
    except Exception as e:
        logger.warning("Pinterest primary search failed: %s", e)

    if not results:
        results = await _pinterest_rss_fallback(query, max_results)

    if not results:
        results = _generate_pinterest_links(query, max_results)

    return results


def _parse_pinterest_html(text: str, max_results: int) -> list[dict]:
    results = []

    script_matches = re.findall(
        r'<script[^>]*data-relay-response="true"[^>]*>(.*?)</script>',
        text,
        re.DOTALL,
    )

    for script_content in script_matches:
        try:
            data = json.loads(script_content)
            pins = _extract_pins_from_data(data, max_results)
            if pins:
                results.extend(pins)
                break
        except (json.JSONDecodeError, TypeError):
            continue

    if not results:
        json_matches = re.findall(
            r'"pin_id"\s*:\s*"(\d+)".*?"title"\s*:\s*"([^"]*)".*?"(?:images|image_signature)"',
            text,
            re.DOTALL,
        )
        for pin_id, title in json_matches[:max_results]:
            results.append({
                "pin_id": pin_id,
                "title": title or "Pinterest Pin",
                "image_url": f"https://i.pinimg.com/236x/{pin_id[:2]}/{pin_id[2:4]}/{pin_id[4:6]}/{pin_id}.jpg",
                "link": f"https://www.pinterest.com/pin/{pin_id}/",
                "board_name": "",
                "pinner": "",
            })

    if not results:
        img_matches = re.findall(
            r'(https://i\.pinimg\.com/[^"\']+\.(?:jpg|png|webp))',
            text,
        )
        seen = set()
        for img in img_matches:
            if img not in seen and ("236x" in img or "474x" in img):
                seen.add(img)
                results.append({
                    "pin_id": str(len(results)),
                    "title": "Pinterest Pin",
                    "image_url": img,
                    "link": f"https://www.pinterest.com/pin/{len(results)}/",
                    "board_name": "",
                    "pinner": "",
                })
                if len(results) >= max_results:
                    break

    return results[:max_results]


def _extract_pins_from_data(data: dict | list, max_results: int) -> list[dict]:
    results = []
    if isinstance(data, dict):
        for key, val in data.items():
            if key == "results" and isinstance(val, list):
                for item in val[:max_results]:
                    pin = _extract_pin(item)
                    if pin:
                        results.append(pin)
                if results:
                    return results
            elif isinstance(val, (dict, list)):
                found = _extract_pins_from_data(val, max_results - len(results))
                results.extend(found)
                if len(results) >= max_results:
                    return results[:max_results]
    elif isinstance(data, list):
        for item in data:
            if isinstance(item, dict):
                pin = _extract_pin(item)
                if pin:
                    results.append(pin)
                else:
                    found = _extract_pins_from_data(item, max_results - len(results))
                    results.extend(found)
            if len(results) >= max_results:
                break
    return results[:max_results]


def _extract_pin(item: dict) -> dict | None:
    pin_id = item.get("id") or item.get("pin_id") or item.get("entityId")
    if not pin_id:
        return None

    title = item.get("title") or item.get("grid_title") or item.get("description") or "Pinterest Pin"

    images = item.get("images") or item.get("image") or {}
    image_url = ""
    if isinstance(images, dict):
        for key in ["564x", "474x", "236x", "orig", "original"]:
            if key in images:
                img_data = images[key]
                image_url = img_data.get("url", "") if isinstance(img_data, dict) else str(img_data)
                break
        if not image_url and images:
            first = next(iter(images.values()))
            image_url = first.get("url", "") if isinstance(first, dict) else str(first)

    if not image_url:
        image_url = item.get("image_large_url") or item.get("image_medium_url") or ""

    board = item.get("board") or {}
    board_name = board.get("name", "") if isinstance(board, dict) else ""

    pinner = item.get("pinner") or item.get("native_creator") or {}
    pinner_name = pinner.get("username", "") if isinstance(pinner, dict) else ""

    return {
        "pin_id": str(pin_id),
        "title": (title or "")[:200],
        "image_url": image_url,
        "link": f"https://www.pinterest.com/pin/{pin_id}/",
        "board_name": board_name,
        "pinner": pinner_name,
    }


async def _pinterest_rss_fallback(query: str, max_results: int) -> list[dict]:
    results = []
    try:
        async with httpx.AsyncClient(
            timeout=10.0,
            headers={
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            },
            follow_redirects=True,
        ) as client:
            resp = await client.get(
                f"https://www.pinterest.com/search/pins/?q={quote(query)}&rs=typed",
            )
            if resp.status_code == 200:
                text = resp.text
                img_matches = re.findall(
                    r'(https://i\.pinimg\.com/(?:236x|474x|564x)/[^"\'>\s]+\.(?:jpg|png|webp))',
                    text,
                )
                seen = set()
                for img in img_matches:
                    normalized = img.replace("236x", "474x")
                    if normalized not in seen:
                        seen.add(normalized)
                        results.append({
                            "pin_id": f"img-{len(results)}",
                            "title": f"{query} inspiration",
                            "image_url": normalized,
                            "link": f"https://www.pinterest.com/search/pins/?q={quote(query)}",
                            "board_name": "",
                            "pinner": "",
                        })
                        if len(results) >= max_results:
                            break
    except Exception as e:
        logger.warning("Pinterest RSS fallback failed: %s", e)
    return results


def _generate_pinterest_links(query: str, max_results: int) -> list[dict]:
    words = query.strip().split()
    searches = [query]
    if len(words) >= 2:
        searches.append(f"{query} ideas")
        searches.append(f"{query} aesthetic")
    else:
        searches.append(f"{query} ideas")
        searches.append(f"{query} inspiration")
        searches.append(f"{query} aesthetic")
        searches.append(f"{query} tips")

    results = []
    for i, sq in enumerate(searches[:max_results]):
        results.append({
            "pin_id": f"search-{i}",
            "title": f"Browse Pinterest: {sq}",
            "image_url": "",
            "link": f"https://www.pinterest.com/search/pins/?q={quote(sq)}",
            "board_name": "",
            "pinner": "",
        })
    return results
