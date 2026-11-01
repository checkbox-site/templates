import Script from 'next/script';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { findPlan } from '@/lib/plans';
import { buttonText, consentLabel, disclosureText, formatPrice, perInterval } from '@/lib/terms';
import { store } from '@/lib/config';

const ELEMENTS_SRC = `${(process.env.NEXT_PUBLIC_CHECKBOX_API_URL ?? 'https://app.checkbox.site').replace(/\/$/, '')}/v1/elements.js`;

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ plan?: string; error?: string }> }) {
  const params = await searchParams;
  const plan = findPlan(params.plan);
  if (!plan) notFound();
  const info = store();
  const publishableKey = process.env.NEXT_PUBLIC_CHECKBOX_PUBLISHABLE_KEY;
  // Checkbox Elements renders the same verified wording, keeps the button disabled until the box is ticked and records
  // the consent (cons_…). It needs an https cancellation URL, so local http development uses the built-in markup.
  const useElements = Boolean(publishableKey) && info.cancelUrl.startsWith('https://');

  return (
    <main className="checkout">
      <p><Link href="/">← All plans</Link></p>
      <h1>{info.merchantName} {plan.name}</h1>
      <p className="lead">
        {formatPrice(plan.amount, plan.currency)}
        {perInterval(plan.interval)}
        {plan.trialDays > 0 ? ` after a ${plan.trialDays}-day free trial` : ''}. You pay securely on Stripe in the next step.
      </p>

      {params.error === 'consent' && <p className="error" role="alert">Please tick the box to agree to the renewal terms.</p>}

      <form action="/api/checkout" method="post">
        <input type="hidden" name="plan" value={plan.id} />
        {useElements ? (
          <>
            <Script src={ELEMENTS_SRC} strategy="afterInteractive" />
            <checkbox-disclosure
              publishable-key={publishableKey}
              merchant-name={info.merchantName}
              amount={String(plan.amount)}
              currency={plan.currency}
              interval={plan.interval}
              trial-days={String(plan.trialDays)}
              cancel-url={info.cancelUrl}
              cancel-timing="period_end"
            />
          </>
        ) : (
          <>
            {/* The renewal terms: directly above the button, body size, set off by a border and background. */}
            <p className="renewal-terms" data-checkbox-terms>{disclosureText(plan, info)}</p>
            <label className="consent">
              {/* Never pre-check this box: consent has to be an affirmative act. */}
              <input type="checkbox" name="auto_renew_consent" value={consentLabel(plan, info)} required />
              <span>{consentLabel(plan, info)}</span>
            </label>
          </>
        )}
        <button className="button" type="submit">{buttonText(plan)}</button>
      </form>
    </main>
  );
}
