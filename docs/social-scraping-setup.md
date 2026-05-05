# Social Scraping Setup

TrendBoard now uses a provider-backed trend signal cache instead of making every customer analysis wait on live social scraping.

## What Runs

- Vercel cron calls `GET /api/cron/trend-cache` every 30 minutes.
- The Next.js route forwards to FastAPI `POST /trending/refresh-cache`.
- FastAPI fetches bounded public signals for the configured niches/platforms and stores them in `trend_signals`.
- Customer analysis reads fresh cached signals first, then falls back to live provider/search results if the cache is cold.

## Required Production Variables

Set these in Vercel and Railway/FastAPI as noted:

- `CRON_SECRET` in Vercel: lets Vercel call the cron route.
- `OPERATIONAL_API_KEY` in Railway/FastAPI: protects `/trending/refresh-cache`.
- `TREND_ENGINE_BACKEND_KEY` in Vercel: same value as `OPERATIONAL_API_KEY`.
- `YOUTUBE_API_KEY` in Railway/FastAPI: official YouTube source.
- `APIFY_API_TOKEN` in Railway/FastAPI: enables Apify social actors.

## Optional Actor Variables

Start with TikTok and Instagram, then add Pinterest/X actors once selected in Apify:

- `APIFY_TIKTOK_ACTOR_ID=clockworks/tiktok-scraper`
- `APIFY_INSTAGRAM_ACTOR_ID=apify/instagram-scraper`
- `APIFY_PINTEREST_ACTOR_ID=`
- `APIFY_X_ACTOR_ID=`

The Pinterest and X actor IDs are intentionally blank by default because Apify has multiple community actors with different pricing and schemas. The backend will only call them after you choose and configure an actor.

## Cost Controls

- `TREND_CACHE_NICHES=fitness,beauty,food,fashion,business,relationships,travel`
- `TREND_CACHE_PLATFORMS=youtube,tiktok,instagram,pinterest,x,reddit`
- `TREND_CACHE_MAX_RESULTS=8`
- `TREND_SIGNAL_CACHE_TTL_MINUTES=45`
- `APIFY_INTERACTIVE_TIMEOUT_SECONDS=6`
- `APIFY_RUN_TIMEOUT_SECONDS=60`

Keep `TREND_CACHE_MAX_RESULTS` between 5 and 10 until you know the Apify spend per refresh. Raise it only after reviewing Apify usage.
Customer-facing requests use the shorter interactive timeout so Analyze does not feel frozen when an actor is cold or slow. Background cache refreshes use the longer run timeout.

## Database

Run `apps/web/supabase/trend_signals.sql` in Supabase SQL editor if the backend uses your Supabase Postgres database.

The table has RLS enabled and no anon/authenticated policies. That is intentional: customers should not read raw scraped rows directly. The backend writes and reads through server credentials.

## Safe Use

This setup only uses public/authorized API access. Do not add actors or credentials that require logging into personal accounts, bypassing platform protections, or collecting private user data.
