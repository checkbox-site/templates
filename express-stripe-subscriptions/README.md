# Express + Stripe subscriptions, with automatic-renewal compliance built in

A working subscription store on Express 5 and Stripe Checkout, in plain JavaScript with no build step, that ships
with what US automatic-renewal laws ask of a subscription flow — the renewal disclosure and consent at checkout, the
acknowledgment and reminder emails, and online cancellation — wired to [Checkbox](https://checkbox.site/docs) so you
can check it before you ship and keep a record of each consent. Use it as is, or as the backend for a Remix, Astro or
single-page front end: the routes and `lib/` modules are framework-independent.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/checkbox-site/templates)

> This template gives you the mechanics. It is not legal advice, and using it does not by itself make a business
> compliant: your prices, trial, terms of service and how you run cancellations matter too. Checkbox's checks are an
> automated assessment; its rules are pending attorney review.

## What is in it

| Requirement | Where |
|---|---|
| Renewal disclosure directly above the pay button: price, interval, renews until cancelled, trial and the charge after it, how to cancel online. Body size, set off by a border | `lib/views.js` (`checkoutPage`), wording in `lib/terms.js` |
| Consent checkbox for those terms, unchecked and required; the server refuses checkout without it | `lib/views.js`, `server.js` (`POST /api/checkout`) |
| The same terms on Stripe's hosted page (`custom_text`) and a required Terms of Service checkbox (`consent_collection`) | `lib/checkout-params.js` |
| Consent record: with Checkbox keys, `<checkbox-disclosure>` (Checkbox Elements) records the consent; the webhook binds it to the subscription | `lib/views.js`, `server.js` (`/api/webhooks/stripe`) |
| Acknowledgment email right after sign-up | `server.js` (webhook), `lib/emails.js` |
| Trial-ending, yearly-renewal and yearly-terms reminders, timed from Checkbox's notice schedule, sent once each | `lib/reminder-job.js`, `lib/reminders.js` |
| Online cancellation from the account page and footer: one confirmation click, no call or chat, confirmation on screen and by email | `server.js` (`/account/cancel`, `/api/cancel`) |
| Terms of Service whose subscription and cancellation sections match the checkout | `lib/views.js` (`termsPage`) |
| `npm run checkbox:preflight`: checks the disclosure, the exact Stripe params, every email and the reminder schedule | `scripts/preflight.js` |

## Run it locally

Requirements: Node.js 20.19 or later, a Stripe account (test mode), the [Stripe CLI](https://docs.stripe.com/stripe-cli).

```bash
npm install
cp .env.example .env                 # fill in STRIPE_SECRET_KEY, SESSION_SECRET, CRON_SECRET
stripe listen --forward-to localhost:3000/api/webhooks/stripe   # copy the whsec_… into STRIPE_WEBHOOK_SECRET
npm run dev
```

1. In the Stripe Dashboard (test mode), set **Settings → Public details → Terms of service** to
   `http://localhost:3000/terms` (later your real URL). Stripe requires it for the Terms checkbox on Checkout.
2. Open http://localhost:3000, pick a plan, tick the box, pay with `4242 4242 4242 4242`.
3. Emails are printed to the terminal (set `RESEND_API_KEY` to send real email). Cancel from **Account → Cancel
   subscription**.
4. Reminders: `npm run reminders` (or `curl -H "Authorization: Bearer $CRON_SECRET" localhost:3000/api/cron/reminders`).
   Use Stripe [test clocks](https://docs.stripe.com/billing/testing/test-clocks) to reach a trial's last days.

## Connect Checkbox (optional, free to start)

- **With a coding agent:** ask it to "connect Checkbox". `AGENTS.md` tells it how (MCP server
  `https://app.checkbox.site/mcp` or the HTTP device login, then one **Approve** click).
- **By hand:** create a free account at https://app.checkbox.site/sign-up, put the test keys in `.env`
  (`CHECKBOX_SECRET_KEY`, `CHECKBOX_PUBLISHABLE_KEY`) and run `npm run checkbox:preflight`.

Checkbox Elements needs an `https` cancellation URL, so it switches on in deployed environments; local `http`
development keeps the built-in markup with the same wording.

## Environment variables

| Name | Required | What |
|---|---|---|
| `STRIPE_SECRET_KEY` | yes | Stripe secret key (`sk_test_…` while testing) |
| `STRIPE_WEBHOOK_SECRET` | yes | Signing secret of the webhook endpoint `/api/webhooks/stripe` (event `checkout.session.completed`) |
| `SESSION_SECRET` | yes | Random string that signs the session cookie |
| `CRON_SECRET` | yes | Random string protecting `/api/cron/reminders` |
| `APP_URL` | no | Public URL; defaults to Render's external URL or `http://localhost:3000` |
| `BRAND_NAME`, `SUPPORT_EMAIL` | no | Shown in the disclosure, emails and terms |
| `RESEND_API_KEY`, `MAIL_FROM` | no | Send email with Resend; otherwise emails go to the log |
| `CHECKBOX_SECRET_KEY`, `CHECKBOX_PUBLISHABLE_KEY` | no | Checkbox keys (consent records, notice schedule, preflight) |

## Deploy

**Render:** the button above creates the web service and a daily cron job from `render.yaml` at the repository root;
it asks for the Stripe keys. Then add the webhook endpoint `https://<your-service>.onrender.com/api/webhooks/stripe`
in Stripe and set the Terms of service URL to `https://<your-service>.onrender.com/terms`.

**Anywhere else:** `npm start` behind HTTPS, plus `npm run reminders` once a day.

## Make it yours

- Plans and prices: `lib/plans.js`. Then run `npm run checkbox:preflight`.
- Login: `lib/session.js` stands in for your auth. Store the Stripe customer id on your user record.
- Email provider: `lib/mail.js`.
- Keep the disclosure directly above the pay button and the consent box unchecked. If you add a retention offer to
  the cancel page, keep the **Cancel subscription** button visible next to it.

## For coding agents

Read `AGENTS.md`. Wording lives in `lib/terms.js` and `lib/emails.js` and is generated from `lib/plans.js`. After
changing checkout, emails or cancellation, run `npm run checkbox:preflight` (or the Checkbox MCP tools) and fix
every `fail`.

## License

MIT. Checkbox is a System1 company. Docs: https://checkbox.site/docs · Support: support@checkbox.site
