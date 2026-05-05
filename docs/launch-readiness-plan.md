# Launch Readiness Plan

Use this as the shared checklist before letting real customers into TrendBoard.

## 1. Full Live Smoke Test

Goal: prove the whole customer path works on the live site.

1. Create a fresh customer account.
2. Confirm signup email flow.
3. Log in.
4. Analyze a niche.
5. Confirm idea cards show images.
6. Save one idea.
7. Save one idea to the calendar.
8. Generate hook/script/hashtags.
9. Subscribe to trend alerts.
10. Upgrade through Stripe.
11. Open the billing portal.
12. Cancel billing.
13. Reset password.
14. Check `/admin` with the admin login.
15. Test the main dashboard flow on mobile.

Status: ✅ mostly complete. Use this checklist for your final go-live run with a live account pass.

```bash
SITE_URL=https://www.contentideamaker.com HEALTHCHECK_SECRET=your-secret pnpm monitor:production
```

Then finish each manual step above on your live browser for real users.

## 2. Monitoring

Goal: know when something breaks before customers have to tell us.

- Add an uptime monitor for `https://www.contentideamaker.com/api/health`.
- Add protected monitoring for `/api/health/deep` when a secret is configured.
- Confirm deployment failure emails are understood or filtered.
- Check OpenAI, Railway, Stripe, and Supabase dashboards for useful alerts.

Status: ✅ in place. `/api/health`, `/api/health/deep`, `pnpm monitor:production`, and a scheduled GitHub Actions monitor are live. External uptime/provider alert channels are still the last external piece to turn on.

The production monitor now checks:

- `/`
- `/pricing`
- `/terms`
- `/privacy`
- `/support`
- `/login`
- `/signup`
- `/dashboard`, `/saved`, `/alerts`, `/calendar`, `/admin` (expected redirect for unauthenticated traffic)

## 3. Support Readiness

Goal: make sure customers have somewhere clear to go when billing, login, or generated results fail.

- Set `NEXT_PUBLIC_SUPPORT_EMAIL` when the support inbox is ready.
- Decide the refund/support language.
- Prepare simple canned replies for billing, login, bad analysis, and cancellation questions.
- Decide whether dashboard feedback should send to email, database, or both. Feedback is now stored in the database and attempts email delivery without blocking saves.

Status: ✅ Done. Support page now includes common request topics and pre-filled request links, and feedback handling is resilient in production even if email delivery fails temporarily.

## 4. First-User Experience Review

Goal: make sure a new customer instantly understands what to do and what they received.

1. Confirm the dashboard explains what niche to enter.
2. Confirm the loading state makes it obvious analysis is still working.
3. Confirm generated cards feel polished and complete.
4. Confirm credits are understandable.
5. Confirm first-time onboarding reads clearly.
6. Confirm loading state shows meaningful progress.
7. Confirm saved ideas and calendar entries keep all useful details.

Status: ✅ complete. Onboarding/loading/intent-to-result clarity is done; one short founder pass is still recommended before launch.

## 5. Cost Guardrails

Goal: keep paid usage from becoming more expensive than the subscription price.

- Confirm logged-out users cannot generate paid features.
- Confirm free users are blocked after their credits run out.
- Confirm paid users decrement credits correctly.
- Confirm failed analyses refund credits.
- Set OpenAI spend limits.
- Review Railway, Supabase, and Stripe usage/cost limits.
- Watch AI text and trend-source costs after the first few real users.

Status: ✅ Completed. Credits and database-backed rate limits are in place. OpenAI spend budgets are now wired into API routing and visible in the admin dashboard, using `OPENAI_COST_BUDGET`/`OPENAI_COST_BUDGET_WINDOW_SECONDS`.

## 6. Legal and Pricing Polish

Goal: make sure customer-facing promises match what the app really does.

- Re-read pricing, terms, privacy, homepage, and dashboard credit language together.
- Make sure nothing says or implies unlimited AI usage.
- Make sure cancellation and monthly credit reset wording is clear.
- Tighten platform-scanning claims, especially Instagram, TikTok, and other sources.

Status: ✅ completed. Pricing now shows the live monthly price points, unverified social proof was removed, "official-looking" wording was replaced with "polished," and remaining platform-source claims are phrased around signals rather than guaranteed scraping.

## 7. Soft Launch

Goal: learn from real people before broad marketing.

1. Invite 3-10 people from target creators.
2. Have each person run one full analysis + save + calendar action.
3. Ask for two quick questions: "what felt easy?" and "where did you get stuck?"
4. Track first error type and where they drop off.
5. Fix the highest-friction issues found.
6. Open a second batch for 10-20 testers only after first issues are handled.
7. Start broader marketing.

Status: ✅ near-complete. You already have real users testing and paid flows; move to launch after one final founder pass if feedback is clean.
