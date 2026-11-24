# LVR Pipeline Core — Spec Overview

Version: v1 (F1). Date: 2026-11-20. Decisions referenced: ADR-0001..0007, `GLOSSARY.md`.

## What LVR is

LVR (Lazy Vibers Recipe) is a pipeline that turns a raw idea from a **non-technical user** into a complete, industry-grade blueprint bundle that **any AI agent harness** (Claude Code, Codex, Gemini CLI, zcode, Antigravity, Cursor) can execute to build the product. One folder = one idea = one product.

## Actors

| Actor | Description |
|---|---|
| **Owner** | The non-technical user. Speaks any language (User Language). Cannot read technical specs unaided. |
| **Conductor** | The LVR skill running in a harness (`/lvr-init-new-idea`, `/lvr-continue`, or one of the post-S9 skills). Loads boosters per Section, drives the interview, writes state. |
| **Builder** | Any agent harness that later consumes the Blueprint Bundle. Has no LVR skills; relies on bundle files only. |
| **Web UI** | Local read-only dashboard for plans, milestones, decisions, diagrams, and session history in `.lvr/` or legacy `.lvp/` projects. |

## Scope

Shipped, seven skills:

- v0 core: `/lvr-init-new-idea`, `/lvr-continue`, `/lvr-handoff` (Sections S0–S9, bundle generation, gap lint).
- v1, implemented: `/lvr-review-plan` (formerly `/lvr-recheck-plan`), `/lvr-add-feature`, optional `/lvr-build`, `/lvr-personal-brand`.

Each skill ships `scripts/lvr.mjs` for the deterministic bookkeeping (journal, state, replay); the prose in each `SKILL.md` stays the fallback.

## Spec files

1. `01-state.md` — `.lvr/` layout, `state.json` schema, journal events, section records, Folder Gate, checkpoint/resume semantics
2. `02-sections.md` — S0–S10 definitions, question strategy, routing table (Section → booster → output)
3. `03-skills.md` — contracts for all seven skills + Constitution (`lvr-principles.md`)
4. `04-bundle.md` — Blueprint Bundle file specs, compilation order, maintenance after S9, `blueprint.json` schema
5. `05-boosters.md` — dependency model, tiers, bootstrap check, installers, failure UX
6. `06-model-tiers.md` — model tiers T1–T3, capability probe, context guard, truncation recovery, cross-model resume
7. `07-research.md` — web research requirement, Domain Brief and per-Section scans, citation syntax, freshness limits (`freshness.json`), research log events, the `cite check` contract
8. `08-review.md` — plan review: lenses and coverage matrix, severity and score, findings ledger and stable ids, Run-N reconcile and stability, `--apply`, `--scope-only`, and the `lvr review *` command contract. It ships byte-for-byte as `skills/lvr-review-plan/references/contract.md` (`npm run sync:skills`), so it cites only files of that skill. Design and reasoning: research L (`.scratch/public-release/research/L-critical-review-design.md`) and owner decisions R1–R4 (`.scratch/public-release/spec.md`)
9. [Personal workflows](09-workflows.md) — draft skills, tools, local configuration, installation, and evaluations
10. [Data module](10-data-module.md) — storage decisions, entities, access, migrations, and checks
11. [Framework discovery](11-framework-discovery.md) — candidate signals, comparison, and choice
12. [Plan quality](12-plan-quality.md) — risk, recovery, and operational checks
13. [UI specification](13-ui-spec.md) — screen and interaction contracts, accessibility, and verification
14. [AI features](14-ai-feature.md) — models, data, safeguards, and evaluations
15. [Adaptive interview](15-adaptive-interview.md) — fact coverage, question depth, and confirmation
16. [Planning specialists](16-planning-specialists.md) — pinned roles, read-only delegation, and advisory records

## Ground rules (from ADRs — summarized)

- State lives in **files** in the project folder; the web app is a client (ADR-0003).
- All pipeline artifacts are **English source of truth**; AI translates interaction into the user's language at runtime (ADR-0002).
- Boosters are **essential dependencies**, never optional garnish; NC-licensed skills are runtime dependencies only, never vendored into the repo (ADR-0001, ADR-0004).
- **Web research is required**: every claim rests on live, cited, fresh research; no memory fallback and no degraded research mode (ADR-0007, which supersedes ADR-0004 for research only; contract in `07-research.md`).
- Skill external loading is **per Section** via the Conductor; every Section boundary produces a section record + checkpoint (ADR-0005).
- The pipeline is **honest**: evidence-first, anti-yes-man, assumptions flagged, "I don't know → research" allowed (Constitution).
- The pipeline **researches what the user doesn't know**: a Domain Brief after S0 and a scan before each Section; every fact cited with source and dates, within its freshness limit; web research is required — no web, no run (Constitution principles 1 and 14, spec 07).

## Non-goals

- Two-way web UI, multi-user, auth.
- Version history of documents (state journal is audit log, not doc versioning).
- Executing the build without LVR skills — the bundle must stay sufficient for any builder on its own; `/lvr-build` is an optional convenience, not a requirement.
- Posting to any platform — `/lvr-personal-brand` produces files only.
