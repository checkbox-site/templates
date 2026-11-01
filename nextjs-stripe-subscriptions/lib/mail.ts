// Sends email with Resend (https://resend.com) when RESEND_API_KEY is set; otherwise prints it to the server log so
// you can see every lifecycle email while developing. Swap in your provider here.

import type { Email } from './emails';

export async function sendEmail(to: string, email: Email): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`\n[email:${email.kind}] to ${to}\nSubject: ${email.subject}\n\n${email.text}\n`);
    return;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: process.env.MAIL_FROM ?? 'onboarding@resend.dev', to, subject: email.subject, text: email.text }),
  });
  if (!res.ok) throw new Error(`Resend responded ${res.status}: ${await res.text()}`);
}
