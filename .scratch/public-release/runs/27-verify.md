# Ticket 27 verification (independent QA, Opus · high)

Verifier: Opus, 2026-11-21. I wrote none of the code. Nothing committed, no source file edited. All adversarial work ran on copies in the session scratchpad (`…/scratchpad/v27/`). The real `/tmp` `.lvp` projects (43 folders) and `.scratch/lvp-core/dogfood/run` were copied first. Their sha256 trees were re-checked at the end and are unchanged, and no `.lvr/` appeared in any of them.

I formed the verdict below before reading `runs/27-impl.md`. The deviation rulings (§6) were written after reading it.

## Verdict: FAIL (3 blocking)

The script side is strong. Migration is idempotent, crash-safe under real SIGKILL, never rewrites the journal, and leaves the old `.lvp/` untouched. Replay covers all 60 event types. `SCHEMA_TOO_NEW` holds on every project command. All regressions are green. Three defects block:
- **B1:** a damaged `.lvp`-only project has no working recovery path (dead loop).
- **B2:** an `ai_recommended` product type with no explicit status is stored as decided and confirmed.
- **B3:** `/lvr-continue` branch a (retry after `error`) was not moved to `sessions[-1].recovered_error`, so it can no longer fire.

## 1. Ticket boxes: PASS for the script; box 4 partly met (B1)

| Box | Result |
|---|---|
| Schema v2 fields | PASS. A fresh state has the 15 root keys in canonical order: `project.error`, `product` (types/flags/status/source/rationale/confirmed/updated_at), `pipeline.research` (brief/scans/log/web_check), `boosters.installed[]`, `framework_decision`, `release_check`, `review` (ledger pointer + last run), `agents_delegated[]`, `sessions[]`. `version` → `lvr_schema: 2`. |
| New events in conventions | PASS. 60 types. `EVENT_TYPES` equals the conventions "Event types:" line, same order (checked by script and by `check:skills`). Every type named in the ticket is present; `context_research` already existed and now has a state effect. |
| Replay handles every event | PASS (coverage table below). No event is listed without a rule, and none is silently ignored: an unknown type is `untranslatable`; informational types are documented as such in spec 01 §Replay coverage. |
| Idempotent migration `.lvr/` and `.lvp/` | PASS for healthy projects (37/37 real `.lvp` projects, v1_cli, futsal). **FAIL for a `.lvp`-only project whose state is invalid/unreadable/missing/lagging (B1).** |

### Replay coverage table (built from `EVENT_TYPES` vs the `applyEvent` switch)

| Event | Reducer | Spec 01 replay row | `/lvr-continue` prose row |
|---|---|---|---|
| session_start, session_end | case (sessions[], restore) | yes | yes |
| folder_gate_passed, folder_gate_rejected, folder_gate_subfolder_created | default → informational | yes (`folder_gate_*`) | yes |
| tier_declared, tier_changed | case (+ session tier) | yes | yes |
| capability_probe_passed, capability_probe_failed | case | yes (`capability_probe_*`) | yes |
| context_guard_triggered, truncation_recovered | informational | yes | yes |
| booster_check, booster_install_ok, booster_install_failed, booster_choice | case | yes | yes |
| booster_installed, booster_uninstalled | case (installed[] + status list + session) | yes | yes |
| section_start, section_done, section_blocked, answer_recorded | case (+ restore, + session) | yes | yes |
| loop_back_opened, loop_back_closed | case | yes | yes |
| scope_locked, doc_generated | case (report only) | yes | yes |
| handoff_started, recheck_started, feature_started, brand_started, resume | case (restore) | yes | yes |
| gap_found | informational | yes | yes |
| handoff_done, build_started, build_done, milestone_verified, deployment_verified | case | yes | yes |
| recheck_finding, recheck_research_refresh, recheck_fix_applied, recheck_done | informational (by design: not mapped into `review`) | yes | not named (covered by the generic "informational" sentence) |
| review_started, review_done | case | yes | yes |
| feature_captured, feature_research, impact_analysis, feature_scope_decision, feature_done | informational (extensions still fold) | yes | partly named |
| feature_applied | extensions | yes | yes |
| milestone_started, milestone_failed, build_blocked | informational | yes | yes |
| release_checked, framework_selected, agent_delegated | case | yes | yes |
| brand_file_generated, brand_done | informational | yes | not named |
| error | case (`project.error`) | yes | row not updated for `project.error` (A6) |
| research_logged, context_research | case (`pipeline.research`) | yes | **row still says "no state effect"** (A6) |
| schema_migrated | informational (reserved: `EVENT_RESERVED` on append) | yes | yes |

Reducer cases that are not in `EVENT_TYPES`: none.

## 2. Migration, adversarial (all on copies): PASS except B1

| Test | Result |
|---|---|
| **43 real `/tmp` `.lvp` projects** (lvp-verify-16/17/corrupt/fix/g1g3/handoff/probe/publish/tier, test-lvp; Nov 13–19 eras) | 37 migrated. On every one: `.lvp/` sha tree byte-identical; v1 pointers changed 0 and added 0 (outside the v2 keys); `.lvr/journal.ndjson` = `.lvp` journal bytes + exactly 1 line; backup `state.json` byte-equal to the source with `manifest.json` present; second run `needed:false` with the `.lvr/` tree byte-identical; `journal check` healthy; `state validate` valid; `sessions[0]` = `lvp-init-new-idea` "not recorded…". |
| Same 37: `replay --compare` | `v2diff = []`. For each project I also copied `.lvp/` to `.lvr/` and ran the **v1** script's (HEAD) `replay --compare`: the v2 diff pointer set equals the v1 set on all 37 (`newInV2: []`, `goneInV2: 0`). Migration adds no divergence; what remains is the v1 prose-journal gap. |
| 6 real projects with an invalid v1 state (probe/scenario-m1, m2; publish/scenario-j, k, l: `E_LOOPBACK` opened_at) | `--check` → `blocked.code STATE_INVALID`, exit 0, nothing written; `migrate` → exit 1, nothing written, `.lvp` intact. **But the hinted recovery `replay --write` (and `replay --compare`, `journal restore-from-state`) answers `NO_LVR` "run `state migrate`" → dead loop (B1).** |
| `.lvr` v1 corrupt (truncated JSON) | migrate → `STATE_UNREADABLE` exit 1, `find -newer` 0 files; `replay --write` → `state.corrupt-<date>.json` + v2 state; `--check` → `needed:false`; compare `[]`. PASS |
| `.lvr` v1 invalid (bad status) | `blocked STATE_INVALID`; `replay --write` writes v2. PASS |
| Sidecar lag (`lag:15`, `19`, and a v1-script append left unapplied) | `MIGRATION_BLOCKED` (`state_sync: lagging`), nothing written; `replay --write --force` → v2 + backup `via: replay`, `in_sync`. PASS |
| Both folders | `.lvr` v2 + stale `.lvp` → `needed:false`, `kept`; `.lvr` v1 + unrelated `.lvp` → in place, `.lvp` `ignored`, `copied_from:null`; empty `.lvr/` + `.lvp` → copy; stray file in `.lvr/` + `.lvp` → `LEGACY_CONFLICT`, tree unchanged. PASS |
| **SIGKILL loop**: 40 real SIGKILLs at random times (35–105 % of the measured runtime) on each of v1_cli, lvp_futsal and v1_futsal (120 kills), plus 40 earlier ones (0–110 %) on each, plus 24 `LVR_TEST_CRASH_AFTER` runs (6 points × 2 projects × 2) | Every window was hit: `.tmp` staging, backup done, journal +1 with v1 state (heal path), v2 written, `.lvr.migrating-*` staging, `.lvr` copy not yet migrated. After a plain re-run: tree byte-identical to the uncrashed reference (excluding `.state-seq`/lock files), one backup, journal = source + 1 line, `.lvp/` unchanged, healthy, compare `[]`. The "state" window leaves `.state-seq` one behind; the next append heals it to `in_sync`. **0 data-loss or consistency failures.** One kill landed between lock create and pid write: the re-run got `LOCKED` for about 30 s (pre-existing lock rule, A3). |
| `--check` writes nothing | `find -newer` = 0 on v1_cli, lvp_futsal, v1_futsal, corrupt, lagging; the tree is unchanged on all 43 real copies. PASS |
| Double run | Byte-identical (37 real + 3 baselines). PASS |
| Read-only | `.lvr/` read-only → `LOCKED` (EACCES), nothing changed. `state.json` 0444 → migrates (atomic rename). Journal 0444 → backup made, `JOURNAL_WRITE_FAILED`, state still v1; after chmod the re-run **reuses** the backup. Read-only `migrations/` → **`INTERNAL`** (unwrapped mkdir; nothing changed, A4). Read-only root on a `.lvp` copy → `LOCKED`, unchanged. **Read-only `.lvp/` → the copy keeps 0444/0555 modes, so the new `.lvr/` is unwritable: `LOCKED` + `MIGRATION_NEEDED` until chmod (A2).** No data loss in any case. |
| CRLF / BOM | CRLF state, BOM state, CRLF journal, BOM journal, CRLF + BOM; each on v1_cli, v1_futsal and lvp_futsal (15 runs): all migrate; backup byte-equal to the original (CRLF/BOM kept); journal is a byte prefix (never rewritten); compare = 0 (v1_cli) or 45 (futsal = documented baseline); second run `needed:false`; `.lvp` same. PASS |
| Backup never overwritten | Restore the v1 files and re-migrate with the same `LVR_NOW` → `backup_reused: true`, backup bytes untouched. A different v1 state with the same clock → new `…-2/`; the first backup is intact. A user folder squatting the stamp name → `…-2/`, user file intact. PASS |
| `--remove-legacy` | After migration → `removed:true`; edited `.lvr` record → `LEGACY_DIFFERS` with the file, `.lvp` intact; extra file in `.lvp` → `LEGACY_DIFFERS`; backup removed → `LEGACY_DIFFERS`. Before any migration → `LOCKED ENOENT` (wrong code, nothing deleted, A4). PASS |

## 3. Replay parity: PASS

- Fixture 27 event cases (one per new event, live = replay): 120/120 PASS.
- After migration, `replay --compare` is `[]` for CLI journals (v1_cli, the 9 HEAD fixture-03 v1 states, now migrated) and exactly the documented v1 prose gap for prose journals (futsal 45 = `futsal-v1-replay-diff.json`; 37 real projects equal to their own v1 diffs).
- My own CLI fuzz (different from the fixture fuzz): 3 seeds × 30 runs × 60 ops = 5,400 ops. It covers every new event, `answer record` with `product`/`coverage`, `research log` (both kinds), `framework_selected` with `decisions[]`, error/restore chains, user-scope boosters, `session_end` with `start_seq`, reserved `schema_migrated`, state deletion + `replay --write`, sidecar deletion + `--force`, and a third of the runs starting from a migrated v1 project. Result: **0 failures**: replay `[]`, `untranslatable` `[]`, healthy, valid, no refused op changed a file, no `INTERNAL`. The only `untranslatable` seen was `loop_back_closed` without an open, which is v1 behaviour (reproduced with the HEAD script) and was excluded.
- Fixture fuzz 6×40: PASS.

## 4. Owner decisions: SCHEMA_TOO_NEW PASS · product type FAIL (B2) · cancelled PASS (with A1)

**SCHEMA_TOO_NEW.** I ran 30 commands on each of these projects: schema-3 `.lvr`, schema-3 `.lvp`-only, corrupt `.lvr` state with a `schema_migrated {to:3}` in the journal, and a BOM schema-3 state. The commands: journal append, answer record, decision record, research log, state write, state validate/get, state migrate (+`--check`, `--remove-legacy`), replay (plain, `--compare`, `--write`, `--write --force --accept-loss`), journal check/tail/restore-from-state, lint run (+`--journal`), crosscheck, cite check, blueprint emit (+`--check`), handoff stubs/prompt/install-lines, gate check, gate subfolder, booster check `--journal`. Every one answers `SCHEMA_TOO_NEW` exit 1, and the tree (content + mtimes) is unchanged. Only `slug free` passes, which reads no project. `state write` of a v3 document into a v2 project → `STATE_INVALID`, nothing written. Not caught (A5): a v3 project whose state is corrupt and whose journal has no `schema_migrated` marker, only unknown stamped types. `replay --write` then rebuilds a v2 state (downgrade). The same happens with a string `"schema_version":"3"`.

**Product type (B2).** These are what validation does:
- `{types, source:"ai_recommended", rationale, confirmed:false}` → rejected, nothing journaled (good)
- `{status:"decided", …, confirmed:false}` → `INVALID_PAYLOAD` (good)
- `{status:"pending", source:"ai_recommended", …}` → pending, `confirmed:false` (good)
- `ai_recommended` without a rationale → refused (good)
- **`{types:["web"], source:"ai_recommended", rationale:"…"}` with no `status`/`confirmed` → accepted and stored as `status:"decided", confirmed:true`.**

So the reducer manufactures a user confirmation that nobody gave. This contradicts P6 ("the AI recommends … the user confirms") and the impl report's own contract ("an AI recommendation waiting for the user is `pending`").

**Cancelled sessions.** A `cancelled` with no note, or a blank note, → `INVALID_PAYLOAD`. `refused` is gone from the enum. A cancelled session shows in `sessions[]` with `end_reason: cancelled` and `end_note`. `session_end` with no open session, or a wrong `start_seq`, → `INVALID_PAYLOAD`. `session_id` `""` or a missing reason → refused. Replay `[]`. Gap (A1): the owner's two named examples ("wrong folder, no web") are init refusals that write no journal by design, so they can never appear in `sessions[]`. Init's ownership row has no `cancelled`.

## 5. Regressions: PASS

- Fixtures: 03 (9) PASS, 04 (105) PASS, 26 (75) PASS, 40 (103, including the A13–A16/B1–B2 negative controls) PASS, 27 (120 + fuzz) PASS. The working tree is unchanged by the suites (`git status` before = after).
- `npm run lint` rc 0, `npx tsc --noEmit` rc 0, `npm run check:skills` rc 0 (`drift:[]`, `problems:[]`), `node --check` OK.
- `cmp`: the 7 `skills/*/scripts/lvr.mjs` equal `scripts/lvr.mjs`; the 7 `references/conventions.md` equal `skills/lvr-conventions.md`.
- The Script-helper block is identical across the 7 SKILL.md (fixture 40 md5 check PASS).
- Fixture 03 regeneration: on all 9 cases the only journal change is the `session_start` payload (`session_id_reason`), and every v1 pointer of the expected state equals HEAD's. The HEAD (v1) copies of the 9 cases migrate with the new script and replay `[]`.
- The fixture 40 re-pin is sound. `52fb850` is exactly `b0b10c9^` (the pre-ticket-40 commit). Every file the controls check now differs from it, so the controls always run instead of turning into INFO after a commit; all 23 PASS. Residual risk: a history rewrite that drops `52fb850` turns them into FAIL. Keep it in mind.

## 6. Deviation rulings

1. **SCHEMA_TOO_NEW instead of SCHEMA_UNSUPPORTED**: accepted. This is the owner's Q2 wording. It holds on every project command (§4), never writes, and `state migrate --check` refusing (rather than returning data) is consistent with "every command that reads a project".
2. **`cancelled` with a required note (replacing `refused`)**: accepted. Matches V1/Q3. Enforced live and stored as `end_note`.
3. **One shared session/preflight block in the 7 SKILL.md**: accepted for the session/preflight/`SCHEMA_TOO_NEW`/`error` rules, because the per-skill `error` triggers live in the conventions ownership table, which every SKILL loads. Not accepted as cover for the skipped **per-skill** edit the design listed (§10, continue branch a), which is B3.
4. **`answer record` forwards `product`/`coverage`**: accepted and needed. The fields still pass through `validatePayload` (tested: bad extensions are refused, nothing journaled).
5. **Older-fixture changes** (03 regenerated; 26/40 `session_start` payloads; 04/26 migrate a temp copy of `futsal-fixed` before writing; 26 `meta events` tail): accepted. The schema-1 `futsal-fixed` input is never edited in place. The v1 values of fixture 03 are unchanged. The 26 comparison is now against a migrated copy, which is the right baseline.
6. Other impl deviations (pid-aware lock, root `.lvr-migrate.lock`, `orig_ts`, canonical key order, replay counters): accepted. See A3 and A7.

## BLOCKING

- **B1. A damaged `.lvp`-only project has no recovery path.**
  - Affected: 6 of the 43 real old projects on this machine.
  - When the `.lvp` state is invalid or unreadable (and by the same code path: missing, lagging/unknown, no journal), `state migrate` refuses (correctly) and the hint routes to `replay --write` / `journal restore-from-state`.
  - Those answer `NO_LVR` "run `state migrate`". `/lvr-continue` Step 2 maps them the same way, so the skill loops and the user is stuck.
  - Box 4 is not met for these projects.
  - Fix: when the folder is `.lvp`-only, copy `.lvp/` → `.lvr/` first (same staged copy) whatever the verdict, then hand the blocked code to the normal `.lvr` recovery. Or let `replay`/`restore-from-state` do that copy themselves. Add a fixture: a `.lvp` project with a corrupt state goes from `--check` through recovery to v2.
- **B2. `ai_recommended` is treated as decided and confirmed by default.**
  - `foldProduct` sets `status:"decided"` and `confirmed:true` whenever `types` is non-empty and `status` is absent, even with `source:"ai_recommended"`.
  - Fix:
    - Either refuse `source: ai_recommended` without an explicit `status` (`INVALID_PAYLOAD product.status`), or default it to `pending` + `confirmed:false`.
    - Then make "types without a status = the user decided them" apply to `source` absent/`user` only.
  - Add the fixture row.
- **B3. `/lvr-continue` branch a is dead (regression).**
  - Every run now opens with `session_start`, which restores the status from `error` (by design, decision 5).
  - But `skills/lvr-continue/SKILL.md` §5a still says "Decide this from the status loaded in Step 2, before this run's `resume`". Its rebuild-path rule ("the last `error` … followed by no restoring event before this run's `resume`") also fails, because `session_start` is itself a restoring event.
  - So the "retry the failed step" offer can no longer trigger. This contradicts conventions §2 ("offers the retry when the session it just opened has a `recovered_error`").
  - Design §10 required this edit; the impl report does not list it as a deviation.
  - Fix: decide branch a from `sessions[-1].recovered_error` (set on both the healthy and the rebuild path). Update the §2b prose rows for `error`/`resume`.

## Advisories (non-blocking)

- **A1.** Owner V1's examples ("wrong folder, no web") are init refusals that write nothing, so they never reach `sessions[]`. Either confirm with the owner that ticket 39 gets them from harness logs, or document "refusals before a journal exists leave no session".
- **A2.** The `.lvp` copy keeps read-only modes (`cpSync` plus the source modes), so a read-only `.lvp/` yields an unwritable `.lvr/`. Add `u+w` on the staged copy.
- **A3.**
  - A SIGKILL between the lock's `open(wx)` and the pid write leaves an empty lock, which means `LOCKED` for 30 s (pre-existing rule).
  - A crash during a `.lvp` copy leaves `<project>/.lvr-migrate.lock` in the project root forever, because the in-place re-run never takes or removes it. It is harmless, but it is litter a user may commit.
  - Fix for both: treat an empty or unparsable lock older than about 2 s as stale, and remove a stale root lock on any `state migrate`.
- **A4.** Error codes:
  - read-only `migrations/` → `INTERNAL` (the mkdir of the tmp folder sits outside the `try`)
  - `--remove-legacy` before migrating → `LOCKED ENOENT`, which should be `LEGACY_DIFFERS`/"not migrated"
- **A5.** Forward-compat of the newer-schema detection:
  - The v2 guard can only see a newer project through `state.json` or a journal `schema_migrated {to>2}`. A future fresh v3 project with a corrupt state is downgraded by `replay --write`.
  - Recommend either or both:
    - a stamped event of an unknown type → `SCHEMA_TOO_NEW` on write/replay
    - document a contract that every future init journals a `schema_migrated`-style marker (or put `lvr_schema` in the `cli` stamp)
- **A6.** The `/lvr-continue` 2b prose replay table still says `research_logged`/`context_research` are "informational — no state effect". The `error` row does not mention `project.error`.
- **A7.** `restored: true` (with `orig_ts`, a caller-given `AG-NNN`, and a past `recheck_by`) is accepted from any `journal append`, so a model can backdate or forge ids. Consider limiting it to `restore-from-state` (an internal flag like `schema_migrated`).
- **A8.** `makeBackup` deletes any `migrations/v1-to-v2-*.tmp-*` folder, not only folders with a pid of its own. This is negligible, since `migrations/` is LVR-owned.

## Evidence

Scratchpad: `/tmp/claude-1000/-home-ibrahim-projects-lazy-vibers-recipe/23c653d2-751b-4de6-8fd1-e7e40b1114ae/scratchpad/v27/`:
- `bin/`: `real.mjs`, `kill.mjs`, `fuzz.mjs`, `lib.mjs`
- `logs/`: `real.json`, `v1cmp-*.json`, `kill*-*.log`, `fuzz-*.log`, `toonew.log`, `fx*.log`


## Re-verify after fix round 1

Verifier: Opus, 2026-11-21. I read only "## Fix round 1" in `27-impl.md` and the current `git diff`. Nothing was committed and no source was edited. Every test ran on copies in `…/scratchpad/v27/` (`r2/`, `r2x/`, `syn*/`). At the end, all 43 original `/tmp` projects, the 7 extra older ones and the dogfood run were byte-identical to their start-of-session hashes, and no `.lvr/` appeared in any of them.

### Verdict: FAIL (1 blocking: B2b)

- B1: fixed.
- B3: fixed.
- B2: fixed for the cases that were reported. It can still be bypassed by a later event that leaves out `source` (B2b below).
- Advisories A1, A2, A3 and A6: taken. A4: only half done.
- Regressions: none.

### Count reconciliation (my error)

Round 0 said "37 migrated, 6 stuck". My own `logs/real.json` shows **38 migrated and 5 blocked** (probe/scenario-m1, m2; publish/scenario-j, k, l), which is 43. I listed five names and miscounted the total, so "6" was my arithmetic. The implementer's 5 is correct. These are exactly the 5 projects in `fixtures/27/stuck/`. In round 0 §2 and B1, read 37 as 38 and 6 as 5.

### B1: PASS

| Test (all on fresh copies) | Result |
|---|---|
| All 43 real projects, hint chain followed literally (`bin/chain.mjs`). Start with `state migrate --check`. If `blocked`, run the first backticked command in `blocked.hint`; if `needed`, run `state migrate`; after any success, check again. Loop detection: the same command must not return the same answer twice. | **43/43 end in a valid v2 project.** 38 take check → migrate → `needed:false`. The 5 `E_LOOPBACK` projects take check (`STATE_INVALID`) → `replay --write` → `needed:false`. Every project: `.lvp/` byte-identical, `journal check` healthy, `state validate` valid, no loop. |
| Lost data vs the readable parts (each v1 answer whose `a` is not null, each v1 decision id + summary + status, section statuses, milestone ids, every `answer_id` and decision id in the journal) | **0 lost on all 43.** |
| 6 more old projects found under `/tmp` (`lvp-e2e-1/2/3`) | 6/6 end in v2. `antigravity/dogfood-test` has an empty `.lvp/` and correctly answers `NO_LVR`. |
| Synthetic `.lvp`-only copies (futsal + v1_cli): truncated state, empty state, missing state, missing state + truncated journal, no journal, invalid status, BOM+CRLF invalid, sidecar lagging (`15`), sidecar garbage | All end in v2 with `.lvp/` identical. The routes: `replay --write`; `replay --write --force` for lagging/unknown; `restore-from-state` → `state migrate` for no-journal. |
| `state.corrupt-<date>.json` on a second, third and fourth recovery the same day (fixed `LVR_NOW` and the real clock) | The first backup stays byte-identical. PASS. |
| Refusals on a `.lvp`-only folder | Schema-3 `.lvp` state: `SCHEMA_TOO_NEW` on every recovery command, nothing written. `LEGACY_CONFLICT`: nothing written. `replay --compare`, `replay` and `state validate` stay read-only (`NO_LVR`). |
| Crash safety | `state migrate` re-kill loop: PASS (see Regressions). |

### B2: FAIL (B2b)

| Payload (via `product` on an event) | Result |
|---|---|
| `{types, source:"ai_recommended", rationale}` with no status | `pending`, `confirmed:false`. PASS |
| `confirmed:"true"` (string), with or without `status:"decided"` | `INVALID_PAYLOAD product.confirmed`, nothing journaled. PASS |
| `pending` + `confirmed:false`, then `{confirmed:true}` alone | Accepted, but nothing changes (stays pending). Safe; see A10. |
| Pending AI recommendation, then `{status:"decided"}` | `INVALID_PAYLOAD product.confirmed`. PASS |
| Pending AI recommendation, then `{status:"decided", types, confirmed:false}` | Refused. PASS |
| Pending AI recommendation, then `{status:"decided", confirmed:true}` | `decided`, source stays `ai_recommended`, `confirmed:true`; compare `[]`. PASS |
| **Pending AI recommendation, then `{types:["web"]}` or `{status:"decided", types:["web"]}` (no `source`, no `confirmed`)** | **Accepted → `decided`, `confirmed:true`, `source` rewritten to `"user"`, rationale dropped.** |
| Pending AI recommendation, then `{status:"decided", source:"user"}` (no types) | `decided`/`confirmed:true`. The AI's types are relabelled as the user's choice. |
| Downstream use while `confirmed:false` | `release_checked {product_type:"web"}` is accepted with no warning, and `handoff prompt` runs. The script has no gate on an unconfirmed type (A11). |

### B3: PASS

| Path | `state get --pointer /sessions/-1/recovered_error` |
|---|---|
| Healthy: `error` → next run's `session_start` | `{seq, skill, step, message}`; `project.status` restored. After the retry (`section_done` + `session_end done`), the next run gives `null`. compare `[]`. |
| Crashed run (no `session_end`) → two new runs | First new run: the error. Second: `null`. The offer happens once (A12). |
| Rebuild, order 1: `error`, state damaged, `session_start` exits 3, then `replay --write --journal-resume` | The error is shown. |
| Rebuild, order 2: state missing, `replay --write`, then `session_start` | The error is shown. |
| Migration: v1 state with `status:"error"`, tested in place, as a `.lvp` copy and as a `.lvp` with a damaged state (`replay --write`) | `project.error` is filled from the journal. The first run after it shows the error. The run after that gives `null`. compare `[]` on all three. |
| `sessions: []` / v1 state with no `sessions` / `/sessions/-2/x` | `ok:true, found:false, value:null`, no crash. |

`skills/lvr-continue/SKILL.md` §5a now decides from `/sessions/-1/recovered_error`, and the prose fallback is anchored on this run's `session_start`. The 2b rows for `error` and `research_*` are corrected (A6).

### Advisory spot checks

| | Result |
|---|---|
| A1 | Documented: spec 01 `session_end` row, and "runs before v2 … have no session". PASS |
| A2 | A read-only `.lvp/` (555/444) → `.lvr/` 755/664, appends work, and `.lvp/` keeps its modes. PASS |
| A3 | An empty `.lvr/.lock` older than 2 s is taken at once. A fresh one waits about 2 s and is then taken. After a crash at `copy`, the root `.lvr-migrate.lock` and `.lvr.migrating-*` are removed by the next `state migrate`. PASS |
| A4 | `--remove-legacy` before migrating → `LEGACY_DIFFERS`. PASS. **An existing read-only `.lvr/migrations/` still gives `INTERNAL`**: only the `mkdir` of `migrations/` was wrapped; the `mkdirSync(tmp)` at about line 4060 was not. Nothing changes on disk. Still an advisory. |
| A6 | Fixed (see B3). |

### Regressions: PASS

| Check | Result |
|---|---|
| Fixtures | 27: 175 PASS. 03: 9. 04: 104 checks ALL PASS. 26: ALL PASS. 40: ALL PASS, including the negative controls and "Script-helper block identical". All rc 0. `git status` and the fixture tree sha are unchanged by the runs. |
| Kill loop | 45 real SIGKILLs (15 each on v1_cli, lvp_futsal, v1_futsal; 34 killed mid-run) plus 12 `LVR_TEST_CRASH_AFTER` points on lvp_futsal: **0 failures**. The re-run tree equals the reference and `.lvp/` is unchanged. |
| Fuzz (`bin/fuzz.mjs`, seed 2027) | 20 × 60 = 1,200 ops (950 accepted): **0 failures**. Earlier this session: 3 × 30 × 60, 0 failures. |
| Tooling | `npm run lint` 0, `npx tsc --noEmit` 0, `npm run check:skills` 0 (`drift:[]`, `problems:[]`), `node --check` OK. |
| Copies and shared blocks | `cmp`: the 7 script copies and 7 conventions copies are equal. The Script-helper paragraph has the same md5 in all 7 SKILL.md. |

### BLOCKING

- **B2b. A later event can still turn a pending AI recommendation into a user decision without an explicit `confirmed: true`.**
  - Trigger: `{types:[…]}` or `{status:"decided", types:[…]}` with `source` left out, on top of `{status:"pending", source:"ai_recommended"}`.
  - Result: `decided`, `confirmed:true`, `source:"user"`, and the rationale is erased.
  - It contradicts spec 01 §Payload extensions: an AI recommendation "becomes `decided` only by an explicit `{status: "decided", confirmed: true}` (refused … also against an `ai_recommended` entry already in state)", and the other-pick form there names `source: "user"` explicitly.
  - The live guard (about line 1684) only covers the case with no `types` and no `source`.
  - Fix:
    - Against an `ai_recommended` entry in state, refuse with `INVALID_PAYLOAD product.confirmed` any product extension that leaves `source` out and would result in `decided`, unless it has `confirmed:true`. Changing to the user's own pick then has to say `source:"user"`.
    - Decide `{status:"decided", source:"user"}` with no `types` the same way: it re-labels the AI's types, so require `types` or `confirmed:true`.
    - Add the fixture rows.

### Advisories (new)

- **A9.** Prose-era replay gaps on the `.lvp` recovery path. Nothing is lost on disk: `.lvp/` and `state.corrupt-*` keep everything.
  - On the 5 real projects, `replay --write` keeps every answer and decision. It still drops each loop-back's `risk`/`route_rule`, rewrites the milestone `goal` text from disk, and moves `current_section` S10 → S9.
  - On a synthetic invalid futsal (`status:"banana"`), 4 answers whose text exists only in `state.json` (S0.q2, S0.q3, S1.q9, S4.q14) come back null or different. The HEAD script does the same.
  - `LOSSY_REPLAY` only protects a *valid* state. Consider salvaging an invalid-but-parseable state's answers and decisions, or reporting them as lossy.
- **A10.**
  - A second damaged state on the same day is not backed up (`backup_skipped`, pre-existing). Use a `-2` suffix as the migration backups do.
  - `{product:{confirmed:true}}` alone is accepted and changes nothing, so a model may believe it confirmed. Refuse it, or point to `{status:"decided", confirmed:true}`.
- **A11.** Nothing in the script stops downstream use of an unconfirmed product type (`release_checked`, handoff). Ticket 08 or 39 should gate it, or `state validate` should warn when `scope_locked` comes while `product.status` ≠ `decided`.
- **A12.** `recovered_error` sits only on the first session after the error. If that run ends without retrying (crash or cancel), the next run no longer offers the retry. Consider carrying it forward until a restoring event of the failed `step` happens, or document it.
- **A13.**
  - On a `.lvp`-only folder, `replay --write` copies `.lvp` → `.lvr` before it refuses (`REPLAY_WOULD_OVERWRITE_VALID` on a healthy `.lvp`), so a refusal writes a folder. It is harmless: `state migrate` then runs in place and `.lvp` is `kept`.
  - `guardNewer` reads the `schema_migrated {to>2}` marker only from `.lvr/journal.ndjson`. A `.lvp`-only folder with a corrupt state and that marker is rebuilt as v2 by `replay --write`, while the same content in `.lvr/` gets `SCHEMA_TOO_NEW`. No LVR version writes a schema ≥ 2 `.lvp/`, so no real project can hit this. Extending the scan to `.lvp/journal.ndjson` costs one line.
- Still open from round 0: A5, A7, A8 (not taken, by design). A4 is half done (above).

Evidence: `…/scratchpad/v27/`:
- `bin/chain.mjs`
- `chain-r2.json`, `chain-r2x.json`, `chain-syn.json`, `chain-syn3.json`
- `logs/r2-*.log`


## Re-verify after fix round 2

Verifier: Opus, 2026-11-21. I read only "## Fix round 2" and the current `git diff`. Nothing was committed and no source was edited. All tests ran on copies (`…/scratchpad/v27/b2w/`, `a4/`, `kw4/`, `fzw3/`); the driver is `bin/b2.mjs`.

### Verdict: PASS (no blocking items)

B2b and A4 are fixed. There are no regressions. Two advisories remain, about paths that bypass the CLI's live checks (A14 and A7, below). I recommend fixing both before the public release, but neither blocks ticket 27.

### B2b: PASS for the live (CLI) path

| Variant (each starts from `{types:["web"], source:"ai_recommended", rationale, status:"pending"}`) | Live result | Replay of the same CLI journal |
|---|---|---|
| Original repro `{types}`, `{status:"decided", types}` | `INVALID_PAYLOAD product.source`, nothing written | compare `[]` |
| `{status:"decided", types, confirmed:true}` with no source | refused (`product.source`) | `[]` |
| `source: null` / `source: "User"` / `{status:"decided", confirmed:true, source:null}` | refused (`product.source`) | `[]` |
| Confirm without types `{status:"decided", confirmed:true}` | `decided`, source stays `ai_recommended`, rationale kept | `[]` |
| Confirm and swap type, no source | refused | `[]` |
| Confirm and swap type with `source:"ai_recommended"`, a rationale and `confirmed:true` | `decided` on the new type, still `ai_recommended` (explicit) | `[]` |
| `{status:"decided", source:"user"}` with no types | refused (`product.types`) | `[]` |
| The same with `confirmed:true` | `decided`/`user` (explicit yes) | `[]` |
| `{source:"user"}`, then `{status:"decided"}` or `{types}` | stays `pending` until the second event, then `decided`/`user`. Two explicit steps, so acceptable. | `[]` |
| Confirmed recommendation, then a user pick `{types:["mobile"], source:"user"}` | `decided`/`user`/mobile | `[]` |
| Confirmed recommendation, then `{types:["mobile"]}` or `{status:"decided", source:"user"}` with no source or types | refused | `[]` |
| Status reset (`unasked`, or `pending` with `[]`), then `{types}` | `unasked` → `decided`/`user` (the recommendation was withdrawn). `pending` with `[]` keeps `ai_recommended`, so a later `{types}` is refused. | `[]` |
| Flags only | `pending` unchanged | `[]` |
| Hand-edited `state.json` (pending recommendation, journal unaware, `in_sync`), then a CLI write | `{types}`, `{decided, source:user}` and `{decided}` are refused against the edited state; `{decided, confirmed:true}` passes | compare shows only the hand edit (expected) |

Every refusal left the `.lvr/` tree byte-identical, and `state validate` passed on every accepted sequence.

**Prose (unstamped) journal, replayed.** I took every payload above, including those the CLI refuses, wrote them as plain lines without the stamp, and ran `replay --write`.
- A no-source line never decides or relabels the recommendation, as round 2 claims.
- **Three forms still decide it without `confirmed:true` (A14):**
  - `{types, source:null}`
  - `{types, source:"User"}`
  - `{status:"decided", source:"user"}` with no types

  Each gives `decided`/`user`/`confirmed:true`. The fold treats an invalid source as if none was given and defaults it to `user`, and it does not repeat the live check on missing types.
- After a confirmed recommendation, a prose `{types:["mobile"]}` drops it back to `pending`. That errs on the safe side.

### A4: PASS

| Case | Result |
|---|---|
| Read-only `.lvr/migrations/` (555) with `state migrate` | `STATE_WRITE_FAILED`, exit 1, with the `chmod` hint. The tree is byte-identical, with no staging folder and no lock. After `chmod` it migrates. |
| Read-only `.lvr/` | `LOCKED`, exit 1, tree identical. After `chmod` it migrates. |
| Read-only `migrations/` with `replay --write --force` on a lagging v1 project | `STATE_WRITE_FAILED`, tree identical |

### Regressions: PASS

| Check | Result |
|---|---|
| Fixtures | 27: 191 PASS (with fuzz 6×40, 0 failures). 03: 9 PASS. 04: 104 checks. 26: ALL PASS. 40: ALL PASS. All rc 0. `git status` and the fixtures tree sha are unchanged by the runs. |
| Kill loop | 24 SIGKILLs (12 each on v1_cli and lvp_futsal; 21 killed mid-run): 0 failures |
| My fuzz (seed 31337) | 20 × 60 = 1,200 ops (963 accepted): 0 failures |
| Tooling | lint rc 0 (1 warning that was already there), tsc rc 0, `check:skills` rc 0 (`drift:[]`, `problems:[]`), `node --check` OK |
| Copies | `cmp`: the 7 script copies and 7 conventions copies are equal |
| Shared block | The Script-helper paragraph has the same md5 in all 7 SKILL.md |

### BLOCKING

None.

### Advisories (new or escalated)

- **A14.** The replay fold is looser than the live check for hand-written prose lines (see above). This is reachable only through the prose fallback, where no script runs at write time.
  - Fix in `foldProduct`:
    - Set `keepAi` when `pp.source` is not a valid source value, not only when it is `undefined`.
    - Do not default the source to `user`.
    - When the entry is `ai_recommended`, keep `{status:"decided", source:"user"}` with no types as `pending`.
- **A7 (escalated).** `liveGuard` returns early on `restored: true`, and `journal append` accepts that flag from anyone.
  - Live, `{restored:true, product:{status:"decided", source:"user"}}` on a pending recommendation is accepted as `decided`/`user`/`confirmed:true` (the AI's types relabelled as the user's choice). The other restored forms stay `pending`.
  - This is the one remaining live way to get past P6. It needs the internal restore marker set on purpose.
  - Fix: accept `restored` only from `journal restore-from-state`, reserved the same way as `schema_migrated`.
- Still open from earlier rounds: A5, A8 to A13 (A9 to A13 are in round 1).
