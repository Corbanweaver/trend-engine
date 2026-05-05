# Monitoring Setup

This is the production monitoring checklist for TrendBoard.

## What Is Already In Code

- Public health endpoint: `https://www.contentideamaker.com/api/health`
- Protected deep health endpoint: `https://www.contentideamaker.com/api/health/deep`
- Local/CI script: `pnpm monitor:production`
- GitHub Actions workflow: `.github/workflows/production-health.yml`

The public health check confirms the web app is reachable. The deep health check also checks required environment variables, Stripe live configuration, Supabase access, OpenAI configuration, and the backend `/health` endpoint.

## GitHub Actions Monitor

The workflow runs every 15 minutes and can also be run manually from the GitHub Actions tab.

Recommended GitHub settings:

- Add repository variable `SITE_URL` with `https://www.contentideamaker.com`.
- Add repository secret `HEALTHCHECK_SECRET` after setting the same value in the web app environment.
- In GitHub notification settings, keep failed workflow emails enabled.

If `HEALTHCHECK_SECRET` is not set, the workflow still checks `/api/health` and skips `/api/health/deep`.

## External Uptime Monitor

Use a dedicated uptime monitor too, because GitHub scheduled workflows are not instant alerting.

Monitor:

- URL: `https://www.contentideamaker.com/api/health`
- Method: `GET`
- Expected status: `200`
- Expected body contains: `"status":"ok"`
- Frequency: 1-5 minutes

Good starter tools: Better Stack, UptimeRobot, Pingdom, or Cronitor.

## Provider Alerts To Set Manually

OpenAI:

- Set a monthly budget limit.
- Set email alerts around 50%, 80%, and 100% of budget.
- Review AI text and trend-source spend after each user test group.
- Also align app-side cap variables with your provider budget:
  - `OPENAI_COST_BUDGET` (credit units per window)
  - `OPENAI_COST_BUDGET_WINDOW_SECONDS` (window duration, defaults to 86400 seconds)

Railway:

- Enable usage or spend alerts if available on the project/account.
- Keep failed deployment emails enabled until deploys are consistently quiet.
- Watch CPU/memory during long trend analyses.

Supabase:

- Watch Auth email delivery/rate issues.
- Watch database size and API usage.
- Run advisors after schema changes.

Stripe:

- Keep webhook failure emails enabled.
- Watch failed payments, disputes, refunds, and canceled subscriptions.
- Confirm live webhook endpoint remains healthy after deploys.

## Quick Commands

Run the public check:

```bash
pnpm monitor:production
```

Run public and deep checks locally:

```bash
HEALTHCHECK_SECRET=your-secret pnpm monitor:production
```

To test the full status from a local terminal against any environment:

```bash
SITE_URL=https://www.contentideamaker.com pnpm monitor:production
```

Expected status checks include:

- `200` for open pages: `/`, `/pricing`, `/terms`, `/privacy`, `/support`, `/login`, `/signup`
- redirect-style status (`302`/`307`) for protected pages when not signed in: `/dashboard`, `/saved`, `/alerts`, `/calendar`, `/admin`
- `200` for `/api/health`
- `/api/health/deep` is checked when `HEALTHCHECK_SECRET` is present
