// Automatic-renewal wording, generated from the plan so it always matches what Stripe charges.
//
// The sentences follow the wording Checkbox's rules engine verifies (POST /v1/checks/disclosure returns it as
// `replacement`), so the disclosure, the consent label, the Stripe Checkout text and the emails all state the same
// terms: that it renews automatically until cancelled, the price, how often, the trial and what is charged after it,
// and how to cancel online. Run `npm run checkbox:preflight` after changing anything here.

import type { Interval, Plan } from './plans';

export interface StoreInfo {
  /** The brand customers know, e.g. "Acme". */
  merchantName: string;
  /** Absolute URL of the online cancellation page, e.g. https://acme.example/account/cancel. */
  cancelUrl: string;
  /** Where customers can write to, e.g. support@acme.example. */
  supportEmail: string;
}

export function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase(), minimumFractionDigits: 2 }).format(amount / 100);
}

export function every(interval: Interval): string {
  return interval === 'year' ? 'every year' : 'every month';
}

export function perInterval(interval: Interval): string {
  return interval === 'year' ? '/year' : '/month';
}

/** The disclosure shown directly above the pay button (and in Stripe Checkout's submit text). */
export function disclosureText(plan: Plan, store: StoreInfo): string {
  const price = formatPrice(plan.amount, plan.currency);
  const cadence = every(plan.interval);
  const parts: string[] = [];
  if (plan.trialDays > 0) {
    parts.push(`Your free trial lasts ${plan.trialDays} days, then ${price} ${cadence}. Cancel before the trial ends and you won't be charged.`);
  }
  parts.push(`Your ${store.merchantName} subscription automatically renews ${cadence} at ${price} (plus applicable taxes) until you cancel.`);
  parts.push(`You can cancel anytime online at ${store.cancelUrl}; cancellation takes effect at the end of your current billing period.`);
  parts.push(
    plan.trialDays > 0
      ? 'To avoid the next charge, cancel before the end of your free trial and, after that, before each billing date.'
      : 'To avoid the next charge, cancel before your next billing date.',
  );
  return parts.join(' ');
}

/** Label of the consent checkbox (unchecked by default, required). */
export function consentLabel(plan: Plan, store: StoreInfo): string {
  const price = formatPrice(plan.amount, plan.currency);
  const lead = plan.trialDays > 0 ? `I agree that after my ${plan.trialDays}-day free trial, my` : 'I agree that my';
  return `${lead} ${store.merchantName} subscription renews automatically ${every(plan.interval)} at ${price} (plus applicable taxes) until I cancel, and I understand I can cancel anytime online at ${store.cancelUrl}.`;
}

/** Text of the pay button. */
export function buttonText(plan: Plan): string {
  const price = `${formatPrice(plan.amount, plan.currency)}${perInterval(plan.interval)}`;
  return plan.trialDays > 0 ? `Start free trial — ${price}, renews automatically` : `Subscribe — ${price}, renews automatically`;
}
