// Server-rendered HTML. Every string that is not a constant goes through esc().
import { PLANS } from './plans.js';
import { buttonText, consentLabel, disclosureText, every, formatPrice, perInterval } from './terms.js';
import { formatDate } from './emails.js';

export function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

export function layout(store, title, body, head = '') {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} — ${esc(store.merchantName)}</title>
<link rel="stylesheet" href="/styles.css">
${head}
</head>
<body>
<header class="site"><a class="brand" href="/">${esc(store.merchantName)}</a><nav><a href="/">Pricing</a><a href="/account">Account</a></nav></header>
${body}
<footer class="site"><span>© ${new Date().getFullYear()} ${esc(store.merchantName)}</span><nav><a href="/terms">Terms</a><a href="/privacy">Privacy</a><a href="/account/cancel">Cancel subscription</a></nav></footer>
</body>
</html>`;
}

export function pricingPage(store) {
  const cards = PLANS.map(
    (p) => `<section class="card">
  <h2>${esc(p.name)}</h2>
  <p class="price">${esc(formatPrice(p.amount, p.currency))}<small>${perInterval(p.interval)}</small></p>
  <p class="fine">${p.trialDays > 0 ? `${p.trialDays}-day free trial, then ` : ''}${esc(formatPrice(p.amount, p.currency))} ${every(p.interval)}, renews automatically until you cancel.</p>
  <ul class="features">${p.features.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
  <a class="button" href="/checkout?plan=${esc(p.id)}">${p.trialDays > 0 ? 'Start free trial' : 'Subscribe'}</a>
</section>`,
  ).join('\n');
  return layout(
    store,
    'Pricing',
    `<main><h1>${esc(store.merchantName)} Pro</h1><p class="lead">Start with a free trial. Plans renew automatically until you cancel, and you can cancel online anytime.</p><div class="plans">${cards}</div></main>`,
  );
}

export function checkoutPage(store, plan, { error, publishableKey, elementsSrc }) {
  // Checkbox Elements needs an https cancellation URL, so local http development uses the built-in markup.
  const useElements = Boolean(publishableKey) && store.cancelUrl.startsWith('https://');
  const terms = useElements
    ? `<checkbox-disclosure publishable-key="${esc(publishableKey)}" merchant-name="${esc(store.merchantName)}" amount="${plan.amount}" currency="${esc(plan.currency)}" interval="${plan.interval}" trial-days="${plan.trialDays}" cancel-url="${esc(store.cancelUrl)}" cancel-timing="period_end"></checkbox-disclosure>`
    : `<p class="renewal-terms" data-checkbox-terms>${esc(disclosureText(plan, store))}</p>
    <label class="consent">
      <!-- Never pre-check this box: consent has to be an affirmative act. -->
      <input type="checkbox" name="auto_renew_consent" value="${esc(consentLabel(plan, store))}" required>
      <span>${esc(consentLabel(plan, store))}</span>
    </label>`;
  return layout(
    store,
    plan.name,
    `<main class="checkout">
  <p><a href="/">← All plans</a></p>
  <h1>${esc(store.merchantName)} ${esc(plan.name)}</h1>
  <p class="lead">${esc(formatPrice(plan.amount, plan.currency))}${perInterval(plan.interval)}${plan.trialDays > 0 ? ` after a ${plan.trialDays}-day free trial` : ''}. You pay securely on Stripe in the next step.</p>
  ${error === 'consent' ? '<p class="error" role="alert">Please tick the box to agree to the renewal terms.</p>' : ''}
  <form action="/api/checkout" method="post">
    <input type="hidden" name="plan" value="${esc(plan.id)}">
    ${terms}
    <button class="button" type="submit">${esc(buttonText(plan))}</button>
  </form>
</main>`,
    useElements ? `<script src="${esc(elementsSrc)}" defer></script>` : '',
  );
}

export function accountPage(store, { customer, subscriptions, welcome, periodEnd }) {
  if (!customer) {
    return layout(store, 'Account', `<main><h1>Your account</h1><p class="lead">This template remembers subscribers with a cookie set after checkout. Replace it with your login (lib/session.js).</p><p><a class="button" href="/">See plans</a></p></main>`);
  }
  const cards = subscriptions
    .map((sub) => {
      const price = sub.items.data[0]?.price;
      const ends = new Date(periodEnd(sub) * 1000);
      const status = sub.cancel_at_period_end ? `Canceled — access until ${formatDate(ends)}` : sub.status === 'trialing' ? 'Free trial' : 'Active';
      const next = sub.status === 'trialing' && sub.trial_end ? new Date(sub.trial_end * 1000) : ends;
      return `<section class="card"><h2>Subscription</h2><dl class="facts">
  <dt>Status</dt><dd>${esc(status)}</dd>
  ${price?.unit_amount != null ? `<dt>Price</dt><dd>${esc(formatPrice(price.unit_amount, price.currency))} every ${esc(price.recurring?.interval ?? 'month')}</dd>` : ''}
  ${sub.cancel_at_period_end ? '' : `<dt>${sub.status === 'trialing' ? 'Trial ends / first charge' : 'Next charge'}</dt><dd>${esc(formatDate(next))}</dd>`}
</dl>${sub.cancel_at_period_end ? '' : '<p><a class="button secondary" href="/account/cancel">Cancel subscription</a></p>'}</section>`;
    })
    .join('\n');
  return layout(
    store,
    'Account',
    `<main><h1>Your account</h1>${welcome ? '<p class="lead">Thanks for subscribing. We emailed you a confirmation with your terms and how to cancel.</p>' : ''}${subscriptions.length ? cards : '<p>You have no active subscription. <a href="/">See plans</a></p>'}</main>`,
  );
}

export function cancelPage(store, { customer, subscriptions, periodEnd }) {
  const active = subscriptions.filter((s) => !s.cancel_at_period_end);
  let body = '';
  if (!customer) body = `<p class="lead">Sign in to cancel online. In this template, subscribers are recognized by the cookie set after checkout; replace lib/session.js with your login. You can also email ${esc(store.supportEmail)}.</p>`;
  else if (!active.length) body = '<p class="lead">You have no subscription to cancel. <a href="/account">Back to your account</a></p>';
  body += active
    .map((sub) => {
      const ends = new Date(periodEnd(sub) * 1000);
      const text =
        sub.status === 'trialing'
          ? `Your free trial ends on ${formatDate(sub.trial_end ? new Date(sub.trial_end * 1000) : ends)}. Cancel now and you will not be charged.`
          : `You keep access until ${formatDate(ends)} and will not be charged again.`;
      return `<form action="/api/cancel" method="post" class="card"><input type="hidden" name="subscription" value="${esc(sub.id)}"><p>${esc(text)}</p><button class="button danger" type="submit">Cancel subscription</button></form>`;
    })
    .join('\n');
  return layout(store, 'Cancel your subscription', `<main class="checkout"><h1>Cancel your subscription</h1>${body}</main>`);
}

export function cancelDonePage(store, until) {
  const date = until && /^\d{4}-\d{2}-\d{2}$/.test(until) ? formatDate(new Date(`${until}T00:00:00Z`)) : null;
  return layout(
    store,
    'Canceled',
    `<main class="checkout"><h1>Your subscription is canceled</h1><p class="lead">You will not be charged again${date ? `, and you keep access until ${esc(date)}` : ''}. We also sent you a confirmation email.</p><p><a class="button secondary" href="/account">Back to your account</a></p></main>`,
  );
}

export function termsPage(store) {
  const plans = PLANS.map((p) => `<li>${esc(p.name)}: ${esc(formatPrice(p.amount, p.currency))} ${every(p.interval)}${p.trialDays > 0 ? `, after a ${p.trialDays}-day free trial` : ''}.</li>`).join('');
  return layout(
    store,
    'Terms of Service',
    `<main class="checkout"><h1>Terms of Service</h1><p class="fine">Template text. Replace it with terms reviewed for your business.</p>
<h2>Subscriptions and automatic renewal</h2><p>${esc(store.merchantName)} plans are subscriptions that renew automatically at the end of each billing period, at the price shown at checkout, until you cancel:</p><ul>${plans}</ul>
<p>If your plan includes a free trial, you will not be charged if you cancel before the trial ends. We email you before a trial converts to a paid plan and before a yearly plan renews.</p>
<h2>Cancellation</h2><p>You can cancel anytime online at <a href="${esc(store.cancelUrl)}">${esc(store.cancelUrl)}</a>, without contacting us. Cancellation takes effect at the end of your current billing period; you keep access until then and are not charged again. We confirm every cancellation by email.</p>
<h2>Price changes</h2><p>We tell you about any price change by email before it takes effect, and you can cancel before it applies.</p>
<h2>Contact</h2><p>Questions: ${esc(store.supportEmail)}</p></main>`,
  );
}

export function privacyPage(store) {
  return layout(
    store,
    'Privacy Policy',
    `<main class="checkout"><h1>Privacy Policy</h1><p class="fine">Template text. Replace it with a policy that describes what your business actually does.</p><p>We collect the information needed to run your subscription: your email address and billing details (processed by Stripe), and a record of your agreement to the renewal terms (the terms shown, the time and the page), which we keep to show what you agreed to. We use your email to send the confirmation, reminders before a trial ends or a yearly plan renews, and cancellation confirmations.</p><p>Questions or requests: ${esc(store.supportEmail)}</p></main>`,
  );
}
