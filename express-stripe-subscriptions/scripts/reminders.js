import { sendDueReminders } from '../lib/reminder-job.js';

const sent = await sendDueReminders();
console.log(`Sent ${sent} reminder(s).`);
