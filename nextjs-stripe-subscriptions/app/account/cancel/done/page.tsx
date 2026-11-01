import Link from 'next/link';
import { formatDate } from '@/lib/emails';

export default async function CancelDonePage({ searchParams }: { searchParams: Promise<{ until?: string }> }) {
  const { until } = await searchParams;
  const date = until && /^\d{4}-\d{2}-\d{2}$/.test(until) ? formatDate(new Date(`${until}T00:00:00Z`)) : null;
  return (
    <main className="checkout">
      <h1>Your subscription is canceled</h1>
      <p className="lead">
        You will not be charged again{date ? `, and you keep access until ${date}` : ''}. We also sent you a confirmation email.
      </p>
      <p><Link className="button secondary" href="/account">Back to your account</Link></p>
    </main>
  );
}
