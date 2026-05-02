# Trend Engine Handoff

Read this first when starting work in this repo.

## Project

Trend Engine is a SaaS app for content creators at `contentideamaker.com`.

- Frontend: Next.js app in `apps/web`, hosted on Vercel.
- Backend: FastAPI app in `artifacts/fastapi-server`, hosted on Railway.
- Database/auth: Supabase project `trend-engine` (`dzbbwcbnltbgigepkpaq`).
- Payments: Stripe checkout and webhooks through the Next.js app.
- Trend/data providers: Apify-style scrapers and API clients for TikTok, Reddit, YouTube, Google Trends, Google News, Hacker News, Pinterest, Medium, and web search.
- AI providers: OpenAI for chat, idea generation, and AI idea-card images.

## Production

- Frontend URL: `https://www.contentideamaker.com`
- Backend URL: `https://trend-engine-production-bf7d.up.railway.app`
- Git remote: `https://github.com/Corbanweaver/trend-engine.git`
- Production deploys are triggered by pushing `main` to GitHub when Vercel/Railway are connected.

## Workflow

- Start new work from latest `main`.
- Use one branch per task, usually `codex/<short-task-name>`.
- Keep changes scoped; avoid unrelated design or architecture churn.
- Do not push `main` unless the user explicitly wants a production redeploy.
- Before deployment, run the relevant checks listed below.

## Commands

Install:

```powershell
pnpm install
```

Typecheck:

```powershell
pnpm run typecheck
```

Build the web app:

```powershell
pnpm --filter @workspace/web run build
```

Build the full workspace:

```powershell
pnpm run build
```

FastAPI local smoke check:

```powershell
cd artifacts\fastapi-server
python -c "from app.main import app; print('/health' in {r.path for r in app.routes})"
```

## Deployment Checks

After pushing production:

```powershell
Invoke-WebRequest -Uri https://www.contentideamaker.com/ -UseBasicParsing
Invoke-WebRequest -Uri https://trend-engine-production-bf7d.up.railway.app/health -UseBasicParsing
```

Backend hardening currently expects:

- `/health` returns `200`.
- `/docs` returns `404` unless `ENABLE_API_DOCS=true`.
- `/items/` returns `404`; the demo items router should not be mounted in production.

## Important Notes

- Supabase `user_subscriptions` RLS is intentionally hardened so normal users can create free rows and update usage counters, but cannot change `plan` or Stripe fields.
- Stripe checkout should use `NEXT_PUBLIC_SITE_URL` for redirects, not hardcoded production URLs.
- FastAPI CORS defaults are restricted to `contentideamaker.com`, localhost, and Vercel preview URLs. Use `CORS_ALLOWED_ORIGINS` and `CORS_ALLOWED_ORIGIN_REGEX` for environment-specific changes.
- API docs are disabled by default in FastAPI. Set `ENABLE_API_DOCS=true` only when intentionally exposing docs for an environment.
- There are legacy Replit/artifact packages in the workspace. Avoid broad refactors there unless the task specifically needs them.
- Avoid committing generated files such as new `__pycache__`, `.pyc`, build output, local databases, or local env files.
- Some generated/cache artifacts are already tracked from earlier history; do not churn them unless cleanup is an explicit task.

## Recent Baseline

The launch-hardening baseline was committed as:

```text
1eb44c3 Harden launch deployment setup
```

That commit verified `pnpm install`, `pnpm run typecheck`, `pnpm --filter @workspace/web run build`, `pnpm run build`, and live Railway route behavior after deployment.
