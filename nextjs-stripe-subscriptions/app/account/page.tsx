import Link from 'next/link';
import { currentSubscriptions } from '@/lib/subscriptions';
import { currentPeriodEnd } from '@/lib/stripe';
import { formatDate } from '@/lib/emails';
import { formatPrice } from '@/lib/terms';

export const dynamic = 'force-dynamic';

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const { welcome } = await searchParams;
  const { customer, subscriptions } = await currentSubscriptions();

  if (!customer) {
    return (
      <main>
        <h1>Your account</h1>
        <p className="lead">
          This template remembers subscribers with a cookie set after checkout. Replace it with your login (lib/session.ts).
        </p>
        <p><Link className="button" href="/">See plans</Link></p>
      </main>
    );
  }

  return (
    <main>
      <h1>Your account</h1>
      {welcome && <p className="lead">Thanks for subscribing. We emailed you a confirmation with your terms and how to cancel.</p>}
      {subscriptions.length === 0 && <p>You have no active subscription. <Link href="/">See plans</Link></p>}
      {subscriptions.map((sub) => {
        const item = sub.items.data[0];
        const price = item?.price;
        const ends = new Date(currentPeriodEnd(sub) * 1000);
        return (
          <section key={sub.id} className="card">
            <h2>Subscription</h2>
            <dl className="facts">
              <dt>Status</dt>
              <dd>{sub.cancel_at_period_end ? `Canceled — access until ${formatDate(ends)}` : sub.status === 'trialing' ? 'Free trial' : 'Active'}</dd>
              {price?.unit_amount != null && (
                <>
                  <dt>Price</dt>
                  <dd>{formatPrice(price.unit_amount, price.currency)} every {price.recurring?.interval ?? 'month'}</dd>
                </>
              )}
              {!sub.cancel_at_period_end && (
                <>
                  <dt>{sub.status === 'trialing' ? 'Trial ends / first charge' : 'Next charge'}</dt>
                  <dd>{formatDate(sub.status === 'trialing' && sub.trial_end ? new Date(sub.trial_end * 1000) : ends)}</dd>
                </>
              )}
            </dl>
            {!sub.cancel_at_period_end && (
              <p><Link className="button secondary" href="/account/cancel">Cancel subscription</Link></p>
            )}
          </section>
        );
      })}
    </main>
  );
}
