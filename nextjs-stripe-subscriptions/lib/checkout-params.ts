// The exact params passed to stripe.checkout.sessions.create. Kept free of runtime imports so
// `npm run checkbox:preflight` (and Checkbox's check_stripe_checkout_session) can check the same object the route sends.

import type Stripe from 'stripe';
import type { Plan } from './plans';
import { consentLabel, disclosureText, type StoreInfo } from './terms';

export interface CheckoutContext {
  appUrl: string;
  /** Checkbox consent id (cons_…) from <checkbox-disclosure>, when Checkbox Elements is on. */
  consentId?: string;
  customerEmail?: string;
}

export function checkoutSessionParams(plan: Plan, store: StoreInfo, ctx: CheckoutContext): Stripe.Checkout.SessionCreateParams {
  const metadata: Record<string, string> = { plan: plan.id, auto_renew_consent_at: new Date().toISOString() };
  if (ctx.consentId) metadata.checkbox_consent = ctx.consentId;
  return {
    mode: 'subscription',
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: plan.currency,
          unit_amount: plan.amount,
          recurring: { interval: plan.interval },
          product_data: { name: `${store.merchantName} ${plan.name}` },
        },
      },
    ],
    subscription_data: {
      ...(plan.trialDays > 0 ? { trial_period_days: plan.trialDays } : {}),
      metadata,
    },
    metadata,
    ...(ctx.customerEmail ? { customer_email: ctx.customerEmail } : {}),
    // Stripe shows a required "I agree to the Terms of Service" checkbox. Needs a Terms of Service URL in the Stripe
    // Dashboard (Settings → Public details), e.g. `${appUrl}/terms`.
    consent_collection: { terms_of_service: 'required' },
    custom_text: {
      submit: { message: disclosureText(plan, store) },
      terms_of_service_acceptance: { message: consentLabel(plan, store) },
    },
    success_url: `${ctx.appUrl}/api/session?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${ctx.appUrl}/checkout?plan=${encodeURIComponent(plan.id)}`,
  };
}
