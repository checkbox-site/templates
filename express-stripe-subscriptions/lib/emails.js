// Generated from the Next.js template's lib/emails.ts (same wording and logic). Keep the two in sync.
// Lifecycle emails required by automatic-renewal laws. The wording follows the templates Checkbox's rules engine
// verifies (POST /v1/checks/email returns them as `template`). Dates are filled in by the caller.
import { every, formatPrice } from './terms.js';
export function formatDate(d) {
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}
function footer(store) {
  return `Questions? Contact us at ${store.supportEmail}.`;
}
/** Sent right after sign-up: restates the terms and how to cancel (a retainable acknowledgment). */
export function acknowledgmentEmail(plan, store, dates) {
  const price = formatPrice(plan.amount, plan.currency);
  const cadence = every(plan.interval);
  const paragraphs = [`Thanks for subscribing to ${store.merchantName}! This email confirms your subscription terms.`];
  if (plan.trialDays > 0 && dates.trialEnd) {
    const end = formatDate(dates.trialEnd);
    paragraphs.push(`Your free trial lasts ${plan.trialDays} days and ends on ${end}. To avoid being charged, cancel before your trial ends at ${store.cancelUrl} — it takes less than a minute. If you do nothing, your subscription starts automatically on ${end} and you will be charged ${price} ${cadence}.`);
  }
  paragraphs.push(`Your ${store.merchantName} subscription automatically renews ${cadence} at ${price} until you cancel. Your next charge is on ${formatDate(dates.nextCharge)}.`);
  paragraphs.push(`How to cancel: go to ${store.cancelUrl} — you can cancel anytime online; cancellation takes effect at the end of your current billing period.`);
  paragraphs.push(footer(store));
  return { kind: 'acknowledgment', subject: `Your ${store.merchantName} subscription is confirmed`, text: paragraphs.join('\n\n') };
}
/** Sent before a free trial converts to paid. */
export function trialReminderEmail(plan, store, trialEnd) {
  const end = formatDate(trialEnd);
  return {
    kind: 'trial_reminder',
    subject: `Your ${store.merchantName} free trial ends on ${end}`,
    text: [
      `Your free trial ends on ${end}. Unless you cancel before then, your ${store.merchantName} subscription will automatically renew and you will be charged ${formatPrice(plan.amount, plan.currency)} ${every(plan.interval)} until you cancel.`,
      `To cancel, go to ${store.cancelUrl} before ${end} — you can cancel anytime online.`,
      footer(store),
    ].join('\n\n'),
  };
}
/** Sent before a yearly (or longer) term renews. */
export function renewalReminderEmail(plan, store, renewal) {
  const date = formatDate(renewal);
  return {
    kind: 'renewal_reminder',
    subject: `Your ${store.merchantName} subscription renews on ${date}`,
    text: [
      `Your ${store.merchantName} subscription will automatically renew on ${date} and you will be charged ${formatPrice(plan.amount, plan.currency)}. It renews ${every(plan.interval)} until you cancel.`,
      `If you do not want to renew, cancel online before ${date} at ${store.cancelUrl}.`,
      footer(store),
    ].join('\n\n'),
  };
}
/** Yearly reminder of the terms for monthly subscriptions (required by some states). */
export function annualTermsEmail(plan, store, nextCharge) {
  return {
    kind: 'annual_terms',
    subject: `A yearly reminder about your ${store.merchantName} subscription`,
    text: [
      `A yearly reminder about your ${store.merchantName} subscription: it automatically renews ${every(plan.interval)} at ${formatPrice(plan.amount, plan.currency)} until you cancel. Your next charge is on ${formatDate(nextCharge)}.`,
      `To cancel, go to ${store.cancelUrl} — you can cancel anytime online; cancellation takes effect at the end of your current billing period.`,
      footer(store),
    ].join('\n\n'),
  };
}
/** Sent when a subscriber cancels. */
export function cancellationEmail(store, accessEnd) {
  return {
    kind: 'cancellation_confirmation',
    subject: `Your ${store.merchantName} subscription has been canceled`,
    text: [
      `Your ${store.merchantName} subscription has been canceled. You will not be charged again, and you keep access until ${formatDate(accessEnd)}.`,
      footer(store),
    ].join('\n\n'),
  };
}
