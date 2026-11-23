---
name: lvr-add-feature
description: Adds one feature to a finished LVR Blueprint Bundle through a mini-pipeline — capture, targeted research, impact analysis across every affected bundle file, scope decision, then append-only application with a new decision and milestone. Use when the user wants to add, extend, or park a feature after the MVP is locked. Refuses when no bundle exists or scope is not locked.
---

# lvr-add-feature

The additive skill of the LVR pipeline. The MVP is frozen at S7; this skill is the only sanctioned way to change it after the bundle exists. It captures one feature with the same rigor as S4, researches only what the feature changes, walks every affected bundle file, and applies append-only edits with a recorded decision.

It never re-runs done Sections, never renumbers existing ids, never rewrites history, and never expands the MVP without an explicit answer.

## Load first

Before any check, question, or file write:

1. Read `references/principles.md` (the Constitution). Principles 1, 2, 9, 10, and 12 bind this skill hardest.
2. Read `references/conventions.md` (the operational manual): state schema, journal events, Section map, bundle list.
3. Read `references/feature-capture.md`: the mandatory capture form, targeted-research rules, impact matrix, and append templates.
4. Follow the conversation language and the before-write English document check in conventions §4.
5. **Script helper (preferred when Node is available).** This skill ships `scripts/lvr.mjs` (Node ≥22, nothing to install). `<skill-dir>` = the directory containing the loaded `SKILL.md`. Use the skill path reported by the harness and resolve `scripts/lvr.mjs` relative to it. Once per session run `node "<skill-dir>/scripts/lvr.mjs" version`. If it prints JSON with `"lvr_schema":2`, run the `Script:` command given at each step below (`LVR` = `node "<skill-dir>/scripts/lvr.mjs" --dir "<PROJECT_DIR>"`) and act on its JSON. **Preflight (every skill except /lvr-init-new-idea):** run `LVR state migrate --check`. If `needed` and `blocked` is null, run `LVR state migrate` and tell the user in one plain line (English source): "This project was made with an older LVR version. I updated its bookkeeping files to the new format; the old files are kept in `.lvr/migrations/`." (If `copied_from` is `.lvp`, ask once whether to remove the old `.lvp/` folder, default keep; on yes run `LVR state migrate --remove-legacy`.) If `blocked` is set, /lvr-continue follows its recovery for `blocked.code`; every other skill stops and recommends /lvr-continue. If any command answers `SCHEMA_TOO_NEW` (exit 1), the project was made by a newer LVR: change nothing and tell the user to update all LVR skills together. **Session:** after the preflight (init: in its Step 1) append `session_start` with `{"skill":"<this skill>","harness":"<harness id>","session_id":"<id the harness exposes>" or null with "session_id_reason":"<why>","model":"<model id>","cwd":"<cwd>"}` — use the confirmed ID source in `references/harnesses.json` and never invent an id — and at every exit append `session_end` with `{"reason":"done|paused|context_guard|error|cancelled","note":"<why>"}` (`note` is required for `cancelled`, which is how a refusal is recorded; `error` is journaled only after an unrecoverable failure left work half-done, never for a refusal). If `node` is missing, the command cannot start, or `lvr_schema` differs, say once (English source): "Node.js is not available here, so I'll do the bookkeeping by hand." Then follow each step's prose — the prose is the fallback and stays authoritative for behavior. Never hand-edit `.lvr/` files to work around a script error (`"ok":false`): report its `code` plainly and stop that step. On any non-zero exit (`"ok":false`) stop the step, show the error and follow `error.details.hint`; exit code 3 means the event was journaled (`journaled_seq`) or blocked but `state.json` was NOT updated (`STATE_LAGS`, `STATE_MISSING`, `STATE_INVALID`, `STATE_SEQ_UNKNOWN`, `JOURNAL_BEHIND_STATE`): do not continue the interview, run `/lvr-continue` (its Step 2 maps each code to the exact command). Pass long text through `--in -` with a quoted heredoc (`<<'EOF'`) or a PowerShell here-string (`@'…'@ |`), never inline in double quotes.

## Flow at a glance

1. **Precondition** — project, scope lock, S1–S9 done, bundle present. Otherwise refuse with guidance.
2. **Open + locate ids** — journal `feature_started`; next `F-NN`, `D-NNN`, `M<n>`.
3. **Capture** — one feature, full script, priority confirmed aloud.
4. **Targeted research** — only what this feature changes; source + date or `unverified`.
5. **Impact analysis** — every affected bundle file with its exact edit.
6. **Scope decision** — extend milestone / new milestone / Parking Lot, confirmed.
7. **Apply** — append-only edits, one file per turn; state decisions + milestones updated.
8. **Close** — journal `feature_done`; recommend `/lvr-review-plan`, then `/lvr-handoff`.

## Step 1 — Precondition

`TARGET` = cwd (or the folder the user named). First failure stops with plain guidance; nothing is written on a refusal.

1. **Project exists** — `TARGET/.lvr/state.json` exists and parses. Missing/unreadable → route to `/lvr-init-new-idea` or `/lvr-continue` as in `lvr-review-plan` Step 1.
2. **Scope locked** — per the conventions §5 definition: a `scope_locked` journal event **and** S7 done. Not locked → "The MVP is not frozen yet. Run `/lvr-continue` to finish S7, then add the feature."
3. **Pipeline through S9 done** — every S1–S9 Section done. Not → name the Section and route to `/lvr-continue`. The feature needs a bundle to extend.
4. **Bundle present** — `AGENTS.md` and `blueprint.json` exist. Missing → finish S9 first.
5. **Request present** — a feature description from the user. Missing → ask one line: "What should the product do that it does not do today?" Do not start with a solution-shaped guess.

## Step 2 — Open and locate ids

Script: `LVR ids next --reserve --in -` with `{"request":"<verbatim request>"}`

1. Load the journal, the S4/S7/S8 records and their additions, requirements, scope, milestones and the index. Inspect the already recorded outcomes.
2. Reserve the feature ID in `feature_started`. The helper derives F, D and M IDs from actual records and events. A repeated request resumes its reservation or reports completion. Finish or resume an open feature before reserving another.
3. Record pre-existing lint and citation findings. Keep the identified baseline out of the requested edits unless a finding blocks this feature. If the completed bundle predates frozen profiles, use `LVR profile plan --write --existing` before changing flags when a new file will be needed. It adopts the original index's declared files. Establish the existing profile from recorded evidence and confirm it only when unclear.

## Step 3 — Capture

Script: `LVR journal append --type feature_captured --payload '{"id":"F-NN","name":"…","priority":"…"}'`

Follow `references/feature-capture.md` §1. Micro-batches by tier (T1 ≤3, T2 ≤2, T3 =1), every turn in the user's language, skip and enough controls visible.

Required before moving on: original request in the journal, English request summary and display name, named user, complete click-by-click happy path, four scoped unhappy paths, priority confirmed aloud and scope proposal. Review data, abuse, regulated domains, AI usage and measurable operation targets where the feature changes them. Track coverage with `LVR interview progress --section S4 --in -` using feature-specific keys. Group known facts into one confirmation. Ask only for gaps and preserve skip/enough. Use the S4 booster plan for edge cases, stories and acceptance criteria.

Record the capture in English in `.lvr/docs/sections/S4-additions.md` (append-only, template in the reference). Journal `feature_captured` (payload: id, name, priority). One checkpoint.

## Step 4 — Targeted research

Script: `LVR journal append --type feature_research --payload '{…}'`

Follow `references/feature-capture.md` §2. Collect the Domain Brief delta and show dated findings before recommendation. Reuse fresh evidence from `RESEARCH.md`. Run mini S5b for a new framework, library or service, including hard compatibility checks, cited signals, ranked choices and the user’s decision with its recheck date.

Every new claim carries a cite group, or an `[unverified: <category> · RQ-NNN]` marker after logged research failed (conventions §10); log each research step as `research_logged` (`purpose` "feature"). Web research is required (principle 14): no web search or page fetch → explain how to enable it (conventions §10) and stop — never research from memory. Journal `feature_research` (payload: claims added, sources, unverified count). One checkpoint.

## Step 5 — Impact analysis

Script: `LVR journal append --type impact_analysis --payload '{"files":[…]}'`

Walk the matrix in `references/feature-capture.md` §3, row by row. Output a table:

```
file | action (edit/append/none) | exact section or row | content source
```

Rules:

- `edit` must quote the existing text it changes; no blind rewrite.
- Propose a new profile file only when an in-MVP feature changes a profile flag and the resulting plan includes that path. Include it in the scope choice. For stored data, extend the existing data model and security checks, including the ERD where used.
- Every new acceptance criterion gets a matching verification procedure; every new data field gets a data-model row; every new cost gets one verified number used in `RESEARCH.md`, `OVERVIEW.md`, and `blueprint.json`.
- Use the S6 booster plan for architecture, threats and cost. Apply the planning database or threat role when the impact changes their files. Use a verified read-only specialist when available, or its inline role, and journal the actual transport. Merge the cited result yourself.
- Journal `impact_analysis` (payload: file list and evidence). One checkpoint.

## Step 6 — Scope decision

Script: `LVR decision record --event feature_scope_decision --payload '{"feature":"F-NN","scope":"…"}' --decision '{"section":"S4","summary":"…","rationale":"…","status":"user_confirmed"}'`

Present the scope proposal in plain language with three options and consequences:

1. **Extend current milestone** — only when the feature fits the milestone's one-session size and shares its flow.
2. **New milestone** — default for a substantial feature; appended as `M<n+1>` after the last milestone.
3. **Parking Lot** — recorded, not built; the bundle gets a parked requirement row, a scope row with the reason, and a `USER_FLOWS.md` section marked `(parked — see SCOPE.md)`; no milestone or verification procedure.

Include the exact new file paths, new flags and added cost in the user's choice when applicable. The user's explicit choice is recorded as the next `D-NNN` (`section: "S4"`, `user_confirmed`, rationale = the choice and why), and its decision line is appended to the feature's block in `S4-additions.md` (template in the reference) — that line is what a state rebuild reads before `DECISIONS.md` has the row. A skip or "later" is not a scope decision: keep the capture and stop before applying bundle edits, reporting the open feature. Journal `feature_scope_decision` (payload: F-NN, choice, D-NNN). One checkpoint.

## Step 7 — Apply

Script: `LVR journal append --type feature_applied --payload '{"feature":"F-NN","file":"…","action":"…"}'`; when a milestone is appended add `"milestones":[{"id":"M<n>","goal":"…","features":["F-NN"]}]` to that payload.

Apply the impact table, one file per turn, append-only unless the row is a required edit:

- **Requirements** — append the F-NN row; for Parking Lot mark it `parked` and omit the milestone.
- **USER_FLOWS.md** — append the flow + numbered script for an in-MVP feature; for Parking Lot append the section with its heading marked `(parked — see SCOPE.md)` and the captured script (no diagram required).
- **SCOPE.md** — append the in-MVP row or the Parking Lot row with its reason.
- **MILESTONES.md** — extend the chosen milestone's deliverables, or append `M<n+1>`.
- **VERIFICATION.md** — append the matching procedure with exact commands and expected outputs.
- **SPEC/data-model.md, SPEC/api.md, SPEC/architecture.md, SECURITY.md** — only when the matrix says so.
- **DECISIONS.md** — append the scope decision row (and any design decision made during capture).
- **ASSUMPTIONS.md** — append every new `assumed` / `designer_filled` decision.
- **RESEARCH.md, OVERVIEW.md** — new evidence rows and owner-visible feature/cost lines.
- **CAPABILITIES.md, HANDOVER.md, CODE_STYLE.md** — only when the matrix says so.
- **Profile additions (A6)** — record an approval checkpoint with the same confirmed decision, actual flag changes and exact paths. Run `LVR profile add-file` for each path before writing it. Update the file map and use the packaged template. Keep approvals and paths in the additions record. Resume from the first missing step.
- **`blueprint.json`** — regenerate from state and the approved bundle list. Use `LVR blueprint emit` and provide changed stack or cost inputs when the approved feature changes them. `--check` previews the drift.
- **State** — append the decision; append the milestone entry (`verified: false`) when a milestone was added. Never touch done Sections or existing milestone entries.

After each file: journal `feature_applied` (payload: F-NN, file, action) + state write. One checkpoint per file.

## Step 8 — Close

Script: `LVR journal append --type feature_done --payload '{…}'`

1. Re-read the touched files and verify their impact rows. Run `LVR lint run`, `LVR crosscheck`, and `LVR cite check --file PATH` for each touched Markdown file. Fix introduced findings. Keep the feature open if a required check still fails. Record unrelated inherited gaps with their owners.
2. Journal `feature_done` (payload: F-NN, scope, files touched, D-NNN, M-id or none). One checkpoint.
   Use the [project-local lifecycle](references/booster-lifecycle.md) to ask about cleaning copies installed between this feature's `feature_started` and `feature_done` checkpoints. Keep user-owned copies and copies from earlier runs.
3. Close in plain language:
   - what the product now does (or what was parked),
   - which milestone covers it,
   - that the bundle changed and handoff artifacts may be stale.
4. Run `/lvr-review-plan` next, then `/lvr-handoff` again if it had already run. Do not tell the user the bundle is build-ready before the review.

## Journal events added by this skill

`feature_started`, `feature_captured`, `feature_research`, `impact_analysis`, `feature_scope_decision`, `feature_applied`, `feature_done`. Payloads are named above.

## Idempotency and resume

- Re-running with the same request on a bundle that already holds the captured F-NN: report it, show the recorded scope, and offer to continue at the first unapplied row instead of recapturing.
- Every file write is checkpointed; a dead session resumes from the impact table and the additions record.
- Never duplicate an `F-NN`, `D-NNN`, or milestone id.

## Never list

- Never start without a locked scope and a bundle.
- Never renumber, rewrite, or delete an existing feature, decision, milestone, or scope row.
- Never mutate a done Section Record; additions go to `S4-additions.md`.
- Add a bundle file only with the recorded post-lock profile approval.
- Never expand the MVP on a guess; the scope choice needs an explicit answer. (Principles 2, 12)
- Never leave an unsourced claim unflagged, or a skipped verification procedure. (Principles 1, 9)
