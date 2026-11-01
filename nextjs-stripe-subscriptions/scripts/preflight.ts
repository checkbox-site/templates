// Checks this store's renewal terms with Checkbox before you ship: the checkout disclosure and consent label, the exact
// Stripe Checkout Session params, every lifecycle email and the reminder schedule, for every plan in lib/plans.ts.
//
//   CHECKBOX_SECRET_KEY=ck_test_... npm run checkbox:preflight
//
// Exit code 1 when any check fails, so it can run in CI. Docs: https://checkbox.site/docs/preflight

import { PLANS } from '../lib/plans';
import { buttonText, consentLabel, disclosureText, type StoreInfo } from '../lib/terms';
import { checkoutSessionParams } from '../lib/checkout-params';
import { acknowledgmentEmail, annualTermsEmail, cancellationEmail, renewalReminderEmail, trialReminderEmail } from '../lib/emails';

const API = (process.env.CHECKBOX_API_URL ?? 'https://app.checkbox.site').replace(/\/$/, '');
const KEY = process.env.CHECKBOX_SECRET_KEY;
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://acme.example').replace(/\/$/, '');
const store: StoreInfo = {
  merchantName: process.env.NEXT_PUBLIC_BRAND_NAME ?? 'Acme',
  cancelUrl: `${APP_URL}/account/cancel`,
  supportEmail: process.env.SUPPORT_EMAIL ?? 'support@acme.example',
};

interface Report {
  verdict: string;
  checks?: Array<{ check_id: string; status: string; explanation?: string; fix?: string }>;
  notices?: Array<{ kind: string; send_date: string; days_before: number; jurisdictions: string[] }>;
}

async function check(kind: string, body: unknown): Promise<Report> {
  const res = await fetch(`${API}/v1/checks/${kind}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as Report & { error?: { message: string } };
  if (!res.ok) throw new Error(`${kind}: ${res.status} ${json.error?.message ?? ''}`);
  return json;
}

async function main(): Promise<void> {
  if (!KEY) {
    console.error('Set CHECKBOX_SECRET_KEY (a free ck_test_ key: https://app.checkbox.site/sign-up, or ask your coding agent to connect Checkbox).');
    process.exit(2);
  }
  let failed = 0;
  const show = (label: string, r: Report) => {
    const bad = (r.checks ?? []).filter((c) => c.status === 'fail' || c.status === 'needs_review');
    console.log(`${r.verdict === 'fail' ? 'FAIL' : r.verdict === 'pass' ? 'pass' : r.verdict}  ${label}`);
    for (const c of bad) console.log(`      ${c.status}: ${c.check_id}${c.fix ? ` — ${c.fix}` : ''}`);
    if (r.verdict === 'fail') failed++;
  };

  for (const plan of PLANS) {
    const terms = { merchant_name: store.merchantName, plan_name: plan.name, amount: plan.amount, currency: plan.currency, interval: plan.interval, trial_days: plan.trialDays, cancel_url: store.cancelUrl, cancel_timing: 'period_end' };
    console.log(`\n${plan.id}`);
    show('checkout disclosure + consent', await check('disclosure', {
      ...terms,
      text: disclosureText(plan, store),
      button_text: buttonText(plan),
      placement: { above_button: true, same_page_as_payment: true, font_size_px: 16, body_font_size_px: 16, bold: true, boxed: true },
      consent: { checkbox: true, prechecked: false, required: true, label: consentLabel(plan, store) },
    }));
    show('Stripe Checkout Session params', await check('stripe_checkout_session', { params: checkoutSessionParams(plan, store, { appUrl: APP_URL }), merchant: terms }));

    const day = 86_400_000;
    const trialEnd = new Date(Date.now() + plan.trialDays * day);
    const emails = [
      acknowledgmentEmail(plan, store, { trialEnd: plan.trialDays ? trialEnd : undefined, nextCharge: trialEnd }),
      ...(plan.trialDays ? [trialReminderEmail(plan, store, trialEnd)] : []),
      plan.interval === 'year' ? renewalReminderEmail(plan, store, new Date(Date.now() + 365 * day)) : annualTermsEmail(plan, store, new Date(Date.now() + 365 * day)),
      cancellationEmail(store, trialEnd),
    ];
    for (const e of emails) show(`email: ${e.kind}`, await check('email', { kind: e.kind, subject: e.subject, text: e.text, terms }));

    const schedule = await check('notice_schedule', { terms, cycles: 1 });
    for (const n of schedule.notices ?? []) console.log(`      notice ${n.kind}: ${n.days_before} days before (${n.jurisdictions.join(', ')})`);
  }
  console.log(failed ? `\n${failed} check(s) failed.` : '\nAll checks passed. Checkbox output is an automated assessment, not legal advice.');
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
