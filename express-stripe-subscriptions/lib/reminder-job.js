// Sends trial-ending, yearly-renewal and yearly-terms reminders that are due today, at most once per occurrence.
// Run daily: `npm run reminders` (Render cron job in render.yaml) or GET /api/cron/reminders with the CRON_SECRET.
import { findPlan, PLANS } from './plans.js';
import { store } from './config.js';
import { annualTermsEmail, renewalReminderEmail, trialReminderEmail } from './emails.js';
import { sendEmail } from './mail.js';
import { noticeDays } from './checkbox.js';
import { appendSentKey, dueReminders } from './reminders.js';
import { currentPeriodEnd, stripe, subscriptionInterval } from './stripe.js';

function emailFor(r, plan) {
  if (r.kind === 'trial_reminder') return trialReminderEmail(plan, store(), r.anchor);
  if (r.kind === 'renewal_reminder') return renewalReminderEmail(plan, store(), r.anchor);
  return annualTermsEmail(plan, store(), r.anchor);
}

export async function sendDueReminders(now = new Date()) {
  let sent = 0;
  for await (const sub of stripe().subscriptions.list({ status: 'all', limit: 100, expand: ['data.customer'] })) {
    const plan = findPlan(sub.metadata.plan) ?? PLANS.find((p) => p.interval === subscriptionInterval(sub));
    const customer = sub.customer;
    if (!plan || customer.deleted || !customer.email) continue;
    let keys = (sub.metadata.checkbox_reminders ?? '').split(',').filter(Boolean);
    const due = dueReminders(
      {
        status: sub.status,
        interval: subscriptionInterval(sub),
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        created: sub.start_date ?? sub.created,
        trialEnd: sub.trial_end,
        currentPeriodEnd: currentPeriodEnd(sub),
        sent: keys,
      },
      now,
      await noticeDays(plan),
    );
    for (const r of due) {
      await sendEmail(customer.email, emailFor(r, plan));
      const value = appendSentKey(keys, r.key);
      keys = value.split(',');
      await stripe().subscriptions.update(sub.id, { metadata: { checkbox_reminders: value } });
      sent++;
    }
  }
  return sent;
}
