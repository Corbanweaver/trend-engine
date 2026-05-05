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

Located at `artifacts/fastapi-server/`. Runs via the "artifacts/content-engine: web" workflow on port 18298.

### Structure
```
artifacts/fastapi-server/
├── main.py              # Uvicorn entry point
└── app/
    ├── main.py          # FastAPI app + CORS + router registration + static files
    ├── database.py      # PostgreSQL connection + table init
    ├── models.py        # Pydantic request/response models
    ├── youtube_client.py     # YouTube Data API v3 client
    ├── instagram_client.py   # Instagram Graph API client
    ├── tiktok_client.py      # TikTok content discovery
    ├── google_trends_client.py # Google Trends via pytrends
    ├── google_news_client.py   # Google News RSS
    ├── hackernews_client.py    # Hacker News Algolia API
    ├── web_search_client.py    # DuckDuckGo web search
    ├── multi_reddit_client.py  # Multi-subreddit ingest (20+ niches mapped)
    ├── pinterest_client.py     # Pinterest pin search (scrape + fallback)
    ├── medium_client.py        # Medium article search (tag feed + scrape + fallback)
    ├── static/
    │   └── index.html   # Frontend UI (Pinterest-style masonry layout)
    └── routers/
        ├── items.py        # Example CRUD router
        ├── ingest.py       # POST /ingest/reddit — pull posts via RSS
        ├── ideas.py        # POST /ideas/ — generate viral video ideas
        ├── trends.py       # GET /trends/ — keyword trend detection
        ├── trend_ideas.py  # POST /trend-ideas/ — all-source trend analysis + AI ideas
        ├── youtube.py      # POST /youtube/search
        ├── instagram.py    # POST /instagram/search
        ├── tiktok.py       # POST /tiktok/search
        ├── google_trends.py # POST /google-trends/search + /interest
        ├── google_news.py   # POST /google-news/search
        ├── hackernews.py    # POST /hackernews/search + GET /top
        ├── web_search.py    # POST /web-search/search + /trending
        ├── multi_reddit.py  # POST /reddit/multi-search
        ├── pinterest.py     # POST /pinterest/search
        ├── medium.py        # POST /medium/search
        └── ai_enhance.py   # POST /ai/refine-script (rate-limited)
```

### Dependencies
- feedparser — Reddit RSS + Google News RSS parsing
- openai — via Replit AI Integrations (no user key needed)
- anthropic — via Replit AI Integrations (Claude script refinement, no user key needed)
- SQLAlchemy + psycopg2-binary — PostgreSQL
- httpx — HTTP client for all external APIs
- pytrends — Google Trends data (no API key needed)

### Environment Secrets
- `YOUTUBE_API_KEY` — YouTube Data API v3 key
- `INSTAGRAM_ACCESS_TOKEN` — Instagram Graph API token (requires Business/Creator account + Facebook Page)
- `INSTAGRAM_BUSINESS_ACCOUNT_ID` — Instagram Business account ID (auto-detected from token)
- `SESSION_SECRET` — session secret

### Database
- Table `reddit_posts` (id TEXT PK, title TEXT, text TEXT, engagement INT, created_at TIMESTAMPTZ)
- Auto-created on app startup

### Endpoints
- `GET /` — frontend UI
- `GET /health` — health check
- `POST /ingest/reddit` — pull 50 hot posts from r/fitness, store in DB, skip duplicates
- `GET /trends/` — top 5 trending topics from stored post titles
- `POST /ideas/` — accepts `{"text": "...", "niche": "fitness"}`, returns 5 viral video ideas with hook/angle/idea/script
- `POST /trend-ideas/` — accepts `{"niche": "fitness"}`, chains trends → 3 AI ideas per trend + YouTube + Instagram + TikTok + Pinterest + Medium examples. Ideas now include SEO metadata (hashtags, optimized_title, seo_description).
- `POST /ai/refine-script` — Claude script refinement (Anthropic integration, falls back to OpenAI). Rate-limited 10 req/min per IP.
- `POST /youtube/search` — search YouTube for short-form videos by query
- `POST /instagram/search` — search Instagram top posts by hashtag
- `POST /tiktok/search` — search TikTok trending content
- `POST /pinterest/search` — search Pinterest pins by query
- `POST /medium/search` — search Medium articles by query
- `GET /docs` — Swagger UI (interactive API docs)

### Product Loop
1. Ingest Reddit posts → 2. Detect trends → 3. Generate viral video ideas per trend → 4. Find example videos from YouTube, Instagram, TikTok

### Performance
- All 10 data sources fetched in parallel per trend using asyncio.gather
- All trends processed in parallel (AI calls use semaphore limiting to 3 concurrent)
- Per-trend fault isolation: one failed trend doesn't crash the whole response
- Individual source timeouts (10s default, 15s for Google Trends) prevent slow sources from blocking

### Trend Discovery
- Trends are discovered LIVE from the selected niche (not from stored Reddit posts)
- Uses Google Trends, Google News, web search, and Reddit to find real trending topics
- AI extracts top 3 viral-worthy topics from the live data
- Each topic gets its own idea generation with matching videos/sources

### Frontend
- Orange-themed professional single-page app at `/` (Inter font, gradient accents)
- Sticky header with niche selector (21 options + custom), topic input, and orange "Analyze" button
- One-click full analysis: discovers trends live, generates AI ideas with scripts, finds matching videos per trend
- Pinterest-style masonry card layout (CSS columns, 3 cols desktop, 2 tablet, 1 mobile)
- Quick action chips for individual source searches (YouTube, TikTok, Pinterest, Medium, News, HN, Web, Trends)
- Collapsible media sections per trend with color-coded dots
- Video cards with thumbnails, inline YouTube playback, expandable scripts
- Pinterest pin grid and Medium article cards with images
- Rounded corners, soft shadows, hover effects, fade-in animations
- SEO section per idea: optimized title, description, hashtag pills with copy-to-clipboard
- Action buttons per idea: "Refine with Claude" (script refinement), "Voice Preview" (browser SpeechSynthesis)
- Refined scripts show inline with improvement bullet points
- Thumbnails come from organic source media when available

### Instagram Notes
- Instagram Graph API requires: Business/Creator account + Facebook Page + linked IG account
- Token must be generated from Graph API Explorer with pages_show_list, instagram_basic, instagram_manage_insights, pages_read_engagement
- User's "New Pages Experience" Facebook Page may need classic Page conversion for API access
- Currently returns empty results — revisit when Page setup is complete

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
