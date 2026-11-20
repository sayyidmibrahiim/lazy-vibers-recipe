# Ticket 04: independent verification (lvr.mjs handoff/compile helpers)

Date: 2026-11-20 · Verifier: Opus (high), independent of the implementer · Nothing committed, no source edited.
Every probe ran on copies in the session scratchpad (`.../scratchpad/v04`). `.scratch/lvp-core/dogfood/run` was only read and copied.
I formed the verdict before reading `runs/04-impl.md`, then used it only for the deviation rulings.

**Overall verdict: FAIL.** There are 3 blocking items. All three are small and local. The core work is solid: the command surface, idempotence, write confinement, journal sync, fixtures and the futsal fix all hold up. The failures are false PASS results and checklist items that were dropped without saying so.

## 1. Ticket boxes

| Box | Result | Evidence |
|---|---|---|
| `lint` A–H, JSON report | PASS with gaps | `lint run` returns `{groups, clean, findings[], needs_model[], precondition}`, and all 8 groups run. Coverage gaps are listed in §2: B-2. |
| `crosscheck` (5 S9 rules, plus the 2 extra S9 bullets) | **FAIL** | X1–X7 exist. X5 does not report a milestone whose VERIFICATION section is missing (B-1). X1 does not report duplicate or orphan F-NN blocks (B-3). |
| `blueprint emit` derived from state | PASS | Writes only on drift. `--check` writes nothing, including when the file is missing. A second emit leaves the bytes identical and `generated_at` unchanged. It answers `BLUEPRINT_NEEDS_INPUT` instead of guessing. |
| `stubs` | PASS | Writes only a stub that is missing or wrong, never touches AGENTS.md, and reports AGENTS.md through `agents_md`. |
| `handoff-prompt` | PASS | Fixed template, deterministic bytes, `changed:false` on the second run, `kickoff` map included. |
| Skills call the scripts; the AI fixes only what the lint reports | PASS | handoff Steps 2–5, init S9 steps 2 and 5, recheck and add-feature. Both "fix only what it reports" lines are present. The Node-less fallback is in the prose. |
| Verify: lint passes on the fixed futsal bundle | PASS | 0 findings, 8 `needs_model`. Crosscheck clean. |
| Verify: broken fixtures fail with exact messages | PASS | run.sh: ALL PASS (82). Each case compares the exact `[id, message]` lists. |

## 2. Checklist coverage map (lint-checklist.md → script)

| Item | How | Note |
|---|---|---|
| A1–A18, A0 | scripted | empty or whitespace-only file = empty; a missing file is not re-checked by later groups |
| B1, B2, B4 | scripted | a title mismatch is reported as B21 |
| B3, B18 | scripted | title + exact header row (backticks and spaces normalised) |
| B5, B9 | scripted, **partial** | detects a missing block. Does **not** detect a duplicate F block (requirements or flows) or an F section with no requirement. See B-3 |
| B6–B8, B10–B12, B17 | scripted | order enforced |
| B13 | scripted, **partial** | the Parking Lot heading is checked for presence only. `## Parking Lot` placed before `## In MVP` → clean (the item says "in order"). Not in `needs_model` |
| B14, B15 | scripted | Build-log tail allowed. Milestone after smoke test → finding |
| B16 | scripted | heading shape. Duplicate D blocks are not detected (advisory) |
| B19 | Mermaid scripted (```/~~~, any case) + `needs_model` (English/GFM) | OK |
| B20 | scripted | "documented in-file" heuristic, see advisory A-4 |
| B21 (new) | display name + feature names scripted, stack/entity names `needs_model` | NFC vs NFD flagged with two visually identical strings (A-3) |
| C1, C2, C3, C5 | scripted | duplicate D rows, renamed ids, escaped `\|`, bad date: all caught |
| C4 | scripted (presence ≥10 chars, status match) + `needs_model` (specific) | OK |
| D1, D2 | scripted | OK |
| D3 | vague-phrase regex + `needs_model` | OK |
| D4 | scripted, **partial** | only "has ≥1 list item". `1. Check it.` ×7 passes. The "exact commands + expected outputs" half is neither scripted nor in `needs_model` (B-2) |
| D5 | count + `needs_model` | OK (the `needs_model` text partly covers D4) |
| D6 | scripted, **partial** | `1. Try it.` passes as the "one scripted end-to-end pass". Definition only needs ≥20 chars. Not in `needs_model` (B-2) |
| E1, E2 | scripted | OK |
| E3 | `needs_model` | OK |
| E4 | scripted, **partial** | checks "date or `unverified`" only. A row with a date and an **empty or missing source** passes (probes e1, e2). The checklist says "source + access date". Not in `needs_model` (B-2) |
| F1–F4 | scripted | parked rules per conventions §5, verified with/without the flows stub and the requirements block |
| G1, G2 | scripted (self-fix) | OK |
| G3 | length + `needs_model` | OK |
| G4 | scripted, partial | checks the `SPEC/` token only, not the five sub-files (minor) |
| G5 | scripted, partial | checks that VERIFICATION.md is mentioned, not the "done only when" rule (minor) |
| G6 | scripted | substring match: a mention in prose counts as "points to" (minor) |
| H1–H3 | scripted (self-fix) | OK |
| H4 | `reasons_ref` scripted + `needs_model` | OK |

The checklist's new sentence "Everything else here is fully scripted" is false for B13, D4, D6 and E4. 04-impl.md also lists "D1–D6, E4" as scripted. A model that trusts the script output will never look at these halves.

## 3. Fixtures really test their claim (revert one check → run.sh)

I copied the fixtures plus a patched `lvr.mjs` into scratch, disabled one check at a time, and ran run.sh:

| Check disabled | Fixture(s) that FAIL |
|---|---|
| C2 extra row | `c_decision_extra_row` |
| F4 parked marker | `parked_bad` |
| D5 count | `d_procedure_missing` |
| B20 | `b_placeholder` |
| B20 "documented" exemption | `b_runtime_param_ok` (now over-reports) |
| E4 | `e_unsourced_price` |
| H3 | `h_blueprint_schema` |
| G6 | `g_file_map`, `--group G`, `--journal` count/payload |
| D1 twice | `d_feature_twice` |
| C5 | `c_assumption_for_confirmed` |

I also mutated cases in other ways than the fixtures do:

- Renamed D-005 → D-050 → C1 + C2.
- Status case drift → C1.
- Date `7 Nov 2026` → C3.
- ASSUMPTIONS status mismatch → C4.
- `~~~ Mermaid` → B19.
- Bare `<owner name>` → B20.
- Display name case drift in OVERVIEW → B21 (X4).

All fired the right id.

## 4. Adversarial results

| Probe | Result |
|---|---|
| CRLF + BOM bundle | PASS: clean, stubs unchanged (run.sh 1b) |
| Heading with trailing spaces | PASS: tolerated |
| Heading with emoji / different case | PASS: strict, B1 "missing heading" |
| F-NN gap (F-01–F-04, then F-100 parked) and F-100 | PASS: clean, emit in sync |
| Duplicate D-NNN row | PASS: C2 |
| Duplicate `## F-01` requirements block | **FAIL**: lint clean (only an H2 self-fix). `blueprint emit` then writes `features` = F-01, F-01, F-02, … and the lint is clean again (B-3) |
| Duplicate `## F-01` USER_FLOWS section (same name) | **FAIL**: clean (B-3) |
| Orphan `## F-07 — Ghost (parked — see SCOPE.md)` only in USER_FLOWS | **FAIL**: lint + crosscheck clean (B-3) |
| Milestone section missing from VERIFICATION.md only | lint B15 PASS, **crosscheck clean = FAIL** (B-1) |
| Duplicate ASSUMPTIONS block | not flagged (advisory A-6) |
| Missing file / empty file / whole bundle missing | PASS: A-n / A0 |
| Unicode names (Indonesian, accents, `Señora` display name) identical in every file | PASS: clean; the prompt title is correct |
| NFD vs NFC of the same name | flagged B21, but the message shows two identical-looking strings (A-3) |
| Windows path `SPEC\prd.md` in File map | G6 finding (acceptable) |
| Bad `reasons_ref` in blueprint | H3 self-fix, but `emit` then fails `BLUEPRINT_INVALID` (keeps the bad old value) instead of `NEEDS_INPUT` (A-2) |
| Parked feature with/without USER_FLOWS stub / requirements block | PASS: B9 + F4 / F1 + F4 |
| Decision in DECISIONS.md and not in state, and the reverse | PASS: C2 / C1 |
| `blueprint emit` idempotence | PASS: `--check` writes nothing (drift and missing). The second emit is byte-identical and `generated_at` is kept. Only `generated_at` is ignored |
| stubs/prompt idempotence | PASS: second run `changed:false`, tree byte-identical |
| User-customised AGENTS.md | PASS: never written by any command |
| User-customised CLAUDE.md (stub + own notes) | overwritten without a backup (A-1) |
| Write confinement: CLAUDE.md, HANDOFF-PROMPT.md, blueprint.json as symlinks to files outside | PASS: the link is replaced in the project, outside targets untouched |
| Symlinked `--dir`, relative `../` | PASS |
| Non-LVR folder | PASS: `NO_LVR` |
| Scope not locked (`scope_locked` event removed) | `lint run` runs, `clean:true`, `precondition.scope_locked:false`. Matches the impl's stated design (the skill's Step 1 refuses). `--journal` would still journal on an unlocked pipeline (A-5) |
| `--journal` sync | PASS: futsal copy `replay --compare` diff set identical before and after (45 = 45, pre-existing prose-state diffs). The fuzz (below) with lint/crosscheck/stubs/emit ops mixed in gives `diff []`, `in_sync` |
| Prompt-injection text in MILESTONES.md | PASS: output identical to the clean copy. Messages do echo bundle text (names, placeholders), see A-7 |
| HTML-comment headings (`<!-- ## Compliance notes -->`) | satisfy B11 (advisory A-8) |
| Node absent | PASS: handoff Step 2 fallback ("execute every check literally"), Step 4 emit/stubs/AGENTS prose, Step 5 prompt rules, and S9's cross-check list are all complete in prose |

## 5. Regressions

| Check | Result |
|---|---|
| `fixtures/04/run.sh` | ALL PASS (82) |
| `fixtures/03/run.sh` | 9/9 PASS |
| CLI fuzz (ticket-02 fuzz + random `lint run --journal`, `--group G`, `crosscheck`, `handoff stubs`, `blueprint emit --check`), seeds 7/11/23/31 × 200 ops | all `diff []`, `cli`, valid, healthy, `in_sync`, 0 unexpected failures. Seed 11 journaled 60 `gap_found` |
| `npm run lint` / `npx tsc --noEmit` / `npm run check:skills` | rc 0 / 0 / 0 (`drift: []`) |
| `cmp scripts/lvr.mjs` vs 7 `skills/*/scripts/lvr.mjs` | identical |
| `cmp lvr-conventions.md` vs 7 `references/conventions.md` | identical |
| Script-helper block in the 7 SKILL.md | 1 md5 (after stripping the step number) |

## 6. Futsal fix and table_ref

- **Futsal fix is genuine, not a weakened check.** On the untouched dogfood copy, lint reports exactly H3, `decisions_count.designer_filled: missing`. State holds 8 `user_confirmed` and 13 `designer_filled`, while the old blueprint said `assumed: 13`. Schema v1 requires all three keys. HANDOFF-PROMPT rule 9 is required by the handoff SKILL Step 5. Only those two files differ (`diff -r`), and `.lvr/` is identical.
- **table_ref `RESEARCH.md#cost-table`: consistent.** The old spec example (`#costs`) contradicted its own rule ("costs names the `## Cost table` section"). The value now matches in four places: spec 04, templates §19, lint-checklist, and emit (hard-coded). The futsal heading is `## Cost table` and the dogfood blueprint already used `#cost-table`.

## 7. Deviation rulings

| Deviation | Ruling |
|---|---|
| `table_ref` → `RESEARCH.md#cost-table` | **Accepted**: fixes a spec self-contradiction, consistent everywhere |
| New lint ids B21, A0 | **Accepted**: B21 gives S9's "names identical" rule a lint home; A0 implements the checklist's existing "one plain line" rule |
| Scope-lock evidence as `precondition` inside `lint run`; lint does not refuse | **Accepted** (the skill's Step 1 owns the refusal, crosscheck runs inside S9 after the lock). Advisory A-5 |
| Separate `needs_model[]` list | **Accepted in principle**: never guessed, `clean` excludes it. **Incomplete**: B13 order, D4, D6, E4-source are neither scripted nor listed (B-2) |
| futsal-fixed changed only blueprint.json `designer_filled` and HANDOFF-PROMPT rule 9 | **Accepted**: verified, genuine gaps |
| G1/G2 wrong content and H3 → self-fix | **Accepted**: it resolves a pre-existing checklist vs SKILL Step 4 conflict in favour of the SKILL. Advisory A-1 |
| B20 "documented in-file" heuristic written into the checklist | **Accepted** as a reasonable reading of "as defined in-file". Advisory A-4 |

## BLOCKING

1. **B-1: crosscheck X5 can falsely pass.** If a milestone with acceptance criteria has no `## M<n>` section in VERIFICATION.md, lint reports B15 but `crosscheck` returns `clean:true`. S9 rule 5 ("every acceptance criterion has a VERIFICATION entry") is the case it misses, and D4/D5 skip the milestone because "B15 reports it". This also disproves the impl's claim that "lint and crosscheck can never disagree". Fix: add B15 (its milestone-section findings) to X5, plus a fixture (VERIFICATION-only removal).
2. **B-2: checklist items dropped without being listed.** These were neither fully scripted nor put in `needs_model`, while the checklist now says "Everything else here is fully scripted":
   - E4 "source" half: a dated row with an empty or missing source passes.
   - D4 "exact commands + expected outputs": `1. Check it.` passes.
   - D6 "scripted end-to-end pass": `1. Try it.` passes.
   - B13 heading order.

   Fix: script what is mechanical (a non-empty Source cell in RESEARCH and OVERVIEW; B13 order; apply VAGUE_RE to VERIFICATION steps) and add D4/D6 (and E4-source, if not scripted) to `NEEDS_MODEL` and the checklist sentence. Add fixtures.
3. **B-3: X1/B5/B9 false pass on duplicate or orphan features.**
   - A duplicate `## F-NN` requirements block lints clean, and `blueprint emit` then writes duplicate feature ids and stays "clean".
   - A duplicate flows section lints clean.
   - An F-NN section that exists only in USER_FLOWS.md, with no requirement and no scope row, lints and crosschecks clean.

   Fix: report duplicates under B5/B9/B16, and add `flowSections()` ids to `featureUniverse` (or report "flow for an unknown feature" under B9/F1). Add fixtures.

## Advisories (non-blocking)

- A-1: `handoff stubs` overwrites a CLAUDE.md/GEMINI.md that holds the stub plus the user's own notes, with no backup. A `gap_found` G1 precedes it only when `--journal` lint ran. Consider refusing or reporting when extra content beyond the stub line exists, or keeping a `.bak`.
- A-2: `blueprint emit` keeps an invalid old value (bad `reasons_ref`, non-array `components`) and fails `BLUEPRINT_INVALID`, so the H3 "self-fix" cannot self-heal. Treat invalid preserved fields as missing → `BLUEPRINT_NEEDS_INPUT` (the SKILL already documents that recovery).
- A-3: compare names after `normalize("NFC")`, or say "Unicode form differs" in the message.
- A-4: B20 exemption: a `<token>` shown once in inline code exempts every bare use in that file (`## <summary>` passed).
- A-5: `lint run --journal` on an unlocked scope still journals `gap_found`. Consider `precondition.ok` at the top level, or refusing `--journal` when it is false.
- A-6: duplicate ASSUMPTIONS blocks are not flagged (B16 "one block per decision").
- A-7: finding messages "are fixed text" but echo bundle strings (feature names have no length cap). Cap and quote them, since the model is told to relay them verbatim.
- A-8: headings inside HTML comments count as real headings.
- A-9: `handoff stubs` writes stubs even when AGENTS.md is missing (tool-level; the skill gates it in Step 4).

## Re-verify after fix round 1

Date: 2026-11-20 · Verifier: Opus (high), independent · Nothing committed, no source edited. Every probe ran on copies in `.../scratchpad/v04r1`. The dogfood run was only read and copied, and `git status` shows nothing under `.scratch/lvp-core`. The mutations below are my own (harness `v04r1/tools/mut.mjs`). They are separate from the implementer's fixtures.

**Overall verdict: FAIL.** There are 2 blocking items. Both are narrow, one-line-class fixes. B-1 is closed. B-3 is closed for requirements and USER_FLOWS, but not for a SCOPE-only id. B-2 is closed except E4 on RESEARCH.md. Stubs backup, emit refusal and every regression check pass.

### Checks

| Check | Result | Evidence |
|---|---|---|
| B-1: X5 catches a milestone with no VERIFICATION section | **PASS** | Each mutation gives lint B15 and crosscheck X5/B15: M1 and M3 both removed (2 findings), M0 removed, `## M2` demoted to `###`, `## M2` renamed `## M9`. An M1 section with its heading but no steps gives X5/D4. |
| B-2: D4 thin steps | **PASS** | 2 short steps (`Check it.`, `Verify login.`) give 2× D4 + D5. 4 long but vague steps ("works fine", "works as expected", "looks good", "works properly") give 4× D4. 4 thin bullets give 4× D4. Indonesian `Cek login.` ×4 gives 4× D4. Every one also shows in X5. The remaining judgment (exact command plus output) is in `needs_model` D4. |
| B-2: D6 smoke | **PASS** | 3 thin or vague steps give 3× D6. Bullets instead of numbers give D6 "no numbered steps". One long, generic step passes the script, and `needs_model` D6 covers it. A vague "Definition of verified" passes the script, and `needs_model` D6 covers it. |
| B-2: B13 order | **PASS** | Parking Lot moved before In MVP → B13 out of order. In MVP moved before `# Scope` → B13 + F3. Parking Lot moved before the title → B13 + F3. Parking Lot demoted to H3 or renamed → B13 missing. Pair swaps in other files are caught too: OVERVIEW → B2, HANDOVER → B17. |
| B-2: E4 empty source | PASS for the requested variants | RESEARCH Source cell set to whitespace, `-`, `—`, or `n/a`, with the date moved to the Status cell → "has an empty Source cell". Same result for an OVERVIEW Source cell set to whitespace or `-` with the date in Price or When. |
| B-2: E4 source half on RESEARCH.md | **FAIL** (R-2) | A RESEARCH row whose Source cell holds `accessed 2026-11-07` or `TBD (2026-11-07)` lints and crosschecks clean. The script's test is only `/[A-Za-z0-9]{3}/`, and `needs_model` E4 covers OVERVIEW.md only, so nothing checks that a RESEARCH price names a source. |
| Checklist "fully scripted" claim is exact | **FAIL** (R-2) | Mapped every item. A1–A18, A0, B1–B18, B20, C1–C3, C5, D1–D2, E1–E2, F1–F4, G1–G2, G4, G6 and H1–H3 are scripted. B19, B21, C4, D3–D6, E3, G3, G5 and H4 are scripted where mechanical and also listed in `needs_model` (12 ids, the same in the script, run.sh and the checklist). G4 now checks the five SPEC names (`api` removed → G4). The one gap: the E4 source half on RESEARCH.md, above. |
| B-3: duplicates | **PASS** | F-01 duplicated in both requirements and USER_FLOWS → B5 + B9 (X1). F-03 duplicated under a different name → B5 + 3× B21. Duplicate F-02 flow only → B9 (emit stays in_sync, since the feature ids are unchanged). |
| B-3: F-NN only in requirements | PASS | Both the in-MVP and the parked variant → B9 + F1 + H2. Crosscheck X1/B9. |
| B-3: F-NN only in USER_FLOWS | PASS | F-09 `(in-MVP)` → B5 + F1. X1/B5. Emit refuses. |
| B-3: F-NN only in SCOPE | **FAIL** (R-1) | `- **F-06** Ghost …` under `## In MVP`: lint gives D1 + F1, but **crosscheck is clean**. X1 = B5, B9, F4. `featureUniverse` leaves out SCOPE ids, so B5 and B9 never fire, and the F4 in-MVP branch only checks blocks that exist. The init S9 step says "an F-NN that exists in only some files is reported by the script (X1)". That is false for this case. The parked SCOPE-only variant is fine (X1/F4 ×2). |
| `blueprint emit` refusal writes nothing | **PASS** | Ran 3 refusing bundles: duplicate in both files, flow-only F-09, duplicate with a different name. Each gives rc 1 and `BUNDLE_FEATURES_INCONSISTENT`. An md5 plus file-list snapshot of the whole tree is identical after `emit` and after `emit --check`. With blueprint.json deleted, the refusal does not create it. No tmp, `~` or `.new` file is left in the project or `.lvr/`. |
| `handoff stubs` backup | **PASS** | Both files customised → `CLAUDE.md.bak-2026-11-20` and `GEMINI.md.bak-2026-11-20`, content kept. 2nd and 3rd runs: `changed:false`, `backed_up:[]`, tree md5-identical. No backup for missing, empty, whitespace-only, stub without a final newline, CRLF, trailing blank lines, or BOM (the last four are `changed:false`). Collisions: user files at `.bak-…` and `.bak-…-2` → `-3`, originals untouched. A directory at the backup name → `-2`. A live symlink to an outside file at the backup name → `-2`, outside file untouched. CLAUDE.md symlinked to an outside file → backup made inside the project, link replaced, outside file untouched. Lint is clean with `.bak` files present. |
| A-3: NFC name comparison | PASS for features, **partial** overall | Feature names: all NFC, all NFD, or NFC/NFD mixed across files → clean. Real differences are still caught: `Señora café` vs `Senora cafe`, `é` vs `è`, the `ﬁ` ligature vs `fi`, and case drift. NFD requirements with an NFC blueprint → H2 once, then stable. **The display name is not normalised**: an NFD AGENTS.md H1 gives B21 with two identical-looking strings, and an NFD `state.project.name` gives 4× B21 + H2. Advisory, since A-3 was advisory. |
| `--journal` keeps journal check in sync | PASS | 3 broken copies: the journal grows by exactly the number of findings, `healthy:true`, `state_sync` unchanged (`untracked`, as on the base), and the `replay --compare` diff count is 45 before and 45 after. |
| futsal-fixed | PASS | lint 0 findings, crosscheck clean (run.sh §1). Untouched dogfood copy: only H3 `designer_filled`, as before. |
| `fixtures/04/run.sh` / `fixtures/03/run.sh` | PASS | ALL PASS (97) / 9 of 9 PASS |
| CLI fuzz (seeds 7, 11, 23, 31, 101 × 200 ops, with lint, crosscheck, stubs and emit ops mixed in) | PASS | all give `diff []`, `cli`, valid, healthy, `in_sync`, 0 fails |
| `npm run lint` / `npx tsc --noEmit` / `npm run check:skills` | PASS | rc 0 / 0 / 0 (lint has 1 pre-existing warning in `research/J-signals-probe.mjs`; `drift: []`) |
| `cmp` copies | PASS | the 7 `skills/*/scripts/lvr.mjs` are identical to `scripts/lvr.mjs`; the 7 `references/conventions.md` are identical to `skills/lvr-conventions.md` |
| Script-helper block | PASS | 1 md5 across the 7 SKILL.md (step number stripped) |

### BLOCKING

1. **R-1 (B-3 still open in the SCOPE variant): crosscheck X1 false pass.** An in-MVP F-NN that exists only in SCOPE.md shows in lint (F1, D1) but crosscheck is `clean:true`. S9 then passes, even though the init SKILL says X1 reports an F-NN found in only some files. This is the same lint-vs-crosscheck disagreement class as B-1. Fix: add F1 to X1, or put SCOPE ids into the feature universe so B5/B9 fire. Add a SCOPE-only fixture.
2. **R-2 (B-2 still open for E4 on RESEARCH.md): "scripted in full" is not exact.** A RESEARCH cost row whose Source cell holds only a date or a placeholder (`accessed 2026-11-07`, `TBD (2026-11-07)`) passes. `needs_model` E4 is limited to OVERVIEW.md, so no one checks it. Fix: widen `needs_model` E4 to both cost tables in three places: the NEEDS_MODEL text, the checklist sentence and the init S9 line. Optionally also require a non-date token in the Source cell. Add a fixture.

### Advisories (non-blocking)

- A-3 is only half done: display-name and project-name comparisons (AGENTS/OVERVIEW/prd titles, state vs blueprint) are not NFC-normalised.
- E4 is over-strict: an `unverified` row with Source `-` gives "empty Source cell". The checklist says the unverified flag alone is enough.
- A Parking Lot row written `- **F-06 Ghost parked** — …` (the id inside the bold name) is not recognised as an F-NN, so it lints clean. This is format drift.
- A dangling symlink at the backup name is replaced by the backup file. Nothing is written outside the project, so this is harmless.
- A-2 and A-4 to A-9 from the first pass were not taken and are unchanged.

## Re-verify after fix round 2

Date: 2026-11-20 · Verifier: Opus (high), independent · Nothing committed, no source edited. Every probe ran on copies in `.../scratchpad/v04r2`, using my own harnesses there: `tools/mut.mjs`, `tools/src.mjs` (Source-cell variants), `tools/nm.js` (display-name NFC/NFD) and `tools/fuzz4.mjs`. The dogfood run was only copied, and `git status .scratch/lvp-core` is empty. The round-1 script snapshot (`v04r1/lvr.mjs`) was used for before/after comparisons.

**Overall verdict: FAIL, on one narrow blocking item.** R-1 and R-2 are closed. The A-3 change introduced a regression (R-3): the state-vs-blueprint name comparison normalises only one side. Its fix is one token plus a fixture. Everything else passes.

### Checks

| Check | Result | Evidence |
|---|---|---|
| R-1: F-NN only in SCOPE.md | **PASS** | These all give the same lint finding and a matching crosscheck finding. `**F-06**` under In MVP gives lint D1 + F1 and crosscheck X1/F1. Two ghost ids (F-06, F-12) give 2× D1 + 2× F1 and 2× X1/F1. A parked-only F-07 gives F1 + 2× F4, and X1 shows all three. F-06 both In MVP and parked gives 3× F1 + 2× F4 in lint and in X1. A SCOPE ghost that is also in a state milestone gives B5 + B9 (X1). F-04 removed from SCOPE gives X1/F1 (this case was crosscheck-clean in round 1). |
| R-2: Source cell holds only a date or a placeholder (RESEARCH and OVERVIEW) | **PASS** | Variants from the brief, with the date moved to another cell so only the Source half is tested. Each gives lint E4 + X6: `2026-11-07`, `accessed 2026-11-07`, `TBD`, `tbd (2026-11-07)`, `n/a`, `N/A`, `?`, `[]()`, `[ ](#)`. Whitespace, `-` and `—` give "empty Source cell". My own variants that are also caught: `**TBD**`, `` `TBD` ``, `pending`, `???`, `...`, `xx`, `(2026-11-07)`, `2026-11-07 / 2026-11-08`, `n.a.`, `source: TBD`, `unknown`. OVERVIEW gives the same results (`2026-11-07`, `checked 2026-11-07`, `TBD`, `n/a`, `—`, whitespace). `see above` passes the script; see the advisories. `needs_model` E4 now covers both tables, with the same wording in the script, the checklist and the init S9 line, so every miss is still model-checked. |
| R-2: false positives on real sources | **PASS** | These all lint clean: `https://example.com/pricing (2026-11-07)`, `Vendor pricing page, 2026-11-07`, `vercel.com/pricing`, `[Vercel pricing](https://vercel.com/pricing), 2026-11-07`, `<https://…>`, `AWS 2026-11-07`, `OJK`, `BI rate sheet`, `Fly.io`, `GoDaddy`, `Owner quote`, `Q2 report`, `阿里云 pricing`, `Situs resmi Vercel, diakses 2026-11-07`, `S2 row: namecheap.com`, `Verified on vercel.com 2026-11-07`, and names that contain a filler word (`On-site quote`, `Date Palm Hosting`, `Unknown Worlds Ltd invoice`, `Pending.io pricing`, `Na Hosting`). The only false positives are bare names of 1–2 characters (`HP 2026-11-07`, `HP`, `AI`, `Ö`), from the ≥3-character rule. Advisory. |
| `unverified` exemption | **PASS** (matches the spec) | Spec 04, templates.md (OVERVIEW and RESEARCH) and init S5 all say "source + access date, or `unverified`". `e_unverified_dash_ok` is correct. The flag is not silent: it sits as visible text in the row, and `needs_model` E4 asks the model to judge it. However, nothing aggregates or reports unverified rows. A bundle with every price `unverified` and every Source `-` lints and crosschecks clean. The test is `/unverified/i` over the **whole row**, so an Item named `Vercel Hobby (unverified-sender add-on)` with Source `TBD` and Status `verified 2026-11-07` also passes. Advisory. |
| `b_flow_orphan` / `f_unclassified` expect.json changes | **PASS** (legitimate) | I ran the round-1 and round-2 scripts on both overlays. The lint lists are byte-identical (`B5, F1` / `F1, H2`). Crosscheck only gained X1/F1: it went from `[X1/B5]` to `[X1/B5, X1/F1]`, and from `[]` to `[X1/F1]`. The expectations got stricter, not weaker, and `f_unclassified` was a crosscheck false pass in round 1. |
| A-3: NFC/NFD display name | **PARTIAL** | Fixed: NFD H1 titles in AGENTS, OVERVIEW, prd and HANDOFF-PROMPT against an NFC state are now clean (round 1 gave B21). Real differences are still flagged: `Cafe`/`Café`, `Senora`/`Señora`, `è`/`é`, case, NBSP, and a different blueprint name. Not fixed: line 2140 compares the **raw** `blueprint.json` `project.name` with the NFC display name. This causes R-3 below. |
| A-3 regression check | **FAIL** (R-3) | A bundle whose name is NFD everywhere (state, blueprint, titles) was clean in round 1. It now gives `B21 Project name is "Lapangan Futsal Café Señora Ñuñez" in state.json but "Lapangan Futsal Café Señora Ñuñez" in blueprint.json.`, a bundle_gap whose two strings look identical. NFD state with an NFC blueprint gives H2. `blueprint emit` then writes the NFD name, after which `emit` reports `in_sync` and B21 stays: the finding cannot be fixed by its own repair path. Nothing normalises the name on write, so an NFD `project.name` (for example, pasted on macOS) reaches this state through `answer record`. |
| B-1 spot-check | PASS | Removing VERIFICATION `## M2` gives B15 and X5/B15. Demoting `## M3` to `###` gives B15 and X5/B15. |
| B-3 duplicates spot-check | PASS | A duplicate F-02 requirements block gives B5 (lines 14, 43) and X1/B5. A duplicate F-03 flow with a different name gives B9 + B21 (X1, X4). |
| Emit refusal writes nothing | PASS | The duplicate F-02 bundle gives `BUNDLE_FEATURES_INCONSISTENT`, and the md5 of the whole tree is unchanged. A flow-only duplicate gives `in_sync` and an unchanged tree, as in round 1. |
| Stubs backup idempotence | PASS | Both stubs customised: run 1 backs up both as `.bak-2026-11-20` with the content kept. Runs 2 and 3 give `changed:false, backed_up:[]`. |
| futsal-fixed | PASS | lint 0 findings, crosscheck clean. The dogfood copy shows only H3 `designer_filled`, unchanged from round 1. |
| `fixtures/04/run.sh` / `fixtures/03/run.sh` | PASS | ALL PASS (102) / 9 of 9 PASS |
| CLI fuzz (new seeds 5, 13, 29, 47, 211 × 200 ops) | PASS | every seed gives `diff []`, `cli`, valid, healthy, `in_sync`, 0 fails |
| `npm run lint` / `npx tsc --noEmit` / `npm run check:skills` | PASS | rc 0 / 0 / 0 (lint has 1 pre-existing warning; `drift: []`, 21 unchanged) |
| `cmp` copies | PASS | the 7 `skills/*/scripts/lvr.mjs` are identical to `scripts/lvr.mjs`; the 7 `references/conventions.md` are identical to `skills/lvr-conventions.md` |
| Script-helper block | PASS | 1 md5 across the 7 SKILL.md (step number stripped) |

### BLOCKING

1. **R-3 (regression from the A-3 change): permanent false B21 for an NFD project name.** At line 2140, `b.blueprint().value.project.name !== name` compares the raw blueprint name with `name`, which is NFC since line 2035. A bundle that is NFD throughout, which was clean in round 1, now fails S9 with two identical-looking strings. `blueprint emit` cannot clear it, because it writes the state name raw and then reports `in_sync`. Fix: `.normalize("NFC")` on the blueprint side (alternatively, NFC-normalise `project.name` on write). Add one fixture: an all-NFD name gives no findings.

### Advisories (non-blocking)

- **E4 script precision.** These pass the script and rely on `needs_model` E4: `see above`, `_TBD_` (`_` is a word character, so `\btbd\b` does not match; this is inconsistent with `**TBD**` being caught), `TBC`, `to be confirmed`, `none yet`, `not available`, `idk`, non-ISO dates (`Nov 7, 2026`, `07/11/2026`, `accessed Nov 7, 2026`), and Indonesian filler (`diakses 2026-11-07`, `belum ada`). The checklist's claim that "only a date or only a placeholder (`TBD`, `n/a`, `-`, `?`)" is scripted holds for the listed tokens and ISO dates only.
- **E4 false positive** on bare 1–2 character source names (`HP`, `BI` alone). `HP pricing page` passes.
- **`unverified` exemption.** It matches anywhere in the row rather than only in the Status or Source cell, and the script does not count or list unverified rows.
- **SCOPE format drift.** `- F-06 Ghost …` (not bold) or `- **F-06 Ghost**` under In MVP is invisible to lint and crosscheck. A real feature written this way still trips F1 ("captured but not classified"); only an invented id slips through. This is the same class as the round-1 Parking Lot advisory.
- A HANDOFF-PROMPT.md title with a different name lints clean. It is a generated file, and `handoff prompt` rewrites it.
- Still not taken from earlier rounds: A-2, A-4 to A-9, and the dangling-symlink backup name.
