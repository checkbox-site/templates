// Stripe Checkout redirects here after payment. Remember the customer in a signed cookie (stand-in for your login)
// and show the account page.
import { NextResponse } from 'next/server';
import { appUrl } from '@/lib/config';
import { sessionCookie } from '@/lib/session';
import { stripe } from '@/lib/stripe';

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get('session_id');
  const base = appUrl();
  if (!id) return NextResponse.redirect(`${base}/`, 303);
  const session = await stripe().checkout.sessions.retrieve(id);
  if (session.status !== 'complete' || typeof session.customer !== 'string') return NextResponse.redirect(`${base}/`, 303);
  const res = NextResponse.redirect(`${base}/account?welcome=1`, 303);
  const c = sessionCookie(session.customer);
  res.cookies.set(c.name, c.value, c.options);
  return res;
}
