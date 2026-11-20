# 02 design — `lvr.mjs` core (state, journal, replay, gate)

Designer: Opus, 2026-11-19. Implementer: Sonnet. This is the design only. No code exists yet under `scripts/` or `skills/*/scripts/`.

Sources read:
- the ticket
- `research/D-install-and-scripts.md` §2–§4
- `docs/spec/01,02,03,05,06`
- `skills/lvr-conventions.md`
- `skills/lvr-continue/SKILL.md` Step 2b (the replay contract)
- `skills/lvr-init-new-idea/SKILL.md` Steps 1–4 and the loop engine
- the futsal fixture `.scratch/lvp-core/dogfood/run/`
- prior rebuild evidence `.scratch/lvp-core/verify-06-continue/report-corrupt-rebuild.md` and `ERRATA.md`
- tickets 03, 04, 05, 22 and 27
- `INSTALL.md` (ticket 18)

A designer-only prototype of the replay fold is at `/tmp/claude-1000/-home-ibrahim-projects-lazy-vibers-planner/1998a29c-b6f4-4bb3-af53-d8d962405873/scratchpad/proto-replay.mjs`. It is throwaway and must not be copied into the repo. On the futsal fixture it reproduces the live `state.json` except for **46 leaf paths**, all explained in §2.6. That number is where the replay acceptance test in §7 comes from.

---

## 0. Key decisions (summary)

1. **One reducer, two uses.** `applyEvent(state, event, ctx)` is the only state-transition code.
   - `replay` folds it over the whole journal.
   - Every journal-writing command (`journal append`, `answer record`, `decision record`) appends one event and applies the same reducer to `state.json` under one lock. That is the checkpoint.
   - So for any project driven by the CLI, `replay` == live state **by construction**. Research #4's free-form `checkpoint --patch` is dropped: arbitrary JSON patches in the journal would make replay depend on the state shape.
2. **Journal first, then state.** A crash between the two writes leaves the journal one event ahead. The next CLI write heals this by re-applying the last journaled event. All reducer rules are idempotent, so this is safe. No schema change is needed.
3. **Payload extensions, no new event types in ticket 02.** Every event may optionally carry three keys, and the reducer folds them:
   - `project` — a subset of the project fields
   - `decisions[]` — full decision objects
   - `milestones[]` — full milestone objects

   Payloads are already free-form (init Step 1.3), so this is additive. New event types belong to ticket 27. `decision record` therefore attaches decisions to the checkpoint event where they are made (see OD-1).
4. **Two validation levels.** `state validate` reports **errors**, which block writes, and **warnings**. The futsal fixture's deviations from §2 are warnings, so continue 2a still sees it as healthy.
5. **Booster registry is not there yet.** `booster check` reads a minimal registry contract (§2.10). With no registry it returns `REGISTRY_MISSING` (exit 1, JSON). It never crashes and never falls back silently.
6. **Sync.** A separate maintainer script, `scripts/sync-skills.mjs [--check]`, with npm scripts `sync:skills` and `check:skills`. It is added now and limited to `lvr.mjs` plus the `references/` mirrors.

---

## 1. CLI surface

Invocation: `node <path>/lvr.mjs <group> <cmd> [flags]`

The file is ESM, one file, zero dependencies, `node:` builtins only, Node ≥18.0.

### 1.1 Global flags

| Flag | Meaning |
|---|---|
| `--dir <path>` | Project folder (the one holding `.lvr/`). Default: `process.cwd()`. For `gate`, it is the folder being examined. Resolved with `path.resolve`. |
| `--pretty` | Pretty-print the JSON output (2-space). The default is one compact line, which saves tokens. |
| `--help`, `-h` | Plain-text usage for the group or command, on stdout, exit 0. |
| `--version` | Same as `version`. |

**Payload input.** These flags are shared by every command that takes JSON:
- `--payload '<json>'`, or
- `--in <file>`, or
- `--in -` (read stdin).

The input must be one JSON object. Read stdin asynchronously (`for await (const c of process.stdin)`). Do not use `readFileSync(0)`, which raises EAGAIN on some pipes.

**Clock.** The env var `LVR_NOW=<ISO>` overrides the clock, for tests only. Document it in `--help`.

### 1.2 Output envelope

- **Success:** stdout gets one JSON object `{"ok":true,"cmd":"<group> <cmd>", ...data}`. Exit 0.
- **Error:** stdout gets `{"ok":false,"cmd":"...","error":{"code":"<CODE>","message":"<plain English>","details":{...}}}`. Stderr gets one line: `lvr: <CODE>: <message>`.
- **Messages are plain English.** The model translates them for the user. They are skill-side English source, not app UI copy, so the repo's Bahasa Indonesia rule for the Next app does not apply.
- **Paths in JSON output** are relative to `--dir`, with `/` separators. The single exception is the `dir` field, which is absolute.

### 1.3 Exit codes

| Exit | When |
|---|---|
| 0 | Success. This includes **negative verdicts that are data**: a gate refusal, a probe fail, a booster reported missing, a slug reported invalid, journal warnings. |
| 1 | Domain, validation or IO error: anything in §1.5 that is not a usage error. This includes `state validate` finding errors. |
| 2 | Usage error: `UNKNOWN_COMMAND`, `UNKNOWN_FLAG`, `MISSING_FLAG`, `BAD_JSON_INPUT`, `NODE_TOO_OLD`. |

### 1.4 Commands

| Group / cmd | Flags | Success data (besides `ok`, `cmd`) | Writes |
|---|---|---|---|
| `version` | – | `version` (script semver, start `"1.0.0"`), `lvr_schema: 1`, `node`, `platform`, `sha256` (of the running file) | none |
| `meta events` | – | `events: [...]` (the EVENT_TYPES constant, in order) | none |
| `journal append` | `--type T` + payload input; `--no-state` | `seq`, `ts`, `type`, `state: {written: bool, reason?: string, healed: [seq]}`, `journal_warnings: [...]` | journal line, then state.json (§2.4) |
| `journal check` | – | see §2.1 output | none |
| `journal tail` | `--n N` (default 5) | `events: [...]` (last N valid events, payload values over 200 chars truncated with `…`), `last_ts` | none |
| `state validate` | `--file <path>` (default `.lvr/state.json`); `--strict` (warnings count as errors) | `valid: bool`, `errors: [{code, pointer, message}]`, `warnings: [...]` | none |
| `state get` | `--pointer /json/pointer` (default `""`, the whole document) | `value` | none |
| `state write` | `--in <file>`/`-`; `--type T` + `--payload` (journal event); or `--no-journal` | `state: {written: true}`, `seq?` | journal line (unless `--no-journal`), then state.json |
| `answer record` | `--section S`; `--id S1.q3` (optional: auto); `--q`, `--a` or `--in` (JSON `{q, a, skipped?, project?, decisions?, extra?}`); `--skipped`; `--amend` | `answer_id`, `seq`, `ts`, `state: {...}`, `decision_ids: [...]` | journal + state |
| `decision record` | `--event T` (the carrier type, required); `--payload '{carrier payload}'`; `--decision '<json>'` (repeatable), or `--in` (JSON `{event, payload, decisions: [...]}`); `--amend` | `decision_ids`, `seq`, `ts`, `state: {...}` | journal + state |
| `replay` | `--write`; `--force` (overwrite a *valid* state); `--compare [file]` (default current `.lvr/state.json`); `--ignore <ptr,...>` / `--ignore-file <json array>`; `--print-state`; `--out <file>`; `--journal-resume '<extra payload json>'` (only with `--write`) | `report` (§2.6), `sha256` (of the canonical serialization), `diff?: [{pointer, rebuilt, current}]` (values truncated to 120 chars), `state?`, `backup?`, `written: bool`, `seq?` | only with `--write` / `--out` |
| `gate check` | `--idea-slug s` (optional) | §2.7 | none |
| `gate subfolder` | `--slug s` | `project_dir` (relative), `slug_used` | `mkdir <dir>/<free slug>` (one level) |
| `slug make` | `--text "..."` | `slug`, `display`, `valid`, `words`, `issues: [...]` | none |
| `slug validate` | `--slug s` | `valid`, `issues` | none |
| `slug free` | `--slug s`; `--in-dir <parent>` (default `--dir`) | `slug`, `free_slug`, `taken: [...]` | none |
| `probe prompts` | – | `prompts: {json, order, sentence}`, byte-exact from init Step 2 | none |
| `probe grade` | `--step json\|order\|sentence`; `--reply-file f` or `--in -` (raw text, not JSON) | `step`, `pass: bool\|null`, `reason`, `graded: bool`, `checks?` | none |
| `booster check` | `--name <id>` (optional); `--registry <path>`; `--journal` | §2.10 | with `--journal`: one `booster_check` event per booster, each with a state checkpoint |

### 1.5 Error codes (exit 1 unless listed in §1.3)

| Code | When |
|---|---|
| `DIR_NOT_FOUND` | `--dir` does not exist |
| `NO_LVR` | `.lvr/` missing (commands other than `gate`, `slug`, `probe`, `version`, `meta`) |
| `NO_JOURNAL` | journal missing and the event is not `session_start` |
| `UNKNOWN_EVENT_TYPE` | `--type` not in EVENT_TYPES. `details.allowed` = the list |
| `INVALID_PAYLOAD` | `details: {field, expected}` |
| `STATE_MISSING`, `STATE_UNREADABLE`, `STATE_INVALID` | `STATE_INVALID` carries `details.errors` |
| `ANSWER_EXISTS`, `DECISION_EXISTS`, `ID_SECTION_MISMATCH` | |
| `LOCKED` | lock not acquired within 5 s; `details.holder` = the lock file content |
| `STATE_WRITE_FAILED`, `JOURNAL_WRITE_FAILED` | `details.errno` |
| `PATH_OUTSIDE_DIR` | a write target resolves outside `--dir` (and, for `--out`, outside `os.tmpdir()`) |
| `REGISTRY_MISSING`, `REGISTRY_INVALID` | |
| `REPLAY_EMPTY` | no valid event in the journal |
| `REPLAY_WOULD_OVERWRITE_VALID` | `--write` without `--force` on a state that passes validation |
| `FILE_NOT_FOUND` | |

---

## 2. Command semantics

### 2.1 Journal reading (shared by every command that reads the journal)

1. Read `.lvr/journal.ndjson` as UTF-8. Strip one leading U+FEFF. Split on `/\r?\n/`. Record `crlf: true` if any `\r\n` is seen.
2. **Truncated tail.** If the file is non-empty and does not end with `\n`, the last segment is the "tail". If it parses as a valid event, keep it (`tail_missing_newline: true`). If not, mark it `truncated_tail: true` and skip it.
3. **Line validity.** A line is a valid event iff:
   - it parses as JSON, and
   - `seq` is an integer ≥ 1, and
   - `type` is a non-empty string, and
   - `ts` is a string, and
   - `payload` is an object, or absent (absent is treated as `{}`).

   Blank lines are ignored. Any other line goes to `corrupt_lines: [lineNo]` and is skipped. Never throw.
4. **Order and duplicates.** Order by `seq` ascending; for equal `seq`, by file position. A **duplicate seq** keeps the first occurrence by file position and lists the rest in `duplicate_seqs`. Gaps go into `seq_gaps: [[after, before]]`.
5. **Event types.** Types not in EVENT_TYPES go into `unknown_types: [{seq, type}]`. They are kept in the stream; replay treats them as untranslatable.
6. **`journal check` output:** `{path, lines, events, max_seq, last_ts, seq_gaps, duplicate_seqs, corrupt_lines, truncated_tail, tail_missing_newline, crlf, bom, unknown_types, scope_locked_seq, healthy}`. `healthy` is true iff every list is empty and `truncated_tail` is false.

### 2.2 `journal append`

**Event types.** EVENT_TYPES is the 49 names on `skills/lvr-conventions.md:95` (§3 "Event types:"), in that order:

```
session_start folder_gate_passed folder_gate_rejected folder_gate_subfolder_created tier_declared
capability_probe_passed capability_probe_failed context_guard_triggered truncation_recovered tier_changed
booster_check booster_install_ok booster_install_failed booster_choice section_start section_done
section_blocked answer_recorded loop_back_opened loop_back_closed scope_locked doc_generated
handoff_started gap_found handoff_done recheck_started recheck_finding recheck_research_refresh
recheck_fix_applied recheck_done feature_started feature_captured feature_research impact_analysis
feature_scope_decision feature_applied feature_done build_started milestone_started milestone_verified
milestone_failed build_blocked deployment_verified build_done brand_started brand_file_generated
brand_done error resume
```

- The list is identical in every `skills/*/references/conventions.md` (cmp-verified).
- `docs/spec/01-state.md:87` lists only 45: it lacks `section_blocked`, `brand_started`, `brand_file_generated` and `brand_done`. Conventions wins (C2).
- Research/D says "50". That is wrong; the count is 49.
- `sync-skills --check` re-derives the list from conventions line 95 and compares it with `meta events` (§4).

**Required payload fields at append time.** Types not listed below take any object.

| Type | Required |
|---|---|
| `section_start`, `section_done`, `section_blocked` | `section` ∈ `S0…S10` |
| `answer_recorded` | `section`, `answer_id` (prefix = section), `q` string, `a` string\|null, `skipped` bool. `skipped:true` ⇒ `a` must be null. Legacy text-less payloads are accepted **only by replay**, never by append. |
| `loop_back_opened` | `id` (`^L-\d{2,}$`), `from`, `to`, `reason` |
| `loop_back_closed` | `id` |
| `tier_declared` | `tier` ∈ T1\|T2\|T3 |
| `tier_changed` | `old`, `new` ∈ T1\|T2\|T3 |
| `capability_probe_failed` | `step` |
| `booster_check` | `name`, `result` ∈ present\|missing\|degraded |
| `booster_install_ok`, `booster_install_failed` | `name` |
| `booster_choice` | `name` or `booster`, plus `choice` |
| `milestone_verified` | `id` |
| `deployment_verified` | `url` |

Payload extension keys are validated on **any** type when present:
- `project`: an object with only the keys `slug`, `name`, `idea_raw`, `user_language`, all strings.
- `decisions`: an array of the decision shape in §2.3, `id` required.
- `milestones`: an array of `{id, goal, features}`.

**Algorithm.** Everything runs under the lock (§3.2).

1. Read the journal (§2.1). If the journal is missing:
   - allowed only when `type === "session_start"`: create `.lvr/` (`mkdirSync recursive`) and the file;
   - otherwise fail with `NO_JOURNAL`.
2. Compute `seq = max_seq + 1`. Use the maximum, not the last line, so out-of-order files still work. Compute `ts = LVR_NOW ?? new Date().toISOString()`.
3. **State pre-check** (skipped with `--no-state`):
   - **State absent:** if `type === "section_start"` with `section === "S0"`, mark "materialize". Else, if no `section_start` exists in the journal, set `reason: "NO_STATE_YET"` (normal before S0). Else set `reason: "STATE_MISSING"` (damaged; continue must `replay --write`). In both non-materialize cases, append the journal only.
   - **State present but unreadable or invalid (errors):** append the journal only. Set `reason: "STATE_INVALID"` and include `details.errors`. Never overwrite a damaged state here; that is continue's job, with a backup.
   - **State valid:** run the heal step. Re-apply the reducer for the last valid event (the highest seq) onto the loaded state. If that changes the state, add that seq to `healed`. Then apply the new event to the healed state. Validate the result. If there are errors, **abort before writing anything**: `STATE_INVALID` with `details.errors` and the phrase "event rejected: resulting state invalid".
4. **Append.** Open with `'a'`. If the file is non-empty and its last byte is not `\n`, write `\n` first. This keeps the fragment as its own line and never rewrites bytes. Then write `JSON.stringify({ts, seq, type, payload}) + "\n"` (key order fixed: ts, seq, type, payload; LF only), `fsyncSync`, close.
5. **State write.**
   - Materialize: full replay (§2.6) of the journal including the new line, then an atomic write.
   - Valid state: atomic write **only if the new state deep-differs from the loaded file**. Events with no effect, such as `doc_generated`, do not rewrite state.json. This still satisfies the spec's "journal + state write (no field change)" checkpoints, because the state on disk equals the state the write would produce.

### 2.3 State schema rules (`state validate`)

Source: `docs/spec/01-state.md` "state.json schema (v1)" and conventions §2 field notes. Pointers are JSON Pointer (RFC 6901), so `~1` encodes `/`. Answer ids contain `.`, which is why dotted paths are not used.

- **ISO timestamp:** `^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$`.
- **Section id:** `^S(10|[0-9])$`. Order: `S0, S1, …, S10`.

**Errors (E_ codes), which block writes:**

1. The root is an object. `schema_version === 1`.
2. `project` is an object:
   - `slug`, `name`, `idea_raw`, `user_language` are strings (empty allowed);
   - `created_at` is ISO;
   - `status` ∈ `interview|researching|review|bundled|building|complete|error`.
3. `pipeline` is an object:
   - `current_section` is a section id;
   - `sections` is an object whose keys are section ids;
   - `loop_backs` is an array.
4. Each section entry:
   - `status` ∈ `pending|in_progress|done|blocked` (required);
   - `record` is a string if present;
   - `started_at` and `completed_at` are ISO if present;
   - `answers` is an object if present.
5. Each answer:
   - the key matches `^S(10|[0-9])\.q[0-9]+$` and its prefix equals the parent section;
   - the value is `{q: string|null, a: string|null, skipped: boolean}`.
6. Each loop-back: `id` matches `^L-\d{2,}$` and is unique; `from` and `to` are section ids; `reason` is a string; `opened_at` is ISO; `resolved_at` is ISO or null.
7. `decisions` is an array. Each entry:
   - `id` matches `^D-\d{3,}$` and is unique;
   - `section` is a section id;
   - `summary` is a non-empty string;
   - `rationale` is a string;
   - `status` ∈ `user_confirmed|assumed|designer_filled`.
8. `boosters` is `{core: [], enhancer: []}`. Each entry:
   - `name` and `repo` are strings;
   - `license` is a string or null;
   - `tier` ∈ `core|enhancer`;
   - `status` ∈ `installed|missing|failed|degraded`.
9. `model_profile`:
   - `tier` ∈ `T1|T2|T3`;
   - `probe` ∈ `passed|skipped|failed`, or null (null → warning W_PROBE_MISSING);
   - `declared_at` is ISO.
10. `milestones` is an array. Each entry:
    - `id` matches `^M\d+$` and is unique;
    - `goal` is a string;
    - `features` is an array of `^F-\d{2,}$`;
    - `verified` is a bool if present;
    - `verified_at` is ISO or null if present;
    - `verified === true` ⇒ `verified_at` is ISO.
11. `deployment` is absent, null, or `{status: live|pending, url: string, verified_at: ISO|null}`.
12. `handoff` is null or `{status: string, completed_at: ISO}`.

**Warnings (W_ codes), which never block:**

| Code | Condition |
|---|---|
| W_MISSING_KEY | `deployment` absent (read as null); a milestone without `verified` / `verified_at` (read as false / null) |
| W_UNKNOWN_KEY | any key not in the §2 shape. Futsal: `/pipeline/milestones` (conventions: "never mirrored under `pipeline`") |
| W_CURRENT_SECTION | `current_section` ≠ the first section not `done` (S10 when S0–S9 are done). This is the continue 2a repair rule |
| W_SKIPPED_WITH_TEXT | `skipped:true` with non-null `a`. Futsal: S7.q1 |
| W_ANSWER_TEXT_MISSING | `q` or `a` is null while `skipped` is false |
| W_DONE_NO_COMPLETED_AT | |
| W_BOOSTER_TIER_ARRAY | `tier` does not match the array it sits in |
| W_PROBE_MISSING | `probe` is null |

`ok` / `valid` is true iff there are 0 errors (or 0 errors and 0 warnings with `--strict`).

**Expected result on the futsal live state:**
- `valid: true`;
- warnings: W_UNKNOWN_KEY `/pipeline/milestones`, W_MISSING_KEY `/deployment`, W_MISSING_KEY ×8 on `/milestones/0..3/verified|verified_at`, W_CURRENT_SECTION, W_SKIPPED_WITH_TEXT `/pipeline/sections/S7/answers/S7.q1`.

**Canonical serialization** (used for every write and for `sha256`):
- `JSON.stringify(obj, null, 2) + "\n"`, UTF-8, no BOM, LF;
- keys emitted in the canonical §2 order:
  - top level: `schema_version, project, pipeline, decisions, boosters, model_profile, milestones, deployment, handoff`;
  - section entry: `status, record, started_at, completed_at, answers`;
  - answer: `q, a, skipped`;
  - other objects in the spec's order;
- unknown keys appended after the known ones, in their original order;
- `sections` keys sorted S0…S10.

**Atomic write `writeStateAtomic(dir, obj)`:**
1. `tmp = .lvr/state.json.tmp-<pid>-<random hex 6>`, in the same dir.
2. `openSync(tmp,'w')`, `writeSync`, `fsyncSync`, `closeSync`.
3. `renameSync(tmp, state.json)`. On `EPERM`, `EBUSY` or `EACCES`, retry with delays 10, 20, 40, 80, 160, 320, 640, 1000 ms (sync sleep via `Atomics.wait` on a `SharedArrayBuffer`). On final failure, `unlinkSync(tmp)` (ignore errors) and fail with `STATE_WRITE_FAILED`.
4. POSIX only (`process.platform !== "win32"`): open `.lvr` read-only, `fsyncSync`, close; ignore errors.
5. Best-effort cleanup: delete `state.json.tmp-*` files older than 60 s.

**`state write`.**
- Input is a full document. Validate it; errors → `STATE_INVALID`, nothing written.
- With `--type`: journal-append that event first (journal first). Then write the document **with that event's reducer applied on top**, so the next heal is a no-op.
- `--no-journal` exists only for the continue 2a repair write, whose event is the `resume` that the skill appends in the same run (2a's "named interpretation").
- `state write` is the escape hatch. Skills should prefer the event commands, because only they keep replay exact.

### 2.4 Checkpoint commands: `answer record`, `decision record`

Both are thin wrappers that build one event and run the §2.2 algorithm. **One journal line + one state write = one checkpoint.**

**`answer record`**
- `section` is required.
- `id` is optional. Auto id = `S<n>.q<k+1>`, where k = the maximum q number for that section across state answers **and** journal `answer_recorded` payloads. This means a loop-back answer gets a fresh id (as in the fixture's S4.q14).
- If `--id` has a different section prefix → `ID_SECTION_MISMATCH`.
- If the id already exists in state or journal → `ANSWER_EXISTS`, unless `--amend`. An amend appends a new `answer_recorded` for the same id; last event wins.
- `--skipped` forces `a: null`.
- Payload = `{section, answer_id, q, a, skipped, ...extra, project?, decisions?}`.
- Decision objects in `decisions` may omit `id`. Missing ids are assigned in order with `nextDecisionId()` = max over state `decisions[].id`, journal `payload.decisions[].id`, and `DECISIONS.md` rows if the file exists, plus 1, zero-padded to 3 digits.
- A given id already in state → `DECISION_EXISTS` unless `--amend`. `--amend` is refused with `DECISION_EXISTS` when S9 is `done`, because spec 04 says DECISIONS.md rows are never rewritten after S9.

**`decision record`**
- `--event <type>` is the carrier, for example `answer_recorded` (but prefer `answer record --in` with `decisions`), `section_done`, `feature_scope_decision`, `recheck_fix_applied` or `booster_choice`. Its `--payload` must satisfy that type's required fields.
- The decisions go into `payload.decisions[]`. Id assignment works as above.
- This matches init's loop engine step 4: decisions go "into `decisions[]` at the checkpoint where it is made". If the owner approves OD-1, `decision record` without `--event` uses `decision_recorded` instead.

**Write order and crash semantics.** The journal is the source of truth.

| Crash point | Disk after crash | Recovery |
|---|---|---|
| before the journal append completes | journal unchanged, or a partial line without `\n`; state unchanged | The partial line is skipped by every reader (`truncated_tail`). The next append writes `\n` first, so the fragment becomes a separate corrupt line. The lost answer was never acknowledged, so the skill re-asks only that unanswered question. This is spec 01's "work loss is at most the current micro-batch". |
| after the append + fsync, before the rename | journal has event N; state at N-1; maybe a `state.json.tmp-*` | The next CLI write heals by re-applying event N (§2.2 step 3), reports `healed:[N]`, then applies N+1. `replay --compare` also shows the lag. The orphan tmp is cleaned after 60 s. |
| during the rename | Windows: the rename is retried, and the old file stays intact until it succeeds. POSIX: the rename is atomic. | — |

Every reducer rule in §2.6 is idempotent (set / upsert semantics; `started_at ??=`; loop-backs and decisions upsert by id; `error` stashes only when the status is not already `error`). Re-applying one event is therefore always safe.

Only the **last** event is healed, because each CLI checkpoint writes state immediately after its line. A gap of more than one event means something outside the CLI wrote to the journal (the prose fallback). That is detected by `replay --compare`, not healed silently.

### 2.5 Lock

- `.lvr/.lock` is created with `openSync(path, 'wx')` (O_EXCL). Content: `{"pid":..,"ts":..,"cmd":..}`.
- Retry every 25 ms for up to 5 s → `LOCKED`.
- **Stale lock:** if the lock's mtime is older than 30 s, unlink it and retry once.
- Release in `finally`: close the fd **before** `unlinkSync`, because Windows cannot unlink an open file.
- Every command that writes under `.lvr/` takes the lock. Readers do not.

### 2.6 `replay`: fold rules

**Phases**

1. Read the journal (§2.1). With no valid event → `REPLAY_EMPTY`.
2. Build a lazy disk context (each source read once, BOM- and CRLF-safe):
   - Section Records `.lvr/docs/sections/S<n>-*.md`, grouped by section. The file named by the section's `record` comes first, then the others alphabetically.
   - `OVERVIEW.md`, `DECISIONS.md` and `CAPABILITIES.md` in `--dir`.
   - The registry (§2.10), optional.
3. Start from a fresh state:

   ```json
   {"schema_version":1,
    "project":{"slug":"","name":"","idea_raw":"","user_language":"","created_at":null,"status":"interview"},
    "pipeline":{"current_section":"S0","sections":{},"loop_backs":[]},
    "decisions":[],
    "boosters":{"core":[],"enhancer":[]},
    "model_profile":{"tier":null,"probe":null,"declared_at":null},
    "milestones":[],"deployment":null,"handoff":null}
   ```

4. Fold every event in seq order with the reducer below, in mode `"replay"`. In this mode, legacy fallbacks may read disk.
5. Post-fold derivations (below).
6. Canonicalize (§2.3), then validate. Validation errors do not abort a dry replay; they are reported. `--write` refuses on errors (`STATE_INVALID`).

**Reducer.** These are the continue 2b effect rows (`skills/lvr-continue/SKILL.md:52-72`), made exact. `sec(S)` = `pipeline.sections[S] ??= {status:"pending"}`.

| Event | Effect |
|---|---|
| `tier_declared` | `model_profile.tier = p.tier`; `declared_at = ts`. |
| `tier_changed` | `tier = p.new`; `declared_at = ts`; `probe` unchanged (later probe events update it). |
| `capability_probe_passed` / `_failed` | `probe = "passed"` / `"failed"`. |
| `booster_check` | Upsert into `boosters.core` by `name`: `{name, repo: p.repo, license, tier: p.tier ?? "core", status}`. Status = `p.status` if enum-valid, else present→`installed`, missing→`missing`, degraded→`degraded`. `license` precedence: `p.license` → CAPABILITIES.md row whose Name = name → registry entry by name or repo → the V0 table (the 9 rows of init Step 3, `skills/lvr-init-new-idea/SKILL.md:103-115`, embedded as a constant) → null, which is reported. |
| `booster_install_ok` / `_failed` | Upsert by `p.name`: status `installed` / `failed`. |
| `booster_choice` | Upsert by `p.name ?? p.booster`. Choice `2`/`"degraded"` → `degraded`; `3`/`"stop"` → `failed`; `1`/other → unchanged. |
| `section_start` | `x = sec(S)`; if `x.status !== "done"`, then `x.status = "in_progress"`; `x.started_at ??= ts`. For S0–S8 only: `x.answers ??= {}`. S9 and S10 never get `answers`, which matches the fixture: S6 has `{}`, S9 has no key. `current_section = S`. S0: `project.created_at ??= ts`. S5: `project.status = "researching"`. S7: `project.status = "review"`. |
| `answer_recorded` | `x = sec(S)`; `x.answers ??= {}`. Text: if the payload has the key `q` → `{q: p.q, a: p.a}`. Otherwise (legacy) → the record line (below). If that is missing → `{q: null, a: null}`, and the id goes to `report.answers.text_missing`. `skipped = !!p.skipped`. Last event per id wins. |
| `section_done` | `x = sec(S)`: `status = "done"`; `record = p.record` if present; `completed_at = ts`. `current_section` = next(S) in S0…S10 order (S9 → S10; constant `NEXT_AFTER`, see C8). S9: `project.status = "bundled"`. S8 with `state.milestones` empty and no `p.milestones`: seed from the S8 record (below). |
| `section_blocked` | `sec(S).status = "blocked"`; `current_section = S`. |
| `loop_back_opened` | Upsert by id into `loop_backs`: `{id, from, to, reason, opened_at: ts, resolved_at: null}`. Extra payload keys (`risk`, `route_rule`) are ignored. |
| `loop_back_closed` | Matching entry: `resolved_at = ts`. Unknown id goes to `report.untranslatable`. |
| `scope_locked` | No state effect. `report.scope_locked_seq = seq`. |
| `milestone_verified` | Milestone with `p.id`: `verified = true`, `verified_at = p.verified_at ?? ts`. Unknown id goes to `report.untranslatable`. |
| `deployment_verified` | `deployment = {status: "live", url: p.url, verified_at: p.verified_at ?? ts}`. |
| `build_started` / `build_done` | `project.status = "building"` / `"complete"`. |
| `handoff_done` | `handoff = {status: "done", completed_at: ts}`. |
| `error` | If `project.status !== "error"`, stash `ctx.preErrorStatus = project.status`. Set `project.status = "error"`. The next `resume`, `section_*` or `answer_recorded` restores the stash and then applies its own effect. This is an **assumption**, because the spec defines no exit from `error`; ticket 03 E-04 confirms or corrects it. |
| `session_start`, `folder_gate_*`, `context_guard_triggered`, `truncation_recovered`, `resume`, `doc_generated`, `handoff_started`, `gap_found`, `recheck_*`, `feature_*` (incl. `impact_analysis`), `milestone_started`, `milestone_failed`, `build_blocked`, `brand_*` | No state effect. `doc_generated` → `report.docs_generated[]`; `resume` → restores the error stash only. |
| unknown type | No effect → `report.untranslatable: [{seq, type}]`. |
| **Any event, after its typed effect** | `p.project` → assign each present key into `state.project` and mark it `ctx.projectFromEvents[key]`. `p.decisions[]` → upsert by id, `ctx.decisionFromEvents.add(id)`. `p.milestones[]` → upsert by id, preserving `verified` / `verified_at` already set. |

**Post-fold derivations.** These cover only what events did not set. Each one is named in `report.derived`.

- **Probe.** `probe` is null, `tier === "T1"`, and no probe event → `"skipped"`.
- **Project from the S0 record** (fields not set by events):
  - `idea_raw` = the text between `## Idea (verbatim, <code>)` and the first line starting with `> ` or `## `, trimmed, with internal blank lines kept as `\n\n`;
  - `user_language` = the `- User Language: <code>` metadata token, else `<code>` from the heading;
  - `slug` and `name` from `` Slug: `<slug>` · Display name: <name> ``.
- **Name.** If `OVERVIEW.md` exists, `name` = its first `^# ` line, minus a trailing ` — plain-language overview`. This is continue 2b's rule. Report `name_source`.
- **S0.q1.** If `S0.q1.a` is null → `a = project.idea_raw`. `q` stays null and is reported.
- **Answer text from records.** Search only inside the `## Answers` block (heading line exactly `## Answers`; the block ends at the next `## `) of records for the answer's own section. Line regex: `^- \*\*(S\d+\.q\d+) (.+?)\*\* — (.*)$`. `a` = the third group up to the **last** ` · _EN: `. The first match wins.
  - Searching all lines of all records is wrong. The prototype tried it and picked up `- **S1.q4 / D-001 …` lines from other records' tables.
- **Milestones seed** (S8 record): split on `^## (M\d+) — (.*)$` headings.
  - `goal` = the `- **Goal:** ` line;
  - `features` = the distinct `F-\d+` ids in the heading text, in order, else from the `- **Deliverables:** ` line;
  - `verified: false`, `verified_at: null`.

  An S8 that is done with no record and no event milestones → `report.unrecoverable.milestones = true`. Post-lock milestones from `MILESTONES.md` belong to ticket 03 E-06; leave the hook function there.
- **Decisions** (ids not set by events). From `DECISIONS.md` if it exists:
  - find the header row containing `ID` and `Status`;
  - map columns by header name: `Decision` (or `Summary`) → summary, `Rationale` → rationale, `Status` → status;
  - split rows on unescaped `|`, unescape `\|`.

  Otherwise from the records' `## Decisions this Section…` blocks: `^- \*\*(D-\d{3,})\*\* (.*) · status: (\w+)$`. The body is split at the **last** ` — ` into summary and rationale; when more than one separator exists, the id goes to `report.decisions.split_ambiguous`.

  `section` for every disk-derived decision = the section whose record's `## Decisions this Section` block first lists `- **D-NNN**`, scanning records in S0…S10 order. Sort decisions by number.
- **Boosters never mentioned.** If ≥1 `booster_check` exists, each V0 core name never mentioned is added as `status: "missing"` and reported (continue 2b: "a core booster never mentioned → missing, flagged").

**`report` shape:**

```json
{
  "events": 0,
  "max_seq": 0,
  "seq_gaps": [],
  "duplicate_seqs": [],
  "corrupt_lines": [],
  "truncated_tail": false,
  "untranslatable": [{"seq": 0, "type": ""}],
  "scope_locked_seq": null,
  "s7_done": false,
  "docs_generated": [],
  "answers": {"total": 0, "skipped": 0, "from_payload": 0, "from_record": 0, "text_missing": [{"id": "", "missing": ["q", "a"]}]},
  "decisions": {"count": 0, "from_events": 0, "from_disk": 0, "source": "DECISIONS.md|records|events|none", "split_ambiguous": []},
  "milestones": {"count": 0, "source": "events|S8-record|none"},
  "derived": {"project": {"slug": "S0-record|events"}, "name_source": "OVERVIEW.md|S0-record|events", "booster_licenses": "events|CAPABILITIES.md|registry|v0-table"},
  "unrecoverable": {"decisions": [], "milestones": false},
  "validation": {"errors": [], "warnings": []}
}
```

**`--write`:**
1. Take the lock.
2. If the current state is valid and `--force` is not given → `REPLAY_WOULD_OVERWRITE_VALID`.
3. If the current file exists but is unreadable or invalid, copy it to `.lvr/state.corrupt-<YYYY-MM-DD>.json`, only if that name does not exist yet ("preserved once", spec 01 §Checkpoint). Report it as `backup`.
4. If `--journal-resume` is given, append `resume` first, with payload `{skill: "lvr-continue", state_rebuilt: true, untranslatable: <n>, ...extra}`. The reducer gives it no effect.
5. Atomic write.

**What replay cannot reproduce on the futsal fixture.** The prototype measured 46 leaf paths. They match the prior 47-field classification in `report-corrupt-rebuild.md`; the one field that differed then (S0.q1.a) is now derived from `idea_raw`.

| Class | JSON pointers | Rebuilt value | Why |
|---|---|---|---|
| A. The fixture deviates from §2 or the rules | `/pipeline/current_section` | `"S10"` (live `"S9"`) | continue 2a/2b rule; ticket 03 E-01 |
| | `/pipeline/milestones` | absent | conventions: never mirrored under `pipeline` |
| | `/milestones/{0..3}/verified`, `/verified_at` (8) | `false` / `null` (live: absent) | §2 shape |
| | `/deployment` | `null` (live: absent) | §2 shape |
| | `/model_profile/declared_at` | `"2026-11-07T08:02:40Z"` (live: S0 start, `08:03:22Z`) | init 4.1 and continue 2b disagree (C7) |
| B. The journal payload is shorter than the live text | `/pipeline/sections/S9/record` | `"Blueprint Bundle (20 files)"` | continue 2b: record comes from the payload |
| | `/pipeline/loop_backs/0/reason` | the journal reason | journal is the audit trail |
| C. Text exists nowhere on disk | `/pipeline/sections/S0/answers/S0.q1/q`, `…/S0.q2/q`, `…/S0.q2/a`, `…/S0.q3/q`, `…/S0.q3/a`, `/pipeline/sections/S4/answers/S4.q14/q`, `…/S4.q14/a` | `null` → `report.answers.text_missing` | legacy payloads, and the S0 record has no `## Answers` block. S4.q14 lives only in the `## Loop-backs` block. |
| D. Disk wording differs from what init stored | `/pipeline/sections/S1/answers/S1.q9/a` | record text (corrected inline by L-01) | the record is the mandated source |
| | `/pipeline/sections/S8/answers/S8.q1/q` | record paraphrase | |
| | `/decisions/{0-3,6-20}/rationale` (19; D-005 and D-006 match) | DECISIONS.md wording | mirror drift (gap G3) |
| | `/milestones/{0..3}/goal` | the S8 record's Goal lines | |

Everything else must be **deep-equal**. That includes:
- `project` (slug, name, idea_raw, user_language, created_at, status `bundled`);
- the other 43 answers' q/a/skipped;
- all section status / started_at / completed_at / record values;
- the other loop-back fields;
- 21 decisions × id/section/summary/status;
- 4 milestones × id/features;
- 9 boosters, all fields;
- tier `T1`, probe `skipped`;
- handoff.

A fully lossless replay is achievable only for journals the CLI writes, because those carry q/a, `record`, `project`, `decisions[]` and `milestones[]` in the payloads (§7 T5).

### 2.7 `gate check`: Folder Gate checks 1–5

Sources: `docs/spec/01-state.md:97-105`, conventions §6, init `SKILL.md:30-78`. The first match wins. **Read-only**; the skill journals the result.

1. **Check 1.**
   - `.lvr/state.json` exists: it parses and validates without errors → `verdict: "refuse_existing"`; otherwise → `"refuse_damaged"`.
   - `.lvr/state.json` is missing but `.lvr/journal.ndjson` exists → `"refuse_damaged"`.
   - `existing` = `{name, current_section, last_activity}`, where `last_activity` = the journal's last valid `ts`; null when unreadable.
   - An **empty** `.lvr/` (neither file) is ignored, so a re-init after a crash before the journal started is clean.
2. **Check 2.** Entries = `readdirSync(dir)` minus the junk files `.DS_Store`, `Thumbs.db`, `desktop.ini` (compared case-insensitively, for Windows and macOS) and minus an empty `.lvr`. No entries → `"pass_empty"`.
3. **Check 3.** A marker in `dir` → `"refuse_project"`, `markers: [...]`.
   - Spec markers: `.git`, `package.json`, `Cargo.toml`, `pubspec.yaml`, `pyproject.toml`, `go.mod`, `.solution`, `*.csproj`.
   - Extended markers, which the spec's "…" allows: `*.sln`, `pom.xml`, `build.gradle`, `build.gradle.kts`, `Gemfile`, `composer.json`, `requirements.txt`, `setup.py`, `deno.json`, `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`, `Package.swift`, `mix.exs`.
   - Each marker is reported as `{name, source: "spec"|"extended"}`.
4. **Check 4.** Look at direct subdirectories, using `lstat` (do not follow symlinks). Skip `node_modules`, `.venv`, `dist`, `build`, `target` and `.lvr`. Any subdirectory containing a marker → `"subfolder"`, `examples` = up to 3 subdirectory names, sorted. Unreadable subdirectories go to `unreadable[]`.
5. **Check 5.** Otherwise → `"ask_loose"`, `loose` = the first 3 entry names, sorted.

Output:

```
{dir, check: 1..5, verdict, markers, examples, loose, existing, unreadable,
 slug: null | {slug, valid, free_slug}}
```

`slug` is filled when `--idea-slug` is given and the verdict is `subfolder` or `ask_loose`. The verdict names are this ticket's own. Research/D's names (`pass_empty`, `refuse_project`, …) are reused where they fit.

`gate subfolder --slug s`:
- validates s (§2.8);
- picks `free_slug` (s, s-2, s-3 … compared case-insensitively against the existing entries);
- runs `mkdirSync(path.join(dir, free_slug))`, not recursive.

The skill then journals in the new folder: `journal append --dir <dir>/<free_slug> --type session_start …`, then `folder_gate_subfolder_created`.

### 2.8 `slug`: S0 rules

Source: init `SKILL.md:151`, "lowercase letters, digits, hyphens; 2–4 words from the idea's core noun phrase; transliterate non-Latin scripts into English words".

- **Choosing the words and translating is the model's job.** The script only normalizes and validates.
- **`slug make`:**
  1. `text.normalize("NFKD")`, then strip `\p{M}`, then lowercase;
  2. replace `[^a-z0-9]+` with `-`, then trim `-`;
  3. words = the parts.

  Issues:
  - 0 words with non-Latin input → `NEEDS_TRANSLITERATION`, `valid: false`;
  - 1 word → `TOO_FEW_WORDS`;
  - more than 4 words → truncate to the first 4 and add `TRUNCATED`. It stays valid, but the model should choose the words.

  `display` = the words in Title Case, joined with spaces.
- **`slug validate`:** `^[a-z0-9]+(?:-[a-z0-9]+){1,3}$`. Validation applies to the **base** slug only. The `-2` suffix that `slug free` adds may make a 5th segment; that is allowed (C10).
- **`slug free`:** see `gate subfolder`.

Examples:
- `"aplikasi kasir warung"` → `aplikasi-kasir-warung`, valid. The model is expected to translate it to `warung-cashier` first.
- `"Café Résumé"` → `cafe-resume`.

### 2.9 `probe`

Prompts are byte-exact from init `SKILL.md:92-94`, including the `×` (U+00D7) in `7×6`. They are also identical in continue `SKILL.md:96-98`.

**`json`.**
1. Trim whitespace. A reply that starts with a backtick fails: `FENCED`.
2. `JSON.parse`; failure → `NOT_JSON`.
3. The result must be a plain object whose keys are exactly {`probe`, `answer`} (`EXTRA_KEYS` / `MISSING_KEYS`). `probe === "json"`. `answer === 42` as a number; the string `"42"` fails with `WRONG_ANSWER`.

**`order`.**
1. Split on `/\r?\n/` and trim.
2. Strip one leading `^(\d+[.)]|[-*])\s*` from each line and drop empty lines.
3. Pass iff the exact case-sensitive lines `ALPHA`, `2`, `AGMA` appear as a subsequence, in order. The spec says "contains … in that order"; extra lines are tolerated.
4. Otherwise fail with `reason: "missing <token>"` or `"order"`.

**`sentence`.** The script cannot grade meaning, so it returns `graded: false`, `pass: null`, and `checks`:
- `non_empty`;
- `no_restart`: the reply does not start with "The cashier scanned";
- `single_paragraph`;
- `no_fence`.

The model or a fresh subagent judges coherence. If any mechanical check fails, the script returns `pass: false` with `graded: true`.

The skill journals `capability_probe_passed` (`{steps: [...]}`) or `capability_probe_failed` (`{step}`) via `journal append`.

### 2.10 `booster check` and the registry contract (ticket 05 will provide the registry)

**Registry lookup order** (first existing path wins):
1. `--registry <path>`
2. env `LVR_REGISTRY`
3. `<scriptDir>/../references/boosters.json` (the installed-skill layout)
4. `<scriptDir>/../skills/lvr-boosters.json` (repo checkout: the canonical file proposed for ticket 05, mirrored by `sync-skills` exactly like conventions; C13)

`scriptDir` = `path.dirname(fileURLToPath(import.meta.url))`. Do not use `import.meta.dirname`, which needs Node ≥20.11.

**No file found:** stdout gets `{"ok":false,"cmd":"booster check","error":{"code":"REGISTRY_MISSING","message":"Booster registry not found; use the skill's manual booster procedure.","details":{"searched":[...]}}}`, plus the stderr line, exit 1. A parse or shape failure gives `REGISTRY_INVALID` with `details.errors`. Neither ever throws.

**Minimal registry fields that ticket 02 reads.** Ticket 05 may add any others, such as `sha`, `sections`, `triggers` and `install`.

```json
{ "schema_version": 1,
  "boosters": [
    { "id": "pm-skills", "name": "pm-skills interview patterns", "repo": "product-on-purpose/pm-skills",
      "license": "Apache-2.0", "tier": "core", "kind": "skill",
      "detect": { "skill_dirs": ["pm-skills"], "mcp_servers": [], "env": [] } },
    { "id": "firecrawl", "name": "Firecrawl MCP", "repo": "mendableai/firecrawl-mcp-server",
      "license": "MIT", "tier": "conditional", "kind": "mcp",
      "detect": { "skill_dirs": [], "mcp_servers": ["firecrawl", "firecrawl-mcp"], "env": ["FIRECRAWL_API_KEY"] } }
  ] }
```

Shape rules:
- `id` is unique and kebab-case;
- `kind` ∈ `skill|mcp`;
- `tier` ∈ `core|conditional|reference`;
- `detect.*` are arrays of strings.

Without `--name`, the check covers `tier === "core"` boosters only.

**Detection.** Read-only. Never print file contents or values.

- **Skill roots.** Project roots are relative to `--dir`; global roots are relative to `os.homedir()`. The list comes from `INSTALL.md` (ticket 18):
  - project: `.claude/skills`, `.agents/skills`, `.gemini/skills`, `.opencode/skills`, `.cursor/skills`, `.qwen/skills`, `.zcode/skills`, `.kilo/skills`, `.roo/skills`, `.cline/skills`, `.windsurf/skills`, `.github/skills`, `.kimi-code/skills`, `.pi/skills`, `.codex/skills`;
  - global: the same names under home, plus `~/.config/opencode/skills`, `~/.codeium/windsurf/skills`, `~/.copilot/skills`, `~/.gemini/config/skills`, `~/.pi/agent/skills`.

  A skill is present iff `<root>/<skill_dir>/SKILL.md` exists. Plugin caches (for example `~/.claude/plugins/…`) are out of scope; they are reported through `loadable: "unknown"`.
- **MCP config files**, JSON:
  - `<dir>/.mcp.json`, `<dir>/.cursor/mcp.json`, `<dir>/.vscode/mcp.json`, `<dir>/.gemini/settings.json`, `<dir>/opencode.json`;
  - `~/.claude.json`, `~/.cursor/mcp.json`, `~/.gemini/settings.json`, `~/.config/opencode/opencode.json`.

  Collect server names from every object key named `mcpServers`, `mcp` or `servers`, at any depth ≤ 4.
- **MCP config file**, TOML: `~/.codex/config.toml`, parsed with the regex `^\[mcp_servers\.("?)([^\]"]+)\1\]` per line. There is no TOML parser.
- **Key present** iff `process.env[KEY]` is non-empty, or KEY is a key of the matched server's `env` object. Only key presence is checked.

Output:

```
{registry: <relative or absolute path>,
 boosters: [{id, name, tier, kind, present, where: [{scope: "project"|"global", path}],
   mcp_configured: bool|null, keys_present: bool|null, loadable: "unknown",
   suggested_status: "installed"|"missing"}]}
```

`present` means the skill dir was found (for `kind: skill`), or the server is configured and the keys are present (for `kind: mcp`). `suggested_status` follows from `present`.

**`--journal`:** under one lock, one `booster_check` event per booster, payload `{name, repo, license, tier, result: present|missing, where_count}`. State effects go through the §2.2 rules: before S0 the result is `NO_STATE_YET`, and the S0 materialize step folds them in. Whether a skill is "loadable" stays the model's call (init Step 3.1): the model journals `booster_check` with `result: "degraded"` itself when a skill is present but cannot be loaded.

---

## 3. Robustness rules (checklist for the implementer)

| Topic | Rule |
|---|---|
| Seq gaps | Tolerated. New seq = max + 1. Reported by `journal check` and in `journal_warnings`. |
| Duplicate seq | The first occurrence by file position wins; the rest are reported. Never renumber. |
| Corrupt or truncated last line | Skipped. The next append writes `\n` first. Never truncate or rewrite the journal. |
| Corrupt middle line | Skipped, with its line number reported. Replay continues. |
| CRLF | Read with `/\r?\n/`; strip `\r` in markdown parsing. Always write LF. |
| BOM | Strip one leading U+FEFF on every read: journal, state, records, registry, `--in`. Never write a BOM. |
| Windows paths | `path.join` / `path.resolve` only. Paths in JSON output are relative, with `/`. Junk names are compared case-insensitively. Rename retries on EPERM, EBUSY and EACCES. The lock fd is closed before unlink. |
| Write confinement | Every write target is checked with `path.relative(dir, target)`: it must not start with `..` and must not be absolute. Otherwise `PATH_OUTSIDE_DIR`. `--out` may also go under `os.tmpdir()`. Reads (`--in`, `--reply-file`, `--compare`, registry, home config) may be anywhere. |
| No network, no spawn | The runtime CLI never calls `fetch`, `child_process` or `http`. `sync-skills.mjs` (a maintainer tool) may spawn `process.execPath`. |
| Node ≥18 | At startup, `parseInt(process.versions.node) < 18` → `NODE_TOO_OLD` (exit 2). **Not allowed:** `import.meta.dirname` / `filename` (20.11), `util.parseArgs` (write a small argv parser: `--k v`, `--k=v`, repeatable `--decision`, `--` ends flags), `fs.globSync` (22), `Array.fromAsync` (22), `Object.groupBy` (21), `String.isWellFormed` (20), the `v` regex flag. **Allowed:** `structuredClone`, `crypto.createHash`, `Atomics.wait`, `\p{M}` with the `u` flag. |
| ESM single file | `scripts/lvr.mjs` starts with `#!/usr/bin/env node` and imports only `node:fs`, `node:path`, `node:os`, `node:crypto`, `node:url`. Top level is `main().catch(fatal)`. An unexpected exception prints `{"ok":false,"error":{"code":"INTERNAL","message":..}}`, exit 1, and never prints a bare stack (the stack goes to stderr only with `LVR_DEBUG=1`). |
| Determinism | Replay output depends only on the journal, the disk sources and the code. Same inputs give a byte-identical canonical serialization. No `Date.now()` in replay. |
| Size | Aim for about 1,200 lines or fewer, with a top-of-file index comment listing the sections in order: args, io, journal, schema, reducer, replay, gate, slug, probe, booster, main. |

---

## 4. Sync model

- **Canonical file:** `scripts/lvr.mjs`. Byte-identical copies go to `skills/<s>/scripts/lvr.mjs` for **every** `skills/lvr-*/` folder that has a `SKILL.md`. That is 7 today: init-new-idea, continue, handoff, recheck-plan, add-feature, build, personal-brand. Installers copy only the skill folder, so every skill needs its own copy.
- **Maintainer script:** `scripts/sync-skills.mjs`. It is zero-dep and is **not** copied into skills.
  - `node scripts/sync-skills.mjs` (sync) copies:
    - `scripts/lvr.mjs` → each `skills/lvr-*/scripts/lvr.mjs` (mkdir `scripts/` as needed);
    - `skills/lvr-conventions.md` → each `skills/lvr-*/references/conventions.md`;
    - `skills/lvr-principles.md` → each `skills/lvr-*/references/principles.md`;
    - later, once ticket 05 lands: `skills/lvr-boosters.json` → each `references/boosters.json`, if the source exists.

    It writes only when the bytes differ, and prints JSON `{ok, copied: [...], unchanged: n}`.
  - `--check` performs the same comparisons without writing and exits 1 listing `drift: [{source, target, reason: "missing"|"differs"}]`. It also verifies:
    1. `node scripts/lvr.mjs meta events` (spawned with `process.execPath`) equals the list parsed from the `Event types:` line in `skills/lvr-conventions.md` §3;
    2. no `skills/lvr-*/scripts/` folder contains files other than `lvr.mjs`.
- **npm scripts** (add these now; `package.json` has unrelated uncommitted edits from other work, so edit only the `scripts` block):
  - `"sync:skills": "node scripts/sync-skills.mjs"`
  - `"check:skills": "node scripts/sync-skills.mjs --check"`

  Ticket 22 later extends `check:skills` (frontmatter, links, `lvp` strays, schemas). Keep the script easy to extend: a list of check functions.
- **What is not checked here.** `docs/spec/*` → `skills/lvr-conventions.md` is a hand-written snapshot ("drift is checked at dogfood", conventions:3), not a byte mirror. AGENTS.md's wording "references/ byte-synced with docs/spec" really means this two-hop chain (C17).
- **Lint.** `npm run lint` is bare `eslint` over the whole repo with the Next config, so `scripts/*.mjs` gets linted. Keep the file lint-clean: no unused vars, use `catch {}` rather than an unused `catch (e)`. Add `"skills/**/scripts/**"` to `globalIgnores` in `eslint.config.mjs`, because the copies duplicate the linted canonical file.
- **Line endings.** Add `.gitattributes` with `*.mjs text eol=lf` and `skills/**/references/** text eol=lf`. This keeps the bytes identical across Windows checkouts that use `core.autocrlf=true`, and it keeps the shebang clean.
- **Version handshake.** The `version` command's `lvr_schema` (1) is what SKILL.md preflight checks. `sha256` lets `/lvr-continue` or the dashboard detect mismatched installed copies later. That is not required now.

---

## 5. SKILL.md integration

**Rule:** add, do not rewrite. Every existing prose step stays as written and becomes the fallback. Each skill gets one shared block in "Load first" and one `Script:` line at each step listed below.

**Shared block.** Insert as item 4 of "Load first" in all 7 SKILL.md files, with identical wording:

> 4. **Script helper (preferred when Node is available).** This skill ships `scripts/lvr.mjs` (Node ≥18, nothing to install). `<skill-dir>` = the folder holding this SKILL.md (use the base directory the harness reports; otherwise look for `lvr-<this-skill>/scripts/lvr.mjs` in the skills directories listed in INSTALL.md). Once per session run `node "<skill-dir>/scripts/lvr.mjs" version`. If it prints JSON with `"lvr_schema":1`, run the `Script:` command given at each step below (`LVR` = `node "<skill-dir>/scripts/lvr.mjs" --dir "<PROJECT_DIR>"`) and act on its JSON. If `node` is missing, the command cannot start, or `lvr_schema` differs, say once (English source): "Node.js is not available here, so I'll do the bookkeeping by hand." Then follow each step's prose — the prose is the fallback and stays authoritative for behavior. Never hand-edit `.lvr/` files to work around a script error (`"ok":false`): report its `code` plainly and stop that step. Pass long text through `--in -` with a quoted heredoc (`<<'EOF'`) or a PowerShell here-string (`@'…'@ |`), never inline in double quotes.

**Per-step `Script:` lines.** Insert as one line directly under the step heading or bullet; do not touch the surrounding prose.

| Skill | Step | Script line |
|---|---|---|
| init-new-idea | Step 1 (Checks 1–5) | `LVR gate check --dir "<cwd>" [--idea-slug s]` → act on `verdict`. Check 4/5 subfolder: `gate subfolder --slug s`. |
| | Check 1 refusal | `LVR journal append --type folder_gate_rejected --payload '{"check":1}'` |
| | "After any passing check" 2 | `LVR journal append --type session_start …`, then `--type folder_gate_passed` or `folder_gate_subfolder_created` (this creates `.lvr/` and the journal). |
| | Step 2 tier | `journal append --type tier_declared --payload '{"tier":"T2"}'` |
| | Step 2 probe | `probe prompts`; `probe grade --step json\|order --in -`; sentence judged by the model; `journal append --type capability_probe_passed\|failed` |
| | Step 3 | `LVR booster check --journal`; on `REGISTRY_MISSING`, run the table loop below by hand and journal each `booster_check` with `journal append`. |
| | Step 4.1 | `journal append --type section_start --payload '{"section":"S0"}'` (this creates state.json from the journal; the prose's field list is what it produces). |
| | Step 4.3–4.5 | `answer record --section S0 --in -` with `project` (`{"idea_raw":…}`, then `{"user_language":…}`, then `{"slug":…,"name":…}`); `slug make` / `slug validate` before proposing. |
| | Step 4.7 | `journal append --type section_done --payload '{"section":"S0","record":"S0-intake.md"}'` |
| | Loop engine 1, 3, 4, 5, 6 | `journal append section_start`; `answer record` (per answer); decisions through `answer record` `decisions` or `decision record --event <carrier>`; `journal append section_blocked` / `section_done` |
| | S6 | `journal append loop_back_opened` / `loop_back_closed` |
| | S7 | `journal append scope_locked` |
| | S8 close | `section_done` payload carries `milestones` |
| | S9 | `doc_generated` per file; branding name change through `payload.project.name` |
| continue | Step 1 | `LVR journal check` + `LVR state validate` |
| | 2a | `state validate`: `valid:true` = healthy, warnings are listed in the summary; repairs via `state write --no-journal` riding the `resume` append |
| | 2b | `LVR replay --write --journal-resume '{…}'` → build the reconstruction report from `report` |
| | Step 3 | `journal append --type tier_changed`, `probe …` |
| | Step 4 | data from `state get` and `journal tail` |
| | Step 5b | same commands as init's loop engine |
| handoff | Step 1 | `state validate`; scope from `journal check` `scope_locked_seq` + `state get --pointer /pipeline/sections/S7/status` |
| | Step 2.1 / 3 / 5.3 | `journal append handoff_started` / `gap_found` / `handoff_done` (the reducer fills `handoff`). Lint, blueprint and stubs are ticket 04. |
| build | Steps 3, 4, 6, 7, 8 | `journal append build_started` / `milestone_started` / `milestone_verified` (payload `id`, `verified_at`) / `milestone_failed` / `build_blocked` / `deployment_verified` (`url`) / `build_done`. The reducer now performs the state writes listed in "State fields added by this skill". |
| add-feature | Steps 2, 3, 4, 5, 6, 7, 8 | `journal append feature_*` / `impact_analysis`; Step 6 `decision record --event feature_scope_decision`; Step 7 `feature_applied` with `milestones` when a milestone is appended |
| recheck-plan | Steps 2, 3, 4, 6, 7 | `journal append recheck_*`; user-decision fixes via `decision record --event recheck_fix_applied` |
| personal-brand | Steps 2, 5, 6 | `journal append brand_started` / `brand_file_generated` / `brand_done`. The live gate is a later ticket. |

**Matching doc edits.** All are additive and belong in this ticket:

1. **`docs/spec/01-state.md`.** Add a subsection "Payload extensions (replay-complete journals)" after the Rules paragraph. It documents:
   - the optional `project`, `decisions[]` and `milestones[]` keys on any event;
   - `section_done.record`;
   - `booster_check` carrying `license` and `tier`;
   - `milestone_verified.verified_at` and `deployment_verified.url`;
   - that replay prefers payload data over disk derivation.
2. **`skills/lvr-conventions.md` §3.** The same in two sentences. §9 gains one line: "When `scripts/lvr.mjs` is available, every Checkpoint goes through it (journal first, then state, under one lock); the prose procedures are the fallback."
3. **`docs/spec/03-skills.md` line 3.** One sentence: "Each skill also ships `scripts/lvr.mjs` (D8): deterministic steps run there, prose stays as the fallback."
4. **Re-sync.** After editing `skills/lvr-conventions.md`, run `npm run sync:skills` so all 7 `references/conventions.md` copies match again, then confirm with `npm run check:skills`. `principles.md` is unchanged.
5. **Not in this ticket.** Spec 01's missing event names, the S9/S10 rule, the scope and/or rule, the S<NN> id padding: that is ticket 03 (C2, C8, C9, C10).

---

## 6. Conflicts and resolutions

| # | Conflict | Resolution |
|---|---|---|
| C1 | The ticket's Verify says "`replay` output deep-equals the live state.json". On the futsal fixture that is impossible: 46 leaf paths differ, for the reasons in §2.6. `ERRATA.md` #2 already corrected the same overclaim ("the contract … never [promises] byte-identity"). The roadmap's M1 exit "replay = live state" has the same wording. | (a) Futsal: deep-equal after the documented ignore-list, plus asserted values for the ignored paths (§7 T2). (b) Exact deep-equal for any journal the CLI writes (§7 T5). This is what makes "replay = live state" true from now on. It is a correction to the acceptance wording, not a new product decision; the orchestrator should note it in the ticket. |
| C2 | Event list: spec 01:87 has 45 types (no `section_blocked`, no `brand_*`); conventions:95 has 49; research/D says 50. | Validate against conventions:95, which the ticket also names. Ticket 03 E-02 fixes spec 01. Replay handles `section_blocked` now, so ticket 03 only adds fixtures. |
| C3 | Research/D uses `.lvp/` and `lvp-*` names. | Stale after ticket 01: use `.lvr/` and `lvr-*`. |
| C4 | Research #4 proposes `checkpoint --patch` with free JSON-pointer ops. The ticket names `answer record` / `decision record`. | Reducer-backed `journal append` plus typed payload extensions (§0.1). No free patches. |
| C5 | Research #9 calls it `state rebuild`; the ticket and ticket 32 say `replay`. | `replay`. |
| C6 | The ticket says `gate`; research says `gate check`. | `gate check` (+ `gate subfolder`). |
| C7 | `model_profile.declared_at`: init 4.1 writes `<now>` at the first state write, but continue 2b uses the `tier_declared` ts. | Replay uses the `tier_declared` ts. Under the CLI the first state is replay-materialized, so both agree from now on. Ticket 03 fixes init's prose. |
| C8 | `current_section` after S9: continue 2a/2b → S10; the futsal live state → S9. | Use S10 (`NEXT_AFTER` constant). Ticket 03 E-01 owns the final word. |
| C9 | Scope lock: continue says "event **and** S7 done"; handoff, recheck and build say "**or**". | The script reports both facts (`scope_locked_seq`, `s7_done`) and decides nothing. Ticket 03 E-07. |
| C10 | Id format: spec says `S<NN>.q<NN>`; practice and the fixture use `S1.q9`. The slug suffix `-2` can exceed 4 segments. | The validator accepts the unpadded form (`^S(10\|[0-9])\.q[0-9]+$`). The slug rule applies to the base slug only. Ticket 03 fixes the spec wording. |
| C11 | The spec 01 example answer key is `"q1"`; conventions use `"S0.q1"`. | Conventions wins (ticket 03 minor). |
| C12 | The futsal live state violates §2: `pipeline.milestones`, no `deployment`, no milestone `verified*`, skipped answer with text. | Warnings, not errors (§2.3), so continue 2a still treats it as healthy. Rebuilds produce the §2 shape. |
| C13 | Ticket 05 puts `references/boosters.json` in each skill as "one source" but names no canonical file. | Propose `skills/lvr-boosters.json` as canonical, mirrored by `sync-skills` like conventions. `booster check` already looks in both places. Ticket 05 confirms. |
| C14 | No spec defines how `project.status` leaves `error`. | Stash and restore on the next `resume`, `section_*` or `answer_recorded` (§2.6). Ticket 03 E-04 confirms. |
| C15 | Ticket 05 shrinks core boosters from 9 to ≤6. Replay's "never-mentioned core → missing" uses the V0 table. | Use the V0 table for v1 journals only. Ticket 27 (schema v2) moves this to the registry. |
| C16 | "Every state mutation emits at least one event" vs a generic `state write`. | `state write` requires `--type` unless `--no-journal`, which is limited to the continue 2a repair-at-resume case. |
| C17 | AGENTS.md says references are "byte-synced with docs/spec". In reality, `references/conventions.md` and `references/principles.md` mirror `skills/lvr-*.md` byte-for-byte, and those are hand snapshots of docs/spec. | `check:skills` checks the byte mirrors. The spec → snapshot drift stays a review item. A wording fix to AGENTS.md is optional (ticket 20 or 23). |
| C18 | `decision record` must journal, but v1 has no decision event type, and new types belong to ticket 27. | Default: carrier events with `payload.decisions[]` (no contract change). See OD-1. |

**OWNER DECISION NEEDED. OD-1 (non-blocking):** should a standalone `decision_recorded` event type (payload = the decision object) be pulled forward from ticket 27 into ticket 02?

- **For:** simpler skill wording (one command per decision). Designer-filled decisions with no natural carrier event would not need to wait for the next checkpoint.
- **Against:** it changes the public `.lvr/` contract (shared with Lazy-Vibers), and ticket 27 owns new events.
- **Recommendation:** no for ticket 02. Ship the carrier mode and add `decision_recorded` in ticket 27 together with the other v2 events.
- **If the owner says yes:** add it to `docs/spec/01-state.md:87`, `skills/lvr-conventions.md:95` and EVENT_TYPES. The reducer effect is "upsert `decisions` by id". `decision record` without `--event` then uses it. Re-sync the references.

---

## 7. Ad hoc test plan (no test runner; ticket 22 converts these to `node --test`)

Setup:

```bash
R=/home/ibrahim/projects/lazy-vibers-planner
L="node $R/scripts/lvr.mjs"
T=$(mktemp -d)
F=$R/.scratch/lvp-core/dogfood/run
```

Work on **copies** of the fixture. Never write into `$F`.

| # | Check | Pass condition |
|---|---|---|
| T0 | `node --check scripts/lvr.mjs`; `grep -nP "^import .* from ['\"](?!node:)" scripts/lvr.mjs`; grep for `import.meta.dirname\|parseArgs\|globSync\|groupBy` | Syntax OK; no non-`node:` import; no forbidden API |
| T1 | `$L version` | JSON with `ok:true`, `lvr_schema:1`, `sha256` = `sha256sum scripts/lvr.mjs` |
| T2 | `cp -r $F $T/f`, then `$L replay --dir $T/f --compare --ignore-file $T/ignore.json --print-state > $T/r.json` (ignore list below) | `diff: []`. Asserted values: `current_section` "S10"; `model_profile.declared_at` "2026-11-07T08:02:40Z"; S9 `record` "Blueprint Bundle (20 files)"; `report.answers.text_missing` ids = S0.q1(q), S0.q2, S0.q3, S4.q14; `report.answers.total` 50, `skipped` 1; decisions 21 with D-005/D-006 rationale equal to live; milestones features `[["F-01"],["F-03"],["F-02"],["F-04"]]`; 9 boosters, all `installed`; `scope_locked_seq` 81; `untranslatable` []; `validation.errors` []. The fixture is unchanged (`git status --short $F` is empty). |
| T3 | Run T2 twice | Same `sha256` |
| T4 | `$L state validate --dir $T/f` | `valid:true`; the warnings are exactly the list in §2.3 |
| T5 | Synthetic CLI project in `$T/p` (empty dir): `gate check` → `pass_empty`; append `session_start`, `folder_gate_passed`, `tier_declared` T2; `probe grade` json/order pass cases; `capability_probe_passed`; `booster_check` ×2 (one with `license`); `section_start` S0 (`state.written:true`, materialized); `answer record` S0.q1..q3 with `project` keys; `section_done` S0; `section_start` S1; `answer record` with a `decisions` entry without id (→ D-001); `answer record --skipped`; `decision record --event section_done --payload '{"section":"S1","record":"S1-context.md"}' --decision '{…designer_filled…}'` (→ D-002); `section_start` S6; `loop_back_opened`; `answer record --section S4` (auto id); `loop_back_closed`; `scope_locked`; `section_done` S8 with `milestones`; `milestone_verified`; `deployment_verified`; `handoff_done`. Then `$L replay --dir $T/p --compare`. | **`diff: []` exactly, with no ignore list.** `state validate` is valid with 0 warnings except W_CURRENT_SECTION if sections were skipped on purpose. |
| T6 | Crash simulation in `$T/p`: append a valid `answer_recorded` line with `printf` (seq = max+1, with q/a) without touching state, then `$L answer record …` | Output `state.healed` = [that seq]; replay `--compare` diff [] |
| T7 | Truncated tail: `printf '{"ts":"x","seq":' >> journal`, then `$L journal check`, then `$L journal append --type resume --payload '{}'`, then `$L replay` | `truncated_tail:true`. The append succeeds with seq = previous max+1, and the file now has the fragment on its own line. Replay `corrupt_lines` lists that line, with no crash and exit 0. |
| T8 | Duplicate and gap: hand-craft a journal with seqs 1, 2, 2, 5 | `duplicate_seqs:[2]`, `seq_gaps:[[2,5]]`; the first seq 2 wins; replay is deterministic |
| T9 | CRLF + BOM: copy the fixture, convert `journal.ndjson`, `state.json` and the records to CRLF, prefix a BOM, then replay | `sha256` equals T2's |
| T10 | `$L journal append --type foo --payload '{}'` | Exit 1; stdout `error.code` `UNKNOWN_EVENT_TYPE`; stderr `lvr: UNKNOWN_EVENT_TYPE: …`; journal bytes unchanged (`cmp`) |
| T11 | `answer record --section S1 --id S2.q1 …` → `ID_SECTION_MISMATCH`; repeat an existing id → `ANSWER_EXISTS`; `--skipped` with `a` text → stored `a:null`; payload `{"section":"S1"}` for `answer_recorded` via `journal append` → `INVALID_PAYLOAD` | All as stated, exit 1, nothing written |
| T12 | Gate matrix, 7 temp dirs: (1) `.lvr/state.json` valid; (2) `.lvr/journal.ndjson` only; (3) `.DS_Store` + `Thumbs.db` only; (4) `package.json`; (5) `sub/go.mod` + `node_modules/x/package.json`; (6) only `node_modules/x/package.json` + `notes.txt`; (7) `notes.txt` + empty `.lvr/` | (1) `refuse_existing` with `existing.name`; (2) `refuse_damaged`; (3) `pass_empty`; (4) `refuse_project` markers `[package.json]`; (5) `subfolder` examples `[sub]`; (6) `ask_loose`; (7) `ask_loose` with loose `[notes.txt]`. No dir is modified (`find -newer`). |
| T13 | `slug make --text "Café Résumé"` → `cafe-resume`; `--text "一二三"` → `NEEDS_TRANSLITERATION`; `slug validate --slug a` invalid, `a-b-c-d-e` invalid, `warung-cashier` valid; `slug free` with an existing `warung-cashier/` → `warung-cashier-2`; `gate subfolder` creates it | As stated |
| T14 | `probe grade --step json`: `{"probe":"json","answer":42}` pass; the same wrapped in a fence fails `FENCED`; `"answer":"42"` fails; an extra key fails. `--step order`: `"ALPHA\n2\nAGMA"` pass; `"1. ALPHA\n2. 2\n3. AGMA"` pass; `"ALPHA\nAGMA\n2"` fail. `--step sentence`: `graded:false` | As stated |
| T15 | `HOME=$T/h $L booster check --dir $T/p` with no registry anywhere | Exit 1, `REGISTRY_MISSING`, `details.searched` non-empty. Then write a sample registry (§2.10), `mkdir -p $T/h/.claude/skills/pm-skills && touch …/SKILL.md`, set `FIRECRAWL_API_KEY=x` and put `$T/p/.mcp.json` with `{"mcpServers":{"firecrawl":{"env":{"FIRECRAWL_API_KEY":"secret"}}}}`. `booster check --registry …` shows pm-skills present (global) and firecrawl present. The output never contains `secret`. `--journal` appends one event per booster. |
| T16 | Lock: create `.lvr/.lock` fresh → a write command fails `LOCKED` after about 5 s. `touch -d '2 minutes ago' .lvr/.lock` → the command succeeds and the lock is gone afterwards. | As stated |
| T17 | Atomic write: after T5 there is no `state.json.tmp-*` left. Windows rename retry is a code-review item (§2.3) until ticket 19's CI matrix. | As stated |
| T18 | `replay --write --dir $T/f` on a valid state → `REPLAY_WOULD_OVERWRITE_VALID`. Corrupt `state.json` (`echo '{' >`), then `replay --write --journal-resume '{}'` → `backup: .lvr/state.corrupt-<date>.json`, `written:true`, and the journal gains `resume`. A second corruption on the same day does not overwrite the backup. | As stated |
| T19 | `npm run check:skills` → exit 0. Append a byte to `skills/lvr-build/scripts/lvr.mjs` → exit 1 naming it. `npm run sync:skills` restores it, and check → 0. Also `cmp` each `references/conventions.md` with `skills/lvr-conventions.md`. | As stated |
| T20 | `npm run lint` | Passes (scripts lint-clean; copies ignored) |
| T21 | Node 18: if possible, `npx -y node@18 scripts/lvr.mjs version` plus T2 and T5. Otherwise, T0's API grep is the gate. | Same JSON as Node 24 |
| T22 | `git diff --stat` touches only `scripts/`, `skills/*/scripts/`, `skills/*/SKILL.md` (additive lines), `skills/lvr-conventions.md`, `skills/*/references/conventions.md`, `docs/spec/01-state.md`, `docs/spec/03-skills.md`, `package.json` (scripts block), `eslint.config.mjs`, `.gitattributes`. SKILL diffs contain only added lines (`git diff -U0 skills/*/SKILL.md \| grep '^-[^-]'` is empty). | As stated |

**T2 ignore file** (`$T/ignore.json`, JSON Pointer patterns; `*` matches exactly one segment):

```json
["/pipeline/current_section", "/pipeline/milestones", "/milestones/*/verified", "/milestones/*/verified_at",
 "/milestones/*/goal", "/deployment", "/model_profile/declared_at", "/pipeline/sections/S9/record",
 "/pipeline/loop_backs/0/reason",
 "/pipeline/sections/S0/answers/S0.q1/q", "/pipeline/sections/S0/answers/S0.q2/q", "/pipeline/sections/S0/answers/S0.q2/a",
 "/pipeline/sections/S0/answers/S0.q3/q", "/pipeline/sections/S0/answers/S0.q3/a",
 "/pipeline/sections/S4/answers/S4.q14/q", "/pipeline/sections/S4/answers/S4.q14/a",
 "/pipeline/sections/S1/answers/S1.q9/a", "/pipeline/sections/S8/answers/S8.q1/q",
 "/decisions/*/rationale"]
```

Separately assert that `/decisions/4/rationale` and `/decisions/5/rationale` (D-005, D-006) are equal to live. The wildcard must not hide a regression there.

Ignored paths count toward the 46: 1+1+4+4+4+1+1+1+1+7+1+1+19.
