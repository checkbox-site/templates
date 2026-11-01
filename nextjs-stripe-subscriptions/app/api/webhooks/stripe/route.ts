// Stripe webhook: on a completed checkout, bind the Checkbox consent to the subscription and send the acknowledgment
// email. Add the endpoint in Stripe (Developers → Webhooks) for `checkout.session.completed`, or locally:
//   stripe listen --forward-to localhost:3000/api/webhooks/stripe
import type Stripe from 'stripe';
import { findPlan } from '@/lib/plans';
import { requireEnv, store } from '@/lib/config';
import { acknowledgmentEmail } from '@/lib/emails';
import { sendEmail } from '@/lib/mail';
import { bindConsent } from '@/lib/checkbox';
import { currentPeriodEnd, stripe } from '@/lib/stripe';

export async function POST(request: Request) {
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(await request.text(), request.headers.get('stripe-signature') ?? '', requireEnv('STRIPE_WEBHOOK_SECRET'));
  } catch (err) {
    return new Response(`Webhook signature verification failed: ${err instanceof Error ? err.message : err}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    if (session.mode === 'subscription' && typeof session.subscription === 'string') {
      const sub = await stripe().subscriptions.retrieve(session.subscription);
      const consent = session.metadata?.checkbox_consent;
      if (consent) await bindConsent(consent, sub.id);

      const plan = findPlan(session.metadata?.plan);
      const email = session.customer_details?.email;
      if (plan && email) {
        const trialEnd = sub.trial_end ? new Date(sub.trial_end * 1000) : undefined;
        const nextCharge = trialEnd ?? new Date(currentPeriodEnd(sub) * 1000);
        await sendEmail(email, acknowledgmentEmail(plan, store(), { trialEnd, nextCharge }));
      }
    }
  }
  return Response.json({ received: true });
}
