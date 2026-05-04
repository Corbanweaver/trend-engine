# Support Playbook (Pre-Launch)

Use this during first user onboarding and early support hours.

## What users can contact us about

- Billing plan, upgrades, and checkout
- Credits and usage limits
- Login/account access and password resets
- Unexpected trend scans or bad content quality
- Cancellations and refunds
- Feature requests

## Canned response templates

### 1) Billing or plan questions

`Hi, thanks for reaching out. I can help with billing and plan access.`

- Confirm which email you used at signup
- Verify current plan and active period
- Check card on file and invoice timestamp
- Confirm whether this is a new purchase or renewal question
- Offer to resend billing portal link and verify successful payment

### 2) Credits or usage questions

`Thanks for flagging this. Let’s verify your usage for this billing cycle.`

- Confirm monthly credits and reset date
- Confirm usage from the current cycle
- Check if a previous analysis was counted but failed (edge case refund rules)
- Explain what actions consume credits and what does not

### 3) Login or account access

`Thanks for the note. Let’s confirm the account issue quickly.`

- Confirm sign-in email and last successful login
- Ask whether they reached forgot-password or OTP path
- Confirm social login state (Google auth) if enabled
- Suggest hard refresh + clear cookies if session looks stuck

### 4) Bad analysis / generation issues

`I’m sorry the analysis looked off. I’d like a few details so we can investigate.`

- Ask for niche searched, timestamp, and trend card title
- Ask for screenshot + expected vs actual result
- Run a quick internal check for platform scrapers and credit spend
- If needed, suggest rerun and compare results

### 5) Cancellation / plan end

`Yes — we can help with your plan status right away.`

- Confirm cancel date and renewal window
- Clarify paid access remains active through current period end
- Process refund only when applicable per policy window
- Confirm downgrade outcome and credit availability on re-subscribe

## Escalation notes

- For repeated failures in analysis, capture error text, browser, and niche.
- If feedback requests are not saving, capture user id + recent session timing.
- For payment-related issues, share `Stripe Checkout` or billing portal details privately only.
- If feature behavior is affected, add steps to reproduce and save them in the idea card / screenshot.
