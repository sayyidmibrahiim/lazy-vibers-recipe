---
name: lvr-review-plan
description: Critical, skeptical review of a finished LVR Blueprint Bundle through 15 lenses (truth and freshness, unknown-unknowns, product type, scope, builder dry-run, data, security and legal, cost, schedule, one-way doors, coherence, testability, operations, UX, second-order effects). It scores each lens 0-10 as a pure function of the findings, keeps a findings ledger so later runs report fixed, new and missed items honestly (with an apology for misses), and never edits the plan except with --apply and user-approved fixes. Use when the user wants a plan or bundle reviewed, rechecked, audited, stress-tested or refreshed before building, or a light scope review at the S7 lock (--scope-only). Formerly /lvr-recheck-plan. Refuses when scope is not locked or S9 is not done (scope-only needs S6 done).
---

# lvr-review-plan

The critical review skill of the LVR pipeline. The plan is wrong somewhere, and the job is to find where. Every lens × file cell ends with findings, a verbatim clean quote, or a reason it does not apply. Severity is a lookup and the score is a formula, so the same plan always gets the same score. Later runs reconcile against the ledger: what was fixed, what is new and why, and an apology for anything an earlier run should have caught.

It never edits the bundle (except `--apply` with approved fixes), never re-runs done Sections and never marks milestones verified. `/lvr-handoff` closes the bundle and `/lvr-build` executes it. Formerly `/lvr-recheck-plan`: old `recheck_*` journal events replay as informational.

## Load first

Before any check or file write:

1. Read `references/principles.md` (the Constitution). Principles 1, 2, 3, 9, 13 and 14 bind this skill hardest.
2. Read `references/conventions.md` for state, journal, Section order, the base and profile bundle lists, and research rules (§10). Its §11 summarises this skill's files.
3. Read `references/protocol.md` (the run procedure), `references/scale.md` (severity, score and verdict) and `references/lenses.md` (the 15 lenses and their checks). `references/lenses.json` is the same registry for the script. `references/contract.md` holds the exact shape of every work file (`cells.json`, `findings.json`, `reconcile.json`, `approvals.json`, `apply.json`), the locator and claim_key rules, the verify predicates and the ledger schema: open the section you are writing. T3: load one lens section at a time.
4. Interact in the user's language (`state.project.user_language`) from the first message. Findings, the ledger and the report stay English; the conversation is translated at runtime.
5. **Script helper (preferred when Node is available).** This skill ships `scripts/lvr.mjs` (Node ≥22, nothing to install). `<skill-dir>` = the folder holding this SKILL.md (use the base directory the harness reports; otherwise look for `lvr-<this-skill>/scripts/lvr.mjs` in the skills directories listed in INSTALL.md). Once per session run `node "<skill-dir>/scripts/lvr.mjs" version`. If it prints JSON with `"lvr_schema":2`, run the `Script:` command given at each step below (`LVR` = `node "<skill-dir>/scripts/lvr.mjs" --dir "<PROJECT_DIR>"`) and act on its JSON. **Preflight (every skill except /lvr-init-new-idea):** run `LVR state migrate --check`. If `needed` and `blocked` is null, run `LVR state migrate` and tell the user in one plain line (English source): "This project was made with an older LVR version. I updated its bookkeeping files to the new format; the old files are kept in `.lvr/migrations/`." (If `copied_from` is `.lvp`, ask once whether to remove the old `.lvp/` folder, default keep; on yes run `LVR state migrate --remove-legacy`.) If `blocked` is set, /lvr-continue follows its recovery for `blocked.code`; every other skill stops and recommends /lvr-continue. If any command answers `SCHEMA_TOO_NEW` (exit 1), the project was made by a newer LVR: change nothing and tell the user to update all LVR skills together. **Session:** after the preflight (init: in its Step 1) append `session_start` with `{"skill":"<this skill>","harness":"<harness id>","session_id":"<id the harness exposes>" or null with "session_id_reason":"<why>","model":"<model id>","cwd":"<cwd>"}` — use the confirmed ID source in `references/harnesses.json` and never invent an id — and at every exit append `session_end` with `{"reason":"done|paused|context_guard|error|cancelled","note":"<why>"}` (`note` is required for `cancelled`, which is how a refusal is recorded; `error` is journaled only after an unrecoverable failure left work half-done, never for a refusal). If `node` is missing, the command cannot start, or `lvr_schema` differs, say once (English source): "Node.js is not available here, so I'll do the bookkeeping by hand." Then follow each step's prose — the prose is the fallback and stays authoritative for behavior. Never hand-edit `.lvr/` files to work around a script error (`"ok":false`): report its `code` plainly and stop that step. On any non-zero exit (`"ok":false`) stop the step, show the error and follow `error.details.hint`; exit code 3 means the event was journaled (`journaled_seq`) or blocked but `state.json` was NOT updated (`STATE_LAGS`, `STATE_MISSING`, `STATE_INVALID`, `STATE_SEQ_UNKNOWN`, `JOURNAL_BEHIND_STATE`): do not continue the interview, run `/lvr-continue` (its Step 2 maps each code to the exact command). Pass long text through `--in -` with a quoted heredoc (`<<'EOF'`) or a PowerShell here-string (`@'…'@ |`), never inline in double quotes.
6. **Review commands.** If a shipped command answers `UNKNOWN_COMMAND`, use the hand procedure for that step (`references/protocol.md` §12) and label the run "hand procedure" in the report. Read [review inputs](references/review-inputs.md) for profile checks, current sources and project-local aids.

## Modes

- **Review (default)**: a full review. It writes review artifacts and journal checkpoints, and can use project-local aids under the lifecycle rules. It preserves bundle files.
- **`--apply`**: applies the fixes the user approves from the last finished run, then re-reviews the affected lenses as the next run (protocol §8).
- **`--scope-only`**: a light review of the scope proposal at the S7 lock (protocol §10). `/lvr-init-new-idea` calls it from S7.
- **Fresh-context pass**: offered after P5 when the harness can start a subagent (protocol §9).

## Flow at a glance

1. **Precondition** → 2. **Open** (`review_started`) → 3. **Blind sweep** P0–P5 → 4. **Reconcile** (run 2+) → 5. **Score, stability, report** → 6. **Close** (`review_done`, plain verdict).

## Step 1 — Precondition

`TARGET` = cwd (or the folder the user named). Check in order; the first failure stops with plain guidance. Nothing is written on a refusal (end with `session_end` `cancelled` and a note when a session was opened).

1. **Project exists**: check `LVR state validate` and `LVR replay --compare` before opening the blind run. Use the journal sync and state validation results to identify recovery. Missing → run `/lvr-init-new-idea` in an empty folder or `/lvr-continue` in the right folder. For invalid or lagging state, route to `/lvr-continue` for replay.
2. **Scope locked** (full review): per conventions §5, the journal holds `scope_locked` **and** `pipeline.sections.S7.status` is "done". Not locked → "The scope is not locked yet. Run `/lvr-continue` to finish the pipeline up to S7. A light scope review is possible with `/lvr-review-plan --scope-only`."
3. **Pipeline complete through S9** (full review): every Section S1–S9 has status "done". If not, name each unfinished Section with its purpose (conventions §5) and say: "The bundle does not exist yet. Run `/lvr-continue`. It resumes at Section `<S>`. Then review."
4. **Bundle present** (full review): at least `AGENTS.md` and `blueprint.json` exist in `TARGET`. Missing → "S9 is marked done but the bundle is missing. Run `/lvr-continue` to finish S9 (it skips files already on disk), then review."
5. **Scope-only**: S1–S6 are done and S9 is not. Otherwise use the full review, or finish S6 first.
6. **`--apply`**: the last review run is a finished full run with counted findings. Otherwise run the review first.

S9 being done while the bundle has gaps is exactly what this skill reviews. Do not refuse that case.

## Step 2 — Open

Script: `LVR journal append --type review_started --payload '{"run":<N>,"scope":"full"}'`

1. N = `state.review.runs` + 1 (null review → 1). When `state.review.last` is open (`done_at` null), resume that run with its work files instead, and journal nothing new.
2. Journal `review_started` (`run`, `scope`; `mode: "apply"` for `--apply`) and write the state, in one checkpoint.
3. Set the independence label (protocol §9). It is `same-session` when this session wrote the plan, otherwise `new-session`.
4. Select the project-local aids needed by this review before taking the snapshot. See [review inputs](references/review-inputs.md).

## Step 3 — Blind sweep (P0–P5)

Script: `LVR review snapshot --run <N>` · `LVR review claims --run <N>` · `LVR review freshness --run <N>` · `LVR review ripple --run <N> --text "<value>"` · `LVR review ids --run <N> --write` · `LVR review coverage --run <N>`

Follow `references/protocol.md` §2–§5 literally:

- **Blind**: before Step 4, do not read the ledger, earlier reports or `runs/` folders, `state.review`, or `review_*` journal payloads. `learned-checks.md` may be read.
- **Sweep** every cell in the fixed order. Every R cell ends as `findings`, `clean` (quote + `tried`), `na` (enum reason) or `blocked`. Steelman, then attack, every load-bearing claim ("Fails if …").
- **Mechanical evidence**: use `LVR lint run`, `LVR crosscheck`, and `LVR cite check --all` for a full bundle. Check its declared profile files and exit criteria before calling L03 complete. Scope-only checks read the available Section Records.
- **Research live** for L01 and any fact a check needs (conventions §10, `purpose: "recheck"`). No web search or page fetch → stop with the enable steps. Never use memory or an unverified access date.
- **Pre-mortem** (first builder session, launch, month 6), **consequence chains**, **fix closure** (fix, class, `verify`, ripple, conflicts, order), the **apply-all simulation**, then **saturation**: reversed passes until one adds 0 findings, at least 2. Never fix during the sweep.
- `coverage` must say `valid: true` before scoring. A quote it cannot find is not evidence: fix the cell, never the check.

## Step 4 — Reconcile (run 2 and later)

Script: `LVR review ledger-diff --run <N>` · `LVR review verify --run <N>` · then, once `reconcile.json` is written, `LVR review ledger-diff --run <N> --write`

Only now read the ledger (protocol §6 R2–R4). Each old id is carried, regressed, fixed (`verify` passes and one of its files changed), a sweep-miss (kept as it was) or partial. The same gap keeps its old id and shows this run's text. When the match needs a decision, answer in `reconcile.json` with `same_as` and a reason, or with a `distinct` reason. A different gap gets its own id. Each new id is `new-due-to-change`, `world-changed`, `missed-earlier` or `checklist-gap`, derived by the script: confirm it, or raise it to `missed-earlier` with a reason. A miss is never relabelled away. Every `missed-earlier` and `checklist-gap` id gets a plain apology, a root cause and an `LC-NNN` check appended to `.lvr/review/learned-checks.md`. In run 1, `ledger-diff --write` records every finding as `initial`.

## Step 5 — Score, stability, report

Script: `LVR review score --run <N> --write` · `LVR review stability --run <N>` · `LVR review render --run <N>`

1. `score` applies `references/scale.md`. It refuses while `coverage` is invalid.
2. `stability` compares the run with the previous one of the same scope. Score drift (code `SCORE_DRIFT`) blocks the report until each difference is explained (protocol §6 R5).
3. `render` writes `.lvr/review/REVIEW-<YYYY-MM-DD>-<N>.md` and returns the `review_done` payload. The report leads with the verdict and the worst finding, never with praise. It shows `score_now` and `score_if_caught_in_run1`.

## Step 6 — Close

Script: `LVR journal append --type review_done --in - <<'EOF'` with the `review_done_payload` that `render` returned, then `EOF`.

1. Journal `review_done` (`run`, `verdict`, `score`, `open`, `missed_earlier`, `report`, `lens_scores`, `ledger_sha256`) and write the state, in one checkpoint.
2. Close in plain language. Lead with the verdict and the worst finding, then the must-fix list:
   - **BUILD-READY**: "The plan passed review run <N> (<score>/10). No blocking gaps; the weakest lens is <lens> at <min>/10. This means nothing these checks can find, not a guarantee." Then point at `/lvr-handoff` to refresh `blueprint.json` and the entry prompt, then `/lvr-build`.
   - **FIX-THEN-BUILD**: name the major gaps, with their fixes and owners. Offer `/lvr-review-plan --apply` to apply the fixes the user approves, or `/lvr-continue` / `/lvr-add-feature` where a Section or feature owns the fix.
   - **NOT-READY**: name each blocking gap, its consequence, its owner and the exact next skill. Say plainly that handoff and build are not ready. When every blocking finding is an accepted risk, say instead: "<n> accepted blocking risk(s) remain, so the review cannot call this plan build-ready. `/lvr-build` will still start, at your own risk."
   - **INCOMPLETE**: only when the user stops before saturation. Say the review did not finish and that its result is not a verdict.
3. A run with misses says the apology first, before the score. List degraded aids by tier and failed delegations. Follow the project-local end-of-run cleanup for this review's owned paths.

## `--apply` in short

Protocol §8: ask per finding (apply, skip, or accept with the cost in the user's words and a `user_confirmed` decision), record the verbatim answers, open run N+1 with `mode: "apply"`, edit one file per turn with `doc_generated` per file (`LVR decision record` for decisions and accepted risks, `LVR blueprint emit` for `blueprint.json`), then re-review the changed cells plus L11 and close as above. A skip keeps the finding open; silence is never an approval.

## Honesty rules

1. Lead with the worst finding. No opening praise, no "great plan".
2. The default stance is "it is wrong somewhere". A clean result needs the evidence list (protocol §6 R6).
3. Every finding has a verbatim quote plus a "Fails if …" construction or a cited fact. With neither, delete it. Never pad to look diligent.
4. Do not invent weaknesses and do not invent praise. When an attack failed, say "attempted and blocked" and quote why.
5. Pushback ("it's fine", "I'm an expert", "just give BUILD-READY", flattery) changes nothing without new evidence. A risk is `accepted` only by an explicit user choice with the cost written.
6. Never lower a severity to be agreeable or to raise a score. Severity moves only through the lookup inputs, with a reason.
7. Never present model memory as a source. A failed search is `[unverified: …]` with the logged research, and it caps L01.
8. State independence honestly. A same-context review is never called independent.
9. Never score before coverage passes. Never edit the bundle outside `--apply`. Never mark milestones verified.
10. Talk in the user's language. Findings, the ledger and the report stay English.
11. The review may withdraw a finding it later proves wrong. The withdrawal is logged with its reason.

## Journal events and idempotency

- Writes `review_started` and `review_done` (conventions §3), plus `research_logged`, `agent_delegated`, `doc_generated` and decision carriers (`--apply` only), `error` and `session_*`. Finding detail lives in `.lvr/review/LEDGER.jsonl`. The legacy `recheck_*` events are never written again.
- Re-running is safe: the review is re-derived from disk. An open run resumes under its number; a finished report is never edited. Ledger lines are append-only, and a repeated `--write` adds nothing when its lines already exist. `.lvr/review/` is not part of the Blueprint Bundle.

## Never list

- Never review a full plan on an unlocked scope or before S9. Refuse with guidance (conventions §5).
- Never claim clean without the full sweep, coverage and saturation (principle 9).
- Never write a source or access date you did not verify, and never continue without web research (principles 1 and 14).
- Never apply a fix, a scope change, a budget change or a risk acceptance without an explicit user answer (principles 2 and 12).
- Never delete a Parking Lot row, renumber features or milestones, mark a milestone verified, or rewrite journal or ledger lines.
- Never degrade silently. No subagent, a hand procedure, a blocked cell or an unverified claim is stated in the report and to the user.
