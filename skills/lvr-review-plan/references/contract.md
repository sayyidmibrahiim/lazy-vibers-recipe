# Spec 08 — Plan review (`/lvr-review-plan`) and the `lvr review` contract

Status: normative. This file is the contract the `lvr.mjs review *` commands implement. It ships byte-for-byte as `references/contract.md` of the `lvr-review-plan` skill (`npm run sync:skills` copies it, `npm run check:skills` compares it), so it cites only files that ship with that skill: `SKILL.md`, `references/protocol.md`, `references/scale.md`, `references/lenses.md`, `references/lenses.json`, `references/conventions.md` and `references/freshness.json`.

When a script copy is older than these commands, `LVR review <sub>` answers `UNKNOWN_COMMAND`, and the skill uses the hand procedure (protocol.md §12).

## 1. Scope and invariants

- Review mode writes only `.lvr/review/**` and journal events (`review_started`, `review_done`, plus `research_logged`, `agent_delegated`, `session_*`, `error`). It never writes a bundle file, a Section Record or `state.json` directly (state changes only through journal events). `--apply` is the only mode that edits bundle files (§12).
- Every `review *` command is deterministic. Its output is a pure function of its input files, the clock (`LVR_NOW` when set, else the system clock; only `freshness`, `claims` evidence levels and the run date use it), and the lens registry. Hashes are lowercase hex sha256 of UTF-8 bytes.
- The ledger is append-only. A command never rewrites or deletes a ledger line. A wrong record-keeping value of a finished run is fixed by appending a `correction` line that points at the earlier line (§6).
- Same plan (same file bytes, same registry, same learned checks, same freshness limits, same clock day) → same finding ids, same severities, same scores, and a byte-equal report core (§11).

## 2. Files and lookups

```
.lvr/review/
├── LEDGER.jsonl
├── learned-checks.md
├── REVIEW-<YYYY-MM-DD>-<N>.md
└── runs/run-<N>/  snapshot.json text.json claims.json cells.json findings.json reconcile.json
                   simulation.md realistic.json fresh-findings.json approvals.json apply.json scope-proposal.md
```

- `snapshot.json`, `text.json` and `claims.json` are written by the script. The other work files are written by the reviewer (the model) and read by the script. JSON work files are UTF-8, and the script ignores unknown keys in them.
- `<YYYY-MM-DD>` is the UTC date of `state.review.last.started_at` for run N.
- **Lens registry lookup** (first hit wins): `--lenses PATH` → `<script dir>/../references/lenses.json` → `<script dir>/../../lvr-review-plan/references/lenses.json` (the sibling skill, used when `/lvr-init-new-idea`'s copy runs a scope-only review) → `<script dir>/../skills/lvr-review-plan/references/lenses.json` (repo checkout). None → `LENSES_MISSING`. Schema errors → `LENSES_INVALID` with the JSON path.
- `freshness.json` uses the lookup of every other command (conventions §10). There is never a second freshness table.
- `learned-checks.md` is parsed by its headings `## LC-NNN · Lxx · from <id> (run <k>, <class>)` and the bullet `- Applies to: COL, COL`. A heading that does not parse → `LEARNED_INVALID`.

### 2.1 Registry (`lenses.json`)

`{schema_version: 1, note, columns: {full: [{col, path}], scope_only: [{col, path} | {col, record_of, default}]}, packs: [..], lenses: [..]}`. Each lens: `{id, name, core_question, owner_section, applies, core: {full: [col], scope_only: [col] | null}, scope_only: bool, cells: {full: {R: [col], o: [col]}, scope_only: {R, o} | null}, checks: [{id, title, impact, impact_note, scope_only, pack, signals, old, retired}]}`. `applies` is `"always"` or `{flag, na_when, reason}`. A `core` entry of `product_type` means "a stated product type" (L03). `scope_only` columns with `record_of` resolve to `state.pipeline.sections.<S>.record` under `.lvr/docs/sections/`, falling back to `default`. `PROPOSAL` resolves to `.lvr/review/runs/run-<N>/scope-proposal.md`.

`lenses.json` must equal the tables of `lenses.md` (a maintainer check rebuilds it from them and compares). Check ids are append-only: a run header's `checks` lists every non-retired check id plus every learned check id.

Active checks for a run: full scope = all non-retired checks, with pack checks only for packs in `state.product.types` (plus `base`); scope-only = checks with `scope_only: true` in lenses with `scope_only: true`.

## 3. `review snapshot`

`LVR review snapshot --run N [--scope full|scope-only]`

- Requires an open run N (`state.review.last.run` = N and `done_at` null) → else `RUN_NOT_OPEN` (details: the open run or null). `--scope` defaults to `state.review.last.scope` and must match it (`RUN_MISMATCH`).
- Reads every column of the scope. For each: `{col, path, exists, bytes, sha256, units: [{key, kind, line_start, line_end, sha256}], lines: [<12 hex>]}`.
- **Text normalisation for hashing**: strip a leading BOM, turn CRLF and CR into LF. `sha256` is computed over the normalised bytes.
- **Units** (markdown): each ATX heading starts a unit that runs to the next heading of the same or a higher level. `kind: "heading"`, key = the heading text, NFKC, lowercased, `*` `_` and backticks removed, every run of characters other than letters and digits replaced by `-`, with `-` trimmed from both ends. A repeated key in one file gets `-2`, `-3`. Plus **id units** (`kind: "id"`): a table row whose first cell holds an id, a list item that starts with an id (`- **F-07** …`), or a heading that contains one. The key is `id:<ID>` with the id uppercased. Id patterns: `F-\d+`, `M\d+`, `D-\d{3,}`, `RQ-\d{3,}`, `U-\d+`, `LC-\d{3,}`. The first occurrence of an id unit wins; later ones get `-2`, `-3`.
- **Units** (JSON: `blueprint.json`, `state.json`): one unit per top-level key, key `key:/<name>`, hashed over `JSON.stringify` of that value with keys sorted recursively.
- **State plan view**: the `STATE` column hashes and quotes only `{project: {slug, name, user_language}, product, pipeline: {sections: {<S>: {status, record}}, loop_backs}, decisions, milestones, framework_decision, boosters}`. Review bookkeeping (`review`, `sessions`, `agents_delegated`, `model_profile`, `project.status`, `project.error`, `handoff`, `release_check`) is excluded, so opening a review run never changes the snapshot.
- In a full review, each extra path declared in a valid v2 bundle file list has a stable column keyed to its path. L03 requires a cell, and applicable lenses can quote it as evidence. A declared path cannot use `file-absent-by-profile`; use a finding for the missing file. V1 and scope-only reviews use their base columns.
- **Line hashes**: for every non-empty line, the first 12 hex of sha256 of N(line) (§4).
- Also records `lenses_sha256` (registry bytes), `learned_sha256` (`learned-checks.md` bytes, null when absent), `freshness_sha256`, and `snapshot_sha256` = sha256 of the `files` array serialised as canonical JSON. No timestamps are stored, so the same inputs give a byte-identical `snapshot.json`.
- Also writes `runs/run-N/text.json` = `{run, files: [{col, sha256, text}]}`: the normalised text of every column file that exists. A later run reads it to ask whether a gap's evidence was already there (§10). It uses an entry only when sha256 of its `text` equals that file's `sha256` in this run's `snapshot.json` (an edited or missing copy cannot establish that a quote in an existing file is new).
- Writes `runs/run-N/snapshot.json`. Output: `{ok, cmd: "review snapshot", run, scope, files: [{col, path, exists, bytes, sha256, units}], lenses_sha256, learned_sha256, freshness_sha256, snapshot_sha256, changed}` (the stdout copy omits `lines`).

## 4. Normalisation N() and quote verification

N(text), applied to quotes, files, `searched` terms and `verify` texts:

1. Unicode NFKC.
2. U+2018 U+2019 U+201A U+201B U+2032 → `'`; U+201C U+201D U+201E U+201F U+2033 → `"`; U+2010–U+2015 and U+2212 → `-`; U+00A0 U+2007 U+202F → space; U+2026 → `...`.
3. Remove U+200B U+200C U+200D U+2060 U+FEFF.
4. Remove the characters `*`, `_` and the backtick.
5. Collapse every whitespace run (newlines included) into one space, and trim.

A quote **verifies** when N(quote) is at least 20 characters long and is a substring of N(file text) of the file it names (case-sensitive). Anything else is `QUOTE_NOT_FOUND` (details: file, the normalised quote, and the longest normalised prefix that was found) or `QUOTE_TOO_SHORT`. A quote is checked against its own cell's file only: a quote copied from another file fails. JSON files are searched as text. Fabricated or paraphrased quotes therefore always fail.

**Absence evidence** (`absence: {files, searched}`): each term passes when N(term), case-insensitive, has 0 hits in N() of each listed file. A hit → `ABSENCE_HIT` (details: file, term, line). At least 2 terms are required.

## 5. Findings: drafts, ids and severity

`findings.json` = `{run, findings: [draft]}`. A draft:

| Field | Rule |
|---|---|
| `lens`, `check` | `check` is an active check id of that lens (`L08.3`) or a learned check of that lens (`LC-001`). Else `FINDING_INVALID` |
| `locator` | `FILE`, `FILE#<unit key>`, `FILE#id:<ID>` or `FILE#key:/<name>`. FILE is a column path of the scope. It must name a unit in the snapshot, or the bare file when the file is absent (`LOCATOR_UNKNOWN`) |
| `also` | other locators the fix touches (optional) |
| `claim_key` | `-` by default. Only when one check finds two separate gaps in the same unit: `<subject>:<aspect>`, where the subject is an id or claim id the gap is about (`f-07`, `cl-1a2b3c4d`) and the aspect names the failing property in one or two words (`f-07:llm-cost`) |
| `claim` | starts with `Fails if ` or `Fails when `, unless `fact` is set (`NO_CONSTRUCTION`) |
| `evidence` | `[{file, quote}]`, each verified (§4). Empty only with `absence` |
| `absence`, `fact` | optional; `fact` is one valid cite group (conventions §10); invalid → `FACT_INVALID` |
| `evidence_level`, `load_bearing` | `0–3` or null; boolean |
| `impact`, `likelihood` | `I1–I4`, `L1–L3`; an `impact` other than the check's hint needs `impact_reason` |
| `one_way_door`, `detect`, `detect_quote` | boolean; `caught | weak | none`; `caught` needs a verified `detect_quote` `{file, quote}` |
| `chain` | 2 or more strings when the severity is blocking or major (`CHAIN_MISSING`) |
| `fix`, `fix_class`, `verify` | required (`FIX_MISSING`); `mechanical | research | decision`; a predicate (§9) |
| `ripple`, `owner`, `conflicts_with`, `order` | file list; a Section, a skill or `owner`; ids; integer or null |
| `found_by`, `caused_by` | `sweep | premortem | consequence | simulation | saturation | fresh-pass`; an id or null |
| `status` | optional: `withdrawn` with `withdrawn_reason` |
| `text_changed_reason` | optional: a note on why a carried id's claim or fix text changed (the ledger records this run's text either way, §10) |

**Locator normalisation**: trim, `\` → `/`, drop a leading `./`. The path keeps its case. After `#`: an `id:` prefix (any case) → `id:` + the uppercased id; `key:` → kept as is; otherwise the unit-key rule of §3. **Claim-key normalisation**: NFKC, lowercase, whitespace and `_` → `-`, drop characters outside `[a-z0-9:./-]`, collapse repeated `-`, trim `-`; empty → `-`.

**Finding id** = `RV-<lens>-` + the first 8 hex of sha256(`<check>|<normalised locator>|<normalised claim_key>`). Test vectors:

| check | locator (normalised) | claim_key | id |
|---|---|---|---|
| `L08.3` | `RESEARCH.md#cost-table` | `llm-cost:monthly` | `RV-L08-8e763d1a` |
| `L05.7` | `MILESTONES.md#id:M0` | `m0:run-command` | `RV-L05-7eaf69e9` |
| `L06.0` | `SPEC/data-model.md` | `-` | `RV-L06-2f2b2076` |

`./MILESTONES.md#ID:m0` normalises to `MILESTONES.md#id:M0`. Ids are never reused.

**Locator rule** (so two runs name a gap the same way): the locator is the smallest unit that holds the first line of the first evidence quote from that file (an id unit before a heading). Use the bare `FILE` only for an absent file or absence-only evidence. The id does not depend on the claim, fix or evidence wording. It does depend on the check, the locator and the claim_key. Reconcile (§10, "Identity") decides by evidence which earlier finding a draft is: a draft that quotes the same text as an earlier finding keeps that id whatever its claim_key or locator granularity, so a rewording never counts a gap twice; separate quotes on the same line need an explicit match. A distinct gap whose computed id is already in use gets a split id `<id>-<n>`.

- Two drafts with the same id → `DUPLICATE_FINDING` (merge them). The same id with a different triple in the ledger → `ID_COLLISION`; the newer triple gets the suffix `-2` (then `-3`), in ledger order.
- Hand ids `RV-<lens>-m-…` (protocol.md §12) are mapped to hash ids from their stored triple wherever the ledger is read.
- **Claim id** = `CL-` + the first 8 hex of sha256(`<path>|<unit key>|<N(claim line)>`).

**Severity** (scale.md §2), computed and never taken from the draft:

```
sev = I1 → note
      I4 → (L1 ? major : blocking)
      I3 → (L1 ? minor : (L3 && one_way_door ? blocking : major))
      I2 → minor
if detect == "none": minor → major, major → blocking   (note stays note)
if load_bearing && evidence_level <= 1 && sev in {note, minor}: sev = major
```

The load-bearing rule applies after the detect rule and never lowers a severity.

### `review ids`

`LVR review ids --run N [--in FILE] [--write]` (default `runs/run-N/findings.json`). It validates each draft's fields (not the quotes), computes `id` and `severity`, and reports `{ok, cmd, run, valid, findings: [{index, id, lens, check, severity, errors}], duplicates, collisions}`. A draft that already has an `id` must match it (`ID_MISMATCH`). `--write` rewrites the input file with `id` and `severity` filled, in a fixed key order, only when `valid`.

## 6. Ledger (`LEDGER.jsonl`)

One JSON object per line, LF, keys in the order listed, no spaces (`JSON.stringify`). Line types:

| `t` | Fields |
|---|---|
| `run` | `run, scope, mode (review\|apply), date, prev_run, independence (same-session\|new-session\|subagent), procedure (script\|hand), lenses_sha256, learned_sha256, freshness_sha256, snapshot_sha256, checks[]` |
| `finding` | `run, id, lens, check, locator, claim_key, also, claim, evidence, absence, fact, evidence_level, load_bearing, impact, impact_reason, likelihood, likelihood_reason, one_way_door, detect, detect_quote, severity, chain, fix, fix_class, verify, ripple, owner, conflicts_with, order, found_by, caused_by, status, class, class_hint, class_reason, first_run, should_since, text_changed_reason, withdrawn_reason` |
| `status` | `run, id, status, reason, verify (pass\|fail\|manual\|error\|null), by (an id or null)` |
| `cells` | `run, cells_sha256, r_cells {total, filled}, counts {clean, findings, na, blocked, carried}, passes [{pass, order, new}], saturated, premortem {causes, mapped}, fresh_pass ({agent_id, confirmed, only_fresh, only_main} or null)` |
| `apology` | `run, id, class, should_since, root_cause, text, learned` |
| `approval` | `run, id, decision (apply\|skip\|accept), words, at, decision_id` (a line written before `decision_id` existed reads it as null) |
| `apply` | `run, id, files, result (applied\|failed), decision_id` |
| `score` | `run, scope, lens_scores, lens_counts, na, unscored, caps, min, overall, verdict, open, accepted, missed_earlier, score_if_caught_in_run1, corrected_history` |
| `run_done` | `run, report, body_sha256, verdict` |
| `correction` | `run, line, line_t, field, from, to, reason, at` |

- **Status** (current state of a finding): `open | partial | regressed | fixed | accepted | withdrawn | superseded`. **Class** (how it was first seen; never changes): `initial | new-due-to-change | world-changed | missed-earlier | checklist-gap`. Keeping the two apart keeps both honest.
- **Fold**: the state of id X after run k = its latest `finding` line with run ≤ k, updated by later `status` lines with run ≤ k. Folds are taken per scope.
- A run counts only once its `score` line exists. An unfinished run's lines are ignored by later folds, and resuming that run continues to write under its number.
- **Idempotent writes**: a `--write` whose lines for this run already exist byte-for-byte writes nothing (`changed: false`). Different lines for a run that already has them → `LEDGER_RUN_EXISTS` (exit 1, nothing written).
- A line that does not parse, or that misses a field → `LEDGER_INVALID` (details: line number). No command repairs the ledger.
- **Corrections**: `LVR review correct --line N --field F --value JSON --reason TEXT` appends a `correction` line for line N (the 1-based line number in `LEDGER.jsonl`). `run` and `line_t` repeat the target line's run and type, `from` is the value before this correction (after earlier corrections), `to` is the new value and `at` is the time. Only a finished run (it has `run_done`) can be corrected, and only these fields, which no id, fold, score or report reads: `run` → `independence`, `procedure`; `cells` → `passes` (`[{pass, order, new}]`, numbered from 1), `saturated`, `premortem` (`{causes, mapped}`, mapped ≤ causes). A finding changes through a `status` line, and a score through a new run. Anything else, a missing line, an unfinished run or a value of the wrong shape → `CORRECTION_INVALID` (nothing written). A value equal to the current one writes nothing (`changed: false`). Readers apply the latest correction per line and field; the report of that run is kept as written, and the dashboard shows the corrected value with the reason.
- `ledger_sha256` (in `review_done`) = sha256 of the ledger bytes after the `run_done` line.

## 7. Score

`LVR review score --run N [--write]` needs a valid coverage (it re-runs §8; invalid → `COVERAGE_INVALID`) and the run's ledger-diff lines (`LEDGER_DIFF_MISSING`).

- Counted findings per lens (scope of the run): fold status `open | partial | regressed | accepted`, severity not `note`.
- Lens score: the scale.md §3 table, first match wins. "Core absent" = an `Lxx.0` finding is counted. "Clean evidence complete" = every R cell is `clean` with a verified quote and a non-empty `tried`, or `na`, or `carried` from a complete cell, or `findings` holding only notes plus a verified quote; no blocked cell; and every load-bearing claim whose `lenses` include this lens has an attack in this lens.
- Caps: a blocked cell → at most 8. L01 → at most 6 when a load-bearing claim's register entry is still `source: marker` (unverified) after this run. A lens whose R cells are all blocked → `unscored`.
- **na never hides a finding.** A lens is `na` (with its reason) only when its `applies` condition is false (lens-level na, or every R cell na with that lens's reason) and the fold holds no counted finding of it. A lens with a counted finding is always scored, whatever its cells say. A lens that applies but whose R cells are all `na` → `unscored`, and so does a lens with no R cell in the scope. An unscored lens rules out BUILD-READY.
- Overall = `floor((sum + n × min) / (2 × n))` over the scored lenses (n of them), in integer arithmetic.
- Verdict: `INCOMPLETE` when `passes` has fewer than 2 entries or the last has `new > 0`. Else `BUILD-READY` when counted blocking = 0, min ≥ 8, overall ≥ 8, no L01 unverified cap and no unscored lens. Else `FIX-THEN-BUILD` when counted blocking = 0 and min ≥ 5. Else `NOT-READY`.
- `open` = the counts of status `open | partial | regressed` by severity (accepted excluded). `accepted` = the same counts for status `accepted`. `missed_earlier` = this run's new ids of class `missed-earlier` or `checklist-gap`.
- `should_since` (set by ledger-diff for missed classes) = the earliest earlier run of the same scope from which the locator unit's hash equals today's hash in every run up to N−1.
- `corrected_history` = for each earlier scored run k of the scope: `{run, overall, corrected}`, where `corrected` adds to run k's counted findings every finding of class `missed-earlier` or `checklist-gap` with `should_since ≤ k < first_run`. `score_if_caught_in_run1` = `corrected` of the first scored run of the scope (this run's `overall` when it is the first).
- Output: `{ok, cmd, run, scope, lens_scores, lens_counts, na, unscored, caps, mean, min, overall, verdict, verdict_reasons, open, accepted, missed_earlier, score_if_caught_in_run1, corrected_history}`. `--write` appends the `score` line.

## 8. Coverage

`LVR review coverage --run N` reads `cells.json`, `findings.json` (after `ids --write`), `snapshot.json`, `claims.json`, the registry and the learned checks. It always exits 0 with `{ok: true, cmd, run, valid, errors: [{code, lens, col, id, message}], counts: {r_cells, filled, clean, findings, na, blocked, carried}, saturation: {passes, last_new, saturated}}`.

`cells.json` = `{run, scope, lenses: {<Lxx>: {status: "applicable" | "na", na_reason, cells: {<COL>: cell}, attacks: [{claim, steelman, attack, result}]}}, learned: {<LC-NNN>: {cells: {<COL>: cell}}}, load_bearing: [{claim, lenses}], passes: [{pass, order: "forward" | "reverse", new}], premortem: [{horizon: "first-session" | "launch" | "month-6" | "inversion", cause, maps_to: <id> | "handled", quote}], independence, fresh_pass}`. A cell is `{state: "findings", ids, quote?}`, `{state: "clean", quote, tried}`, `{state: "na", reason, note}`, `{state: "blocked", reason, note}` or `{state: "carried", from_run}`.

Errors (each one names the lens, column and id): `CELL_EMPTY` (an R cell of an applicable lens, or of a learned check's `Applies to` column, has no state) · `CELL_UNKNOWN_COLUMN` · `QUOTE_NOT_FOUND` / `QUOTE_TOO_SHORT` (cells, evidence, `detect_quote`, pre-mortem `handled`) · `TRIED_MISSING` · `NA_REASON_INVALID` (not in the enum `stores-data-false | has-ui-false | file-absent-by-profile | file-not-yet-built`, or not allowed here: `stores-data-false` only for L06 with `state.product.flags.stores_data === false`, `has-ui-false` only for L14 with `has_ui === false`, `file-not-yet-built` only in scope-only runs and `file-absent-by-profile` only once `blueprint.json` v2 `files[]` exists, both only for a file that is absent) · `NA_LENS_APPLIES` (a lens-level `na`, whatever its reason, on a lens whose `applies` is `always` or whose flag condition is not met: only L06 with `stores_data` false and L14 with `has_ui` false can be na as a whole, and then only with the reason `stores-data-false` or `has-ui-false`, else `NA_REASON_INVALID`) · `NA_HAS_FINDINGS` (a lens-level `na` on a lens with a finding of this run, or an `na` cell whose file holds a finding of that lens, by `locator` or `also`) · `BLOCKED_REASON_INVALID` (`file-unreadable | tool-failed | needs-access`) · `UNKNOWN_FINDING` · `FINDING_NOT_IN_FILE` (a cell lists an id whose locator and `also` do not name that file) · `FINDING_NOT_IN_CELL` (a finding is not listed in its lens's cell for its locator file) · `LOCATOR_UNKNOWN` · `NO_CONSTRUCTION` · `EVIDENCE_MISSING` · `ABSENCE_HIT` · `FACT_INVALID` · `CHAIN_MISSING` · `FIX_MISSING` · `DETECT_QUOTE_MISSING` · `CORE_ABSENT_NO_FINDING` (a core file of an applicable lens is absent and there is no `Lxx.0` finding) · `LOAD_BEARING_UNKNOWN` (claim id not in `claims.json`) · `ATTACK_MISSING` · `PREMORTEM_INCOMPLETE` (a horizon has no cause) · `PREMORTEM_UNMAPPED` (`maps_to` is neither a finding id nor `handled` with a verified quote) · `CARRIED_NOT_APPLY` (`carried` outside an apply run) · `CARRIED_FILE_CHANGED` (the file hash differs from `from_run`'s snapshot) · `LEARNED_ROW_MISSING`.

`valid` is true only when `errors` is empty. `saturated` = at least 2 passes and the last has `new: 0`. Saturation is not an error, but it decides `INCOMPLETE` (§7).

## 9. `verify` predicates

A finding's `verify` is JSON, evaluated without a shell. Texts use N() and are case-insensitive unless `"case": true`. `file` is a column path; `unit` (optional) limits the text to one unit of the current snapshot.

| Predicate | Passes when |
|---|---|
| `{"contains": {file, text, unit?, case?}}` | the text is present |
| `{"absent": {file, text, unit?, case?}}` | the text is not present |
| `{"matches": {file, regex, flags?, unit?}}` | a line matches. Regex ≤ 200 chars, compiled with `u`. A nested quantifier such as `(a+)+` → `VERIFY_REGEX_UNSAFE` |
| `{"count": {file, text, op: "=" \| ">=" \| "<=", n}}` | the number of occurrences fits |
| `{"lint": {id, file?}}` | `lint run` has no finding with that id (in that file) |
| `{"cite_clean": {file}}` | `cite check --file` has 0 findings |
| `{"crosscheck": {rule}}` | that crosscheck rule passes |
| `{"blueprint_in_sync": true}` | `blueprint emit --check` reports no drift |
| `{"all": [p, …]}`, `{"any": [p, …]}`, `{"not": p}` | the combination holds |
| `{"manual": "<what a person checks>"}` | never passes automatically: the result is `manual` |

`LVR review verify --run N [--id RV-…]…` evaluates the given ids (default: every fold id with a counted status) against the current files. Output: `{ok, cmd, run, results: [{id, result: "pass" | "fail" | "manual" | "error", detail}]}`. An unknown predicate key → `VERIFY_INVALID`.

## 10. Reconcile: `review ledger-diff`

`LVR review ledger-diff --run N [--write]`. P = the latest scored run of the same scope before N (null in run 1).

- **Identity** (runs first): which earlier finding each draft is. Location alone never decides it.
  - The **locating quote** of a finding is its first evidence quote from its locator's file (else its first quote). Overlap is measured in N() of today's text (§4): two quotes overlap when some occurrence of one shares characters with some occurrence of the other.
  - A draft X and a finding Y of the fold at P (Y counted or `fixed`, or Y's id is X's computed id or `<X>-<n>`; not withdrawn by a draft of this run) are related only when they have the same lens, the same check and the same locator file. Then:
    - **same**: both locating quotes are in today's text and they overlap. For two absence-only findings: the same normalised locator and at least one searched term in common.
    - **maybe**: the quotes are disjoint but share a line in today's file, or at least one quote is unavailable and both findings share an anchor or normalised locator. The anchor is the smallest unit holding the first line of the locating quote, with an id unit taking precedence over a heading of the same size. Use the locator when the quote is unavailable. A fixed finding is a `maybe` candidate only when its id is X's computed id or a split id derived from it.
    - **other**: both quotes are present on separate lines, or there is unavailable evidence with neither a common anchor nor a common locator.
  - X's candidates are its `same` and `maybe` findings. X is matched to Y **automatically** only when Y is X's only `same` candidate that no other draft also has as `same`. Every other draft with a candidate (a `maybe`, or a `same` shared with another draft) gets `need: match`, answered in `reconcile.json` → `matches` with `{"same_as": "<Y>", "reason": "<why this is the same gap>"}` (Y one of X's candidates, each Y used once) or `{"distinct": "<reason>"}` (X is a different gap). Anything else, an answer for an id that is not a draft of this run, or an answer for a draft with no candidate → `MATCH_INVALID`. A draft waiting for its answer has `transition: "undecided"` and is not classified.
  - A draft matched to another id Y is **re-keyed** to Y: Y's locator and claim_key stay, and a `status` line (Y's status, reason `same_as: drafted as X …`, `by` = X) records it. Its output entry has `id` Y, `drafted_as` X and `class_hint: "same_as"`.
  - **Split ids**: when X is not matched (no candidate, or `distinct`) but X is already the id of a finding in the fold at P, X is an earlier, different gap. The draft gets the next free id `<X>-<n>` (n ≥ 2, never used in the ledger) as a new id, and a `status` line (`open`, reason `split: drafted as X …`, `by` = X) records it. A later draft computed as X that matches `<X>-<n>` is carried as `<X>-<n>` (reason `split: drafted as X …`). `cells.json` keeps naming the draft id: `score` reads each `same_as:`/`split:` line of the run as an alias from `by` to the id.
  - So the same gap in new words keeps its id and score, and a different gap at the same place never hides behind an earlier id.
- **Fresh ids** (this run's findings) against the fold at P: present with status `open`/`partial`/`regressed`/`accepted` → `carried` (status kept; `accepted` stays `accepted`). Present as `fixed` → status `regressed`. Present as `withdrawn` → `reopened`, which needs a reason in `reconcile.json`. Absent → a new id with a class hint, in this order:
  1. no P → `initial`;
  2. `check` not in P's run-header `checks` → `checklist-gap`;
  3. `caused_by` names an id with an `apply` line after P → `new-due-to-change`;
  4. the gap's own evidence was not in P's text → `new-due-to-change`. "In P's text" is checked against P's `text.json` (§3). Entries must match P's snapshot hashes. When a file existed in P but has no usable text copy, its quote cannot be shown to be new:
     - a finding with evidence quotes: **none** of its quotes is in P's text of its file (a file absent in P holds nothing). One quote that was already there is enough for "not new": a new or changed quote next to an old one proves nothing, and neither does a change elsewhere in the same unit or file;
     - an absence-only finding: its locator's file was absent in P, or P's `text.json` shows a searched term in one of `absence.files` (the change removed it). Without P's text the absence counts as not new;
     otherwise the evidence was there in P, and the rules go on;
  5. `fact` cites a source that a `research_logged` event of this run (journaled after its `review_started`, outcome `found`) lists by URL, and either that event gives the cite's `pub`/`upd` date as the source's `published` or `updated` date and the date is after P's date, or the cite's freshness expiry falls in (P's date, N's date] (`review freshness --since`) → `world-changed`. A cite that no research of this run read proves nothing;
  6. else → `missed-earlier`.
- **Disappeared ids** (fold at P has a counted status, this run has no draft that is it): run `verify`. Its files include the locator, `also`, evidence, `absence.files`, files read by the verify predicate, and files recorded for this finding in applied fixes since P. A predicate that reads the entire bundle covers every column in scope. A changed file has a different `sha256` from P's snapshot.
  - verify passes and at least one of its files changed → `fixed`;
  - verify passes and none changed → `sweep-miss` (a pass on the same text fixes nothing);
  - verify fails and none changed, or every evidence quote is still in today's text → `sweep-miss`;
  - verify fails, a file changed and its evidence is gone → `partial`.

  A `sweep-miss` keeps its status, and a `status` line (reason `sweep-miss: …`) plus the run header record it. `reconcile.json` may set `fixed` (with a verified quote; refused with `DISPOSITION_REFUSED` when none of its files changed), `withdrawn` (with a reason) or `partial`.
- **Scope carry**: in the first full run after scope-only runs, every scope-only id with a counted status needs a disposition in `reconcile.json` → `scope_carry`: `fixed` (with a verified bundle quote) or `superseded` (with `by`, a full-run id).
- `reconcile.json` = `{run, matches: {<id>: {same_as, reason} | {distinct}}, classes: {<id>: {class, reason}}, disappeared: {<id>: {status, reason, quote?}}, reopened: {<id>: {reason}}, scope_carry: {<id>: {status, by?, quote?}}, apologies: [{id, root_cause, text, learned}], severity_reasons: {<id>: reason}}`. A severity different from the fold's needs `severity_reasons` (and changed inputs).
- **Classes are derived, not chosen.** The hint is the class. `classes` may only confirm it (`{class: <hint>}`), or raise a `new-due-to-change` or `world-changed` hint to `missed-earlier` with a reason (the reviewer judges the gap was findable before; it then needs the apology). Any other value, such as lowering `missed-earlier` to `new-due-to-change` or `checklist-gap` to anything, → `CLASS_OVERRIDE_REFUSED` (exit 1, nothing written).
- **Apologies**: every new id whose confirmed class is `missed-earlier` or `checklist-gap` needs an apology with a `root_cause` in `cell-skipped | shallow-read | claim-not-extracted | severity-miscalibrated | check-missing | no-web-blocked | fix-ripple-unmodelled`, a non-empty `text`, and a `learned` id that exists in `learned-checks.md` and names the same lens.
- Output: `{ok, cmd, run, prev_run, scope, fresh: [{id, drafted_as?, lens, check, severity, transition (carried | regressed | reopened | new | undecided), class_hint, hint_reason, class, status}], disappeared: [{id, prev_status, verify, files_changed, hint, status}], scope_carry, matches: [{id, candidates, relation: {<Y>: same | maybe}, same_as, split, how (quote | absence | line | unit), at, auto}], needs: [{id, need}], counts, changed}`. `matches` lists each draft with a candidate other than its own id, a re-key or a split. `need` is one of `match | class-reason | apology | learned-check | disposition | reopen-reason | severity-reason`.
- `--write` refuses while `needs` is non-empty (`RECONCILE_INCOMPLETE`). Otherwise it appends, in this order: the `run` header (if absent), a `finding` line per fresh id (carried and re-keyed ids keep `first_run`, `class`, `locator` and `claim_key`; `claim`, `fix`, `fix_class`, `verify` and the evidence are this run's, so the ledger always shows the text that was found), a `status` line per transition, the `cells` line, `apology` lines, and (apply runs) the `approval` and `apply` lines from `approvals.json` and `apply.json`.

## 11. Stability and render

`LVR review stability --run N` compares N with P (§10) of the same scope. Output: `{ok, cmd, run, prev_run, stable, lenses: [{lens, prev, now, strict, files_changed, transitions: {fixed, partial, regressed, withdrawn, new: {<class>: n}}, explained}], drift: [{lens, id, kind, message}]}`.

- A lens is **strict** when every R and o column of the lens (and of its learned checks) has the same `sha256` in both snapshots, and `lenses_sha256`, `learned_sha256` and `freshness_sha256` are equal. A strict lens must have the same finding id set, the same severities and the same score. Every difference is a `drift` entry unless it is a new id classified `missed-earlier`/`checklist-gap` with its apology, a `withdrawn` id with its reason, or a `world-changed` id.
- A non-strict lens lists its transitions. Its delta is explained by construction, because the score is a pure function of the fold.
- Run 1: `stable: true`, with nothing to compare.

`LVR review render --run N [--journal]` runs `stability` and refuses on any drift (`SCORE_DRIFT`), and needs the score line (`SCORE_MISSING`). It writes `REVIEW-<date>-<N>.md` and appends `run_done`. Output: `{ok, cmd, run, report, body_sha256, changed, review_done_payload: {run, verdict, score, open, missed_earlier, report, lens_scores, ledger_sha256}}`. With `--journal`, it also appends `review_done` with that payload through the normal journal path.

For language review, run `review render --run N --preview` to get the exact text and `draft_sha256` before any write. Review the candidate independently and correct its English prose once when needed. Save checked content with `--checked-sha <draft_sha256>`. A hash mismatch returns `REVIEW_DRAFT_CHANGED`. A saved completed report is retained. Report prose summarizes clean checks in English and refers to original quotes in `cells.json`. The quote verification and ledger evidence still use the original wording.

The report has three parts (protocol.md §7). The run header lists every sweep-miss, every re-keyed id ("Same gap, new wording"), every split id ("Own id") and every new id of the run with its class and the reason (the script's hint reason, or the reason it was raised to `missed-earlier`). The core sits between the lines `<!-- core:start -->` and `<!-- core:end -->`, and `body_sha256` = sha256 of the bytes strictly between them. The core is built only from the fold, the score line and the state (boosters, delegations):

1. `## Verdict`: verdict, overall, min lens, then the worst counted finding (severity order blocking > major > minor, then lens, then id).
2. `## Must fix`: counted non-accepted findings, ordered by severity, lens, id.
3. `## Lens scores`: one row per lens L01–L15 (score, B/M/m/notes, na or unscored reason, caps), then the overall arithmetic.
4. `## Findings`: by lens, then severity, then id. Fields: id, check, severity, status, class (with "script hint …; reason: …" when the class was raised from the hint), locator, claim, fix, verify kind.
5. `## Accepted risks`, `## Limitations` (degraded boosters by tier, failed delegations, blocked cells, unverified load-bearing claims), `## Coverage` (R cells filled/total, na, blocked).

No date, run number, timing or pass count appears in the core. Carried ids render the text of their first line, so an unchanged plan renders a byte-equal core.

## 12. `--apply`

- Needs the last finished run to be a full run with counted findings. It opens N+1 with `review_started` `{run, scope: "full", mode: "apply"}`.
- `approvals.json` = `{run, approvals: [{id, decision: "apply" | "skip" | "accept", words, at, decision_id}]}`. `words` is the user's verbatim text (a bulk approval repeats the same words for each listed id). `decision_id` is required for `accept`: the `user_confirmed` decision that records the accepted risk and its cost. `apply.json` = `{run, applied: [{id, files, result: "applied" | "failed", decision_id}]}`.
- **The approval gate.** A run is an apply run when its `review_started` has `mode: "apply"`, `cells.json` has `mode: "apply"`, or `approvals.json` or `apply.json` exists. `ledger-diff` (with or without `--write`) then refuses, before anything is written: `NOT_APPLICABLE` (the run is not full, or the last finished run is missing, scope-only, or has no counted finding), `APPROVALS_MISSING` (no `approvals.json`), `APPROVAL_INVALID` (an entry without id, a decision from the enum or the words, or two answers for one id), `APPROVAL_UNKNOWN_ID` (an id that is not a counted finding of the last finished run), `ACCEPT_DECISION_MISSING` (an `accept` whose `decision_id` is not a `user_confirmed` decision in `state.decisions`), `APPLY_INVALID` (an `apply.json` entry without id, files or a result from the enum) and `APPLY_NOT_APPROVED` (an applied id whose recorded answer is not `apply`).
- Each edited bundle file → `doc_generated` `{file, by: "lvr-review-plan", findings: [ids], run}`. A decision fix or an accepted risk → `LVR decision record --event doc_generated --payload '{…}' --decision '{"section":"<lens owner_section>","summary":"…","rationale":"…","status":"user_confirmed"}'`. `blueprint.json` → `LVR blueprint emit`. A half-applied stop → `error` `{skill: "lvr-review-plan", step: "apply", message}`.
- In the apply run, `cells.json` may mark a cell `carried` only when its file hash equals the hash in `from_run`'s snapshot. The cells of changed files, all L11 cells and the ripple files are swept again.

## 13. `review claims`, `review ripple`, `review freshness`

- `LVR review claims --run N`: the register of every line in the scope's columns with at least one kind: `money`, `fee_or_rate`, `version` (the detectors `cite check` uses), `number_unit` (a number with `%`, `ms`, `s`, `GB`, `MB`, `req`, `users`, `/month`, `/day`, …), `date` (ISO, or a month name plus a year), `url`, `id`, `absolute` (`always`, `never`, `all`, `every`, `unlimited`, `guaranteed`, `instant`, `100%`, `free forever`), `hedge` (`should`, `probably`, `maybe`, `likely`, `TBD`, `TODO`, `etc.`, `appropriate`, `similar`, `as needed`, `some`). Entry: `{id, col, file, unit, line, text, kinds, in_code, source: "cite" | "answer" | "marker" | "none", cites, evidence_level, expired}`. Evidence level: none or marker 0; a memory phrase 1; one fresh non-primary cite 2; a fresh primary cite, two fresh cites from different registrable domains, or a recorded answer id (the owner's own fact) 3. Expired cites do not count. Sorted by column order, then line. Writes `claims.json`.
- `LVR review ripple --run N (--text T)… [--claim CL-…]`: every line in the scope's columns that contains a term (N(), case-insensitive). A numeric term also matches number tokens with the same digits once `.`, `,` and spaces are removed. Scale words (`k`, `rb`, `jt`) are not expanded, so add them as extra `--text` terms. `--claim` adds the claim's money, number, version and id tokens. Output: `{terms, hits: [{col, file, unit, line, text}], files}`.
- `LVR review freshness --run N [--since YYYY-MM-DD]`: every cite in the scope's columns with its category, as-of date, age, limit and `expires_on`, plus `expired` and `crossed_since` (the facts whose `expires_on` falls in (since, today]; `since` defaults to P's date). The as-of date follows the clock rules of conventions §10. It writes nothing.

## 14. Scope-only at the S7 lock

- `/lvr-init-new-idea` (or `/lvr-continue` resuming S7) runs it after the S7 walk and the size check, before the lock question, when the sibling skill exists (`<this skill dir>/../lvr-review-plan/SKILL.md`). It is on by default and skippable. When the skill is missing, init says one plain line and locks without it.
- The steps: write `runs/run-N/scope-proposal.md` (the split exactly as shown) → `review_started` `{run, scope: "scope-only"}` → `snapshot --scope scope-only`, `claims`, the sweep of the 6 scope lenses (their S7-marked checks only), `ids`, `coverage`, `ledger-diff --write`, `score --write`, `stability`, `render` → `review_done`. These are the same commands, with the scope-only columns and checks.
- Verdict wording maps BUILD-READY / FIX-THEN-BUILD / NOT-READY to "scope sound: lock it" / "fix before locking" / "do not lock yet". The user decides. Init records the outcome in the S7 record (`## Scope review`: run, verdict wording, counts, report path, and the user's call, or "skipped" / "not installed") and records accepted risks as decisions at the lock.
- Scope-only runs keep their own fold. Their findings never count in a full run's score. At the first full run they need a disposition (§10, scope carry).

## 15. Events and state (schema v2)

- `review_started` `{run, scope, mode?}`: opens `state.review.last` (`run`, `scope`, `started_at`, and null results), with `state.review.ledger` = `.lvr/review/LEDGER.jsonl` and `state.review.runs` = max(runs, run). `mode` is informational.
- `review_done` `{run, verdict, score, open, missed_earlier, report, lens_scores?, ledger_sha256?}`: closes the open run and must match it (else `INVALID_PAYLOAD`). Its `score` = the overall score.
- The legacy `recheck_started`, `recheck_finding`, `recheck_research_refresh`, `recheck_fix_applied` and `recheck_done` events stay valid, and replay reads them as informational. No skill writes them any more.
- `/lvr-build` preflight: `state.review.last.open.blocking` = 0 when a finished review exists (a `.lvr/recheck/RECHECK-*.md` report from before the rename is read the old way).

## 16. Exit codes and errors

The same conventions as every `lvr.mjs` command: `{"ok": true, …}` exit 0; `{"ok": false, "error": {code, message, details}}` exit 1; bad usage exit 2. Codes: `RUN_NOT_OPEN`, `RUN_MISMATCH`, `LENSES_MISSING`, `LENSES_INVALID`, `LEARNED_INVALID`, `SNAPSHOT_MISSING`, `CLAIMS_MISSING`, `CELLS_MISSING`, `CELLS_INVALID`, `FINDINGS_MISSING`, `FINDING_INVALID`, `ID_MISMATCH`, `DUPLICATE_FINDING`, `ID_COLLISION`, `COVERAGE_INVALID`, `LEDGER_INVALID`, `LEDGER_RUN_EXISTS`, `LEDGER_DIFF_MISSING`, `RECONCILE_INCOMPLETE`, `MATCH_INVALID`, `CLASS_OVERRIDE_REFUSED`, `DISPOSITION_REFUSED`, `SNAPSHOT_DRIFT` (ledger-diff: P's `snapshot.json` no longer matches the `snapshot_sha256` of P's run header), `SCORE_MISSING`, `SCORE_DRIFT`, `VERIFY_INVALID`, `VERIFY_REGEX_UNSAFE`, `UNKNOWN_ID`, `PROPOSAL_MISSING`, `NOT_APPLICABLE`, `APPROVALS_MISSING`, `APPROVAL_INVALID`, `APPROVAL_UNKNOWN_ID`, `ACCEPT_DECISION_MISSING`, `APPLY_INVALID`, `APPLY_NOT_APPROVED`, `CORRECTION_INVALID`. Coverage reports its codes inside `errors` (§8), among them `NA_REASON_INVALID`, `NA_LENS_APPLIES` and `NA_HAS_FINDINGS`. `DUPLICATE_FINDING` and `ID_COLLISION` are reported inside `review ids` (exit 0, `valid: false`). The others stop the command.
