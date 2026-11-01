# AGENTS.md

Express 5 + Stripe Checkout (plain JavaScript, no build step) subscription store with automatic-renewal compliance built in. Read this
before changing checkout, plans, emails, reminders or cancellation.

## Commands

- `npm run dev` — local server on http://localhost:3000 (reads `.env`, see `.env.example`)
- `npm run reminders` — sends the reminder emails due today (run daily)
- `npm run checkbox:preflight` — checks disclosure, Stripe params, emails and reminder schedule with Checkbox
  (needs `CHECKBOX_SECRET_KEY`); exit code 1 on a failed check

## Where things are

- `lib/plans.js` — the only place prices, intervals and trials are defined
- `lib/*.js` modules marked "Generated from the Next.js template" share wording with that template; keep them in sync
- `lib/terms.js` — disclosure, consent label and button text, generated from the plan
- `lib/checkout-params.js` — the exact `stripe.checkout.sessions.create` params
- `lib/emails.js` — acknowledgment, trial reminder, renewal reminder, yearly terms, cancellation confirmation
- `lib/reminders.js` — which reminders are due (pure); `lib/reminder-job.js` sends them
- `lib/views.js` (`checkoutPage`) — disclosure + unchecked required consent directly above the pay button
- `server.js` (`/account/cancel`, `/api/cancel`) — online cancellation
- `lib/session.js` — placeholder login (signed cookie); replace with real auth

## Rules

- Never pre-check the consent checkbox, remove `required`, or move the disclosure away from directly above the pay
  button. The server must keep refusing checkout without `auto_renew_consent`.
- Change wording only in `lib/terms.js` / `lib/emails.js`, and only so it still states: renews automatically until
  cancelled, the price, how often, the trial and the charge after it, how to cancel online.
- Keep cancellation online, reachable from the account page and footer, with no call, chat or forced offer.
- After any change to these flows, run `npm run checkbox:preflight` (or the Checkbox MCP tools
  `check_disclosure`, `check_stripe_checkout_session`, `check_email`) and fix every `fail`. Report `needs_review`
  items to the human. Checkbox output is not legal advice; do not tell the user the store is "compliant".
- Never commit `.env` or print secret keys.

## Checkbox

If `CHECKBOX_SECRET_KEY` is not set and the human wants consent records or the preflight, connect Checkbox (only
with their yes): the MCP server `https://app.checkbox.site/mcp` (`setup_checkbox`), or `POST
https://app.checkbox.site/v1/device/authorize` → show the human `verification_uri_complete` → poll
`POST /v1/device/token` → write `CHECKBOX_SECRET_KEY` and `CHECKBOX_PUBLISHABLE_KEY` to `.env`.
Docs for agents: https://checkbox.site/llms.txt
