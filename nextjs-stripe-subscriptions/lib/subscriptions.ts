import type Stripe from 'stripe';
import { customerId } from './session';
import { stripe } from './stripe';

/** The signed-in customer's subscriptions that can still be cancelled (newest first). */
export async function currentSubscriptions(): Promise<{ customer: string | null; subscriptions: Stripe.Subscription[] }> {
  const customer = await customerId();
  if (!customer) return { customer: null, subscriptions: [] };
  const list = await stripe().subscriptions.list({ customer, status: 'all', limit: 10 });
  return { customer, subscriptions: list.data.filter((s) => ['trialing', 'active', 'past_due', 'unpaid', 'incomplete'].includes(s.status)) };
}
