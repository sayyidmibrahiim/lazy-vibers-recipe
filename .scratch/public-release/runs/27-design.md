# 27 design: state/journal schema v2, full replay coverage, v1 → v2 migration

Designer: Opus, 2026-11-20. Implementer: Sonnet (phase 2). This is the design. It changes no code.

Normative text written in this phase (the implementer codes to it):
- `docs/spec/01-state.md` (schema v2, events, ownership, replay table, migration)
- `skills/lvr-conventions.md` §1–§3 and §9 (synced to every skill's `references/conventions.md`)
- `docs/spec/07-research.md` §5 (one sentence: the research events now have a v2 state effect)
- `docs/spec/03-skills.md` (the `/lvr-build` write list)

Sources read:
- ticket 27 and its comments: V-05 (`error` ownership) and 26-Q5 (`pipeline.research`)
- ticket 39 §A (`sessions[]`)
- research/K rows C4, C5, C9, A5, P2
- tickets 05, 06, 08, 09, 12, 16, 17, 25, 31, 32, 36, 38; research/J §3 (S5b record); research/L §5.8 (ledger)
- spec 01, spec 07 §5, conventions, `scripts/lvr.mjs` (b0b10c9)
- 02-design §0, §1, §2.6

Baselines were captured with the **v1** script before any code change (`.scratch/public-release/fixtures/27/baseline/`, see §12). They cannot be regenerated after phase 2.

---

## 0. Decisions (summary)

1. **One schema number.** `schema_version` 2 for `state.json`. `lvr.mjs version` reports `lvr_schema: 2`, and each SKILL.md checks for `"lvr_schema":2`. Replay always builds the newest schema.
2. **Additive only.** Every v1 field keeps its meaning, shape and reducer effect, so a v1 event folds into the v1 fields exactly as before. The v2 fields are new keys, with a default at fresh/migrated state. Consequence: for a CLI-written v1 project, `migrate(state) == replay_v2(journal + schema_migrated)`, byte for byte (the main migration test).
3. **Nine new event types** (51 → 60):
   - `session_end`
   - `booster_installed`, `booster_uninstalled`
   - `agent_delegated`
   - `framework_selected`
   - `review_started`, `review_done`
   - `release_checked`
   - `schema_migrated` (script-only)

   Two v1 events gain a state effect:
   - `session_start` builds `sessions[]` (strict payload for new appends)
   - `research_logged` / `context_research` fill `pipeline.research`

   Two new payload extensions, alongside `project` / `decisions[]` / `milestones[]`: `product` and `coverage`. Product type is an S1 *answer*, so it rides that answer's checkpoint and needs no event type of its own. Add-feature flag flips ride `feature_applied`.
4. **State holds indexes, the journal holds detail.** `pipeline.research` keeps ids, U-ids and failed ids, not payloads. `review` is a pointer plus the last run's verdict, not the ledger. `framework_decision` holds what build preflight needs (`recheck_by`, chosen id/version), not the score matrix. Reason: T3 reloads `state.json` every turn.
5. **The error stash moves into state.** `project.error` holds `{seq, ts, skill, step, message, previous_status}`. The restoring event copies it into the opening session as `recovered_error`. This is needed now: every skill opens with `session_start`, which restores the status, so `/lvr-continue` can no longer read `"error"` from the loaded state. It reads `sessions[-1].recovered_error` instead.
6. **Sessions are attributed from state only.** The "current session" is the last `sessions[]` entry with `ended_at: null`. That makes the attribution identical live and in replay. A `session_start` never closes an earlier open session: `ended_at: null` honestly means "no `session_end` recorded" (crash, kill, or legacy).
7. **A v1 project must migrate before any write.** Every journal-writing command refuses `MIGRATION_NEEDED` (exit 1, nothing written) on a v1 state or a `.lvp/`-only folder. Recovery commands are exempt: `replay`, `journal restore-from-state`, `state migrate`. Read-only commands accept both versions. We do not migrate silently, because "LVR skills degrade loudly, never silently". Every non-init skill runs `state migrate --check` in its preflight.
8. **Migration grafts, it never rebuilds.** v2 state = the v1 `state.json` verbatim (unknown keys and hand repairs included), plus the v2-only fields taken from `replay_v2(journal + schema_migrated)`. A rebuild would drop the 45 leaves that prose journals cannot reproduce (baseline `futsal-v1-replay-diff.json`).
9. **`.lvp/` is copied, never renamed or deleted.** The copy is staged in `.lvr.migrating-*` and renamed into `.lvr/` in one step. `.lvp/` stays byte-identical. It is removed only by `state migrate --remove-legacy` after the user said yes, and only when every file in it is verified to exist unchanged under `.lvr/` (§7.6).
10. **Backups live inside the project** at `.lvr/migrations/v1-to-v2-<stamp>/`. A `manifest.json` written last marks a backup complete. The journal is never rewritten: migration appends exactly one `schema_migrated`, and a re-run after any crash point never appends a second one.

---

## 1. State schema v2

Root key order (canonical): `schema_version, project, product, pipeline, decisions, boosters, model_profile, milestones, deployment, handoff, framework_decision, release_check, review, agents_delegated, sessions`.

```jsonc
{
  "schema_version": 2,
  "project": { /* v1 keys */ "slug": "", "name": "", "idea_raw": "", "user_language": "", "created_at": null, "status": "interview",
    "error": null },                     // v2: { seq, ts, skill, step, message, previous_status } while status = "error"
  "product": { "types": [], "flags": {}, "updated_at": null },
  "pipeline": {
    "current_section": "S0", "sections": {}, "loop_backs": [],
    // section entry v2 adds optional "coverage": { "<fact-key>": ["S0.q1", "D-003", "U-04"] }
    "research": {
      "brief": { "rq": [], "findings": [], "updated_at": null },
      "scans": {},                       // "S2": { "rq": ["RQ-006"], "findings": ["U-09"], "note": null, "at": "<ts>" }
      "log": { "count": 0, "failed": [], "last_id": null, "last_at": null },
      "web_check": null                  // { "id": "RQ-001", "outcome": "found|failed", "reason": null, "at": "<ts>" }
    }
  },
  "decisions": [],
  "boosters": { "core": [], "enhancer": [], "installed": [] },
  "model_profile": { "tier": null, "probe": null, "declared_at": null },
  "milestones": [], "deployment": null, "handoff": null,
  "framework_decision": null,
  "release_check": {},
  "review": null,
  "agents_delegated": [],
  "sessions": []
}
```

The JSON above is also `freshState()` for v2.

### 1.1 Field table

"Absent" means the key is missing from a v2 file. The validator then warns `W_MISSING_KEY` ("read as default"), the same as v1 already does for `deployment` / `handoff`, and the reducer creates the key with `??=` before writing to it.

| Field | Type / shape | Default | Written by | Validation (E = error, W = warning) |
|---|---|---|---|---|
| `schema_version` | `2` | 2 | fresh state, replay, `state migrate` | E_SCHEMA_VERSION unless 1 or 2. Value 1 is validated with the v1 rules and adds W_SCHEMA_V1 ("run `state migrate`") |
| `project.error` | null \| `{seq:int≥1, ts:ISO, skill:str\|null, step:str\|null, message:str\|null, previous_status:<status ≠ error>}` | null | `error`; cleared by the restoring events | E_PROJECT_ERROR if non-null while status ≠ `error`, or on a bad shape. W_ERROR_DETAIL_MISSING if status = `error` and this is null (prose writer or migrated prose state) |
| `product.types` | array of unique strings `^[a-z][a-z0-9-]{0,31}$` (profile ids, ticket 08/09) | `[]` | `product` extension: **replaces** the list | E_PRODUCT on format or duplicates. Format only in 27; ticket 08 may add W_PRODUCT_TYPE_UNKNOWN against `references/profiles/` |
| `product.flags` | object `^[a-z][a-z0-9_]*$` → boolean | `{}` | `product` extension: **merges** per key | E_PRODUCT on a non-boolean. W_PRODUCT_FLAG_UNKNOWN for a key outside `stores_data, has_ui, has_llm, regulated_domain` (catches typos; new flags are added to the list) |
| `product.updated_at` | ISO \| null | null | ts of the last event carrying `product` | E_PRODUCT |
| `pipeline.sections.<S>.coverage` | optional object, fact-key `^[a-z0-9][a-z0-9_.-]*$` → array of evidence ids (`S<n>.q<n>`, `D-NNN`, `U-NN`, `RQ-NNN`). An empty array means not yet known | absent | `coverage` extension: per fact-key replace | E_COVERAGE. Container reserved for ticket 16 (C5): 16 chooses the fact keys, not the shape. "6 of 9 facts known" = non-empty count / key count |
| `pipeline.research.brief` | `{rq:[RQ ids], findings:[U ids], updated_at:ISO\|null}` | as shown | `context_research` scope `brief` | E_RESEARCH (`^RQ-\d{3,}$`, `^U-\d{2,}$`, unique) |
| `pipeline.research.scans` | object S1…S8 → `{rq:[RQ], findings:[U], note:str\|null, at:ISO}` | `{}` | `context_research` scope `scan` | E_RESEARCH (key S1–S8). The key's presence means "this Section's scan ran" (ticket 32 resume) |
| `pipeline.research.log` | `{count:int≥0, failed:[RQ], last_id:RQ\|null, last_at:ISO\|null}` | as shown | both research events | E_RESEARCH. `failed` lists the ids that unverified markers may name |
| `pipeline.research.web_check` | null \| `{id:RQ\|null, outcome:found\|failed, reason:str\|null, at:ISO}` | null | `research_logged` with `purpose: web_check` (the last one wins) | E_RESEARCH |
| `boosters.installed[]` | `{name, kind:skill\|mcp\|agent, repo:str, sha:hex7–40\|null, scope:project\|user, harness:str, path:str, tier:core\|enhancer\|null, section:S\|null, consent:bool, status:installed\|uninstalled, installed_at:ISO, uninstalled_at:ISO\|null}` | `[]` | `booster_installed` / `booster_uninstalled` | E_BOOSTER_INSTALL on a bad shape, on duplicate `(name, path)`, on scope `project` with an absolute path or `..`, on kind `mcp` with consent ≠ true, or on status/uninstalled_at disagreeing. W_BOOSTER_NO_SHA when sha is null. `tier` is null only for kind `agent` |
| `framework_decision` | null \| Entry + `libraries:[Entry]`. Entry = `{slot:str, decision_id:D-NNN, chosen:{id, name:str\|null, version:str\|null}, alternatives:[{id, score:number\|null}], confidence:high\|medium\|low, user_override:bool, defaulted:bool, signals_ref:{path, sha256}\|null, recheck_by:YYYY-MM-DD, section:S\|null, decided_at:ISO}` | null | `framework_selected`: slot `stack` (default) sets the top Entry and keeps `libraries`; any other slot upserts into `libraries` by slot | E_FRAMEWORK on a bad shape. W_FRAMEWORK_DECISION_UNKNOWN when `decision_id` is not in `decisions[]`. No time-based check here (validation stays pure); build preflight (ticket 30) compares `recheck_by` with today |
| `release_check` | object, key = a product type or `"default"` (no types set) → `{kind:str, status:passed\|failed, target:str\|null, evidence:str\|null, checked_at:ISO}` | `{}` | `release_checked` | E_RELEASE on a bad shape. W_RELEASE_KIND_UNKNOWN for a kind outside `url_2xx, package_install, mcp_tools_listed, workflow_import_run, skill_trigger, extension_load, store_build, build_runs` (ticket 31 list). W_RELEASE_TYPE_UNKNOWN for a key that is neither in `product.types` nor `default` |
| `review` | null \| `{ledger:".lvr/review/LEDGER.jsonl", runs:int≥0, last:null\|{run:int≥1, scope:full\|scope-only, started_at:ISO, done_at:ISO\|null, verdict:BUILD-READY\|FIX-THEN-BUILD\|NOT-READY\|INCOMPLETE\|null, score:0–10\|null, lens_scores:{L01…:0–10}\|null, open:{blocking,major,minor:int≥0}\|null, missed_earlier:int≥0\|null, report:str\|null, ledger_sha256:hex64\|null}}` | null | `review_started`, `review_done` | E_REVIEW. `done_at` null ⇔ verdict null |
| `agents_delegated[]` | `{id:AG-NNN, task:str, profile:str, profile_sha:str\|null, transport:native\|prompt\|inline, harness:str\|null, model:str\|null, tier:T1\|T2\|T3\|null, section:S\|null, status:started\|done\|failed, started_at:ISO, ended_at:ISO\|null, record:str\|null, reason:str\|null}` | `[]` | `agent_delegated` | E_AGENT: unique id; `ended_at` non-null ⇔ status ≠ started; `failed` needs `reason`. A `started` entry with no later result is what continue re-runs (C9) |
| `sessions[]` | `{start_seq:int≥1, skill:str, harness:str\|null, session_id:str\|null, session_id_reason:str\|null, model:str\|null, tier:T1\|T2\|T3\|null, cwd:str\|null, started_at:ISO, ended_at:ISO\|null, end_reason:done\|paused\|context_guard\|error\|refused\|null, sections:[S], agents:[AG], boosters_installed:[name], boosters_uninstalled:[name], recovered_error:null\|{seq, skill, step, message}}` | `[]` | `session_start` (creates), `session_end` (closes), attribution (§3) | E_SESSION: `start_seq` unique and ascending; `session_id` null ⇒ `session_id_reason` non-empty; `end_reason` non-null ⇔ `ended_at` non-null. Resume commands (ticket 39) read `harness` + `session_id` |

Key orders for the new objects, used by `canonicalState`:
- `project.error`: seq, ts, skill, step, message, previous_status
- `product`: types, flags, updated_at
- `research`: brief, scans, log, web_check
- `brief`: rq, findings, updated_at
- scan: rq, findings, note, at
- `log`: count, failed, last_id, last_at
- `web_check`: id, outcome, reason, at
- installed: name, kind, repo, sha, scope, harness, path, tier, section, consent, status, installed_at, uninstalled_at
- framework Entry: slot, decision_id, chosen, alternatives, confidence, user_override, defaulted, signals_ref, recheck_by, section, decided_at, libraries
- release: kind, status, target, evidence, checked_at
- review: ledger, runs, last
- last: run, scope, started_at, done_at, verdict, score, lens_scores, open, missed_earlier, report, ledger_sha256
- agent: id, task, profile, profile_sha, transport, harness, model, tier, section, status, started_at, ended_at, record, reason
- session: start_seq, skill, harness, session_id, session_id_reason, model, tier, cwd, started_at, ended_at, end_reason, sections, agents, boosters_installed, boosters_uninstalled, recovered_error
- `release_check` and `scans` keys sort like sections (S-order); `release_check` keys sort alphabetically

Unknown keys stay W_UNKNOWN_KEY, as in v1. They are kept on write, never dropped.

### 1.2 What is deliberately NOT in state
- **No `S5b` section key.** Research/J §Placement: S5b is a substep of S5. Mid-S5b is visible as S5 `in_progress` with `framework_decision` still null.
- **No `scope_locked` field.** It is still derived (conventions §5).
- **No full research log** (the journal has it), **no ledger rows**, **no score matrix**, **no `doc_generated` list.** Ticket 28's variable bundle lives in `blueprint.json`.

---

## 2. Payload extensions (v2)

Like `project`, these may ride **any** event. The reducer applies them after the typed effect, and `validatePayload` checks them.

- **`product`**: `{ types?: [ids], flags?: {key: bool} }`. `types` replaces `product.types`; `flags` merges key by key; `updated_at = ts`. An empty object is an error (INVALID_PAYLOAD `product`). Typical carriers: the S1 product-type `answer_recorded`, and `feature_applied` for an add-feature flag flip (ticket 29 A3).
- **`coverage`**: `{ "<S>": { "<fact-key>": [evidence ids] } }`, keyed by Section, so it needs no `section` field on the carrier. Each fact key replaces its own array. A Section missing from state is created `{status: "pending"}`. Carriers: `section_start` (map seeded from S0 and earlier answers) and `answer_recorded`.

---

## 3. Events: payloads, validation, replay effect

Stamp, sidecar, lock and checkpoint behaviour are **unchanged** for every event: one journal line (stamped `cli:"lvr"`), then one state write under the lock, and heal/adopt/lag exactly as in v1. "Live" below means `validatePayload` + the reducer in a checkpoint. Replay folds the same reducer.

**Session attribution.** `cur` = the last `sessions[]` entry whose `ended_at` is null, or none.
- After their typed effect, `section_start`, `answer_recorded`, `section_done` and `section_blocked` add `section` to `cur.sections` (unique, in first-touch order).
- `agent_delegated` (started) adds its id to `cur.agents`.
- `booster_installed` adds its name to `cur.boosters_installed`, and `booster_uninstalled` adds it to `cur.boosters_uninstalled` (both unique).
- `tier_declared` / `tier_changed` set `cur.tier`.
- With no `cur`, nothing is attributed. That is the normal case for v1-era runs other than init.

### 3.1 Changed v1 events

| Event | Payload (live validation) | Replay / live effect |
|---|---|---|
| `session_start` | `skill` required, `^lvr-[a-z0-9-]+$`. `session_id` str or null/absent; when null/absent, `session_id_reason` must be a non-empty str. Optional: `harness` (`^[a-z0-9-]+$`), `model` (str), `tier` (T1–T3), `cwd` (str). A missing reason → INVALID_PAYLOAD `session_id_reason`. Never invent an id (ticket 39, D12) | Push a session: `start_seq = seq`, `started_at = ts`, `ended_at`/`end_reason` null, empty lists. `tier = p.tier ?? model_profile.tier`. **Legacy event** (no `session_id` and no `session_id_reason` key, stamped or not): `session_id: null`, `session_id_reason: "not recorded (written before session tracking)"`, `harness`/`model` null. Then **restore from error** (§4); `recovered_error` lands on this new session |
| `tier_declared`, `tier_changed` | unchanged | unchanged, plus `cur.tier` |
| `section_start`, `answer_recorded`, `section_done`, `section_blocked` | unchanged | unchanged, plus attribution |
| `error` | `skill`, `step`, `message`: non-empty str (new: v1 did not validate them) | If status ≠ error: `project.error = {seq, ts, skill, step, message, previous_status: status}`, status = `error`. If already error: update seq/ts/skill/step/message and keep `previous_status` |
| `resume`, `handoff_started`, `recheck_started`, `feature_started`, `brand_started` (+ new `review_started`) | unchanged | restore from error (§4) |
| `research_logged` | spec 07 §5, unchanged | `log.count += 1`; `last_id = p.id ?? last_id`; `last_at = ts`. On `outcome: failed`, push the id to `log.failed`. On `purpose: web_check`: `web_check = {id, outcome, reason, at: ts}` |
| `context_research` | spec 07 §5, unchanged | Same `log` effect. On `scope: brief`, append the id to `brief.rq`, union `findings` into `brief.findings` (first-appearance order), `brief.updated_at = ts`. On `scope: scan`, the same into `scans[section]` (create it), plus `note = p.note ?? old`, `at = ts` |

Research events are still valid before `state.json` exists. The S0 materialisation replays them, so live and replay stay equal.

### 3.2 New events

| Event | Payload (live validation; violations → INVALID_PAYLOAD `{field, expected}`) | Effect |
|---|---|---|
| `session_end` | `reason`: `done\|paused\|context_guard\|error\|refused`. Optional `start_seq` (int). Live: the target session (the `start_seq` one, else `cur`) must exist and be open, else INVALID_PAYLOAD `start_seq` ("an open session") | target: `ended_at = ts`, `end_reason = reason`. Replay: no target → `report.untranslatable` |
| `booster_installed` | `name`, `repo`, `harness`, `path`: non-empty str. `kind`: skill\|mcp\|agent. `scope`: project\|user. `sha`: hex 7–40 or null. Optional `tier` (core\|enhancer), `section`, `consent` (bool). kind `mcp` ⇒ `consent: true`. scope `project` ⇒ relative `path` without `..`, `/` separators. scope `user` ⇒ absolute path or `~/…` | Upsert `installed[]` by `(name, path)`: all fields, status `installed`, `installed_at = ts`, `uninstalled_at` null. If kind ≠ agent, also `putBooster(name, {repo, status: "installed", tier: p.tier ?? existing ?? "enhancer"})`. Attribution |
| `booster_uninstalled` | `name`, `path` (non-empty). Optional `reason` | Entry `(name, path)`: status `uninstalled`, `uninstalled_at = ts`. If kind ≠ agent and no other entry of that name is still `installed`, the status-list entry becomes `missing` (state says what is on disk now; the next skill's `booster_check` / ticket 36 re-install starts from there). Unknown or already-uninstalled entry: replay untranslatable; live refused by the guard (§9 item 7, INVALID_PAYLOAD `path`) |
| `agent_delegated` | `status`: started\|done\|failed. **started**: `task` (`^[a-z0-9-]+$`), `profile`, `transport` (native\|prompt\|inline) required; optional `profile_sha`, `harness`, `model`, `tier`, `section`. **No `id`**: the script assigns `AG-NNN` (max over journal `agent_delegated` ids + 1, ≥3 digits) and returns `id` in the envelope; a payload `id` → INVALID_PAYLOAD (exception: `restored: true`). **done**: `id` required, optional `record`. **failed**: `id` + non-empty `reason` | started: push the entry (status started, `started_at = ts`), attribution. done/failed: the entry with that id and status started gets status, `ended_at = ts`, and `record`/`reason`. Unknown or already-closed id → replay untranslatable / live no-op + guard (§9) |
| `framework_selected` | `decision_id` (D-NNN), `chosen.id` (non-empty), `alternatives` (array of `{id, score?}`), `confidence`, `user_override` (bool), `defaulted` (bool), `recheck_by` (calendar date, not before the event's day). Optional `slot` (default `stack`, `^[a-z0-9-]+$`), `chosen.name`, `chosen.version`, `signals_ref` `{path, sha256}`, `section`. Usually carries `decisions[]` with the D-NNN | slot `stack`: `framework_decision = {…Entry, decided_at: ts, libraries: old?.libraries ?? []}`. Other slot: upsert into `framework_decision.libraries` by slot. **A non-stack slot while `framework_decision` is null is refused** (live guard, §9 item 7: INVALID_PAYLOAD `slot`, "a stack decision first"; replay: untranslatable). Mini S5b in add-feature always runs after S5b |
| `review_started` | `run` (int ≥1), `scope` (full\|scope-only) | Restore from error. `review ??= {ledger: ".lvr/review/LEDGER.jsonl", runs: 0, last: null}`; `runs = max(runs, run)`; `last = {run, scope, started_at: ts, everything else null}` |
| `review_done` | `run`, `verdict` (enum), `score` (0–10), `open` `{blocking, major, minor}`, `missed_earlier` (int ≥0), `report` (str). Optional `lens_scores`, `ledger_sha256` | If `review.last.run === run` and `done_at` is null: fill it, `done_at = ts`. Else replay untranslatable / live guard (§9) |
| `release_checked` | `kind` (`^[a-z][a-z0-9_]*$`), `status` (passed\|failed). Optional `product_type` (default `"default"`), `target`, `evidence` | `release_check[product_type] = {kind, status, target, evidence, checked_at: ts}`. Independent of `deployment_verified`: for a web product, `/lvr-build` writes both |
| `schema_migrated` | **Reserved.** `journal append --type schema_migrated` → EVENT_RESERVED (exit 1). Only `state migrate` writes it: `{from: 1, to: 2, via: "migrate", backup, state_sha256_before, legacy_folder: ".lvp"\|null, script_version}` | **None** (informational). Replay always builds v2, so `replay(J + m) == replay(J)` |

`agent_delegated` id assignment works like `research log`: inside the lock, before `appendLocked`, in `journal append`'s run (`agentAppend`). `journal check` gains `duplicate_ag_ids`, which makes the journal not healthy, mirroring `duplicate_rq_ids`.

---

## 4. Error state and its exit (V-05)

**Restore from error.** This is the rule for every restoring event: `session_start`, `resume`, `handoff_started`, `recheck_started`, `review_started`, `feature_started`, `brand_started`, and `section_start|section_done|section_blocked|answer_recorded` before their own effect.

When `project.status = "error"`:
1. Copy `{seq, skill, step, message}` of `project.error` to `cur.recovered_error`, if there is a `cur` and its `recovered_error` is null.
2. `status = project.error.previous_status`. When `project.error` is null (prose state), fall back to v1's `computeStash` / `"interview"`.
3. Set `project.error = null`.

`computeStash` stays only as that fallback. For v2 states the stash is in state, so heal and replay need no prior-event fold.

**`/lvr-continue` branch a** ("retry the failed step") is decided from `sessions[-1].recovered_error`, the session continue itself just opened. It is no longer decided from the status it loaded. The rebuild path gets it the same way, because replay rebuilds `recovered_error`.

**When each skill journals `error`.** One rule for every skill: an unrecoverable failure stopped the run *after* it wrote something, and the run cannot finish that step. Append `error` (payload `skill`, `step` = the SKILL.md step id, plain `message`) before telling the user, then `session_end` with `reason: "error"`.
- Never journal `error` for a refusal: nothing was written; the run ends with `session_end` `refused`.
- Never for probe, milestone or build failures; they have their own events.
- Never for context pressure: `context_guard_triggered`, then `session_end` `context_guard`.
- If the journal itself cannot be written, `error` cannot be journaled either. Say so plainly and stop.

The per-skill triggers are in the ownership table (§5).

---

## 5. Event ownership

Every skill run: preflight (version, `state migrate --check`), then `session_start`, then the skill's own opening event, then work, then `session_end`. Init writes `session_start` as journal line 1, after the Folder Gate.

| Skill | Opening event(s) | Emits during the run | `error` when (V-05) | Closes |
|---|---|---|---|---|
| `/lvr-init-new-idea` | `session_start` (after the gate creates the journal) | `folder_gate_passed\|_subfolder_created` (a `folder_gate_rejected` only when a journal already exists), `tier_declared`, `capability_probe_*`, `booster_check`, `booster_installed` (06; legacy `booster_install_ok\|_failed`), `booster_choice`, `research_logged`, `context_research`, `section_start\|answer_recorded\|section_blocked\|section_done` S0–S9 (with the `product`/`coverage`/`decisions`/`milestones`/`project` extensions), `loop_back_opened\|closed`, `scope_locked`, `framework_selected` (12, S5b), `review_started\|review_done` (38, scope-only at S7), `agent_delegated` (17), `doc_generated`, `truncation_recovered`, `context_guard_triggered` | a Section Record, research file or bundle file cannot be written after the Section's work began; S9 compile stops mid-bundle | `session_end` done \| paused \| context_guard \| error |
| `/lvr-continue` | `session_start`, then `resume` (`state_rebuilt`, position) | `tier_changed`, `capability_probe_*`, `booster_check`/`booster_installed`/`booster_choice`, `research_logged` (web check), plus everything init emits for the resumed Section(s) and compile. Script-written: `resume` via `replay --write --journal-resume`, `schema_migrated` via `state migrate`, `restored: true` events via `restore-from-state` | a recovery command fails after a partial write (a backup made but the state not written); otherwise as init for resumed work | as init |
| `/lvr-handoff` | `session_start`, `handoff_started` | `gap_found`, `doc_generated`, `handoff_done`, `booster_uninstalled` (06/36: end-of-pipeline uninstall with consent) | `blueprint emit`, `handoff stubs` or `handoff prompt` fails after the lint started | done \| refused (scope not locked) \| error |
| `/lvr-recheck-plan` (→ `/lvr-review-plan`, 38) | `session_start`, `recheck_started` (legacy) / `review_started` (38) | `recheck_finding`, `recheck_research_refresh`, `recheck_fix_applied`, `recheck_done` (legacy); `review_done`, `research_logged`, `agent_delegated` (R11), `booster_installed` (36) | `--apply` stops with fixes half-applied; the report or ledger cannot be written | done \| refused \| error |
| `/lvr-add-feature` | `session_start`, `feature_started` | `feature_captured`, `feature_research`, `research_logged`, `context_research`, `impact_analysis`, `feature_scope_decision`, `feature_applied` (+`decisions`/`milestones`/`product`), `framework_selected` (non-stack slot, mini S5b), `agent_delegated`, `booster_installed`, `feature_done` | bundle edits stopped after some files changed and before `feature_applied` | done \| refused \| error |
| `/lvr-build` | `session_start`, then `build_blocked` (preflight) or `build_started` | `milestone_started`, `milestone_verified`, `milestone_failed`, `deployment_verified`, `release_checked` (31), `build_done`, `booster_uninstalled` (36, when build is the last step) | its own bookkeeping fails (cannot append the `VERIFICATION.md` log, cannot write state). A failing product is `milestone_failed`/`build_blocked`, never `error` | done \| paused \| refused \| error |
| `/lvr-personal-brand` | `session_start`, `brand_started` | `brand_file_generated`, `brand_done` | a brand file write fails mid-kit | done \| refused \| error |

Which tickets wire the new events into skill text:
- **27 (this ticket):** `session_start`/`session_end` + `error` rules in every SKILL.md, the migrate preflight, and `lvr_schema` 2.
- 06/36: `booster_installed|uninstalled`
- 17: `agent_delegated`
- 12/29: `framework_selected`
- 38: `review_*`
- 31/30: `release_checked`
- 08: `product`
- 16: `coverage`

---

## 6. Replay coverage after v2 (all 60 types)

"v1 effect" = unchanged from v1. "Gap" marks what replay cannot reproduce, or reproduces only through the legacy disk fallbacks.

| Event | Replay rule (v2) | Gap |
|---|---|---|
| `session_start` | creates a session (§3.1); restores from error | v1-era runs other than init have no session (no event existed). Shown as "not recorded" |
| `session_end` | closes the session | none |
| `folder_gate_passed`, `folder_gate_rejected`, `folder_gate_subfolder_created` | informational | none |
| `tier_declared`, `tier_changed` | v1 effect + `cur.tier` | none |
| `capability_probe_passed`, `capability_probe_failed` | v1 effect | none |
| `context_guard_triggered`, `truncation_recovered` | informational | none |
| `booster_check`, `booster_install_ok`, `booster_install_failed`, `booster_choice` | v1 effect | unstamped legacy journals: license / never-mentioned-core fills from disk (v1 gap, unchanged) |
| `booster_installed`, `booster_uninstalled` | §3.2 | none |
| `section_start`, `section_done`, `section_blocked` | v1 effect + attribution (+ restore) | unstamped: S8 milestones and the record name fall back to disk (v1) |
| `answer_recorded` | v1 effect + attribution | legacy payloads without q/a: text from Section Records; some text exists nowhere (futsal: 7 leaves) |
| `loop_back_opened`, `loop_back_closed` | v1 effect | none |
| `scope_locked` | informational (`report.scope_locked_seq`) | by design: no state field |
| `doc_generated` | informational (`report.docs_generated`) | by design: the bundle file list is `blueprint.json` (28) |
| `handoff_started` | restore from error | none |
| `gap_found` | informational | none |
| `handoff_done` | v1 effect | none |
| `recheck_started` | restore from error | none |
| `recheck_finding`, `recheck_research_refresh`, `recheck_fix_applied`, `recheck_done` | informational | **by design**: legacy rechecks are not mapped into `review`; their reports stay in `.lvr/recheck/` |
| `review_started`, `review_done` | §3.2 | none |
| `feature_started` | restore from error | none |
| `feature_captured`, `feature_research`, `impact_analysis`, `feature_scope_decision`, `feature_done` | informational (extensions still fold) | none |
| `feature_applied` | extensions (`decisions`, `milestones`, `product`) | unstamped: post-lock decisions/milestones from disk (v1) |
| `framework_selected` | §3.2 | none |
| `agent_delegated` | §3.2 | none |
| `build_started`, `build_done` | v1 effect | none |
| `milestone_started`, `milestone_failed`, `build_blocked` | informational | none |
| `milestone_verified`, `deployment_verified` | v1 effect | unstamped: a milestone that exists only on disk is applied after the fold (v1) |
| `release_checked` | §3.2 | none |
| `brand_started` | restore from error | none |
| `brand_file_generated`, `brand_done` | informational | none |
| `error` | §3.1 (`project.error`) | none |
| `resume` | restore from error (+ restored carrier extensions) | none |
| `research_logged`, `context_research` | §3.1 (`pipeline.research`) | a prose event without `id` is counted, not indexed |
| `schema_migrated` | informational | none |
| any extension (`project`, `decisions`, `milestones`, `product`, `coverage`) | folded after the typed effect | none |

`journal restore-from-state` (JOURNAL_BEHIND_STATE) gains v2 coverage. Each re-appended event is `restored: true`:
- `product`: a carrier extension on the restore `resume`
- `coverage`: a carrier extension
- `boosters.installed[]`: `booster_installed` (+ `booster_uninstalled`)
- `framework_decision`: `framework_selected` per slot
- `release_check`: `release_checked`
- `review.last`: `review_started` (+ `review_done`)
- `agents_delegated[]`: `agent_delegated` started (+ done/failed), with the original id (allowed when restored)

**Not restorable (reported, never invented):**
- `sessions[]`, reported as `sessions_not_restored: n`. A new `session_start` would describe a different session.
- `pipeline.research`, reported as `research_not_restored: true`. The RQ ids are assigned and the payloads are gone.

`restorePass`'s own `session_start` now carries `session_id: null, session_id_reason: "restored from state.json"`.

---

## 7. Migration v1 → v2

### 7.1 Version handling in the script (all commands)
- `loadState` validates by `schema_version`: 1 → v1 rules, 2 → v2 rules. Anything else → `invalid` with E_SCHEMA_VERSION; for a number > 2 the message reads "made by a newer LVR: update the skills". The result carries `schema: 1|2`.
- **Write guard** `guardSchema(dir)`, run next to `guardJournalBehind`, before anything is appended. It fires on `journal append`, `answer record`, `decision record`, `research log`, `booster check --journal`, `lint run --journal` and `state write`:
  - state schema 1, or no `.lvr/` but a legacy `.lvp/` with a state or journal → `MIGRATION_NEEDED` (exit 1, nothing written), `details: {from: 1, folder, hint: "Run \`state migrate\` first; it keeps the old files in .lvr/migrations/."}`.
  - `state write` with a v1 document → STATE_INVALID (E_SCHEMA_VERSION).
- **Exempt (recovery):** `replay` (all modes), `journal restore-from-state`, `state migrate`.
- **Read-only commands accept both versions:** `state validate|get`, `journal check|tail`, `lint`, `crosscheck`, `blueprint emit --check`, `cite check`, `handoff install-lines`. They read only v1 fields. `blueprint emit` without `--check` writes a bundle file, not `.lvr/`, so it is not guarded.
- `needLvr`: no `.lvr/` but a `.lvp/` → `NO_LVR` with `details.legacy_folder: ".lvp"` and the migrate hint.
- `gate check`: check 1 also refuses a folder holding `.lvp/state.json` or `.lvp/journal.ndjson` (recommend `/lvr-continue`). `.lvp` joins `SKIP_DIRS`.
- `replay --write` over a valid **v1** `state.json` (needs `--force`): first back it up exactly like migration (`backupV1(dir, "replay")`, §7.3). `lossyPaths` ignores `/schema_version`. v2-only pointers are absent in a v1 file, so they are never "held". A corrupt v1 file keeps the existing `state.corrupt-<date>.json` path.
- `version`: `lvr_schema: 2`. `meta events`: the 60 types.

### 7.2 `state migrate` CLI

`node lvr.mjs state migrate [--check] [--remove-legacy] [--dir DIR]`

**Detection** (no writes):

| Folder state | `needed` | Action |
|---|---|---|
| `.lvr/state.json` schema 2 | false | none |
| `.lvr/state.json` schema 1, v1-valid, sync `in_sync` or `untracked`, journal present | true | in-place migration (§7.4) |
| no `.lvr/` (or an empty `.lvr/`), `.lvp/` with `state.json` and/or `journal.ndjson` | true | copy, then in-place migration (§7.5) |
| both `.lvr/` (holding state or journal) and `.lvp/` | per `.lvr/` | `.lvr/` wins; `.lvp/` reported `ignored` (or `kept` when it is a verified source, §7.6) |
| `.lvr/` non-empty without state and journal, plus `.lvp/` | — | `LEGACY_CONFLICT` |
| v1 state unreadable/invalid | — | `STATE_UNREADABLE` / `STATE_INVALID` (corrupt → recovery path: `replay --write`, which writes v2) |
| v1 state absent, journal present | — | `STATE_MISSING` (hint: `replay --write` builds a v2 state) |
| v1 state present, journal absent | — | `NO_JOURNAL` (hint: `journal restore-from-state`, then migrate) |
| sync `lagging` / `unknown` | — | `MIGRATION_BLOCKED` `{state_sync, hint: "replay --compare, then replay --write --force (writes v2)"}` |
| sync `journal_behind_state` | — | `JOURNAL_BEHIND_STATE` (exit 3, as everywhere; restore-from-state, then migrate) |
| nothing LVR here | — | `NO_LVR` |
| `schema_version` > 2 | — | `SCHEMA_UNSUPPORTED` |

**`--check`** never writes. Every verdict above is data, exit 0 (only usage errors and `NO_LVR` exit non-zero):

```json
{"ok":true,"cmd":"state migrate","check":true,"needed":true,"from":1,"to":2,"folder":".lvr|.lvp",
 "state_sync":"in_sync|untracked|lagging|unknown|journal_behind_state|null",
 "blocked":null,
 "legacy_folder":{"path":".lvp","status":"absent|copy-pending|kept|ignored"},
 "written":false}
```

`blocked` is otherwise `{"code":"MIGRATION_BLOCKED|STATE_INVALID|STATE_UNREADABLE|STATE_MISSING|NO_JOURNAL|JOURNAL_BEHIND_STATE|LEGACY_CONFLICT|SCHEMA_UNSUPPORTED","hint":"…"}`.

**Migrate** (success, exit 0):

```json
{"ok":true,"cmd":"state migrate","needed":true,"migrated":true,"from":1,"to":2,
 "seq":112,"healed":false,"copied_from":".lvp|null",
 "backup":".lvr/migrations/v1-to-v2-20261120T100000Z/","backup_reused":false,
 "added":["/project/error","/product","/pipeline/research","/boosters/installed","/framework_decision","/release_check","/review","/agents_delegated","/sessions"],
 "derived":{"sessions":1,"research_events":0,"coverage_sections":0,"error_detail":false},
 "state":{"written":true,"sidecar":"tracked|untracked"},
 "legacy_folder":{"path":".lvp","status":"kept","remove_hint":"…"},
 "legacy_refs":[{"file":"AGENTS.md","line":12}],
 "journal_warnings":[]}
```

`legacy_refs` lists `.lvp/` mentions in bundle files, as a report only; migration never edits bundle files. Lint/handoff surface them later.

Not needed: `{"ok":true,"needed":false,"migrated":false,"schema_version":2,"written":false}` (exit 0).

**Exit codes:**
- 0: success, not needed, or any `--check` verdict
- 1: the refusals in the table (`MIGRATION_BLOCKED`, `STATE_*`, `NO_JOURNAL`, `LEGACY_CONFLICT`, `LEGACY_DIFFERS`, `SCHEMA_UNSUPPORTED`, `NO_LVR`), `LOCKED`, `MIGRATION_COPY_FAILED`, `STATE_WRITE_FAILED`, `JOURNAL_WRITE_FAILED` (with `details.errno`)
- 2: usage
- 3: `JOURNAL_BEHIND_STATE` only

New codes: `MIGRATION_NEEDED`, `MIGRATION_BLOCKED`, `MIGRATION_COPY_FAILED`, `LEGACY_CONFLICT`, `LEGACY_DIFFERS`, `SCHEMA_UNSUPPORTED`, `EVENT_RESERVED`.

### 7.3 Backup layout

`.lvr/migrations/v1-to-v2-<YYYYMMDDTHHMMSSZ>/` (stamp from `now()`, so `LVR_NOW` makes it deterministic) holds:
- `state.json` and `journal.ndjson`, plus `.state-seq` if present. Byte copies, each fsynced.
- for a `.lvp` source, also `legacy-manifest.json`: every `.lvp/` file's relative path + sha256, used by `--remove-legacy`.
- `manifest.json`, **written last**: `{from, to, via: "migrate"|"replay", source: ".lvr"|".lvp", created_at, journal_max_seq, files: {name: sha256}}`.

Creation: copy into `<dir>.tmp-<pid>-<rand>`, fsync, then rename to the final name. Under the lock, a leftover `*.tmp-*` folder in `migrations/` is ours and is removed. A complete backup whose `manifest.files["state.json"]` equals sha256(current `state.json`) is **reused** (`backup_reused: true`), never duplicated.

### 7.4 In-place algorithm (under `.lvr/.lock`)

1. Preconditions per §7.2. `j = readJournal`, `S1 = state.json` (v1-valid), `h = sha256(bytes of state.json)`.
2. **Heal check.** If the journal's last event is a stamped `schema_migrated` with `to: 2` and `state_sha256_before === h`, a previous run crashed after its append. Reuse that event `m` (`healed: true`) and skip steps 3–4.
3. Backup (§7.3), or reuse one.
4. Build `m` = `{type: "schema_migrated", payload: {from: 1, to: 2, via: "migrate", backup, state_sha256_before: h, legacy_folder, script_version}}`, with seq/ts as `appendLocked` assigns them.
5. **Graft.** `R = replayEvents(dir, [...j.events, m]).state` (v2), then `S2 = clone(S1)` with:
   - `schema_version = 2`
   - `project.error = (S1.project.status === "error") ? R.project.error : null` (null + W_ERROR_DETAIL_MISSING when replay has none)
   - `product`, `pipeline.research`, `boosters.installed`, `framework_decision`, `release_check`, `review`, `agents_delegated`, `sessions`: taken from `R`
   - `pipeline.sections.<S>.coverage = R…coverage` for each Section present in **both**

   Everything else stays as S1 has it, unknown keys included. Then `validateState(S2)`: errors → `STATE_INVALID` (nothing written yet), never expected.
6. Append `m` (unless healed). Write `state.json` atomically (canonical). Sidecar: if S1's sidecar was `num` (in sync), write `m.seq`. If it was absent (untracked prose state), write none, as any untracked write does today.
7. Report `added`, `derived`, `legacy_refs`.

**Crash windows** (each also a test, §12). Each is resolved by simply re-running `state migrate`:

| Killed after | Disk | Re-run |
|---|---|---|
| backup staging, before its rename | `migrations/*.tmp-*` | removes the tmp folder, migrates normally |
| backup complete | backup + v1 state, journal unchanged | reuses the backup (same sha), migrates |
| journal append | v1 state, journal tail = `m` | heal check: no second append, writes v2 |
| state write, before sidecar | v2 state, sidecar = m.seq − 1 | `needed: false`. The next CLI write heals: the one stamped event ahead is `m`, whose effect is none, so `healed` is empty and the sidecar is rewritten |

Running migrate twice (no crash) gives `needed: false`, writes nothing, and leaves the journal line count, the backup count and the state bytes unchanged.

### 7.5 `.lvp/` → `.lvr/`: copy, not rename

**Decision: copy.** Reasons:
1. The instruction is "never delete the old folder without consent". A rename removes `.lvp/`, and anything keyed on that path breaks: the user's `.gitignore`, backups, an old LVP skill still installed. The copy leaves it byte-identical.
2. A crash at any point leaves the source untouched. The copy is staged and renamed in one step, so a half-copied `.lvr/` never exists.
3. The files are small text (the futsal `.lvp/` is under 100 KB), so the duplicate costs nothing.

Steps:
1. Take the root lock `<project>/.lvr-migrate.lock` (O_EXCL, stale after 30 s, like `withLock`). Remove any leftover `<project>/.lvr.migrating-*` (ours).
2. Copy the `.lvp/` tree into `<project>/.lvr.migrating-<pid>-<rand>/`. Skip `.lock` and `*.tmp-*`. Keep mtimes. Fsync the files.
3. `rename(staging, ".lvr")`. If `.lvr` appeared meanwhile, run detection again.
4. In-place migration (§7.4) on `.lvr/`, with `source: ".lvp"` in the manifest, `legacy-manifest.json` in the backup, and `legacy_folder: ".lvp"` in `m`.
5. Release the root lock.

**Crash between 3 and 4:** `.lvr/` is a v1 copy. The re-run migrates it in place. `legacy_folder` is still `.lvp` because `.lvp/journal.ndjson` is a byte prefix of `.lvr/journal.ndjson`.

**Journals are not rewritten.** A legacy journal keeps `"skill":"lvp-init-new-idea"`, so `sessions[0].skill` honestly says `lvp-init-new-idea`.

### 7.6 `--remove-legacy` (only after the user said yes)

The command deletes `.lvp/` only when **all** of these hold:
- `.lvr/state.json` is schema 2
- a complete backup with `source: ".lvp"` exists
- `.lvp/journal.ndjson` is a byte prefix of `.lvr/journal.ndjson`
- `.lvp/state.json` sha equals the backup's `state.json`
- every other `.lvp/` file is byte-equal to the same path under `.lvr/`

Otherwise it refuses `LEGACY_DIFFERS` (`details.files`) and deletes nothing. Output: `{removed: true, files: n}`, or `{removed: false, reason: "absent"}` when there is no `.lvp/`. The skill asks once, right after a migration from `.lvp/` (English source): "Your project's files are now in `.lvr/`. The old `.lvp/` folder is still here, unchanged. Remove it? (Everything in it is also in `.lvr/`.)" The default is keep. On "yes" it runs `--remove-legacy`.

### 7.7 When skills call it

Every skill **except `/lvr-init-new-idea`** does this in its preflight (the "Script helper" paragraph), after `version`, before `session_start`:
1. Run `LVR state migrate --check`.
2. If `needed` and not `blocked` → run `LVR state migrate`, then one plain line (English source): "This project was made with an older LVR version. I updated its bookkeeping files to the new format; the old files are kept in `.lvr/migrations/`." If `copied_from` is `.lvp`, ask the §7.6 question.
3. If `blocked` → `/lvr-continue` goes to Step 2 with `blocked.code`: the lagging/unknown/missing/invalid routes write v2 through `replay --write`, and restore-from-state is followed by migrate. Every other skill stops and recommends `/lvr-continue`.

Init never migrates: its Folder Gate refuses any folder with `.lvr/` or `.lvp/` state and recommends `/lvr-continue`.

Why every skill and not only continue: users run `/lvr-build` or `/lvr-handoff` directly on an old project. Without the preflight, their first `session_start` fails `MIGRATION_NEEDED`. The check costs one read-only call.

**Prose fallback (no Node).** Conventions §2 tells the model to:
1. Copy `state.json` + `journal.ndjson` to `.lvr/migrations/v1-to-v2-<date>/` (for `.lvp/`: copy the whole folder to `.lvr/` first).
2. Add the v2 keys with their defaults, keeping every existing value, and set `schema_version` 2.
3. Write the state, then append `schema_migrated` `{from, to, backup}`.

The derived lists (`sessions`, `pipeline.research`) stay empty. A later scripted `replay --compare` shows them as additions, never as losses.

---

## 8. Mixed versions (risk, not fixable in code)

An older installed skill (v1 script) on a v2 project sees `E_SCHEMA_VERSION`, maps it to `STATE_INVALID`, and its hint says `replay --write`. That would back up the v2 file as `state.corrupt-<date>.json` and write a **v1** state. No data is lost, but the project is downgraded. The v1 script also flags the v2 event types as `unknown_types`. v1 code cannot be changed, so the mitigation is policy: all LVR skills ship and update together (installer, tickets 18/35). See the open question.

---

## 9. Script change list (implementer checklist)

1. **Constants.**
   - `LVR_SCHEMA = 2`; `EVENT_TYPES` = **exactly** the conventions "Event types:" line, same order: the 9 types sit next to their families (`session_end` after `session_start`; `booster_installed`, `booster_uninstalled` after `booster_choice`; `review_started`, `review_done` after `recheck_done`; `release_checked` before `build_done`; `framework_selected`, `agent_delegated` after `build_done`; `schema_migrated` last). `check:skills` compares the two lists in order.
   - `KEYS` additions and orders per §1.1.
   - `RESTORING` set += `review_started`.
   - Enums: product flags, release kinds, session end reasons, review verdicts, booster kinds/scopes, agent transports.
2. **`freshState()`**: the §1 document.
3. **`validateState`**: dispatch on version (v1 rules unchanged; v2 = v1 rules for v1 keys + §1.1 rows). W_SCHEMA_V1 on v1 files.
4. **`canonicalState`**: new key orders. `scans` / `release_check` key sort.
5. **`validatePayload`**:
   - §3 rows plus the `product` and `coverage` extensions
   - strict `session_start` and `error`
   - EVENT_RESERVED for `schema_migrated` outside `state migrate` (pass an internal flag)
   - `agent_delegated` id rule with the `restored` exception
6. **`applyEvent`**:
   - §3, §4 effects: the `cur` attribution helper; `project.error` stash/restore (keep `computeStash` as the fallback when `project.error` is null)
   - `??=` for every v2 container
   - the extensions after the typed effect
7. **Live guard for stateless-unverifiable payloads** (`booster_uninstalled`, `agent_delegated` done/failed, `review_done`, `session_end`). In `appendLocked`, after `loadState` and before appending, check the target exists in the current state. If not → INVALID_PAYLOAD, nothing written. When the state is not loadable, skip the check (replay will report untranslatable). Reason: a no-op live event that replay calls untranslatable would be a silent loss.
8. **`journal append`**: `agentAppend` (id assignment under the lock, like `researchAppend`). `readJournal`: `duplicate_ag_ids`.
9. **`guardSchema`**, `needLvr` legacy details, `gateCheck` `.lvp`, `SKIP_DIRS` `.lvp`.
10. **`replayEvents`**: no structural change (the reducer does the work); the report adds `sessions: n`, `research_events: n`. **`lossyPaths`**: ignore `/schema_version`. **`cmdReplay --write`**: `backupV1` for a valid v1 file.
11. **`restorePass`**: §6 v2 coverage plus the two report counters; restored `session_start` payload.
12. **New command `state migrate`** (§7). Crash injection for tests: env `LVR_TEST_CRASH_AFTER=copy|rename|backup-staged|backup|journal|state` calls `process.exit(137)` right after that step. Document it in `--help` next to `LVR_NOW`.
13. **`usage()`**: exit-code text gains `MIGRATION_NEEDED`. Run `npm run sync:skills`.

## 10. Skill text changes (implementer, same ticket; sync `references/` after)

- All 7 SKILL.md: `"lvr_schema":1` → `2`; the migrate preflight (§7.7, not init); `session_start` (payload `skill`, `harness`, `session_id` or `session_id_reason`, `model`, `tier`, `cwd`) as the first append of the run; `session_end` at every exit, with the reason; the `error` line from §5 for that skill.
- `lvr-init-new-idea` Step 1.3: the new `session_start` payload. The "schema_version: 1" line at ~155 → 2, plus the v2 keys in its fresh-state description.
- `lvr-continue`:
  - Step 2 recovery map: `MIGRATION_BLOCKED` → the route for `details.state_sync`.
  - 2b replay table: the v2 rows (§6) for the prose fallback.
  - Branch a: read `sessions[-1].recovered_error`.
  - Step 1 refusal text: a `.lvp/` folder is a project that needs migration.
- `lvr-init-new-idea` Folder Gate check 1 and conventions §6 (done in this phase): `.lvp/state.json` counts.

## 11. Spec text written in this phase

- `docs/spec/01-state.md`: layout (`migrations/`), schema v2 block + field notes, `project.error`, event list, payload extensions, new-event table, ownership table, replay coverage table, the migration section, Folder Gate check 1.
- `skills/lvr-conventions.md`: header `schema_version: 2`, §1 layout, §2 schema v2 + field notes + error rule, §3 event list + new events + ownership, §6 gate, §9 migration preflight.
- `docs/spec/07-research.md` §5: the research events fill `pipeline.research` in v2.
- `docs/spec/03-skills.md` `/lvr-build` write list: + `release_check`, session events.

**State after phase 1.** The spec and conventions describe v2. The script is still v1. `npm run sync:skills` copied the conventions. `npm run check:skills` reports exactly one problem, "Event types differ between scripts/lvr.mjs and skills/lvr-conventions.md", and that is expected until phase 2 updates `EVENT_TYPES`. The SKILL.md texts still say `lvr_schema` 1 / `schema_version: 1` until §10 is done.

## 12. Test plan (fixtures under `.scratch/public-release/fixtures/27/`)

Layout: `make.mjs` builds the CLI cases with `LVR_NOW=2026-11-20T10:00:00Z`. `run.sh` replays and asserts on temp copies (same shape as fixtures/03: `replay --compare --print-state`, `diff == []`, plus `assert.json` pointer pairs). `migrate.sh` runs the migration cases. Fixtures are never written in place.

**Baselines (already captured by the designer with the v1 script; read-only):**
- `baseline/v1_cli/`: a stamped v1 project (20 events): `session_start`, a web_check `research_logged`, T2 + probe, `booster_check`, S0 with project + 2 `context_research` brief (one failed), S1 scan, `error` → `resume` restore, a skipped answer, a failed claim research, `section_blocked`, then a final `error`, so the state ends in status `error`. Sidecar 20, in sync. v1 `replay --compare` diff `[]`.
- `baseline/futsal-v1-replay-diff.json`: the 45 pointers v1 replay cannot reproduce on the futsal dogfood (prose journal).
- `baseline/lvp_futsal/`: the pre-rename futsal project from git `c0975b2^`. `.lvp/` holds the state, the journal (110 events, `lvp-*` skill names) and the records; the bundle files mention `.lvp/` in AGENTS.md, DECISIONS.md, ASSUMPTIONS.md and HANDOFF-PROMPT.md.
- `baseline/make-v1.mjs`: how they were made (needs the v1 script from git).

**Event cases** (one folder each; live state from the CLI, replay `diff == []`, `untranslatable == []` unless stated):
1. `session_start_end`:
   - init session with `session_id` null + reason, then `tier_declared` → `sessions[0].tier`
   - S0 → `sections: ["S0"]`; `session_end` done
   - a second session with a real `session_id`
   - refusal: `session_end` with no open session → INVALID_PAYLOAD, journal unchanged
   - `session_start` without a reason → INVALID_PAYLOAD
2. `booster_lifecycle`:
   - `booster_installed` skill (project scope) → `installed[0]`, status list `installed`, `cur.boosters_installed`
   - mcp without consent → INVALID_PAYLOAD
   - `booster_uninstalled` → entry `uninstalled`, status list `missing`
   - re-install at the same path → one entry, `installed` again
   - uninstall of an unknown path → INVALID_PAYLOAD (live guard)
3. `agent_delegated`:
   - started without id → envelope `id: "AG-001"`, `cur.agents`
   - done with `record`; second started → AG-002; failed with reason
   - `done` for AG-009 → INVALID_PAYLOAD
   - started carrying an id → INVALID_PAYLOAD
4. `framework_selected`:
   - stack with `decisions[]` D-005 → `framework_decision` set, no warning
   - library slot `payments` → `libraries[0]`
   - stack with an unknown decision id → W_FRAMEWORK_DECISION_UNKNOWN
   - library before stack (separate folder) → INVALID_PAYLOAD `slot`
5. `review`:
   - `error` → `review_started` restores status + `recovered_error` on the open session
   - `review_done` run 1 → verdict/score/open
   - `review_done` run 2 without a start → INVALID_PAYLOAD
6. `release_checked`:
   - product types `["web", "cli"]` via the `product` extension; `release_checked` web url_2xx passed and cli package_install failed
   - an unknown kind → W_RELEASE_KIND_UNKNOWN
7. `research_summary`:
   - web_check found, then web_check failed (outcome failed, reason) → `web_check` = the last one
   - `context_research` brief + scan S2 (note); a failed claim → `log.failed`; `log.count` = 5
   - events logged **before** S0 `section_start` → present after materialisation
8. `extensions`:
   - `product` types replace + flags merge (two events), an unknown flag → W_PRODUCT_FLAG_UNKNOWN
   - `coverage` on `section_start` S4, then on `answer_recorded` (key replace) → "facts known" count
9. `error_flow`:
   - `error` → state `project.error` with `previous_status`
   - `session_end` error; new `session_start` → status restored, `project.error` null, `sessions[1].recovered_error.seq` = the error's seq
   - `error` payload missing `step` → INVALID_PAYLOAD
10. `reserved`: `journal append --type schema_migrated` → EVENT_RESERVED.
11. `restore_v2`: a v2 project with every v2 field; delete the last 8 journal lines; then `journal restore-from-state`:
    - `journal check` shows `in_sync`
    - `replay --compare` diff is only under `/sessions` and `/pipeline/research`
    - the counters equal what was lost

**Migration cases** (`migrate.sh`):
12. `v1_cli` → `state migrate`:
    - **(a)** `replay --compare` diff `[]`: migrate == `replay_v2(J + m)`, the decision-2 invariant
    - **(b)** every v1 pointer equals the baseline state (diff restricted to non-v2 pointers = `["/schema_version"]`)
    - **(c)** `project.error` set (status `error`, `previous_status` `interview`), `sessions.length == 1` (the baseline's `resume` opens no session), `sessions[0].sections == ["S0", "S1"]`, `sessions[0].tier == "T2"`, `pipeline.research.log.count == 5`, `log.failed == ["RQ-003", "RQ-005"]`, `web_check.id == "RQ-001"`, `brief.rq == ["RQ-002", "RQ-003"]`, `scans.S1.rq == ["RQ-004"]`
    - **(d)** journal = baseline bytes + exactly 1 line
    - **(e)** the backup files are byte-equal to the baseline
    - **(f)** sidecar = 21
13. `v1_futsal` (copy of the dogfood, untracked prose):
    - migrate → v1 pointers unchanged; `/pipeline/milestones` (unknown key) kept
    - `sessions[0]`: `skill` `lvr-init-new-idea`, `session_id` null, reason "not recorded…"
    - no sidecar written
    - **`replay --compare` diff pointers == `futsal-v1-replay-diff.json` pointers** (the v2 graft adds no new divergence)
14. `lvp_futsal`:
    - migrate → `.lvr/` created, `copied_from: ".lvp"`
    - `.lvp/` byte-identical (sha tree before/after)
    - `legacy_refs` lists the 4 bundle files
    - `sessions[0].skill == "lvp-init-new-idea"`
    - `gate check` on the folder before migrating → check 1 refusal
    - `journal append` before migrating → MIGRATION_NEEDED, nothing created
15. `double`: migrate twice → second `needed: false`; journal lines, `migrations/` entries and state sha unchanged.
16. `interrupted`: for each `LVR_TEST_CRASH_AFTER` value (copy, rename, backup-staged, backup, journal, state; copy/rename on `lvp_futsal`, the rest on `v1_cli`):
    - the crashed run exits 137; re-run without the env
    - the result equals case 12/14 byte for byte (state, journal, one backup, same stamp via `LVR_NOW`)
    - no `*.tmp-*` / `.lvr.migrating-*` left
    - `.lvp/` untouched
    - for `state`: re-run says `needed: false`, then one `journal append` heals (`healed: []`) and the sidecar catches up
17. `corrupt_v1`: truncate `state.json`:
    - migrate → STATE_UNREADABLE exit 1, nothing written; `--check` → `blocked.code` STATE_UNREADABLE, exit 0
    - `replay --write` → `state.corrupt-<date>.json` + v2 state; `--check` → `needed: false`
18. `lagging_v1`: `v1_cli` with sidecar `lag:15` → MIGRATION_BLOCKED; `replay --write --force` → v2 written, a v1 backup in `migrations/` (via `replay`).
19. `both_folders`:
    - `.lvr/` v2 + a stale `.lvp/` → `.lvr/` wins, `legacy_folder.status: ignored`
    - `.lvr/` holding only a stray file + `.lvp/` → LEGACY_CONFLICT
20. `remove_legacy`:
    - after case 14, `--remove-legacy` → `.lvp/` gone, `removed: true`
    - variant: edit `.lvr/docs/sections/S1-context.md` first → LEGACY_DIFFERS listing it, `.lvp/` intact
21. **Regression:** regenerate fixtures 03/04/26/40 with their `make.mjs`. Their expected states become v2; their `session_start` payloads need `session_id_reason`. All their `run.sh` pass. `npm run check:skills` is clean. `node --check scripts/lvr.mjs`.

## 13. Open questions for the owner

1. **Legacy projects have no product type.** Migration leaves `product.types` empty, which means base 20 files and no profiles. Should `/lvr-continue` ask the product-type question on a migrated project that is still in the interview (profiles apply from then on)? Or do legacy projects stay profile-less? Designer default: ask only when S1 is not done; never re-open a done S1.
2. **Mixed skill versions (§8).** Can we state the policy "all LVR skills are installed and updated together; mixed versions are unsupported", with the installer enforcing it? The alternative is a v1-compat shim, which is impossible for already-shipped v1 scripts.
3. **Refused runs as sessions.** The design writes `session_start` before refusal checks, so `/lvr-handoff` refusing on an unlocked scope still shows in the dashboard as a session ended `refused`. Is that the history you want, or should a refused run leave no trace?
