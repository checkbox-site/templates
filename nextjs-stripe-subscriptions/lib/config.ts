import type { StoreInfo } from './terms';

/** Public origin of this app, without a trailing slash. */
export function appUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL;
  if (explicit) return explicit.replace(/\/$/, '');
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

export function store(): StoreInfo {
  const url = appUrl();
  return {
    merchantName: process.env.NEXT_PUBLIC_BRAND_NAME ?? 'Acme',
    cancelUrl: `${url}/account/cancel`,
    supportEmail: process.env.SUPPORT_EMAIL ?? `support@${new URL(url).hostname}`,
  };
}

export function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set. Copy .env.example to .env.local and fill it in (README, "Run it locally").`);
  return v;
}
