# 02 verify: lvr.mjs core (independent QA)

Verifier: Opus, 2026-11-19. I did not write this code, and I formed my verdict before reading `02-impl.md`. Nothing was committed. I never wrote into the fixture: `git status --short .scratch/lvp-core/dogfood/run` is empty. All runs used copies in `$S=/tmp/claude-1000/-home-ibrahim-projects-lazy-vibers-planner/1998a29c-b6f4-4bb3-af53-d8d962405873/scratchpad/v`.

The harnesses are in `$S/harness/`:
- `conc.mjs`: N parallel writers;
- `fuzz.mjs` / `fuzz2.mjs`: random CLI operations, then `replay --compare`;
- `kill.mjs`: SIGKILL mid-write;
- `inj.mjs`: injection payload.

`$S/t5.sh` is the §7 T5 script.

## Verdict: FAIL (fix round needed). The core is solid; 4 required fixes

The reducer, journal reader, lock, atomic write, gate, slug, probe and booster pieces work. 3 fuzz runs (200 ops each, booster events carrying license/tier) replay **exactly** to the live state. 50 concurrent writers produced no lost or duplicate seq.

Three things fail:
- the documented skill payloads collide with the new `project` extension;
- 3 derivation paths break C1(b), "a CLI-written journal replays EXACTLY to live";
- the crash-heal silently rewrites live data on prose-written journals.

## A. Ticket boxes

| Box | Result | Evidence |
|---|---|---|
| journal append (seq, ISO ts, type validation) | PASS | T5: seq 1..24, ISO ts. `--type foo` gives exit 1, `UNKNOWN_EVENT_TYPE` with `details.allowed` (49 = conventions:95; `check:skills` re-derives it), the stderr line, and an unchanged journal (T10). |
| state write \| validate (schema, atomic tmp+rename) | PASS | T4: the futsal warnings exactly match §2.3. `state write` with an invalid document gives `STATE_INVALID` and writes nothing. No `.tmp-` files are left (T17). An orphan tmp older than 60 s is cleaned; a fresh one is kept. `--type` journals first. |
| answer record / decision record = one checkpoint | PASS | T5/T11: one line + one state write. Auto ids S4.q1 and D-001/D-002 are assigned. `ID_SECTION_MISMATCH`, `ANSWER_EXISTS` and `DECISION_EXISTS` hold, and amend is refused after S9 is done. |
| replay | PASS on futsal; **FAIL on C1(b)** (see C, R3) | T2: `diff: []` after the ignore list, all asserted values hold, and the full diff is exactly 46. |
| gate 1–5 JSON | PASS | T12: all 7 dirs give the expected verdict, and no dir was modified. |
| slug (S0 rules) | PASS | T13 (adversarial cases in C) |
| probe grade | PASS | T14: all cases. The prompts are byte-identical to the init and continue SKILL.md. |
| booster check | PASS | T15: `REGISTRY_MISSING`, exit 1, `searched` non-empty; `REGISTRY_INVALID` on a bad registry. With the §2.10 sample: pm-skills found globally, firecrawl present through the `.mcp.json` env key, `secret` never printed. `--journal` added one line, and compare gave `[]`. |
| JSON stdout, non-zero exit, message | PASS | Usage errors exit 2 (array or bad JSON payload, unknown flag, unknown command, missing flag). Domain errors exit 1 (`NO_LVR`, etc.). The stderr line is `lvr: CODE: msg`. |

## B. §7 test plan (re-run by me)

| T | Result | Note |
|---|---|---|
| T0 | PASS | `node --check` OK; only `node:` imports; no forbidden or new API. No `child_process`, `fetch` or `http` in lvr.mjs. |
| T1 | PASS | sha256 `7732ca83…` = `sha256sum` |
| T2 | PASS | `diff []`; current_section S10; declared_at 08:02:40Z; S9 record "Blueprint Bundle (20 files)"; text_missing = S0.q1(q), S0.q2, S0.q3, S4.q14; 50 answers / 1 skipped; 21 decisions with D-005/D-006 rationale equal to live; features `[[F-01],[F-03],[F-02],[F-04]]`; 9 boosters, all installed; scope 81; untranslatable []; errors []. |
| T3 | PASS | sha `95d66cc0…` twice |
| T4 | PASS | exact warning list |
| T5 | PASS | `diff: []`, no ignore list; validate gives only W_CURRENT_SECTION |
| T6 | PASS | `healed:[25]`, then compare `[]` |
| T7 | PASS | `truncated_tail:true`; the append writes `\n` first; replay `corrupt_lines:[25]`, exit 0 |
| T8 | PASS | `duplicate_seqs:[2]`, `seq_gaps:[[2,5]]`; first-wins (S0 kept); sha stable |
| T9 | PASS | CRLF+BOM on the journal, state, records and root md: sha equals T2 |
| T10 | PASS | |
| T11 | PASS | `--skipped --a text` stores `a:null` |
| T12 | PASS | |
| T13 | PASS | `warung-cashier-2` is created |
| T14 | PASS | |
| T15 | PASS | |
| T16 | PASS | fresh lock gives `LOCKED` after 5.1 s; a 2-minute-old lock is cleared and released |
| T17 | PASS | |
| T18 | PASS | `REPLAY_WOULD_OVERWRITE_VALID`; backup `.lvr/state.corrupt-2026-11-19.json`, then `resume` seq 111; a 2nd corruption the same day gives `backup_skipped` and the backup content is preserved |
| T19 | PASS | drift is detected (rc 1, names lvr-build), sync restores it, check rc 0 |
| T20 | PASS | lint rc 0 (1 warning in an untouched research file); `tsc --noEmit` rc 0 |
| T21 | PASS on Node 22 (new ruling) | official tarballs in scratch: **v22.0.0 and v22.23.5** both run T1, T2 (same sha), T5 (`diff []`, 27/27 rc 0), T9, probe, slug, 10 concurrent writers and a 120-op fuzz, all identical to Node 24 |
| T22 | PASS | only allowed paths; `git diff -U0 skills/*/SKILL.md \| grep '^-[^-]'` is empty |

## C. Adversarial cases

| # | Case | Result |
|---|---|---|
| C1 | Garbage line mid-file, plus a line with string seq | PASS: `corrupt_lines [6,10]`, replay `diff []`, next append seq 25 |
| C2 | Truncated last line / valid last line without `\n` | PASS: skipped and kept respectively; append repairs the newline |
| C3 | Seq gaps, duplicate seq, out-of-order lines and ts | PASS: sorted by seq; max+1 used |
| C4 | CRLF + BOM | PASS (T9) |
| C5 | Empty journal | PASS: replay `REPLAY_EMPTY`; check healthy, 0 events; append seq 1 |
| C6 | Missing `.lvr` / missing dir | PASS: `NO_LVR` exit 1 on 5 commands; `DIR_NOT_FOUND` |
| C7 | state.json missing or corrupt, then `replay --write` heals | PASS: append reports `STATE_MISSING` / `STATE_INVALID` (journal only); `replay --write` restores; compare `[]`; backup made for the corrupt file |
| C8 | Crash between journal and state (hand-edit, one ahead) | PASS (T6) |
| C9 | Journal **two** ahead (a prose writer added 2 events) | **FAIL (R4)**: append reports `healed:[26]` and writes a state that has S2.q2 but lacks S2.q1. Silent and inconsistent. |
| C10 | Prose-written journal ending at `section_done S9` (futsal truncated to seq 108), then any CLI append | **FAIL (R4)**: `healed:[108]` is reported, but nothing had crashed. The append rewrites live `S9/record` (long text cut to the payload's "Blueprint Bundle (20 files)") and `current_section` S9→S10. |
| C11 | 10 and 40 parallel `answer record` | PASS: all ok; ids and seqs unique and contiguous; journal healthy; compare `[]` |
| C12 | Stale lock (5 min old) + 20 parallel writers, ×5 | PASS: no duplicate seq. The unlink/create TOCTOU stays theoretical (A2). |
| C13 | SIGKILL mid-write ×40 | No corruption; compare `[]` every time. **8/40 left a fresh `.lock`**, which blocks the next command with `LOCKED` until it is 30 s old (A2). |
| C14 | `--dir` with spaces + unicode (`my proj ünï 日本`), trailing slash, backslash name on Linux, `C:\Users\x` | PASS (the backslash path gives `DIR_NOT_FOUND`, handled) |
| C15 | `--out /etc/...` | PASS: `PATH_OUTSIDE_DIR`. `--out ../../x.json` resolving under `os.tmpdir()` is allowed (per design). |
| C16 | Slugs: emoji, all symbols, 300 words, diacritics, ligatures, `İstanbul` | PASS: `rocket-app`; `EMPTY`; `TRUNCATED` to 4 words; `unicode-name-ex`; `file-flow`; `istanbul-kebab`. Collisions with a mixed-case existing dir: `rocket-app-4`. |
| C17 | `slug free --slug 'a(b'`, `gate check --idea-slug 'x('` | **Bug (A1)**: `INTERNAL` "Invalid regular expression" (unescaped `new RegExp`). `slug free --slug ../../etc` is accepted without validation (read-only). `gate subfolder --slug ../escape-me` is refused. |
| C18 | Injection: `\n`, `\r\n`, `"}` plus a fake event line, NUL, ESC, U+2028/2029, emoji, lone surrogate, BOM mid-string, backticks, `$()` | PASS: one valid NDJSON line each; state q/a are byte-equal to the input; journal healthy; compare `[]` |
| C19 | 8 MB answer via stdin | PASS: 237 ms; compare `[]`; `journal tail` truncates to 432 B. A 100 KB inline `--a` also works. |
| C20 | Unknown event type | PASS (T10) |
| C21 | 200-op fuzz, init `booster_check` with license/tier, seeds 11/23/99 (99 allows T1 tier changes) | PASS: `diff []`, valid, healthy, 0 INTERNAL |
| C22 | 200-op fuzz, init `booster_check` **without** license/tier (the documented REGISTRY_MISSING fallback, i.e. today's only path), seed 7 | **FAIL (R3a)**: 27 diffs in `/boosters/core/*` (order, license and status of the V0 "never mentioned" entries) |
| C23 | T1, materialize, then `tier_changed` → T2 | **FAIL (R3b)**: `/model_profile/probe` is rebuilt as null; live has "skipped" |
| C24 | T2 (no probe), materialize, then `tier_changed` → T1 | **FAIL (R3b)**: rebuilt "skipped", live null |
| C25 | CLI project, no event sets `name`, then `OVERVIEW.md` appears | **FAIL (R3c)**: rebuilt name "Shiny", live "" |
| C26 | Manual `booster_check`, then `CAPABILITIES.md` + a later `booster_install_ok` | **FAIL (R3a)**: order and license differ |
| C27 | **Documented** Script line `journal append --type handoff_started --payload '{"project":"<slug>"}'` (handoff SKILL:42), and `recheck_started` (recheck SKILL:45) | **FAIL (R2)**: `INVALID_PAYLOAD` "project … expected an object". The fixture's own seq 109 uses this string form, and the spec prose says "payload: project slug". |
| C28 | `section_start S0` before `tier_declared` | Sticky (A3): materialize fails (`STATE_INVALID`, tier null). Every later append, `answer record` included, returns `ok:true, written:false, reason:"STATE_MISSING"`, and state.json is never created until `replay --write`. |
| C29 | `state write --type` (rename) | Writes as designed, but replay then differs on `/project/name`. Expected for the escape hatch (A4). |
| C30 | `--no-state` event, then the next append | Heals it (`healed:[25]`) |
| C31 | Decision without a section on a carrier that has none | `INVALID_PAYLOAD decisions[0].section`, OK |

## D. Node compatibility (ruling: floor is now ≥22)

- **API grep: PASS.** No API newer than Node 22.0 is used. Everything used exists by Node 16: `??=`, regex lookbehind, `\p{M}/u`, `Atomics.wait`, `for await` on stdin. No `import.meta.dirname`, `parseArgs`, `globSync`, `groupBy`, `fromAsync`, `withResolvers`, `getBuiltinModule`, `node:sqlite`, import attributes or the `v` flag.
- **Real runs: PASS** on v22.0.0 and v22.23.5 (T21 row).
- **Still says 18 (REQUIRED, R1):**
  - `scripts/lvr.mjs:2` (header);
  - `:1787` (usage text);
  - `:1806` (`< 18` check and the "Node.js 18 or newer" message);
  - the "Script helper" item in all 7 SKILL.md files (`init-new-idea:17`, `continue:17`, `handoff:17`, `build:20`, `add-feature:20`, `recheck-plan:20`, `personal-brand:20`).

  The ticket line is already updated to ≥22. Re-sync the copies afterwards.

## E. Sync and hygiene

PASS:
- `npm run check:skills` rc 0 (`unchanged: 21`);
- `cmp` of all 7 `scripts/lvr.mjs` and all 14 `references/` mirrors: identical;
- SKILL.md diffs are additive only (0 removed lines; the prose stays as the fallback);
- lint rc 0 and `tsc --noEmit` rc 0;
- zero dependencies (only `node:` imports). `sync-skills.mjs` spawns `process.execPath`, which is allowed for a maintainer tool.

## Implementer deviations D1–D6

- **D1: inaccurate, and it does not achieve its goal.** The report says the V0-missing derivation applies "only when the journal carries no `booster_check` events at all". The code applies it when booster_check events exist but none carry `license`/`tier`. That is exactly the manual REGISTRY_MISSING path, so C22 and C26 fail. Folded into R3a.
- **D2–D4, D6:** justified and harmless.
- **D5:** this is design §4 itself, not a deviation.
- Not listed but present:
  - the file is 1836 lines vs the ~1200 target (A6);
  - `main()` has no `.catch`. It is harmless, because main catches internally.
- The report's T21 note is now superseded: Node 22 was run here.

## REQUIRED fixes (blocking)

1. **R1: Node floor ≥22.** Change the 3 places in `scripts/lvr.mjs` (header, usage text, `NODE_TOO_OLD` threshold and message) and the 7 SKILL.md "Script helper" lines to `>=22` / `≥22`, then `npm run sync:skills`.
2. **R2: `project` payload collision.** `validatePayload` must accept a **string** `project` as the legacy/prose meaning (the project slug), not reject it. The reducer already ignores non-objects. Update the spec 01 / conventions extension sentence to say "`project` as an object". Acceptance: C27 Script lines succeed; futsal replay is unchanged.
3. **R3: Exact replay for CLI-written journals (C1(b)).** Any derivation applied only by replay, or only at materialize time, must happen identically in live checkpoints:
   - (a) **V0 never-mentioned boosters.** Apply this at the S0 materialize point as a fold-time step (or only for genuinely legacy journals), not as a post-fold append. Live and replay must produce the same order and license source; live checkpoints have no disk context, so CAPABILITIES.md must not change a CLI journal's licenses.
   - (b) **T1 probe "skipped".** Make it a reducer rule on `tier_declared`/`tier_changed` when no probe event has been seen, and drop the post-fold version.
   - (c) **Disk-derived `project` fields (OVERVIEW.md name, S0 record) and decisions/milestones from disk.** Use these only when the journal is legacy. Detect legacy, for example, by any `answer_recorded` without `q`, or by the absence of extension payloads.

   Acceptance: C22 (fuzz seed 7), C23, C24, C25 and C26 give `diff []`. T2 is unchanged (46 paths), and T5 stays `[]`.
4. **R4: Heal must not fire on non-CLI lag.** Today the last event is re-applied whenever that changes state. On prose-written journals this is reported as a crash heal and overwrites live data (C10). With a lag of 2 or more, it writes a half-updated state (C9). Heal only when there is evidence the state lags by exactly one CLI event. Options:
   - a sidecar `.lvr/state.seq` written right after the state rename, healing only if it equals `max_seq-1`;
   - or treating only lines in the CLI's own compact `{"ts":…,"seq":…,"type":…,"payload":…}` form as healable.

   Otherwise write nothing extra, and return `state.reason:"STATE_LAGS"` plus a journal warning that points to `replay --compare`. Acceptance: C10 leaves the futsal state byte-identical except for the new event's own effect; C9 reports the lag instead of `healed`; T6 still heals.

## Advisories (non-blocking)

- **A1.** Escape the slug in `freeSlug`'s `new RegExp`. Validate `--slug` in `slug free` and `--idea-slug` in `gate check`, and return `INVALID_PAYLOAD` instead of `INTERNAL` (C17).
- **A2.** A lock left by a killed process blocks for up to 30 s (C13). Read the holder's pid and treat the lock as stale at once if `process.kill(pid, 0)` throws ESRCH on the same host. For the stale unlink, rename the lock to a unique name and then unlink it, to close the double-unlink TOCTOU.
- **A3.** The S0 materialize failure is sticky (C28). Retry materialize on every append while state is absent and the journal holds `section_start S0`. Tell the SKILL text to react to `state.written:false` together with `reason`.
- **A4.** In continue 2a, document that `state write --type` breaks replay exactness (escape hatch only).
- **A5.** A missing explicit `--registry` silently falls through to the other candidates. Return `FILE_NOT_FOUND`, or at least report which path was used.
- **A6.** 1836 lines vs the ~1200 target. Acceptable, but keep the index comment accurate: it lists 12 sections, and §9 "slug" is merged into §8.
- **A7.** `booster check --journal` maps registry tier `conditional`/`reference` to state tier `enhancer`. This is undocumented; add a line in spec 01's extensions.
- **A8.** Windows rename retry, CRLF checkout and the lock fd close order are code-reviewed only; they go to ticket 19 CI.

---

## Re-verify after fix round 1

Verifier: Opus, 2026-11-19. I re-ran on Node 24.18.1. The orchestrator already has the Node 22.0.0 evidence, and I found no reason to doubt it. Same rules as before: no commit, no build/dev/start, fixture untouched (`git status --short` on the fixture is empty), copies under the scratchpad `v/`.

### Verdict: FAIL, narrower

R1–R4 as specified are fixed. The new sidecar and CLI-journal design has 3 blocking gaps:
- recovery from a mixed journal loses data;
- STATE_LAGS can mask itself;
- the SKILL text never says what to do on STATE_LAGS.

### Original failures (re-run)

| Repro | Result |
|---|---|
| R1 Node floor | PASS: header, usage text and `< 22` / "Node.js 22 or newer" in lvr.mjs; all 7 SKILL.md say `Node ≥22`; copies synced. (`package.json` gained `engines`, see advisory B4.) |
| C27 string `project` (handoff_started, recheck_started) | PASS: ok. An object with an unknown key, or a number, still gives `INVALID_PAYLOAD`. |
| C22 fuzz seed 7 (manual booster path), plus seed 31 with T1 tier changes | PASS: `diff []`, valid, healthy; `.state-seq` = 204 = max |
| C23 / C24 T1↔T2 probe | PASS `[]` |
| C25 OVERVIEW.md name | PASS `[]` |
| C26 CAPABILITIES.md + later booster event | PASS `[]`. The V0 fill no longer runs for CLI journals; the init loop journals every booster itself. |
| C9 journal two ahead | PASS: `STATE_LAGS`, state byte-identical; `replay --write --force` sets sidecar 28 and compare gives `[]` |
| C10 futsal at seq 108 + append | PASS: no heal, state byte-identical, no sidecar created |

### New adversarial cases (sidecar and CLI mark)

| # | Case | Result |
|---|---|---|
| N1 | Prose futsal journal with a forged `"cli":"lvr"` on seq 1 | No crash, but replay goes to CLI mode: 45 diffs, **0 of 21 decisions**, 4 text-missing answers. Adversarial and unlikely (advisory B2). |
| N2 | **CLI journal, then the prose fallback (Node unavailable mid-session) writes section_start/answer/section_done S2 plus D-003 and S2.record into state.json and a Section Record, then Node returns** | **FAIL (RR1).** The next append gives `STATE_LAGS`, which is correct. The hint's recovery, `replay --write --force`, rebuilds in CLI mode with no disk reads, so **D-003 and `S2.record` are lost**. Decisions D-001 and D-002 remain, and D-003 is in the S2 record's `## Decisions this Section`, which prose mode would have recovered. |
| N3 | CLI journal, sidecar deleted, crash leaves the journal one ahead | Silent: no heal, no `reason`, no warning; compare shows `/pipeline/sections/S2` missing; the sidecar is never re-created until `replay --write` (advisory B1) |
| N4 | Sidecar corrupt (`abc`, empty) | Same as N3. ` 24 ` and `024` parse fine; a huge value gives STATE_LAGS. |
| N5b/c | **Sidecar ahead of the journal** (1 or 2 journal lines lost, e.g. a backup restore or sync conflict), then normal `answer record`s | **FAIL (RR2).** The first k appends return `ok:true` + `STATE_LAGS`. Then max_seq catches up with the stale sidecar and the next append is treated as in sync: `answer record S2.q2` writes a state **without the already-acknowledged S2.q1** (still carrying the lost line's `handoff`). Compare shows `/pipeline/sections/S2/answers/S2.q1` and `/handoff`. The lag masks itself. |
| N6 | state.json restored from an older copy, sidecar = max | Undetectable by design. The append applies on top; compare shows the gap. Acceptable. |
| N7 | Crash between the state rename and the sidecar write (state at N, sidecar N-1) | PASS: re-applying N is a no-op, `healed:[]`, compare `[]`, sidecar advances |
| N8 | 30 concurrent `answer record` | PASS: unique and contiguous seqs, compare `[]`, sidecar 54 = max |
| N9 | 30× SIGKILL mid-write | PASS: 2 real heals, 0 diffs, sidecar = max (57). 8 fresh locks were left behind (A2 still open). |
| N10 | `--no-state` twice, then an append | `STATE_LAGS` (by design) |
| N11 | 3 no-op events (`doc_generated`) in a row | PASS: the sidecar advances without a state write, so there is no false lag |
| N12 | Corrupt state, `replay --write --journal-resume` | PASS: sidecar = 25 (the resume included), next append in sync |
| N13 | `state write --type` / `--no-journal` | PASS: sidecar set to the event seq / left unchanged |
| N14 | Invalid state, append (`STATE_INVALID`), `replay --write` | PASS: written without `--force`, compare `[]`, sidecar = max |
| SKILL guidance | Does SKILL.md tell the agent what to do on STATE_LAGS? | **FAIL (RR3).** No SKILL.md mentions `STATE_LAGS` or `state.reason`; only spec 01 and the JSON `hint` do. Commands under lag return `ok:true` (`answer record` included), and the shared Script-helper block only says to stop on `"ok":false`, so an agent keeps interviewing while state.json silently stops advancing. |

### Regression A, B, E

All PASS:
- T0: no non-`node:` import, no new API, no spawn or network;
- T1: sha equals `sha256sum`;
- T2: `diff []`, 46 full-diff paths, sha `95d66cc02dd2`, `journal_kind: prose`;
- T4: valid, 12 warnings;
- T5: `diff []`;
- T6: `healed:[25]`, compare `[]`;
- T7: seq 25, `corrupt_lines [25]`;
- T8: `[2]`, `[[2,5]]`;
- T9: CRLF+BOM sha equals T2;
- T10/T11: error codes;
- T12: all 7 verdicts;
- T13/T14;
- T15: `REGISTRY_MISSING`; `--journal` compare `[]`;
- T16: stale lock cleared;
- T18: overwrite refused; backup + resume seq 111 + sidecar;
- T19: `check:skills` rc 0; all 7 scripts and 14 references identical;
- T20: lint 0, `tsc` 0;
- T22: 0 removed SKILL.md lines.

### REQUIRED fixes (round 2)

1. **RR1: mixed journals must recover without data loss (N2).** Once events were written outside the CLI, the journal is no longer CLI-pure. That is exactly the STATE_LAGS case, and the no-sidecar case for a stamped journal. Persist the fact, for example by having the STATE_LAGS or recovery path add `"prose_gap":[from,to]` to the payload of the `resume` it journals (no new event type). Replay must then re-enable the disk fallbacks for that journal. As an alternative, or in addition: when `replay --compare` shows the valid current state is ahead of the rebuild, the recovery is to adopt the state (sidecar := max_seq, journaled through `resume`) rather than `--force` rebuild it. Update the STATE_LAGS `hint` to match. Acceptance: after N2's recovery, state still holds D-003 and `S2.record`; a CLI-pure journal still replays exactly (fuzz seeds 7/11/23/31 give `[]`).
2. **RR2: STATE_LAGS must be sticky (N5b/N5c).** Once a lag is detected, later appends must keep reporting it until `replay --write` (or the RR1 adopt) resets tracking. For example, write the sidecar as a non-matching marker such as `lag:<old>` and have `readStateSeq` treat it as lagging. Acceptance: N5b's second `answer record` also reports `STATE_LAGS` and state.json stays unchanged until recovery.
3. **RR3: SKILL guidance.** Extend the shared Script-helper block in all 7 SKILL.md files (wording identical, additive only): if a write returns `"state":{"written":false,"reason":"STATE_LAGS"|"STATE_MISSING"|"STATE_INVALID"}`, stop the step and run the continue recovery. Point continue Step 1/2 at the recovery from RR1: `replay --compare` first; `replay --write --force` only for a CLI-pure journal or a damaged state. Re-sync.

### Advisories (new)

- **B1.** A CLI-stamped journal with a missing or corrupt `.state-seq` (N3/N4) silently stops healing and never re-establishes tracking. Return `reason:"STATE_SEQ_UNKNOWN"`, or a `journal_warnings` entry, for stamped journals.
- **B2.** The forged or mistaken stamp (N1) drops all disk-derived data. Consider a consistency check, e.g. a stamped journal containing text-less `answer_recorded` falls back to prose mode.
- **B3.** For prose journals adopted via `replay --write --force`, later CLI booster events can reorder `boosters.core` against a re-replay, because the V0 fill runs post-fold for prose journals. This is not covered by C1(b) and is noted only.
- **B4.** `package.json` `"engines": {"node": ">=22"}` sits on the Next app package. AGENTS.md says the app needs Node 24+ (`node:sqlite`), and the design limited the edit to the `scripts` block. Drop it or align it.
- Earlier advisories still open: A1 (regex slug → `INTERNAL`), A2 (dead-pid locks block for 30 s), A3, A4, A5, A6, A8. A7 is done.

---

## Re-verify after fix round 2

Verifier: Opus (independent), 2026-11-20, Node v24.18.1 (linux). No commit, no source edits, no build. The fixture was copied into the scratchpad `v2/` (`git status --short .scratch/lvp-core/` empty before and after). The harnesses are in the scratchpad `v2/`:
- `t5.sh`: T5;
- `base.sh`: CLI project through S1;
- `prose.mjs`: prose-fallback simulation;
- `fuzz.mjs`: CLI-pure fuzz, 200 ops, with disk noise injected mid-run;
- `kill.mjs`: SIGKILL loop with hint-driven recovery.

### Verdict: FAIL (1 blocking item, narrow, small fix)

RR1, RR2, RR3 (as written), B1, B2 and B4 pass, as does the whole regression subset. One blocking defect remains in the new recovery mechanism. **Following the emitted hints on the B1 path (CLI journal, `.state-seq` missing) can end with `journal check` = `in_sync` while state.json silently lacks journaled events.** That is the RR2 masking class, reached through a wrong recovery hint.

### BLOCKING

**X1. `journal restore-from-state` falsely re-syncs a lagging state, and the LOSSY_REPLAY hint sends agents there.**

Repro (scratchpad `v2/b1`):
1. Run `base.sh`, then `section_start S2` and `answer record S2`, then `rm .lvr/.state-seq`.
2. `journal append section_done S2` gives `STATE_SEQ_UNKNOWN`, exit 3, `journaled_seq` 14. Correct.
3. As hinted, `replay --compare`, then `replay --write --force`. This gives `LOSSY_REPLAY` with paths `/pipeline/current_section` and `/pipeline/sections/S2/status`. **That is a false positive**: the journal is `journal_kind: cli`, so the rebuild is exact, and the "lost" values (`in_progress`, `S2`) are just stale. With no sync point, `lossyPaths` counts every difference.
4. The LOSSY hint says "Otherwise fix the journal first (for example `journal restore-from-state`)". Running it gives `ok`. It writes `.state-seq` := journal max (15) without applying events 14+ to state.json.
5. `journal check` now shows `in_sync`. state.json still has S2 `in_progress` with `record:null`. Later appends succeed on top of that stale state, and only `replay --compare` shows the gap (S2 status, record, completed_at).

The same masking happens in the lag case (scratchpad `v2/n2c`: prose events plus a stamped crash line, then `STATE_LAGS` sticky, then LOSSY, then restore). `lag:11` becomes 18, `in_sync`. Neither the S3 section nor the journaled S3.q1 answer is in state, and the next `answer record` writes S3.q2 without S3.q1.

`lvr-continue` Step 2 only routes JOURNAL_BEHIND_STATE to restore. But it gives no path when the user declines `--accept-loss`, and the shared Script-helper says "follow `error.details.hint`".

Fix, all three small:
- (a) `restore-from-state` refuses unless `.state-seq` > journal max (its stated purpose), or it never writes a plain `N` when the state was lagging or unknown.
- (b) Drop `restore-from-state` from the LOSSY_REPLAY hint (say: nothing was written; leave state.json as is and stop).
- (c) Recommended: `lossyPaths` treats a `journal_kind: cli` journal with no sync point as non-lossy (replay is exact by construction), so B1 recovery does not ask the user to "accept losing" stale values.

### Acceptance checks

| Check | Result | Evidence |
|---|---|---|
| RR1 N2 (CLI journal, then prose writes S2 + D-003 + S2.record + Section Record, then a CLI append) | PASS | `state.adopted:[12,13,14]`; state keeps D-001/2/3, `S2.record`, S2.q1; sidecar 15, `in_sync`; replay `mixed`. `replay --write --force` refuses LOSSY_REPLAY (1 path), state byte-identical. |
| RR1 N2b (same, plus a stamped crash line, which takes the STATE_LAGS route) | PASS for no silent loss | exit 3 `STATE_LAGS`, `lag:11`; `--force` gives LOSSY_REPLAY (`S2/record`), nothing written. With `--accept-loss` (consent): D-003 recovered from the S2 record, S3.q1 kept; only `S2.record` dropped, as listed. |
| RR1 CLI-pure exactness, fuzz seeds 7/11/23/31 (200 ops, noise OVERVIEW/DECISIONS/S1 record written mid-run) | PASS | all `diff []`, `journal_kind: cli`, valid, healthy, `in_sync`, 0 unexpected failures |
| RR2 sticky (2 stamped lines ahead, then 4 `answer record`s) | PASS | each exit 3 `STATE_LAGS` (`sticky:true` from the 2nd), journaled_seq 14..17; `.state-seq` stays `lag:11`; state.json sha identical throughout. `replay --write --force` (CLI-pure, not lossy) gives sidecar 17, compare `[]`, all 7 answers present; next write in sync. |
| RR2 N5 (sidecar ahead, 2 lines lost) | PASS | `journal append`, `answer record`, `decision record`, `replay --write --force --accept-loss` and `state write` all give `JOURNAL_BEHIND_STATE` exit 3 with `journaled_seq:null`; journal and state unchanged; `journal check` `journal_behind_state`, `healthy:false`. `restore-from-state` restores S2.q1/S2.q2; a 2nd run restores nothing; `in_sync`; compare `[]`; next write in sync. |
| RR3 Script-helper block | PASS | The item text is sha-identical in all 7 SKILL.md (`15da497b…`); `git diff -U0 skills/*/SKILL.md \| grep '^-[^-]'` returns 0 lines |
| RR3 continue mapping vs CLI | PASS with X1 caveat | Codes STATE_MISSING/INVALID/LAGS/SEQ_UNKNOWN, JOURNAL_BEHIND_STATE and LOSSY_REPLAY, and the `state_sync` values, all match the CLI. `--accept-loss` only with consent. But the LOSSY hint recommends a command that falsely re-syncs (X1). |
| B1 | PASS (write path) | CLI-born journal with an absent, garbage, empty, `lag:abc`, `-1`, `lag:-3`, `1e3`, two-line or directory sidecar gives `STATE_SEQ_UNKNOWN` exit 3, state unchanged. See advisory C2 for `journal check`. |
| B2 | PASS | forged stamp on seq 1 of futsal: `mixed`, 46 diffs, 21 decisions; forged on all 110 lines: still `mixed`, 21 decisions (text-less answers are untrusted) |
| B4 | PASS | `engines.node: ">=24"` = AGENTS.md "Node 24+"; script floor stays 22 (`NODE_TOO_OLD`, `< 22`) |

### Regression subset

All PASS:
- **T0**: `--check` OK; imports only `node:fs/path/os/crypto/url`; no forbidden API, spawn or network.
- **T1**: sha `652d7824…` equals `sha256sum`.
- **T2**: `diff []`, 46 full-diff paths, sha `95d66cc02dd2`, `prose`, every asserted value equal (S10, declared_at, S9 record, text_missing S0.q1/q2/q3/S4.q14, 50/1, 21 decisions with D-005/D-006 rationale equal, milestones features, 9 installed, scope 81, untranslatable [], errors []).
- **T3**: same sha.
- **T4**: valid, 12 warnings.
- **T5**: `pass_empty`, materialized, compare `[]` with no ignore list, `cli`, only W_CURRENT_SECTION, `in_sync` 24/24.
- **T6** (stamped crash line): `healed:[25]`, compare `[]`.
- **T7**: `truncated_tail`, append seq 111, `corrupt_lines` [111], exit 0.
- **T8**: `[2]`, `[[2,5]]`, deterministic.
- **T9**: CRLF + BOM sha equals T2.
- **T10/T11**: codes, exit 1, stderr line, journal `cmp`-unchanged; skipped gives `a:null`.
- **T12**: all 7 verdicts; `find -newer` = 0.
- **T16**: LOCKED after 5 s; an aged lock is cleared.
- **T17**: no tmp files.
- **T18**: overwrite refused, backup, resume seq 111, sidecar 111; second backup skipped.
- **T19**: `check:skills` rc 0; drift test on a repo copy gives rc 1 naming `lvr-build`, then sync, then rc 0; `cmp` of 7 scripts and 7 conventions identical.
- **T20**: `npm run lint` rc 0 (0 errors; 1 warning in the unrelated `.scratch/.../J-signals-probe.mjs`); `npx tsc --noEmit` rc 0.
- **T22**: 0 removed SKILL lines.

### Adversarial (new mechanisms)

| Case | Result |
|---|---|
| Sidecar CRLF `11\r\n`, `0011`, ` 11 ` | in sync, write OK |
| Sidecar `lag:11\r\n` | STATE_LAGS |
| Sidecar huge (`99999999999999999999`, `lag:99999`) | JOURNAL_BEHIND_STATE; `restore-from-state` gives `in_sync`, compare `[]` |
| Sidecar is a directory | STATE_SEQ_UNKNOWN; the hinted `replay --write --force` gives `STATE_WRITE_FAILED` (EISDIR) exit 1, after state.json was already rewritten; `journal check` says `untracked` (advisory C4) |
| `restore-from-state`, futsal state with an empty or absent journal, run twice | 1st run: 82 events (50 answers, 21 decisions, 4 milestones, 9 boosters, tier, 4 project keys); 2nd run: nothing; `in_sync`. Rebuild equals live for decisions, milestones (id/goal/features), statuses, tier and boosters. Not re-journaled: milestone `verified`, `deployment`, `handoff`, `loop_backs`, `created_at`, timestamps, and S7.q1's skipped-with-text `a` (D9; state.json keeps them and LOSSY_REPLAY guards them). |
| LOSSY_REPLAY on the futsal copy, `--force --journal-resume` | exit 1, 37 paths; journal and state byte-identical, no new files. With `--accept-loss` it writes, resume 111, sidecar 111, compare `[]`. |
| Exit-3 envelope | top `ok,cmd,error,journaled_seq,seq,ts,type,state`; `error.details` has `journaled_seq,hint`; stderr `lvr: <CODE>: …`; `--help` documents exit 3; NO_STATE_YET and `--no-state` stay exit 0 |
| 30 parallel writers (answer, decision and doc_generated mixed) | all rc 0; seqs 1..42 contiguous, no duplicates; `in_sync` 42; compare `[]`; D-001..D-012 unique |
| SIGKILL loop (60 runs, kill window 72–102 ms, aged lock after each kill, a probe write after each run, recovery per hint) | 16 killed, 44 completed, 1 real heal; every acknowledged answer present; `in_sync`; compare `[]`; no leftover lock or tmp files. Without aging, 20–34 probes got LOCKED (A2). |
| CRLF-converted CLI project (journal, state, sidecar) | `in_sync`; write OK; compare `[]`, `cli` |
| N7 (sidecar one behind after a state write) | no-op heal, sidecar advances, compare `[]` |

### Deviations D7–D9

- **D7**, unstamped line = prose = adopt: acceptable as the ruling, but see C1.
- **D8**, exit 3 / `ok:false`: acceptable. It matches RR3, and spec 01 and `--help` are updated.
- **D9**, restore is best effort: acceptable for timestamps and booster order. The non-restored facts listed above should be documented, because a later `--accept-loss` drops them.

### Advisories (non-blocking)

- **C1.** Adopt trusts that prose applied the events. An unstamped answer line that prose journaled but never put in state.json (crash, or a forgetful agent) is adopted silently: `adopted:[25]`, S4.q2 missing from state, `in_sync`. Cheap fix: re-apply the adopted unstamped events on top (idempotent), or check that their answer and section ids exist.
- **C2.** `journal check` reports `untracked` for a CLI-born journal with an absent (or directory) sidecar, while writes return `STATE_SEQ_UNKNOWN`. Report `unknown` there, so continue Step 1 catches it before the first write.
- **C3.** On STATE_SEQ_UNKNOWN, the hint and the continue text say `--force`, and that hits the LOSSY false positive (X1c). Users get a consent prompt for stale values.
- **C4.** A directory `.state-seq` makes every recovery fail after state.json was already rewritten. Pathological.
- **C5.** `booster check --journal` returns REGISTRY_MISSING before the JOURNAL_BEHIND_STATE guard. Harmless, because nothing is written.
- Still open: A1, A2 (dead-pid locks block for 30 s, seen again in the kill loop), A3–A6, A8 (Windows rename, CRLF checkout and lock fd order are for ticket 19 CI); B3.

## Re-verify after fix round 3

Verifier: Opus (independent), 2026-11-20, Node v24.18.1 (linux). No commit, no source edits. All runs were on copies in the scratchpad `v3/` (`git status --short .scratch/lvp-core/` is empty before and after). Harnesses in `v3/`:
- `h.sh`: helpers;
- `x1.sh`: X1;
- `mk.sh`: 3 stamped crash lines;
- `lag.sh`: sticky;
- `atk.sh`: stale plus hand content;
- `n2c.sh`;
- `rs.sh`: restore matrix;
- `rep.sh`: Step 2a repair.

Two scratch variants of the script were used for comparison only:
- `noshort/lvr.mjs`: the CLI-pure shortcut removed, which is round-2 behaviour;
- `narrow/lvr.mjs`: the one-line fix proposed below.

### Verdict: FAIL (1 blocking item, one-line fix, already proven on a scratch copy)

X1 is closed in every hint-driven variant I built. The restore deviation holds up: no stale-plus-extra-content state ends `in_sync`. One blocking item remains, introduced by fix (c): the broadened `lossyPaths` shortcut.

### BLOCKING

**Y1. The CLI-pure shortcut in `lossyPaths` silently drops state.json content that the CLI itself wrote, on the STATE_LAGS hint chain. This is a regression from round 2.**

`lossyPaths` now returns `[]` for any all-stamped journal, even when `.state-seq` gives a sync point (`N` / `lag:N`). But the CLI has a documented way to put content into state.json that no event carries: `state write --no-journal`, which is `lvr-continue` Step 2a ("A repair is `LVR state write --no-journal --in -` … riding this run's `resume` append"). The skill states that this satisfies "every state mutation emits at least one event". The journal stays `cli`, so replay cannot reproduce that content.

Repro (`v3/rep.sh`):
1. Run `base.sh`.
2. Run `state write --no-journal` with S1.q7 folded in, then `journal append resume`. `journal check` shows `in_sync 12/12`.
3. Add 2 stamped crash lines.
4. Run `answer record`. It returns STATE_LAGS, `lag:12`.
5. Follow the hint: `replay --compare` shows `/pipeline/sections/S1/answers/S1.q7`. Then `replay --write --force` writes. **S1.q7 is gone with no LOSSY_REPLAY and no consent**, and `journal check` shows `in_sync 15/15`.

Both the STATE_LAGS hint ("It refuses with LOSSY_REPLAY if the rebuild would drop data present in state.json") and continue Step 2 ("…or the journal was written entirely by the script (`journal_kind` = `cli`), run `--force`") steer the agent there.

The same scenario on `noshort/` (round-2 logic) gives LOSSY_REPLAY `["/pipeline/sections/S1/answers/S1.q7"]` and leaves state untouched. So this is a regression. Practical severity is low (2a repairs are re-derivable: `current_section` from statuses, folded answers from Section Records on the next continue run), but it meets the "lossy hint chain without consent" and "regression" criteria.

Fix (verified on `narrow/`): apply the shortcut only when there is **no** sync point. Move it after `const sc = readSidecar(dir);` and add the condition `sc.k !== "num" && sc.k !== "lag" &&`. With a sync point, the existing hand-edit filter already tells staleness from edits.

`narrow/` results:
- X1 (`journal check` unknown, then `--force` without a prompt, compare `[]`, `in_sync 14`): PASS.
- Sticky lag (`[]`, `in_sync 17`, S2.q1 present): PASS.
- Y1: refused, state unchanged.
- A2 (below): hand D-099/S1.q7 now refused instead of dropped.
- N2c: unchanged.
- Fuzz seed 7: `[]`.

Residual after the fix (advisory): with no sync point (STATE_SEQ_UNKNOWN), a 2a repair is still dropped. That is unavoidable without a marker. Optionally, `state write --no-journal` could write `lag:<max>` so a sync point exists.

### Checks

| Check | Result | Evidence |
|---|---|---|
| X1 repro, following every hint literally (`v3/x1.sh`) | PASS | Sequence: rm sidecar; `journal check` `unknown`; append gives STATE_SEQ_UNKNOWN exit 3; restore gives RESTORE_NOT_NEEDED exit 1 (state untouched); `replay --compare` shows 4 stale paths; `replay --write --force` writes. Result: compare `[]`; S2 `done`/`S2-x.md`/S2.q1, current S3; `in_sync 14/14`; next write OK, `in_sync 15/15`, compare `[]`. |
| Sticky STATE_LAGS (3 stamped crash lines incl. S2.q1, then 3 sticky writes) (`lag.sh`) | PASS | `lag:11` sticky, `lagging 11/17`; restore gives RESTORE_NOT_NEEDED; `--force` writes. Compare `[]`, `in_sync 17/17`, journaled `S2.q1=journaled` is in state.json, all 3 S3 answers present; next write `in_sync 18`. |
| **Attack A1**: stale (S2 start/q1/done journaled, not in state) AND hand D-099 + S1.q7, `lag` sidecar, restore first | PASS | Restore appends 16/17 (`restored:true`) and **leaves `lag:11`** (`lagging 11/17`, not in_sync). Then `--force`: no false LOSSY (the hand edits are now journaled), compare `[]`, `in_sync 17`, state has S2 done + S2.q1 + D-099 + S1.q7. |
| Attack A3: same with the sidecar absent, restore first | PASS (no masking) | Restore appends, sidecar stays absent (`unknown`). `--force` gives LOSSY_REPLAY `["/pipeline/current_section"]`, a stale value (false positive, advisory E2). State untouched, still `unknown`. Never in_sync while stale. |
| Attack A2: same as A1, follow the STATE_LAGS hint directly | See Y1 | `--force` writes; D-099 and S1.q7 dropped silently, `in_sync`. A pure hand edit with no event is out of contract (spec 01: "every state mutation emits at least one event"), so on its own this is acceptable. But the same path drops in-contract 2a content (Y1). On `narrow/` A2 is refused (LOSSY `S1.q7`, `/decisions/2`). |
| N2c (prose S2 + D-003 + S2.record, stamped crash S3.q1), with and without restore | PASS | Without restore: `--force` gives LOSSY `S2/record`, state unchanged; with `--accept-loss`, D-003 is kept, S3.q1+q2 present, `in_sync 17`. With restore: it appends D-003 (seq 18), keeps `lag:11` (`lagging 11/18`), and the same LOSSY happens. Never in_sync while stale. |
| Restore idempotence and edge cases (`rs.sh`) | PASS | **In-sync project, restore ×2**: `nothing_to_restore:true`, bytes identical. **RESTORE_NOT_NEEDED (lag), ×2**: bytes identical; then `--force` gives `[]`, `in_sync`. **Empty journal + full state**: 16 events, `in_sync 16`, 2nd run no-op, byte-identical; compare differs only in timestamps (D9). **Absent journal**: same. **N5 (2 tail lines lost)**: JOURNAL_BEHIND_STATE exit 3; restore re-adds S2.q1/q2, `in_sync 14`, compare `[]`, 2nd run byte-identical, next write `in_sync 15`. **Behind + hand D-099**: restores S2.q1 + D-099, `in_sync`, compare `[]`. **Futsal (prose, untracked)**: restore appends 21 decisions, stays `untracked`; `--force` gives LOSSY (37 paths). |
| Can JOURNAL_BEHIND_STATE coexist with a stale state? | PASS (by construction) | `behind` needs sidecar > journal max. Every remaining event has seq ≤ the sync point, so it is already in state. The only exception is C1 (an adopted unstamped event that was never applied), which predates this round. |
| C2: `journal check` vs writes, CLI-born journal | PASS | Sidecar absent, directory, garbage, empty, `lag:abc` or `-1`: check reports `unknown` and the write reports `STATE_SEQ_UNKNOWN` in every case. Prose-born fixture without a sidecar: `untracked`. |
| Hints: no lossy action without consent, no stale in_sync | FAIL (Y1 only) | LOSSY_REPLAY now says "stop"; RESTORE_NOT_NEEDED points to replay; JOURNAL_BEHIND_STATE points to restore (correct); continue Step 2 has a decline→stop path and "never restore for lagging". The STATE_LAGS / STATE_SEQ_UNKNOWN promise "LOSSY_REPLAY lists anything it would drop" is false for CLI-pure journals with `state write --no-journal` content (Y1). |

### Regression subset

All PASS:
- **T0**: `--check` OK; 0 non-`node:` imports; 0 forbidden API, spawn or fetch.
- **T1**: `7c8c8bc0ec76` equals `sha256sum`.
- **T2/T3**: sha `95d66cc02dd2` twice; diff `[]` under the ignore list; S10, declared_at, S9 record, text_missing S0.q1/q2/q3/S4.q14, 50/1, 21 decisions, features, 9 boosters, 81, `[]`, `[]`.
- **T4**: valid, 12 warnings.
- **T5**: `pass_empty`, materialized, compare `[]`, `cli`, only W_CURRENT_SECTION, `in_sync 24/24`.
- **T6**: `healed:[25]`, `[]`.
- **T7**: `truncated_tail`, seq 111, `corrupt_lines:[111]`, rc 0.
- **T8**: `[2]`, `[[2,5]]`, deterministic.
- **T9**: CRLF+BOM gives `95d66cc02dd2`.
- **T12**: the 7 verdicts as specified; `find -newer` = 0.
- **T16**: LOCKED after 5 s; an aged lock succeeds and is removed.
- **T17**: 0 tmp files.
- **T18**: refuse, backup, resume seq 111, sidecar 111, second backup skipped.
- **T19**: `check:skills` rc 0; drift on a repo copy gives rc 1 naming `lvr-build`, then sync, then rc 0.
- **T20**: `npm run lint` rc 0 (1 unrelated warning in `J-signals-probe.mjs`); `npx tsc --noEmit` rc 0.
- **T22**: `git diff -U0 skills/*/SKILL.md | grep '^-[^-]'` = 0. The only deletions are in the issue file, spec 03 (1 line) and `package.json`, as before.
- **Fuzz seeds 7/11/23/31** (200 ops): all diff `[]`, `cli`, valid, healthy, `in_sync`, 0 fails.
- **30 parallel writers**: seqs 1..41 contiguous, 12 unique decisions, `in_sync 41`, compare `[]`.
- **N2 prose**: `adopted:[12,13,14]`; D-001..3, S2.record and S2.q1 kept; `in_sync 15`; `--force` gives LOSSY `S2/record` with state byte-identical.
- **N5**: see the restore row above.
- `cmp`: scripts/lvr.mjs equals all 7 copies, and lvr-conventions.md equals all 7 references.

### Advisories (non-blocking)

- **E1.** After Y1's fix, STATE_SEQ_UNKNOWN combined with a prior `state write --no-journal` repair still drops that repair silently. Consider having `state write --no-journal` write `lag:<journal max>` (a known sync point), or doc-noting it in the STATE_SEQ_UNKNOWN hint.
- **E2.** Running restore on a lagging/unknown state with extra content (A3) makes the journal non-pure, so a later `--force` with no sync point raises LOSSY on stale values like `current_section`. No hint leads there (restore is refused unless content is missing), and consent unblocks it. Cosmetic.
- C1, C3–C5, A1–A6, A8 and B3 remain as previously listed (C3 is resolved for the X1 path: no prompt with no sync point).
