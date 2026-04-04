# Workspace

## Overview

pnpm workspace monorepo using TypeScript, plus a Python FastAPI Content Engine server.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework (Node)**: Express 5
- **API framework (Python)**: FastAPI 0.135 + Uvicorn + Pydantic v2
- **Python version**: 3.12
- **Database**: PostgreSQL (SQLAlchemy for Python, Drizzle ORM for Node)
- **AI**: OpenAI via Replit AI Integrations (no user key needed)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run Node API server locally
- `cd artifacts/fastapi-server && python main.py` — run FastAPI server (port 8000)

## Python FastAPI Content Engine

Located at `artifacts/fastapi-server/`. Runs via the "FastAPI Server" workflow on port 8000.

### Structure
```
artifacts/fastapi-server/
├── main.py              # Uvicorn entry point
└── app/
    ├── main.py          # FastAPI app + CORS + router registration + static files
    ├── database.py      # PostgreSQL connection + table init
    ├── models.py        # Pydantic request/response models
    ├── static/
    │   └── index.html   # Frontend UI
    └── routers/
        ├── items.py     # Example CRUD router (in-memory)
        ├── ingest.py    # POST /ingest/reddit — pull fitness posts via RSS
        ├── ideas.py     # POST /ideas/ — generate viral video ideas via OpenAI
        ├── trends.py    # GET /trends/ — keyword-based trend detection
        └── trend_ideas.py # POST /trend-ideas/ — chain trends → AI ideas
```

### Dependencies
- feedparser — Reddit RSS parsing (no API key needed)
- openai — via Replit AI Integrations (no user key needed)
- SQLAlchemy + psycopg2-binary — PostgreSQL
- httpx — HTTP client

### Database
- Table `reddit_posts` (id TEXT PK, title TEXT, text TEXT, engagement INT, created_at TIMESTAMPTZ)
- Auto-created on app startup

### Endpoints
- `GET /` — frontend UI
- `GET /health` — health check
- `POST /ingest/reddit` — pull 50 hot posts from r/fitness, store in DB, skip duplicates
- `GET /trends/` — top 5 trending topics from stored post titles
- `POST /ideas/` — accepts `{"text": "...", "niche": "fitness"}`, returns 5 viral video ideas with hook/angle/idea/script
- `POST /trend-ideas/` — accepts `{"niche": "fitness"}`, chains trends → 3 AI ideas per trend + YouTube example videos
- `POST /youtube/search` — search YouTube for short-form videos by query (uses Replit YouTube connector)
- `GET /docs` — Swagger UI (interactive API docs)

### Product Loop
1. Ingest Reddit posts → 2. Detect trends → 3. Generate viral video ideas per trend

### Frontend
- Dark-themed single-page app at `/`
- Niche selector (fitness, dating, finance, etc. + custom input)
- Buttons: Pull Reddit Posts, View Trends, Trends + Ideas
- Topic input for direct idea generation
- Displays hooks (red), angles (yellow), and ideas (gray)

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
