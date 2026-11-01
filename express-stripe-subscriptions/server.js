// Express + Stripe Checkout subscription store with automatic-renewal compliance built in.
// Routes mirror the Next.js template: /, /checkout, /account, /account/cancel, /terms, /privacy and the /api/* handlers.
import express from 'express';
import { appUrl, requireEnv, store } from './lib/config.js';
import { findPlan } from './lib/plans.js';
import { checkoutSessionParams } from './lib/checkout-params.js';
import { acknowledgmentEmail, cancellationEmail } from './lib/emails.js';
import { sendEmail } from './lib/mail.js';
import { bindConsent } from './lib/checkbox.js';
import { sendDueReminders } from './lib/reminder-job.js';
import { customerId, setCustomerCookie } from './lib/session.js';
import { currentPeriodEnd, stripe } from './lib/stripe.js';
import * as views from './lib/views.js';

const ELEMENTS_SRC = `${(process.env.CHECKBOX_API_URL ?? 'https://app.checkbox.site').replace(/\/$/, '')}/v1/elements.js`;
const CANCELLABLE = ['trialing', 'active', 'past_due', 'unpaid', 'incomplete'];

export const app = express();
app.disable('x-powered-by');

// The Stripe webhook needs the raw body for signature verification, so it is registered before the form parser.
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  let event;
  try {
    event = stripe().webhooks.constructEvent(req.body, req.headers['stripe-signature'] ?? '', requireEnv('STRIPE_WEBHOOK_SECRET'));
  } catch (err) {
    return res.status(400).send(`Webhook signature verification failed: ${err.message}`);
  }
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    if (session.mode === 'subscription' && typeof session.subscription === 'string') {
      const sub = await stripe().subscriptions.retrieve(session.subscription);
      // Bind the browser consent (cons_…) to the real subscription.
      if (session.metadata?.checkbox_consent) await bindConsent(session.metadata.checkbox_consent, sub.id);
      const plan = findPlan(session.metadata?.plan);
      const email = session.customer_details?.email;
      if (plan && email) {
        const trialEnd = sub.trial_end ? new Date(sub.trial_end * 1000) : undefined;
        await sendEmail(email, acknowledgmentEmail(plan, store(), { trialEnd, nextCharge: trialEnd ?? new Date(currentPeriodEnd(sub) * 1000) }));
      }
    }
  }
  res.json({ received: true });
});

app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));

app.get('/', (_req, res) => res.send(views.pricingPage(store())));

app.get('/checkout', (req, res) => {
  const plan = findPlan(String(req.query.plan ?? ''));
  if (!plan) return res.status(404).send(views.layout(store(), 'Not found', '<main><h1>Plan not found</h1><p><a href="/">See plans</a></p></main>'));
  res.send(views.checkoutPage(store(), plan, { error: req.query.error, publishableKey: process.env.CHECKBOX_PUBLISHABLE_KEY, elementsSrc: ELEMENTS_SRC }));
});

app.post('/api/checkout', async (req, res) => {
  const plan = findPlan(String(req.body.plan ?? ''));
  if (!plan) return res.redirect(303, '/');
  // No payment without affirmative consent to the renewal terms.
  if (!req.body.auto_renew_consent) return res.redirect(303, `/checkout?plan=${encodeURIComponent(plan.id)}&error=consent`);
  const consentId = req.body.checkbox_consent_id || undefined;
  const session = await stripe().checkout.sessions.create(checkoutSessionParams(plan, store(), { appUrl: appUrl(), consentId }));
  res.redirect(303, session.url);
});

app.get('/api/session', async (req, res) => {
  const id = String(req.query.session_id ?? '');
  if (!id) return res.redirect(303, '/');
  const session = await stripe().checkout.sessions.retrieve(id);
  if (session.status !== 'complete' || typeof session.customer !== 'string') return res.redirect(303, '/');
  setCustomerCookie(res, session.customer);
  res.redirect(303, '/account?welcome=1');
});

async function subscriptionsOf(req) {
  const customer = customerId(req);
  if (!customer) return { customer: null, subscriptions: [] };
  const list = await stripe().subscriptions.list({ customer, status: 'all', limit: 10 });
  return { customer, subscriptions: list.data.filter((s) => CANCELLABLE.includes(s.status)) };
}

app.get('/account', async (req, res) => {
  res.send(views.accountPage(store(), { ...(await subscriptionsOf(req)), welcome: Boolean(req.query.welcome), periodEnd: currentPeriodEnd }));
});

// Online cancellation: linked from the account page and the footer, one confirmation click, no call or chat.
app.get('/account/cancel', async (req, res) => {
  res.send(views.cancelPage(store(), { ...(await subscriptionsOf(req)), periodEnd: currentPeriodEnd }));
});

app.post('/api/cancel', async (req, res) => {
  const customer = customerId(req);
  const id = String(req.body.subscription ?? '');
  if (!customer || !id.startsWith('sub_')) return res.redirect(303, '/account/cancel');
  const sub = await stripe().subscriptions.retrieve(id);
  if (sub.customer !== customer) return res.redirect(303, '/account/cancel');
  const updated = await stripe().subscriptions.update(id, { cancel_at_period_end: true, metadata: { canceled_online_at: new Date().toISOString() } });
  const accessEnd = new Date((updated.status === 'trialing' && updated.trial_end ? updated.trial_end : currentPeriodEnd(updated)) * 1000);
  const cus = await stripe().customers.retrieve(customer);
  if (!cus.deleted && cus.email) await sendEmail(cus.email, cancellationEmail(store(), accessEnd)).catch((err) => console.error('cancellation email failed', err));
  res.redirect(303, `/account/cancel/done?until=${accessEnd.toISOString().slice(0, 10)}`);
});

app.get('/account/cancel/done', (req, res) => res.send(views.cancelDonePage(store(), String(req.query.until ?? ''))));
app.get('/terms', (_req, res) => res.send(views.termsPage(store())));
app.get('/privacy', (_req, res) => res.send(views.privacyPage(store())));

app.get('/api/cron/reminders', async (req, res) => {
  if (req.headers.authorization !== `Bearer ${requireEnv('CRON_SECRET')}`) return res.status(401).send('Unauthorized');
  res.json({ sent: await sendDueReminders() });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).send(views.layout(store(), 'Error', '<main><h1>Something went wrong</h1><p>Please try again.</p></main>'));
});

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const port = Number(process.env.PORT ?? 3000);
  app.listen(port, () => console.log(`Listening on ${appUrl()}`));
}
