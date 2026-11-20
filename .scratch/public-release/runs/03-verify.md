# Ticket 03 — independent verification (Sonnet, high)

Date: 2026-11-20. Verifier did not write the change. Nothing committed, no source file edited. `03-impl.md` was read only after the verdict below was formed (see "Deviations check").

Method: research/E audit re-run fresh over the CURRENT tree (`lvr` names): byte-level `cmp` checks, programmatic event scan (conventions §3 list vs every SKILL.md/reference vs spec 01 vs continue's replay table vs `scripts/lvr.mjs`), section-pointer / `project.status` / scope-lock / parked-feature / milestone+decision-rebuild / booster-table cross-reads, citation scan for paths that do not ship inside a skill, plus fixture and futsal replay runs.

**Verdict: PASS. 0 blocker, 0 major, 6 minor (none blocks; none is a regression of an original E item).**

## 1. Byte-level and tooling checks

| Check | Result |
|---|---|
| `cmp scripts/lvr.mjs` vs each `skills/*/scripts/lvr.mjs` (7) | PASS, identical |
| `cmp skills/lvr-conventions.md` vs each `references/conventions.md` (7); principles too | PASS, identical |
| "Script helper" paragraph in the 7 SKILL.md (md5 after stripping list number) | PASS, one md5 (`bec08f2e…`) x7 |
| `npm run check:skills` | PASS rc 0 (`ok:true, drift:[], unchanged:21`) |
| `npx tsc --noEmit` | PASS rc 0 |
| `npm run lint` | PASS rc 0 (1 warning, in untracked `.scratch/public-release/research/J-signals-probe.mjs`, not part of this ticket) |
| Event list: conventions §3 = 49 types; all are in `scripts/lvr.mjs` EVENT_TYPES; all are covered in spec 01 (with `a|b` shorthand); every event named in any skill is in the list (only non-event hit: `scope_locked_seq`, a journal-check field) | PASS |
| Every listed event is emitted by an owning skill (single-file events: recheck_*, feature_*, brand_*, tier_changed, context_guard_triggered are all owned) | PASS |
| `git status`: `.scratch/g1-g3-grilling-handoff.md` -> `.scratch/archive/g1-g3-grilling-handoff.md` (renamed, "Archived" banner), `report-ticket16-g1g3.md` reference updated | PASS |
| `~/.claude/skills` and `~/.agents/skills/lvp-*`: mtimes 2026-11-08 (symlinks) / 2026-11-08 (dirs); nothing newer than 2026-11-19 under `lvp-*`. The only 2026-11-19/20 entries are `~/.claude/skills/synced` and `i-have-adhd`, not LVR and not touched by this ticket | PASS (unmodified) |

## 2. Fixtures (`bash .scratch/public-release/fixtures/03/run.sh`)

Result: rc 0, 9/9 PASS (build_building, build_complete, error_restore, informational, milestone_s8_fallback, postlock_decision, postlock_milestone, s9_pointer, section_blocked). Each case also asserts the copy was not modified.

Coverage per fixed event: `section_blocked` (section_blocked: status, pointer, report `sections_blocked` + `unmet`) · `impact_analysis`, `folder_gate_rejected`, `brand_started|brand_file_generated|brand_done` (informational: untranslatable `[]`, status `bundled`, pointer S9) · post-lock milestone (postlock_milestone, milestone_s8_fallback) · post-lock decision (postlock_decision) · build status (build_building, build_complete, build_blocked-before-started) · S9 pointer (s9_pointer, and asserted in 6 other cases) · error restore on opening event (error_restore).

Negative control (the same fixtures + assert files run against `git show HEAD:scripts/lvr.mjs`, copy in the scratchpad): **9/9 FAIL**. Examples that prove the tests are real:
- `s9_pointer`: want `current_section` S9, old script rebuilt S10 (`diff` non-empty).
- `postlock_milestone` / `postlock_decision`: old script drops M2 and D-003 (diff entries `/milestones/2`, `/decisions/2`).
- `section_blocked`: old script has no `report.sections_blocked` (assert fails; state itself matched).
- `error_restore`: old script left `project.status` = `error` after `handoff_started`.

Not covered by a fixture: nothing required by the ticket. (Note: the old script already folded `section_blocked`, `build_*` status and `impact_analysis` as non-untranslatable from ticket 02; the new fixtures lock that in and the failures above come from the S9 pointer, disk sources, report field and error restore.)

## 3. Futsal fixture (copy at scratchpad `v03`, original untouched)

`node scripts/lvr.mjs replay --dir <copy> --compare`: 45 diff paths (old script on the same copy: 46). Set difference: only-old = `/pipeline/current_section` (intended, E-01); only-new = none. Every remaining diff entry has an identical value in old and new output. Report: `milestones.source` changed `S8-record` -> `MILESTONES.md` (same 4 milestones, same goal text; intended, E-06); decisions 21 from `DECISIONS.md`; untranslatable `[]`. The other 45 paths are ticket 02's known ignore set (live state written by hand: stray `/pipeline/milestones`, milestone goal/verified/verified_at, rationales, `declared_at`, `deployment`, S0/S1/S4/S8/S9 section detail, loop-back reason). `.scratch/lvp-core/dogfood` shows no git change. Extra: a live walk (copy of `s9_pointer`) of `error` -> `resume` -> `build_started` via `journal append` gave `error` -> `bundled` -> `building`, and `replay --compare` diff `[]`.

## 4. Fresh audit findings (current tree)

| id | severity | where | what | proposed fix |
|---|---|---|---|---|
| V-01 | minor | `skills/lvr-continue/SKILL.md:145` (Step 5a) vs `:99-103` (2b) | 5a says to decide the retry offer from "the status loaded in Step 2, before this run's `resume`". On the rebuild path (2b) `replay --write --journal-resume` rebuilds and appends `resume` in one call. Verified by experiment: journal ending in `error`, no `state.json` -> after the call `project.status` = `bundled`, so "error" is never observable and the retry offer depends on the Conductor noticing the last `error` event in the replay report. Healthy path is fine. | In 5a add: on the rebuild path key off the last `error` event with no restoring event after it (the replay report / `journal tail`). |
| V-02 | minor | `skills/lvr-continue/SKILL.md:102` | Reconstruction-report wording still says "milestones from the S8 record, decisions from DECISIONS.md or the Section Records". The rebuild rules (lines 94-95) now also use `MILESTONES.md` and `S4-additions.md`. Cosmetic, the table and the script are right. | "milestones from MILESTONES.md or the S8 record; decisions from DECISIONS.md or the Section Records, plus S4-additions.md". |
| V-03 | minor | Script-helper paragraph in all 7 SKILL.md (e.g. `lvr-continue/SKILL.md:17`), `lvr-init-new-idea/SKILL.md:365`, `references/sections/S5-research.md:5` | Residual of the E-11 class (not introduced by ticket 03; present at HEAD): the helper text sends the reader to "skills directories listed in INSTALL.md" (repo-root file, not shipped in an installed skill); two bank texts cite "ADR-0004" (not shipped). Spec citations themselves are gone (`grep 'spec 0\|05-boosters'` finds only the conventions provenance line). | Inline the two or three standard skill dirs instead of "INSTALL.md"; replace "ADR-0004" with "loud degraded mode". Would also need a `sync:skills`-wide edit of the shared block. |
| V-04 | minor | `skills/lvr-init-new-idea/SKILL.md:204` (engine step 6) | Generic "`current_section` = next Section" has no S9 exception. The exception exists only at S9 step 6 (`:608`), conventions §2 and spec 01. A reader following only the engine would point at S10. | Add "(S9: stays S9)" to engine step 6. |
| V-05 | minor | conventions §2 `error` paragraph, spec 01 | `error` is now defined (who, payload, restore) but no SKILL.md says when its own run should journal it (only init's checkpoint list mentions "error", and conventions §9 "every error"). Path is only reachable by reading conventions. Acceptable under the E-04 ruling ("any skill"), flagged for completeness. | Optional: one sentence in the shared Never/Checkpoint block of each SKILL.md. |
| V-06 | minor | conventions §2 status enum line, spec 01 | Wording says `review` (S7–S8) -> `bundled` (S9 done), but by the transition rules `review` also holds throughout S9 compile until S9 `section_done`. R6.4 and the script agree with the rules; only the label is loose. | "`review` (S7 start until S9 done)". |

Informational (not findings): validator and error texts still say "S0..S10" and accept S10 as a valid id (state storing S10 gets `W_CURRENT_SECTION`, a repair by `/lvr-continue`); intended per impl note. S2 price fact-sheet date 2026-11-08 goes stale ~2027-02-06 (known).

## 5. Original E-01..E-20: status

| E | Status | Evidence |
|---|---|---|
| E-01 S9 vs S10 | **fixed** | Script `NEXT_AFTER` S9->S9; conventions §2, spec 01 "Section pointer", spec 02 S10, continue 2a + `section_done` row, init 206/608 all say S9; fixtures; futsal diff gone |
| E-02 replay events | **fixed** | continue rows for `folder_gate_rejected`, `section_blocked`, `feature_*` incl. `impact_analysis`; script report `sections_blocked`; fixtures `section_blocked`, `informational` |
| E-03 spec 01 events | **fixed** | spec 01 lists `section_blocked` and `brand_*`; blocked semantics in "Section pointer and status" |
| E-04 build status / `error` | **fixed** | build SKILL 46/55/111/123, build-loop 84, spec 01/03, R6.4; `error` defined with restore rule (script restores on `resume`, `session_start`, `handoff_started`, `recheck_started`, `feature_started`, `brand_started`, `section_*`, `answer_recorded`); fixtures. See V-01, V-05 |
| E-05 parked features | **fixed** | add-feature SKILL 98/109, feature-capture 38/62, spec 03/04, conventions §5, R3.2, GLOSSARY; B9 unchanged and consistent (lint F4 does not contradict) |
| E-06 post-lock milestones/decisions | **fixed** | script reads `MILESTONES.md` then S8 record, `S4-additions.md` decision lines; continue 94-95, spec 01, conventions §3; add-feature template writes the decision line; fixtures |
| E-07 scope-lock test | **fixed** | one definition (conventions §5, spec 02, spec 03 header); handoff, build, add-feature, recheck, R6.2, continue all "event AND S7 done" |
| E-08 review timing | **fixed** | init 363/473/486, S7-scope.md 30, record template, spec 02, R6.4 all "review at S7 section_start" (script agrees) |
| E-09 upgrade probe | **fixed** | conventions §7, spec 06, continue Step 3 agree |
| E-10 `deployment: null` | **fixed** | init `:155` |
| E-11 unshipped citations | **fixed** (residual V-03, minor) | no spec citations left; continue's booster fallback uses CAPABILITIES.md -> init Step 3 table (script embeds the same 9 rows, checked) |
| E-12 spec 00 | **fixed** | v1, ADR-0001..0006, 7 skills, 06 listed |
| E-13 stale tense | **fixed** | no "post-v1", "(v0)", "when this skill ships", "pointers only" left in `skills/`; spec 03/04/05 "(v0)" headings are lineage labels, consistent with spec 00 |
| E-14 spec 01 example | **fixed** | `S0.q1`, loop-back `to: S3`, probe `skipped` match conventions |
| E-15 build refusal vs `build_blocked` | **fixed** | preflight failure journals `build_blocked` only, before `build_started`; "report blocked, keeps verified false" |
| E-16 brand routing | **fixed** | missing core file -> `/lvr-continue`; SCOPE/RESEARCH/HANDOVER not gated, named in open questions |
| E-17 F-NN allocation | **fixed** | feature-capture 19 includes `S4-additions.md` |
| E-18 sync tool | **fixed** | `npm run check:skills` / `sync:skills` exist and are documented (README, conventions §3 header) |
| E-19 installed copies | **fixed (documented only, per ruling)** | README note; installed dirs unchanged (mtimes) |
| E-20 stale handoff | **fixed** | archived with banner, reference updated |
| Grouped minors (blueprint ref note, README S1-S5/S7/S8 banks, B15 trailing build logs, GLOSSARY parking lot, HANDOFF-PROMPT in layout, spec 03 principles wording, S2 date) | **fixed / noted** | each present in the diff |

New inconsistencies introduced by the fixes: none that contradict a contract. V-01, V-02, V-04 and V-06 are wording gaps next to the new rules (error restore, rebuild sources, S9 pointer, status label); V-03 and V-05 pre-exist.

## 6. Deviations check (after reading 03-impl.md)

Matches what I found. Notable and acceptable: restore-from-`error` on skill opening events (beyond "confirm C14", needed so a failed post-S9 skill run does not stay `error`); new additive `report.sections_blocked`; disk-filled milestones are sorted by number; E-01 expectation in the 02-design note differs (S10 -> S9) and is recorded, per the ruling. Ticket checkboxes in `issues/03-contract-fixes.md` are not ticked (orchestrator's job).

## 7. Counts

Blocker 0 · Major 0 · Minor 6 (V-01..V-06). Ticket Verify lines: "re-run audit: 0 major" met; "replay fixtures exist for each fixed event" met (9 fixtures, all fail on the pre-ticket script).

**Overall: PASS.**

## Judge (Opus)

Date: 2026-11-20. Judge did not write or audit the change. No source edited, nothing committed.

**Verdict: FIX-FIRST** (4 one-line wording edits, ~10 min, no script change). After them: CLOSE without another audit. Re-run only the checks listed below.

### 1. Audit credibility: credible

- The audit re-ran the E method on the current tree: cmp/md5 sync checks, an event-list scan across conventions, skills, spec 01, the continue table and the script, and a cross-read per E-01..E-20 with file:line evidence for each.
- It ran a negative control against `git show HEAD:scripts/lvr.mjs`: 9/9 FAIL. The causes it gives are specific and plausible.
- I spot-checked three items myself. All hold.
  - **E-07:** handoff:34, recheck:37 and build:38 all say "`scope_locked` **and** S7 done".
  - **E-10:** init:155 has `deployment: null`.
  - **E-17:** feature-capture.md:19 scans `S4-additions.md`.
- I re-ran `fixtures/03/run.sh` (9/9 PASS) and `check:skills` (`drift:[]`).

### 2. Step 5a (V-01): pre-existing, not a regression

Reproduced in the scratchpad (`judge03`) using the `error_restore` fixture minus its last line, so the journal ends in `error`.

| script | healthy path: Step 2 load → after `resume` | rebuild path: `replay --write --journal-resume` |
|---|---|---|
| HEAD | error → bundled | bundled (`error` never observable) |
| current | error → bundled | bundled (`error` never observable) |

- The script behaviour is identical before and after the ticket: `resume` already restored from `error` in ticket 02.
- At HEAD, 5a read the status at Step 5, after `resume`, so it was dead on **both** paths.
- This ticket fixed the healthy path. The rebuild path was already broken.
- It is still fix-now: it is one sentence on the exact line this ticket edited, and leaving it would ship a half-fixed rule.

### 3. Minors

| id | call | fix / owner |
|---|---|---|
| V-01 | fix-now | see list |
| V-02 | fix-now | see list |
| V-03 | follow-up | **20** (de-personalization/hygiene of shipped text). Fixing it needs a `sync:skills`-wide edit of the shared helper block. Re-check it in **35** (skills README rewrite). |
| V-04 | fix-now | see list |
| V-05 | follow-up | **27** (state/journal schema + full replay coverage, defines event ownership). The per-skill wording lands in 29/30/32/34/37 alignment. |
| V-06 | fix-now | see list |

### Fix list

1. **`skills/lvr-continue/SKILL.md` Step 5a (:145).** Append: "On the rebuild path (2b) the rebuild and the `resume` happen in one call, so `error` is never visible in state. Take this branch when the journal's last `error` event is followed by no restoring event (the opening events, `section_*`, `answer_recorded`) before this run's `resume` (`LVR journal tail --n 5`)."
2. **`skills/lvr-continue/SKILL.md` 2b step 2 (:102).** Change "milestones from the S8 record, decisions from DECISIONS.md or the Section Records" to "milestones from MILESTONES.md or the S8 record; decisions from DECISIONS.md or the Section Records, plus S4-additions.md".
3. **`skills/lvr-init-new-idea/SKILL.md` engine step 6 (:204).** Change "`current_section` = next Section" to "`current_section` = next Section (after S9 it stays S9)".
4. **`docs/spec/01-state.md:78` and `skills/lvr-conventions.md:85`.** Change "`review` (S7–S8)" to "`review` (S7 start until S9 done)". Then run `npm run sync:skills`.

Test:
- `npm run check:skills`: `drift:[]`.
- `bash .scratch/public-release/fixtures/03/run.sh`: 9/9 PASS. No script change is expected.
- `grep -n 'S8 record, decisions' skills/lvr-continue/SKILL.md` finds nothing.
- `npm run lint` and `npx tsc --noEmit`: 0.
