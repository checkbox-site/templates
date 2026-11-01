# Next.js + Stripe subscriptions, with automatic-renewal compliance built in

A working subscription store on Next.js (App Router) and Stripe Checkout that ships with what US automatic-renewal
laws ask of a subscription flow — the renewal disclosure and consent at checkout, the acknowledgment and reminder
emails, and online cancellation — wired to [Checkbox](https://checkbox.site/docs) so you can check it before you
ship and keep a record of each consent.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fcheckbox-site%2Ftemplates%2Ftree%2Fmain%2Fnextjs-stripe-subscriptions&project-name=subscriptions&env=STRIPE_SECRET_KEY,STRIPE_WEBHOOK_SECRET,SESSION_SECRET,CRON_SECRET&envDescription=Stripe%20test%20keys%20and%20two%20random%20secrets%20(openssl%20rand%20-hex%2032)&envLink=https%3A%2F%2Fgithub.com%2Fcheckbox-site%2Ftemplates%2Ftree%2Fmain%2Fnextjs-stripe-subscriptions%23environment-variables)

> This template gives you the mechanics. It is not legal advice, and using it does not by itself make a business
> compliant: your prices, trial, terms of service and how you run cancellations matter too. Checkbox's checks are an
> automated assessment; its rules are pending attorney review.

## What is in it

| Requirement | Where |
|---|---|
| Renewal disclosure directly above the pay button: price, interval, renews until cancelled, trial and the charge after it, how to cancel online. Body size, set off by a border | `app/checkout/page.tsx`, wording in `lib/terms.ts` |
| Consent checkbox for those terms, unchecked and required; the server refuses checkout without it | `app/checkout/page.tsx`, `app/api/checkout/route.ts` |
| The same terms on Stripe's hosted page (`custom_text`) and a required Terms of Service checkbox (`consent_collection`) | `lib/checkout-params.ts` |
| Consent record: with Checkbox keys, `<checkbox-disclosure>` (Checkbox Elements) renders the terms and records the consent; the webhook binds it to the subscription | `app/checkout/page.tsx`, `app/api/webhooks/stripe/route.ts` |
| Acknowledgment email right after sign-up with the terms and how to cancel | `app/api/webhooks/stripe/route.ts`, `lib/emails.ts` |
| Trial-ending reminder, yearly-renewal reminder, yearly terms reminder for monthly plans, timed from Checkbox's notice schedule | `app/api/cron/reminders/route.ts`, `lib/reminders.ts` |
| Online cancellation from the account page and the footer: one confirmation click, no call or chat, confirmation on screen and by email | `app/account/cancel/page.tsx`, `app/api/cancel/route.ts` |
| Terms of Service whose subscription and cancellation sections match the checkout | `app/terms/page.tsx` |
| `npm run checkbox:preflight`: checks the disclosure, the exact Stripe params, every email and the reminder schedule for every plan | `scripts/preflight.ts` |

Every piece of wording is generated from `lib/plans.ts`, so the disclosure, Stripe's text, the emails and the actual
charge cannot drift apart.

## Run it locally

Requirements: Node.js 20.9 or later, a Stripe account (test mode), the [Stripe CLI](https://docs.stripe.com/stripe-cli).

```bash
npm install
cp .env.example .env.local          # fill in STRIPE_SECRET_KEY, SESSION_SECRET, CRON_SECRET
stripe listen --forward-to localhost:3000/api/webhooks/stripe   # copy the whsec_… into STRIPE_WEBHOOK_SECRET
npm run dev
```

1. In the Stripe Dashboard (test mode), set **Settings → Public details → Terms of service** to
   `http://localhost:3000/terms` (later your real URL). Stripe requires it for the Terms checkbox on Checkout.
2. Open http://localhost:3000, pick a plan, tick the box, pay with `4242 4242 4242 4242`.
3. The acknowledgment email is printed in the terminal running `npm run dev` (set `RESEND_API_KEY` to send real
   email). Cancel from **Account → Cancel subscription**.
4. Reminders: `curl -H "Authorization: Bearer $CRON_SECRET" localhost:3000/api/cron/reminders`. Use Stripe
   [test clocks](https://docs.stripe.com/billing/testing/test-clocks) to move a subscription close to its trial end.

## Connect Checkbox (optional, free to start)

Without Checkbox keys the store still works with the built-in disclosure. With them you also get consent records
bound to subscriptions, the reminder schedule from Checkbox's rules, and the preflight script.

- **With a coding agent** (Claude Code, Cursor, Copilot, Windsurf, Codex): ask it to "connect Checkbox". `AGENTS.md`
  tells it how: the MCP server `https://app.checkbox.site/mcp` or the HTTP device login, then one **Approve** click.
- **By hand:** create a free account at https://app.checkbox.site/sign-up, copy the test keys into `.env.local`
  (`CHECKBOX_SECRET_KEY`, `NEXT_PUBLIC_CHECKBOX_PUBLISHABLE_KEY`) and run:

```bash
npm run checkbox:preflight
```

Checkbox Elements needs an `https` cancellation URL, so it switches on in deployed environments; local `http`
development keeps the built-in markup with the same wording.

## Environment variables

| Name | Required | What |
|---|---|---|
| `STRIPE_SECRET_KEY` | yes | Stripe secret key (`sk_test_…` while testing) |
| `STRIPE_WEBHOOK_SECRET` | yes | Signing secret of the webhook endpoint `/api/webhooks/stripe` (event `checkout.session.completed`) |
| `SESSION_SECRET` | yes | Random string that signs the session cookie |
| `CRON_SECRET` | yes | Random string; Vercel Cron sends it to `/api/cron/reminders` |
| `NEXT_PUBLIC_APP_URL` | no | Public URL; defaults to the Vercel production URL or `http://localhost:3000` |
| `NEXT_PUBLIC_BRAND_NAME`, `SUPPORT_EMAIL` | no | Shown in the disclosure, emails and terms |
| `RESEND_API_KEY`, `MAIL_FROM` | no | Send email with Resend; otherwise emails go to the server log |
| `CHECKBOX_SECRET_KEY`, `NEXT_PUBLIC_CHECKBOX_PUBLISHABLE_KEY` | no | Checkbox keys (consent records, notice schedule, preflight) |

## Deploy

**Vercel:** use the button above, then add the webhook endpoint `https://<your-app>/api/webhooks/stripe` in Stripe
for `checkout.session.completed` and put its secret in `STRIPE_WEBHOOK_SECRET`. `vercel.json` runs the reminder job
daily. Set the Terms of service URL in Stripe to `https://<your-app>/terms`.

**Anywhere else** (Render, Fly, Railway, your server): `npm run build && npm start`, plus a daily request to
`/api/cron/reminders` with `Authorization: Bearer $CRON_SECRET`.

## Make it yours

- Plans and prices: `lib/plans.ts`. Then run `npm run checkbox:preflight`.
- Login: `lib/session.ts` stands in for your auth (a signed cookie set after checkout). Store the Stripe customer id
  on your user record and return it from `customerId()`.
- Email provider: `lib/mail.ts`.
- Keep the disclosure directly above the pay button and the consent box unchecked. If you add a retention offer to
  the cancel page, keep the **Cancel subscription** button visible next to it.

## For coding agents

Read `AGENTS.md`. Short version: wording lives in `lib/terms.ts` and `lib/emails.ts` and is generated from
`lib/plans.ts`; do not hand-edit generated sentences into components. After changing checkout, emails or
cancellation, run `npm run checkbox:preflight` (or the Checkbox MCP tools) and fix every `fail`.

## License

MIT. Checkbox is a System1 company. Docs: https://checkbox.site/docs · Support: support@checkbox.site
