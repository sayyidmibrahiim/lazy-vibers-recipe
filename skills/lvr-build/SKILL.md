---
name: lvr-build
description: Executes the milestones of a finished LVR Blueprint Bundle in order, runs each recorded verification procedure, records the real output, and stops on the first unresolvable failure. Use when the user wants to build, implement, or continue building the product from its bundle, or asks which milestone is next. Never skips a verification and never rewrites the plan to pass one.
---

# lvr-build

The optional milestone executor of the LVR pipeline. The bundle already contains the plan, the acceptance criteria, and the verification procedures; this skill turns that plan into working code and proof. It never designs scope, never weakens a check, and never claims a pass it did not capture.

A harness can build the product from the bundle without this skill. This skill exists to make the loop deterministic and to keep verification results on disk.

## Load first

Before any check or file write:

1. Read `references/principles.md` (the Constitution). Principles 1, 2, 9, and 13 bind this skill hardest.
2. Read `references/conventions.md` (the operational manual): state schema, journal events, bundle list.
3. Read `references/build-loop.md`: preflight, milestone selection, verification protocol, failure ladder, recording template, deployment check, anti-cheating rules.
4. Interact in `state.project.user_language`. Code, commands, and stored values stay exact.
5. **Script helper (preferred when Node is available).** This skill ships `scripts/lvr.mjs` (Node ≥22, nothing to install). `<skill-dir>` = the folder holding this SKILL.md (use the base directory the harness reports; otherwise look for `lvr-<this-skill>/scripts/lvr.mjs` in the skills directories listed in INSTALL.md). Once per session run `node "<skill-dir>/scripts/lvr.mjs" version`. If it prints JSON with `"lvr_schema":2`, run the `Script:` command given at each step below (`LVR` = `node "<skill-dir>/scripts/lvr.mjs" --dir "<PROJECT_DIR>"`) and act on its JSON. **Preflight (every skill except /lvr-init-new-idea):** run `LVR state migrate --check`. If `needed` and `blocked` is null, run `LVR state migrate` and tell the user in one plain line (English source): "This project was made with an older LVR version. I updated its bookkeeping files to the new format; the old files are kept in `.lvr/migrations/`." (If `copied_from` is `.lvp`, ask once whether to remove the old `.lvp/` folder, default keep; on yes run `LVR state migrate --remove-legacy`.) If `blocked` is set, /lvr-continue follows its recovery for `blocked.code`; every other skill stops and recommends /lvr-continue. If any command answers `SCHEMA_TOO_NEW` (exit 1), the project was made by a newer LVR: change nothing and tell the user to update all LVR skills together. **Session:** after the preflight (init: in its Step 1) append `session_start` with `{"skill":"<this skill>","harness":"<harness id>","session_id":"<id the harness exposes>" or null with "session_id_reason":"<why>","model":"<model id>","cwd":"<cwd>"}` — never invent an id — and at every exit append `session_end` with `{"reason":"done|paused|context_guard|error|cancelled","note":"<why>"}` (`note` is required for `cancelled`, which is how a refusal is recorded; `error` is journaled only after an unrecoverable failure left work half-done, never for a refusal). If `node` is missing, the command cannot start, or `lvr_schema` differs, say once (English source): "Node.js is not available here, so I'll do the bookkeeping by hand." Then follow each step's prose — the prose is the fallback and stays authoritative for behavior. Never hand-edit `.lvr/` files to work around a script error (`"ok":false`): report its `code` plainly and stop that step. On any non-zero exit (`"ok":false`) stop the step, show the error and follow `error.details.hint`; exit code 3 means the event was journaled (`journaled_seq`) or blocked but `state.json` was NOT updated (`STATE_LAGS`, `STATE_MISSING`, `STATE_INVALID`, `STATE_SEQ_UNKNOWN`, `JOURNAL_BEHIND_STATE`): do not continue the interview, run `/lvr-continue` (its Step 2 maps each code to the exact command). Pass long text through `--in -` with a quoted heredoc (`<<'EOF'`) or a PowerShell here-string (`@'…'@ |`), never inline in double quotes.

## Flow at a glance

1. **Precondition** — bundle, scope lock, S8–S9 done, milestones and verification present. Otherwise refuse with guidance.
2. **Preflight** — run the reference §1 checklist; broken plan → `build_blocked`.
3. **Open** — journal `build_started`; load builder context in `AGENTS.md` order.
4. **Select** — first milestone in `state.milestones[]` not `verified`.
5. **Build + verify** — implement, run the recorded procedure exactly, capture output.
6. **Record** — append to `VERIFICATION.md`; on pass set state fields; journal the result.
7. **Next or stop** — next unverified milestone, or a plain failure report at the first unresolvable one.
8. **Close** — `build_done` when all milestones pass; deployment gate; point at `/lvr-handoff` then `/lvr-personal-brand`.

## Step 1 — Precondition

`TARGET` = cwd (or the folder the user named). First failure stops with plain guidance; nothing is written on a refusal.

1. **Project exists** — `TARGET/.lvr/state.json` exists and parses. Missing/unreadable → `/lvr-init-new-idea` or `/lvr-continue`.
2. **Scope locked** — per the conventions §5 definition: a `scope_locked` journal event **and** S7 done. Not locked → `/lvr-continue` to S7.
3. **S8–S9 done** — both Sections `status` "done". Not → `/lvr-continue` to finish the plan and compile the bundle.
4. **Bundle present** — `AGENTS.md`, `MILESTONES.md`, `VERIFICATION.md`, `CODE_STYLE.md`, `SECURITY.md`, `DECISIONS.md`, `HANDOVER.md` all exist and are non-empty. Missing → finish S9 or run `/lvr-recheck-plan`.
5. **Milestones exist** — `state.milestones[]` and `MILESTONES.md` are non-empty and share the same ids. Not → `/lvr-continue` to S8.
6. **Handoff warning, not a refusal** — when `state.handoff` is null, say plainly: "The bundle was not verified by `/lvr-handoff` yet. I can build, but the plan may carry gaps. Run `/lvr-handoff` first, or say continue." Continue only after an explicit answer.

## Step 2 — Preflight

Run `references/build-loop.md` §1. Every item must pass. Preflight runs before `build_started`: a failure journals `build_blocked` only — no state field changes, `project.status` stays as it is (replay treats `build_blocked` as informational). Failures:

- a plan/bundle defect (missing procedure, id mismatch, open blocking recheck finding) → journal `build_blocked` with the item, name the owning skill (`/lvr-recheck-plan`, `/lvr-add-feature`, or the user), and stop;
- a missing tool or credential the bundle knew about (S2 account, API key) → surface it now with the exact missing item; never start coding around it.

## Step 3 — Open

Script: `LVR journal append --type build_started --payload '{"milestone":"M0"}'`

1. Journal `build_started` (payload: first milestone id, bundle version/date) + a state write setting `project.status` = "building" (the script's reducer does this). One checkpoint.
2. Load builder context in the order `AGENTS.md` defines: `DECISIONS.md` → `SPEC/` → `MILESTONES.md` → `VERIFICATION.md`, plus `CODE_STYLE.md`, `SECURITY.md`, and `HANDOVER.md` for their concerns.
3. Per tier: T1/T2 load the context once per milestone; T3 reloads `state.json`, the current milestone row, its verification row, and the stack rules every turn — never the transcript.

## Step 4 — Select the milestone

Script: `LVR journal append --type milestone_started --payload '{"id":"M0","goal":"…"}'`

Follow `references/build-loop.md` §2:

- first entry in `state.milestones[]` where `verified` is not `true`;
- never re-run a verified milestone, never reorder;
- all verified → skip to Step 8.

Journal `milestone_started` (payload: id, goal). One checkpoint.

## Step 5 — Build and verify

1. Read the milestone's goal, deliverables, acceptance criteria, and procedure. State the plan for this milestone in two or three plain lines.
2. Implement the deliverables in the project folder, outside `.lvr/`, following `CODE_STYLE.md` and `SECURITY.md`.
3. Run the verification procedure exactly as written; capture command, exit code, full output, timestamp (`references/build-loop.md` §3).
4. Never edit bundle documents, assertions, or expected outputs to make a check pass. Never substitute a command.
5. A procedure that is wrong or impossible is a bundle defect: stop, journal `build_blocked`, and recommend `/lvr-recheck-plan` (R3.3).

## Step 6 — Record the result

Script: `LVR journal append --type milestone_verified --payload '{"id":"M0","attempt":1,"verified_at":"<ISO now>"}'` (sets `verified` + `verified_at`), `--type milestone_failed`, or `--type build_blocked`.

Append one entry to `VERIFICATION.md` using the template in `references/build-loop.md` §5. Never rewrite earlier entries.

On **PASS**:

- set `state.milestones[i].verified = true` and `verified_at = <ts>`;
- journal `milestone_verified` (payload: id, attempt, criteria passed);
- one checkpoint, then continue at Step 4.

On **FAIL**:

- journal `milestone_failed` (payload: id, attempt, decisive output line);
- follow the failure ladder (`references/build-loop.md` §4): one fix attempt, then a fresh-assumption check, then stop. Two failures maximum; no third blind attempt.
- on an unresolvable failure: journal `build_blocked` (payload: milestone, command, output, owner), keep the milestone unverified, and close with a plain report.

## Step 7 — Deployment check

Script: `LVR journal append --type deployment_verified --payload '{"url":"<url>"}'` (fills `state.deployment`).

When the milestone deploys the product, run `references/build-loop.md` §6:

- live URL + expected HTTP status + one user-visible fact;
- on pass set `state.deployment = { "status": "live", "url": "<url>", "verified_at": "<ts>" }`, journal `deployment_verified`;
- unverifiable deployment → `status: "pending"`, say exactly what evidence is missing.

## Step 8 — Close

Script: `LVR journal append --type build_done --payload '{…}'`

1. All milestones verified → journal `build_done` (payload: milestones, deployment status) + a state write setting `project.status` = "complete" (the script's reducer does this). One checkpoint.
2. Report plainly: what now works, how to run it, which checks were captured, what remains (deployment pending, known limitations).
3. Next actions, in order:
   - `/lvr-handoff` again — it refreshes `blueprint.json` and the entry prompt from the new state;
   - `/lvr-personal-brand` — only after every milestone is verified and deployment is live;
   - `/lvr-add-feature` — for anything outside the frozen scope, never a quiet edit.
4. A blocked build closes with the exact failing command, output, suspected cause, and next owner. Do not call it done.

## State fields added by this skill

Backward-compatible additions, documented in conventions §2:

- `state.project.status`: `building` at `build_started`, `complete` at `build_done`.
- `state.milestones[i].verified: boolean` + `verified_at: string`.
- `state.deployment: { status: "live|pending", url?: string, verified_at?: string }`.

`.lvr/` writes are limited to those fields and journal appends. Everything else under `.lvr/` is read-only.

## Journal events added by this skill

`build_started`, `milestone_started`, `milestone_verified`, `milestone_failed`, `build_blocked`, `deployment_verified`, `build_done`. Payloads are named above.

## Idempotency and resume

- Verified milestones are never re-run; re-running `/lvr-build` selects the first unverified one.
- Attempt count comes from the `VERIFICATION.md` build log, never from memory; a resumed milestone never exceeds the two-failure cap.
- Interrupted work leaves state and log consistent at the last checkpoint; rerun safely.

## Never list

- Never skip, replace, weaken, or delete a verification step or assertion. (Principle 9)
- Never claim a pass without captured output.
- Never edit bundle documents or `.lvr/` planning state outside the documented fields.
- Never change scope, features, or milestones; route to `/lvr-add-feature`.
- Never continue past an unresolvable failure, and never take a third blind attempt. (Principles 2, 9)
- Never mark a milestone verified because the code "looks done".
