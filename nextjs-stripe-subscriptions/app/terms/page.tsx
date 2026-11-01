// Starter Terms of Service. Have them reviewed for your business. The subscription and cancellation sections must
// match what the checkout says: online cancellation, no "no cancellations" or "call to cancel" clauses.
import { PLANS } from '@/lib/plans';
import { every, formatPrice } from '@/lib/terms';
import { store } from '@/lib/config';

export default function TermsPage() {
  const info = store();
  return (
    <main className="checkout">
      <h1>Terms of Service</h1>
      <p className="fine">Template text. Replace it with terms reviewed for your business.</p>
      <h2>Subscriptions and automatic renewal</h2>
      <p>
        {info.merchantName} plans are subscriptions that renew automatically at the end of each billing period, at the price
        shown at checkout, until you cancel:
      </p>
      <ul>
        {PLANS.map((p) => (
          <li key={p.id}>
            {p.name}: {formatPrice(p.amount, p.currency)} {every(p.interval)}
            {p.trialDays > 0 ? `, after a ${p.trialDays}-day free trial` : ''}.
          </li>
        ))}
      </ul>
      <p>
        If your plan includes a free trial, you will not be charged if you cancel before the trial ends. We email you before
        a trial converts to a paid plan and before a yearly plan renews.
      </p>
      <h2>Cancellation</h2>
      <p>
        You can cancel anytime online at <a href={info.cancelUrl}>{info.cancelUrl}</a>, without contacting us.
        Cancellation takes effect at the end of your current billing period; you keep access until then and are not charged
        again. We confirm every cancellation by email.
      </p>
      <h2>Price changes</h2>
      <p>We tell you about any price change by email before it takes effect, and you can cancel before it applies.</p>
      <h2>Contact</h2>
      <p>Questions: {info.supportEmail}</p>
    </main>
  );
}
