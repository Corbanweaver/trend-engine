import hmac
import os
import time
from collections import defaultdict, deque
from collections.abc import Callable

from fastapi import Header, HTTPException, Request


DEFAULT_MAX_REQUEST_BYTES = 256 * 1024
DEFAULT_EXPENSIVE_RATE_LIMIT = 20
DEFAULT_EXPENSIVE_RATE_WINDOW = 60

_rate_limit_buckets: dict[str, deque[float]] = defaultdict(deque)


def int_env(name: str, default: int, minimum: int | None = None) -> int:
    raw = os.environ.get(name, "").strip()
    if not raw:
        return default
    try:
        value = int(raw)
    except ValueError:
        return default
    if minimum is not None:
        return max(value, minimum)
    return value


def max_request_bytes() -> int:
    return int_env("MAX_REQUEST_BODY_BYTES", DEFAULT_MAX_REQUEST_BYTES, minimum=1024)


def require_operational_key(
    x_operational_key: str | None = Header(default=None, alias="X-Operational-Key"),
    x_api_key: str | None = Header(default=None, alias="X-API-Key"),
) -> None:
    expected = os.environ.get("OPERATIONAL_API_KEY", "").strip()
    if not expected:
        raise HTTPException(status_code=503, detail="Operational endpoint is disabled.")

    provided = (x_operational_key or x_api_key or "").strip()
    if not provided or not hmac.compare_digest(provided, expected):
        raise HTTPException(status_code=401, detail="Invalid or missing operational key.")


def require_digest_key(x_trend_digest_key: str | None) -> None:
    expected = os.environ.get("TREND_DIGEST_KEY", "").strip()
    if not expected:
        return
    provided = (x_trend_digest_key or "").strip()
    if not provided or not hmac.compare_digest(provided, expected):
        raise HTTPException(status_code=401, detail="Invalid or missing digest key.")


def client_rate_key(request: Request, namespace: str) -> str:
    forwarded_for = request.headers.get("x-forwarded-for", "")
    client = forwarded_for.split(",", 1)[0].strip()
    if not client and request.client:
        client = request.client.host
    return f"{namespace}:{client or 'unknown'}"


def check_rate_limit(key: str, limit: int, window_seconds: int) -> None:
    now = time.time()
    bucket = _rate_limit_buckets[key]
    while bucket and now - bucket[0] >= window_seconds:
        bucket.popleft()

    if len(bucket) >= limit:
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Try again later.")

    bucket.append(now)


def expensive_endpoint_rate_limit(namespace: str) -> Callable[[Request], None]:
    def dependency(request: Request) -> None:
        limit = int_env("EXPENSIVE_ENDPOINT_RATE_LIMIT", DEFAULT_EXPENSIVE_RATE_LIMIT, minimum=1)
        window = int_env(
            "EXPENSIVE_ENDPOINT_RATE_WINDOW_SECONDS",
            DEFAULT_EXPENSIVE_RATE_WINDOW,
            minimum=1,
        )
        check_rate_limit(client_rate_key(request, namespace), limit, window)

    return dependency
