# V1 Built (Pre-Polish)
**2026-05-10**

## Summary

V1 of Groundwork Logbook is functionally complete except for UI/UX polish. The system supports identity-authenticated field reps logging visits to locations, with full CRUD and an append-only audit log.

## What was built (in order)

1. **Supabase schema** (May 8) — three tables: `locations` (with `(lower(street), lower(city))` unique index), `visits` (now with `outcomes text[]`), `edit_events` (append-only audit log). RLS on, anon read-only.

2. **Next.js scaffold + Vercel deploy** (May 8) — App Router, TypeScript, Tailwind v3.4. Initial passcode gate using an HMAC-signed session cookie (later removed when identity auth shipped).

3. **`/log` end-to-end** (May 8) — visit form with three-state LocationPicker (search existing → pick, or "+ new place"). `findOrCreateLocation` helper with case-insensitive de-dup and race fallback. Audit-log writes on every create.

4. **Multi-outcome refactor** (May 8) — `outcome text` → `outcomes text[]` with `cardinality > 0` check. Radio cards became checkbox cards. Surfaced during real-data testing: actual visits often have multiple outcomes (posted a flier AND had a conversation).

5. **`/dashboard`** (May 8) — server component, filter dropdowns (rep, city, date range) via URL params, summary cards (visits / outcomes / by city/town), reverse-chrono visit log. Two-query approach (visits + locations, merged in JS) instead of supabase embedded joins — simpler types, same perf at V1 volume.

6. **`/locations` + `/locations/[id]`** (May 9) — per-location history pages. Extracted `VisitCard` (with optional location prop) and `PageHeader` (shared nav) so the dashboard and per-location pages reuse them.

7. **Edit + soft-delete** (May 9–10) — dedicated edit pages at `/visits/[id]/edit` and `/locations/[id]/edit`. Native `<dialog>` for delete confirms. Field-level diffs in audit log via `computeDiff`. Locations with active visits cannot be deleted (button hidden + action re-checks). Departure from the original "inline editing" spec; reasoning recorded in ARCHITECTURE.md §3.

8. **Identity auth via Supabase Auth** (May 10) — replaced the shared passcode with email + password and magic-link sign-in. Admin-provisioned only (`Allow new users to sign up` is OFF). `/onboarding` captures display name + optional password on first login. `actor_name` in the audit log now comes from the session, not a typed string.

## Architecture deviations from initial spec

| Original | Final | Reason |
|---|---|---|
| `outcome text` (singular) | `outcomes text[]` (plural) | Real visits have multiple outcomes |
| Inline editing on dashboard | Dedicated `/visits/[id]/edit` pages | Cleaner reuse of `VisitForm` + `LocationPicker`; full-page forms beat modals on mobile |
| Shared passcode in V1, auth in V2 | Passcode shipped first, identity auth shipped next | User wanted individual rep identity for personalization, ran V1 in two phases |
| `(passcode user)` as audit actor | Display name from session | Identity auth made this real |

All recorded in `ARCHITECTURE.md` (last verified 2026-05-10).

## Schema (current state)

```sql
locations(id uuid, street_address text, city_town text,
          created_at, created_by, deleted_at)
  unique index on (lower(street_address), lower(city_town))

visits(id uuid, location_id uuid → locations,
       rep_name text, visit_date date,
       outcomes text[] not null check (cardinality > 0),
       flier_version text, fliers_left int, notes text,
       created_at, deleted_at)

edit_events(id uuid, entity_type, entity_id, actor_name, action,
            diff jsonb, created_at)  -- append-only
```

## Stack

- **Frontend:** Next.js 15 App Router, TypeScript, Tailwind v3.4
- **Backend:** Supabase Postgres + Supabase Auth (via `@supabase/ssr`)
- **Hosting:** Vercel (linked to GitHub)
- **Repo:** `github.com/<user>/groundwork-logbook`
- **Working directory:** `C:\Users\verbl\OneDrive\Desktop\Tutti Labs\Field Ops\logbook` (still on OneDrive — see open items)

## Open items

- **Email invite flow not reliable.** Manual user creation in the Supabase dashboard + sharing a temp password is the working onboarding path. The email invite hits some combination of free-tier rate limit, template format, and Gmail prefetch consumption. Deferred — the manual path works for 2–3 reps.
- **Project still inside OneDrive sync.** Caused one build failure (`EINVAL readlink`, resolved by nuking `.next`). Should move to `C:\Users\verbl\Code\logbook` at a clean stopping point.
- **No identity migration for old visits.** Pre-auth visits keep their typed `rep_name` strings (mostly "Wilson" from testing). Could be cleaned manually in Supabase, low priority.
- **`ARCHITECTURE.md` §8 (V2 cutover paths)** has a mix of completed and unmarked items. Worth a re-pass to clean.
- **No automated tests.** Manual testing only so far. CLAUDE.md §4 is still TBD on testing approach.

## Files worth knowing about (for the next session)

- `ARCHITECTURE.md` — source of truth, last verified 2026-05-10
- `lib/audit.ts`, `lib/diff.ts`, `lib/locations.ts` — small, focused, illustrative of the codebase's factoring style
- `app/visits/actions.ts` — most complex server-side logic (find-or-create + diff + audit on update)
- `middleware.ts` — auth gate + onboarding gate
- `components/VisitForm.tsx` + `components/LocationPicker.tsx` — used in both create and edit flows, shaped by the dual-mode requirement

## Next

UI/UX polish pass — copy tone, mobile tap targets, dashboard visual hierarchy, empty states, header identity indicator.
