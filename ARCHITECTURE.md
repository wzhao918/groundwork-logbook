# ARCHITECTURE.md
**v1.0 — May 8, 2026**
**Field Ops Logbook**

---

## 0. What this is

A small mobile-first web app where 2–3 field reps log outreach visits (posters, fliers, conversations) for [Groundwork](https://groundworkma.org), and where the team lead can see what's happened on a dashboard.

The app lives at a private, bookmarkable URL gated by a single shared passcode. Reps open it on their phone between visits or at home and submit a short form per visit. The dashboard summarizes the data and lets you drill into per-location history.

Picture a paper logbook on a clipboard, except every page is searchable and the clipboard is a phone.

---

## 1. The Nouns

The whole system is built on four nouns. If you understand these, you understand the system.

**Visit** — a single field event. One rep, one location, one date, one outcome. Captured by submitting the form. The unit of activity.

**Location** — a physical place identified by its **street address + city/town**. A second visit to an existing address attaches to the same Location. This is what makes "revisit" a meaningful, distinct event in the system.

**Rep** — the person logging the visit. Identified by their Supabase Auth account. The visit's `rep_name` is auto-populated from the user's display name (set during onboarding) and stays put when other people edit the visit later — the visit's owner doesn't change just because someone else corrected a typo.

**Edit Event** — an audit-log row capturing every modification to a Visit or a Location: who did it, when, and what changed. Append-only. Not shown on the dashboard by default, but available if we ever need to reconstruct what happened. `actor_name` is the editor's display name pulled from the session.

**Soft delete:** A Visit or Location can be marked deleted but the row stays. A wrongly-deleted entry is recoverable.

---

## 2. A Visit's journey through the system

A single visit, end-to-end, in the order it actually happens:

1. **Rep opens the bookmarked URL on their phone.** Fresh device or expired session → passcode gate. Type passcode once, stay logged in.
2. **Form loads.** "Who's logging?" is auto-filled with whoever last submitted on this device (or empty on a fresh device, with quick-tap chips for the team's canonical names + "Other"). Date defaults to today.
3. **Rep enters the address.** As they type the street address, the app surfaces matching existing Locations (typeahead against past entries). They either **pick an existing one** (this is a revisit) or **commit to a new Location** (first visit here). The "new place vs. revisit" choice is explicit, never silent.
4. **Rep fills the rest** — outcome, flier version, fliers left (optional), notes (optional) — and taps Submit.
5. **Server receives the submission.** Verifies the session cookie. Validates fields. If a new Location, inserts it. Inserts the Visit row. Writes a `create` Edit Event. Returns confirmation.
6. **Rep sees a friendly "logged" confirmation.** They can submit another, or close the tab.

**Reads** (dashboard, locations index, per-location page) skip steps 3–5: load page → fetch from Supabase → render.

---

## 3. Surfaces (the pages)

Nine routes in V1:

| Route | What it does |
|-------|--------------|
| `/login` | Email + password (with "email me a link" magic-link fallback). Supabase Auth. |
| `/auth/callback` | Magic-link / invite landing point. Exchanges the auth code for a session cookie, redirects to `/log`. |
| `/onboarding` | First-login: set display name + (optional) password. Middleware routes any authenticated user without a `display_name` here. |
| `/log` | The "Log a Visit" form. Mobile-first. The everyday surface. |
| `/dashboard` | Reverse-chronological visit log + outcome counts + city/town counts + filters (rep, city/town, date range). |
| `/locations` | Index of every location: address, city/town, total visits, last visit date, last outcome. |
| `/locations/[id]` | Per-location page: full revisit history with notes. |
| `/visits/[id]/edit` | Edit a visit. Same form as `/log`, pre-filled. Soft-delete sits at the bottom behind a confirm dialog. Reached via the "Edit" link on any `VisitCard`; a `?return=` param sends the user back to where they came from. |
| `/locations/[id]/edit` | Edit a location's street + city/town. Soft-delete at the bottom, **hidden** if the location has any non-deleted visits. |

Editing happens on **dedicated pages** (originally specced as inline; revised after building the form to keep the LocationPicker reuse clean and avoid per-row state on the dashboard). Each edit page reuses the create-form shape, just pre-filled. Deleting is a native `<dialog>` confirm — soft-delete only, never a hard delete.

**Vibe:** large tap targets, generous spacing, accessible/playful copy ("How'd it go?" instead of "Outcome:"). No streaks, badges, or counters — it's a tool, not a game.

---

## 4. Access model

### V1: per-user identity (Supabase Auth, admin-provisioned)
- **Email + password** primary; **magic-link** as a fallback at `/login`. Both work on the same account.
- **No public signup.** `Allow new users to sign up` is OFF in Supabase. The only way in is via an admin invite (Authentication → Users → Invite user in the Supabase dashboard).
- New invitees land on `/auth/callback` from the email link, get a session cookie, and are routed to `/onboarding` to set a display name + (optional) password.
- Middleware validates the JWT on every request via `supabase.auth.getUser()` and gates everything except `/login` and `/auth/*`. Authenticated users without a `display_name` are routed to `/onboarding`.
- `actor_name` on every audit row is the editor's display name from their session.
- Writes still go through the service-role admin client (`supabaseAdmin`) inside server actions — RLS isn't currently used to gate writes; the session check at the action boundary is what protects them.

### Future: tighter RLS / SSO / role-based permissions
If we ever need per-user data isolation (e.g., reps only see their own visits), it's a policy change, not an architecture change — `auth.uid()` is available inside RLS policies on every table.

---

## 5. Storage layout

This section is the canonical answer to "where does X live?" — both in Postgres and in the codebase.

### 5.1 Database (Supabase Postgres, separate project from Groundwork)

Three tables in V1.

```
locations
  id              uuid primary key default gen_random_uuid()
  street_address  text not null
  city_town       text not null
  created_at      timestamptz not null default now()
  created_by      text                       -- rep name string
  deleted_at      timestamptz                -- soft delete

  unique (lower(street_address), lower(city_town))

visits
  id              uuid primary key default gen_random_uuid()
  location_id     uuid not null references locations(id)
  rep_name        text not null
  visit_date      date not null
  outcomes        text[] not null            -- enum-ish array, see below; non-empty
  flier_version   text                       -- enum-ish, see below
  fliers_left     int                        -- nullable
  notes           text                       -- nullable
  created_at      timestamptz not null default now()
  deleted_at      timestamptz                -- soft delete

  check (cardinality(outcomes) > 0)

edit_events
  id              uuid primary key default gen_random_uuid()
  entity_type     text not null              -- 'visit' | 'location'
  entity_id       uuid not null
  actor_name      text not null              -- rep name string in V1
  action          text not null              -- 'create' | 'update' | 'soft_delete' | 'restore'
  diff            jsonb                      -- before/after for updates
  created_at      timestamptz not null default now()
```

**Enum-ish strings — kept as `text`, not Postgres enums, so we can change the set without a migration:**

- `outcomes[]` (text array, at least one element) — each element ∈ { `posted_flier`, `left_stack_with_staff`, `had_conversation`, `turned_away`, `no_answer`, `location_closed` }. A single visit can have multiple outcomes (e.g., posted a flier *and* had a conversation).
- `flier_version` ∈ { `design_1`, `design_2` }

The string set lives in **one file** (`lib/enums.ts`) so changing what's allowed is a single edit.

**RLS:** anon role can `SELECT` everything but cannot `INSERT/UPDATE/DELETE`. All writes go through server-side route handlers using the service role key, gated by the passcode cookie. Simpler mental model: the browser only ever reads.

### 5.2 Code (Next.js App Router on Vercel, TypeScript)

```
/app
  /login/page.tsx              — passcode gate
  /log/page.tsx                — log a visit form
  /dashboard/page.tsx          — running log + counts + filters
  /locations/page.tsx          — locations index
  /locations/[id]/page.tsx     — per-location history
  /api/visits/route.ts         — POST / PATCH / DELETE handlers
  /api/locations/route.ts      — POST / PATCH / DELETE handlers
  /middleware.ts               — passcode cookie check on all non-/login routes
/lib
  /supabase.ts                 — server + browser supabase client factories
  /enums.ts                    — outcome + flier_version + canonical city/town options
  /audit.ts                    — write-edit-event helper
  /session.ts                  — cookie sign/verify
/components
  /VisitForm.tsx
  /VisitRow.tsx
  /LocationPicker.tsx          — typeahead for §2 step 3
  /EditPanel.tsx
/documentation                 — see CLAUDE.md §3
ARCHITECTURE.md
CLAUDE.md
```

---

## 6. Stack & deployment

- **Framework:** Next.js 14+ (App Router) with TypeScript.
- **DB:** Supabase Postgres (separate project from Groundwork). Free tier.
- **Hosting:** Vercel (separate project from Groundwork). Free tier.
- **Styling:** Tailwind. Mobile-first. Large tap targets. Accessible copy.
- **Auth (V1):** Supabase Auth (email + password and magic-link). Admin-provisioned via the Supabase dashboard. Session cookies handled by `@supabase/ssr`.
- **Secrets (Vercel env vars):** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. (The legacy `APP_PASSCODE` and `SESSION_SECRET` are no longer used and can be deleted from Vercel.)

**Read path:** browser → Supabase JS client (anon key, RLS-protected) → Postgres. Direct.
**Write path:** browser → Next.js route handler → service-role Supabase client → Postgres. Passcode cookie verified at the route handler.

---

## 7. What V1 doesn't do (and why that's okay)

- **No address picker, no geocoding, no map.** Free-text address with typeahead-against-prior-entries is enough.
- **No photos.** Deferred to V2.
- **No offline mode.** Reps log between visits or at home; signal is fine.
- **No public stats endpoint.** Curated by hand.
- **No bulk import.** Greenfield.
- **No streaks, badges, or counters.** Tool, not a game.

---

## 8. V2 cutover paths (what we're keeping open)

Each of these can be added later without rewriting V1. None of them require a destructive migration.

**~~Per-user auth.~~** ✅ Done — see §4. We took the lighter path of keeping `rep_name` (denormalized from session) instead of adding `rep_user_id`, since for V1 query needs the display name is enough.

**Address picker + map view.** Add nullable `latitude`, `longitude` columns on `locations`. New locations created via the picker get coords for free. One-time backfill via Mapbox/Google geocoding for existing free-text addresses. New `/map` route reads coords. Old free-text addresses keep working.

**Photos.** New `visit_photos` table (visit_id, storage_path, created_at). Supabase Storage for files. Form gets a camera button. Pure additive change.

**Public stats.** Either (a) a static JSON file regenerated periodically and published to groundworkma.org, or (b) a `/public/stats` route running a curated set of aggregations. Either way: no schema change, no leaking of raw visit data.

---

## 9. Operating principles

- **Architecture > code.** This doc is the source of truth for shape; the code follows it.
- **Make state explicit.** Soft-deletes are visible flags, not hidden absences. Edit events are a real table, not log lines.
- **Inspectable over clever.** Plain `text` columns over Postgres enums. One enum-string file in code over a config service.
- **Trivial rollback.** Separate Supabase + Vercel projects from Groundwork. Soft delete. Audit log. Additive migrations only.
- **Parallel build → cutover** for any V2 transition (auth, geocoding) — never a rip-and-replace.

---

_Last verified against codebase: 2026-05-10 (identity auth shipped: Supabase Auth replaces shared passcode, onboarding flow, audit actor + rep_name from session)_
