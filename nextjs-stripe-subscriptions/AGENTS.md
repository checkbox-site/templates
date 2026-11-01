# AGENTS.md

Next.js (App Router) + Stripe Checkout subscription store with automatic-renewal compliance built in. Read this
before changing checkout, plans, emails, reminders or cancellation.

## Commands

- `npm run dev` — local server on http://localhost:3000 (needs `.env.local`, see `.env.example`)
- `npm run typecheck` / `npm run build`
- `npm run checkbox:preflight` — checks disclosure, Stripe params, emails and reminder schedule with Checkbox
  (needs `CHECKBOX_SECRET_KEY`); exit code 1 on a failed check

## Where things are

- `lib/plans.ts` — the only place prices, intervals and trials are defined
- `lib/terms.ts` — disclosure, consent label and button text, generated from the plan
- `lib/checkout-params.ts` — the exact `stripe.checkout.sessions.create` params
- `lib/emails.ts` — acknowledgment, trial reminder, renewal reminder, yearly terms, cancellation confirmation
- `lib/reminders.ts` — which reminders are due (pure); `app/api/cron/reminders/route.ts` sends them
- `app/checkout/page.tsx` — disclosure + unchecked required consent directly above the pay button
- `app/account/cancel/page.tsx`, `app/api/cancel/route.ts` — online cancellation
- `lib/session.ts` — placeholder login (signed cookie); replace with real auth

## Rules

- Never pre-check the consent checkbox, remove `required`, or move the disclosure away from directly above the pay
  button. The server must keep refusing checkout without `auto_renew_consent`.
- Change wording only in `lib/terms.ts` / `lib/emails.ts`, and only so it still states: renews automatically until
  cancelled, the price, how often, the trial and the charge after it, how to cancel online.
- Keep cancellation online, reachable from the account page and footer, with no call, chat or forced offer.
- After any change to these flows, run `npm run checkbox:preflight` (or the Checkbox MCP tools
  `check_disclosure`, `check_stripe_checkout_session`, `check_email`) and fix every `fail`. Report `needs_review`
  items to the human. Checkbox output is not legal advice; do not tell the user the store is "compliant".
- Never commit `.env.local` or print secret keys.

## Checkbox

If `CHECKBOX_SECRET_KEY` is not set and the human wants consent records or the preflight, connect Checkbox (only
with their yes): the MCP server `https://app.checkbox.site/mcp` (`setup_checkbox`), or `POST
https://app.checkbox.site/v1/device/authorize` → show the human `verification_uri_complete` → poll
`POST /v1/device/token` → write `CHECKBOX_SECRET_KEY` and `NEXT_PUBLIC_CHECKBOX_PUBLISHABLE_KEY` to `.env.local`.
Docs for agents: https://checkbox.site/llms.txt
