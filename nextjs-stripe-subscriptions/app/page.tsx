import Link from 'next/link';
import { PLANS } from '@/lib/plans';
import { every, formatPrice, perInterval } from '@/lib/terms';
import { store } from '@/lib/config';

export default function PricingPage() {
  const { merchantName } = store();
  return (
    <main>
      <h1>{merchantName} Pro</h1>
      <p className="lead">Start with a free trial. Plans renew automatically until you cancel, and you can cancel online anytime.</p>
      <div className="plans">
        {PLANS.map((plan) => (
          <section key={plan.id} className="card" aria-labelledby={`plan-${plan.id}`}>
            <h2 id={`plan-${plan.id}`}>{plan.name}</h2>
            <p className="price">
              {formatPrice(plan.amount, plan.currency)}
              <small>{perInterval(plan.interval)}</small>
            </p>
            <p className="fine">
              {plan.trialDays > 0 ? `${plan.trialDays}-day free trial, then ` : ''}
              {formatPrice(plan.amount, plan.currency)} {every(plan.interval)}, renews automatically until you cancel.
            </p>
            <ul className="features">
              {plan.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <Link className="button" href={`/checkout?plan=${plan.id}`}>
              {plan.trialDays > 0 ? 'Start free trial' : 'Subscribe'}
            </Link>
          </section>
        ))}
      </div>
    </main>
  );
}
