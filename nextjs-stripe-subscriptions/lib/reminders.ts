// Which reminder emails are due for a subscription today. Pure: the cron route feeds it Stripe data.
//
// How many days before the event each notice goes out comes from Checkbox's notice schedule
// (POST /v1/checks/notice_schedule) when CHECKBOX_SECRET_KEY is set; the defaults below are that schedule's answer
// for the plans in lib/plans.ts (14-day trial; monthly and yearly). If you change the trial length or add plans,
// re-run `npm run checkbox:preflight`, which prints the schedule for every plan.

import type { Interval } from './plans';

export type ReminderKind = 'trial_reminder' | 'renewal_reminder' | 'annual_terms';

export type NoticeDays = Record<ReminderKind, number>;

export const DEFAULT_NOTICE_DAYS: NoticeDays = {
  trial_reminder: 5,
  renewal_reminder: 30,
  annual_terms: 32,
};

export interface SubscriptionFacts {
  status: string;
  interval: Interval;
  cancelAtPeriodEnd: boolean;
  /** Unix seconds. */
  created: number;
  trialEnd?: number | null;
  currentPeriodEnd: number;
  /** Keys of reminders already sent (stored in the subscription's metadata). */
  sent: string[];
}

export interface DueReminder {
  kind: ReminderKind;
  /** The event the reminder is about: trial end, renewal or the next charge after the anniversary. */
  anchor: Date;
  /** Dedupe key, unique per subscription and occurrence. */
  key: string;
}

const DAY = 86_400_000;

function isDue(anchor: Date, daysBefore: number, now: Date): boolean {
  const until = anchor.getTime() - now.getTime();
  // Send from `daysBefore` days ahead until the event; a missed cron day catches up the next day.
  return until > 0 && until <= daysBefore * DAY;
}

/** The next yearly anniversary of the sign-up, strictly after `now`. */
export function nextAnniversary(created: Date, now: Date): Date {
  const d = new Date(created);
  d.setUTCFullYear(created.getUTCFullYear() + 1);
  while (d.getTime() <= now.getTime()) d.setUTCFullYear(d.getUTCFullYear() + 1);
  return d;
}

export function dueReminders(sub: SubscriptionFacts, now: Date, days: NoticeDays = DEFAULT_NOTICE_DAYS): DueReminder[] {
  if (sub.cancelAtPeriodEnd || !['trialing', 'active', 'past_due'].includes(sub.status)) return [];
  const out: DueReminder[] = [];
  const add = (kind: ReminderKind, anchor: Date) => {
    const key = `${kind}:${anchor.toISOString().slice(0, 10)}`;
    if (!sub.sent.includes(key) && isDue(anchor, days[kind], now)) out.push({ kind, anchor, key });
  };
  if (sub.status === 'trialing' && sub.trialEnd) add('trial_reminder', new Date(sub.trialEnd * 1000));
  if (sub.status !== 'trialing' && sub.interval === 'year') add('renewal_reminder', new Date(sub.currentPeriodEnd * 1000));
  if (sub.interval === 'month') {
    const anniversary = nextAnniversary(new Date(sub.created * 1000), now);
    // The reminder names the first charge on or after the anniversary.
    if (isDue(anniversary, days.annual_terms, now)) {
      const key = `annual_terms:${anniversary.toISOString().slice(0, 10)}`;
      if (!sub.sent.includes(key)) out.push({ kind: 'annual_terms', anchor: new Date(Math.max(anniversary.getTime(), sub.currentPeriodEnd * 1000)), key });
    }
  }
  return out;
}

/** Keeps the dedupe list inside Stripe's 500-character metadata value limit (oldest keys dropped first). */
export function appendSentKey(sent: string[], key: string): string {
  const all = [...sent, key];
  while (all.join(',').length > 500) all.shift();
  return all.join(',');
}
