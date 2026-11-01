// A signed cookie that remembers which Stripe customer this browser belongs to. It stands in for your real login:
// replace customerId() with your auth (the customer id stored on your user record).
import { createHmac, timingSafeEqual } from 'node:crypto';
import { requireEnv } from './config.js';

const COOKIE = 'customer';

function sign(value) {
  return createHmac('sha256', requireEnv('SESSION_SECRET')).update(value).digest('base64url');
}

export function setCustomerCookie(res, customerId) {
  res.cookie(COOKIE, `${customerId}.${sign(customerId)}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 1000 * 60 * 60 * 24 * 90,
  });
}

export function customerId(req) {
  const raw = (req.headers.cookie ?? '')
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE}=`))
    ?.slice(COOKIE.length + 1);
  if (!raw) return null;
  const value = decodeURIComponent(raw);
  const i = value.lastIndexOf('.');
  const id = value.slice(0, i);
  const sig = Buffer.from(value.slice(i + 1));
  const expected = Buffer.from(sign(id));
  return sig.length === expected.length && timingSafeEqual(sig, expected) && id.startsWith('cus_') ? id : null;
}
