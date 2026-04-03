# Workspace

## Overview

pnpm workspace monorepo using TypeScript, plus a Python FastAPI server.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework (Node)**: Express 5
- **API framework (Python)**: FastAPI 0.135 + Uvicorn + Pydantic v2
- **Python version**: 3.12
- **Database**: PostgreSQL + Drizzle ORM
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

## Python FastAPI Server

Located at `artifacts/fastapi-server/`. Runs via the "FastAPI Server" workflow on port 8000.

### Structure
```
artifacts/fastapi-server/
├── main.py              # Uvicorn entry point
└── app/
    ├── main.py          # FastAPI app + CORS + router registration
    ├── database.py      # PostgreSQL connection + table init
    ├── models.py        # Pydantic request/response models
    └── routers/
        ├── items.py     # Example CRUD router (in-memory)
        ├── ingest.py    # POST /ingest/reddit — pull fitness posts via RSS
        └── ideas.py     # POST /ideas/ — generate viral video ideas via OpenAI
```

### Dependencies
- feedparser — Reddit RSS parsing (no API key needed)
- openai — via Replit AI Integrations (no user key needed)
- SQLAlchemy + psycopg2-binary — PostgreSQL ORM
- httpx — HTTP client

### Database
- Table `reddit_posts` (id TEXT PK, text, engagement INT, created_at TIMESTAMPTZ)
- Auto-created on app startup

### Endpoints
- `GET /health` — health check
- `POST /ingest/reddit` — pull hot posts from r/fitness, store in DB, skip duplicates
- `POST /ideas/` — accepts `{"text": "..."}`, returns 5 viral video ideas via OpenAI
- `GET /items/` — list all items (example)
- `GET /docs` — Swagger UI (interactive API docs)
- `GET /redoc` — ReDoc API docs

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
