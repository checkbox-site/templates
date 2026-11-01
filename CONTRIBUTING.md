# Contributing

Issues and pull requests are welcome: bugs, new stacks (Remix, SvelteKit, Rails, Django …), billing platforms and
clearer docs.

Every template must keep, and new ones must include:

- the renewal disclosure (price, interval, renews until cancelled, trial and the charge after it, how to cancel
  online) directly above the pay button, at body size, set off by a border or background;
- an unchecked, required consent checkbox, enforced on the server;
- an acknowledgment email after sign-up and trial / renewal reminders;
- online cancellation reachable from the account page, without a call or chat, with an on-screen and email
  confirmation;
- an `AGENTS.md` for coding assistants and a README that says the template is not legal advice.

Run `npm run checkbox:preflight` (a free `ck_test_` key) before opening a pull request and paste the summary. By
contributing you agree that your contribution is licensed under the MIT license.
