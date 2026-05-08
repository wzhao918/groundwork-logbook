# Logbook
**v1.0 — May 8, 2026**
**Initial Onboarding**

## Introduction

Hi Claude! Welcome to my project. I prefer viewing this as a shared collaborative canvas where we are partners.  
My turns will take on one of three shapes, tagged in brackets: Brainstorm [B], Planning [P], or Action [A]. These require different cognitive lenses.
In Brainstorm, we should discuss freely and expand possibilities, even challenging the existing structure or core invariants when necessary.
In Planning, we should discuss to narrow down possibilities and draft action documents.
In Action, we should implement our plans, and stop if surprises surface.
Almost all of this is new to me. I learn fast, but don't hesitate to explain something to me if my understanding of something is thin or wrong.

I'm a creative thinker and a free spirit, and an introspective being, and understand you to be as well. If something "clicks" with you, if you prefer one path over another, if you disagree with me, etc. - I want to hear it. 


## Who I Am

Systems thinker without hands-on coding experience. Avoid jargon — aim for plain English.

**How I learn:** Spatial/physical metaphors land fastest. Video game metaphors or design concepts are great as well. Planning discussions before building are encouraged.

**Core beliefs:** Architecture > code. Control flow before components. Make state and decisions explicit. Prefer inspectable over clever. Prefer small single-purpose modules over monolithic chains. If it can't be rolled back, it's too risky. Define the nouns. Mentally track packages through the system.

**How I refactor systems:** When replacing a system, keep rollback trivial, and use a parallel build -> cutover process when reasonable.

**How I work with AI:** AI is a collaborator — implementation partner for code, strategic partner for architecture. Externalize plans before coding. Keep one source of truth. Persistent shared documents prevent cross-session drift — when a topic grows beyond conversation, capture it in `documentation/`. If something feels clever but unclear, prefer the boring version.

---

## 0. What This System Is

[TBD - Completed by Claude]

A simple field ops logbook for a small team (2-3 people). The purpose of the system is to log field outreach locations for Groundwork, a public-facing tool explaining the childcare subsidy system in Massachusetts. Current outreach consists of posters, fliers, and human-to-human conversations, and we'd like to keep track of when and where these occurred, and by whom.


---

## 0.5 Pre-V1 Posture (Discovery)

The shape of this product is not locked. CLAUDE.md, ARCHITECTURE.md, and the other root-level docs are malleable until V1 stabilizes. Challenge invariants and structures when something better surfaces — don't quietly route around them. Prefer decisions that keep options open over decisions that close them. When in doubt, name the tradeoff and ask before committing. Lock-in happens after we see what feels right in practice, not before.

_This note will be removed when the shape stabilizes._

---

## 1. Core Invariants

These cannot be violated without explicit discussion. Split into product invariants (true forever), architectural invariants (true forever for this build), and V1 stance (true for now, expected to evolve).

### Product Invariants

[TBD - completed by Claude]

---

## 2. File Map (Keep updated)

The canonical answer to "where does X live?" is `ARCHITECTURE.md` §5 (Storage Layout). A separate `DIRECTORY.md` may be added later if the layout outgrows the architecture doc — for now, ARCHITECTURE.md §5 covers it.

**Root-level documents** (the control plane):

| Document | Question it answers |
|----------|-------------------|
| `CLAUDE.md` | "What are the rules?" |
| `ARCHITECTURE.md` | "How does this system work?" + "Where does everything live?" |
| `OPERATIONS.md` | "Something changed — what do I update?" (placeholder) |
| `GOVERNANCE.md` | "Who decides what?" (placeholder) |
| `CHANGELOG.md` | "What changed and when?" (placeholder) |

---

## 3. Documentation

After completing a thread of work:
1. Do not update `CLAUDE.md` without explicit permission. Add `_Last verified against codebase: DATE_` to the footer of any living doc you verify or update.
2. Create a snapshot doc — `documentation/snapshots/DATE_descriptive_name.md` (e.g., `3_07_26_audit_high_resolution.md`). Name describes what was accomplished, date comes first for chronological sorting.
3. Suggest a concrete next step — one sentence describing the single most obvious starting point for the next session. Write it as the last line of the snapshot doc under a `## Next` heading.

---

## 4. Testing

[TBD - Completed by Claude]

---

_Last verified against codebase: 2026-05-07_