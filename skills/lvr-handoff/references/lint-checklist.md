# Gap-lint checklist (/lvr-handoff)

The operational bundle lint. Run every check literally, groups A–I in order, before any emission. One line per check; the check id (A1, B4, …) goes into the `gap_found` journal payload. The embedded required-headings lists and the `blueprint.json` schema (group H) mirror the S9 skeletons in `lvr-init-new-idea/references/bundle/templates.md` — embedded here so the lint works with no other skill installed. When that skill IS installed, its templates are the richer source for fix instructions.

Two finding kinds:

- **Bundle gap** — owner is a Section/skill (owner table at the bottom). Collected for the fix-now/abort offer.
- **Self-fix** — owner is the handoff itself (H1, H2). Journaled `gap_found`, then fixed automatically at the Emit step; never user-facing.

Script: `node "<skill-dir>/scripts/lvr.mjs" --dir "<PROJECT_DIR>" lint run [--group A,C] [--journal]` executes the mechanical part of every check below and returns `findings[]` (`{id, group, file, message, owner, kind}`; messages are fixed text). `needs_model[]` lists, always and never guessed, the checks that need your judgment (the model performs them literally from this file; a script finding never replaces them): B19 (English GFM; Mermaid fences and unfilled placeholders are scripted), B21 (stack and entity names; display name and feature names are scripted), C4 (Why and confirm lines are specific; filled is scripted), D3 (machine-checkable; known vague phrases are scripted), D4 (exact commands and expected outputs; steps under 25 characters or vague are scripted), D5 (each procedure really covers its criterion; counts are scripted), D6 (a real end-to-end smoke pass; numbering, thin steps and a near-empty definition are scripted), E3 (the two cost tables agree), E4 (every price in the OVERVIEW.md and RESEARCH.md cost tables names a source; the date or `unverified` flag on every row, and a Source cell that is not empty, only a date or only a placeholder (`TBD`, `n/a`, `-`, `?`) wherever the table has a Source column, are scripted; an `unverified` row needs no Source), G3 (concrete product description; non-empty is scripted), G5 (the "milestone is done only when its VERIFICATION procedure passes" rule is stated; the three file mentions are scripted), H4 (no contradiction with `decisions[]`; a broken `stack.reasons_ref` is scripted). Every other check here is scripted in full: that is the whole list of twelve. `crosscheck` is the S9 view over the same checks (rules X1–X8: X1 = B5, B9, F1, F4; X2 = C1–C3; X3 = C4, C5; X4 = B21; X5 = B15, D4, D5; X6 = E4; X7 = A; X8 = I). Group I is the citation check (`cite check --all`, conventions §10): `lint run` includes its findings and its `needs_model` items (I1, I3, I6, I7, I12); `--group I` runs it alone. Without Node the model executes the whole file literally.

Reporting rule: a file that already failed a presence check (group A) is not re-checked in later groups — one finding per missing file, not two. Every finding is plain language: what is wrong, where, and who fixes it.

## A. Presence — 18 content files exist and are non-empty

- A1 `AGENTS.md` — exists, non-empty
- A2 `OVERVIEW.md` — exists, non-empty
- A3 `DECISIONS.md` — exists, non-empty
- A4 `SPEC/prd.md` — exists, non-empty
- A5 `SPEC/requirements.md` — exists, non-empty
- A6 `SPEC/data-model.md` — exists, non-empty
- A7 `SPEC/api.md` — exists, non-empty
- A8 `SPEC/architecture.md` — exists, non-empty
- A9 `USER_FLOWS.md` — exists, non-empty
- A10 `CODE_STYLE.md` — exists, non-empty
- A11 `SECURITY.md` — exists, non-empty
- A12 `RESEARCH.md` — exists, non-empty
- A13 `SCOPE.md` — exists, non-empty
- A14 `MILESTONES.md` — exists, non-empty
- A15 `VERIFICATION.md` — exists, non-empty
- A16 `ASSUMPTIONS.md` — exists, non-empty
- A17 `HANDOVER.md` — exists, non-empty
- A18 `CAPABILITIES.md` — exists, non-empty

`blueprint.json`, `CLAUDE.md`, `GEMINI.md` (rows 19–20 of the conventions §8 list) are handoff outputs: missing is never a gap — see groups G and H. A whole missing bundle (A1–A18 all fail) means S9 never ran: one plain report line saying so (id `A0` in the script), owned by S9.

## B. Structure — each file carries its template's required headings, in order

- B1 `AGENTS.md` — `# <Display name>` · `## What this is` · `## How to load context` · `## Working rules` · `## File map`
- B2 `OVERVIEW.md` — `# <Display name> — plain-language overview` · `## What this is` · `## What was decided` · `## What it costs` · `## How you will use it` · `## What is parked` · `## Limitations`
- B3 `DECISIONS.md` — starts with `# Decisions`; decision table with the exact header row `| ID | Decision | Rationale | Alternatives considered | Date | Status |`
- B4 `SPEC/prd.md` — `# PRD — <Display name>` · `## Problem` · `## Context` · `## Target users` · `## Value proposition` · `## Goals` · `## Non-goals` · `## Success metrics`
- B5 `SPEC/requirements.md` — `# Requirements` · exactly one `## F-<NN> — <name>` block per feature (a duplicated id, or an F-NN found in USER_FLOWS.md or the milestones but with no block here, is a finding)
- B6 `SPEC/data-model.md` — `# Data model` · `## Entities` · `## Relations` · `## Indexes` · `## Validation rules` · `## Sample JSON`
- B7 `SPEC/api.md` — `# API` · `## Conventions` · `## Endpoints` · `## Critical endpoints` · `## Status codes` · `## Error format`
- B8 `SPEC/architecture.md` — `# Architecture` · `## Stack` · `## Components` · `## Data flow` · `## Folder structure` · `## Local run` · `## Failure points`
- B9 `USER_FLOWS.md` — `# User flows` · exactly one `## F-<NN> — <name>` section per feature (a duplicated id is a finding)
- B10 `CODE_STYLE.md` — `# Code style` · `## Language and framework conventions` · `## Error handling` · `## Testing expectations` · `## Simplicity rules`
- B11 `SECURITY.md` — `# Security` · `## Auth model` · `## PII inventory and protection` · `## Secrets handling` · `## Dependencies policy` · `## Compliance notes`
- B12 `RESEARCH.md` — `# Research` · `## Competitor scan` · `## Comparable products` · `## Stack comparison and trade-offs` · `## Cost table` · `## Risks (from S6)`
- B13 `SCOPE.md` — `# Scope` · `## In MVP` · `## Parking Lot (recorded, never deleted)`
- B14 `MILESTONES.md` — `# Milestones` · one `## M<n> — <name>` block per milestone, M0 first
- B15 `VERIFICATION.md` — `# Verification` · one `## M<n> — <name>` section per milestone · `## Global smoke test` · `## Definition of verified` · then any number of trailing `## Build log — <ts>` sections appended by `/lvr-build` (allowed, never a finding)
- B16 `ASSUMPTIONS.md` — `# Assumptions` · one `## D-<NNN> — <summary> (assumed | designer_filled)` block per non-confirmed decision
- B17 `HANDOVER.md` — `# Handover (owner guide)` · `## How to run it` · `## How to deploy and update` · `## How to back up` · `## Where secrets and API keys live` · `## Who to ask what`
- B18 `CAPABILITIES.md` — `# Capabilities` · booster table with the exact header row `| Name | Kind | License | Install | Notes |`
- B19 all bundle files — GitHub-flavored Markdown, English, no Mermaid fences (ASCII diagrams only)
- B20 no unfilled template placeholder (`<…>`) survives as literal text in any bundle file — a violation is an UNFILLED `<...>` token outside code fences; URLs/parameters inside fenced blocks and documented runtime parameters in emitted content (verification-time values like `<date>`, `<APP>` as defined in-file, the error envelope `{"error": "<message>"}`) are content, not placeholders (the script treats a `<token>` as documented when the same file shows it inside inline code or a fenced block)
- B21 names are identical across files — the display name is the H1 of AGENTS.md (`# <Display name>`), OVERVIEW.md and SPEC/prd.md; each F-NN has the same name in SPEC/requirements.md, USER_FLOWS.md (heading minus its `(in-MVP)` / `(parked — see SCOPE.md)` suffix), SCOPE.md (the row starts with the name) and blueprint.json; stack and entity names are the model's check

## C. Decision completeness — bundle mirrors `state.json → decisions[]`

- C1 every decision in `decisions[]` has a DECISIONS.md row — same id, same status
- C2 every DECISIONS.md row exists in `decisions[]` — exact mirror, nothing extra on either side
- C3 every DECISIONS.md row carries a non-empty rationale, a non-empty alternatives cell, and a date
- C4 every decision with status `assumed` or `designer_filled` has an ASSUMPTIONS.md block with **Why** and a confirm-instruction line filled — the label is semantic, not exact-match: any explicit confirm-instruction label (`**How to replace or confirm:**`, `**How to confirm:**`, `**How to replace:**`) satisfies it; the content must be filled and specific
- C5 no `user_confirmed` decision appears in ASSUMPTIONS.md

## D. Milestone completeness — machine-checkable, never "looks good"

- D1 `state.milestones[]` and MILESTONES.md agree (same ids, same order, M0 first); every in-MVP F-NN lands in exactly one milestone
- D2 every milestone has a goal, deliverables, and at least one acceptance criterion
- D3 every acceptance criterion is machine-checkable — a command with expected output, a scripted step, or an observable visual fact; never "looks good", "works well", or vague
- D4 every milestone has a verification procedure in VERIFICATION.md — exact commands + expected outputs; visual checks as observable facts plus how to look
- D5 every acceptance criterion's procedure appears in VERIFICATION.md — no criterion without a procedure
- D6 `## Global smoke test` gives one scripted end-to-end pass; `## Definition of verified` states when a milestone counts as verified

## E. Costs — present and consistent

- E1 OVERVIEW.md `## What it costs` holds a table (item · price · when) with monthly and one-time totals
- E2 RESEARCH.md `## Cost table` holds a table (item · price · type · source)
- E3 the two tables agree — same items, same numbers, no contradiction
- E4 every price cites source + access date, or carries an explicit `unverified` flag (principle 1)

## F. Scope — SCOPE.md matches the recorded state

- F1 every F-NN from the S4 record/state is classified in SCOPE.md — `## In MVP` or `## Parking Lot`; none missing, none invented
- F2 every parked F-NN carries its one-line reason
- F3 SCOPE.md cites the scope-lock decision id under the title
- F4 every in-MVP F-NN has a SPEC/requirements.md block (Status: in-MVP) and a USER_FLOWS.md section; every parked F-NN has a requirements block marked parked

## G. Adapters — stubs and the AGENTS.md entry point

- G1 `CLAUDE.md` is exactly this one line and nothing else: `Read [AGENTS.md](AGENTS.md) — the builder entry point for this project.` (missing or wrong content → rewritten in this run: self-fix)
- G2 `GEMINI.md` is exactly that same one line (same self-fix)
- G3 `AGENTS.md` `## What this is` says what the product is, concretely (2–4 lines, no placeholder)
- G4 `AGENTS.md` `## How to load context` gives the read order: `DECISIONS.md` → `SPEC/` (prd, requirements, data-model, api, architecture) → `MILESTONES.md` → `VERIFICATION.md`
- G5 `AGENTS.md` `## Working rules` states the rules: stack/language → `CODE_STYLE.md`, security → `SECURITY.md`, a milestone is done only when its `VERIFICATION.md` procedure passes
- G6 `AGENTS.md` `## File map` points to every one of the other 19 bundle files — none missing

G3–G6 are the "thin AGENTS.md" checks: failing any one is a gap finding, never a silent pass.

## H. State coherence — blueprint.json vs state.json

- H1 `blueprint.json` exists — missing is not a gap: it is emitted in this run (self-fix)
- H2 every field blueprint.json derives matches `state.json` and the bundle — project (slug, name, user_language, status), features (id, name, in_mvp), `decisions_count` (confirmed/assumed/designer_filled), milestones (id, goal, acceptance_count), costs vs the cost tables; any drift → re-emitted in this run (self-fix)
- H3 blueprint.json follows the schema summary below — same keys and shapes, `schema_version` = 1 (a violation is a self-fix: re-emitted in this run)
- H4 no bundle document contradicts `decisions[]` — the stack named in OVERVIEW/SPEC/architecture/RESEARCH and every shaping decision trace to decision ids; `blueprint.json` `stack.reasons_ref` names an existing decision

`blueprint.json` schema summary (v1, verbatim from the S9 templates — embedded so the H checks need no other skill installed):

```jsonc
{
  "schema_version": 1,
  "generated_at": "2026-11-08T12:00:00Z",
  "project": { "slug": "...", "name": "...", "user_language": "id",
               "idea_summary_en": "...", "status": "bundled" },
  "stack": { "primary": "next-supabase", "components": ["Next.js", "Supabase"],
             "reasons_ref": "DECISIONS.md#D-003" },
  "features": [ { "id": "F-01", "name": "...", "in_mvp": true, "flows_ref": "USER_FLOWS.md#F-01" } ],
  "decisions_count": { "confirmed": 12, "assumed": 3, "designer_filled": 5 },
  "milestones": [ { "id": "M0", "goal": "...", "verified": false,
                    "acceptance_count": 4, "ref": "MILESTONES.md#M0" } ],
  "costs": { "monthly_usd": 0, "one_time_usd": 0, "table_ref": "RESEARCH.md#cost-table" },
  "capabilities": [ { "name": "...", "kind": "skill|mcp|plugin", "license": "MIT",
                      "nc": false, "install": "npx skills add ..." } ],
  "pointers": { "agents": "AGENTS.md", "overview": "OVERVIEW.md",
                "verification": "VERIFICATION.md", "state": ".lvr/state.json" }
}
```

The `ref` / `*_ref` values are logical pointers `<file>#<id>`, not Markdown anchors: the id is the feature (`F-01`), decision (`D-003`) or milestone (`M0`) id that starts the target heading or table row, and `costs` names the `## Cost table` section (`RESEARCH.md#cost-table`).

## I. Citations — every fact sourced, fresh, and honest (principles 1 and 14)

Material: `.lvr/docs/sections/*.md`, `.lvr/docs/research/*.md`, every bundle Markdown file except CLAUDE.md/GEMINI.md, `state.json → decisions[]`, the journal's `research_logged`/`context_research` events, and `references/freshness.json`. Skip fenced code, inline code, HTML comments, and VERIFICATION.md `## Build log — …` sections. Syntax, limits, and the key-fact rule: conventions §10. Exact zone and message rules: `docs/spec/07-research.md` §6 in the LVR repository (the script applies them).

- I1 every row of a table with a Source column, and every line stating a price, a fee or rate percentage, or a version in RESEARCH.md, the S5 record, the Domain Brief, the S2 `## Prices quoted` section and the OVERVIEW `## What it costs` section, carries a cite group, an `[unverified: …]` marker, or the answer id of a recorded answer (total rows exempt)
- I2 no source is model memory ("model knowledge", "from memory", "assistant's memory", "no live check", "training data", "knowledge cutoff")
- I3 every `[cite: …]` tag and `[unverified: …]` marker follows the syntax: known category, http(s) URL, `pub`/`upd` date or `n.d.`, `acc` date, known flags once each; one category per claim
- I4 every cite has a date: `n.d.` only with `live` (never for `statistic` or `regulation`)
- I5 no impossible date, no date after today, no published date after the access date
- I6 no fact past its freshness limit (the freshest source counts; regulations: the newest `amend-check`)
- I7 every key fact (`price`, `quota`, `version`, `legal`, `regulation`) has a fresh `primary` source or two fresh sources from different sites
- I8 every regulation cite group has an `amend-check` date
- I9 no bare "unverified": every marker names failed, logged research (`RQ-NNN` with `outcome` failed and queries)
- I10 no marker whose newest failed research is older than the category limit (try again)
- I11 no `designer_filled` decision (state, DECISIONS.md, ASSUMPTIONS.md, record lines) rests on an unverified fact
- I12 no recommendation leans on "best practice", "industry standard", or "experts recommend" without a cite; every recommendation section holds at least one cite
- I13 every Domain Brief item names its Section (S1–S8), and once that Section is done its `Became` cell holds an answer id or decision id

A missing Domain Brief in a project whose S0 is done is reported as a warning (an older project), not a finding: `/lvr-continue` builds it.

## Owners

| Group | Owning Section/skill | How it gets fixed |
|---|---|---|
| A, B (bundle files) | S9 Compile | `lvr-init-new-idea` §S9 procedure (or `/lvr-continue` bundle completion) |
| C | S9 cross-check (data from S1–S6 records) | S9 procedure, targeted edits |
| D | S8 Milestone plan | S8 procedure fixes the plan; S9 re-compiles MILESTONES.md/VERIFICATION.md |
| E | S9 (material from S2/S5) | S9 procedure |
| F1–F3 | S7 if the split itself is wrong; S9 if the file drifted from the S7 record | S7 or S9 procedure |
| F4 | S9 cross-check | S9 procedure |
| G3–G6 | S9 (AGENTS.md authored there) | S9 procedure; precise per-file instruction if init skill absent |
| G1–G2, H1–H3 | this skill | Emit step, automatic — never user-facing |
| I | the Section that owns the file (a section record → that Section; the Domain Brief → S0, an item → its Section; bundle files → S9) | research the fact again (`research log`), fix the record, then S9 re-compiles the bundle lines that repeat it |
