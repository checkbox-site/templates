import { NextResponse } from 'next/server';
import { appUrl, store } from '@/lib/config';
import { cancellationEmail } from '@/lib/emails';
import { sendEmail } from '@/lib/mail';
import { customerId } from '@/lib/session';
import { currentPeriodEnd, stripe } from '@/lib/stripe';

export async function POST(request: Request) {
  const base = appUrl();
  const customer = await customerId();
  const form = await request.formData();
  const id = String(form.get('subscription') ?? '');
  if (!customer || !id.startsWith('sub_')) return NextResponse.redirect(`${base}/account/cancel`, 303);

  const sub = await stripe().subscriptions.retrieve(id);
  if (sub.customer !== customer) return NextResponse.redirect(`${base}/account/cancel`, 303);

  // Cancels at the end of the paid period (or when the trial ends): no further charge.
  const updated = await stripe().subscriptions.update(id, { cancel_at_period_end: true, metadata: { canceled_online_at: new Date().toISOString() } });
  const accessEnd = new Date((updated.status === 'trialing' && updated.trial_end ? updated.trial_end : currentPeriodEnd(updated)) * 1000);

  const cus = await stripe().customers.retrieve(customer);
  if (!cus.deleted && cus.email) {
    await sendEmail(cus.email, cancellationEmail(store(), accessEnd)).catch((err) => console.error('cancellation email failed', err));
  }
  return NextResponse.redirect(`${base}/account/cancel/done?until=${accessEnd.toISOString().slice(0, 10)}`, 303);
}
