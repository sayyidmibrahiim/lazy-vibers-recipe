# LVR Pipeline Core — Spec Overview

Version: v1 (F1). Date: 2026-11-20. Decisions referenced: ADR-0001..0006, `GLOSSARY.md`.

## What LVR is

LVR (Lazy Vibers Recipe) is a pipeline that turns a raw idea from a **non-technical user** into a complete, industry-grade blueprint bundle that **any AI agent harness** (Claude Code, Codex, Gemini CLI, zcode, Antigravity, Cursor) can execute to build the product. One folder = one idea = one product.

## Actors

| Actor | Description |
|---|---|
| **Owner** | The non-technical user. Speaks any language (User Language). Cannot read technical specs unaided. |
| **Conductor** | The LVR skill running in a harness (`/lvr-init-new-idea`, `/lvr-continue`, or one of the post-S9 skills). Loads boosters per Section, drives the interview, writes state. |
| **Builder** | Any agent harness that later consumes the Blueprint Bundle. Has no LVR skills; relies on bundle files only. |
| **Web UI** | Optional read-only client (MVP) that reads the same `.lvr/` files. Two-way editing is F3. |

## Scope

Shipped, seven skills:

- v0 core: `/lvr-init-new-idea`, `/lvr-continue`, `/lvr-handoff` (Sections S0–S9, bundle generation, gap lint).
- v1, implemented: `/lvr-recheck-plan`, `/lvr-add-feature`, optional `/lvr-build`, `/lvr-personal-brand`.

Each skill ships `scripts/lvr.mjs` for the deterministic bookkeeping (journal, state, replay); the prose in each `SKILL.md` stays the fallback.

## Spec files

1. `01-state.md` — `.lvr/` layout, `state.json` schema, journal events, section records, Folder Gate, checkpoint/resume semantics
2. `02-sections.md` — S0–S10 definitions, question strategy, routing table (Section → booster → output)
3. `03-skills.md` — contracts for all seven skills + Constitution (`lvr-principles.md`)
4. `04-bundle.md` — Blueprint Bundle file specs, compilation order, maintenance after S9, `blueprint.json` schema
5. `05-boosters.md` — dependency model, tiers, bootstrap check, installers, failure UX
6. `06-model-tiers.md` — model tiers T1–T3, capability probe, context guard, truncation recovery, cross-model resume

## Ground rules (from ADRs — summarized)

- State lives in **files** in the project folder; the web app is a client (ADR-0003).
- All pipeline artifacts are **English source of truth**; AI translates interaction into the user's language at runtime (ADR-0002).
- Boosters are **essential dependencies**, never optional garnish; NC-licensed skills are runtime dependencies only, never vendored into the repo (ADR-0001, ADR-0004).
- Skill external loading is **per Section** via the Conductor; every Section boundary produces a section record + checkpoint (ADR-0005).
- The pipeline is **honest**: evidence-first, anti-yes-man, assumptions flagged, "I don't know → research" allowed (Constitution).

## Non-goals

- Two-way web UI, multi-user, auth.
- Version history of documents (state journal is audit log, not doc versioning).
- Executing the build without LVR skills — the bundle must stay sufficient for any builder on its own; `/lvr-build` is an optional convenience, not a requirement.
- Posting to any platform — `/lvr-personal-brand` produces files only.
