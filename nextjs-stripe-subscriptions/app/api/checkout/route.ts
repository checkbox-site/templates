import { NextResponse } from 'next/server';
import { findPlan } from '@/lib/plans';
import { appUrl, store } from '@/lib/config';
import { checkoutSessionParams } from '@/lib/checkout-params';
import { stripe } from '@/lib/stripe';

export async function POST(request: Request) {
  const form = await request.formData();
  const plan = findPlan(String(form.get('plan') ?? ''));
  const base = appUrl();
  if (!plan) return NextResponse.redirect(`${base}/`, 303);

  // No payment without affirmative consent to the renewal terms.
  if (!form.get('auto_renew_consent')) {
    return NextResponse.redirect(`${base}/checkout?plan=${encodeURIComponent(plan.id)}&error=consent`, 303);
  }
  const consentId = String(form.get('checkbox_consent_id') ?? '') || undefined;

  const session = await stripe().checkout.sessions.create(checkoutSessionParams(plan, store(), { appUrl: base, consentId }));
  if (!session.url) throw new Error('Stripe did not return a Checkout URL');
  return NextResponse.redirect(session.url, 303);
}
