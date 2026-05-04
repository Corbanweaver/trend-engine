# Pre-Launch Manual Smoke Checklist

Run this exactly once before opening ads or outreach.

## Environment

- Use a fresh test user account for this pass (one that has never subscribed before).
- Use a separate browser session from your admin account.
- Start from `https://www.contentideamaker.com`.

## Anonymous flow

- [ ] Open homepage loads with no console errors.
- [ ] Open `/pricing`, `/terms`, `/privacy`, `/support`, `/login`, `/signup`.
- [ ] Click `Sign up` and complete signup.
- [ ] Confirm signup email link works and completes verification.
- [ ] Confirm the resulting login / reset flow lands on dashboard or safe target.
- [ ] Attempt `/dashboard` while logged out and confirm redirect to login.

## Authenticated flow

Log in with the test account and run each line:

- [ ] Analyze a test niche (`fitness`, `fitness nutrition`, or a long-tail niche you prefer).
- [ ] Confirm:
  - progress banner is visible while analyzing,
  - "Last analyzed..." updates after completion,
  - at least one card with image appears.
- [ ] Open a trend card and generate:
  - hook variation(s)
  - full script
  - hashtags
- [ ] Save one idea to Saved Ideas.
- [ ] Save one idea directly to Content Calendar.
- [ ] Open the saved idea:
  - verify script + hook + hashtags + source links are present.
- [ ] Open the content calendar view:
  - verify at least one saved idea appears there.
- [ ] Enable trend alerts for a niche and verify confirmation.
- [ ] Upgrade to a paid plan.
- [ ] Wait for checkout success / dashboard usage update.
- [ ] Open Billing portal and return.
- [ ] Cancel subscription from Stripe and verify dashboard/profile shows cancel status.
- [ ] Use forgot password from login screen and complete password reset.

## Admin + support checks

- [ ] Sign in as one configured admin email and verify `/admin` loads.
- [ ] Confirm admin metrics are not blank:
  - plans
  - credits usage
  - saved ideas count
  - trend alerts count
  - waitlist count
  - event stream
- [ ] Submit a feedback entry and confirm it appears (or at least no hard error).

## API and uptime checks

- [ ] From terminal:
  ```bash
  SITE_URL=https://www.contentideamaker.com \
  HEALTHCHECK_SECRET=<your-health-secret> \
  pnpm monitor:production
  ```
- [ ] Run on every deploy before sharing new release notes.

## Fast exit criteria

- All bullets in this checklist are checked.
- No unhandled errors in payment, auth, save-to-calendar, and analysis flows.
- At least one external user gives "clear to share" signal.
