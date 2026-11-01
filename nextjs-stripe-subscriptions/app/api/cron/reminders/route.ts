// Daily job (vercel.json schedules it; elsewhere call it from any cron with the CRON_SECRET bearer token): sends
// trial-ending, yearly-renewal and yearly-terms reminders inside each state's window, at most once per occurrence.
import type Stripe from 'stripe';
import { findPlan, PLANS, type Plan } from '@/lib/plans';
import { requireEnv, store } from '@/lib/config';
import { annualTermsEmail, renewalReminderEmail, trialReminderEmail, type Email } from '@/lib/emails';
import { sendEmail } from '@/lib/mail';
import { noticeDays } from '@/lib/checkbox';
import { appendSentKey, dueReminders, type DueReminder } from '@/lib/reminders';
import { currentPeriodEnd, stripe, subscriptionInterval } from '@/lib/stripe';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

function planOf(sub: Stripe.Subscription): Plan | undefined {
  return findPlan(sub.metadata.plan) ?? PLANS.find((p) => p.interval === subscriptionInterval(sub));
}

function emailFor(r: DueReminder, plan: Plan): Email {
  if (r.kind === 'trial_reminder') return trialReminderEmail(plan, store(), r.anchor);
  if (r.kind === 'renewal_reminder') return renewalReminderEmail(plan, store(), r.anchor);
  return annualTermsEmail(plan, store(), r.anchor);
}

export async function GET(request: Request) {
  if (request.headers.get('authorization') !== `Bearer ${requireEnv('CRON_SECRET')}`) return new Response('Unauthorized', { status: 401 });
  const now = new Date();
  let sent = 0;
  for await (const sub of stripe().subscriptions.list({ status: 'all', limit: 100, expand: ['data.customer'] })) {
    const plan = planOf(sub);
    const customer = sub.customer as Stripe.Customer | Stripe.DeletedCustomer;
    if (!plan || customer.deleted || !customer.email) continue;
    const due = dueReminders(
      {
        status: sub.status,
        interval: subscriptionInterval(sub),
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        created: sub.start_date ?? sub.created,
        trialEnd: sub.trial_end,
        currentPeriodEnd: currentPeriodEnd(sub),
        sent: (sub.metadata.checkbox_reminders ?? '').split(',').filter(Boolean),
      },
      now,
      await noticeDays(plan),
    );
    let keys = (sub.metadata.checkbox_reminders ?? '').split(',').filter(Boolean);
    for (const r of due) {
      await sendEmail(customer.email, emailFor(r, plan));
      const value = appendSentKey(keys, r.key);
      keys = value.split(',');
      await stripe().subscriptions.update(sub.id, { metadata: { checkbox_reminders: value } });
      sent++;
    }
  }
  return Response.json({ sent });
}
