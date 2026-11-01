// Generated from the Next.js template's lib/checkbox.ts (same wording and logic). Keep the two in sync.
// Minimal Checkbox API client (https://checkbox.site/docs/api). Every call is optional: without CHECKBOX_SECRET_KEY
// the store still works, it just does not record consents or fetch the notice schedule. Checkbox failures are logged
// and never block a checkout or a cancellation.
import { DEFAULT_NOTICE_DAYS } from './reminders.js';
const API = (process.env.CHECKBOX_API_URL ?? 'https://app.checkbox.site').replace(/\/$/, '');
export function checkboxEnabled() {
  return Boolean(process.env.CHECKBOX_SECRET_KEY);
}
export async function checkbox(method, path, body) {
  const key = process.env.CHECKBOX_SECRET_KEY;
  if (!key)
    return null;
  try {
    const res = await fetch(`${API}${path}`, {
      method,
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'User-Agent': 'checkbox-express-template' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });
    const json = (await res.json().catch(() => null));
    if (!res.ok) {
      console.warn(`[checkbox] ${method} ${path} → ${res.status}`, json);
      return null;
    }
    return json;
  }
  catch (err) {
    console.warn(`[checkbox] ${method} ${path} failed`, err);
    return null;
  }
}
/** Binds the browser consent (cons_…) to the real subscription, so the consent record names it. */
export async function bindConsent(consentId, subscriptionId) {
  if (!/^cons_[A-Za-z0-9]+$/.test(consentId))
    return;
  await checkbox('POST', `/v1/consents/${consentId}`, { customer_reference: subscriptionId });
}
const SCHEDULE_KIND = { trial_ending: 'trial_reminder', renewal_reminder: 'renewal_reminder', annual_terms: 'annual_terms' };
/** Days before each event the notices go out, from Checkbox's notice schedule (cached per plan for a day). */
const cache = new Map();
export async function noticeDays(plan) {
  const hit = cache.get(plan.id);
  if (hit && Date.now() - hit.at < 86_400_000)
    return hit.days;
  const res = await checkbox('POST', '/v1/checks/notice_schedule', {
    terms: { amount: plan.amount, currency: plan.currency, interval: plan.interval, trial_days: plan.trialDays },
    cycles: 1,
  });
  const days = { ...DEFAULT_NOTICE_DAYS };
  const fromSchedule = new Set();
  for (const n of res?.notices ?? []) {
    const kind = SCHEDULE_KIND[n.kind];
    if (!kind || !(n.days_before > 0))
      continue;
    // The earliest notice any state asks for wins, so one email satisfies every window.
    days[kind] = fromSchedule.has(kind) ? Math.max(days[kind], Math.ceil(n.days_before)) : Math.ceil(n.days_before);
    fromSchedule.add(kind);
  }
  cache.set(plan.id, { at: Date.now(), days });
  return days;
}
