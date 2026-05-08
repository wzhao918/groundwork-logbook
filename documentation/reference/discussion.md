Planning to hire a couple field workers from my previous job to help me distribute fliers and outreach. In web session, you and I planned the bones of a field-logging tool of some sort. I brought over the discussion here, so let's brainstorm as to if and how we could create this. Vercel and supabase are the things that i'm most familiar with, we could stand something super simple up on them pretty easily right?

Here was our discussion:

The field tool will be used by 2-3 people doing community outreach — visiting childcare providers, posting fliers, having conversations. It needs to be mobile-first and dead simple to use in the field.
What we're building:
A small full-stack app with two views:

Log a Visit — mobile-optimized form for field reps to submit after each provider visit
Dashboard — running log of all submissions with outcome counts and territory breakdown

Scope — MVP only:

Supabase as the database (free tier, consistent with existing Groundwork stack)
Vercel deployment
No auth for now — name field, honor system
Mobile-first UI, large tap targets, minimal fields

Log a Visit fields:

Rep name (text or dropdown)
Date (default today)
Location name
Address / neighborhood
Territory (Boston, Fall River, + expandable)
Outcome (Posted flier, Left stack with staff, Had conversation, Turned away, No answer, Location closed)
Flier version (Design 1, Design 2)
Approximate fliers left
Notes (one line, optional)

Dashboard fields:

Full submission log, reverse chronological
Summary counts by outcome
Summary counts by territory
Filter by rep, territory, date range

Phase 2 (not now):

Map view with pins
Auth
Public-facing summary stats for grant narrative

Stack preferences:

Consistent with existing Groundwork stack wherever possible
Supabase for database
Vercel for deployment
Keep it lean — this should be hours not days

--

Many of the fields themselves are not set in stone (e.g. I don't know who my other field ops would be yet), so would need simple and easy to interchange frontend ports for these.

Overall feel: simple and intuitive, like an educational mobile game for middle-schoolers
