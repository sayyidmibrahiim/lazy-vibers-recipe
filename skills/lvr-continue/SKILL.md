---
name: lvr-continue
description: Resumes an interrupted, errored, or parked LVR project — rebuilds state.json from the journal when it is damaged, prints a plain progress summary in the user's language, and continues the current Section at the exact micro-batch boundary without re-asking any recorded answer. Use when the user wants to continue an existing LVR project (cwd or a given path), or after a crashed session, a context-guard stop, or a model change. Refuses with Folder Gate guidance when the target folder holds no LVR project.
---

# lvr-continue

The resume skill of the LVR pipeline. It picks up any interrupted or parked LVR project exactly where disk says it stopped: damaged state is rebuilt from the journal, progress is reported in plain language, and the right next action is offered. It is self-contained — everything it needs lives in this skill folder. Interview Sections resume into the `lvr-init-new-idea` skill's Section procedures when that skill is installed; without it, this skill still works in a loudly degraded mode (the fallback in Step 5b). LVR skills degrade loudly, never silently.

## Load first

Before any check, question, or file write:

1. Read `references/principles.md` (the Constitution). All 14 principles bind this skill — especially 10 (State discipline), 13 (Disk is memory), and 14 (Research what the user doesn't know).
2. Read `references/conventions.md` (the operational manual). It owns the state schema (§2), journal event list (§3), Section map (§5), Folder Gate (§6), and tier tables (§7); the steps below reference it instead of repeating it.
3. Interact in the user's language from the first message. The messages below are the English source; translate them when speaking. Artifacts and stored values follow the conventions (English source of truth).
4. **Script helper (preferred when Node is available).** This skill ships `scripts/lvr.mjs` (Node ≥22, nothing to install). `<skill-dir>` = the folder holding this SKILL.md (use the base directory the harness reports; otherwise look for `lvr-<this-skill>/scripts/lvr.mjs` in the skills directories listed in INSTALL.md). Once per session run `node "<skill-dir>/scripts/lvr.mjs" version`. If it prints JSON with `"lvr_schema":2`, run the `Script:` command given at each step below (`LVR` = `node "<skill-dir>/scripts/lvr.mjs" --dir "<PROJECT_DIR>"`) and act on its JSON. **Preflight (every skill except /lvr-init-new-idea):** run `LVR state migrate --check`. If `needed` and `blocked` is null, run `LVR state migrate` and tell the user in one plain line (English source): "This project was made with an older LVR version. I updated its bookkeeping files to the new format; the old files are kept in `.lvr/migrations/`." (If `copied_from` is `.lvp`, ask once whether to remove the old `.lvp/` folder, default keep; on yes run `LVR state migrate --remove-legacy`.) If `blocked` is set, /lvr-continue follows its recovery for `blocked.code`; every other skill stops and recommends /lvr-continue. If any command answers `SCHEMA_TOO_NEW` (exit 1), the project was made by a newer LVR: change nothing and tell the user to update all LVR skills together. **Session:** after the preflight (init: in its Step 1) append `session_start` with `{"skill":"<this skill>","harness":"<harness id>","session_id":"<id the harness exposes>" or null with "session_id_reason":"<why>","model":"<model id>","cwd":"<cwd>"}` — never invent an id — and at every exit append `session_end` with `{"reason":"done|paused|context_guard|error|cancelled","note":"<why>"}` (`note` is required for `cancelled`, which is how a refusal is recorded; `error` is journaled only after an unrecoverable failure left work half-done, never for a refusal). If `node` is missing, the command cannot start, or `lvr_schema` differs, say once (English source): "Node.js is not available here, so I'll do the bookkeeping by hand." Then follow each step's prose — the prose is the fallback and stays authoritative for behavior. Never hand-edit `.lvr/` files to work around a script error (`"ok":false`): report its `code` plainly and stop that step. On any non-zero exit (`"ok":false`) stop the step, show the error and follow `error.details.hint`; exit code 3 means the event was journaled (`journaled_seq`) or blocked but `state.json` was NOT updated (`STATE_LAGS`, `STATE_MISSING`, `STATE_INVALID`, `STATE_SEQ_UNKNOWN`, `JOURNAL_BEHIND_STATE`): do not continue the interview, run `/lvr-continue` (its Step 2 maps each code to the exact command). Pass long text through `--in -` with a quoted heredoc (`<<'EOF'`) or a PowerShell here-string (`@'…'@ |`), never inline in double quotes.

## Flow at a glance

1. **Locate** the project (path argument or cwd).
2. **Load or rebuild** the state (journal replay when damaged).
3. **Tier check** — cross-model resume rules.
4. **Progress summary** — plain language, User Language.
4b. **Web research check** — before any Section or compile work; no web → explain how to enable it and stop.
5. **Offer the right next action** and, on confirmation, resume into it (a missing or partial Domain Brief and the current Section's scan come first).

Every step is idempotent: re-running `/lvr-continue` is always safe.

## Step 1 — Locate the project

Script: `LVR journal check` (healthy journal? `scope_locked_seq`; `state_sync` = `in_sync`, `untracked`, `lagging`, `unknown` or `journal_behind_state`) and `LVR state validate` (`"valid"`, `errors`, `warnings`).

`TARGET` = the optional path argument, else cwd. Look for `TARGET/.lvr/`.

- **No `.lvr/` but a legacy `.lvp/` folder holding `state.json` or `journal.ndjson`** → this is a project from an older LVR (the pre-rename folder name), not an empty folder: continue at Step 2, where `LVR state migrate` copies it to `.lvr/` (the `.lvp/` folder is never renamed or deleted without the user's yes).
- **No `.lvr/` (and no such `.lvp/`)** → say (English source): "There is no LVR project here. To start one, run `/lvr-init-new-idea` in an empty folder — or let its Folder Gate create a subfolder in a projects root. It will pick the right place." Nothing is written to disk (there is no journal here to record the refusal). Stop.
- **`.lvr/` exists but holds neither a readable `state.json` nor `journal.ndjson`** → same guidance, plus the loud warning (English source): "A `.lvr/` folder exists here, but it holds neither a readable state file nor a journal, so there is nothing to rebuild from." Treat as no project. Stop.
- Otherwise continue at Step 2.

## Step 2 — Load or rebuild the state

Script: when a write exited 3, or `LVR journal check` shows `state_sync` other than `in_sync`/`untracked`, recover first (`LVR` as in the Script helper; show the user the error in plain words, then run exactly the command for its `code`):

- `STATE_MISSING` or `STATE_INVALID` → `LVR replay --write` (a damaged file is backed up first; add `--journal-resume '{"position":"…"}'` to journal the resume).
- `STATE_LAGS`, `STATE_SEQ_UNKNOWN` (or `state_sync` `lagging`/`unknown`) → first `LVR replay --compare` and read the `diff`. Only if nothing in `current` would be lost (the rebuild is simply newer), or the journal was written entirely by the script (`report.derived.journal_kind` = `cli`), run `LVR replay --write --force`. `LOSSY_REPLAY` lists values that would be dropped: show those paths to the user and add `--accept-loss` only after they agree. If they decline, stop: nothing was written and `state.json` stays as it is (never use `journal restore-from-state` for this).
- `JOURNAL_BEHIND_STATE` (nothing was written) → `LVR journal restore-from-state`, then `LVR journal check` must show `in_sync` (it only runs when the journal is behind `state.json`; `RESTORE_NOT_NEEDED` means `state.json` is not ahead of the journal, so use the `replay` route above instead); continue with `LVR journal append --type resume --payload '{"state_rebuilt":true}'`.
- `MIGRATION_NEEDED` (nothing was written) → `LVR state migrate --check`: `needed` and not `blocked` → `LVR state migrate`; `blocked.code` `MIGRATION_BLOCKED` → by `state_sync` (`lagging`/`unknown`: the `STATE_LAGS` route above, whose `replay --write` writes the new format); `STATE_UNREADABLE`/`STATE_INVALID`/`STATE_MISSING` → `LVR replay --write` (writes the new format); `NO_JOURNAL` or `JOURNAL_BEHIND_STATE` → `LVR journal restore-from-state`, then `LVR state migrate`; `LEGACY_CONFLICT` → tell the user `.lvr/` holds other files and stop. After a migration from `.lvp/`, ask once whether to remove the old folder (default keep; yes → `LVR state migrate --remove-legacy`).
- `SCHEMA_TOO_NEW` (exit 1) → the project was made by a newer LVR: change nothing; tell the user to update all LVR skills together and stop.
- After any recovery re-run `LVR state validate`; never hand-edit `.lvr/.state-seq` or the journal.

### 2a. Healthy state

Script: `LVR state validate`: `"valid":true` means healthy — list its `warnings` in the summary. A repair is `LVR state write --no-journal --in -` (full corrected document) riding this run's `resume` append.

`state.json` parses and matches the conventions §2 shape → load it, then run the consistency repairs:

- Section statuses win over `pipeline.current_section`. If they disagree, fix `current_section` (the first Section not `done`, in conventions §5 order — it stays S9 when S0–S9 are all done; S10 Build is tracked by `project.status`, never as a pointer) and say so in the summary.
- An answer present in a Section Record file but missing from state is folded back in from the record (records are raw material — never re-ask what a record holds). Say so in the summary.
- Scope lock has no v1 state field — derive it per the conventions §5 definition (a `scope_locked` event exists **and** S7 is `done`). Do this here and in Step 5; do not invent a schema field.

The repair state-write rides the run's `resume` append (one checkpoint at resume) — conventions §3's "every state mutation emits at least one event" holds under this named interpretation.

### 2b. Damaged or missing state, journal present → rebuild by journal replay

Script: `LVR replay --write --journal-resume '{"position":"…"}'` — it rebuilds `state.json` (backing up a damaged one once), appends `resume`, and returns `report` (untranslatable events, `answers.text_missing`, `decisions`, `milestones`, `unrecoverable`) for the reconstruction report. Use `LVR replay --compare` for a dry run.

Replay the whole journal in `seq` order onto a fresh state object (shape per conventions §2). Event effects:

| Journal event | Effect on the rebuilt state |
|---|---|
| `session_start`, `folder_gate_passed`, `folder_gate_subfolder_created` | project confirmed here; keep payload details for the report |
| `folder_gate_rejected` | informational — the gate refused a folder before this project existed |
| `tier_declared`, `tier_changed` | `model_profile.tier` (+ `declared_at`); `probe` comes from the probe events (`capability_probe_passed`/`capability_probe_failed`) when present; a declared T1 with no probe events rebuilds as `skipped` (conventions §7: the probe is mandatory for T2/T3 and skipped for a declared T1) |
| `capability_probe_passed`, `capability_probe_failed` | `model_profile.probe` |
| `booster_check`, `booster_install_ok`, `booster_install_failed`, `booster_choice` | `boosters` statuses — the last journaled event per booster wins; a journaled `present` maps to `installed` (the only enum-legal mapping); bundle documents (`OVERVIEW.md` Limitations, `CAPABILITIES.md`) may add a loud context note to the reconstruction report but never override a journaled status; the `booster_check` sweep names the core list (bootstrap checks every core booster); `license`/`tier` are static per-booster facts — from `CAPABILITIES.md` when the bundle exists, else the core-booster table in the `lvr-init-new-idea` skill (Step 3; `scripts/lvr.mjs` embeds the same table); when neither is available keep `license` null and flag it in the report; a core booster never mentioned → `missing`, flagged in the report |
| `section_start` | `sections[S] = { "status": "in_progress", "started_at": ... }`; `current_section` = S |
| `answer_recorded` | `sections[S].answers[<id>] = { q, a, skipped }` — q/a verbatim from the payload when it carries the text; a legacy payload without q/a text folds q/a from the answer's own Section Record line; `project` metadata: `slug`, `idea_raw`, `user_language` come from the S0 section record (verbatim idea, confirmed language, confirmed slug); the display `name` is the bundle's `OVERVIEW.md` H1 when the bundle exists (compiled at S9, post-branding), stripped of the ` — plain-language overview` suffix of the templates heading (`# <Display name> — plain-language overview`, `lvr-init-new-idea/references/bundle/templates.md` §2); a bundle present without `OVERVIEW.md` falls back to the S0 record's display name, reported loudly (same as the no-bundle case); `created_at` = the ts of the `section_start` S0 event |
| `section_done` | `sections[S] = { "status": "done", "record": ..., "completed_at": ... }`; `current_section` = the next Section in conventions §5 order; `section_done` S9 leaves it at S9 (no S10 pointer) |
| `section_blocked` | `sections[S].status` = "blocked"; `current_section` = S; the payload's `unmet` criteria go into the reconstruction report (the Section Record holds them too) |
| `section_start` S5, `section_start` S7, `section_done` S9, `build_started`, `build_done` | `project.status` transitions (conventions §2 enum): the fresh state starts at `interview`; S5 start → `researching`, S7 start → `review`, S9 done → `bundled`, `build_started` → `building` (builder active), `build_done` → `complete` |
| `loop_back_opened` | append the entry to `pipeline.loop_backs` (`resolved_at: null`) |
| `loop_back_closed` | set `resolved_at` on the matching entry |
| `scope_locked` | scope-lock evidence (no v1 schema field — see below) |
| `milestone_verified` | set `milestones[<id>].verified = true` + `verified_at` from the payload |
| `deployment_verified` | `deployment = { "status": "live", "url", "verified_at" }` from the payload |
| `build_started`, `milestone_started`, `milestone_failed`, `build_blocked`, `build_done` | informational apart from the status transitions in the row above — verified milestones come from `milestone_verified` |
| `recheck_*` (legacy, from /lvr-recheck-plan before its rename to /lvr-review-plan), `feature_*` (including `impact_analysis`), `brand_*` | informational — the report and bundle files on disk own the detail; a payload's `decisions[]` / `milestones[]` are still folded in (conventions §3) |
| `doc_generated` | bundle-file progress (compare against the conventions §8 list); a 0-byte file counts as missing required structure and is reported wherever it is found (rebuild report, progress summary, Step 5c offer), never as existing-and-skipped |
| `handoff_started`, `gap_found`, `handoff_done` | handoff progress; `handoff_done` fills `handoff` = { "status": "done", "completed_at" } |
| `error` | `project.status` = "error" and `project.error` = `{seq, ts, skill, step, message, previous_status}` (a second `error` keeps the first `previous_status`); the next restoring event clears it and, when it is a `session_start`, stores the detail in that session's `recovered_error` |
| `resume`, and the opening events `session_start`, `handoff_started`, `review_started` (legacy `recheck_started`), `feature_started`, `brand_started` | restore the status remembered at the last `error` (conventions §2); otherwise no state effect (`section_start`, `section_done`, `section_blocked`, `answer_recorded` restore it too, before their own effect) |
| `context_guard_triggered`, `truncation_recovered` | informational — no state effect |
| `session_start`, `session_end` | `sessions[]`: `session_start` appends an entry (skill, harness, `session_id` or its reason, model, tier, cwd, `started_at`); `session_end` closes the open one (`ended_at`, `end_reason`, `end_note`). The current session is the last entry with `ended_at` null; the Sections, delegations and boosters of later events are attributed to it (conventions §2) |
| `booster_installed`, `booster_uninstalled`, `agent_delegated`, `framework_selected`, `review_started`, `review_done`, `release_checked`, `schema_migrated` | the v2 fields `boosters.installed[]`, `agents_delegated[]`, `framework_decision`, `review`, `release_check`; `schema_migrated` has no state effect (conventions §2 and §3 list each payload) |
| a payload's `product` / `coverage` | `product` (types, flags, status, source, rationale, confirmed) and `pipeline.sections.<S>.coverage` are folded in like `decisions[]` |
| `research_logged`, `context_research` | `pipeline.research` index only: `web_check` (the last `purpose: "web_check"` entry), `brief`/`scans` (RQ ids and U-ids), `log` (count, failed ids, last id/time); the Domain Brief file and the Section Records hold the findings (a `context_research` with scope `scan` marks that Section's scan as done) |

Three things the journal cannot supply directly:

- **Scope lock** — the v1 schema has no scope field. Scope is locked per the conventions §5 definition: a `scope_locked` event exists in the journal **and** S7 is done. Derive it; do not invent a schema field.
- **Milestones** — no event type is dedicated to them; payload `milestones[]` (S8 `section_done`, `feature_applied`) are folded in when present. Milestones the events did not carry: from `MILESTONES.md` when the bundle exists (it also holds the milestones `/lvr-add-feature` appended after the lock, which no record holds), else — S8 done — from the Section Record `.lvr/docs/sections/S8-milestones.md`. Apply `milestone_verified` after this rebuild. If S8 is done and neither source holds a milestone, milestones are reported as unrecoverable.
- **Decisions** — no event type is dedicated to them either; payload `decisions[]` are folded in when present. The rest: from `DECISIONS.md` when the bundle exists — the mirror is compiled at S9 from the post-loop-back records, so its wording is the freshest; rows are never rewritten after S9 (conventions §8) — else from the decision lines in the Section Records; ids and statuses are the same in both sources. Then add the decision lines in `.lvr/docs/sections/S4-additions.md` (post-lock decisions from `/lvr-add-feature`, section `S4`) that neither source holds yet. A decision missing from every source is reported as unrecoverable (loudly).

An `answer_recorded` whose payload text is absent or unreadable, and whose Section Record does not hold it either, is reported as unrecoverable — ask the user to re-state only that one, saying plainly why (loud degradation, not a silent re-ask).

Then:

1. Write the rebuilt `state.json` (one checkpoint). Before writing it, the corrupt file MAY be preserved once as `.lvr/state.corrupt-<date>.json`; when present, name it in the reconstruction report. The backup is not part of the canonical write set. Never touch existing journal lines.
2. Report plainly (User Language): what was reconstructed (Sections and statuses, answer counts, decisions, loop-backs, milestones, tier), everything derived indirectly (scope from the journal event, milestones from MILESTONES.md or the S8 record; decisions from DECISIONS.md or the Section Records, plus S4-additions.md), and every event that could not be translated, by `seq`.
3. Journal `resume` (payload: `state_rebuilt: true` + the untranslatable count).

## Step 3 — Tier check (cross-model resume)

Script: `LVR journal append --type tier_changed --payload '{"old":"T1","new":"T2"}'`; probes via `LVR probe grade …` then `LVR journal append --type capability_probe_passed|capability_probe_failed` (see the init skill, Step 2).

Compare `model_profile.tier` in state with the model actually running now:

- Determine the current tier from harness config where available; if not determinable, ask init's one-line tier question (large / medium / small). Never guess.
- Same tier → nothing to do.
- Any change → journal `tier_changed` (payload: old, new), update `model_profile.tier` + `declared_at`, and re-apply the new tier's rules for the resumed work (conventions §7: batch size, research, compile, reload discipline, booster loading).
- **Downgrade** (new tier is lower) → warn first, in User Language (English source): "The model now running is smaller than before, so the capability probe runs again — if it fails, I have to refuse to continue; nothing is lost, the project state stays safe on disk." Then re-run the capability probe before any further work. Three checks, graded strictly, each a clean single attempt:
  1. **Strict JSON** — Prompt: `Return exactly this JSON object, nothing else, with ANSWER replaced by the value of 7×6: {"probe":"json","answer":ANSWER}`. Pass: the reply parses as exactly that object (surrounding whitespace tolerated; no prose, no code fences) with `answer` = 42.
  2. **Three-step order** — Prompt: `Do these steps in order and output only their results, one per line: 1. write the word ALPHA. 2. write the number 2. 3. write GAMMA backwards.` Pass: the reply contains ALPHA, 2, AGMA — in that order.
  3. **Sentence continuation** — Prompt: `Continue this sentence so it makes sense, and write only the continuation: "The cashier scanned the item twice because"`. Pass: a coherent, grammatical completion (no restart, no topic change, no gibberish).
  - All pass → journal `capability_probe_passed` (payload: `{"steps": [...]}` — the ids of the checks that passed: "json", "order", "sentence"), update `model_profile.probe`, continue.
  - Any fail → journal `capability_probe_failed` (payload: which step). Say (English source): "This model failed the capability probe (\<step\>), so it cannot finish what the previous model started. Switch this harness to a larger model, then run `/lvr-continue` again. Nothing is lost — the project state is safe on disk." Stop. Never push through.
- Upgrade → no probe when `model_profile.probe` is `passed` (the upgrade keeps that pass); `tier_changed` only. If the probe is not `passed` (an earlier probe failed, or none ran) and the new tier is T2/T3, run the probe as for a downgrade (conventions §7).

## Step 4 — Progress summary

Script: read the numbers with `LVR state get --pointer /pipeline/sections` and `LVR journal tail --n 5`.

Print it in the user's language, plain and non-technical — the owner must understand it without pipeline vocabulary:

- **Project**: name (slug) + one line of what it is, from the S0 record's English summary, translated.
- **Position**: which Sections are done (compact: "S0–S3 finished"), the current Section, and its purpose in one plain line (conventions §5 purpose column, translated).
- **Answers**: N recorded, M skipped in total (plus the current Section's count). Skipped answers are named as consciously skipped, never as missing.
- **Open loop-backs**: each `L-NN` with its target Section and reason, or "none".
- **Boosters**: count installed; name every core booster whose status is `degraded`, `failed`, or `missing` — loudly, with its consequence (output quality drops; S9 will surface it in OVERVIEW.md).
- **Last activity**: the journal's last line timestamp, phrased plainly.
- **Model tier**: the stored tier, the current tier, and any change Step 3 just applied.
- **Degraded-mode line** (only when Step 5b's fallback applies): "The lvr-init-new-idea skill is not installed here, so interview questions come from a simpler fallback. Install it for full interview support."

Journal `resume` (payload: position + tier-check result) before offering actions, if not already appended in Step 2.

## Step 4b — Web research check

Runs when the next action is Section work or the S9 compile (Step 5b or 5c) — every tier, every run: the harness may have changed since the last session. Same check as the init skill's Step 1 (conventions §7 and §10): one real search with a neutral query that is not about the user's idea, then fetch result pages one at a time, up to 3 different results; pass = a result URL and readable text from at least one page (one site's 403 or login wall is not a failure — take the next result). A tool error that appears later, inside Section work, is an outage, not failed research (conventions §10): stop here the same way and resume through this step.

- Pass → journal `research_logged` (`section` = the current Section, `purpose` "web_check", `outcome` "found").
- Fail → journal it with `outcome` "failed" and the `reason`, then say (English source): "I can't do web research in this session (\<cause\>). LVR never continues from memory, so I'm stopping here — your project is safe on disk, nothing changed." Add the enable steps from conventions §10 for this harness (Claude Code, Codex CLI, Gemini CLI, OpenCode, or a web search + fetch MCP server), then: "Run `/lvr-continue` again once web research works." Stop. Status reporting (Step 4) and handoff guidance (5d, 5e) need no web.
- Script: `LVR research log --in -` with `{"section":"<S>","purpose":"web_check","topic":"web research check","queries":["<query>","fetch <url>"],"sources":[…],"outcome":"found"}` (failed: `"sources":[]`, `"outcome":"failed"`, `"reason":"…"`).

## Step 5 — Offer the right next action

Pick ONE primary offer from the state; act on the user's confirmation.

### a. This run recovered from an `error`

Every run opens with `session_start`, and that event restores the status that was current before the error (conventions §2), so `project.status` is no longer "error" by Step 5 and must not be used to decide this. Decide it from the session this run opened: Script: `LVR state get --pointer /sessions/-1/recovered_error` (`-1` = the last session). When `found` and the value is not null (`{seq, skill, step, message}`), the previous run stopped on an error: report it in plain words (the failed `step` and `message`) and offer to retry that step. Retry is idempotent: done Sections and recorded answers are never redone. This works on the healthy path and on the rebuild path (2b), because replay rebuilds `recovered_error` from the journal (`error` followed by this run's `session_start`). If the value is null, the previous run did not end on an error: take the next branch. Without the script (prose fallback): take this branch when the journal's last `error` event is followed by no restoring event (`session_start`, `resume`, the opening events, `section_*`, `answer_recorded`) before **this run's** `session_start`.

### b. Interviewing (status `interview`, `researching`, or `review`; the current Section S0–S8 is not done)

Script: the same commands as the init skill's Section loop engine: `LVR answer record`, `LVR decision record`, `LVR journal append --type section_done|section_blocked|loop_back_closed`.

Order of offers:

1. **Open loop-backs exist** → offer to answer them first (the S6 return path): ask the targeted questions in the affected earlier Section (S1–S4), close each entry with `loop_back_closed` + one checkpoint when resolved, then return to S6.
2. **Research first** (principle 14), before composing any batch:
   - S0 is `done` and `.lvr/docs/research/domain-brief.md` is missing (a project started before the brief existed, or a session that died) or says `Status: in progress` → build or finish it now: the init skill's Step 4 step 8 and `references/sections/S0-domain-brief.md` §1 and §4 — continue at the first heading with no rows; never redo a logged step.
   - The current Section (S1–S8) has no `context_research` event with scope `scan` for it → run the init engine's step 1b (brief freshness gate first in S1–S5, then the scan, then "Things you may not know") before the next batch. Items already shown keep their `Became` cells.
   - Init skill not installed → do both from conventions §10 directly (it holds the brief's columns, the scan rules, and the cite syntax).
3. **Otherwise resume the current Section** at the exact micro-batch boundary:
   - **Load the Section's procedure** per the tier's reload discipline (conventions §7). Find it in this order: (1) the installed `lvr-init-new-idea` skill — check the harness skill list, then known skills directories (`~/.claude/skills/`, `<cwd>/.claude/skills/`, `~/.agents/skills/`), then an `lvr-init-new-idea/` folder beside this skill — and use its `### S<NN>` procedure block plus its `references/sections/` bank files; (2) not found, or the procedure block is missing → **degraded fallback, loudly**:
     - Reload `state.json` + the current Section Record.
     - Re-derive the next micro-batch from the Section's **exit criteria** (conventions §5): every not-yet-satisfied criterion becomes one targeted question, composed from the recorded answers, phrased in User Language with a one-line reason it matters. Use bank files if present; otherwise the model's own interview judgment.
     - Say plainly (English source): "The lvr-init-new-idea skill is not installed here, so my questions for this part come from a simpler fallback. Install it for full interview support." Write `Booster: init skill procedures (degraded — fallback questions used)` into the Section Record so S9 surfaces it in OVERVIEW.md.
     - Always still available without it: answering pending loop-backs, handoff guidance (5c–5e), status reporting.
   - **Compose the batch from recorded answers**: check `sections.<S>.answers` (and the record) before composing every batch. NEVER re-ask anything recorded or skipped. Batch size per the current tier (T1 up to 3, T2 up to 2, T3 exactly 1). Keep both controls visible: **skip** (recorded, never blocks) and **"cukup" / that's enough for this Section** (jump to the exit-criteria check).
   - **All exit criteria already satisfied but the Section is not done** (the session died between the check and the `section_done` write) → ask nothing: write the record, close the Section (`section_done`), continue to the next Section.
   - From the first new answer onward, follow the init skill's Section loop engine (its "Section loop engine" section): one checkpoint per answer, the same record shape, decisions `D-NNN` with statuses per principle 12.
   - **S0 special case**: `S0.q1` not recorded → the idea was never captured; run the S0 capture fresh (nothing is being re-asked). Recorded → continue at the language, slug, and market confirmation steps that are not yet recorded, then close S0 and build the Domain Brief.

### c. Scope locked, S9 not `done` (bundle absent, partial, or fully written but S9 unclosed)

Offer to finish generation (S9). First the freshness re-check: `LVR cite check --all`; research every expired fact again and update the records that hold it, so nothing is compiled stale. Then the remaining files per the conventions §8 list, one file per turn (T3: one file section per turn, append-chunks), `doc_generated` + one checkpoint per file. Existing bundle files are skipped; a 0-byte file, or a file missing the structure conventions §8 requires, counts as *missing required structure* — it is offered as remaining work (the same class as truncation recovery, conventions §7), never as existing-and-skipped. Regenerating one happens only on an explicit per-file user request. When no file is missing, the remaining work is closing S9 (`section_done` + one checkpoint).

### d. Bundled (S9 done, `handoff` open)

Offer `/lvr-handoff` — its precondition (S1–S8 done + scope locked) is met. If a handoff started but never finished, offer to re-run it there (it re-lints instead of regenerating). If that skill is not installed in this harness, say so and point to it; do not improvise the handoff inside this skill.

### e. Bundled (`handoff` done), building, or complete

Offer the next skill: `/lvr-build` (execute the next unverified milestone), `/lvr-add-feature` (a new feature through a mini-pipeline), or `/lvr-review-plan` (a critical review of the plan: 15 lenses, a score and a verdict). They are separate skills — point at them; do not improvise them here. When every milestone is verified and `state.deployment.status` = "live", also point at `/lvr-personal-brand`.

## Idempotency

- Sections marked `done` are never re-run.
- Recorded or skipped answers are never re-asked.
- Bundle regeneration is explicit and per-file only.
- Re-running `/lvr-continue` is always safe: it reloads from disk and offers the next action.

## Checkpoint discipline

Same as init (conventions §9): one journal write + one state write together, at event boundaries. This skill appends `resume` on every run, `tier_changed` + probe events on a tier change, the web research check (`research_logged`), and everything the resumed work emits (`answer_recorded`, `section_start`/`section_done`, `context_research`, `research_logged`, `loop_back_closed`, `doc_generated`, `scope_locked`, `error`, …). The journal is append-only: never rewrite, reorder, or delete lines.

## Never list

- Never re-ask a recorded or skipped answer — check `sections.<S>.answers` and the record before composing every batch. (Principle 10)
- Never re-run a `done` Section.
- Never generate any Blueprint Bundle file before scope lock, and never skip ahead of the Section order except through S6 loop-backs. (Conventions §5)
- Never rewrite or reorder journal lines — append only. (Conventions §3)
- Never degrade silently: a missing init skill, an untranslatable journal event, an unrecoverable answer, a guessed tier — all said aloud, in User Language.
- Never push through a failed capability probe — refuse; the state on disk is safe. (Conventions §7)
- Never continue Section work or the compile without web research, and never fill a research gap from memory — explain how to enable web tools and stop. (Principle 14)
