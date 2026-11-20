# Ticket 03 — implementation run (contract fixes, sync audit E-01..E-20)

Date: 2026-11-20 · Implementer: Opus · Not committed.
Research: `research/E-skills-sync-audit.md` (its `lvp` paths and line numbers predate the rename; the lines below are post-edit, `lvr`).
Source-of-truth order applied: `docs/spec` → `skills/lvr-conventions.md` (snapshot) → SKILL.md / references. Copies synced with `npm run sync:skills`.

## Results

| Check | Result |
|---|---|
| Fixtures `fixtures/03/run.sh` (9 cases, 55 checks, on temp copies) | **9/9 PASS**, exit 0. Negative control (same asserts, pre-ticket script): 9/9 FAIL as expected |
| Futsal T2 (copy of `.scratch/lvp-core/dogfood/run`, ignore list `v2/ignore.json`) | `diff []`, untranslatable `[]`, decisions 21 from `DECISIONS.md`, `sections_blocked []`. Fixture untouched (`git status` clean) |
| Futsal full compare, old vs new script | 46 → 45 diffs; see "Futsal diffs" |
| Fuzz, CLI-only journals (seeds 7, 11, 23, 31, 42; 200 ops) | all `diff []`, `kind: cli`, valid, healthy, `in_sync`, 0 fails |
| `npm run lint` / `npx tsc --noEmit` / `npm run check:skills` | 0 / 0 / 0 |
| `cmp` conventions + `lvr.mjs` + principles, 7 skills | all identical |
| Script-helper block in the 7 SKILL.md | identical (one md5) |

### Futsal diffs (old script → new script)

1. `/pipeline/current_section`: rebuilt `S10` → `S9`. Intended (E-01). The live state already said S9, so this full-compare diff disappears.
2. Report `milestones.source`: `S8-record` → `MILESTONES.md`. Same 4 milestones, goals and features. Intended (E-06: the bundle exists, so it wins).
Nothing else changed in the state or the report.

**E-01 deviation from 02-design (recorded here, 02-design not edited):** T2 expected `current_section` = `S10` after S9 (§2.6 `section_done` row, C8). The ruling is S9, so the expectation is now `S9`.

## Per finding

**E-01 (major) — `current_section` after S9.** Ruling: stays `S9`; S10 is tracked by `project.status`.
- `scripts/lvr.mjs:33-35` `NEXT_AFTER` (S9 → S9); `:359` `W_CURRENT_SECTION` falls back to `"S9"`.
- `docs/spec/01-state.md:84-86` (new "Section pointer and status" subsection); `docs/spec/02-sections.md:88` S10 renamed "Build (optional)", no pointer.
- `skills/lvr-conventions.md:76` (pointer rule), `:130` (S10 row was "Out of v0 scope").
- `skills/lvr-continue/SKILL.md:54` (2a repair), `:75` (`section_done` row).
- `skills/lvr-init-new-idea/SKILL.md:206`, `:608`.
- Side effect: a state that still stores `S10` after S9 now gets `W_CURRENT_SECTION` (a warning; `/lvr-continue` repairs it). The validator still accepts `S10` as a valid id.

**E-02 (major) — replay table lacks events.**
- `lvr.mjs`: `section_blocked` already folded; now also recorded in the report (`:845`, report key `sections_blocked`).
- `folder_gate_rejected`, `impact_analysis` and `brand_*` are informational (no untranslatable). Proven by the `informational` fixture.
- `skills/lvr-continue/SKILL.md`: `:69` `folder_gate_rejected` row, `:76` `section_blocked` row, `:84` `feature_*` row now names `impact_analysis`; it also says payload `decisions[]` / `milestones[]` are folded in.
- Conventions `:101`: "every event type is replayable".

**E-03 (major) — spec 01 event list.**
- `docs/spec/01-state.md:82` adds `section_blocked` and `brand_started|brand_file_generated|brand_done`.
- `blocked` semantics (payload `section`, `unmet`) are in `:84-86` and conventions `:77`.

**E-04 (major) — build status and `error`.** Ruling applied.
- `skills/lvr-build/SKILL.md:55` (`build_started` → `building`), `:111` (`build_done` → `complete`), `:123` (allowed state fields; "when this skill ships" removed).
- `references/build-loop.md:84` (allowed writes + `project.status`).
- `docs/spec/03-skills.md` build section + allowed writes; `docs/spec/01-state.md:80` "Who sets it".
- `error` is defined in spec 01 (`:80` area) and conventions `:87`: any skill, unrecoverable failure with half-done work; payload `skill`/`step`/`message`. Refusals, failed probes, failed milestones and context pressure are excluded.
- **C14 corrected, not just confirmed.** The stash was real, but the only restore triggers were `resume`, `section_*` and `answer_recorded`. A failed `/lvr-handoff`, `/lvr-recheck-plan`, `/lvr-add-feature` or `/lvr-personal-brand` run after S9 would have stayed `error` until someone ran `/lvr-continue`. The opening events of every skill (`session_start`, `handoff_started`, `recheck_started`, `feature_started`, `brand_started`) now restore it too (`lvr.mjs:880`).
- Continue 5a (`SKILL.md:145`) keys on the status loaded *before* its own `resume`. Otherwise the `resume` restores the status and the retry offer is never shown.
- Fixtures: `build_building`, `build_complete`, `error_restore`.

**E-05 (major) — parked features vs lint B9.** Ruling: USER_FLOWS section marked `(parked — see SCOPE.md)`; lint B9 unchanged.
- `skills/lvr-add-feature/SKILL.md:98` (option 3), `:109` (bundle edit list).
- `references/feature-capture.md:38` (matrix), `:62` (§4 Parking Lot).
- `docs/spec/04-bundle.md:53`; `docs/spec/03-skills.md:73`; conventions `:136`.
- `skills/lvr-recheck-plan/references/audit-checklist.md:36` (R3.2).

**E-06 (major) — post-lock milestones and decisions lost on rebuild.** Ruling applied. Disk is read only for journals that are not CLI-pure.
- Milestones in `lvr.mjs`:
  - `:1118` `makeDisk.milestonesMd`; `:1176` `parseMilestoneBlocks`.
  - Post-fold fill order: events → `MILESTONES.md` (bundle) → S8 record; sorted by number.
  - `milestone_verified` for an id not yet known is deferred (`:866`, `pendingVerified`) and applied after the disk fill, so a verified post-lock milestone keeps `verified: true`.
  - `unrecoverable.milestones` is set when S8 is done and every source is empty.
- Decisions in `lvr.mjs`:
  - `:1189` `DECISION_LINE_RE`; decision lines are parsed anywhere in `S4-additions.md` as section `S4`.
  - They are appended after the `DECISIONS.md`/records rows when missing. The source label becomes `<source>+S4-additions.md`.
- Continue prose rebuild: `skills/lvr-continue/SKILL.md:94-95`. Also in spec 01 `:116` and conventions `:103`.
- So a rebuild can find them, add-feature now writes the decision line into `S4-additions.md`: `SKILL.md:100`, `feature-capture.md:80` template (the old `- Decision: <D-NNN> · Files touched:` line became one decision line per decision plus a `Files touched` line).
- Fixtures: `postlock_milestone`, `postlock_decision`, `milestone_s8_fallback`.

**E-07 — scope-lock test.** Ruling: `scope_locked` event AND S7 done.
- Defined once in conventions §5 `:134` and spec 02 `:71`; spec 03 `:5` holds the global sentence.
- Referenced from:
  - `lvr-build/SKILL.md:38`, `build-loop.md:9`;
  - `lvr-add-feature/SKILL.md:38`;
  - `lvr-handoff/SKILL.md:34`;
  - `lvr-recheck-plan/SKILL.md:37`, `audit-checklist.md:76` (R6.2);
  - `lvr-continue/SKILL.md:56`, `:93`.
- Handoff, recheck and build said "or" before; all now say "and".

**E-08 — S7 status timing.**
- Option picked: `review` is set at S7 `section_start`, matching spec 01's enum ("review (S7–S8)") and the script. This changes no contract; init was the outlier.
- `scope_locked` writes no field.
- Files: init `SKILL.md:363`, `:486`; `S7-scope.md:30` and the record template; spec 02 S7 row; conventions §5 S7 row; R6.4 `audit-checklist.md:78`.

**E-09 — upgrade vs mandatory probe.**
- Option picked: an upgrade keeps an earlier `passed` probe. Landing on T2/T3 without `passed` runs the probe.
- Why: fewest changes. "Mandatory for T2/T3" holds, and a model that passed is not re-probed. It also covers the T3-failed → T2 hole.
- Files: `docs/spec/06-model-tiers.md:19`, conventions `:176`, continue `SKILL.md:120`.

**E-10 — first state write missing `deployment`.**
- `init SKILL.md:154` adds `deployment: null`.
- C7 (same block): `declared_at` = the `tier_declared` ts, and `created_at` = the S0 `section_start` ts (`:150`). Both match what replay derives.

**E-11 — citations of unshipped specs.**
- Option picked: point at shipped material, not embedded copies. Fewer duplicated tables to keep in sync.
- Continue's booster license fallback (`SKILL.md:72`) is now: `CAPABILITIES.md` → init Step 3 table (the script embeds the same) → `license: null`, flagged.
- Removed every "spec 0N" citation from the skill text:
  - init `:279`, `:308`, `:425`, `:475`, `:536`, `:588`, `:594`, `:607`, `:638`;
  - bank files line 5;
  - handoff `:67`, recheck `:140`, add-feature `:118` (the blueprint schema now points at handoff lint group H / templates §19);
  - `templates.md:142`.
- `grep 'spec 0\|05-boosters' skills/**/*.md` → only the conventions provenance line.

**E-12 — spec 00 stale.**
- `docs/spec/00-overview.md`: v1, 2026-11-20, ADR-0001..0006, 6 spec files (06-model-tiers added).
- `:18` Scope lists the 7 skills, each with `scripts/lvr.mjs`; `:44` "Non-goals".

**E-13 — future-tense leftovers.**
- init `:111` "Core boosters (v0)"; `:486` and S7 template "post-v1" (also `S7-scope.md:31,51`); `:206`/`:608` "out of v0 scope".
- recheck `:158` "Listed in conventions §3"; build `:123`; continue `:175` (v1 pointers only → "Offer the next skill").

**E-14 — answer key in spec 01.**
- `docs/spec/01-state.md:40` `"S0.q1"` (C11).
- Ids are `S<n>.q<n>`, unpadded, in spec 01 `:91`, conventions `:89` and init `:442` (C10). The base-slug rule is in init `:164`.

**E-15 — build refusal vs `build_blocked`.**
- Option picked: keep preflight before `build_started`; preflight failure is journal-only (`build_blocked`, no state field, informational on replay).
- Why: moving `build_started` earlier would flip `project.status` to `building` for a build that never started.
- Files: `lvr-build/SKILL.md:46`, `build-loop.md:15`, spec 03.
- "Mark the milestone `blocked`" → "report it blocked; keeps `verified: false`" (`build-loop.md:38`).

**E-16 — brand routing.**
- A missing core file → `/lvr-continue` to finish S9 (`lvr-personal-brand/SKILL.md:39`; handoff only lints).
- Option picked for `SCOPE.md`, `RESEARCH.md` and `HANDOVER.md`: optional, not gated. A missing one goes under `Open questions for the owner` (`:48`; spec 03).
- Why: gating would add refusal paths for files the kit only enriches.

**E-17 — F-NN allocation.** `feature-capture.md:19` now also scans `S4-additions.md`, which matches SKILL.md.

**E-18 — no sync tool mentioned.**
- `skills/README.md:26`: sources, `npm run sync:skills`, `npm run check:skills`; `scripts/lvr.mjs` mirrored into `scripts/`.
- Conventions `:3` now names `check:skills` ("drift is checked at dogfood" removed).

**E-19 — installed copies.**
- Documented only (`skills/README.md:116`): install all seven into the directory the harness actually scans, and link each folder when keeping one copy in `~/.agents/skills/`.
- `~/.claude/skills` was not touched.

**E-20 — stale handoff note.**
- `git mv .scratch/g1-g3-grilling-handoff.md .scratch/archive/` with an "Archived" banner.
- References fixed: `lvp-core/verify-06-continue/report-ticket16-g1g3.md:84` names the archive path.
- `spec.md:10` and the old `03-scratch-and-repo-hygiene` issue no longer reference it (that issue is now `20-repo-hygiene.md`, no mention).
- `runs/01-verify.md` and the research file are left as history.

### Grouped minors

- **blueprint anchors:**
  - Option picked: `ref`/`*_ref` are logical pointers `<file>#<id>`, not Markdown anchors; `costs` names `## Cost table`.
  - Why: changing the values would change schema v1 consumers.
  - Files: `docs/spec/04-bundle.md:76`, `templates.md:164`, `lint-checklist.md:129`.
- **README "S1–S8 banks"** → `skills/README.md:83` "S1–S5, S7, S8; S6 and S9 run from SKILL.md".
- **B15 vs build log:** trailing `## Build log — <ts>` sections are allowed (`lint-checklist.md:51`, `templates.md:110`, spec 04 `:50`). The handoff entry prompt (`SKILL.md:87`) names the build status.
- **S2 price fact-sheet date:** no change; still within the 90-day window. It is stale after ~2027-02-06; flagged for ticket 26/R2.
- **Spec 03 principle wording:** spec 03 now points to `skills/lvr-principles.md` as the full text rather than claiming its summary is verbatim.
- **GLOSSARY Parking Lot:** `GLOSSARY.md:48` (Indonesian kept): S7 record + `SCOPE.md`/parked rows; State has no field.
- **HANDOFF-PROMPT.md in layout:** spec 01 `:16`, conventions `:22`.

## Fixtures (`.scratch/public-release/fixtures/03/`)

- `make.mjs` regenerates every case.
  - CLI cases are written through `scripts/lvr.mjs` with a fixed `LVR_NOW`; the expected `state.json` is the CLI-written state.
  - Prose cases are unstamped hand-written journals plus disk files; the expected state is the reviewed rebuild.
- `run.sh` copies each case to a temp dir and runs `replay --compare --print-state`. It asserts `diff []` plus each `[pointer, value]` in `assert.json`, then checks the copy was not modified.

| Case | Kind | Asserts (besides `diff []`) |
|---|---|---|
| `section_blocked` | cli | S1 `blocked`, pointer S1, report `sections_blocked` with `unmet`, untranslatable [] |
| `informational` | cli | `folder_gate_rejected`, `impact_analysis`, `brand_*` → untranslatable [], status `bundled`, pointer S9 |
| `s9_pointer` | cli | pointer S9, S9 done, `bundled`, no validation warnings |
| `build_building` | cli | `build_blocked` (preflight) then `build_started` → `building`, M0 unverified |
| `build_complete` | cli | `complete`, M0 verified, deployment live, pointer S9 |
| `error_restore` | cli | `error` then `handoff_started` → back to `bundled` |
| `postlock_milestone` | prose | M2 only in `MILESTONES.md`, verified → `true`; source `MILESTONES.md`; 3 milestones |
| `milestone_s8_fallback` | prose | no bundle → 2 milestones from the S8 record |
| `postlock_decision` | prose | D-003 only in `S4-additions.md` → section S4, rationale parsed; source `DECISIONS.md+S4-additions.md` |

## Deviations / notes

- C14 extension (opening events restore from `error`): beyond "confirm"; reason under E-04.
- New report field `sections_blocked` (additive; no consumer breaks).
- Milestones filled from disk are sorted by number, so a post-lock M2 lands after M1.
- `report.milestones.source` can now be `MILESTONES.md`, `S8-record`, or combined with `events+`.
- `.scratch/public-release/issues/03-contract-fixes.md` was already modified before this run; its checkboxes were not ticked here.
- Not done (out of scope): re-running the audit agent ("0 major" verify line) is left to the verifier.
