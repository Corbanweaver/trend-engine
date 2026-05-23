# Trend Engine Project Memory

Last updated: May 23, 2026

Use this file as the handoff note when opening a new chat or moving this work into a project called "Trend engine".

## Quick Start For A New Chat

The project is the Trend Engine / TrendBoard / Content Idea Maker app at:

- Production site: https://www.contentideamaker.com/
- Main repo workspace: `C:\Users\Player1\Documents\New project`
- Current working branch when this was written: `codex/pinterest-style-ui`
- Latest pushed commit when this memory file was first written: `c398f1f Add affiliate attribution tracking`
- `origin/main` and `origin/codex/pinterest-style-ui` both pointed at that commit when this file was first written.

Do not include passwords, API keys, Stripe secrets, Supabase service-role keys, Resend keys, or user login credentials in chat summaries or files.

## Product Summary

TrendBoard is a creator trend research and content planning SaaS. It helps users:

- Analyze a niche.
- Pull social/content trend signals from major platforms.
- See idea cards with organic/source-backed thumbnails.
- Save ideas.
- Add ideas to a content calendar.
- Generate short hooks and full scripts only when needed.
- Manage plan/credits through Stripe.
- Use free SEO landing pages/tools before signup.

The product has been moving away from generic AI-heavy output and toward faster, warmer, shorter, source-backed creator ideas.

## Current Production State

Major features that are implemented:

- Supabase auth with email confirmation and password reset.
- Google sign-in UI exists, but Supabase Google provider activation may still need owner-side setup if not already done.
- Stripe live checkout works with real cards.
- Stripe cancellation flow works.
- Credit usage works.
- Admin accounts get unlimited credits for testing.
- Admin page exists at `/admin`.
- Admin page includes plan counts, credit usage, operational events, rate-limit activity, saved idea counts, waitlist counts, AI spend windows, and affiliate referrals.
- Dashboard has niche analysis, saved ideas, calendar, alerts, profile, admin link for admins, and floating AI assistant for logged-in users.
- AI assistant is hidden for logged-out users.
- Mobile AI assistant now has a close button inside the open chat panel.
- Light mode was removed; app is dark-mode-only.
- AI-generated thumbnails were stopped because they slowed analysis and did not look good enough.
- Organic/source thumbnails are preferred.
- SEO/free-resource pages exist for traffic generation.
- Google Ads tag is installed.
- Google Ads free-preview conversion label is wired.
- Affiliate/referral code tracking exists through `?ref=creator-code`.

## Affiliate Tracking

Creator links do not need to be pre-created in the app. The tracking code is the URL parameter.

Examples:

- Cougar: `https://www.contentideamaker.com/?ref=cougar`
- Connor: `https://www.contentideamaker.com/?ref=connor`
- Adam: `https://www.contentideamaker.com/?ref=adam`

Supported query parameters:

- `ref`
- `affiliate`
- `affiliate_id`
- `affiliate_ref`
- `creator`
- `creator_id`

The code is captured in browser localStorage, sent with conversion events, and added to signup metadata when possible. Stripe checkout also receives affiliate metadata when available, so paid Checkout Sessions and subscriptions can be tied back to a creator code. Admin reporting is in `/admin` under "Affiliate referrals".

Creator discounts were added through Stripe coupons and app-side auto-apply logic:

- `?ref=cougar` applies coupon `RpDuZLhx`, named `COUGAR20`
- `?ref=connor` applies coupon `GcaoerYs`, named `CONNOR20`
- `?ref=adam` applies coupon `X6WjjfOk`, named `BOULDER20`

These are coupons auto-applied by the creator link. If customers need to type a code manually in Stripe Checkout, create Stripe Promotion Codes on top of those coupons in the Stripe dashboard.

Recommended payout rule:

- Pay creators for paid customers, not just free signups.
- Starter offer: `$10 per first paid signup` or `25% of first month`.

## Google Ads Status

Campaign checked on May 23, 2026.

Important warning:

- Google Ads account shows advertiser identity verification required by June 22, 2026.
- If not completed, ads may be paused or limited.

Campaign table showed:

- Campaign: `Campaign #1`
- Status: Enabled
- Budget: `$15/day`
- Type: Search
- Bid strategy: Maximize clicks, learning
- Impressions: `1,250`
- Clicks: `21`
- CTR: `1.68%`
- Spend: `$10.48`
- Avg CPC: `$0.50`
- Conversions: `3`
- Cost/conversion: `$3.49`

Conversion goals showed:

- Submit lead form: Active/Healthy, 3 today
- Sign-up: Active/Healthy, 0 today
- Subscribe: Misconfigured

There is also another enabled Google Ads campaign in the account:

- `PeptiCalc Search - $3/day`

That campaign is unrelated to TrendBoard but spending in the same Google Ads account.

## Current Known Issues / Watch Items

Priority items:

1. Fix or confirm Google Ads "Subscribe" conversion goal, currently shown as misconfigured.
2. Complete Google Ads advertiser identity verification before June 22, 2026.
3. Watch whether paid ad clicks convert into signups, not just free-tool conversions.
4. If signups stay low, improve the landing page offer/CTA and make the free preview lead more directly to account creation.
5. Confirm affiliate referrals show in `/admin` after a real signup comes through a `?ref=` link.
6. Confirm live mobile AI assistant close button after Vercel deployment finishes.

Possible product improvements:

- Add stronger "why create a free account" messaging after free preview generation.
- Add clearer examples of actual output before signup.
- Confirm the creator affiliate terms page is deployed and linked.
- Confirm Stripe checkout/payment attribution is showing paid affiliate checkouts reliably.
- Rename `Campaign #1` to something obvious like `TrendBoard Search - $15/day`.
- Pause or separate unrelated ad campaigns if account-level reporting gets confusing.

## Important Environment Variables

Known env var names used across the app. Do not store values in this file.

Core site/auth:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_EMAILS`
- `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED`

Stripe:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_CREATOR_PRICE_ID`
- `STRIPE_PRO_PRICE_ID`

Email:

- `RESEND_API_KEY`
- `FEEDBACK_SENDER_EMAIL`
- `NEXT_PUBLIC_SUPPORT_EMAIL`

AI/backend:

- `OPENAI_API_KEY`
- `OPENAI_COST_BUDGET`
- `OPENAI_COST_BUDGET_WINDOW_SECONDS`
- `OPERATIONAL_API_KEY`
- `HEALTHCHECK_SECRET`

Apify/social scraping:

- `APIFY_API_TOKEN`
- `APIFY_INSTAGRAM_ACTOR_ID`
- `APIFY_TIKTOK_ACTOR_ID`
- `APIFY_PINTEREST_ACTOR_ID`
- `APIFY_X_ACTOR_ID`

Google Ads:

- `NEXT_PUBLIC_GOOGLE_ADS_ID`
- `NEXT_PUBLIC_GOOGLE_ADS_SIGNUP_CONVERSION_LABEL`
- `NEXT_PUBLIC_GOOGLE_ADS_SUBSCRIBE_CONVERSION_LABEL`
- `NEXT_PUBLIC_GOOGLE_ADS_FREE_TOOL_CONVERSION_LABEL`

## Files Recently Changed

Recent important implementation files:

- `apps/web/components/floating-ai-assistant.tsx`
  - Mobile assistant close button.

- `apps/web/lib/affiliate-attribution.ts`
  - Affiliate code capture, normalization, URL appending, signup metadata helper.

- `apps/web/components/analytics/affiliate-attribution-capture.tsx`
  - Captures affiliate codes on page load.

- `apps/web/lib/telemetry.ts`
  - Sends affiliate attribution with conversion events.

- `apps/web/app/signup/page.tsx`
  - Adds affiliate metadata to email signup and OAuth redirect URLs.

- `apps/web/app/auth/callback/route.ts`
  - Records affiliate signup completion for likely-new users.

- `apps/web/app/admin/page.tsx`
  - Adds affiliate referral summary.

## Dirty Worktree Note

When this file was written, these unrelated files had local dirty status from previous work or line-ending churn. Do not revert them unless the user specifically asks.

- `apps/web/app/not-found.tsx`
- `apps/web/components/ui/scroll-area.tsx`
- `apps/web/lib/daily-trending-types.ts`
- `apps/web/lib/gmail-transporter.ts`
- `apps/web/lib/utils.ts`
- `artifacts/mockup-sandbox/src/.generated/mockup-components.ts`

## Verification Commands

Common commands:

```powershell
pnpm --filter @workspace/web typecheck
pnpm --filter @workspace/web lint
pnpm --filter @workspace/web build
```

For production health:

```powershell
pnpm run monitor:production
```

## Recommended Next Actions

1. Verify the latest Vercel deploy is live.
2. On a phone, open the app, open AI Assistant, and confirm the close button works.
3. Test an affiliate link:
   - Open `https://www.contentideamaker.com/?ref=testcreator`
   - Sign up with a test email.
   - Confirm `/admin` shows `testcreator`.
4. Fix Google Ads Subscribe conversion misconfiguration.
5. Complete Google Ads advertiser identity verification.
6. Check Google Ads after 24-48 hours:
   - Clicks
   - Spend
   - CTR
   - Free-tool conversions
   - Signup conversions
   - Checkout conversions
7. If ad clicks are not producing signups, improve the landing page/signup bridge before increasing ad spend.
8. Start low-cost affiliate outreach with Cougar, Connor, Adam, and 5-10 niche creators.

## How To Continue In A New Chat

Paste this:

```text
Continue the Trend Engine project. Read docs/trend-engine-project-memory.md first, then check git status. Do not revert unrelated dirty files. The next priority is to verify the live deploy, fix Google Ads Subscribe conversion tracking, and help me launch affiliate marketing safely.
```
