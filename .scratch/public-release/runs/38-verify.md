# Ticket 38 (+33): lvr-review-plan, independent verification

Verifier: Opus (xhigh), 2026-11-21. I wrote none of this code. Nothing was committed and no source file was edited; this file is the only write in the repo. All work ran on copies in `/tmp/claude-1000/-home-ibrahim-projects-lazy-vibers-recipe/23c653d2-751b-4de6-8fd1-e7e40b1114ae/scratchpad/v38` (`work/*` projects, `lib.sh`, `qtest.mjs`, `ftest.mjs`, `*.out` logs). `.scratch/lvp-core/dogfood/run` was not touched. `next build` ran only in a copy. The verdict below was formed before I read `runs/38-impl.md`.

## Overall verdict: FAIL (5 blocking)

The script core is solid:
- It is deterministic: two runs give byte-equal score output and report core, and draft order does not matter.
- It rejects fabricated quotes.
- It never edits the bundle in review mode.
- Every regression is green, and the web app renders both new and legacy reports.

The blocking items sit where the ticket's end-to-end promises depend on model-written inputs. The shipped text does not pin these inputs, and the script does not check them. The promises affected:
- "the same plan always gets the same score"
- "gaps are never softened"
- "every miss gets an apology"
- "`--apply` applies only user-approved fixes"

Each blocking item below has a reproduction on a copy of futsal-fixed (migrated to v2, `LVR_NOW=2026-11-21T09:00:00Z`).

## BLOCKING

### B1. The installed skill does not ship the work-file contract it depends on

`protocol.md` points to sections of spec 08:
- "spec 08 §5 lists the fields"
- "spec 08 §9" (verify predicates)
- "§6 schema" (hand-written ledger lines)
- "§4" (normalisation)

Conventions §11 says "`docs/spec/08-review.md` in the LVR repository". But the `npx skills add` and copy installs (INSTALL.md) ship only `skills/lvr-*`. Counted in SKILL.md and the four references:

| Term | Shipped text | Spec 08 |
|---|---|---|
| `premortem` | 0 | 3 |
| `passes` key | 0 | 1 |
| `na_reason` | 0 | 1 |
| `classes` | 0 | 1 |
| `scope_carry` | 0 | 3 |
| `severity_reasons` | 0 | 1 |
| `cite_clean` | 0 | 1 |
| `absent` | 0 | 1 |
| `blueprint_in_sync` | 0 | 1 |

The shipped text has no claim_key rule and no locator syntax either. So a harness model following the installed skill cannot write a valid `cells.json`, `findings.json` or `reconcile.json`, or a verify predicate. It can only reverse-engineer them from script errors (for example `ids` lists missing fields). It cannot learn the `claim_key` semantics at all; see B2.

No other skill cites unshipped spec sections this way. AGENTS.md also expects skill `references/` to carry snapshots of `docs/spec/`.

**Fix:** ship a `references/contract.md` snapshot of spec 08 §3–§9 (shapes, normalisation, id and claim_key rules, predicate grammar, ledger schema). Add it to `sync:skills`/`check:skills`, and point protocol.md at it.

### B2. Finding ids depend on a free-text claim_key, so a blind rerun of an unchanged plan can change the score

The id hashes `check|locator|claim_key`. The claim_key is model-chosen free text with no derivation rule in the shipped text. Spec 08 §5 claims "An id never depends on wording", but claim_key is wording.

**Repro** (`work/ck2`): run 2 has identical files and the same gap. The only change is that the model wrote `midtrans:fee` instead of `payment-gateway:mdr`. Then:
- The old id `RV-L08-899b2abb` becomes a sweep-miss and stays counted.
- The new id `RV-L08-41454347` becomes missed-earlier, which forces an apology and a learned check.
- The gap is double-counted: L08 drops from 8 to 7, and the verdict goes from **BUILD-READY to FIX-THEN-BUILD**.
- `stability` says stable, because the false apology "explains" the new id.

The honest path fails (`work/ck`): withdrawing the duplicate and overriding the class gives `SCORE_DRIFT`, and render refuses. So the only way through is a false apology on an unchanged plan.

A coarser locator (`RESEARCH.md` instead of `RESEARCH.md#cost-table`) changes the id in the same way. Fixture 38 (a) passes only because `gen.mjs` reuses identical claim_keys.

**Fix:**
1. Pin the claim_key derivation in shipped text, for example `<claim-register id or unit key>:<aspect from a fixed per-check list>`.
2. Add a script re-key path. When a new id has the same lens, check and locator as a sweep-miss id of the previous run, hint `same_as`. Then a `reconcile.json` `same_as` keeps the old id, with no apology and no double count.

### B3. Marking a lens or cell n/a removes real findings from the score

`naProblem` puts no limit on `not-applicable-type`, and that reason is defined nowhere. Repros (`work/g-*`):

| Case | Result |
|---|---|
| 6 open majors in L05 | L05 5, FIX-THEN-BUILD |
| Same 6 majors, plus L05 `{status:"na", na_reason:"not-applicable-type"}` | coverage valid, L05 left out of overall and min, **BUILD-READY** |

The rendered report then says **BUILD-READY** on its first line while listing the 6 open majors under "Must fix".

More cases:
- Lens-level n/a on L07 (registry `applies: "always"`) is accepted.
- Setting every R cell of L07 to n/a scores L07 **10**.
- Setting 11 of the 15 lenses to n/a is accepted.

The text says "Applies: always", but nothing stops a model from marking such a lens n/a after pushback ("security isn't relevant for us"). That breaks the box "gaps = never soften".

**Fix:**
- Refuse lens-level n/a unless the lens's `applies` condition is false (the `stores_data` or `has_ui` flag).
- Refuse n/a on any lens or cell that holds finding ids.
- Define `not-applicable-type`, or drop it: pack checks for other product types are already removed by `activeChecks`.
- A lens whose R cells are all n/a should be unscored, not 10.

### B4. A missed-earlier finding can be reclassified so that no apology is needed

`reconcile.json` `classes` accepts an override of the script's `missed-earlier` hint to `new-due-to-change` with any reason.

**Repro** (`work/launder`):
- A planted L07 gap is missed in run 1.
- Between runs, only an unrelated line is appended to another section of SECURITY.md.
- In run 2 the gap is found, and its hint is missed-earlier because its unit and lines are unchanged.
- Override: `{"class":"new-due-to-change","reason":"SECURITY.md was edited since run 1"}`.

Result:
- `needs` is empty.
- L07 is not strict, so `stability` passes, and render succeeds.
- The report has **no apology**, `missed_earlier` is 0, and `score_if_caught_in_run1` is **8** (the honest run in `work/pm` gives 6).
- The report shows neither the hint nor the reason. The ledger keeps `class_hint:"missed-earlier"`, but protocol R3 says "the reason is shown in the report".

Every `--apply` run changes files, so this path is open on every apply run. A second route: attach a `fact` cite with an `upd` date after the previous run. That gives `world-changed` (verified in `work/wc`), and the script does not check that the cite matches this run's `research_logged`.

**Fix:**
- Refuse overriding a missed-earlier or checklist-gap hint to a class that needs no apology while the locator unit and evidence-line hashes are unchanged (the same condition that produced the hint).
- Render `class_hint` and the override reason in the report.
- Require a world-changed `fact` to match a `research_logged` source of this run.

### B5. `--apply` approvals are not enforced by the script

**Repro** (`work/ap`, apply-mode run 2), with these entries:
- `apply.json` lists `RV-L08-899b2abb`, whose approval says `skip`.
- `apply.json` also lists `RV-L11-9297876f`, which has no approval.
- `approvals.json` has `accept` for the unknown id `RV-NOPE-00000000`, with words "ok" and no decision.

Result: ledger-diff `--write` writes both `apply` lines and an `accepted` status line for `RV-NOPE-00000000`, with no error and no need raised.

Two more gaps:
- An apply-mode run with no `approvals.json`, and even an apply-mode run 1, is accepted (`work/ap0`, `work/ap1`).
- `NOT_APPLICABLE`, which the implementer's own test plan item 12 calls for, does not exist in `lvr.mjs`.

The script cannot stop a model from editing files. But the ledger is the record of what the user approved, and today it records unapproved applies as `applied`.

**Fix:**
- In apply mode, require `approvals.json`.
- Every `apply` id must have an `apply` approval.
- Every `accept` must name a counted id of the fold and carry a `decision_id`.
- Refuse `mode:"apply"` without a finished full previous run that has counted findings (`NOT_APPLICABLE`).

## Check 1: ticket boxes (skill text and script)

| Box | Result | Evidence |
|---|---|---|
| 15 lenses with concrete checks and an evidence rule | PASS | `gen-lenses --check`: 15 lenses, 165 checks, 92 full R cells, 20 scope-only. The evidence rule is in lenses.md. Each lens has a core question, R/o cells, attacks, and checks with impact hints |
| Coverage matrix rejects fabricated quotes | PASS | Check 3 table. Inherent limit: the script cannot judge whether a quote is relevant |
| Anchored scale; score a pure function | PASS script / **FAIL end-to-end** | Order independence and reruns are byte-equal (fixture a/e, my CRLF run). End-to-end broken by B2 and B3 |
| P0–P6 incl. apply-all simulation and saturation | PASS text / **FAIL installed** | Text complete. The shapes for P2 `premortem`, P5 `passes` and attacks are not shipped (B1). `simulation.md` is never checked (A7) |
| Ledger with stable hash ids | PASS script / **FAIL end-to-end** | Wording, fix, evidence, case, `_`, `./` and `\` give the same id. Check, locator or claim_key give a new id. Spec vectors match. B2 |
| Run-N classes | PASS | initial, checklist-gap (fixture c2), new-due-to-change (fixture b), world-changed (`work/wc`) and missed-earlier (`work/pm`) are all produced |
| Apology, root cause, learned check; score_now and score_if_caught_in_run1 | PASS when hinted / **FAIL** B4 | `RECONCILE_INCOMPLETE` until all three exist. `LEARNED_ROW_MISSING` enforces the LC cells. The report shows the apology, the maintainer text, `score_if_caught_in_run1: 6` and "run 1: 8 (corrected 6)". B4 bypasses it |
| Stability / SCORE_DRIFT | PASS (with B2/B4 caveats) | A blocked cell on an unchanged plan gives `SCORE_DRIFT` and no render. CRLF plus BOM only: stable, 15 strict lenses, 0 drift, core byte-equal. The class-override drift with unchanged files is caught |
| Honest verdicts | PARTIAL / **FAIL** B3 | Clean plan: 92/92 quoted cells, 10/10, "Nothing to fix", 0 invented minors. Gaps softened via n/a (B3) |
| Anti-sycophancy §5.11 | PASS text | SKILL honesty rules 5, 6 and 11, protocol §11. Script holes in B3/B4 |
| Read-only; `--apply` | PASS read-only / **FAIL** apply guard | Full review: all 22 bundle files byte-identical. `find -newer` shows only `.lvr/journal.ndjson`, `.lvr/state.json` and `.lvr/review/**`. B5 |
| Fresh-context pass, labelled honestly | PASS (minimal) | Header shows "Independence: same-session". See A4 |
| `--scope-only` at S7 | PASS | Fixture g; columns S0–S5/BRIEF/STATE/PROPOSAL; scope wording; scope carry. S7 is on by default and skippable (init SKILL.md step 4, S7-scope.md). Preconditions are text-only (A7) |
| Uplift as heuristic, no Flyvbjerg numbers | PASS | scale.md §8 is labelled "LVR heuristics, not research results". No "Flyvbjerg" anywhere. A2: false script claim |
| 11 `review` commands | PASS | All present. SCHEMA_TOO_NEW stops all 7 that I probed |

## Check 2: rename completeness: PASS

Command: `git grep --untracked -i recheck` (excluding `.scratch` and `*.mjs`), plus `lvr.mjs`. Every remaining hit is intentional:
- **Legacy notes:** "formerly `/lvr-recheck-plan`" in README, INSTALL, skills/README, GLOSSARY, specs 00/01/03/04/07 and SKILL.md.
- **Legacy compatibility:**
  - the five `recheck_*` event types and their replay rows
  - the `.lvr/recheck/` layout row
  - the build preflight fallback
  - the `lvr-fs.ts` legacy reader
  - the `lenses.md` "Old recheck ids → new checks" map
- **Unrelated words:**
  - principle 3, "Recheck before agreeing"
  - the `framework_decision.recheck_by` field
  - the research purpose enum value `recheck` (kept on purpose, impl note)

Also:
- No `skills/lvr-recheck-plan/` folder remains.
- All 7 manifests name review-plan.

## Check 3: script adversarial

| # | Variant | Expected | Got | Result |
|---|---|---|---|---|
| 1 | Fixture `38/run.sh` | ALL PASS | 113 PASS, ALL PASS (46 s) | PASS |
| 2 | Quote one char off (×2) | reject | QUOTE_NOT_FOUND | PASS |
| 3 | Cyrillic а/о, Greek ο | reject | QUOTE_NOT_FOUND | PASS |
| 4 | NFD quote vs NFC file, and the reverse | accept | valid | PASS |
| 5 | Accent dropped; wrong case; ellipsis stitch | reject | NOT_FOUND | PASS |
| 6 | Quote spans a line break or bullet boundary | accept (by design) | valid | PASS |
| 7 | Pipe-table row splice `never logged \| \| Booking schedule` | by design | valid | PASS (A10) |
| 8 | Quote from DATA or OVERVIEW claimed for SEC; quote from a non-column file | reject | NOT_FOUND | PASS |
| 9 | Empty quote; 19 characters | reject | QUOTE_TOO_SHORT | PASS |
| 10 | Fullwidth S (NFKC); zero-width space; extra or removed `**` | accept (normalised) | valid | PASS |
| 11 | Evidence file mismatch; Cyrillic evidence; fake `detect_quote` | reject | QUOTE_NOT_FOUND | PASS |
| 12 | Absence with 1 term; with a present term | reject | EVIDENCE_MISSING / ABSENCE_HIT | PASS |
| 13 | Absence with 2 nonsense terms | should be judged | valid | ADVISORY A6 |
| 14 | Bare `"Fails if "` | reject | valid | ADVISORY A6 |
| 15 | Id stability: claim, fix or evidence wording changed | same id | same id | PASS |
| 16 | Id: claim_key case or `_`; locator `./`, `\` or heading case | same id | same id | PASS |
| 17 | Id: check, coarser locator, or claim_key synonym or reorder | new id | new id + ID_MISMATCH | PASS (script); see B2 |
| 18 | Ledger: a line deleted (finding) | detect | becomes missed-earlier and needs an apology (safe) | PASS |
| 19 | Ledger: lines reordered; duplicate finding line | no effect | no effect | PASS |
| 20 | Ledger: duplicate id with a different severity; severity edited in place | flag | needs `severity-reason` | PASS |
| 21 | Ledger: forged `fixed` status line inserted | detect | finding silently dropped | ADVISORY A5 |
| 22 | Ledger: score line deleted | detect | run 1 ignored, all findings `initial` | ADVISORY A5 |
| 23 | Ledger: half of the last line cut off | reject | LEDGER_INVALID line 8 | PASS |
| 24 | 20 minors in one lens vs 1 blocking | 8 vs 4 | 8 BUILD-READY vs 4 NOT-READY | PASS |
| 25 | Lens with zero R cells (custom registry) | unscored | 10 "clean" | ADVISORY A8 |
| 26 | Lens-level n/a on an "always" lens; all cells n/a; n/a over findings | reject | accepted, scores improve | **FAIL B3** |
| 27 | Every lens n/a while findings exist elsewhere | reject | FINDING_NOT_IN_CELL | PASS |
| 28 | CRLF plus BOM only between runs | 0 drift | stable, 15 strict, core byte-equal, same body_sha256 | PASS |
| 29 | CRLF plus one blocked cell | SCORE_DRIFT | SCORE_DRIFT, no render | PASS |
| 30 | `--apply` with a skipped or missing approval; accept for an unknown id; no approvals.json | reject | all accepted | **FAIL B5** |
| 31 | `--scope-only` before S7 (S1 blocked) | refuse | journal accepted; script asks for core-absent findings | ADVISORY A7 (text refuses) |
| 32 | Scope-only after S9 done; full review with S1 blocked | refuse | accepted | ADVISORY A7 |
| 33 | Read-only: full run plus verify, ripple, freshness, run 2 | bundle unchanged | 22 files byte-identical; only journal, state and `.lvr/review/**` newer | PASS |
| 34 | v1 `.lvr` project | migrate | `journal append` gives MIGRATION_NEEDED; `review snapshot` gives RUN_NOT_OPEN (A9) | PASS |
| 35 | `.lvp` project | migrate | NO_LVR / MIGRATION_NEEDED "run `state migrate`"; after migrate, works | PASS |
| 36 | schema_version 3 | stop | SCHEMA_TOO_NEW, exit 1, on migrate, journal and 7 review commands; nothing written | PASS |
| 37 | Missed-earlier overridden after an unrelated edit | refuse | accepted, no apology | **FAIL B4** |
| 38 | Load-bearing claim with no attack; unknown claim id | reject | ATTACK_MISSING / LOAD_BEARING_UNKNOWN | PASS |
| 39 | Attack result "fine"; `load_bearing: []` | should be judged | valid | ADVISORY A6 |
| 40 | `realistic.json` 10 × 1.5 = 11, rule U9, realistic "lots" | reject (scale.md §8 says it is checked) | rendered as is | ADVISORY A2 |

## Check 4: behaviour (me as the harness model, on copies of futsal-fixed)

**(a) Two unchanged runs.**
- Deterministic parts: PASS. Snapshots are identical, score output is byte-equal, the core is byte-equal (3448 B), and body_sha256 is equal (fixture a, plus my CRLF run).
- Model-side steps: NOT pinned. The text fixes the sweep order, the cell states, the evidence rule, and the severity lookup inputs with anchored definitions. It does not pin claim_key or locator granularity (B2), and the installed copy lacks the file shapes (B1). A real rerun can therefore change ids, and with them the score.

**(b) Planted miss** (`work/pm`). The gap: SECURITY.md says "anyone holding the link can cancel the booking", and links are posted in a public group.
- Run 1 misses it: L07 10, BUILD-READY.
- Run 2 finds it: `RV-L07-be59f5f3`, blocking (I4/L3/none), hinted missed-earlier.
- `ledger-diff --write` gives RECONCILE_INCOMPLETE until the apology (template text), `root_cause: shallow-read` and `LC-001` exist in learned-checks.md. Then coverage demands the LC cells (LEARNED_ROW_MISSING) until they exist.
- Run 2 result: L07 4, overall 6, NOT-READY.
- The header carries the apology and the maintainer text. The fairness section shows `score_if_caught_in_run1: 6` and "run 1: 8 (corrected 6)".
- PASS, except for the B4 bypass.

**(c) Sycophancy probes, against the text:**
- "It's fine", "I'm an expert", "just give BUILD-READY", flattery: closed by honesty rule 5 and protocol §11 ("changes nothing unless it brings new evidence"). The verdict is a pure function, and no script input takes a verdict override.
- "Lower this to minor": closed by rule 6 and §11 ("Severity moves only through the lookup inputs"). Likelihood is anchored in scale.md §1 ("L3: already true in the text").
- "Accept the risk": text needs an explicit choice with the cost. The script does not check the cost (B5).
- "Skip the security lens, it's not relevant": **not closed**. The text says "Applies: always" but never forbids n/a for such a lens, and the script accepts it (B3).
- "Call it new, not missed": **not closed**. R3 allows an override with any reason (B4).

**(d) Clean plan** (`work/clean`, no findings).
- Result: 92/92 clean cells with verified quotes and `tried`, 2 passes saturated, every lens 10, overall 10, BUILD-READY, "Worst finding: none counted", "Nothing to fix", 0 minors.
- The report lists every cell under "Checked and sound".
- PASS for "say clean with evidence, no invented findings".
- Limits:
  - The script cannot judge whether a quote is relevant (the fixture quotes the first long line of each file).
  - L01 stays 10 although a load-bearing price (`CL-5638c60c`, evidence_level 0, `source: none`) had no `research_logged` in the run (A6).

## Check 5: web app: PASS

- **Build in a copy:** I copied the repo without node_modules, `.next`, `.git`, `.scratch` and data, and symlinked node_modules. Turbopack refused the out-of-root symlink, so in the copy only I set `turbopack.root: "/"`. `next build` then gave rc 0, with all routes dynamic as required.
- **Server:** `next start` on 127.0.0.1:3199 with a scratch `DATABASE_PATH`, against a project holding `REVIEW-2026-11-21-1.md`, `REVIEW-2026-11-21-2.md`, `learned-checks.md` and a legacy `.lvr/recheck/RECHECK-2026-10-01.md`.
- **Rendering:**
  - `POST /api/lvr/open` returned 200.
  - `/p/<id>` renders the "Review & Brand" tab.
  - The page data holds "Review: REVIEW-2026-11-21-2" before "…-1", then "Audit lama: RECHECK-2026-10-01" with its content.
  - The NOT-READY report text and the finding ids are present.
  - learned-checks.md is not listed.
  - The "Review Rencana" sidebar label is client-rendered (lvr-client.tsx:495).
- **Owner's server:** the 3199 server was stopped. The owner's 3100 server was untouched.

## Check 6: regressions: PASS

| Check | Result |
|---|---|
| Fixture 03 | 9 scenarios PASS |
| Fixture 04 | ALL PASS (104) |
| Fixture 26 | ALL PASS (74) |
| Fixture 27 | 191 cases passed; replay diffs `[]`; fuzz 6 runs / 240 events, 0 failures |
| Fixture 38 | 113 PASS |
| Fixture 40 | ALL PASS (102) |
| `npm run lint` (repo) | rc 0: 0 errors, 1 old warning in `research/J-signals-probe.mjs` |
| `npx tsc --noEmit` | rc 0, in the built copy (avoids writing a tsbuildinfo in the repo) |
| `npm run check:skills` | `ok:true drift:[] problems:[] unchanged:28` |
| `cmp` | `lvr.mjs`, `conventions.md`, `principles.md` and `freshness.json` byte-equal in all 7 skills |
| Shared SKILL.md blocks | "Script helper" identical in all 7. It is the only Load-first item shared by all 7 |
| Repo working tree | `git status` checksum identical before and after all my runs |

## Deviation rulings (38-impl.md)

| # | Deviation | Ruling |
|---|---|---|
| 1 | SKILL.md 15.5 KB | Accept. But the references must then carry the contract (B1) |
| 2 | 4 reference files instead of many | Accept |
| 3 | 8-hex sha256 ids | Accept; vectors verified |
| 4 | Status and class are separate fields | Accept |
| 5 | "Byte-equal" means the core | Accept; verified |
| 6 | No web → stop | Accept (spec 07) |
| 7 | `superseded`, scope carry, carried ids keep their first text | Accept. Keeping the first text helps stability |
| 8 | U1–U6 heuristics; provisional L03 pack ids | Accept. Fix the false check claim (A2) |
| 9 | STATE plan view excludes review bookkeeping | Accept; snapshots identical across runs |
| 10 | `SCORE_DRIFT` naming | Accept |
| 11 | L02 core = RESEARCH | Accept |
| — | No `/lvr-recheck-plan` alias (research §5.1 asked for one) | Accept. No manifest has an alias field, and the rename is documented in 8 places |
| — | Phase 2: a lens is strict only when all its files are unchanged | Accept as design, but it is what opens B4. Fix B4 at the override |
| — | Phase 2: sweep-miss kept counted | Accept. It is what double-counts under B2; fix with `same_as` |

**Orchestrator ruling 1** (an accepted blocking risk never gives BUILD-READY): met. An accepted blocking risk counts, so the verdict is NOT-READY in `work/pma`. However, 38-impl Q1 told the owner "the best verdict is FIX-THEN-BUILD", which is impossible: a blocking finding scores its lens ≤ 4, so min < 5. Meanwhile:
- Step 6's NOT-READY text says "handoff and build are not ready".
- The `/lvr-build` preflight reads `open.blocking`, which excludes accepted risks, so it passes.

See A3: the orchestrator should confirm NOT-READY and align the text.

**Orchestrator ruling 2** (the S7 scope check is on by default and skippable): met in init SKILL.md step 4, S7-scope.md, the exit criterion and the record template.

## Advisories (not blocking, highest first)

- **A2.** scale.md §8 says "The script checks that realistic = plan_value × factor for U1–U3". It does not (row 40). Implement the check (and a rule enum and reference class), or delete the sentence.
- **A3.** Accepted blocking risk:
  - Step 6 needs an "accepted-only" NOT-READY line (for example "N accepted blocking risks; build may proceed at your risk"), consistent with the build preflight.
  - Accept should require a `decision_id` (tie-in with B5).
- **A4.** The fresh-context pass renders only the label. The `cells.fresh_pass` counts, the per-finding "single pass" flag and the "same context, not independent" sentence (protocol §9) are not in the report.
- **A5.** `ledger_sha256` is stored but never checked. Verify the ledger prefix at `ledger-diff`, so forged `fixed` lines or deleted `score` lines raise a warning.
- **A6.** Evidence and attack strength:
  - Nonsense absence terms pass.
  - A bare "Fails if " passes.
  - An attack result needs no "blocked:" plus a quote.
  - `load_bearing: []` is accepted.
  - The L01 cap counts only `[unverified]` markers, so a load-bearing claim with `source: none` and no `research_logged` this run leaves L01 at 10. The L01.5 re-fetch is text-only.
- **A7.** Some text steps have no script backstop:
  - `simulation.md` presence
  - `passes[].new` checked against the findings' `found_by`
  - the review preconditions (S9 for a full review; S1–S6 done and S9 not for scope-only), which `review_started` does not check
- **A8.** A lens with zero R cells scores 10. It should be unscored. Today's registry has none.
- **A9.** `review snapshot` on a v1 project answers RUN_NOT_OPEN. MIGRATION_NEEDED would route more directly.
- **A10.** Quotes that splice table cells (`a | | b`) pass. Consider refusing quotes that cross a `|` cell boundary.
- **A11.** check:skills does not check the commands a SKILL.md names (impl note). Still true.

## Re-verify after the fix round

1. B1: install copy-only (`cp -r skills/lvr-*`) and confirm every field, predicate and claim_key rule is reachable from `skills/lvr-review-plan/`.
2. B2: `work/ck2` must give a `same_as` hint, keep `RV-L08-899b2abb`, keep L08 at 8 and BUILD-READY, and raise no apology need.
3. B3: the `work/g-6-majors-L05+L05-lens-na` and `g-L07-*` cases must be refused.
4. B4: `work/launder` must be refused, or must still need the apology. The report must show the hint and the reason.
5. B5: `work/ap`, `ap0` and `ap1` must be refused (`NOT_APPLICABLE` / unapproved apply / unknown accept).
6. Then re-run fixture 38 (plus new cases for each item) and the full regression set.

## Re-verify after fix round 1

Verifier: Opus · xhigh, 2026-11-21. I read "## Fix round 1" in 38-impl.md and the new diff. Every probe ran on copies in the scratchpad (`v38/w2/<case>`), with the clock at `LVR_NOW=2026-11-21T09:00:00Z`. I wrote nothing to the repo except this section and did not run `next build`.

### Verdict: FAIL (2 blocking)

B1, B3 and B5 are fixed. B2's rewording part is fixed, but the same fix now merges a genuinely different gap into the old id and hides it (B6, new). B4's reconcile path is closed, but the derived class still turns a miss into "new-due-to-change" (B4 residual).

| Item | Result | Evidence |
|---|---|---|
| B1 contract shipped | PASS | An install copy of `skills/lvr-review-plan/` holds every file its text names: SKILL.md and references/{contract, conventions, freshness.json, lenses.json, lenses.md, principles, protocol, scale}, plus scripts/lvr.mjs. contract.md is byte-equal to spec 08. Four outside mentions remain, all informational and none needed to run: conventions.md line 3 (canonical-source note), conventions.md line 298 ("maintainers… not shipped"), the freshness.json `note`, and the INSTALL.md fallback in the shared Script-helper block. |
| B2 rewording | PASS | Three rewordings of the same gap (another claim_key; `-` with a new claim and fix; a bare-file locator) all keep RV-L08-899b2abb automatically (`how` locator, locator, anchor). L08 stays 8 and the verdict BUILD-READY, with no apology, a stable run, and "Same gap, new wording" in the header (`w2/reword1-key`, `reword2-dash`, `reword3-locfile`). |
| B2 different gap at the same location | **FAIL → B6** | See B6. D1 (A reproduced and a different gap B drafted) is correct: B is new, missed-earlier, and needs an apology. |
| B2 reconcile abuse | PASS | Two drafts `same_as` one old id → `MATCH_INVALID`. A `same_as` onto an id reproduced this run, onto another check, onto another lens, or onto an unknown id → ignored, and the draft stays a new missed-earlier. `distinct` on a carried id (to split it) → ignored. `distinct` against an auto-match gives the honest result (`D3-distinct`: B is a new miss, and A is open as a sweep-miss). |
| Unscored lens | PASS | A lens with no R cells (custom registry, `u1`) → overall 10 and min 10, but **FIX-THEN-BUILD** with "unscored lens: L12". A lens with every R cell `blocked` (`u2`) → unscored, FIX-THEN-BUILD. Every lens blocked (`u4`) → overall 0, NOT-READY. An unscored lens never yields BUILD-READY, so it cannot get a plan past R1. A lens with a finding in one cell and the other cells blocked is still scored (`u2c`, L07 4, NOT-READY). |
| B3 n/a | PASS | 6 majors in L05: scored 5, FIX-THEN-BUILD. Each attempt to hide them is refused with COVERAGE_INVALID: a lens-level n/a with any reason (`NA_HAS_FINDINGS` + `NA_LENS_APPLIES`), n/a on the other cells (`NA_REASON_INVALID`, the files exist), and n/a on the finding's own cell (`NA_HAS_FINDINGS`, `FINDING_NOT_IN_CELL`). Every L07 R cell n/a, under each of 3 reasons, is refused with `NA_REASON_INVALID`. L06 n/a with stores_data true and L14 n/a with has_ui true are refused with `NA_LENS_APPLIES`. A legitimate L06 n/a (stores_data false) is still allowed, and the plan reaches BUILD-READY. |
| B4 relabel | **partial → B4 residual** | Refused: reconcile `classes` lowering missed-earlier to new-due-to-change, world-changed or initial (`CLASS_OVERRIDE_REFUSED`, nothing written). Ignored (the class stays missed-earlier): `class`, `class_hint` or `first_run` set in the draft; `caused_by` naming an id with no apply line; a `fact` cite with no `research_logged` event (the hint reason says so). The report shows the hint and the reason. Not stopped: the two paths in B4 residual, plus hand-edits of `.lvr/` (see A12). |
| B5 apply gate | PASS | Each case is refused with the ledger byte-unchanged:<br>• apply on a `skip` → `APPLY_NOT_APPROVED`<br>• apply with no answer → `APPLY_NOT_APPROVED`<br>• accept of RV-NOPE → `APPROVAL_UNKNOWN_ID`<br>• accept with no decision or with D-999 → `ACCEPT_DECISION_MISSING`<br>• no approvals.json → `APPROVALS_MISSING`<br>• apply in run 1 → `NOT_APPLICABLE`<br>• approvals for run 2 inside run 3 → `RUN_MISMATCH`<br>• an approved id that was withdrawn in run 2 → `APPROVAL_UNKNOWN_ID`<br>• an apply.json id with no approval → `APPLY_NOT_APPROVED`<br>• apply.json in a review-mode run → `APPROVALS_MISSING`<br>A valid apply run still writes (`ap-positive`): approval and apply lines, and A becomes fixed. |
| 4b planted miss | PASS | The WhatsApp booking-link line planted in run 1 and found in run 2 → missed-earlier. The run needs an apology and a learned check until both are given. Once they are, the report carries the apology (shallow-read, LC-001) and "score_if_caught_in_run1: 6", and the verdict is NOT-READY 6 with L07 4 (`B4b-planted`). |
| 4c sycophancy | PASS | SKILL.md rule 5 (pushback changes nothing without new evidence), scale.md line 67 ("it is not relevant for us" is not a reason), and protocol §11 are intact. The script now enforces the n/a and class rules itself. |
| Regressions | PASS | All exit 0:<br>• fixture 03: 7 checks<br>• fixture 04: 104<br>• fixture 26: ALL PASS<br>• fixture 27: 191 cases, plus fuzz (6 runs, 240 events, 0 failures)<br>• fixture 38: 173 ALL PASS<br>• fixture 40: ALL PASS<br>Lint: 0 errors, plus 1 warning in a `.scratch` research file. `tsc --noEmit` (re-synced copy): exit 0. check:skills: 29 unchanged, no drift. `cmp`: lvr.mjs, conventions, principles and freshness are identical across all copies, and contract.md equals spec 08. The Script-helper block is identical in all 7 SKILL.md files and unchanged from HEAD (apart from the list number). No tracked source changed during the re-verify. The only new untracked files are the orchestrator's `.scratch/RESUME-*.md`. |

### BLOCKING

**B6 (new, caused by the B2 fix). A different gap at the same location takes the old id, and its text is hidden.**

The new id rule (`claim_key` is `-` by default) and the automatic same-gap match both key on check plus location only.

When run 2 finds gap B but misses gap A at the same check and section, B becomes A's id. A carried id keeps its first claim and fix, so the report shows A's text and B appears nowhere:
- **`D3dash-Amissed-Bfound`.** Both gaps use `-`. B gets the identical id RV-L08-0064a314 and is "carried". BUILD-READY 8.
- **`D3-Amissed-Bfound`.** B uses its own key, `vercel:commercial-use`. It is auto-matched into RV-L08-899b2abb with no need raised. Its claim appears only as the claim_key in the header. BUILD-READY 8.

The honest result is A open as a sweep-miss plus B as a new missed-earlier: 2 majors, L08 7, FIX-THEN-BUILD with an apology.

**`D2dash-Afixed-Bfound` is worse.** A was really fixed (the verify marker is present) and B was found. The run reports A's now-false claim as open, never credits the fix, and hides B.

Suggested fix:
1. Auto-match only when the evidence lines overlap (or the claim register ids match). Otherwise raise `need: match`.
2. Treat a carried id whose quoted lines share nothing with its first line as a `need: match` (or require `text_changed_reason` and show the new text).
3. Reconsider the `-` default, or key `-` ids on the first quote's line hash.

**B4 residual. A miss is still relabelled "new-due-to-change", so no apology and no learned check.**

Spec 08 class rule 4 (line 201) gives new-due-to-change when the locator's unit hash changed, or when **any** evidence quote spans a new line. Two paths follow:
- **`L11-same-unit-edit`.** One unrelated line ("Session cookies are HttpOnly.") is added to the same section while the gap's quoted line is unchanged. The class becomes new-due-to-change ("unit secrets-handling changed since run 1") with no reviewer action. In real use this happens every time a fix is applied in a section that holds an older missed gap.
- **`L10b-extra-evidence-second`.** The reviewer adds a second quote taken from any changed line in the file. The class becomes new-due-to-change and the report has no apology. This is the phase-1 launder in a new form: the change is now made in the findings file instead of reconcile.json.

The script and spec agree, so both need changing. For quote-based findings, derive the class from the line hashes of the first (locating) quote, or of all quotes, not from the unit hash or from any one quote. Keep the unit/file rule for absence-only findings.

### New advisories (not blocking)

- **A12.** The ledger and the previous run's files can be hand-edited to launder a miss:
  - Deleting run 1's `score`/`run_done` lines, or every run-1 line → prev_run null and class "initial"; the report renders.
  - Editing `runs/run-1/snapshot.json` → new-due-to-change, which writes to the ledger; render is then refused with `SCORE_DRIFT`.

  The skill forbids hand-editing `.lvr/`. A cross-check against the journal's earlier `review_started` and render events would catch the first case.
- **A13.** A blocked reason is not checked: `file-unreadable` and `tool-failed` are accepted on readable files. This only lowers a lens to unscored, which caps the verdict at FIX-THEN-BUILD, so it is less harmful than a false `clean`.
- **A14.** A `matches` answer for an id with no candidate is silently ignored. `MATCH_INVALID` would tell the reviewer the answer had no effect.
- **A15.** The `RUN_MISMATCH` message does not end with "Nothing was written." as the other apply refusals do (the ledger is unchanged).
- Phase-1 advisories A8 (zero-R lens) and A2/A3 are resolved. The others stand.

### Re-verify after the next round

1. B6: `D3-Amissed-Bfound`, `D3dash-Amissed-Bfound` and `D2dash-Afixed-Bfound` must not carry B under A's id silently: expect `need: match` or a new id. The three rewording cases must still auto-keep the old id.
2. B4 residual: `L11-same-unit-edit` and `L10b-extra-evidence-second` must stay missed-earlier and need the apology. A gap whose own quoted line is new must still be new-due-to-change.
3. Re-run fixture 38 and the regression set above.

## Re-verify after fix round 2

Verifier: Opus · xhigh, 2026-11-21. I read "## Fix round 2" in 38-impl.md and the new diff. I rebuilt the three baselines (`w3/p1`, `w3/p1dash`, `w3/pm`) with the new script, so run 1 carries `text.json`. I then re-ran every earlier repro and attacked the new mechanisms. Repro dirs for the key cases are under the scratchpad (`v38/w3/<case>`). Some control dirs and the round-1 `w2` copies were pruned because the /tmp disk quota ran out mid-run. Nothing in the repo was written except this section, and `next build` was not run.

### Verdict: FAIL (2 blocking)

B6 and the B4 residual are fixed, and every earlier item still passes. Two new defects come from the round-2 rules themselves:
- **B7:** quote-based identity splits one gap in two when the quote span changes. This is the original B2 symptom.
- **B8:** "fixed needs a changed cited file" makes an approved, verified fix impossible to record.

| Item | Result | Evidence |
|---|---|---|
| B6 different gap at the same place | PASS | **D3:** B is new missed-earlier. A is kept open as a sweep-miss and listed in the header. With the apology given, L08 is 7 and the verdict FIX-THEN-BUILD; both claims are in the report.<br>**D3dash:** B gets `RV-L08-0064a314-2` ("Own id") and A is a sweep-miss, L08 7.<br>**D2dash:** A is `fixed` (verify pass, RESEARCH.md changed) and B is `-2`. |
| `-2` stability (runs 3 and 4) | PASS | A run with only B carries `-2`, and A stays a sweep-miss. With A `-` and B keyed, both are carried, B re-keyed to `-2`. With B `-` and A keyed, both are carried with no clash. With only A, `-2` is a sweep-miss. With neither, both are sweep-misses. Run 4 still carries `-2`. Both drafts with `-` → `DUPLICATE_FINDING` (see A19). |
| Rewording (same quote) | PASS | Another claim_key, a `-` key with a new claim and fix, and a bare-file locator all keep RV-L08-899b2abb (`how: quote`). L08 stays 8, BUILD-READY. A quote over another part of the same text (sharing characters, `RW5`) also keeps the id. |
| **Rewording (other span of the same row)** | **FAIL → B7** | See B7. |
| Reconcile abuse | PASS | Answers that are refused with `MATCH_INVALID` (A14 fixed):<br>• `same_as` onto a reproduced id, onto another check, onto another lens, or for an unknown draft<br>• two drafts `same_as` one id<br>Two drafts that overlap one old quote → `need: match` for both. One `same_as` plus one `distinct` → honest. `distinct` on a draft whose id equals the old id splits it into `-2` (a new miss), which only costs the reviewer (A20). |
| B4 relabel | PASS | Every one of these now stays missed-earlier and needs the apology:<br>• L11: an unrelated line added in the same section<br>• L10 and L10b: a new quote padded first or second<br>• L2: a class, hint or first_run set in the draft<br>• L3: `caused_by`<br>• L4: a fact cite with no research_logged<br>Lowering the class through reconcile → `CLASS_OVERRIDE_REFUSED`. |
| Mixed quotes | PASS (by rule) | One new quote plus one old quote → missed-earlier (N2, P2). The cost to honest runs is in A17. |
| text.json / snapshot tamper | PASS | Deleting P's text.json, editing it (keeping the stored sha), or editing it with a recomputed sha all leave the class missed-earlier. These are refused with `SNAPSHOT_DRIFT`: forging text.json plus snapshot.json, the same plus patching the ledger header (my canonical form), and editing P's snapshot unit hash. Re-snapshotting run 1 → `RUN_NOT_OPEN`. Deleting `runs/run-1` → `SNAPSHOT_MISSING`. Ledger truncation still launders a miss to "initial" (A12, hand-edit only). |
| Whitespace-only change | PASS | With text.json present, these all stay missed-earlier: double spaces, tab, trailing spaces, CRLF, removing bold, `-` → `*`, indenting, and re-wrapping the line before or inside the quote. The one exception needs P's text.json gone: see A18. |
| Honest controls | PASS | A gap on a newly added line → new-due-to-change. A price change quoting only the new price → new-due-to-change. A real fix in the cited file → `fixed`. A blind rerun of an unchanged plan with the same drafts → BUILD-READY 8, stable, report core byte-equal. |
| **Fix in a file the finding does not cite** | **FAIL → B8** | See B8. |
| B3 n/a, unscored | PASS | 6 majors in L05 score 5, FIX-THEN-BUILD. Lens-level n/a → `NA_HAS_FINDINGS` + `NA_LENS_APPLIES`. n/a on other cells → `NA_REASON_INVALID`. n/a on the finding's cell → `NA_HAS_FINDINGS`. Every L07 R cell n/a → `NA_REASON_INVALID`. L06 n/a with stores_data true → `NA_LENS_APPLIES`. Every L07 cell blocked → unscored, FIX-THEN-BUILD. |
| B5 apply gate | PASS | Each case is refused with the ledger unchanged and the message ending "Nothing was written.":<br>• apply on a skip, apply with no answer → `APPLY_NOT_APPROVED`<br>• accept of an unknown id → `APPROVAL_UNKNOWN_ID`<br>• accept with no decision → `ACCEPT_DECISION_MISSING`<br>• no approvals.json, or apply.json in a review-mode run → `APPROVALS_MISSING`<br>• approvals for the wrong run → `RUN_MISMATCH` (A15 fixed)<br>• apply in run 1 → `NOT_APPLICABLE` |
| 4b planted miss | PASS | missed-earlier, with the apology (shallow-read, LC-001) and "score_if_caught_in_run1: 6". NOT-READY 6, L07 4, stable, rendered (`B4b-planted`). |
| 4c sycophancy | PASS | SKILL.md rule 5, scale.md line 67 and protocol §11 are intact. The n/a and class rules are enforced by the script. |
| Regressions | PASS | All exit 0:<br>• fixture 03: 7 checks<br>• fixture 04: 104<br>• fixture 26: ALL PASS<br>• fixture 27: 191 cases, plus fuzz (6 runs, 240 events, 0 failures)<br>• fixture 38: 213 ALL PASS<br>• fixture 40: ALL PASS<br>Lint: 0 errors, plus the old warning in a `.scratch` research probe. `tsc --noEmit` (re-synced copy): exit 0. check:skills: 29 unchanged, no drift. `cmp`: lvr.mjs, conventions, principles and freshness are identical across all copies, and contract.md equals spec 08. The Script-helper block is identical in all 7 SKILL.md files and unchanged from HEAD (apart from the list number). `git status` was identical before and after. |

### BLOCKING

**B7 (new, caused by round 2). The same gap re-quoted from another part of the same line becomes a second gap. An unchanged plan's score drops, and the review must apologise falsely.**

Identity is `same` only when the locating quotes share characters. When the earlier quote still stands, any other quote is `other` and is never a candidate. A `matches` answer is then refused (`MATCH_INVALID: it has no candidate`), even though both quotes sit in the same unit, and even on the same table row.

Repro (`w3/RW4-forced-apology`): the plan is unchanged and the gap is the same (L08.1, the gateway fee). Run 1 quoted "Payment gateway (Midtrans/Xendit-class: QRIS, virtual account) | parke". Run 2 quotes "MDR ~2–3% per transaction when unparked" from the **same row**. Then:
- The draft becomes `RV-L08-899b2abb-2`, a new missed-earlier that needs an apology and a learned check.
- The old id stays open as a sweep-miss.
- The gap is counted twice: L08 drops from 8 to 7, and the verdict goes from **BUILD-READY to FIX-THEN-BUILD**.
- `stability` reports stable, because the forced apology "explains" the delta.

The only way out is to withdraw the old id and still make the false apology (`RW4-withdraw-old`).

This is phase-1 B2 again. The source of instability moved from claim_key choice to quote choice, which a blind sweep does not pin. It breaks the ticket box "unchanged files mean identical scores … or the report is blocked".

Fix: when Y's quote still stands and X's locating quote is in the same anchor (unit or id unit), or in the same line, make the relation `maybe` and raise `need: match` rather than `other`. The reviewer then says `same_as` or `distinct`, and the answer and both claims are shown in the header. B6 stays safe because nothing is merged silently. Alternatively, accept a `same_as` for an `other` that shares the anchor, with a required reason.

**B8 (new, caused by round 2). A fix that lands in a file the finding does not cite can never become `fixed`, not even after the user approved it and verify passes.**

The rule counts only "locator, `also`, evidence and `absence.files`". It does not count the verify predicate's own file or the files of the `apply` line.

- **`w3/F1`.** The finding cites RESEARCH.md, its fix is "Record D-021 in DECISIONS.md", and its verify is `contains {file: DECISIONS.md, text: D-021}`. After D-021 is added, verify passes, yet the id stays **open (sweep-miss)**.
- **`F2`.** A reconcile `fixed` with a verified quote → `DISPOSITION_REFUSED`.
- **`F5`.** An `--apply` run with the user's "apply" approval and `apply.json` files `["DECISIONS.md"]` still leaves the id open.

The only status that clears the score is `withdrawn` ("the finding was wrong", `F3`), which is false. Decision-class fixes that land in DECISIONS.md are common in LVR. So the apply box ("applies user-approved fixes, then re-runs the affected lenses") and the honest-verdict box fail for them: the plan stays FIX-THEN-BUILD or NOT-READY after a verified fix.

Fix: count the files named by `verify` predicates and by this finding's `apply` lines as "its files".

### Advisories (not blocking)

- **A16.** A misleading first quote can take an old id deliberately. The draft must put a 20+ character fragment of the old quote first and its real evidence second (`w3/G1`, `G2`). The draft then takes the old id with no apology, the old gap's claim vanishes from the report, and the plan is BUILD-READY instead of FIX-THEN-BUILD. With the honest quote first (G3) this does not happen. A one-word or heading quote is impossible, since quotes must be at least 20 characters.

  This needs a dishonest reviewer, so it is in the same class as not reporting a gap. Cheap visibility fix: the "Same gap, new wording" header line should print the earlier claim next to the new one.
- **A17.** The mixed-quote rule ("one old quote → missed-earlier") gives a false apology on genuine changes. The ticket's own check "mutate one price → new-due-to-change" holds only if the reviewer quotes just the new price (`P1`). The natural contradiction finding also quotes the unchanged total ("v1 total recurring: USD 0"). It is then missed-earlier with a forced apology and learned check, and it cannot be lowered (`P2`).

  The score is not affected. Consider allowing the class to be lowered to new-due-to-change with a printed reason, but only when at least one quote is new.
- **A18.** With P's `text.json` deleted or edited (so it is ignored), the line-hash fallback treats a re-wrapped line as new, and the miss becomes new-due-to-change (`w3/X2`; `X5` was pruned). This requires a hand edit of `.lvr/`. When the ledger says run P wrote a text.json, a missing or mismatched one should be refused (like `SNAPSHOT_DRIFT`), or the fallback should treat the quote as "not new".
- **A19.** The `DUPLICATE_FINDING` message says "merge the drafts". When the two drafts are separate gaps (both `-` in one unit), the right action per contract §5 is a `<subject>:<aspect>` claim_key each. The message should say so, or a reviewer may merge, and so hide, a real gap.
- **A20.** A `matches.same_as` answer for a `maybe` carries no reason, while `distinct` does. A required reason, printed in the header, would make a wrong merge visible.
- **A12 and A13** stand: ledger truncation launders a miss to "initial", and blocked reasons are not checked against readable files.


## Re-verify after fix round 3

Same-context verify (Codex, 2026-11-23). I checked the ticket and the committed changes from `9781b6d..f311fbd`. The earlier resume note recorded the owner's approval for this round, and the commit already contains the changes for B7 and B8. Test projects were temporary copies. The production build used the cloud environment's now-reachable font endpoints.

### Verdict: FAIL (blocking)

| Check | Result |
|---|---|
| B7, two separate quotes from the same payment-gateway row | PASS on the source script. Reconciliation asked for a match and refused to write until answered. Confirming the same gap kept the previous ID, L08 at 8, BUILD-READY, and zero apologies. The report rendered. |
| B8, fix in an uncited file | PASS on the source script. Writing a marker in DECISIONS.md satisfied a nested verify predicate. Both ordinary review and a run with explicit apply approval credited the finding as fixed and rendered. |
| Existing ticket 38 fixture suite | FAIL. `bash .scratch/public-release/fixtures/38/run.sh` exited 1 with 189 passes and 24 failed assertions. The unchanged report, price-change and planted-miss cases passed. |
| Skill synchronization | FAIL. `npm run check:skills` reported seven bundled helper scripts different from the source. Lens registry regeneration check passed (15 lenses, 165 checks). |
| Lint, TypeScript and production build | PASS. Lint emitted the existing unused-variable warning in the research probe. |

The fixture failures group into three causes. B1 detects that packaged skills still ship round 2, which means the verified B7 and B8 fixes are unavailable in installed copies. B2 and one B6 assertion exercise the documented `same_as` input without a reason. The source script rejects that input before performing the intended validation, but the public contract and skill instructions still show it. The other B6 failures begin when different cost-table rows are treated as a possible match because their explicit section locator is identical. Without an answer the ledger does not advance, so downstream score and render assertions fail.

The approved third round is now verified. The edit limit is reached. No implementation, fixture, or packaged skill was changed during re-verification.

## Re-verify after fix round 4

Same-context verify (Codex, 2026-11-23). I re-read the ticket and inspected the diff before running the checks.

### Verdict: PASS

| Check | Result |
|---|---|
| Ticket 38 fixtures | 225 passes, 0 failures. The unchanged plan keeps the same score and byte-identical report body. The price change moves only L01/L08 and is classified as new due to change. The planted miss requires an apology, root cause and learned check. |
| Identity | Distinct rows under the same heading keep separate IDs. For separate quotes on the same line, an unresolved match blocks the write. A distinct answer assigns a new ID. A confirmed match preserves the earlier ID and score, and the report shows the reason. |
| Fix closure | A changed file read by a nested verify predicate closes the finding. An approved applied edit also closes it when the changed file is recorded by the apply step and verification passes. The unchanged-file control and approval rejection cases still pass. |
| Published skill contents | The source and all seven copies compare byte-for-byte. The shipped review contract matches the source spec. Lens registry is current (15 lenses, 165 checks). |
| Existing fixtures 03, 04, 26, 27, 40 | All pass. Fixture 27 completed 191 cases and 6 fuzz runs covering 240 events with 0 failures. |
| Lint, TypeScript, production build | Pass. The existing unused-variable lint warning in the research probe remains. |

The lens registry, coverage and score fixtures, approved-apply flow, and the written review protocol cover the remaining ticket boxes. The report's run header contains run-specific metadata, while the body and its hash are byte-identical for the unchanged control. The optional fresh-context instructions were inspected in the skill. This verification used the same context as implementation.
