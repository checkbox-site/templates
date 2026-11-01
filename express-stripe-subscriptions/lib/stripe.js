import Stripe from 'stripe';
import { requireEnv } from './config.js';

let client;

/** @returns {import('stripe').Stripe} */
export function stripe() {
  client ??= new Stripe(requireEnv('STRIPE_SECRET_KEY'), { appInfo: { name: 'checkbox-express-stripe-subscriptions', url: 'https://github.com/checkbox-site/templates' } });
  return client;
}

/** End of the current billing period. Since Stripe API 2025-03-31 it lives on the subscription items. */
export function currentPeriodEnd(sub) {
  const ends = sub.items.data.map((i) => i.current_period_end).filter((n) => typeof n === 'number');
  return ends.length ? Math.min(...ends) : (sub.trial_end ?? sub.created);
}

export function subscriptionInterval(sub) {
  return sub.items.data[0]?.price.recurring?.interval === 'year' ? 'year' : 'month';
}
