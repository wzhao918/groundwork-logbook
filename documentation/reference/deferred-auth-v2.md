[P] Good call to plan this before building. The identity instinct is exactly right — V2 of the architecture promised this, and now's the right time. But before scoping the work, I want to push back a little on the auth method, because I think the better answer is genuinely counterintuitive.

The pushback: passwords aren't actually friendlier for non-tech users
When you said "non-tech-savvy users onboarding their own login and password," your instinct was that passwords feel simpler — like a real app. I'd argue the opposite for this audience:

Passwords are a cognitive burden. Users freeze on creation ("how strong does it need to be?"), forget them, write them on Post-its, reuse them across sites. Every password you let into the wild is a small reliability risk.
"I forgot my password" is the most common support ticket on the planet. Someone has to fix it — you. At 2 AM when Sam is at a community event.
The "what makes it feel professional" thing is not the password field. It's: "I'm logged in as Sam, the dashboard greets me by name, I don't have to type my name when logging a visit, the audit log knows it was me." All of that comes from identity, not from how you authenticated.
The boring-but-better default for a 2-3 person internal tool is magic-link email: rep types their email, gets an email with a "Sign in" link, clicks it, in. No password, ever. Supabase has it built in.

I'll lay out all three paths and let you call it.

The three real options
A) Magic-link only
Login screen has one field: email. Rep gets an email, clicks, in.

✅ Lowest friction. No passwords to invent, remember, or reset.
✅ Smallest code surface.
❌ Subsequent logins take ~30 seconds (open email, find link, click) vs. 5 seconds for a password.
❌ Requires the rep to have email working on the device they're logging in from. Universal in 2026, but worth saying.
B) Email + password
Standard signup → login flow. Supabase Auth supports this directly.

✅ Familiar pattern.
✅ Fast subsequent logins.
❌ "Forgot password" still has to fall back on email magic-link anyway, so we're not really avoiding email.
❌ More UI surface: signup, login, forgot, reset.
❌ Password storage anxiety (Supabase handles it well, but it's still a thing).
C) Both, on the same account (Supabase supports this natively)
Login screen has email + password, with a "send me a magic link instead" link below.

✅ Best of both: fast logins for daily use, magic-link as the "I forgot" fallback.
❌ More UI to build than (A) alone, but only marginally more than (B).
My recommendation
Option C — both, with admin-provisioned accounts. Here's the full UX walked through:

You, when adding a new rep (~2 min, once per rep):

Open Supabase project → Authentication → Users → Invite User → type Sam's email → Save.
Sam gets an email titled "You're invited to Groundwork Logbook" (we customize the template).
Sam, first time (~1 min):

Click the link in the email → lands on the app, already logged in.
Sees a one-screen prompt: "Set a password (optional)" + "What name should we show on your visits?"
Saves. Done.
Sam, every other time (~5 sec):

/login → email + password → in. Or "Email me a link instead" → click email → in.
On /log:

The "Who's logging?" field disappears. Sam's name auto-fills from the session.
The audit log knows it's Sam who edited a visit, not (passcode user).
Why admin-provisioned, not self-serve signup: with 2-3 known people, you don't want a public signup page. Admin-add via Supabase is two clicks, no extra UI to build, and it controls access entirely.

What the work breaks down to
Piece	Where	Effort
Enable email auth in Supabase Auth UI	Supabase dashboard	2 min
Customize the invite email template	Supabase dashboard	5 min
(Optional) Configure SMTP via Resend for higher email limits	Supabase dashboard + Resend signup	10 min
Replace /login with Supabase-Auth-driven login (email + password + magic-link fallback)	Code	1 hour
Update middleware to check Supabase session cookie instead of HMAC cookie	Code	20 min
Add /onboarding page for first-time name + password setup	Code	30 min
Remove "Who's logging?" field from /log; auto-populate from session	Code	15 min
Update audit log: actor name comes from session, not (passcode user)	Code	10 min
Decommission APP_PASSCODE env var	Vercel + Supabase	2 min
Update ARCHITECTURE.md §4 access model + §8 V2 cutover (mark done)	Docs	10 min
Total: ~3 hours of work, mostly small code changes. Schema additions are minimal — we add nothing to the visits table for V1; rep_name keeps getting populated, just from session metadata instead of typed input.

Migration story
Existing visits keep their rep_name strings as-is. No backfill needed.
No data loss. Pre-auth visits remain attributable to whatever name was typed.
The shared passcode is removed once the new auth is wired. That's the cleanest cutover signal.
Rollback is easy: keep the passcode middleware code in a branch; if Supabase Auth blows up, revert. The schema doesn't change, so there's nothing to undo on the data side.
One question to land before building
Are you good with admin-provisioned only for V1 (you add reps via Supabase dashboard, takes 2 min per rep), or do you want a self-serve signup page on the app itself? I'd push for admin-provisioned — less code, more controlled, fits the "2-3 known people" reality. Self-serve only makes sense if you're planning to onboard people whose emails you don't have in advance.

Once we settle that, I'm ready to execute.