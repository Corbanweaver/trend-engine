import logging
import os

import httpx

logger = logging.getLogger(__name__)

APIFY_API_BASE = "https://api.apify.com/v2"


def apify_token() -> str:
    return os.environ.get("APIFY_API_TOKEN", "").strip()


def configured_actor_id(env_name: str, default: str = "") -> str:
    return os.environ.get(env_name, default).strip()


async def run_actor_items(
    actor_id: str,
    actor_input: dict,
    *,
    max_results: int,
    timeout_seconds: float | None = None,
) -> list[dict]:
    """Run a configured Apify actor and return bounded dataset items."""
    token = apify_token()
    if not token or not actor_id:
        return []

    actor_slug = actor_id.replace("/", "~")
    url = f"{APIFY_API_BASE}/acts/{actor_slug}/run-sync-get-dataset-items"
    timeout = timeout_seconds or float(os.environ.get("APIFY_RUN_TIMEOUT_SECONDS", "60"))
    params = {
        "token": token,
        "limit": max(max_results, 1),
        "clean": "true",
    }

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(url, params=params, json=actor_input)
            if response.status_code >= 400:
                logger.warning(
                    "Apify actor %s failed with HTTP %s: %s",
                    actor_id,
                    response.status_code,
                    response.text[:300],
                )
                return []
            data = response.json()
            if not isinstance(data, list):
                logger.warning("Apify actor %s returned non-list payload.", actor_id)
                return []
            return [item for item in data[:max_results] if isinstance(item, dict)]
    except Exception as exc:
        logger.warning("Apify actor %s request failed: %s", actor_id, exc)
        return []


def common_search_input(query: str, max_results: int) -> dict:
    """Broad input fields accepted by many community/social actors."""
    return {
        "query": query,
        "search": query,
        "keyword": query,
        "searchTerms": [query],
        "queries": [query],
        "maxItems": max_results,
        "resultsLimit": max_results,
        "resultsPerPage": max_results,
        "limit": max_results,
    }
