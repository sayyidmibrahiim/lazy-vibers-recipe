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
│   ├── review/             plan review (spec 08): LEDGER.jsonl, learned-checks.md, REVIEW-<date>-<N>.md, runs/run-<N>/
│   ├── recheck/            legacy RECHECK-<date>.md reports from /lvr-recheck-plan (read-only history)
│   └── migrations/         v1-to-v2-<stamp>/: pre-migration copies of state.json + journal.ndjson (+ manifest.json), never deleted by LVR
├── (after S9: bundle files + builder code live here)
├── HANDOFF-PROMPT.md       builder entry prompt from /lvr-handoff (side artifact, never part of the bundle)
└── brand/                  personal-brand kit from /lvr-personal-brand (never part of the bundle)
```

`state.json` is the source of truth for "where are we". `journal.ndjson` is the audit trail; if `state.json` is corrupted or missing, it is rebuilt by replaying the journal. Section records are the raw material compiled by S9.

## `state.json` schema (v2)

v2 = every v1 key with its v1 meaning, plus the keys marked `// v2`. A v1 file (`schema_version: 1`) is read by every read-only command and must be migrated (`state migrate`, §Schema versions and migration) before anything is written.

```jsonc
{
  "schema_version": 2,
  "project": {
    "slug": "warung-cashier",            // kebab-case, folder name
    "name": "Warung Cashier",            // display name (locked at S1)
    "idea_raw": "...",                   // verbatim user input, User Language
    "user_language": "id",               // detected at S0, user-correctable
    "created_at": "2026-11-08T09:00:00Z",
    "status": "interview",               // see status enum
    "error": null                        // v2: { seq, ts, skill, step, message, previous_status } while status = "error"
  },
  "product": {                           // v2: product types (profiles, spec 02/04 via ticket 08) and their flags
    "types": ["web"],                    // profile ids; [] = not asked yet or not known (base bundle only)
    "flags": { "stores_data": true, "has_ui": true, "has_llm": false },
    "status": "decided",                 // unasked | pending | decided  (pending = the user does not know yet; the AI keeps interviewing)
    "source": "user",                    // user | ai_recommended | null (null while unasked)
    "rationale": null,                   // the AI's reasons when source = ai_recommended, shown to the user to confirm
    "confirmed": true,                   // the user said yes to the types (always true for source user)
    "updated_at": "..."
  },
  "pipeline": {
    "current_section": "S4",
    "sections": {
      "S0": { "status": "done", "record": "S0-intake.md",
              "started_at": "...", "completed_at": "...",
              "answers": { "S0.q1": { "q": "...", "a": "...", "skipped": false } } },
      "S1": { "status": "in_progress",   // pending | in_progress | done | blocked
              "coverage": { "who-pays": ["S0.q1"], "platform": [] } }  // v2, optional: fact-key -> evidence ids ([] = not known yet)
    },
    "loop_backs": [
      { "id": "L-01", "from": "S6", "to": "S3", "reason": "research found cost conflict",
        "opened_at": "...", "resolved_at": null }
    ],
    "research": {                        // v2: index of the research log (spec 07 §5); the journal keeps the payloads
      "brief": { "rq": ["RQ-002"], "findings": ["U-01", "U-02"], "updated_at": "..." },
      "scans": { "S1": { "rq": ["RQ-004"], "findings": ["U-03"], "note": null, "at": "..." } },
      "log": { "count": 5, "failed": ["RQ-005"], "last_id": "RQ-005", "last_at": "..." },
      "web_check": { "id": "RQ-001", "outcome": "found", "reason": null, "at": "..." }
    }
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
    "enhancer": [ /* same shape */ ],
    "installed": [                       // v2: real installs LVR made (and may uninstall); never user-owned skills
      { "name": "grilling", "kind": "skill", "repo": "owner/repo", "sha": "3fa9c1e",
        "scope": "project", "harness": "claude-code", "path": ".claude/skills/grilling",
        "tier": "enhancer", "section": "S4", "consent": false,
        "status": "installed", "installed_at": "...", "uninstalled_at": null }
      // kind: skill | mcp | agent · scope: project | user · status: installed | uninstalled
    ]
  },
  "model_profile": { "tier": "T1", "probe": "skipped", "declared_at": "..." },
  // tier: T1 | T2 | T3 — rules in docs/spec/06-model-tiers.md
  // probe: "passed" | "skipped" (T1 skips the probe) | "failed"
  "milestones": [                          // filled at S8
    { "id": "M0", "goal": "...", "features": ["F-01"],
      "verified": false, "verified_at": null }   // verified by /lvr-build
  ],
  "deployment": null,                      // { status: "live|pending", url, verified_at }
  "handoff": null,                         // filled at /lvr-handoff: { status: "done", completed_at }
  "framework_decision": null,              // v2, S5b: { slot: "stack", decision_id, chosen: { id, name, version }, alternatives: [{ id, score }],
                                           //   confidence, user_override, defaulted, signals_ref: { path, sha256 } | null, recheck_by: "YYYY-MM-DD",
                                           //   section, decided_at, libraries: [ same shape, slot = the library's job ] }
  "release_check": {},                     // v2: per product type (or "default"): { kind, status: passed|failed, target, evidence, checked_at }
  "review": null,                          // v2: { ledger: ".lvr/review/LEDGER.jsonl", runs, last: { run, scope, started_at, done_at, verdict,
                                           //   score, lens_scores, open: { blocking, major, minor }, missed_earlier, report, ledger_sha256 } }
  "agents_delegated": [],                  // v2: { id: "AG-001", task, profile, profile_sha, transport: native|prompt|inline, harness, model,
                                           //   tier, section, status: started|done|failed, started_at, ended_at, record, reason }
  "sessions": []                           // v2: one per skill run, see below
}
```

### v2 fields

All v2 keys have the defaults shown in `freshState` (`project.error` null, `product` `{types: [], flags: {}, status: "unasked", source: null, rationale: null, confirmed: false, updated_at: null}`, empty `pipeline.research`, `installed: []`, `framework_decision` null, `release_check` `{}`, `review` null, `agents_delegated: []`, `sessions: []`). A v2 file missing one of them validates with warning `W_MISSING_KEY` (read as the default). Unknown keys stay `W_UNKNOWN_KEY` and are kept on write.

- **`project.error`** — set by `error` (`previous_status` = the status before it; a second `error` keeps that `previous_status`), cleared by the event that restores the status (§Project status enum). Non-null only while `status` = `error` (error otherwise); `status` = `error` with `project.error` null is warning `W_ERROR_DETAIL_MISSING` (hand-written or migrated prose state).
- **`product`** — `types`: unique ids `^[a-z][a-z0-9-]{0,31}$`; `flags`: booleans, known keys `stores_data`, `has_ui`, `has_llm`, `regulated_domain`, `public_form`, `has_rag` (others: warning `W_PRODUCT_FLAG_UNKNOWN`). Written only by the `product` payload extension (types replace, flags merge per key). `status`: `unasked` (never asked: a v1 project migrated before S1 finished, or S1 not reached), `pending` (asked, the user does not know: the AI keeps interviewing until it can recommend a type with reasons), `decided` (types chosen). `source`: `user` (the user named the types) or `ai_recommended` (the AI proposed them with `rationale`); null while `unasked`. `confirmed` is true once the user accepted the types. An AI recommendation waiting for the user's yes is `status: "pending"` with the proposed `types`, `source: "ai_recommended"`, `rationale` and `confirmed: false`; the user's yes is a later event `{status: "decided", confirmed: true}` (or `{types, status: "decided", source: "user"}` when they pick something else). The S1 interview logic that fills this is ticket 08; this schema only carries it. Validation: `decided` needs at least one type and `confirmed` true; `source: "ai_recommended"` needs a non-empty `rationale`; `unasked` has no types, source or rationale; `confirmed` is false unless `decided`.
- **`pipeline.sections.<S>.coverage`** — optional per-Section map of exit-criteria facts to the evidence that makes each known (answer ids, `D-NNN`, `U-NN`, `RQ-NNN`); an empty list = not known yet. "S4: 6 of 9 facts known" = non-empty entries / entries. Written only by the `coverage` payload extension; the fact keys belong to the adaptive-depth procedure.
- **`pipeline.research`** — filled by `research_logged` and `context_research` (§v2 events). A `scans.<S>` entry exists once that Section's scan was journaled. `log.failed` lists the research ids that `[unverified: …]` markers may name.
- **`boosters.installed[]`** — one entry per `(name, path)`; `scope: project` needs a relative path inside the project (no `..`), `scope: user` an absolute or `~/` path; `kind: mcp` needs `consent: true`; `sha` null is warning `W_BOOSTER_NO_SHA`; `tier` is null only for `kind: agent` (agent profiles are installed under booster rules but never appear in `core`/`enhancer`). The `core`/`enhancer` lists keep saying what is available now: an uninstall marks the name `missing` there once no installed entry of it remains.
- **`framework_decision`** — the S5b stack pick (`slot` `stack`) with the library picks of later mini S5b runs in `libraries` (one per `slot`). `decision_id` names the `DECISIONS.md` entry (`W_FRAMEWORK_DECISION_UNKNOWN` when it is not in `decisions[]`). `recheck_by` is a calendar date; whether it has passed is checked by `/lvr-build` preflight, never by validation (validation is time-independent).
- **`release_check`** — keyed by product type, or `"default"` when `product.types` is empty. Known kinds: `url_2xx`, `package_install`, `mcp_tools_listed`, `workflow_import_run`, `skill_trigger`, `extension_load`, `store_build`, `build_runs`, `agent_flow`, `rag_answer` (others: `W_RELEASE_KIND_UNKNOWN`; a key that is neither a product type nor `default`: `W_RELEASE_TYPE_UNKNOWN`).
- **`review`** — a pointer to the append-only findings ledger plus the last run's outcome; the ledger holds the findings (ledger, scores and commands: spec 08). `verdict`: `BUILD-READY | FIX-THEN-BUILD | NOT-READY | INCOMPLETE`; `done_at` and `verdict` are null together while a run is open.
- **`agents_delegated[]`** — `id` `AG-NNN` assigned by the script; `ended_at` is non-null exactly when `status` ≠ `started`; `failed` needs `reason`. A `started` entry with no result is re-run on resume (idempotent).
- **`sessions[]`** — one entry per `session_start`:

  ```jsonc
  { "start_seq": 41, "skill": "lvr-continue", "harness": "claude-code",
    "session_id": null, "session_id_reason": "harness does not expose it",   // never invent an id
    "model": "claude-opus-5-5", "tier": "T1", "cwd": "/home/u/projects/futsal",
    "started_at": "...", "ended_at": null, "end_reason": null, "end_note": null,           // done | paused | context_guard | error | cancelled
    "sections": ["S4"], "agents": ["AG-002"], "boosters_installed": ["grilling"], "boosters_uninstalled": [],
    "recovered_error": null }                                               // { seq, skill, step, message } when this run's opening event cleared an error
  ```

  `session_id` null needs a non-empty `session_id_reason`; `end_reason` is non-null exactly when `ended_at` is. The **current session** is the last entry with `ended_at` null: `section_start`, `answer_recorded`, `section_done` and `section_blocked` add their Section to its `sections`, `agent_delegated` (started) its id to `agents`, `booster_installed`/`booster_uninstalled` the name to `boosters_installed`/`boosters_uninstalled`, and `tier_declared`/`tier_changed` set its `tier`. A new `session_start` never closes an older session: `ended_at` null on an older entry means no `session_end` was recorded (crash, kill, or a run from before session tracking).

### Project status enum

`interview` → `researching` (S5–S6) → `review` (S7 start until S9 done) → `bundled` (S9 done) → `building` (builder active) → `complete` · `error` (with `error` entry in journal; recoverable via `/lvr-continue`).

Who sets it: S0 start → `interview`; `section_start` S5 → `researching`; `section_start` S7 → `review`; `section_done` S9 → `bundled`; `/lvr-build` writes `building` at `build_started` and `complete` at `build_done` (a later `build_started`, e.g. after `/lvr-add-feature` appended a milestone, sets `building` again).

**`error`.** Any skill journals `error` (payload: `skill`, `step`, plain `message`, all required) when an unrecoverable failure stops its run with work half-done — a file it cannot write, a tool that crashes mid-step — then ends the run with `session_end` (`reason: "error"`). Not for refusals (nothing was written; the run ends `session_end` `cancelled` with a `note` giving the reason), probe failures (`capability_probe_failed`), build failures (`milestone_failed`, `build_blocked`), or context pressure (`context_guard_triggered`, then `session_end` `context_guard`). When the journal itself cannot be written, `error` cannot be journaled either: say so and stop. The per-skill triggers are in §Event ownership.

The `error` checkpoint sets `project.status` = `error` and stores `project.error` (`previous_status` = the status before it). The next opening event of any skill run (`session_start`, which every run appends first, or `resume`, `handoff_started`, `recheck_started`, `review_started`, `feature_started`, `brand_started`), or the next `section_start`, `section_done`, `section_blocked` or `answer_recorded`, restores `previous_status` before applying its own effect, copies `{seq, skill, step, message}` into the current session's `recovered_error`, and clears `project.error` (a state without `project.error`, written by hand, falls back to the status before the last `error` in the journal, else `interview`). `/lvr-continue` decides its "retry the failed step" offer from `recovered_error` on the session it just opened.

### Section pointer and status

- `current_section` = the first Section in S0…S9 order that is not `done`; once S9 is `done` it stays `"S9"`. S10 (build) is tracked by `project.status` (`building`/`complete`), never by `current_section`. A disagreement is repaired by `/lvr-continue` (section statuses win).
- Section status `blocked`: the user moved on with exit criteria unmet. Journal `section_blocked` (payload: `section`, `unmet` — the list of unmet criteria); the unmet criteria are also written into the Section Record. `current_section` stays on the blocked Section, and it resumes like an `in_progress` one; on a later pass it closes with `section_done`.

### ID conventions

Questions `S<n>.q<n>`, unpadded (`S1.q9`, `S1.q10`) · Features `F-01…` · Decisions `D-001…` · Milestones `M0, M1, …` · Loop-backs `L-01…` · Research log entries `RQ-001…` (assigned by `research log`) · Domain Brief items `U-01…` (one id space for the brief and the per-Section scans) · Delegations `AG-001…` (assigned by the script) · Sessions by the `seq` of their `session_start`

## `journal.ndjson` event types

Each line: `{"ts": "...", "seq": 1, "type": "...", "payload": { ... }}`

`session_start|session_end` · `folder_gate_passed|folder_gate_rejected|folder_gate_subfolder_created` · `tier_declared` · `capability_probe_passed|failed` · `context_guard_triggered` · `truncation_recovered` · `tier_changed` · `booster_check` · `booster_install_ok|failed` · `booster_choice` (user decision on failure) · `booster_installed|booster_uninstalled|booster_loaded` · `section_start|section_done|section_blocked` · `answer_recorded` · `loop_back_opened|closed` · `scope_locked` · `doc_generated` · `handoff_started|gap_found|handoff_done` · `recheck_started|recheck_finding|recheck_research_refresh|recheck_fix_applied|recheck_done` · `review_started|review_done` · `feature_started|feature_captured|feature_research|impact_analysis|feature_scope_decision|feature_applied|feature_done` · `build_started|milestone_started|milestone_verified|milestone_failed|build_blocked|deployment_verified|release_checked|build_done` · `framework_selected` · `agent_delegated` · `brand_started|brand_file_generated|brand_done` · `error` · `resume` · `research_logged|context_research` · `schema_migrated` (written only by `state migrate`)

`research_logged` and `context_research` (ticket 26) record every research step: payloads, ids, and the `research log` command are specified in `07-research.md` §5. In v2 both fill `pipeline.research` on replay; both are valid before `state.json` exists (the S0 materialisation replays them). `research log` (or `journal append --type research_logged|context_research`) assigns the id; the script's event list and the conventions "Event types:" line both carry the two types.

Rules: append-only; never rewrite; every state mutation emits at least one event; `answer_recorded` fires **per answer** (checkpoint granularity). Its payload is `{ "section", "answer_id", "q", "a", "skipped" }` — `q` is the question text exactly as asked, `a` the user's verbatim answer, both in User Language; `a` is null when the answer was skipped. Legacy payloads carrying only `{ "section", "answer_id", "skipped" }` remain replayable — rebuilds fold q/a from the Section Record when the payload has no text.

### Payload extensions (replay-complete journals)

Payloads stay free-form objects. `scripts/lvr.mjs` additionally understands these optional keys, so that a journal it wrote replays to exactly the live `state.json` without reading Section Records:

- `project` — as an **object**, on any event (a string `project`, as in `handoff_started`'s project slug, is the prose meaning and is ignored by the reducer): any of `slug`, `name`, `idea_raw`, `user_language` (strings); each present key is assigned to `state.project`. This is how S0 answers and a branding rename reach state.
- `decisions[]` — on any event: full decision objects (`id`, `section`, `summary`, `rationale`, `status`), upserted into `state.decisions` by id at the checkpoint where the decision is made.
- `milestones[]` — on any event (S8 `section_done`, `feature_applied`): `{ "id", "goal", "features" }`, upserted into `state.milestones` (`verified` / `verified_at` are preserved).
- `product` (v2) — on any event (the S1 product-type `answer_recorded`; `feature_applied` for a flag flip): `{ "types"?: [ids], "flags"?: { key: bool }, "status"?: "unasked|pending|decided", "source"?: "user|ai_recommended", "rationale"?: str, "confirmed"?: bool }`, not empty. `types` replaces `product.types`, `flags` merges per key, `product.updated_at` = the event `ts`. Giving non-empty `types` without a `status` means `decided`, `source` `user`, `confirmed` true (the user named them), unless `source` is `ai_recommended`: then it is `pending` with `confirmed` false. An AI recommendation becomes `decided` only by an explicit `{status: "decided", confirmed: true}` (refused with INVALID_PAYLOAD `product.confirmed` otherwise, also against an `ai_recommended` entry already in state); A payload with no `source` never confirms or relabels an `ai_recommended` entry already in state: with non-empty `types` it is refused (INVALID_PAYLOAD `product.source`, "expected explicit: \"user\" to choose another type, or \"ai_recommended\" with confirmed true to confirm the recommendation"), and `{status: "decided", source: "user"}` without `types` and without `confirmed: true` is refused (INVALID_PAYLOAD `product.types`). Confirming keeps `source: "ai_recommended"`; picking another type needs an explicit `source: "user"` (owner decision P6). The replay fold applies the same rule, so replay equals live. `status: "pending"` records "the user does not know"; `source: "ai_recommended"` needs a `rationale`.
- `coverage` (v2) — on any event (`section_start` seeds it, `answer_recorded` updates it): `{ "<S>": { "<fact-key>": [evidence ids] } }`; each fact key replaces its own list; a Section not in state yet is created `pending`.
- `section_done.record` — the record file name, stored as `sections.<S>.record`.
- `booster_check` — may carry `license` and `tier` (`core|enhancer`) next to `name`, `repo`, `result`.
- `milestone_verified.verified_at` and `deployment_verified.url` — stored as given (`verified_at` defaults to the event `ts`).
- `cli` — the script stamps `"cli":"lvr"` on the payload of **every** event it appends. Stamped events carry every fact in their payloads: replay folds them without reading disk, so a journal made only of stamped events reproduces the live `state.json` exactly. Unstamped events (written by the prose fallback, or older journals) get the disk fallbacks on replay (Section Records, `OVERVIEW.md`, `DECISIONS.md`, `CAPABILITIES.md`, never-mentioned core boosters; the booster fill only when no event is stamped).
- `.lvr/.state-seq` — hidden helper written by the script right after each `state.json` write: the journal `seq` the state reflects (`N`), or `lag:N` once a lag was found (sticky until a recovery command). On a write: equal to the journal tail = in sync; behind by unstamped events only = the prose fallback updated state by hand, so the script adopts it (`state.adopted`); behind by exactly one stamped event = crash heal; otherwise `STATE_LAGS`. Ahead of the journal = `JOURNAL_BEHIND_STATE` (journal lines were lost; every write is blocked until `journal restore-from-state`). `journal restore-from-state` refuses (`RESTORE_NOT_NEEDED`, nothing written) unless `state.json` holds something the journal lacks, and it moves `.state-seq` to the journal tail only when the journal was behind, empty, or already in sync; a lagging or unknown state is fixed with `replay --write --force` instead, which accepts a script-only journal without a `LOSSY_REPLAY` check (the replay is exact by construction). Missing or damaged on a script-created journal = `STATE_SEQ_UNKNOWN`. Absent on a prose-written state = untracked, no heal.
- Exit code 3: the event was journaled (`journaled_seq`) or blocked but `state.json` was not checkpointed; the envelope is `ok:false` with `error.code` and `error.details.hint`.
- `booster_loaded` records `name`, `section`, and `usage` (`start|pass|reference`). It is audit evidence and leaves state fields unchanged.
- `booster_check` from the registry maps registry tier `conditional`/`reference` to state tier `enhancer`.
- `booster deploy` adds a journal-only `managed` receipt to its project-local `booster_installed` event. The receipt holds the installed tree hash and identities of directories created by this install. It does not change the replayed state shape. `booster cleanup` requires the receipt and matching disk contents before an approved removal.

A rebuild prefers payload data over disk derivation; the Section Records, `OVERVIEW.md`, `DECISIONS.md` and `CAPABILITIES.md` fill only what the events did not carry, and only for unstamped events. For a journal that is not script-only, milestones the events did not carry come from `MILESTONES.md` when the bundle has it (it also holds the milestones `/lvr-add-feature` appended after the lock), then from the S8 record; a `milestone_verified` whose milestone comes from disk is applied after that. Decisions come from `DECISIONS.md` when it exists, else from the Section Records' decision lines, plus the post-lock decision lines in `S4-additions.md` (section `S4`) that neither holds yet.

Every event type above is replayable: an event with no state effect (for example `folder_gate_rejected`, `impact_analysis`, `brand_*`) is informational, never "untranslatable".

### v2 events

Payload rules are checked by the script (`INVALID_PAYLOAD` with `details.field`, nothing written). Every event below is stamped and checkpointed like any other (journal first, then state, one lock; `.state-seq`, heal, adopt and lag rules unchanged). "Current session" as in §v2 fields.

| Event | Payload | State effect (live and replay) |
|---|---|---|
| `session_start` | `skill` (`lvr-…`); `session_id` (string, from a source the harness really exposes) or null with a non-empty `session_id_reason`; optional `harness`, `model`, `tier`, `cwd` | appends a session (`start_seq` = seq, `tier` = payload tier or `model_profile.tier`); then restores from `error`. A legacy `session_start` without either id key replays as `session_id` null, `session_id_reason` "not recorded (written before session tracking)" |
| `session_end` | `reason`: `done \| paused \| context_guard \| error \| cancelled`; optional `start_seq`, `note` (required, non-empty, for `cancelled`: why the run was refused) | closes that session (default: the current one): `ended_at`, `end_reason`, `end_note`. There must be an open session. A skill that refuses (wrong folder, nothing to do, schema too new) still opens a session when it can write, and closes it `cancelled` with the reason, so the refusal shows in `sessions[]`. A refusal before any journal exists (the init Folder Gate, `SCHEMA_TOO_NEW`, `MIGRATION_NEEDED`) writes nothing, so it leaves no session |
| `booster_installed` | `name`, `repo`, `sha` (hex or null), `kind` (`skill \| mcp \| agent`), `scope` (`project \| user`), `harness`, `path`; optional `tier`, `section`, `consent` (`true` required for `mcp`) | upserts `boosters.installed[]` by `(name, path)` as `installed`; for `skill`/`mcp` also marks the `core`/`enhancer` entry `installed` (new entries default to `enhancer`) |
| `booster_uninstalled` | `name`, `path`; optional `reason` | that entry → `uninstalled`, `uninstalled_at`; the `core`/`enhancer` entry → `missing` when no installed entry of the name remains. The entry must exist and be installed |
| `agent_delegated` | `status`: `started` (`task`, `profile`, `transport`; optional `profile_sha`, `harness`, `model`, `tier`, `section`; **no `id`** — the script assigns `AG-NNN` and returns it) · `done` (`id`; optional `record`) · `failed` (`id`, `reason`) | `started` appends to `agents_delegated`; `done`/`failed` close the started entry with that id (`ended_at`) |
| `framework_selected` | `decision_id`, `chosen` (`id`; optional `name`, `version`), `alternatives` (`[{id, score}]`), `confidence` (`high \| medium \| low`), `user_override`, `defaulted`, `recheck_by` (date); optional `slot` (default `stack`), `signals_ref` (`{path, sha256}`), `section`; usually carries the decision in `decisions[]` | slot `stack` sets `framework_decision` (its `libraries` kept); another slot upserts into `framework_decision.libraries` and needs a stack decision first |
| `review_started` | `run` (≥1), `scope` (`full \| scope-only`); optional `mode` (`review \| apply`, informational) | restores from `error`; `review.runs` = max(runs, run); `review.last` = a new open run |
| `review_done` | `run`, `verdict`, `score` (0–10), `open` (`{blocking, major, minor}`), `missed_earlier`, `report`; optional `lens_scores`, `ledger_sha256` | fills `review.last` when it is that open run |
| `release_checked` | `kind`, `status` (`passed \| failed`); optional `product_type` (default `default`), `target`, `evidence` | `release_check[product_type]` = the result with `checked_at` |
| `schema_migrated` | `from`, `to`, `via`, `backup`, `state_sha256_before`, `legacy_folder`, `script_version` | none (audit record). Reserved: only `state migrate` writes it (`journal append` refuses: `EVENT_RESERVED`) |

Changed v1 events: `error` now requires `skill`, `step`, `message`; `tier_declared`/`tier_changed` also set the current session's `tier`; the four Section events attribute their Section to the current session; `research_logged` adds to `pipeline.research.log` (`web_check` purpose: also `pipeline.research.web_check`); `context_research` adds to `log` and to `brief` (scope `brief`) or `scans.<S>` (scope `scan`).

### Event ownership

Every skill run: preflight (`lvr.mjs version`, then `state migrate --check` in every skill except `/lvr-init-new-idea`) → `session_start` → the skill's opening event → work → `session_end`. `/lvr-init-new-idea` writes `session_start` as journal line 1, right after the Folder Gate.

| Skill | Opens with | Emits | Journals `error` when | Ends with `session_end` |
|---|---|---|---|---|
| `/lvr-init-new-idea` | `session_start` | `folder_gate_*`, `tier_declared`, `capability_probe_*`, `booster_check`, `booster_installed` (legacy `booster_install_ok\|failed`), `booster_choice`, `research_logged`, `context_research`, the Section events S0–S9 (with the `project`, `product`, `coverage`, `decisions`, `milestones` extensions), `loop_back_*`, `scope_locked`, `framework_selected` (S5b), `review_started\|review_done` (scope-only review at S7), `agent_delegated`, `doc_generated`, `truncation_recovered`, `context_guard_triggered` | a Section Record, research file or bundle file cannot be written after the Section's work began; S9 compile stops mid-bundle | `done`, `paused`, `context_guard`, `error` |
| `/lvr-continue` | `session_start`, `resume` | `tier_changed`, `capability_probe_*`, `booster_*`, `research_logged` (web check), and everything `/lvr-init-new-idea` emits for the resumed Section(s) | a recovery command fails after a partial write; otherwise as `/lvr-init-new-idea` | as `/lvr-init-new-idea` |
| `/lvr-handoff` | `session_start`, `handoff_started` | `gap_found`, `doc_generated`, `handoff_done`, `booster_uninstalled` (end-of-pipeline uninstall, with consent) | `blueprint.json`, the stubs or `HANDOFF-PROMPT.md` cannot be written after the lint started | `done`, `cancelled`, `error` |
| `/lvr-review-plan` (formerly `/lvr-recheck-plan`) | `session_start`, `review_started` | `review_done`, `research_logged`, `agent_delegated` (fresh-context pass), `booster_installed`; `--apply` only: `doc_generated` (with `decisions` via `decision record`) | an `--apply` run stops with fixes half-applied; the report or ledger cannot be written | `done`, `cancelled`, `error` |
| `/lvr-add-feature` | `session_start`, `feature_started` | `feature_captured`, `feature_research`, `research_logged`, `context_research`, `impact_analysis`, `feature_scope_decision`, `feature_applied` (with `decisions`, `milestones`, `product`), `framework_selected` (library slot), `agent_delegated`, `booster_installed`, `feature_done` | bundle edits stop after some files changed and before `feature_applied` | `done`, `cancelled`, `error` |
| `/lvr-build` | `session_start`, then `build_blocked` (preflight) or `build_started` | `milestone_started`, `milestone_verified`, `milestone_failed`, `deployment_verified`, `release_checked`, `build_done`, `booster_uninstalled` | its own bookkeeping fails (the `VERIFICATION.md` log or `state.json` cannot be written) — a failing product is `milestone_failed`/`build_blocked`, never `error` | `done`, `paused`, `cancelled`, `error` |
| `/lvr-personal-brand` | `session_start`, `brand_started` | `brand_file_generated`, `brand_done` | a brand file cannot be written mid-kit | `done`, `cancelled`, `error` |
| script only | — | `schema_migrated` (`state migrate`), `resume` (`replay --write --journal-resume`), `restored: true` events (`journal restore-from-state`, which sets `orig_ts` on a re-recorded v2 event so the original time survives replay) | — | — |

### Replay coverage (v2)

Replay always builds a v2 state. Every event type is replayable; informational types have no state effect.

| Events | Replay effect | Not reproducible (gap) |
|---|---|---|
| `session_start`, `session_end` | `sessions[]` (+ restore from `error`) | runs before v2 other than init wrote no `session_start`: they have no session |
| `folder_gate_*`, `context_guard_triggered`, `truncation_recovered`, `gap_found`, `doc_generated`, `scope_locked`, `impact_analysis`, `feature_captured`, `feature_research`, `feature_scope_decision`, `feature_done`, `milestone_started`, `milestone_failed`, `build_blocked`, `brand_file_generated`, `brand_done`, `schema_migrated` | informational (`scope_locked` and `doc_generated` feed the replay report) | — (by design: no state field) |
| `recheck_finding`, `recheck_research_refresh`, `recheck_fix_applied`, `recheck_done` (legacy, written only by `/lvr-recheck-plan` before its rename) | informational | by design: older rechecks are not mapped into `review`; their reports stay in `.lvr/recheck/` |
| `tier_declared`, `tier_changed`, `capability_probe_*` | `model_profile` (+ session `tier`) | — |
| `booster_check`, `booster_install_ok\|failed`, `booster_choice` | `boosters.core\|enhancer` | unstamped journals: licences and never-mentioned core boosters come from disk |
| `booster_installed`, `booster_uninstalled` | `boosters.installed[]` + status lists + session | — |
| `section_start`, `section_done`, `section_blocked`, `answer_recorded` | `pipeline.sections`, `current_section`, `project.status` (+ restore, + session) | unstamped journals: answer text, record names and S8 milestones come from disk; text that exists nowhere stays null |
| `loop_back_opened\|closed` | `pipeline.loop_backs` | — |
| `handoff_started`, `recheck_started`, `review_started`, `feature_started`, `brand_started`, `resume` | restore from `error` (`review_started` also `review`) | — |
| `handoff_done`, `build_started`, `build_done`, `milestone_verified`, `deployment_verified` | as §Project status enum / v1 | unstamped: a milestone known only from disk is verified after the fold |
| `review_done`, `framework_selected`, `agent_delegated`, `release_checked` | §v2 events | — |
| `feature_applied` | payload extensions | unstamped: post-lock decisions and milestones come from disk |
| `error` | `project.status`, `project.error` | — |
| `research_logged`, `context_research` | `pipeline.research` | an event without `id` (hand-written) is counted, not indexed |
| any event's `project`, `decisions[]`, `milestones[]`, `product`, `coverage` | folded after the typed effect | — |

`journal restore-from-state` re-records the v2 fields too (`product` and `coverage` on its `resume` carrier; `booster_installed`/`booster_uninstalled`, `framework_selected`, `release_checked`, `review_started`/`review_done`, `agent_delegated` with their original ids, all `restored: true`), except `sessions[]` and `pipeline.research`: those cannot be re-created without inventing them, and it reports `sessions_not_restored` and `research_not_restored` instead.

## Schema versions and migration

- `schema_version` 2 is current. `lvr.mjs version` reports `"lvr_schema": 2`; replay and fresh states are always v2. A project whose `schema_version` is higher than the script knows is refused by **every** command that reads a project (exit 1, `SCHEMA_TOO_NEW`; `details.found`, `details.supported`, hint: update all LVR skills together): nothing is read past the version, written, rewritten or downgraded, and `.lvr/` must not be edited by hand. Skills are updated together because they share one state file.
- A **v1 project** — `.lvr/state.json` with `schema_version: 1`, or a legacy `.lvp/` folder (the pre-rename name) without `.lvr/` — is readable by every read-only command. Every command that writes the journal or state refuses with `MIGRATION_NEEDED` (exit 1, nothing written) until it is migrated. Exempt: `replay`, `journal restore-from-state`, `state migrate` (the recovery paths).
- **`state migrate [--check] [--remove-legacy]`.**
  - `--check` writes nothing and reports `needed`, `from`, `to`, `folder` (`.lvr` or `.lvp`), `state_sync`, `blocked` (`null` or `{code, hint}`), `legacy_folder`; every verdict is data (exit 0).
  - Without `--check` it migrates, or answers `needed: false` and writes nothing on a v2 project (running it twice is a no-op).
  - Refusals (exit 1, nothing written): `MIGRATION_BLOCKED` (`state_sync` `lagging` or `unknown`: run `replay --compare`, then `replay --write --force`, which writes v2), `STATE_UNREADABLE`/`STATE_INVALID` (a corrupt v1 state takes the normal recovery path, `replay --write`, never migration), `STATE_MISSING` (rebuild with `replay --write`), `NO_JOURNAL` (`journal restore-from-state` first), `LEGACY_CONFLICT` (`.lvr/` holds other files but no project while `.lvp/` holds one), `SCHEMA_TOO_NEW`, `NO_LVR`; `JOURNAL_BEHIND_STATE` keeps exit 3 (`journal restore-from-state`, then migrate).
- **What migration does.** Under the lock:
  1. Back up `state.json`, `journal.ndjson` and `.state-seq` into `.lvr/migrations/v1-to-v2-<stamp>/` (staged, then renamed into place; `manifest.json` with sha256 per file, written last, marks it complete; an existing complete backup of the same `state.json` is reused).
  2. Append one `schema_migrated` event.
  3. Write the v2 state atomically: the v1 `state.json` **unchanged** (every value, unknown keys included) plus the v2 keys, whose values are what replay of the journal (with that event) gives — so sessions and the research index of a v1 project are filled from its existing `session_start` and research events, `project.error` comes from the journal only when the v1 status is `error`, and everything else gets its default.
  4. Move `.state-seq` to the new event when the state was in sync (an untracked state stays untracked).

  The journal is never rewritten. Replay of the v1 journal plus `schema_migrated` gives the same v2 fields; for a journal written by the script, the whole migrated state equals the replay.
- **A damaged `.lvp` project has one recovery path that ends in v2.** Every blocked verdict above names `replay --write` (`--force` for a lagging state) or `journal restore-from-state` as the next command. On a folder that holds only `.lvp/`, those two commands first copy `.lvp/` to `.lvr/` (the same staged copy; `.lvp/` is never touched; the output says `copied_from: ".lvp"`) and then run the normal `.lvr` recovery, which writes a v2 state (a damaged `state.json` is kept as `state.corrupt-<date>.json`). `replay --compare` and the other read commands on a `.lvp`-only folder answer `NO_LVR` with that hint. After the rebuild `state migrate` answers `needed: false`. A `.lvp` project rebuilt this way has no migration backup manifest, so `--remove-legacy` refuses (`LEGACY_DIFFERS`) and `.lvp/` stays.
- **Interrupted migration.** Re-running `state migrate` finishes it. A crash before the backup is complete leaves a temporary folder the next run removes; a crash after the append and before the state write is detected (the journal ends with `schema_migrated` whose `state_sha256_before` matches the v1 state) and no second event is appended; a crash after the state write leaves nothing to do (the next write heals `.state-seq`).
- **`.lvp/` projects are copied, never renamed or deleted.** The whole `.lvp/` tree (minus lock and temporary files) is copied to a staging folder and renamed to `.lvr/` in one step, then migrated as above; `.lvp/` stays byte-identical. `.lvp/` is removed only by `state migrate --remove-legacy`, run only after the user agreed, and only when every file in it is unchanged in `.lvr/` (the old journal a byte prefix of the new one, the old `state.json` equal to the backup copy); otherwise it refuses with `LEGACY_DIFFERS` and lists the files. Legacy journals keep their `lvp-*` skill names. Mentions of `.lvp/` in bundle files are reported (`legacy_refs`), never edited.
- **When.** Every skill except `/lvr-init-new-idea` runs `state migrate --check` in its preflight, before `session_start`; `needed` and not `blocked` → `state migrate` and one plain line to the user (and, after a `.lvp/` copy, one question whether to remove `.lvp/`, default keep); `blocked` → `/lvr-continue` follows its recovery for `blocked.code`, other skills stop and recommend `/lvr-continue`.
- **Without Node** (prose fallback): copy `state.json` and `journal.ndjson` to `.lvr/migrations/v1-to-v2-<date>/` (for `.lvp/`, first copy the whole folder to `.lvr/`), add the v2 keys with their defaults keeping every existing value, set `schema_version` 2, write the state, append `schema_migrated` (`from`, `to`, `backup`). Sessions and the research index stay empty until a scripted rebuild fills them (they then show as additions, never as losses).
- `replay --write` over a valid v1 `state.json` (with `--force`) first makes the same backup (`via: "replay"`) and never treats the version change itself as a loss.

## Section records

File: `.lvr/docs/sections/S<N>-<name>.md` (e.g. `S3-data.md`). Content: the section's questions, the user's verbatim answers (User Language), and the section's decision summary (English, written by the Conductor). These are the **only** inputs S9 compiles, plus `decisions[]` and `milestones[]`.

Language rule: records keep answers verbatim in User Language; the Conductor adds an English summary per answer. S9 compiles English documents from the summaries; OVERVIEW.md additionally reflects the verbatim intent.

## Folder Gate (mandatory first step of `/lvr-init-new-idea`)

1. `cwd` contains `.lvr/state.json` (or a legacy `.lvp/state.json` / `.lvp/journal.ndjson`) → **refuse init**; print progress summary; recommend `/lvr-continue` (which migrates a legacy project).
2. `cwd` is empty (ignore OS junk: `.DS_Store`, `Thumbs.db`, `desktop.ini`) → **proceed in place**.
3. `cwd` has project markers (`.git`, `package.json`, `Cargo.toml`, `pubspec.yaml`, `pyproject.toml`, `go.mod`, `.solution`, `*.csproj`, …) and no `.lvr/` → **refuse**: existing project detected. Recommend running init in an empty/new folder; mention `/lvr-review-plan` as the plan review option for that project.
4. `cwd` has ≥1 subdirectory with project markers (e.g. `~/projects/`) → **create subfolder** `./<slug>/` (slug from idea, confirm with user), proceed there; an existing empty `./<slug>/` (junk files aside; left by a run that stopped at the web research check) is reused instead of taking `<slug>-2`. Journal: `folder_gate_subfolder_created`.
5. `cwd` non-empty, no markers (loose files) → **ask the user**: proceed here or create subfolder (recommend subfolder).

Web UI variant: the UI supplies an absolute path via a folder picker; the same checks run before interview start. UI surfaces the gate result as a screen, not a log line.

## Checkpoint & resume semantics

- **Checkpoint moments** (journal write + state save): every session start/end, every answer, every Section start/done, every research step (`research_logged` / `context_research`), every booster install/uninstall/choice, every delegation start and result, every framework pick, every review start/done, every release check, every generated file, every error, handoff steps.
- Interruption-safe: any session that dies leaves a consistent `state.json` (last checkpoint) — work loss is at most the current unanswered micro-batch.
- `/lvr-continue` rebuild: load `state.json`; if unreadable → replay journal; report what was reconstructed. A rebuild may preserve the corrupt state file once as `.lvr/state.corrupt-<date>.json` before overwriting; it is not part of the canonical write set.
- Idempotency: sections marked `done` are never re-run; re-running `/lvr-handoff` re-lints instead of regenerating everything (regeneration is explicit, per file).
