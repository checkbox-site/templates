/** Public origin of this app, without a trailing slash. */
export function appUrl() {
  const explicit = process.env.APP_URL ?? process.env.RENDER_EXTERNAL_URL;
  if (explicit) return explicit.replace(/\/$/, '');
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

/** @returns {{ merchantName: string, cancelUrl: string, supportEmail: string }} */
export function store() {
  const url = appUrl();
  return {
    merchantName: process.env.BRAND_NAME ?? 'Acme',
    cancelUrl: `${url}/account/cancel`,
    supportEmail: process.env.SUPPORT_EMAIL ?? `support@${new URL(url).hostname}`,
  };
}

export function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set. Copy .env.example to .env and fill it in (README, "Run it locally").`);
  return v;
}
