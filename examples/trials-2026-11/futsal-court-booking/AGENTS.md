# Futsal Court Booking

## What this is

A booking website for one futsal venue with 3 courts in South Jakarta (trial values, S1.q4). Players open one short link, see open slots for today and the next 14 days, and book one slot without an account. When two players book the same court, date and hour at once, the database accepts exactly one booking and the other player sees "Slot sudah diambil" (slot already taken). The admin runs the day from one schedule that also holds WhatsApp and walk-in bookings.

Stack: SvelteKit 3.4.1 on Cloudflare Workers Free, Supabase Free (Postgres in Singapore, Supabase Auth for the admin, row-level security), Cloudflare Turnstile Free (D-046, D-047, D-049).

## How to load context

1. `DECISIONS.md` — every choice with its reason; a decision id (D-NNN) in any file points here.
2. `SPEC/prd.md` — the problem, the users and the success measure.
3. `SPEC/requirements.md` — what each feature F-01 to F-05 must do, with acceptance criteria.
4. `SPEC/data-model.md` — tables, the one-winner constraint, indexes and migrations.
5. `SPEC/api.md` — routes, form actions, status codes and the error format.
6. `SPEC/architecture.md` — stack, data flow, folder layout, failure points and integrations.
7. `MILESTONES.md` — the build order M0 to M4; build one milestone at a time.
8. `VERIFICATION.md` — the exact checks that prove a milestone is done.

Read `USER_FLOWS.md`, `ROUTES_SITEMAP.md` and `UI_SPEC.md` before you build any screen.

## Working rules

- Follow `CODE_STYLE.md` for language, layout, errors and tests (TypeScript, SvelteKit form actions).
- Follow `SECURITY.md` for login, personal data, secrets, row-level security and abuse controls. Never send names or WhatsApp numbers to logs.
- A milestone is done only when every step of its `VERIFICATION.md` procedure passes on the live address and the output is recorded.
- The one-winner rule lives in the database (a unique or exclusion constraint), never in a check-then-insert in code (D-027, R-8).
- Store times in UTC; show and judge them in WIB (Asia/Jakarta) (D-027).
- Product text is Indonesian (id-ID), "kamu" for players (D-037). Use the copy in `UI_SPEC.md`.
- Scope is locked (D-057). Do not add features; a new idea goes through `/lvr-add-feature`.
- Stay on free plans. Ask the owner before any paid plan (D-011, D-044, D-045).
- Unsure? Check `ASSUMPTIONS.md` and ask the owner instead of guessing.

## File map

| File | What it holds |
|---|---|
| OVERVIEW.md | Plain-language summary for the owner: decisions, costs, limits |
| DECISIONS.md | Decision log D-001 to D-064 |
| SPEC/prd.md | Problem, users, goals, non-goals, success measure |
| SPEC/requirements.md | One block per feature with acceptance criteria |
| SPEC/data-model.md | Storage decision, tables, ERD, indexes, migrations |
| SPEC/api.md | Routes, form actions, samples, status codes, error format |
| SPEC/architecture.md | Stack, components, data flow, folders, local run, failure points, integrations, quality targets |
| USER_FLOWS.md | Click-by-click flow for each feature |
| CODE_STYLE.md | Code conventions, errors, tests, simplicity rules |
| SECURITY.md | Login, personal data, secrets, compliance, abuse controls |
| RESEARCH.md | Competitors, stack comparison, cost table, risks |
| SCOPE.md | Features in the first version and the parking lot |
| MILESTONES.md | M0 to M4 with acceptance criteria |
| VERIFICATION.md | Exact checks per milestone, smoke test, definition of verified |
| ASSUMPTIONS.md | Decisions not confirmed by the owner, with how to confirm |
| HANDOVER.md | Owner guide: run, update, back up, accounts, alerts |
| CAPABILITIES.md | Skills that help the builder agent |
| ROUTES_SITEMAP.md | Every page and route, who sees it and how they arrive |
| UI_SPEC.md | Tokens, screens, states, copy, motion, accessibility checks |
| CLAUDE.md | One-line pointer to this file |
| GEMINI.md | One-line pointer to this file |
| blueprint.json | Machine summary, generated from `.lvr/state.json` |
