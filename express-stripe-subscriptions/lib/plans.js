// Generated from the Next.js template's lib/plans.ts (same wording and logic). Keep the two in sync.
// The plans this store sells. Prices are in minor units (1900 = $19.00). Change them here: every disclosure, Stripe
// Checkout Session, email and reminder is generated from these values, so the wording always matches the charge.
export const PLANS = [
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
export function findPlan(id) {
  return PLANS.find((p) => p.id === id);
}
