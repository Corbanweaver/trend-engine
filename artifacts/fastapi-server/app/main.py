import os
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from app.database import init_db
from app.routers import (
    ingest, ideas, trends, trend_ideas, daily_trending,
    youtube, instagram, tiktok,
    google_trends, google_news, hackernews, web_search, multi_reddit,
    pinterest, medium, ai_enhance,
)
from app.security import max_request_bytes

DEFAULT_CORS_ALLOWED_ORIGINS = [
    "https://contentideamaker.com",
    "https://www.contentideamaker.com",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]


def _csv_env(name: str, default: list[str]) -> list[str]:
    raw = os.environ.get(name, "").strip()
    if not raw:
        return default
    return [value.strip() for value in raw.split(",") if value.strip()]


def _truthy_env(name: str, default: bool = False) -> bool:
    raw = os.environ.get(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


api_docs_enabled = _truthy_env("ENABLE_API_DOCS", default=False)

app = FastAPI(
    title="Content Engine API",
    description="Reddit ingestion, trend detection, and AI-powered viral video idea generation",
    version="0.2.0",
    docs_url="/docs" if api_docs_enabled else None,
    redoc_url="/redoc" if api_docs_enabled else None,
    openapi_url="/openapi.json" if api_docs_enabled else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_csv_env("CORS_ALLOWED_ORIGINS", DEFAULT_CORS_ALLOWED_ORIGINS),
    allow_origin_regex=os.environ.get(
        "CORS_ALLOWED_ORIGIN_REGEX",
        r"https://.*\.vercel\.app",
    ),
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.middleware("http")
async def enforce_request_size(request: Request, call_next):
    content_length = request.headers.get("content-length")
    max_bytes = max_request_bytes()
    if content_length:
        try:
            if int(content_length) > max_bytes:
                return JSONResponse(
                    status_code=413,
                    content={"detail": "Request body too large."},
                )
        except ValueError:
            return JSONResponse(
                status_code=400,
                content={"detail": "Invalid Content-Length header."},
            )
    response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "no-referrer")
    return response


app.include_router(ingest.router)
app.include_router(ideas.router)
app.include_router(trends.router)
app.include_router(trend_ideas.router)
app.include_router(daily_trending.router)
app.include_router(youtube.router)
app.include_router(instagram.router)
app.include_router(tiktok.router)
app.include_router(google_trends.router)
app.include_router(google_news.router)
app.include_router(hackernews.router)
app.include_router(web_search.router)
app.include_router(multi_reddit.router)
app.include_router(pinterest.router)
app.include_router(medium.router)
app.include_router(ai_enhance.router)

STATIC_DIR = Path(__file__).parent / "static"
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/")
def root():
    return FileResponse(str(STATIC_DIR / "index.html"))
