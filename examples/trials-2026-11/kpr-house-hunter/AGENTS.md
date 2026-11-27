# KPR House Hunter

## What this is
A local web app for one owner's house search in Indonesia. It imports a hand-made listings CSV (Rumah123, 99.co, Lamudi), applies the owner's criteria and KPR limits (installment at the floating rate, age-capped tenor, full upfront cash) and shows a ranked shortlist. It runs only on 127.0.0.1 on the owner's Linux laptop; income, savings and age never leave the machine. Stack: Python 3.14, Django 6.1.3, SQLite.

## How to load context
1. `DECISIONS.md` — every decision with its id; the source of truth for why.
2. `SPEC/prd.md` — the problem, users, goals and success metrics.
3. `SPEC/requirements.md` — F-01…F-05 behavior and acceptance criteria.
4. `SPEC/data-model.md` — entities, fields, indexes and migrations.
5. `SPEC/api.md` — the HTTP routes, status codes and error format.
6. `SPEC/architecture.md` — stack, components, folder tree, local run, quality targets.
7. `MILESTONES.md` — what to build, in order M0 → M4.
8. `VERIFICATION.md` — the exact commands that prove each milestone.

## Working rules
- Stack and language rules: CODE_STYLE.md. No new dependency without a new decision.
- Security rules: SECURITY.md. Never bind to anything but 127.0.0.1; never add a network call (D-021, D-022).
- Never log or export income, savings, cash or age outside the user's own backup and shortlist files.
- Screen text in Indonesian with the D-001 terms; copy keys in UI_SPEC.md.
- Build milestones in order. A milestone is done only when every VERIFICATION.md procedure for it passes on the laptop and the output is recorded.
- Scope is locked (SCOPE.md, D-062). Feature changes go through /lvr-add-feature.
- Install only inside `.venv` (D-058).

## File map
| File | Purpose |
|---|---|
| OVERVIEW.md | Owner document: decisions, costs, how to use it, limitations |
| DECISIONS.md | Append-only decision log D-001…D-065 |
| SPEC/prd.md | Problem, context, users, goals, non-goals, success metrics |
| SPEC/requirements.md | F-01…F-05 behavior and Given/When/Then criteria |
| SPEC/data-model.md | Entities, relations, indexes, validation, migrations, sample |
| SPEC/api.md | Routes, critical requests, status codes, error format |
| SPEC/architecture.md | Stack, components, data flow, folders, run, failure points, data sources, quality targets |
| USER_FLOWS.md | Click-by-click flow per feature |
| CODE_STYLE.md | Python/Django conventions, errors, tests, simplicity rules |
| SECURITY.md | Auth model, PII inventory, secrets, dependencies, compliance, abuse and access |
| RESEARCH.md | Competitors, stack comparison, cost table, risks |
| SCOPE.md | Locked MVP list, kill criteria, Parking Lot |
| MILESTONES.md | M0…M4 with acceptance criteria and estimates |
| VERIFICATION.md | Commands and expected outputs per milestone; smoke test |
| ASSUMPTIONS.md | Decisions not chosen by the owner, with how to confirm |
| HANDOVER.md | Owner guide: run, update, back up, recovery |
| CAPABILITIES.md | Recommended agent skills for this stack |
| ROUTES_SITEMAP.md | Pages, entry points and navigation |
| UI_SPEC.md | Design tokens, screens and states, copy, accessibility, contrast results |
| blueprint.json | Machine snapshot (derived; never hand-edit) |
| CLAUDE.md | Stub pointing here |
| GEMINI.md | Stub pointing here |
