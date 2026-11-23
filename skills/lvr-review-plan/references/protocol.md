# Review protocol

How one review run works, from inventory to report, and how later runs stay honest. The exact JSON shapes of every work file, the ledger schema, the id rules and the script behaviour are in `references/contract.md` (shipped with this skill). Section 12 of this file is the hand procedure for every script step.

## 1. Files

Review artifacts live under `PROJECT_DIR/.lvr/review/`. The run also records journal checkpoints and can stage project-local aids under the lifecycle rules. Bundle changes require `--apply` approval (section 8).

```
.lvr/review/
├── LEDGER.jsonl                append-only: run headers, findings, cells, apologies, approvals, applies, scores
├── learned-checks.md           LC-NNN checks this project taught the review (section 6, R4)
├── REVIEW-<YYYY-MM-DD>-<N>.md  the report for run N (a render of the ledger; never edited later)
└── runs/run-<N>/               work files for run N
    ├── snapshot.json           script: file, heading-unit and line hashes
    ├── claims.json             script: the claim register
    ├── cells.json              reviewer: the coverage matrix, attacks, passes, pre-mortem
    ├── findings.json           reviewer drafts; `review ids --write` fills ids and severity
    ├── reconcile.json          reviewer: class confirmations, disappeared ids, apologies
    ├── simulation.md           reviewer: the apply-all simulation (P4)
    ├── realistic.json          reviewer: optimism-corrected numbers (scale.md §8)
    ├── fresh-findings.json     optional fresh-context pass (section 9)
    ├── approvals.json, apply.json   --apply runs only
    └── scope-proposal.md       --scope-only runs only
```

Run numbers are shared by full and scope-only runs: N = `state.review.runs` + 1. An open run (`state.review.last.done_at` is null) is resumed, never restarted under a new number: keep its work files and continue at the first unfinished step.

Run numbers and scores are not secret, but the blind rule (R1) decides when you may read them.

## 2. P0 Inventory

Use [review inputs](review-inputs.md) to establish the profile checks, research dates and project-local aids for the current run.

1. `LVR review snapshot --run N` hashes every column file (lenses.md, Columns). It records each file's sha256, its heading units and its line hashes, and the hashes of `lenses.json`, `learned-checks.md` and `freshness.json`.
2. `LVR review claims --run N` extracts the claim register: money, numbers with units, dates, URLs, versions, F/M/D/RQ/U ids, absolutes ("always", "never", "all", "unlimited", "guaranteed") and hedges ("should", "probably", "TBD", "etc.", "appropriate"). Each claim gets an id `CL-<8 hex>`, its source kind (cite, answer, marker or none) and its evidence level.
3. Mark the load-bearing claims in `cells.json` → `load_bearing` (`{claim, lenses}`; L01 is always one of the lenses). A claim is load-bearing when a decision, a cost line, an MVP constraint or a milestone rests on it.
4. Read `learned-checks.md` when it exists. Its checks run as rows of their lens.

## 3. P1 Sweep

Fixed order: lenses L01 → L15, and within a lens the columns in the Columns-table order. Within each cell run every check of the lens that applies, plus its learned checks. Every R cell must end as one of:

- `findings` with ids (and optionally a quote, when the cell holds only notes),
- `clean` with a verbatim quote and `tried`,
- `na` with a reason from the enum and a note,
- `blocked` with a reason and a note (caps the lens at 8).

Attack protocol, for each load-bearing claim and each check that could fail: state the strongest version of the claim (steelman), then attack it with "Fails if …" and a concrete case. If the attack fails, log it as "blocked:" plus the quote or cited fact that defeats it. That counts as evidence for the plan, and it is listed under "Checked and sound". Never invent a weakness to look diligent, and never invent praise.

L01 and any check that needs a fact: research live (conventions §10). Log each search as `research_logged` with `purpose: "recheck"`, and cite the result. Fetch every load-bearing fact again in this run (L01.5). No web search or page fetch → stop the run and give the enable steps. Never fall back on memory.

Write each finding to `findings.json` as soon as you see it (contract.md §5 lists the fields). Name it the way contract.md §5 says: the locator is the smallest unit that holds your first evidence quote, and `claim_key` is `-` unless one check finds two separate gaps in the same unit. Do not fix anything during the sweep.

## 4. P2 Pre-mortem and P3 consequence chains

P2: assume the product has already failed, at three horizons: **first builder session**, **launch**, and **month 6**. Write at least one cause per horizon, plus an inversion list ("what would guarantee failure?"). Map every cause to an existing finding id, to a new finding, or to `handled` with a verified quote. An unmapped cause makes the coverage check fail.

P3: for every blocking or major finding, and for every proposed fix, write the chain "then … and then …" to depth 2 at least (`chain`, 2 or more entries). A consequence that is itself a gap becomes a finding (`found_by: "consequence"`).

## 5. P4 Fix closure, P5 saturation, P6 score

P4, for each finding:

- `fix`: one concrete action. `fix_class`: `mechanical` (a text change with no choice), `research` (re-verify a fact, then edit every file that repeats it), or `decision` (the user must choose; give the options and what each costs).
- `verify`: a predicate the script can run (contract.md §9), or `manual` with what a person checks. Prefer a script predicate.
- `ripple`: `LVR review ripple --run N --text "<value>"` lists every file and line that repeats the claim. Every listed file is either in the fix or explained.
- Side effects and fix-vs-fix conflicts (`conflicts_with`), and an `order` for dependent fixes.

**Apply-all simulation**: write `simulation.md`, the plan as if every fix were applied. For each file a fix touches, give the changed lines and their effect. Then re-run the affected lenses on that imagined text. Anything new you find here goes in `findings.json` now (`found_by: "simulation"`, `caused_by: <fix's finding id>` when a fix creates it). This pre-empts run 2.

P5 saturation: sweep again in reverse order (L15 → L01, columns reversed) with the question "what would a hostile reviewer find that I did not?". Repeat until a pass adds 0 findings, with at least 2 passes. Record each pass in `cells.json` → `passes` (`{pass, order, new}`). When the last pass still finds something, the verdict is `INCOMPLETE`: rerun the pass now, and never deliver an incomplete run as final.

P6: `LVR review ids --run N --write`, then `LVR review coverage --run N` until `valid` is true. Then reconcile (section 6), then `LVR review score --run N --write`.

## 6. Run-N (run 2 and later)

- **R1 Blind sweep.** Do P0–P5 completely before you read `LEDGER.jsonl`, any earlier `REVIEW-*.md`, any earlier `runs/` folder, `state.review`, or the `review_*` journal payloads. Prior scores anchor judgement. `learned-checks.md` may be read.
- **R2 Reconcile.** `LVR review ledger-diff --run N` joins this run's findings with the ledger, by id and within the same scope:
  - in the ledger and found again → `open` (carried). Severity may change only when an input changes, with a reason.
  - found again in other words (another `claim_key`, or a coarser or finer locator) over the same evidence → the script re-keys it to the ledger id (hint `same_as`), so the gap is neither counted twice nor called a miss. Distinct quotes on separate lines are separate evidence, even within one heading. If separate quotes share a line, or a quote is unavailable and the draft shares an anchor or locator with the old finding, the script asks for a match. Answer in `reconcile.json` → `matches` with `{"same_as": "<id>", "reason": "<why this is the same gap>"}` or `{"distinct": "<reason>"}`. Answer from the claims, not from the score: `distinct` makes the draft a new finding, and the earlier id is then reconciled as disappeared.
  - a carried or re-keyed id records this run's claim, fix and verify, so the report always shows the gap that was found this time.
  - previously `fixed` and found again → `regressed`. Name the change that caused it.
  - in the ledger, not found now, its `verify` passes and one of its files changed → `fixed`. The files include the cited evidence, the files the verification reads, and those recorded for an approved applied fix. A pass on unchanged text fixes nothing.
  - in the ledger, not found now, and its files are unchanged, or its evidence quotes are all still in the text → this run's sweep missed it (`sweep-miss`). It stays as it was, and the report says so.
  - in the ledger, not found now, `verify` fails or is manual, a file changed and its evidence is gone → `partial`. Set `fixed` only with a quote that shows the fix (refused when none of its files changed), or `withdrawn` with a reason. Never mark a finding fixed silently.
  - not in the ledger → classify (R3).
  - After a scope-only run, the first full run gives every open scope-only finding a disposition: `fixed` (with a bundle quote) or `superseded` by a full-run id.
- **R3 Classify** each new id. The class is derived from the ledger and the snapshots: the script's hint is the class. In `reconcile.json` → `classes` you may confirm it, or raise a `new-due-to-change` or `world-changed` hint to `missed-earlier` with a reason, when the gap was findable before even though something changed. Nothing else is accepted: lowering `missed-earlier` or changing `checklist-gap` is refused (`CLASS_OVERRIDE_REFUSED`). The report shows every new id with its class and reason, and a raised class with the script's hint.
  - `new-due-to-change`: the gap's own evidence is new. None of its quotes was in the previous run's text (the script checks that run's `text.json`, or its line hashes), or, for an absence, its file is new or a searched term was removed; or an applied fix's ripple caused it (`caused_by`). An edit elsewhere in the same section, or an extra quote taken from a changed line, does not count: if any quote was already there, the gap was there. Report it neutrally.
  - `world-changed`: nothing local changed, but the evidence is an external fact (`fact`) that is newer than the previous run, or that crossed its freshness limit since then. The script accepts it only when a `research_logged` event of this run read that URL (and, for a newer page, recorded its `published` or `updated` date). Otherwise the hint is `missed-earlier`.
  - `missed-earlier`: the gap's evidence was already in the previous run's text and the check existed then. This is a review failure.
  - `checklist-gap`: the check did not exist in the previous run. Disclose it. It counts in the review-quality number.
- **R4 Apology and repair.** These are mandatory for every `missed-earlier` and `checklist-gap` id. In `reconcile.json` → `apologies`:
  - The plain statement. For `missed-earlier`: "Run <k> should have caught <id> (<locator>). That text has not changed since then. This is on the review, not on your fixes." For `checklist-gap`: "Run <k> did not check this, because the check did not exist yet. This is a gap in the review's checklist, not in your plan."
  - A root cause, one of `cell-skipped`, `shallow-read`, `claim-not-extracted`, `severity-miscalibrated`, `check-missing`, `no-web-blocked`, `fix-ripple-unmodelled`.
  - A learned check appended to `learned-checks.md`, phrased as a general check:

    ```markdown
    ## LC-001 · L06 · from RV-L06-1a2b3c4d (run 2, missed-earlier)
    - Check: <one general sentence the sweep can run on any project>
    - Applies to: DATA, REQ
    - Root cause: shallow-read
    - Added: 2026-11-21
    ```

  - For `check-missing` and `checklist-gap`, also print issue text the skill maintainers could use (printed in the report, never sent).
  - The report shows `score_now` and `score_if_caught_in_run1` (scale.md §6).
- **R5 Stability.** `LVR review stability --run N` compares this run with the previous run of the same scope. For each lens whose cell files, `lenses.json`, learned checks and freshness limits are all unchanged, the finding set and the score must be identical. Any difference is `SCORE_DRIFT`, and the report is blocked until each difference is explained as `missed-earlier` or `checklist-gap` (with its apology), `withdrawn` (with its reason) or `world-changed` (with its source). For every other lens, the delta table lists each status change ("−1 major fixed, +1 new-due-to-change").
- **R6 Honest verdict.** Clean means saying so with evidence: "No gaps found by L01–L15 (<n> cells, <k> passes, 0 new in the last pass). 10/10 means nothing findable with these checks, not a guarantee." Then list what was checked and sound (with quotes), the top 3 residual risks, and what could not be verified. Never pad a clean result with minors. Never soften a gap. A real change is reported without an apology; a miss always gets one.

## 7. Report

`LVR review render --run N` writes `REVIEW-<YYYY-MM-DD>-<N>.md` in three parts. Part 2 is a pure function of the ledger, so an unchanged plan renders it byte-for-byte the same (`body_sha256`).

1. **Run header**: project, run, date, scope, mode, previous run, independence label, the saturation curve (new findings per pass), the reconcile summary, the apologies with their root causes and learned checks, and the maintainer issue text.
2. **Core**: the verdict line with the worst finding first, the must-fix list (severity, then lens, then id), the lens score table with the overall arithmetic, all findings by lens (id, check, severity, status, first-seen class, locator, claim, fix, verify), accepted risks, limitations (degraded boosters by tier, failed delegations, blocked cells, unverified load-bearing claims), and the coverage counts ("R cells 92/92").
3. **Run evidence**: checked and sound (clean cells with their quotes and attacks), attempted and blocked, pre-mortem causes and where they map, realistic numbers (heuristic, with the reference class), and `score_if_caught_in_run1` with the corrected history.

No opening praise. The first line after the title is the verdict and the worst finding.

## 8. `--apply` (user-approved fixes only)

Review mode never edits the plan. `--apply` is the one exception, and it applies only fixes the user approved.

1. Needs a finished full run N with counted findings. Show them grouped by severity and fix class, each with its fix and its consequence.
2. Ask per finding: apply, skip, or accept the risk. Accepting needs the cost in the user's own words, recorded first as a `user_confirmed` decision (`LVR decision record`), whose id goes in the approval's `decision_id`. Bulk approval is allowed only for a listed set of ids ("apply these 7 mechanical fixes: …"). Record the user's verbatim words in `runs/run-<N+1>/approvals.json` (`{id, decision, words, at, decision_id}`, contract.md §12).
3. Open run N+1: `review_started` with `{"run": N+1, "scope": "full", "mode": "apply"}`.
4. Apply in `order`, one file per turn:
   - `mechanical`: edit exactly what the fix says.
   - `research`: research again first (`research_logged`, `purpose: "recheck"`), then edit every ripple file.
   - `decision`: apply the option the user chose, recorded with `LVR decision record --event doc_generated` (section = the lens's owner Section, status `user_confirmed`).
   - Journal `doc_generated` `{file, by: "lvr-review-plan", findings, run}` for each file edited. Regenerate `blueprint.json` with `LVR blueprint emit`; never hand-edit it.
   - An accepted risk becomes a `user_confirmed` decision with the cost written, mirrored in DECISIONS.md.
   - Record each result in `apply.json` (`{id, files, result, decision_id}`). Only an id whose approval says `apply` may appear there.
5. Never delete a Parking Lot row, renumber ids, mark a milestone verified, or change scope without a decision fix.
   The script holds the ledger to the user's answers. `ledger-diff` refuses, and writes nothing, when the run is not applicable (`NOT_APPLICABLE`), `approvals.json` is missing (`APPROVALS_MISSING`) or malformed (`APPROVAL_INVALID`), an approval names an id that is not a counted finding of the last run (`APPROVAL_UNKNOWN_ID`), an `accept` has no `user_confirmed` decision (`ACCEPT_DECISION_MISSING`), or `apply.json` lists an id the user did not approve (`APPLY_NOT_APPROVED`) or is malformed (`APPLY_INVALID`).
6. Re-review: take a new snapshot. Every R and o cell whose file hash changed, every L11 cell, and every file a ripple listed is swept again (P1–P5 on those cells; P2 and P3 for their lenses). Every other cell may be `carried` from run N, and the script accepts that only while the file hash is unchanged. Then reconcile, score, check stability, render and close as usual. New findings caused by a fix are `new-due-to-change` with `caused_by`.
7. When applying stops half-way (a file cannot be written): journal `error` (`skill`, `step: "apply"`, `message`) and end the session with reason `error`. The next run resumes the open run N+1, where `apply.json` shows what was already applied.

## 9. Optional fresh-context pass

When the harness can start a subagent (T1/T2), offer one after P5. Journal `agent_delegated` (`started`; `task: "review-fresh-context-pass"`, `profile: "reviewer"`, `transport: "native"`). Give the subagent only the bundle path, `lenses.md`, `scale.md` and this file's sections 3–5. It does not get this run's findings, the ledger or earlier reports. Its drafts go to `fresh-findings.json`, and `LVR review ids --run N --in fresh-findings.json` computes their ids.

- Found by both → confirmed.
- Found only by the subagent → verify each one: keep it (its evidence must pass coverage), or reject it with a reason that is logged.
- Found only by the main pass → kept, and flagged "single pass".

Journal `agent_delegated` `done` (or `failed`, listed in the report's limitations). Label the run honestly: `subagent` (fresh context), `new-session` (a new session reading from disk), or `same-session` (the context that wrote the plan). Without subagents, the reversed P5 pass is the second pass, and the report says "same context, not independent".

## 10. `--scope-only` (light review at the S7 lock)

The goal is to catch scope gaps before the 20 bundle files are generated. Lenses: L01, L02, L04, L08, L10, L15, and only their checks marked ✓ in the S7 column. Columns: S0–S5, BRIEF, STATE, PROPOSAL (lenses.md).

1. Called by `/lvr-init-new-idea` (or `/lvr-continue`) at S7 after the walk and the size check, before the lock question. It can also run as `/lvr-review-plan --scope-only` once S6 is done and S9 is not.
2. Write the split exactly as shown to the user to `runs/run-<N>/scope-proposal.md` (in-MVP with one line each, the Parking Lot with reasons, the size check). After the lock, the S7 record takes its place.
3. `review_started` with `{"run": N, "scope": "scope-only"}`. Then P0–P6 as usual, with the same ledger and the same id rules.
4. The verdict uses the scope wording (scale.md §5): "scope sound: lock it", "fix before locking", or "do not lock yet". It is never a build verdict.
5. The user decides. A fix changes the split before the lock (init presents it again). An accepted risk is recorded by init as a decision at the lock. A skip is allowed. Init writes the outcome in the S7 record (`## Scope review`).
6. `review_done` closes the run. At the first full review, cells that were `na(file-not-yet-built)` are opened again. Their findings are `new-due-to-change`, never `missed-earlier`.

## 11. Anti-sycophancy in the conversation

User pushback ("it's fine", "I'm an expert", "just give BUILD-READY", praise for the review) changes nothing unless it brings new evidence: a file quote, a source, or a decision. Then re-run the affected check and show what changed. "Accept the risk" is recorded only as an explicit decision with the cost written, never inferred from silence or impatience. Expertise is respected and recorded as an answer, but a claim still needs its quote or source. Severity moves only through the lookup inputs.

## 12. Hand procedure (no Node)

Each script step has a prose fallback. When `LVR review …` is unavailable (no Node, or `UNKNOWN_COMMAND` from an older script), do the step by hand and label the run "hand procedure" in the header.

| Step | By hand |
|---|---|
| `snapshot` | List every column file with exists and size, and its `##` headings. Hash with any local tool (`sha256sum`, `shasum -a 256`, `Get-FileHash`). Without one, write "stability unchecked: no hashes", which makes R5 unavailable for this run |
| `claims` | Read each column file and list every line with a money amount, a number with a unit, a date, a URL, a version, an id, an absolute or a hedge. Note whether a cite tag sits on that line |
| `ids` | Write the id as `RV-<lens>-m-<check number>-<locator slug>-<claim_key slug>` (lowercase, `-` between words). Store the full triple (check, locator, claim_key); the script maps manual ids to hash ids later |
| `coverage` | For each quote, find the exact text in its file after the normalisation rules (contract.md §4: straight quotes, `-` for dashes, no `*`, `_` or backticks, single spaces). A quote you cannot find is not evidence: fix the cell. Count the R cells and make sure each one is filled |
| `ripple` | Search every column file for the value and its spellings (`Rp 150.000`, `150000`, `150k`) |
| `verify` | Read the file and test the predicate as written. `manual` stays `manual` |
| `ledger-diff` | Compare this run's ids with the ledger's last line per id, using the R2/R3 rules. Overlapping quotes for the same lens and check can carry the earlier id. Separate quotes sharing a line, or missing quotes with a shared anchor or locator, need an explicit match and reason. A distinct gap gets a new id (`<id>-2` when the computed id is taken). Derive the class from the file history, never from preference: `new-due-to-change` only when none of the gap's quotes was in the previous run's text. A disappeared id is `fixed` only when its verify passes and one of its files changed; otherwise a sweep-miss (kept) or `partial`. In an `--apply` run, record only fixes whose approval says `apply`, and an `accept` only with its `user_confirmed` decision |
| `score` | Apply scale.md §2–§5 in order, and show the arithmetic in the report |
| `stability` | Compare the lens table and finding ids with the previous report. Without hashes, write "stability unchecked" |
| `render` | Write the report from section 7, sorted the same way |
| `freshness` | For each cite tag, take its as-of date by the category's clock (conventions §10: `pub`/`upd`, or `acc` for `live`; regulations by `amend-check` and `acc`). Age = review date − as-of date. Compare the age with `references/freshness.json` |

Ledger lines written by hand follow the contract.md §6 schema, one JSON object per line, appended and never rewritten.
