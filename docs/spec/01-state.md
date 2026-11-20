# Spec 01 — State, Folders, Checkpoints

All paths are relative to the **project folder** (created by `/lvr-init-new-idea`, see Folder Gate). One folder = one idea = one product.

## `.lvr/` layout

```
<project-folder>/
├── .lvr/
│   ├── state.json          authoritative snapshot (rewritable)
│   ├── journal.ndjson      append-only event log (never rewritten)
│   ├── docs/
│   │   ├── sections/       section records: S0-intake.md, S1-context.md, ...
│   │   └── research/       domain-brief.md: the Domain Brief + per-Section scan items (spec 07)
│   └── recheck/            recheck reports: RECHECK-<date>.md (audit artifacts)
├── (after S9: bundle files + builder code live here)
├── HANDOFF-PROMPT.md       builder entry prompt from /lvr-handoff (side artifact, never part of the bundle)
└── brand/                  personal-brand kit from /lvr-personal-brand (never part of the bundle)
```

`state.json` is the source of truth for "where are we". `journal.ndjson` is the audit trail; if `state.json` is corrupted or missing, it is rebuilt by replaying the journal. Section records are the raw material compiled by S9.

## `state.json` schema (v1)

```jsonc
{
  "schema_version": 1,
  "project": {
    "slug": "warung-cashier",            // kebab-case, folder name
    "name": "Warung Cashier",            // display name (locked at S1)
    "idea_raw": "...",                   // verbatim user input, User Language
    "user_language": "id",               // detected at S0, user-correctable
    "created_at": "2026-11-08T09:00:00Z",
    "status": "interview"                // see status enum
  },
  "pipeline": {
    "current_section": "S4",
    "sections": {
      "S0": { "status": "done", "record": "S0-intake.md",
              "started_at": "...", "completed_at": "...",
              "answers": { "S0.q1": { "q": "...", "a": "...", "skipped": false } } },
      "S1": { "status": "in_progress" }  // pending | in_progress | done | blocked
    },
    "loop_backs": [
      { "id": "L-01", "from": "S6", "to": "S3", "reason": "research found cost conflict",
        "opened_at": "...", "resolved_at": null }
    ]
  },
  "decisions": [
    { "id": "D-001", "section": "S2", "summary": "Deploy on VPS user already owns",
      "rationale": "owner pays nothing extra", "status": "user_confirmed" }
    // status: user_confirmed | assumed | designer_filled
    //   assumed         = asked, user skipped/deferred
    //   designer_filled = never surfaced — the user couldn't have known to ask
    // assumed + designer_filled => also listed in ASSUMPTIONS.md
  ],
  "boosters": {
    "core": [
      { "name": "simple-english", "repo": "AminBlg/SimpleEnglish",
        "license": "MIT", "tier": "core", "status": "installed" }
      // status: installed | missing | failed | degraded
    ],
    "enhancer": [ /* same shape */ ]
  },
  "model_profile": { "tier": "T1", "probe": "skipped", "declared_at": "..." },
  // tier: T1 | T2 | T3 — rules in docs/spec/06-model-tiers.md
  // probe: "passed" | "skipped" (T1 skips the probe) | "failed"
  "milestones": [                          // filled at S8
    { "id": "M0", "goal": "...", "features": ["F-01"],
      "verified": false, "verified_at": null }   // verified by /lvr-build
  ],
  "deployment": null,                      // { status: "live|pending", url, verified_at }
  "handoff": null                          // filled at /lvr-handoff: { status: "done", completed_at }
}
```

### Project status enum

`interview` → `researching` (S5–S6) → `review` (S7 start until S9 done) → `bundled` (S9 done) → `building` (builder active) → `complete` · `error` (with `error` entry in journal; recoverable via `/lvr-continue`).

Who sets it: S0 start → `interview`; `section_start` S5 → `researching`; `section_start` S7 → `review`; `section_done` S9 → `bundled`; `/lvr-build` writes `building` at `build_started` and `complete` at `build_done` (a later `build_started`, e.g. after `/lvr-add-feature` appended a milestone, sets `building` again).

**`error`.** Any skill journals `error` (payload: `skill`, `step`, plain `message`) when an unrecoverable failure stops its run with work half-done — a file it cannot write, a tool that crashes mid-step. Not for refusals (nothing was written), probe failures (`capability_probe_failed`), build failures (`milestone_failed`, `build_blocked`), or context pressure (`context_guard_triggered`). The `error` checkpoint sets `project.status` = `error` and remembers the status before it. The next opening event of any skill run (`resume`, which every `/lvr-continue` run appends, or `session_start`, `handoff_started`, `recheck_started`, `feature_started`, `brand_started`), or the next `section_start`, `section_done`, `section_blocked` or `answer_recorded`, restores that status before applying its own effect. `/lvr-continue` decides its "retry the failed step" offer from the status it loaded, before its own `resume`.

### Section pointer and status

- `current_section` = the first Section in S0…S9 order that is not `done`; once S9 is `done` it stays `"S9"`. S10 (build) is tracked by `project.status` (`building`/`complete`), never by `current_section`. A disagreement is repaired by `/lvr-continue` (section statuses win).
- Section status `blocked`: the user moved on with exit criteria unmet. Journal `section_blocked` (payload: `section`, `unmet` — the list of unmet criteria); the unmet criteria are also written into the Section Record. `current_section` stays on the blocked Section, and it resumes like an `in_progress` one; on a later pass it closes with `section_done`.

### ID conventions

Questions `S<n>.q<n>`, unpadded (`S1.q9`, `S1.q10`) · Features `F-01…` · Decisions `D-001…` · Milestones `M0, M1, …` · Loop-backs `L-01…` · Research log entries `RQ-001…` (assigned by `research log`) · Domain Brief items `U-01…` (one id space for the brief and the per-Section scans)

## `journal.ndjson` event types

Each line: `{"ts": "...", "seq": 1, "type": "...", "payload": { ... }}`

`session_start` · `folder_gate_passed|folder_gate_rejected|folder_gate_subfolder_created` · `tier_declared` · `capability_probe_passed|failed` · `context_guard_triggered` · `truncation_recovered` · `tier_changed` · `booster_check` · `booster_install_ok|failed` · `booster_choice` (user decision on failure) · `section_start|section_done|section_blocked` · `answer_recorded` · `loop_back_opened|closed` · `scope_locked` · `doc_generated` · `handoff_started|gap_found|handoff_done` · `recheck_started|recheck_finding|recheck_research_refresh|recheck_fix_applied|recheck_done` · `feature_started|feature_captured|feature_research|impact_analysis|feature_scope_decision|feature_applied|feature_done` · `build_started|milestone_started|milestone_verified|milestone_failed|build_blocked|deployment_verified|build_done` · `brand_started|brand_file_generated|brand_done` · `error` · `resume` · `research_logged|context_research`

`research_logged` and `context_research` (ticket 26) record every research step: payloads, ids, and the `research log` command are specified in `07-research.md` §5. Both are informational on replay and valid before `state.json` exists. `research log` (or `journal append --type research_logged|context_research`) assigns the id; the script's event list and the conventions "Event types:" line both carry the two types.

Rules: append-only; never rewrite; every state mutation emits at least one event; `answer_recorded` fires **per answer** (checkpoint granularity). Its payload is `{ "section", "answer_id", "q", "a", "skipped" }` — `q` is the question text exactly as asked, `a` the user's verbatim answer, both in User Language; `a` is null when the answer was skipped. Legacy payloads carrying only `{ "section", "answer_id", "skipped" }` remain replayable — rebuilds fold q/a from the Section Record when the payload has no text.

### Payload extensions (replay-complete journals)

Payloads stay free-form objects. `scripts/lvr.mjs` additionally understands these optional keys, so that a journal it wrote replays to exactly the live `state.json` without reading Section Records:

- `project` — as an **object**, on any event (a string `project`, as in `handoff_started`'s project slug, is the prose meaning and is ignored by the reducer): any of `slug`, `name`, `idea_raw`, `user_language` (strings); each present key is assigned to `state.project`. This is how S0 answers and a branding rename reach state.
- `decisions[]` — on any event: full decision objects (`id`, `section`, `summary`, `rationale`, `status`), upserted into `state.decisions` by id at the checkpoint where the decision is made.
- `milestones[]` — on any event (S8 `section_done`, `feature_applied`): `{ "id", "goal", "features" }`, upserted into `state.milestones` (`verified` / `verified_at` are preserved).
- `section_done.record` — the record file name, stored as `sections.<S>.record`.
- `booster_check` — may carry `license` and `tier` (`core|enhancer`) next to `name`, `repo`, `result`.
- `milestone_verified.verified_at` and `deployment_verified.url` — stored as given (`verified_at` defaults to the event `ts`).
- `cli` — the script stamps `"cli":"lvr"` on the payload of **every** event it appends. Stamped events carry every fact in their payloads: replay folds them without reading disk, so a journal made only of stamped events reproduces the live `state.json` exactly. Unstamped events (written by the prose fallback, or older journals) get the disk fallbacks on replay (Section Records, `OVERVIEW.md`, `DECISIONS.md`, `CAPABILITIES.md`, never-mentioned core boosters; the booster fill only when no event is stamped).
- `.lvr/.state-seq` — hidden helper written by the script right after each `state.json` write: the journal `seq` the state reflects (`N`), or `lag:N` once a lag was found (sticky until a recovery command). On a write: equal to the journal tail = in sync; behind by unstamped events only = the prose fallback updated state by hand, so the script adopts it (`state.adopted`); behind by exactly one stamped event = crash heal; otherwise `STATE_LAGS`. Ahead of the journal = `JOURNAL_BEHIND_STATE` (journal lines were lost; every write is blocked until `journal restore-from-state`). `journal restore-from-state` refuses (`RESTORE_NOT_NEEDED`, nothing written) unless `state.json` holds something the journal lacks, and it moves `.state-seq` to the journal tail only when the journal was behind, empty, or already in sync; a lagging or unknown state is fixed with `replay --write --force` instead, which accepts a script-only journal without a `LOSSY_REPLAY` check (the replay is exact by construction). Missing or damaged on a script-created journal = `STATE_SEQ_UNKNOWN`. Absent on a prose-written state = untracked, no heal.
- Exit code 3: the event was journaled (`journaled_seq`) or blocked but `state.json` was not checkpointed; the envelope is `ok:false` with `error.code` and `error.details.hint`.
- `booster_check` from the registry maps registry tier `conditional`/`reference` to state tier `enhancer`.

A rebuild prefers payload data over disk derivation; the Section Records, `OVERVIEW.md`, `DECISIONS.md` and `CAPABILITIES.md` fill only what the events did not carry, and only for unstamped events. For a journal that is not script-only, milestones the events did not carry come from `MILESTONES.md` when the bundle has it (it also holds the milestones `/lvr-add-feature` appended after the lock), then from the S8 record; a `milestone_verified` whose milestone comes from disk is applied after that. Decisions come from `DECISIONS.md` when it exists, else from the Section Records' decision lines, plus the post-lock decision lines in `S4-additions.md` (section `S4`) that neither holds yet.

Every event type above is replayable: an event with no state effect (for example `folder_gate_rejected`, `impact_analysis`, `brand_*`) is informational, never "untranslatable".

## Section records

File: `.lvr/docs/sections/S<N>-<name>.md` (e.g. `S3-data.md`). Content: the section's questions, the user's verbatim answers (User Language), and the section's decision summary (English, written by the Conductor). These are the **only** inputs S9 compiles, plus `decisions[]` and `milestones[]`.

Language rule: records keep answers verbatim in User Language; the Conductor adds an English summary per answer. S9 compiles English documents from the summaries; OVERVIEW.md additionally reflects the verbatim intent.

## Folder Gate (mandatory first step of `/lvr-init-new-idea`)

1. `cwd` contains `.lvr/state.json` → **refuse init**; print progress summary; recommend `/lvr-continue`.
2. `cwd` is empty (ignore OS junk: `.DS_Store`, `Thumbs.db`, `desktop.ini`) → **proceed in place**.
3. `cwd` has project markers (`.git`, `package.json`, `Cargo.toml`, `pubspec.yaml`, `pyproject.toml`, `go.mod`, `.solution`, `*.csproj`, …) and no `.lvr/` → **refuse**: existing project detected. Recommend running init in an empty/new folder; mention `/lvr-recheck-plan` as the generic audit option for that project.
4. `cwd` has ≥1 subdirectory with project markers (e.g. `~/projects/`) → **create subfolder** `./<slug>/` (slug from idea, confirm with user), proceed there; an existing empty `./<slug>/` (junk files aside; left by a run that stopped at the web research check) is reused instead of taking `<slug>-2`. Journal: `folder_gate_subfolder_created`.
5. `cwd` non-empty, no markers (loose files) → **ask the user**: proceed here or create subfolder (recommend subfolder).

Web UI variant: the UI supplies an absolute path via a folder picker; the same checks run before interview start. UI surfaces the gate result as a screen, not a log line.

## Checkpoint & resume semantics

- **Checkpoint moments** (journal write + state save): every answer, every Section start/done, every research step (`research_logged` / `context_research`), every booster install/choice, every generated file, every error, handoff steps.
- Interruption-safe: any session that dies leaves a consistent `state.json` (last checkpoint) — work loss is at most the current unanswered micro-batch.
- `/lvr-continue` rebuild: load `state.json`; if unreadable → replay journal; report what was reconstructed. A rebuild may preserve the corrupt state file once as `.lvr/state.corrupt-<date>.json` before overwriting; it is not part of the canonical write set.
- Idempotency: sections marked `done` are never re-run; re-running `/lvr-handoff` re-lints instead of regenerating everything (regeneration is explicit, per file).
