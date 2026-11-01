import { store } from '@/lib/config';

export default function PrivacyPage() {
  const info = store();
  return (
    <main className="checkout">
      <h1>Privacy Policy</h1>
      <p className="fine">Template text. Replace it with a policy that describes what your business actually does.</p>
      <p>
        We collect the information needed to run your subscription: your email address and billing details (processed by
        Stripe), and a record of your agreement to the renewal terms (the terms shown, the time and the page), which we keep
        to show what you agreed to. We use your email to send the confirmation, reminders before a trial ends or a yearly
        plan renews, and cancellation confirmations.
      </p>
      <p>Questions or requests: {info.supportEmail}</p>
    </main>
  );
}
