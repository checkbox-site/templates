// Online cancellation: reachable from the account page and the footer, one confirmation click, no call, chat or
// retention maze. If you add a retention offer, keep this button visible next to it.
import Link from 'next/link';
import { currentSubscriptions } from '@/lib/subscriptions';
import { currentPeriodEnd } from '@/lib/stripe';
import { formatDate } from '@/lib/emails';
import { store } from '@/lib/config';

export const dynamic = 'force-dynamic';

export default async function CancelPage() {
  const { customer, subscriptions } = await currentSubscriptions();
  const active = subscriptions.filter((s) => !s.cancel_at_period_end);
  const { supportEmail } = store();

  return (
    <main className="checkout">
      <h1>Cancel your subscription</h1>
      {!customer && (
        <p className="lead">
          Sign in to cancel online. In this template, subscribers are recognized by the cookie set after checkout; replace
          lib/session.ts with your login. You can also email {supportEmail}.
        </p>
      )}
      {customer && active.length === 0 && <p className="lead">You have no subscription to cancel. <Link href="/account">Back to your account</Link></p>}
      {active.map((sub) => {
        const ends = new Date(currentPeriodEnd(sub) * 1000);
        return (
          <form key={sub.id} action="/api/cancel" method="post" className="card">
            <input type="hidden" name="subscription" value={sub.id} />
            <p>
              {sub.status === 'trialing'
                ? `Your free trial ends on ${formatDate(sub.trial_end ? new Date(sub.trial_end * 1000) : ends)}. Cancel now and you will not be charged.`
                : `You keep access until ${formatDate(ends)} and will not be charged again.`}
            </p>
            <button className="button danger" type="submit">Cancel subscription</button>
          </form>
        );
      })}
    </main>
  );
}
