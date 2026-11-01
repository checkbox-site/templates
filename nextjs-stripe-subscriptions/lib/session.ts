// A signed cookie that remembers which Stripe customer this browser belongs to. It stands in for your real login:
// replace customerId() with your auth (the customer id stored on your user record).

import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { requireEnv } from './config';

const COOKIE = 'customer';

function sign(value: string): string {
  return createHmac('sha256', requireEnv('SESSION_SECRET')).update(value).digest('base64url');
}

export function sessionCookie(customerId: string): { name: string; value: string; options: { httpOnly: true; sameSite: 'lax'; secure: boolean; path: string; maxAge: number } } {
  return {
    name: COOKIE,
    value: `${customerId}.${sign(customerId)}`,
    options: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 90 },
  };
}

export async function customerId(): Promise<string | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const i = raw.lastIndexOf('.');
  const id = raw.slice(0, i);
  const sig = Buffer.from(raw.slice(i + 1));
  const expected = Buffer.from(sign(id));
  return sig.length === expected.length && timingSafeEqual(sig, expected) && id.startsWith('cus_') ? id : null;
}
