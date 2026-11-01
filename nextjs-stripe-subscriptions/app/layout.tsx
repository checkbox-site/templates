import type { Metadata } from 'next';
import Link from 'next/link';
import { store } from '@/lib/config';
import './globals.css';

export const metadata: Metadata = {
  title: `${store().merchantName} — subscriptions`,
  description: 'A subscription store built on Next.js and Stripe with automatic-renewal disclosures, consent, reminders and online cancellation.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { merchantName } = store();
  return (
    <html lang="en">
      <body>
        <header className="site">
          <Link href="/" className="brand">{merchantName}</Link>
          <nav>
            <Link href="/">Pricing</Link>
            <Link href="/account">Account</Link>
          </nav>
        </header>
        {children}
        <footer className="site">
          <span>© {new Date().getFullYear()} {merchantName}</span>
          <nav>
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/account/cancel">Cancel subscription</Link>
          </nav>
        </footer>
      </body>
    </html>
  );
}
