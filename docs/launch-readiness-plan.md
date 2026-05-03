# Launch Readiness Plan

Use this as the shared checklist before letting real customers into Content Idea Maker.

## 1. Full Live Smoke Test

Goal: prove the whole customer path works on the live site.

- Create a fresh customer account.
- Confirm the signup email.
- Log in.
- Analyze a niche.
- Confirm idea cards show images.
- Save one idea.
- Save one idea to the calendar.
- Generate hook/script/hashtags.
- Subscribe to trend alerts.
- Upgrade through Stripe.
- Open the billing portal.
- Cancel billing.
- Reset password.
- Check `/admin` with the admin login.
- Test the main dashboard flow on mobile.

Status: In progress. Stripe live checkout was tested successfully once with a real card.

## 2. Monitoring

Goal: know when something breaks before customers have to tell us.

- Add an uptime monitor for `https://www.contentideamaker.com/api/health`.
- Later, add protected monitoring for `/api/health/deep`.
- Confirm deployment failure emails are understood or filtered.
- Check OpenAI, Railway, Stripe, and Supabase dashboards for useful alerts.

Status: `/api/health` and `/api/health/deep` exist. Dashboard alert setup still needs to be done.

## 3. Support Readiness

Goal: make sure customers have somewhere clear to go when billing, login, or generated results fail.

- Set `NEXT_PUBLIC_SUPPORT_EMAIL` when the support inbox is ready.
- Decide the refund/support language.
- Prepare simple canned replies for billing, login, bad analysis, and cancellation questions.
- Decide whether dashboard feedback should send to email, database, or both.

Status: Support and privacy pages now point to a support email fallback.

## 4. First-User Experience Review

Goal: make sure a new customer instantly understands what to do and what they received.

- Check that the dashboard explains what niche to enter.
- Confirm the loading state makes it obvious analysis is still working.
- Confirm generated cards feel official and complete.
- Confirm credits are understandable.
- Confirm saved ideas and calendar entries keep all useful details.

Status: Needs another live pass after the newest deploy.

## 5. Cost Guardrails

Goal: keep paid usage from becoming more expensive than the subscription price.

- Confirm logged-out users cannot generate paid features.
- Confirm free users are blocked after their credits run out.
- Confirm paid users decrement credits correctly.
- Confirm failed analyses refund credits.
- Set OpenAI spend limits.
- Review Railway, Supabase, and Stripe usage/cost limits.
- Watch image generation cost after the first few real users.

Status: Credits and database-backed rate limits are in place. Dashboard spend limits still need setup.

## 6. Legal And Pricing Polish

Goal: make sure customer-facing promises match what the app really does.

- Re-read pricing, terms, privacy, homepage, and dashboard credit language together.
- Make sure nothing says or implies unlimited AI usage.
- Make sure cancellation and monthly credit reset wording is clear.
- Tighten platform-scanning claims, especially Instagram, TikTok, and other sources.

Status: Remaining "unlimited" pricing wording was removed from the app scan.

## 7. Soft Launch

Goal: learn from real people before broad marketing.

- Invite 3-10 people manually.
- Watch where they get confused.
- Track which niches they try.
- Track analysis failures and save/calendar usage.
- Fix the highest-friction issues.
- Then start broader marketing.

Status: Not started.
