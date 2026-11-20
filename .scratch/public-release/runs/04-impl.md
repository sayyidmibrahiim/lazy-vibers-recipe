# Ticket 04 — implementation run (handoff / compile helpers in lvr.mjs)

Date: 2026-11-20 · Implementer: Sonnet · Not committed.
Source of truth order kept: `docs/spec` → `skills/lvr-conventions.md` → SKILL.md / references. `scripts/lvr.mjs` is the one source; `npm run sync:skills` copied it to the 7 skills.

## Commands added (all read the project with `--dir`, JSON envelope `{ok, cmd, ...}`, exit 0 for negative verdicts)

| Command | Flags | Output (besides `ok`, `cmd`) | Writes |
|---|---|---|---|
| `lint run` | `--group A,C` (comma list, validated, exit 2 on junk), `--journal` | `groups[]`, `clean` (no `bundle_gap` left), `bundle_gaps`, `self_fixes`, `needs_model_count`, `precondition {scope_locked, scope_locked_seq, s7_status, sections_not_done[]}`, `findings[] {id, group, file, message, owner, kind: bundle_gap\|self_fix, needs_model:false}`, `needs_model[] {…, needs_model:true}`, with `--journal` also `journal[] {id, seq, state}` | `--journal`: one `gap_found` (`{check, finding, owner}`) per finding, through the normal checkpoint (journal, then state, lock). Nothing else |
| `crosscheck` | none | `clean`, `rules[] {rule, title, ok, findings, needs_model}` for X1–X7, `findings[]` (lint finding + `rule`), `needs_model[]` | none |
| `blueprint emit` | `--check` (write nothing), `--in FILE\|-` (JSON `{stack, idea_summary_en, costs}`) | `check`, `changed`, `written`, `reason: in_sync\|drift\|missing\|invalid_json`, `drift[]` (JSON paths), `generated_at`, `preserved[]` | `blueprint.json`, atomic, only when a field other than `generated_at` differs |
| `handoff stubs` | none | `changed`, `written[]`, `unchanged[]`, `agents_md {ok, findings[]}` (A1/B1/G3–G6 findings for AGENTS.md) | `CLAUDE.md`, `GEMINI.md` (exact one line + LF) only when missing or wrong |
| `handoff prompt` | none | `changed`, `path`, `kickoff {claude-code, gemini-cli, codex, zcode, other}` | `HANDOFF-PROMPT.md` only when the bytes change |
| `handoff install-lines` | none | `count`, `lines[]`, `items[] {name, kind, license, nc, install, line}` | none |

Errors: state missing/unreadable/invalid → `STATE_MISSING` / `STATE_UNREADABLE` / `STATE_INVALID` (exit 1); `BUNDLE_INCOMPLETE` (emit with a core file missing, install-lines without CAPABILITIES.md); `BLUEPRINT_NEEDS_INPUT` (`details.missing[]`, `details.hint` shows the `--in` shape); `BLUEPRINT_INVALID`; unknown payload key → `INVALID_PAYLOAD`. All writes go through `confine()` + `writeFileAtomic()`. BOM and CRLF are normalised on read (tested).

### Check coverage (ids = `lint-checklist.md`)

Scripted: A0–A18 (`A0` = whole bundle missing, S9 never ran) · B1–B18 (headings in order, decision/booster table header rows, one block per feature / milestone, ASSUMPTIONS heading shape) · B19 Mermaid fences · B20 unfilled `<…>` placeholders · new B21 display and feature names identical across files · C1–C5 · D1–D6 · E1, E2, E4 · F1–F4 (parked features need a requirements block marked parked and a USER_FLOWS heading marked `(parked — see SCOPE.md)`) · G1–G6 · H1–H4 (H2 = full derive and compare, `generated_at` ignored).
`needs_model` (never guessed, always listed when the files exist): B19 (English), B21 (stack and entity names), C4 (Why/confirm lines specific), D3 (machine-checkable), D5 (a procedure really covers its criterion), E3 (cost tables agree), G3 (concrete description), H4 (no contradiction with `decisions[]`).
Finding kinds: `self_fix` = G1, G2, H1, H2, H3 (owner `lvr-handoff`); every other finding is a `bundle_gap`. Owners: A/B/C/E/G3–G6/H4 → `S9`, D → `S8`, F1–F3 → `S7 or S9`, F4 → `S9`.
Cross-check rules: X1 = B5, B9, F4 · X2 = C1–C3 · X3 = C4, C5 · X4 = B21 · X5 = D4, D5 · X6 = E4 · X7 = A. They are a filter over the same checks, so lint and crosscheck can never disagree.

### blueprint derivation

From state: project, `decisions_count` (all three keys), milestones (`goal`, `verified`). From the bundle: features (requirements headings, `in_mvp` from SCOPE.md In MVP), `acceptance_count` (MILESTONES.md criteria), costs totals (OVERVIEW.md total rows; USD figure, or zero), capabilities (CAPABILITIES.md table: kind, license, `nc`, first backticked install), pointers fixed. Judgment fields that no parseable bundle text states (`stack.primary`, `stack.components`, `idea_summary_en`, a non-zero Rp total) come from `--in`, else are kept from the existing `blueprint.json`, else the S0 record summary (idea only), else the command refuses with `BLUEPRINT_NEEDS_INPUT`. `stack.reasons_ref` falls back to the newest S2/S3/S5 decision whose summary says "stack"; it must name a real decision.

## SKILL.md and doc changes

- `skills/lvr-handoff/SKILL.md`: Step 2 runs `LVR lint run --journal` and acts only on its `findings[]` (kinds, `needs_model` done by the model, extra `gap_found` for model findings, no reword or drop); Step 3 adds "fix only what the lint reported" and re-lint with `--journal`; Step 4 uses `blueprint emit` (with the `--in` recipe), `handoff stubs` (+ `agents_md`), AGENTS.md verification via G3–G6; Step 5 uses `handoff prompt` and `handoff install-lines`; never-list gains "never reword or drop a script finding". Prose stays as the Node-less fallback (explicit "Fallback (no Node)" line in Step 2).
- `skills/lvr-init-new-idea/SKILL.md` S9: cross-check step gets a `Script: LVR crosscheck` line (fix only what it reports, `needs_model` by reading, parked-feature rule); step 5 gets `blueprint emit` / `handoff stubs`.
- `skills/lvr-recheck-plan/SKILL.md` and `skills/lvr-add-feature/SKILL.md`: one `Script:` sentence each for `blueprint emit` (`--check` previews drift).
- `skills/lvr-handoff/references/lint-checklist.md`: Script paragraph (scripted vs `needs_model`, crosscheck rule map), A0, new B21, G1/G2/H3 are self-fixes, H4 also checks `stack.reasons_ref`, cost pointer. Spec: `docs/spec/04-bundle.md` (crosscheck and emit notes), `docs/spec/03-skills.md` (handoff flow mentions the commands). Shared Script-helper block untouched: identical in all 7 SKILL.md (one md5 once the step number is stripped, as in ticket 03).
- Pointer fix: the schema example `costs.table_ref` said `RESEARCH.md#costs` while the rule beside it says the pointer names the Cost table section and the dogfood bundle used `RESEARCH.md#cost-table`. The example now says `RESEARCH.md#cost-table` in `docs/spec/04-bundle.md`, `templates.md` §19 and the lint checklist (the emit output uses it).

## Fixtures: `.scratch/public-release/fixtures/04/`

`run.sh` (82 checks, all on temp copies; fixtures never written) · `make.mjs [--record]` regenerates `broken/` from `futsal-fixed/` (`--record` also rewrites each `expect.json`; I reviewed every recorded message by eye) · `check.mjs` (assertion helper).
`broken/<case>/` = only the changed files (`overlay/`), `delete.json`, `expect.json` with the EXACT `[id, message]` list for `lint run` and `[rule, id, message]` for `crosscheck`; the case passes only if the lists are equal (no extra, no missing findings).

49 cases (47 broken + 2 must-pass): A `a_missing_file a_empty_file a_bundle_missing` · B `b_heading_missing b_heading_order b_table_header b_mermaid b_placeholder b_runtime_param_ok(pass) b_title_name b_feature_name b_requirement_missing b_milestone_missing` · C `c_decision_row_missing c_decision_extra_row c_decision_status c_decision_empty_cell c_assumption_missing c_assumption_why c_assumption_confirm c_assumption_for_confirmed` · D `d_feature_unassigned d_feature_twice d_goal_missing d_vague_criterion d_procedure_missing d_no_procedure d_smoke_unnumbered` · E `e_no_one_time_total e_no_cost_table e_unsourced_price` · F `f_unclassified f_no_reason f_no_lock_cite f_status_mismatch` · G `g_stub_wrong g_stub_missing g_load_order g_rules_missing g_file_map g_what_short` · H `h_blueprint_missing h_blueprint_drift h_blueprint_schema h_reasons_ref` · parked `parked_ok(pass) parked_bad`.
Every lint group A–H has several; crosscheck rules: X1 `b_requirement_missing`, `parked_bad`, `f_status_mismatch` · X2 `c_decision_*` · X3 `c_assumption_*` · X4 `b_title_name`, `b_feature_name` · X5 `d_procedure_missing`, `d_no_procedure` · X6 `e_unsourced_price` · X7 `a_*`.

Other asserted behaviour: futsal-fixed lint clean (0 findings, `needs_model` = B19,B21,C4,D3,D5,E3,G3,H4) and crosscheck clean (7 rules); `blueprint emit --check` no drift; CRLF+BOM copy lints clean; `handoff stubs`, `handoff prompt`, `blueprint emit` second run `changed:false` and the tree is byte-identical to futsal-fixed; stubs/prompt/emit repair missing or wrong files then go idle (prompt bytes identical to the fixed file); `emit --check` on drift writes nothing, `emit` writes once, a second emit with a later clock keeps `generated_at` and bytes; emit without stack input fails `BLUEPRINT_NEEDS_INPUT`, with `--in` it writes and lint is clean; `install-lines` 9 rows; `--group G`, `--group A,B`, `--group Z` (exit 2); `--journal` appends exactly one `gap_found` per finding, journal healthy, `state validate` valid.

## Results

| Check | Result |
|---|---|
| `bash fixtures/04/run.sh` | ALL PASS (82 checks) |
| `bash fixtures/03/run.sh` (ticket 02/03 regression) | 9/9 PASS |
| `npm run lint` (only the pre-existing `research/J-signals-probe.mjs` warning remains) / `npx tsc --noEmit` / `npm run check:skills` | 0 / 0 / 0 |
| `cmp` `scripts/lvr.mjs`, conventions, principles → all 7 skills | identical |
| Fixture `.scratch/lvp-core/dogfood/run` | untouched (`git status` clean there) |

## futsal-fixed: what was really wrong

`futsal-fixed/` = copy of `.scratch/lvp-core/dogfood/run`, then `blueprint emit`, `handoff stubs`, `handoff prompt` (clock `LVR_NOW=2026-11-20T10:00:00Z`). The lint on the untouched copy found exactly one finding (H3, self-fix) and emit found the rest of the same defect. Two files differ from the original, nothing else:

1. `blueprint.json` — `decisions_count` was `{confirmed: 8, assumed: 13}` with no `designer_filled` key. The real split is 8 `user_confirmed` and 13 `designer_filled` (0 `assumed`), and schema v1 requires all three keys. Cause: the dogfood bundle predates the three-key schema. Fixed by `blueprint emit` (which also refreshed `generated_at`). Everything else in the old file (stack, features, milestones, costs, capabilities, summary) re-derived identical.
2. `HANDOFF-PROMPT.md` — the dogfood file had 8 rules; handoff SKILL.md Step 5 requires a 9th (`.lvr/` is read-only planning state). `handoff prompt` rewrote it from the fixed template; the first 8 rules are byte-identical.

No check was weakened. The other 18 bundle files, `CLAUDE.md`, `GEMINI.md` and `.lvr/` pass the full lint as they are (0 bundle gaps).

## Deviations and judgment calls

- Finding set per ticket: the ticket's finding shape `{id, group, file, message, owner}` gained `kind` and `needs_model`; judgment items are a separate `needs_model[]` list, so `clean` means "no scripted bundle gap" and never claims the judgment items passed (the skill says so).
- `state scope` (research row 11) does not exist in lvr.mjs; the precondition evidence is returned inside `lint run` (`precondition`) instead of adding another command. `lint run` and `crosscheck` do not refuse on an unlocked scope: the skill's Step 1 owns the refusal.
- New lint id B21 and A0 (documented in the checklist); H3 and G1/G2-wrong-content became self-fixes so Step 4 can repair them without a user decision (the checklist previously said "wrong content → finding" for G1/G2 while Step 4 already rewrote them).
- B20 treats a `<token>` as a documented runtime parameter when the same file shows it in inline code or a fenced block; any other `<…>` outside code is a finding.
- `table_ref` example changed to `RESEARCH.md#cost-table` (see above).
- Not done: `lint audit` (research row 15, recheck mechanical groups) — out of this ticket. `handoff install-lines` is built (cheap) and tested.
- Cases whose golden output I recorded with the tool and then reviewed by eye (not hand-typed first); ids and messages are what the checklist wording implies, and the exact strings are now pinned.

## Fix round 1 (verifier FAIL, 3 blocking items + stubs advisory)

Source: `.scratch/public-release/runs/04-verify.md`. Everything is in `scripts/lvr.mjs` (synced to the 7 skills), the handoff and init SKILL.md, `lint-checklist.md`, `docs/spec/04-bundle.md`, and fixtures 04.

1. **B-1, X5 false pass.** `X5` now reads `B15, D4, D5`, so a milestone with no `## M<n>` section in VERIFICATION.md shows up in `crosscheck` (and the heading-order B15 finding too). Fixture `b_verification_section_missing`: `X5 / B15 / File VERIFICATION.md has no "## M3 — <name>" section.`
2. **B-2, items half-done.** Each is now either scripted or explicitly in `needs_model`; the checklist's claim is exact.
   - B13: the Parking Lot heading goes through the same ordered-heading check as the others (`b_scope_heading_order`: `...has the heading "## Parking Lot (recorded, never deleted)" out of order; it must come after "## In MVP".`).
   - E4: a row whose table has a Source column and an empty Source cell is a finding (`e_empty_source`: `RESEARCH.md cost row "Vercel Hobby (app hosting, deploy, TLS)" has an empty Source cell.`). OVERVIEW rows have no mandatory Source column, so the source half there is `needs_model` E4.
   - D4: a procedure step under 25 characters or with a vague phrase is a finding (`d_thin_step`: `VERIFICATION.md section M1 step 1 is too thin ("Check it."): give the exact command or action and the expected result.`). The exact-command-plus-output judgment stays in `needs_model` D4.
   - D6: the same thin-step rule for the smoke test (`d_thin_smoke`: `VERIFICATION.md "## Global smoke test" step 2 is too thin ("Try it."): ...`); "a real end-to-end pass" is `needs_model` D6.
   - Also G4 now requires the five SPEC file names, and G5's "done only when" rule is `needs_model` G5 (checklist said more than the script did).
   - `needs_model` is now 12 items: B19, B21, C4, D3, D4, D5, D6, E3, E4, G3, G5, H4. The checklist names exactly these; "every other check is scripted in full".
3. **B-3, duplicate and orphan features.**
   - New B5 / B9 finding for a repeated id (`b_requirement_duplicate`: `File SPEC/requirements.md has 2 "## F-01 — <name>" blocks (lines 5, 14); a feature has exactly one.`; `b_flow_duplicate`: the B9 twin).
   - `featureUniverse` now includes USER_FLOWS ids, so an F-NN only in USER_FLOWS gives B5 (no requirements block) and F1 (not classified in SCOPE) (`b_flow_orphan`, F-07).
   - `blueprint emit` refuses (nothing written) with `BUNDLE_FEATURES_INCONSISTENT` and `details {duplicate[], without_requirements[]}`. Spec says nothing about dedupe, so I chose refuse; documented in spec 04 and handoff SKILL Step 4. H2 stays silent while duplicates exist (B5 reports them).
4. **Advisory A-1, stubs.** `handoff stubs` copies a customised CLAUDE.md / GEMINI.md (non-empty, not the stub) to `<file>.bak-<YYYY-MM-DD>` (`-2`, `-3` on collision), inside the project (`confine`d), then writes the stub. Output gains `backed_up[] {file, backup}`. Rewrite is what spec and SKILL already required (G1/G2 self-fix); the backup only removes the silent loss. Documented in handoff SKILL Step 4 (tell the user once) and spec 04 side artifacts. Also A-3 (names compared after NFC).
   Not taken: A-2, A-4–A-9.

Run.sh: 97 checks, ALL PASS (was 82): 8 new broken cases above, plus emit refusal (duplicate: exact message, blueprint.json untouched; orphan F-07), stubs backup (exact name, text kept, second run no-op, same-day `-2`). The `needs_model` assertion now lists the 12 ids. `fixtures/03/run.sh` 9/9, `npm run lint` rc 0 (one pre-existing warning), `npx tsc --noEmit` 0, `npm run check:skills` 0, all `cmp` copies identical, Script-helper block 1 md5 across the 7 SKILL.md, `.scratch/lvp-core` untouched.

## Fix round 2 (re-verify: R-1, R-2 + advisory A-3)

1. **R-1, SCOPE-only feature.** `F1` is now part of crosscheck rule `X1` (`B5, B9, F1, F4`; the title says each F-NN needs a flow, a requirements block and a SCOPE classification). Chosen over widening `featureUniverse`, which would have made B5/B9 demand blocks for ids that SCOPE alone invented; F1 already has the exact message. Fixture `f_scope_only_feature` (F-06 added to In MVP): lint `D1 Feature F-06 is in the MVP but lands in no milestone.` + `F1 SCOPE.md lists F-06, which is not in the S4 record, requirements or milestones.`; crosscheck `X1 / F1` with the same F1 message. Two older cases gained the matching X1/F1 line in `expect.json` (`b_flow_orphan`, `f_unclassified`), reviewed: the lint lists did not change.
2. **R-2, Source cell.** E4 now rejects a Source cell that is only a date or placeholder after removing dates and filler words (`accessed`, `checked`, `TBD`, `n/a`, `none`, `unknown`, `pending`, `-`, `?` …), in BOTH cost tables wherever a Source column exists: `<file> cost row "<item>" has no real source in its Source cell ("<cell>"): name where the price came from, not only a date or a placeholder.` An empty or dash-only cell keeps `has an empty Source cell.` An `unverified` row needs no Source (checklist wording; fixes the over-strict advisory). The `needs_model` E4 text now covers both tables, is listed whenever any bundle file exists, and the checklist sentence plus init S9 line say the same; still 12 ids.
   Fixtures: `e_source_date_only` (RESEARCH, `accessed 2026-11-07`), `e_source_placeholder` (RESEARCH, `TBD (2026-11-07)`), `e_overview_source_date_only` (OVERVIEW, `checked 2026-11-07`), each lint E4 + crosscheck X6 with the message pinned; `e_unverified_dash_ok` (unverified row, Source `-`) stays clean.
3. **A-3.** The display name (state and the H1 title) is now compared after NFC too (futsal's name is ASCII, so no fixture; checked by code path only).
Results: `fixtures/04/run.sh` ALL PASS (102 checks), `fixtures/03/run.sh` 9/9, `npm run lint` rc 0 (one pre-existing warning), `npx tsc --noEmit` 0, `npm run check:skills` 0, `cmp` copies identical, Script-helper block one md5, `.scratch/lvp-core` untouched, futsal-fixed clean. Not taken: A-2, A-4 to A-9, the Parking Lot `**F-06 Ghost**` row format, the dangling-symlink backup name.

## R-3 patch (orchestrator, after re-verify round 2)
Applied the verifier's stated fix: the project-name B21 check now compares `String(blueprint.project.name ?? "").normalize("NFC")` against the NFC state name (scripts/lvr.mjs, `lint run` group B). Added fixture 1c to `fixtures/04/run.sh`: the futsal name replaced by an accented NFD name in every file including blueprint.json → no B21; then blueprint NFC → no B21. Negative control: with the old line the all-NFD check FAILS with the exact R-3 symptom. Results: fixtures/04 104/104 PASS, fixtures/03 9/9, lint 0, tsc 0, check:skills drift [], all copies cmp-equal.
