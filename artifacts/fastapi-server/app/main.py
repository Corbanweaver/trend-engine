from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.database import init_db
from app.routers import items, ingest, ideas, trends, trend_ideas, youtube, instagram, tiktok

app = FastAPI(
    title="Content Engine API",
    description="Reddit ingestion, trend detection, and AI-powered viral video idea generation",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(items.router)
app.include_router(ingest.router)
app.include_router(ideas.router)
app.include_router(trends.router)
app.include_router(trend_ideas.router)
app.include_router(youtube.router)
app.include_router(instagram.router)
app.include_router(tiktok.router)

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
