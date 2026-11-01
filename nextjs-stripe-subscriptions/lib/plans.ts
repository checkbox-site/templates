// The plans this store sells. Prices are in minor units (1900 = $19.00). Change them here: every disclosure, Stripe
// Checkout Session, email and reminder is generated from these values, so the wording always matches the charge.

export type Interval = 'month' | 'year';

export interface Plan {
  id: string;
  name: string;
  /** Recurring price in minor units. */
  amount: number;
  currency: string;
  interval: Interval;
  /** Free-trial length in days; 0 for no trial. */
  trialDays: number;
  features: string[];
}

export const PLANS: Plan[] = [
  {
    id: 'pro-monthly',
    name: 'Pro',
    amount: 1900,
    currency: 'usd',
    interval: 'month',
    trialDays: 14,
    features: ['Everything in the product', 'Email support', 'Cancel online anytime'],
  },
  {
    id: 'pro-annual',
    name: 'Pro (annual)',
    amount: 19000,
    currency: 'usd',
    interval: 'year',
    trialDays: 14,
    features: ['Everything in Pro', 'Two months free compared with monthly', 'Cancel online anytime'],
  },
];

export function findPlan(id: string | null | undefined): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}
