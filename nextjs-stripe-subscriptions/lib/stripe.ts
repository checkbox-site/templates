import Stripe from 'stripe';
import { requireEnv } from './config';

let client: Stripe | undefined;

export function stripe(): Stripe {
  client ??= new Stripe(requireEnv('STRIPE_SECRET_KEY'), { appInfo: { name: 'checkbox-nextjs-stripe-subscriptions', url: 'https://github.com/checkbox-site/templates' } });
  return client;
}

/** End of the current billing period. Since Stripe API 2025-03-31 it lives on the subscription items. */
export function currentPeriodEnd(sub: Stripe.Subscription): number {
  const ends = sub.items.data.map((i) => i.current_period_end).filter((n): n is number => typeof n === 'number');
  return ends.length ? Math.min(...ends) : (sub.trial_end ?? sub.created);
}

export function subscriptionInterval(sub: Stripe.Subscription): 'month' | 'year' {
  return sub.items.data[0]?.price.recurring?.interval === 'year' ? 'year' : 'month';
}
