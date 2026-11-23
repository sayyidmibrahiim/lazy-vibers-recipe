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
4. Follow the conversation language and the before-write English document check in conventions §4.
5. **Script helper (preferred when Node is available).** This skill ships `scripts/lvr.mjs` (Node ≥22, nothing to install). `<skill-dir>` = the directory containing the loaded `SKILL.md`. Use the skill path reported by the harness and resolve `scripts/lvr.mjs` relative to it. Once per session run `node "<skill-dir>/scripts/lvr.mjs" version`. If it prints JSON with `"lvr_schema":2`, run the `Script:` command given at each step below (`LVR` = `node "<skill-dir>/scripts/lvr.mjs" --dir "<PROJECT_DIR>"`) and act on its JSON. **Preflight (every skill except /lvr-init-new-idea):** run `LVR state migrate --check`. If `needed` and `blocked` is null, run `LVR state migrate` and tell the user in one plain line (English source): "This project was made with an older LVR version. I updated its bookkeeping files to the new format; the old files are kept in `.lvr/migrations/`." (If `copied_from` is `.lvp`, ask once whether to remove the old `.lvp/` folder, default keep; on yes run `LVR state migrate --remove-legacy`.) If `blocked` is set, /lvr-continue follows its recovery for `blocked.code`; every other skill stops and recommends /lvr-continue. If any command answers `SCHEMA_TOO_NEW` (exit 1), the project was made by a newer LVR: change nothing and tell the user to update all LVR skills together. **Session:** after the preflight (init: in its Step 1) append `session_start` with `{"skill":"<this skill>","harness":"<harness id>","session_id":"<id the harness exposes>" or null with "session_id_reason":"<why>","model":"<model id>","cwd":"<cwd>"}` — use the confirmed ID source in `references/harnesses.json` and never invent an id — and at every exit append `session_end` with `{"reason":"done|paused|context_guard|error|cancelled","note":"<why>"}` (`note` is required for `cancelled`, which is how a refusal is recorded; `error` is journaled only after an unrecoverable failure left work half-done, never for a refusal). If `node` is missing, the command cannot start, or `lvr_schema` differs, say once (English source): "Node.js is not available here, so I'll do the bookkeeping by hand." Then follow each step's prose — the prose is the fallback and stays authoritative for behavior. Never hand-edit `.lvr/` files to work around a script error (`"ok":false`): report its `code` plainly and stop that step. On any non-zero exit (`"ok":false`) stop the step, show the error and follow `error.details.hint`; exit code 3 means the event was journaled (`journaled_seq`) or blocked but `state.json` was NOT updated (`STATE_LAGS`, `STATE_MISSING`, `STATE_INVALID`, `STATE_SEQ_UNKNOWN`, `JOURNAL_BEHIND_STATE`): do not continue the interview, run `/lvr-continue` (its Step 2 maps each code to the exact command). Pass long text through `--in -` with a quoted heredoc (`<<'EOF'`) or a PowerShell here-string (`@'…'@ |`), never inline in double quotes.

## Flow at a glance

1. **Precondition** — bundle, scope lock, S8–S9 done, milestones and verification present. Otherwise refuse with guidance.
2. **Preflight** — run the reference §1 checklist and check versions, quotas and prices; a broken or expired plan records `build_blocked`.
3. **Open** — journal `build_started`; load builder context in `AGENTS.md` order.
4. **Select** — first milestone in `state.milestones[]` not `verified`.
5. **Build + verify** — implement, run the recorded procedure exactly, capture output.
6. **Record** — append to `VERIFICATION.md`; on pass set state fields; journal the result.
7. **Next or stop** — next unverified milestone, or a plain failure report at the first unresolvable one.
8. **Close** — `build_done` after every milestone and the release checks pass; point at `/lvr-handoff` then `/lvr-personal-brand`.

## Step 1 — Precondition

`TARGET` = cwd (or the folder the user named). First failure stops with plain guidance; nothing is written on a refusal.

1. **Project exists** — `TARGET/.lvr/state.json` exists and parses. Missing/unreadable → `/lvr-init-new-idea` or `/lvr-continue`.
2. **Scope locked** — per the conventions §5 definition: a `scope_locked` journal event **and** S7 done. Not locked → `/lvr-continue` to S7.
3. **S8–S9 done** — both Sections `status` "done". Not → `/lvr-continue` to finish the plan and compile the bundle.
4. **Bundle present** — `AGENTS.md`, `MILESTONES.md`, `VERIFICATION.md`, `CODE_STYLE.md`, `SECURITY.md`, `DECISIONS.md`, `HANDOVER.md` all exist and are non-empty. Missing → finish S9 or run `/lvr-review-plan`.
5. **Milestones exist** — `state.milestones[]` and `MILESTONES.md` are non-empty and share the same ids. Not → `/lvr-continue` to S8.
6. **Handoff warning, not a refusal** — when `state.handoff` is null, say plainly: "The bundle was not verified by `/lvr-handoff` yet. I can build, but the plan may carry gaps. Run `/lvr-handoff` first, or say continue." Continue only after an explicit answer.

## Step 2 — Preflight

Script: `LVR lint run`, `LVR crosscheck`, and `LVR verify freshness`.

Run `references/build-loop.md` §1. Check the actual manifest from `blueprint.json`, using the legacy base list for a v1 index. Every required item must pass. Preflight runs before `build_started`. On failure journal `build_blocked` without changing `project.status`.

- a plan/bundle defect (missing procedure, id mismatch, open blocking review finding) → journal `build_blocked` with the item, name the owning skill (`/lvr-review-plan`, `/lvr-add-feature`, or the user), and stop;
- a missing tool or credential the bundle knew about (S2 account, API key) → surface it now with the exact missing item; never start coding around it.
- stale framework pins, prices or quotas → verify the current facts using first-party pages and live docs. Continue only with refreshed evidence that passes the check. Send changes that affect the plan or have incomplete evidence to `/lvr-review-plan`.

## Step 3 — Open

Script: `LVR journal append --type build_started --payload '{"milestone":"M0"}'`

1. Journal `build_started` (payload: first milestone id, bundle version/date) + a state write setting `project.status` = "building" (the script's reducer does this). One checkpoint.
2. Load builder context in the order `AGENTS.md` defines. Use `blueprint.json` to locate approved profile files, including `UI_SPEC.md`, `SPEC/ai.md`, the data model and migrations, and workflow or install manifests. Use current official docs for API calls and flags.
3. Per tier: T1/T2 load the context once per milestone; T3 reloads `state.json`, the current milestone row, its verification row, and the stack rules every turn — never the transcript.

## Step 4 — Select the milestone

Script: `LVR verify freshness` then `LVR journal append --type milestone_started --payload '{"id":"M0","goal":"…"}'`.

Follow `references/build-loop.md` §2:

- first entry in `state.milestones[]` where `verified` is not `true`;
- check freshness again before starting the milestone, including after a resumed build or a fresh-assumption retry;
- plan the applicable project-local boosters for this milestone using the reference §8;
- never re-run a verified milestone, never reorder;
- all verified → run the final release checks in Step 7, then close at Step 8.

Journal `milestone_started` (payload: id, goal). One checkpoint.

## Step 5 — Build and verify

Script: `LVR verify run --in -` for an approved command's argument list, and `LVR ai cases` / `LVR ai eval --in FILE` when the milestone exercises a model.

1. Read the milestone's goal, deliverables, acceptance criteria, and procedure. State the plan for this milestone in two or three plain lines.
2. Implement the deliverables in the project folder, outside `.lvr/`, following `CODE_STYLE.md` and `SECURITY.md`.
3. Run the verification procedure exactly as written; capture command, exit code, full output, timestamp (`references/build-loop.md` §3).
4. Run the applicable interface, model, storage and workflow checks in the reference §3. Verify the actual manifest or package in a clean target when the milestone introduces an installable workflow.
5. A procedure that is wrong or impossible is a bundle defect: stop, journal `build_blocked`, and recommend `/lvr-review-plan` (lens L12, check L12.1).
6. When the milestone produces a release, run Step 7 for its release targets before recording the milestone result.

## Step 6 — Record the result

Script: `LVR state milestone set --id M0 --in -` with `{"status":"passed","attempt":1,"criteria_passed":["…"]}` or `{"status":"failed","attempt":1,"output":"…"}`. Use `journal append --type build_blocked` for a blocking result.

Append one entry to `VERIFICATION.md` using the template in `references/build-loop.md` §5. Never rewrite earlier entries.

On **PASS**:

- checkpoint the passed result. The script writes `milestone_verified` and applies `verified` and `verified_at`;
- one checkpoint, then continue at Step 4.

On **FAIL**:

- checkpoint the failed result with the decisive English observation and reference to the raw evidence;
- follow the failure ladder (`references/build-loop.md` §4): one fix attempt, then a fresh-assumption check, then stop. Two failures maximum; no third blind attempt.
- on an unresolvable failure: journal `build_blocked` (payload: milestone, command, output, owner), keep the milestone unverified, and close with a plain report.

## Step 7 — Release check

Script: `LVR release plan` and `LVR release record --in -`. For a passing web check also record `LVR journal append --type deployment_verified --payload '{"url":"<url>"}'`.

Run `references/build-loop.md` §6 when a milestone releases a product and after all milestones are verified. During a milestone check the types it releases. At the end check every confirmed type.

- Use the exact released artifact or deployment and a clean environment. Capture its type-specific output and journal the result. A web release checks the deployed URL for a 2xx response and one expected product fact.
- A failing release check stops the current release step. Say which type, artifact and observation blocked it. Keep failed milestone checks unverified and preserve previously verified milestones. Resume the release check when evidence is available.

## Step 8 — Close

Script: `LVR journal append --type build_done --payload '{…}'`

1. All milestones and release checks passed → journal `build_done` (payload: milestones and release results) + a state write setting `project.status` = "complete" (the script's reducer does this). One checkpoint.
2. Report plainly what works, how to run it, which checks were captured and any known limitations. After `build_done`, this skill handles cleanup of copies retained for build. Use the consent and exact-path checks in the project-local lifecycle. A pause preserves the pending work and copies.
3. Next actions, in order:
   - `/lvr-handoff` again — it refreshes `blueprint.json` and the entry prompt from the new state;
   - `/lvr-personal-brand` — after every milestone and release check passes;
   - `/lvr-add-feature` — for anything outside the frozen scope, never a quiet edit.
4. A blocked build closes with the exact failing command, output, suspected cause, and next owner. Do not call it done.

## State fields added by this skill

Backward-compatible additions, documented in conventions §2:

- `state.project.status`: `building` at `build_started`, `complete` at `build_done`.
- `state.milestones[i].verified: boolean` + `verified_at: string`.
- `state.deployment: { status: "live|pending", url?: string, verified_at?: string }`.
- `state.release_check[product_type]` holds the latest observed result for each checked type.

`.lvr/` writes are limited to those fields, raw verification evidence under `.lvr/verification/results/`, and journal appends. Everything else under `.lvr/` is read-only.

## Journal events added by this skill

`build_started`, `milestone_started`, `milestone_verified`, `milestone_failed`, `build_blocked`, `release_checked`, `deployment_verified`, `build_done`. Payloads are named above.

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
- Keep specialist delegation in planning. Builder-time specialist agents may be designed after 1.0 (owner decision B11).
