# LVR Conventions

Canonical source: `docs/spec/*` in the LVR repository. This file is the packaged snapshot for installed skills: every skill ships it byte-for-byte as `references/conventions.md` (`npm run check:skills` guards the copies; drift against `docs/spec` is a review item).

schema_version: 2 · date: 2026-11-20

Companion files: `lvr-principles.md` — the Constitution, loaded before any LVR work; `lvr-freshness.json` (installed as `references/freshness.json`) — the freshness limits for cited facts (section 10). The Conductor (the model running the pipeline) applies the rules below.

## 1. Folder model

One folder = one idea = one product. Never mix two ideas or two products in one folder.

```
<project-folder>/
├── .lvr/
│   ├── state.json        State: authoritative snapshot (rewritable)
│   ├── journal.ndjson    Journal: append-only event log (never rewritten)
│   ├── docs/
│   │   ├── sections/     Section Records: S0-intake.md, S1-context.md, ...
│   │   └── research/     domain-brief.md: Domain Brief + per-Section scan items (section 10)
│   ├── review/           Plan review (section 11): LEDGER.jsonl, learned-checks.md, REVIEW-<date>-<N>.md, runs/run-<N>/
│   ├── recheck/          Legacy RECHECK-<date>.md reports from /lvr-recheck-plan (read-only history)
│   └── migrations/       v1-to-v2-<stamp>/: copies of the old state.json + journal.ndjson kept by a migration (never deleted by LVR)
├── (after S9: Blueprint Bundle files + builder code live here)
├── HANDOFF-PROMPT.md     Builder entry prompt from /lvr-handoff (side artifact, never part of the bundle)
└── brand/                Personal-brand kit from /lvr-personal-brand (never part of the bundle)
```

`state.json` is the single source of truth for "where are we". `journal.ndjson` is the audit trail: if the State is corrupted or missing, rebuild it by journal replay. Section Records are the raw material S9 compiles.

## 2. State schema (`state.json`, v2)

```json
{
  "schema_version": 2,
  "project": {
    "slug": "warung-cashier",
    "name": "Warung Cashier",
    "idea_raw": "...",
    "user_language": "id",
    "created_at": "2026-11-08T09:00:00Z",
    "status": "interview",
    "error": null
  },
  "product": { "types": ["web"], "flags": { "stores_data": true, "has_ui": true, "has_llm": false }, "status": "decided", "source": "user", "rationale": null, "confirmed": true, "updated_at": "..." },
  "pipeline": {
    "current_section": "S4",
    "sections": {
      "S0": { "status": "done", "record": "S0-intake.md",
              "answers": { "S0.q1": { "q": "...", "a": "...", "skipped": false } } },
      "S1": { "status": "in_progress", "coverage": { "who-pays": ["S0.q1"], "platform": [] } }
    },
    "loop_backs": [
      { "id": "L-01", "from": "S6", "to": "S3", "reason": "research found cost conflict",
        "opened_at": "...", "resolved_at": null }
    ],
    "research": {
      "brief": { "rq": ["RQ-002"], "findings": ["U-01", "U-02"], "updated_at": "..." },
      "scans": { "S1": { "rq": ["RQ-004"], "findings": ["U-03"], "note": null, "at": "..." } },
      "log": { "count": 5, "failed": ["RQ-005"], "last_id": "RQ-005", "last_at": "..." },
      "web_check": { "id": "RQ-001", "outcome": "found", "reason": null, "at": "..." }
    }
  },
  "decisions": [
    { "id": "D-001", "section": "S2",
      "summary": "Deploy on the VPS the user already owns",
      "rationale": "owner pays nothing extra", "status": "user_confirmed" }
  ],
  "boosters": {
    "core": [ { "name": "simple-english", "repo": "AminBlg/SimpleEnglish",
                "license": "MIT", "tier": "core", "status": "installed" } ],
    "enhancer": [],
    "installed": [ { "name": "grilling", "kind": "skill", "repo": "owner/repo", "sha": "3fa9c1e",
                     "scope": "project", "harness": "claude-code", "path": ".claude/skills/grilling",
                     "tier": "enhancer", "section": "S4", "consent": false,
                     "status": "installed", "installed_at": "...", "uninstalled_at": null } ]
  },
  "model_profile": { "tier": "T1", "probe": "skipped", "declared_at": "..." },
  "milestones": [
    { "id": "M0", "goal": "...", "features": ["F-01"],
      "verified": false, "verified_at": null }
  ],
  "deployment": null,
  "handoff": null,
  "framework_decision": null,
  "release_check": {},
  "review": null,
  "agents_delegated": [],
  "sessions": [
    { "start_seq": 1, "skill": "lvr-init-new-idea", "harness": "claude-code",
      "session_id": null, "session_id_reason": "harness does not expose it",
      "model": "claude-opus-5-5", "tier": "T1", "cwd": "/home/u/projects/warung-cashier",
      "started_at": "...", "ended_at": null, "end_reason": null,
      "sections": ["S0", "S1"], "agents": [], "boosters_installed": [], "boosters_uninstalled": [],
      "recovered_error": null }
  ]
}
```

Field notes:

- `project.slug`: kebab-case, used as the folder name. `project.name`: display name, locked at S1 (may still change at the S9 branding step). `idea_raw`: verbatim user input in User Language. `user_language`: detected at S0, user-correctable.
- `pipeline.current_section`: the first Section in S0…S9 order that is not `done`; it stays "S9" once S9 is done. S10 (build) is tracked by `project.status` (`building`/`complete`), never by `current_section`. Section statuses win when they disagree (/lvr-continue repairs the pointer).
- `pipeline.sections`: one entry per Section with `status`, `record`, timestamps, and recorded answers. Section status enum: `pending | in_progress | done | blocked`. `blocked` = the user moved on with exit criteria unmet: journal `section_blocked` (payload: `section`, `unmet` list), the unmet criteria also go into the Section Record, `current_section` stays on it, and it resumes like `in_progress`.
- `answers[].q` is stored exactly as asked, in User Language; the English summary lives in the Section Record.
- `pipeline.loop_backs`: open Feasibility Loop entries (S6); `resolved_at` is set when the entry closes.
- `decisions[].status`: `user_confirmed | assumed | designer_filled`. `assumed` = asked, user skipped or deferred. `designer_filled` = never surfaced — the user couldn't have known to ask. Both `assumed` and `designer_filled` decisions are also listed in ASSUMPTIONS.md.
- `boosters`: two arrays, `core` (Booster required for output quality) and `enhancer` (Booster that adds quality). Booster status enum: `installed | missing | failed | degraded`.
- `model_profile.tier`: `T1 | T2 | T3` — behavior rules in section 7.
- `milestones`: top-level only — filled at S8, one entry per milestone; never mirrored under `pipeline`. `/lvr-build` sets `verified` + `verified_at`. `deployment`: written by `/lvr-build` when the live check passes. `handoff`: filled by /lvr-handoff.

v2 fields (defaults: `project.error` null, `product` `{types: [], flags: {}, status: "unasked", source: null, rationale: null, confirmed: false, updated_at: null}`, empty `pipeline.research`, `installed: []`, `framework_decision` null, `release_check` `{}`, `review` null, `agents_delegated: []`, `sessions: []`; a missing one reads as its default):

- `project.error`: `{seq, ts, skill, step, message, previous_status}` while `status` is "error" (set by `error`, cleared by the event that restores the status); null otherwise.
- `product`: `types` = the product types (profile ids) the user chose at S1, `[]` = not asked yet; `flags` = booleans (`stores_data`, `has_ui`, `has_llm`, `regulated_domain`); `status` = `unasked | pending | decided` (`pending` = the user does not know; the AI keeps interviewing until it can recommend a type with reasons); `source` = `user | ai_recommended`; `rationale` = the AI's reasons for a recommendation; `confirmed` = the user said yes. A migrated project whose S1 is not finished stays `unasked` until the S1 interview asks (once). Written only by the `product` payload extension (section 3).
- `pipeline.sections.<S>.coverage` (optional): exit-criteria fact → the evidence ids that make it known (answer ids, `D-NNN`, `U-NN`, `RQ-NNN`); `[]` = not known yet. "S4: 6 of 9 facts known" counts the non-empty entries. Written only by the `coverage` payload extension.
- `pipeline.research`: an index of the research log (section 10), filled from `research_logged` / `context_research`: the brief's and each Section scan's research ids and `U-NN` findings (a `scans.<S>` entry = that scan was journaled), the log count, the failed research ids, the last web check.
- `boosters.installed[]`: every real install LVR made, one per `(name, path)`, with `kind` (`skill | mcp | agent`), `scope` (`project` = a path inside the project; `user` = an absolute or `~/` path), pinned `sha`, `consent` (an MCP install needs `true`) and `status` (`installed | uninstalled`). Only these may be uninstalled — never user-owned skills. Agent profiles are listed here too, but never in `core`/`enhancer`.
- `framework_decision`: the S5b stack pick (`decision_id`, `chosen` id/version, `alternatives` with scores, `confidence`, `user_override`, `defaulted`, `signals_ref`, `recheck_by`) plus `libraries[]` for later library picks; null until S5b.
- `release_check`: per product type (or `"default"`): the proof the product is live or installable (`kind`, `status: passed|failed`, `target`, `evidence`, `checked_at`), written by /lvr-build.
- `review`: a pointer to the review findings ledger (`.lvr/review/LEDGER.jsonl`) plus the last run (`run`, `scope`, `verdict`, `score`, `lens_scores`, open counts, `missed_earlier`, `report`); the ledger holds the findings.
- `agents_delegated[]`: each specialist delegation (`AG-NNN`, task, profile, transport `native | prompt | inline`, model, `status: started|done|failed`); a `started` one with no result is re-run on resume.
- `sessions[]`: one per skill run, from its `session_start`: harness, `session_id` (null with `session_id_reason` when the harness does not expose one — never invent an id), model, tier, cwd, start/end time and `end_reason` (`done | paused | context_guard | error | cancelled`) and `end_note` (the reason, always given for `cancelled`), plus what happened in it: Sections touched, delegations, boosters installed/uninstalled, and `recovered_error` (the error this run's opening cleared). The current session is the last one with `ended_at` null; an older one with `ended_at` null had no `session_end` (crash, kill, or a run from before session tracking).

Project status enum: `interview` → `researching` (S5–S6) → `review` (S7 start until S9 done) → `bundled` (S9 done) → `building` → `complete`; `error` can occur at any point (recoverable via /lvr-continue, with an `error` event in the Journal). Who sets it: S5 `section_start` → `researching`; S7 `section_start` → `review`; S9 `section_done` → `bundled`; /lvr-build `build_started` → `building`, `build_done` → `complete`.

`error`: any skill journals `error` (payload: `skill`, `step`, plain `message`, all required) when an unrecoverable failure stops its run with work half-done (a file it cannot write, a tool that crashes mid-step), then ends the run with `session_end` (`reason: "error"`) — never for a refusal (nothing was written: end with `session_end` `cancelled` and a `note` with the reason), a failed probe, a failed milestone, or context pressure (those have their own events). If the Journal itself cannot be written, `error` cannot be journaled either: say so and stop. Section 3 lists, per skill, when its run journals `error`. The event sets `project.status` = "error" and stores `project.error` (with the previous status); the next skill run's opening event (`session_start` — every run appends one first — or `resume`, `handoff_started`, `recheck_started`, `review_started`, `feature_started`, `brand_started`), or the next `section_start`, `section_done`, `section_blocked` or `answer_recorded`, restores the previous status, copies the error into the current session's `recovered_error`, and clears `project.error`. /lvr-continue offers the retry when the session it just opened has a `recovered_error`.

ID conventions: questions `S<n>.q<n>`, unpadded (`S1.q9`) · features `F-01…` · decisions `D-001…` · milestones `M0, M1, …` · loop-backs `L-01…` · research log entries `RQ-001…` · Domain Brief items `U-01…` (section 10) · delegations `AG-001…` (assigned by the script).

**Schema versions.** `schema_version` 2 is current. A project made by an older LVR — `schema_version: 1`, or a `.lvp/` folder (the old name of `.lvr/`) — is migrated before anything is written. Every skill except /lvr-init-new-idea starts with `LVR state migrate --check`; when it says `needed` and not `blocked`, run `LVR state migrate` and tell the user in one plain line that the bookkeeping files were updated to the new format and the old files are kept in `.lvr/migrations/`. Migration keeps every existing value, backs up the old `state.json` and Journal inside `.lvr/migrations/`, adds the new keys, and appends one `schema_migrated` event; the Journal is never rewritten, and running it again does nothing. A `.lvp/` folder is copied to `.lvr/`, never renamed or deleted: after the copy, ask once whether to remove `.lvp/` (default: keep) and remove it only on "yes", with `LVR state migrate --remove-legacy` (it refuses unless everything in `.lvp/` is also in `.lvr/`). `blocked` → /lvr-continue runs its recovery for `blocked.code` (a corrupt, invalid or lagging state is rebuilt by `replay --write`, which writes v2; on a project that has only `.lvp/` it first copies `.lvp/` to `.lvr/` and never touches `.lvp/`, so the path always ends in v2); other skills stop and recommend /lvr-continue. Without Node: copy `state.json` and `journal.ndjson` to `.lvr/migrations/v1-to-v2-<date>/` (for `.lvp/`, first copy the whole folder to `.lvr/`), add the v2 keys with their defaults keeping every existing value, set `schema_version` 2, write the State, then append `schema_migrated` (`from`, `to`, `backup`).

## 3. Journal (`journal.ndjson`)

Append-only; never rewritten. Every state mutation emits at least one event; `answer_recorded` fires per answer (that is the Checkpoint granularity). Its payload is `{ "section", "answer_id", "q", "a", "skipped" }` — `q` is the question text exactly as asked, `a` the user's verbatim answer, both in User Language; `a` is null when the answer was skipped. Legacy payloads carrying only `{ "section", "answer_id", "skipped" }` remain replayable — rebuilds fold q/a from the Section Record when the payload has no text. Each line:

```json
{"ts": "2026-11-08T09:00:00Z", "seq": 1, "type": "answer_recorded", "payload": { }}
```

Event types: `session_start`, `session_end`, `folder_gate_passed`, `folder_gate_rejected`, `folder_gate_subfolder_created`, `tier_declared`, `capability_probe_passed`, `capability_probe_failed`, `context_guard_triggered`, `truncation_recovered`, `tier_changed`, `booster_check`, `booster_install_ok`, `booster_install_failed`, `booster_choice`, `booster_installed`, `booster_uninstalled`, `booster_loaded`, `section_start`, `section_done`, `section_blocked`, `answer_recorded`, `loop_back_opened`, `loop_back_closed`, `scope_locked`, `doc_generated`, `handoff_started`, `gap_found`, `handoff_done`, `recheck_started`, `recheck_finding`, `recheck_research_refresh`, `recheck_fix_applied`, `recheck_done`, `review_started`, `review_done`, `feature_started`, `feature_captured`, `feature_research`, `impact_analysis`, `feature_scope_decision`, `feature_applied`, `feature_done`, `build_started`, `milestone_started`, `milestone_verified`, `milestone_failed`, `build_blocked`, `deployment_verified`, `release_checked`, `build_done`, `framework_selected`, `agent_delegated`, `brand_started`, `brand_file_generated`, `brand_done`, `error`, `resume`, `research_logged`, `context_research`, `schema_migrated` (written only by `state migrate`).

Every event type is replayable; replay always builds a v2 State. Types with no state effect (`folder_gate_rejected`, `impact_analysis`, `brand_file_generated`, `recheck_finding`, `schema_migrated`, …) are informational. The five `recheck_*` types are legacy: /lvr-recheck-plan was renamed /lvr-review-plan, which writes `review_started`/`review_done` instead; old journals still replay them.

v2 events (payload → State effect; "current session" = the last `sessions[]` entry with `ended_at` null):

| Event | Payload | Effect |
|---|---|---|
| `session_start` | `skill`; `session_id`, or null plus `session_id_reason`; optional `harness`, `model`, `tier`, `cwd` | new `sessions[]` entry; restores from `error` |
| `session_end` | `reason`: `done \| paused \| context_guard \| error \| cancelled`; optional `start_seq`, `note` (required for `cancelled`: why the run was refused) | closes the current (or named) session (`end_reason`, `end_note`); a refused run shows in `sessions[]` as `cancelled` |
| `booster_installed` | `name`, `repo`, `sha`, `kind`, `scope`, `harness`, `path`; optional `tier`, `section`, `consent` (`true` for `mcp`) | `boosters.installed[]` entry `installed`; the `core`/`enhancer` entry → `installed` |
| `booster_uninstalled` | `name`, `path`; optional `reason` | entry → `uninstalled`; `core`/`enhancer` entry → `missing` when no install of it remains |
| `agent_delegated` | `status` `started` (`task`, `profile`, `transport`, …; the script assigns the `AG-NNN` id) · `done` (`id`, `record`) · `failed` (`id`, `reason`) | `agents_delegated[]` |
| `framework_selected` | `decision_id`, `chosen`, `alternatives`, `confidence`, `user_override`, `defaulted`, `recheck_by`; optional `slot` (default `stack`), `signals_ref`, `section`; the decision itself rides `decisions[]` | `framework_decision` (another slot → `libraries[]`, after a stack pick) |
| `review_started` | `run`, `scope` (`full \| scope-only`) | restores from `error`; opens `review.last` |
| `review_done` | `run`, `verdict`, `score`, `open`, `missed_earlier`, `report`; optional `lens_scores`, `ledger_sha256` | closes `review.last` |
| `release_checked` | `kind`, `status` (`passed \| failed`); optional `product_type`, `target`, `evidence` | `release_check[product_type]` |
| `schema_migrated` | `from`, `to`, `backup`, … | none (audit record) |

A `booster_loaded` event records `name`, `section` and `usage` (`start|pass|reference`) after a skill or reference informs the work. This is evidence of use, separate from presence or installation.

The deployment helper may add an ownership receipt to its journal event. The helper uses the receipt and exact contents to identify copies it can remove after approval. See `booster-lifecycle.md`.

`research_logged` / `context_research` fill `pipeline.research`; `error` fills `project.error`; `tier_declared`/`tier_changed` and the four Section events also update the current session.

Event ownership — every skill run: preflight (`version`; `state migrate --check` except in /lvr-init-new-idea) → `session_start` → the skill's opening event → work → `session_end`:

| Skill | Opens with | Journals `error` when | Ends (`session_end` reason) |
|---|---|---|---|
| /lvr-init-new-idea | `session_start` (Journal line 1, after the Folder Gate) | a Section Record, research file or bundle file cannot be written after the Section's work began | `done`, `paused`, `context_guard`, `error` |
| /lvr-continue | `session_start`, `resume` | a recovery step fails after a partial write; otherwise as /lvr-init-new-idea | as /lvr-init-new-idea |
| /lvr-handoff | `session_start`, `handoff_started` | `blueprint.json`, the stubs or `HANDOFF-PROMPT.md` cannot be written after the lint started | `done`, `cancelled`, `error` |
| /lvr-review-plan | `session_start`, `review_started` | an `--apply` run stops with fixes half-applied; the report or ledger cannot be written | `done`, `cancelled`, `error` |
| /lvr-add-feature | `session_start`, `feature_started` | bundle edits stop after some files changed and before `feature_applied` | `done`, `cancelled`, `error` |
| /lvr-build | `session_start`, then `build_blocked` or `build_started` | its own bookkeeping fails (the `VERIFICATION.md` log or the State cannot be written); a failing product is `milestone_failed`/`build_blocked`, never `error` | `done`, `paused`, `cancelled`, `error` |
| /lvr-personal-brand | `session_start`, `brand_started` | a brand file cannot be written mid-kit | `done`, `cancelled`, `error` |

The other events each skill emits are named in its own steps; `booster_installed`/`booster_uninstalled`, `agent_delegated`, `framework_selected`, `review_*` and `release_checked` are written by the steps that install boosters, delegate to a specialist, pick a framework (S5b), review the plan, and check that the product is live.

Payload extensions: any event may also carry `project` as an object (`slug`, `name`, `idea_raw`, `user_language`; a string `project` is just the project slug and is ignored), `decisions[]`, `milestones[]`, `product` (`{types?, flags?, status?, source?, rationale?, confirmed?}`: types replace, flags merge; types without a status mean the user decided them, except `ai_recommended` types, which stay `pending` (`confirmed` false) until an explicit `{status: "decided", confirmed: true}` (the source stays `ai_recommended`); a payload with `types` and no `source` is refused while an AI recommendation is in state, so another pick needs an explicit `source: "user"`; `ai_recommended` needs a `rationale` — the S1 product-type answer, or `feature_applied` for a flag change) and `coverage` (`{"<S>": {"<fact>": [evidence ids]}}`), which the state transition folds into `state.json`; `section_done` carries `record`, `booster_check` may carry `license` and `tier`, `milestone_verified` carries `verified_at`, `deployment_verified` carries `url`. A rebuild prefers payload data over disk derivation. What events did not carry comes from disk: milestones from `MILESTONES.md` when the bundle exists (it also holds post-lock milestones), else the S8 record; decisions from `DECISIONS.md` (else the Section Records) plus the decision lines in `S4-additions.md`.

## 4. Language rules

- English is the source of truth for all artifacts. There are no stored translation files; output is translated to User Language dynamically at runtime.
- All interaction with the user happens in User Language.
- Section Records keep the user's answers verbatim in User Language; the Conductor adds an English summary per answer.
- Feature names: the S4 record keeps the user's verbatim words; each F-NN also carries a coined English display name — that English name is what SPEC/requirements.md, USER_FLOWS.md, and blueprint.json use.
- S9 compiles English documents from the summaries; OVERVIEW.md additionally reflects the verbatim intent.
- Research (Domain Brief, Section scans, S5) runs on English sources plus the primary local sources of the user's market (regulators, local price pages); results are summarized in English. "Things you may not know" items are stored in English and shown in User Language at runtime.

## 5. Section map

Sections run strictly in order, except loop-backs opened by the Feasibility Loop (S6). Questions come in micro-batches (size by tier, section 7), phrased in User Language with a one-line reason why each question matters. Controls are always visible: skip (recorded, does not block) and "that's enough for this Section" (jump to the exit-criteria check). Recorded answers are never re-asked.

| Section | Purpose (one line) | Output record | Bundle contribution |
|---|---|---|---|
| S0 Intake | Capture the raw idea fully; detect User Language; propose slug + name; confirm the market; then build the Domain Brief | `S0-intake.md` + `research/domain-brief.md` | project metadata (`idea_raw`, `user_language`) |
| S1 Context | Problem, target users, platform shape, what "working" means for the user | `S1-context.md` | `SPEC/prd.md` |
| S2 Conditions | What the user already has and can pay: devices, accounts, hosting, budget ceiling | `S2-kondisi.md` | `DECISIONS.md` (platform, budget), `HANDOVER.md` (deploy target) |
| S3 Data & privacy | Login, personal data, payments, third-party services, where data may legally live | `S3-data.md` | `SPEC/data-model.md`, `SPEC/api.md`, `SECURITY.md` |
| S4 Features | Feature expectations in detail, iteratively until the user says "enough" | `S4-fitur.md` | `SPEC/requirements.md`, `USER_FLOWS.md` |
| S5 Deep research | Competitor scan, stack candidates with reasons, cost table, regional availability | `S5-research.md` | `RESEARCH.md` |
| S6 Feasibility Loop | Confront research findings with answers; open conflicts, risks, cost surprises | risks appended to `S5-research.md` | risk list in `RESEARCH.md`; accepted risks become decisions |
| S7 Scope lock | Freeze the MVP: every feature → `in-MVP` or Parking Lot (recorded, never deleted); `project.status` → `review` at Section start | `S7-scope.md` | `SCOPE.md` |
| S8 Milestone plan | Break the MVP into M0…Mn, each independently verifiable | `S8-milestones.md` | `MILESTONES.md`, `VERIFICATION.md` |
| S9 Compile | Compile Section Records + decisions + milestones into the Blueprint Bundle | (bundle files) | all bundle files (section 8) |
| S10 Build | Optional (/lvr-build); not an interview Section — no section entry, no `current_section` pointer; progress is `project.status` + `milestones[].verified`; the bundle must be sufficient for any builder | — | — |

Every Section S1–S8 opens with its per-Section scan and the "Things you may not know" items for it, before the first batch (section 10).

Hard rules: if the chosen platform needs a paid account the user lacks, surface it during S2 with the price (do not defer it to research); any blocking risk in S6 makes a loop-back mandatory; scope lock is mandatory before S8; every Acceptance Criterion from S8 must be machine-checkable or scripted (never "looks good").

**Scope locked** — one definition for every skill: a `scope_locked` event exists in the Journal **and** `pipeline.sections.S7.status` = "done". Either fact alone is not a lock (the event precedes the S7 record checkpoint; an S7 closed without the event never had its explicit confirmation). There is no state field for it; derive it every time (script: `scope_locked_seq` from `journal check` plus the S7 status).

Post-lock additions: `/lvr-add-feature` records captures and their decision lines (`- **D-NNN** summary — rationale · status: …`) in `.lvr/docs/sections/S4-additions.md` (append-only) and edits the bundle directly; done Section Records are never mutated, and S9 does not compile the additions file. A parked feature still gets a requirements row marked parked, a Parking Lot row, and a `USER_FLOWS.md` section marked `(parked — see SCOPE.md)`; no milestone.

## 6. Folder Gate

Mandatory first step of idea init. Check in this order:

1. cwd contains `.lvr/state.json` (or the old `.lvp/state.json` / `.lvp/journal.ndjson`) → refuse init. Print the progress summary and recommend /lvr-continue (it migrates an old project).
2. cwd is empty (ignore OS junk: `.DS_Store`, `Thumbs.db`, `desktop.ini`) → proceed in place.
3. cwd has project markers (`.git`, `package.json`, `Cargo.toml`, `pubspec.yaml`, `pyproject.toml`, `go.mod`, `.solution`, `*.csproj`, …) and no `.lvr/` → refuse: an existing project lives here. Recommend running init in an empty or new folder; offer the plan review skill (/lvr-review-plan) for that project.
4. cwd has at least one subdirectory with project markers (e.g. a projects root) → create the subfolder `./<slug>/` (slug from the idea, confirm with the user) and proceed there. Journal: `folder_gate_subfolder_created`.
5. cwd is non-empty with no markers (loose files) → ask the user: proceed here or create a subfolder (recommend the subfolder).

## 7. Model tiers

The pipeline must complete on any model the harness offers. Its memory lives on disk, never in the context window; the window is a workbench reloaded from disk, not a warehouse.

| Tier | Class | Input context | Max output | Examples |
|---|---|---|---|---|
| T1 | 1M-class APIs (frontier and flash) | 1M–1.05M | 64k–128k+ | Gemini 4 / 3.6 Flash, GPT-6 family, Claude 5.x, DeepSeek V4 |
| T2 | open-weight mid | 128k–262k | often unpublished | Qwen3.5, Llama 4, Gemma 3 27B |
| T3 | compact/local | 32k–128k | small | Mistral Small, small Gemma/Qwen |

Harness overhead (system prompt, tool definitions, skills) eats ~30k–85k tokens before any user content: T2/T3 budgets must subtract it. "Flash" no longer implies a small window; only Flash-Lite/nano and open small models are small.

Tier declaration and probe: the user declares the tier (or it is read from harness config) and it is stored in `model_profile.tier`. The capability probe is mandatory for T2/T3 and skipped for a declared T1: before S1, the model must produce a small strict-JSON object, follow a 3-step instruction in order, and continue an unfinished sentence correctly. Probe failure → refuse to run (the saved State stays safe) and journal `capability_probe_failed`.

Web research check (every tier, T1 included): the probe tests the model; this tests the harness. One real web search plus one page fetch must work — in idea init before `.lvr/` is created, in /lvr-continue before any Section work. Failure → explain the cause and how to enable web tools (section 10), then stop: there is no memory fallback at any tier. It is journaled as `research_logged` with `purpose: "web_check"`, never as a probe event.

Per-tier behavior rules:

| Behavior | T1 | T2 | T3 |
|---|---|---|---|
| Question micro-batch | up to 3 | up to 2 | 1 |
| Research (S5) | full queries | split into sub-queries; append RESEARCH.md incrementally | one sub-topic per turn; append every step |
| Bundle compile (S9) | one file per turn | one file per turn | one file section per turn (append-chunks) |
| Reload discipline | on Section start | on Section start | every turn: load only principles + `state.json` + the current Section's spec slice + the current record — never the transcript |
| Booster loading | per Section | per Section, one at a time | only the one in use; drop after use |

Context guard (input side): watch for repeated instruction-following failures, forgotten rules stated earlier, and tool-call confusion. Respond in order: checkpoint immediately (`context_guard_triggered`) → drop to a stricter reload discipline → if unresolved, stop cleanly and hand over to /lvr-continue (fresh window, disk intact). Never push through with degraded attention.

Truncation self-recovery (output side): detect `finishReason=length`, a mid-sentence cutoff, or a missing required section of a file. Recover by append-continue: reload the last complete block from the file on disk, continue exactly from there with no repetition, and append; repeat until the file's required structure is complete. Checkpoint `truncation_recovered` after every successful append. Never regenerate from scratch what can be continued; never save a truncated file as complete.

Cross-model resume: on /lvr-continue, a tier change compared to `model_profile.tier` → journal `tier_changed`, re-apply this section's rules for the new tier, and warn the user when downgrading (probe re-runs). An upgrade keeps an earlier `passed` probe; a change that lands on T2/T3 while `model_profile.probe` is not `passed` runs the probe as well. Any model finishes what any model started.

## 8. Blueprint Bundle file list

The bundle lives in the project folder next to `.lvr/` and must be self-sufficient: any harness, with no LVR skills installed, can build the product from it. Files are compiled at S9 (content for RESEARCH.md originates at S5, SCOPE.md at S7). 20 entries; CLAUDE.md and GEMINI.md share the last line.

| File | One-line purpose |
|---|---|
| `AGENTS.md` | Builder entry point: what the product is, how to load context (read DECISIONS → SPEC → MILESTONES), working rules, pointers to all other files |
| `OVERVIEW.md` | Owner document (strictest plain-language rules): what was decided, total cost table, how the product is used, what is parked |
| `DECISIONS.md` | Append-only decision log D-001… with summary, rationale, alternatives considered, date; mirrors `decisions[]` |
| `SPEC/prd.md` | Problem, context, target users, value proposition, goals/non-goals, success metrics |
| `SPEC/requirements.md` | Per feature F-01…: behavior, priority (must/should/could), acceptance criteria |
| `SPEC/data-model.md` | Entities, fields, relations + cardinality, indexes + why, validation rules, sample JSON |
| `SPEC/api.md` | Conventions, endpoint table, request/response examples for critical endpoints, status codes, error format |
| `SPEC/architecture.md` | Stack + reasons (mirrors DECISIONS), components, ASCII data-flow diagram, folder structure, local run instructions, failure points |
| `USER_FLOWS.md` | Per feature: ASCII flow diagram + numbered click-by-click script, happy path and key alternatives |
| `CODE_STYLE.md` | Language/framework conventions, naming, testing expectations, error handling, simplicity rules for the chosen stack |
| `SECURITY.md` | Auth model, PII inventory + protection, secrets handling, dependencies policy, compliance notes (region-appropriate) |
| `RESEARCH.md` | Competitor scan, comparable products, stack comparison with trade-offs, cost table; every claim with source + date |
| `SCOPE.md` | MVP list (F-01…) + Parking Lot, explicit |
| `MILESTONES.md` | M0…Mn: goal, deliverables, Acceptance Criteria, estimate |
| `VERIFICATION.md` | Per milestone: verification procedure (commands, expected outputs, visual checks); global smoke test; "definition of verified" |
| `ASSUMPTIONS.md` | Every decision not `user_confirmed`, each with why + how to replace or confirm it |
| `HANDOVER.md` | Owner document: run, deploy, update, back up; where secrets and API keys live; who to ask what |
| `CAPABILITIES.md` | Recommended Boosters for this stack (from the Capability Registry), license-tagged; NC items marked runtime-dependency-only |
| `blueprint.json` | Machine snapshot for UI and harnesses; derived file — regenerate it, never hand-edit |
| `CLAUDE.md`, `GEMINI.md` | One-line stubs pointing to AGENTS.md |

Format rules for all files: GitHub-flavored Markdown · English · ASCII diagrams except for the Mermaid ERD in SPEC/data-model.md · plain-language rules · identical stack, entity, and feature names everywhere.

## 9. Checkpoint rules

A Checkpoint = one Journal write + one State write, together.

When `scripts/lvr.mjs` is available, every Checkpoint goes through it (journal first, then state, under one lock); the prose procedures are the fallback.

Checkpoint moments: every session start and end · every answer · every Section start and done · every research step (`research_logged` / `context_research`) · every Booster install, uninstall or choice · every delegation start and result · every framework pick · every review start and done · every release check · every generated file · every error · each Handoff step.

- Interruption-safe: a session that dies leaves a consistent `state.json` at the last checkpoint; work loss is at most the current unanswered micro-batch.
- Rebuild: load `state.json`; if it is unreadable, replay the Journal and report what was reconstructed; the corrupt file MAY be preserved once as `.lvr/state.corrupt-<date>.json` (not part of the canonical write set).
- Idempotency: Sections marked `done` are never re-run; re-running the Handoff re-lints instead of regenerating; regeneration is explicit and per file.

## 10. Research and citations

Principles 1 and 14 in operational form. This section is all a skill needs: `LVR cite check` and `LVR research log` implement the exact parsing and finding messages (maintainers: `docs/spec/07-research.md` in the LVR repository, not shipped).

**Web research is required.** Web search and page fetch must both work (harness tools or an MCP server). The check: one neutral search, then fetch result pages one at a time, up to 3 different results — pass when at least one returns readable text (one site's 403 or login wall is not a failure; take the next result). No web → say the cause, give the enable steps, stop; never continue on memory.

**A tool outage is not failed research.** `outcome: "failed"` (and so an `[unverified: …]` marker) means only: search and fetch both worked and nothing usable was found. If the search tool errors (an error, timeout, "not available", "not permitted"; not "0 results"), or no readable page comes from up to 3 results of a query and again from up to 3 results of one reworded query, that is an outage: never log it as `failed`, never carry on — say the error text, give the enable steps, and stop (`LVR research log` one `purpose: "web_check"` event with `outcome: "failed"` and the error as `reason` when `.lvr/` exists). `/lvr-continue` re-runs the web check first and resumes. Enable steps (English source): Claude Code — allow `WebSearch` and `WebFetch`; on Amazon Bedrock web search is unavailable, so add a search MCP server. Codex CLI — `web_search = "live"` in `~/.codex/config.toml`, or start with `codex --search`. Gemini CLI — keep `google_web_search` and `web_fetch` enabled (not excluded in `settings.json`); on Antigravity CLI, check its web tools are on. OpenCode — allow web search on first use and pick a provider (`/connect` or the provider's environment variable); `"websearch": false` turns it off. Any harness — add a web search + fetch MCP server (for example Firecrawl, Brave Search, Exa) with its API key.

**Cite tag** — one source for one claim, on the same line as the claim:

```
[cite: <category> · <url> · <date> · acc <YYYY-MM-DD>( · primary)( · live)( · amend-check <YYYY-MM-DD>)]
```

- Separator ` · ` (space, middle dot, space). `<category>` is a key of `references/freshness.json`. `<url>` is http(s), no spaces (`%20`, `]` as `%5D`). `<date>` is what the page states: `pub YYYY-MM-DD` or `upd YYYY-MM-DD` (also `YYYY-MM` or `YYYY`), or `n.d.`. `acc` = the day you read it.
- Flags: `primary` = the source owns the fact (vendor's own page, regulator, law text, official statistics office). `live` = the value was read off the live page on the access date. `amend-check YYYY-MM-DD` = on that day you searched for newer amendments of the regulation and found none.
- The URL host must be a public site (a dot in the name; not `localhost`, `*.local`, `*.internal`, or a private, loopback or reserved IP). `amend-check` is never earlier than the page's `pub`/`upd` date.
- A claim with two sources: two tags side by side, same category. Example: `Vercel Hobby costs USD 0/month [cite: price · https://vercel.com/pricing · n.d. · acc 2026-11-20 · primary · live]`.

**Freshness** (`references/freshness.json`, one file for every skill): `price`, `quota`, `version` 30 days · `legal` (ToS, policies, licences, vendor availability by country) 60 · `regulation` 60 for its amendment check and 60 for the day its source was read · `market` 90 · `statistic` 365 · `general` 365. Age is counted from `acc` for a `live` cite, else from the page's `pub`/`upd` date (statistics: always the published date; regulations: the newest `amend-check`, and also the newest `acc` — both within 60 days; a law's own `pub`/`upd` date never ages out). A partial date counts from the first day of its period. Past the limit → research it again before use. The freshest primary source wins; when sources disagree, record the conflict and which source won.

**Category fits the fact** — in `RESEARCH.md`, `OVERVIEW.md`, `SPEC/architecture.md`, `SECURITY.md`, `CAPABILITIES.md`, the S5 record and the research files, a line with a price, a fee or rate (including DSR, LTV, DP, interest) or a version carries a category that can hold it: a price or rate is `price`, `quota`, `legal`, `regulation` or `statistic`, never `market` or `general`; a version is `version` (or `quota`, `legal`, `regulation`). A price for a competitor is still a `price`. The bare phrases "from memory", "my knowledge", "as I recall", "from my training", "setahu saya", "dari ingatan", "tanpa cek" and the like are never a source.

**Key facts** (`price`, `quota`, `version`, `legal`, `regulation`) need one fresh `primary` source or two fresh sources from different sites. Regulations always need `amend-check`.

**Unverified** — only after research really failed (a failed `web_check` event is a tool outage, never a basis: a marker that names it is I9): log the failed research (below), then write `[unverified: <category> · RQ-NNN]` with the failed log ids. The bare word "unverified" is not enough. A decision that rests on an unverified fact — through its own text, a `U-NN` whose Source is unverified, the id of a failed research event, a Domain Brief row that names it in `Became`, or another decision that does — is never `designer_filled`: ask the user to confirm it, or record it as an S6 blocking risk.

**Vendor prices outside the research files** — in any other bundle or record file, a line with a non-zero price and a billing word (`/mo`, `/month`, `/yr`, `per month`, `per year`, `fee`, `plan`, `subscription`, `biaya`, `per bulan`, `per tahun`, `langganan`, …) needs a cite group, an `[unverified: …]` marker or an answer id on the same line (I1). A vendor price restated in a decision, assumption or Section Record keeps the cite tag of its source. Prices without a billing word (a test amount such as `Rp 150.000/hour`, `Rp 0`) and the user's own figures need none.

**User facts** — a fact the user stated is sourced by its answer id (`S2.q3`) on the same line.

**Recommendations** cite the research they rest on (a `U-NN` item or a cite tag). "Best practice" or "industry standard" alone is never a reason.

**Domain Brief** — `.lvr/docs/research/domain-brief.md`, built right after S0 closes: 8–15 items on the market's rules and regulations, typical and hidden costs, failure modes, key terms, and what similar users expect. Rows: `| ID | Finding (EN) | Why it matters | Source | Section | Became |`; `U-NN` ids; `Section` = the target Section S1–S8; `Became` = the answer id or decision id the item turned into. Template: `lvr-init-new-idea/references/sections/S0-domain-brief.md`.

**Per-Section scan** — before the first batch of S1–S8 (once per Section). Order, S1–S5: (1) `LVR cite check --file .lvr/docs/research/domain-brief.md`; for every finding I6, I7, I8 or I10 whose owner is this Section and whose item is still open, research the item again (one `context_research` step, `scope: "scan"`, `findings` = that item), replace its Source, and re-run until none is left (an item whose research fails again becomes an `[unverified: …]` marker and a question); (2) then S1–S4 at least one targeted search, S5 the research itself. S6–S8: the freshness re-check (`cite check --all`, research every expired fact again) plus searches as needed. New items go to the brief's `## Per-section scans` table; nothing new → one line `- <S> scan (RQ-NNN): no new unknowns — <reason>`. Then show the open items for the Section as "Things you may not know" (User Language; source site and date each, written "(source, date)" — never "I checked each one today"). Each item becomes a question (counts toward the batch size) or a `designer_filled` decision whose rationale cites the `U-NN` and its tag.

**Research log** — every research step (one topic, any number of queries), found or failed, is one journal event:

- `research_logged` — `{ id, section, purpose: web_check|claim|s5|refresh|feature|recheck, topic, queries[], sources[{url, title, published, updated, accessed, primary, live}], outcome: found|failed, reason, conflicts[] }`. `failed` needs `reason`; `found` needs a source; a direct page read is the query `fetch <url>`.
- `context_research` — the same without `purpose` (refused if present), plus `scope: brief|scan`, `findings` (U-ids), optional `note`. A brief step that found nothing (`outcome: failed`) may have `findings: []` with a `note`; the brief's `None found — <queries, RQ id>` line cites it.
- `failed` has no `sources`; a source's `published`/`updated` is not after its `accessed` date or today; a source URL is a public site.
- `id` = `RQ-NNN`, assigned by the script. Both events fill the `pipeline.research` index (section 2) and are valid before `state.json` exists.
- Script: `LVR research log --in -` (add `--context` for `context_research`). Check: `LVR cite check --all` or `--file <path>` — findings I1–I13; fix every one. Without Node, run the checks by reading, per `lvr-handoff/references/lint-checklist.md` group I.

## 11. Plan review (`/lvr-review-plan`)

Formerly /lvr-recheck-plan. Full contract: `references/contract.md` of the `lvr-review-plan` skill (work files, ids, ledger, commands and error codes). That skill's references also hold the lenses, the scale and the run protocol.

- **Read-only.** A review writes only `.lvr/review/**` and journal events. It edits bundle files only in `--apply` mode, and only with fixes the user approved (each file journaled `doc_generated` with `by: "lvr-review-plan"`).
- **Shape.** 15 lenses (L01 truth and freshness … L15 second-order effects) × the bundle files form the coverage matrix. Every required cell ends as findings, clean with a verbatim quote, or n/a with a reason. `lvr review coverage` rejects quotes that are not in the file.
- **Ids and ledger.** Finding id = `RV-<lens>-` + 8 hex of sha256(`check|locator|claim_key`), stable across runs: reconcile re-keys the same gap in new words (the same quoted text) to its first id (`same_as`); a different gap at the same place gets its own id. `.lvr/review/LEDGER.jsonl` is append-only. Status (`open`, `partial`, `regressed`, `fixed`, `accepted`, `withdrawn`, `superseded`) is kept apart from the first-seen class (`initial`, `new-due-to-change`, `world-changed`, `missed-earlier`, `checklist-gap`).
- **Score.** Severity = lookup(impact × likelihood, raised when nothing would detect it). Lens score 0–10 from the finding counts. Overall = floor((mean + min) / 2). `BUILD-READY` needs 0 blocking, min ≥ 8 and overall ≥ 8. Unchanged files must give unchanged scores (score drift, code `SCORE_DRIFT`, blocks the report otherwise).
- **Run-N.** Sweep blind first, then reconcile. The class of a new finding is derived from the ledger and the snapshots, never chosen. Every `missed-earlier` or `checklist-gap` finding gets an apology, a root cause and a learned check (`.lvr/review/learned-checks.md`). n/a never hides a finding, and `--apply` records only approved fixes.
- **State.** `review_started` (`run`, `scope`: `full | scope-only`; optional `mode`: `review | apply`) opens `review.last`, and `review_done` closes it (section 3). `review.last.open.blocking` is what /lvr-build's preflight reads.
- **Scope-only.** At the S7 lock, /lvr-init-new-idea runs a light review (lenses L01, L02, L04, L08, L10, L15) on the scope proposal before asking for the lock, when the review skill is installed. It is skippable, and the outcome is written in the S7 record.
- **Commands.** `LVR review snapshot|claims|coverage|ids|ripple|verify|ledger-diff|score|stability|render|freshness`. A command that answers `UNKNOWN_COMMAND` falls back to the skill's hand procedure.
