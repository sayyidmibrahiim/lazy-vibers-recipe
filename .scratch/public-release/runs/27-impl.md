# Ticket 27: implementation report (phase 2)

Implements `27-design.md` (schema v2, nine new events, migration v1 -> v2) plus the three owner answers of 2026-11-21. Nothing is committed.

## What was built

`scripts/lvr.mjs` (copied to the 7 skills by `npm run sync:skills`):
- `LVR_SCHEMA` 2; `EVENT_TYPES` = the 60 types in the conventions order (the `check:skills` event-list mismatch is gone).
- `validateState` dispatches on the version (v1 files validate with warning `W_SCHEMA_V1`); `validateV2`, `canonicalState` v2, `freshState` v2.
- All nine new events (`session_end`, `booster_installed`, `booster_uninstalled`, `agent_delegated`, `framework_selected`, `review_started`, `review_done`, `release_checked`, `schema_migrated`) with payload validation and replay rules; `schema_migrated` is `EVENT_RESERVED` for `journal append`.
- Payload extensions `product` and `coverage`; `project.error` stash and `sessions[].recovered_error`; attribution of sections, agents and boosters to the current session.
- Live guard (`liveGuard`) for payloads whose target must exist (`session_end`, `booster_uninstalled`, `agent_delegated` done/failed, `review_done`, a library `framework_selected` before the stack). Runs on the healed state before the event is applied; a refusal writes nothing.
- `journal append --type agent_delegated`: the script assigns `AG-NNN` under the lock.
- Guards: `MIGRATION_NEEDED` on every write to a v1 or `.lvp`-only project (exempt: `replay`, `journal restore-from-state`, `state migrate`); `SCHEMA_TOO_NEW` (exit 1) for every project-reading command (`main()` calls `guardNewer`; `slug`, `probe`, `version`, `meta` do not read a project).
- `state migrate [--check] [--remove-legacy]`: grafts v2 fields (taken from `replay(J + schema_migrated)`) onto the v1 state verbatim; backup in `.lvr/migrations/v1-to-v2-<stamp>/` (staged then renamed, `manifest.json` last, reused when complete); `.lvp/` is copied through a staging folder, never renamed; `--remove-legacy` deletes `.lvp/` only when everything in it is unchanged in `.lvr/` (else `LEGACY_DIFFERS`); idempotent; journal gets exactly one `schema_migrated`; crash recovery by `state_sha256_before`.
- `replay --write` over a valid v1 state makes the same backup (`via: replay`) and never counts the version change as a loss.
- `journal restore-from-state` re-records the v2 fields (`restored: true`, with `orig_ts` so the original times survive replay).
- Gate: a `.lvp`-only folder is `refuse_existing` with `legacy_folder: ".lvp"`; `.lvp` is in `SKIP_DIRS`.

Docs and skills: `docs/spec/01-state.md`, `skills/lvr-conventions.md` (Q1 product block, Q2 `SCHEMA_TOO_NEW`, Q3 `cancelled`, `orig_ts`); the 7 `SKILL.md` Script-helper blocks (still identical): `"lvr_schema":2`, the migrate preflight, `SCHEMA_TOO_NEW`, session_start/session_end; init Step 1.3 payload and `schema_version: 2`; `lvr-continue` Step 1 (`.lvp`), Step 2 recovery map (`MIGRATION_NEEDED`, `SCHEMA_TOO_NEW`) and the v2 replay rows; `skills/README.md` and `INSTALL.md` ("Updating: update all LVR skills together").

## Owner answers

- Q1: `product` has `status` (`unasked | pending | decided`), `source` (`user | ai_recommended`), `rationale`, `confirmed`. Types without a status mean decided/user/confirmed. An AI recommendation waiting for the user is `pending` with the proposed types, `ai_recommended`, a required `rationale`, `confirmed: false`; the yes is `{status: "decided", confirmed: true}`. A migrated project stays `unasked`. The interview logic is ticket 08 (not built).
- Q2: `SCHEMA_TOO_NEW` replaces the design's `SCHEMA_UNSUPPORTED`; `details.found/supported`, hint "Update all LVR skills together". Never rewrites or downgrades.
- Q3: `session_end` reasons are `done | paused | context_guard | error | cancelled` (`refused` is gone); `cancelled` needs a non-empty `note`; stored as `sessions[].end_note`.

## Deviations from the design (and why)

1. SKILL.md session/preflight text is one shared block (the Script-helper paragraph, identical in all 7) instead of per-skill session_start/session_end lines and a per-skill `error` line. Reason: the block must stay identical (check in fixture 40) and the per-skill triggers already live in the conventions ownership table.
2. `answer record` now forwards `product` and `coverage` from its JSON input (like `project`). Not in the design; without it the S1 product-type answer could not carry the extension through the script.
3. Lock staleness also checks the owner pid (`lockIsStale`); the `.lvp` copy runs under a separate `.lvr-migrate.lock` in the project root, because `.lvr/` does not exist yet.
4. `orig_ts` (see above) is new: the design had no way for `restore-from-state` to keep original timestamps.
5. Migrated `state.json` is written in canonical key order; every value is identical to v1 (key order differs inside `pipeline.sections`).
6. The `replay` report gains `sessions` and `research_events` counters.

## Changed expectations in older fixtures

- 03: `make.mjs` `session_start` payloads carry `session_id_reason`; case folders regenerated (expected states are v2).
- 26 and 40 `cases.mjs`: `session_start` now needs `skill` (`lvr-*`) and a reason.
- 04 and 26 `run.sh`: the `futsal-fixed` fixture stays schema 1 on purpose, so the temp copy is migrated (`state migrate`) before any write; 26 compares the re-sourced replay diff to a migrated copy of futsal-fixed.
- 26: `meta events` now ends `research_logged, context_research, schema_migrated`.

## Fixture results

- 27 (`fixtures/27/run.sh`, `cases.mjs`, `fuzz.mjs`): 120 cases PASS, fuzz 6x40 PASS (the full 30 runs x 60 events, 1800 events, 1429 accepted, also passed: 0 failures). Covers one case per new event (replay = live), session lifecycle, the `product` ai_recommended + confirmed flow, a cancelled session, `v1_cli` migration (a-f), the futsal dogfood (the replay diff pointers equal the 45 in `futsal-v1-replay-diff.json`, all kept), the `.lvp` project (old folder byte-identical, gate refusal, `MIGRATION_NEEDED`), double migration (byte-identical), crash at copy/rename/backup-staged/backup/journal/state, `--check` writes nothing, corrupt/lagging/both-folders, `--remove-legacy` (LEGACY_DIFFERS and success), `SCHEMA_TOO_NEW` on 9 commands (nothing rewritten).
- 03: all 9 PASS. 04: 104 checks PASS. 26: 58 PASS. 40: 35 cases PASS, text checks PASS.
- Fixture 40 still prints FAIL lines for "negative control ... HEAD already has ...". Pre-existing and unrelated to the script: those controls require the changed file to differ from HEAD while HEAD lacks the phrase; the working-tree spec/conventions already differ from HEAD (uncommitted phase 1 and ticket 40 text), and HEAD already holds ticket 40's phrases. They clear once the tree is committed.
- `npm run lint` rc 0 (one pre-existing warning in `research/J-signals-probe.mjs`), `npx tsc --noEmit` rc 0, `npm run check:skills` clean, `cmp` of the 7 script copies and 7 conventions copies clean.

## Fix round 1

Source: `27-verify.md` (3 blocking, advisories).

**B1: a damaged `.lvp`-only project had no recovery path.** One path now ends in v2 and every hint leads forward:
- `replay --write` and `journal restore-from-state` on a folder that holds only `.lvp/` first copy `.lvp/` to `.lvr/` (the same staged copy as `state migrate`, `migrateCopy(dir, copyOnly)`), then run the normal `.lvr` recovery. `.lvp/` is never touched; output carries `copied_from: ".lvp"`. A damaged state is kept as `state.corrupt-<date>.json`.
- `blockedHint` and the `NO_LVR` hint now name `replay --write` (`--force` for lagging; `LOSSY_REPLAY` may then ask for `--accept-loss`) or `restore-from-state` and say they copy first. `state migrate --check` reports `needed: true` together with `blocked` (it said `false`, which a skill could misread).
- Read commands (`replay --compare`) on a `.lvp`-only folder stay `NO_LVR` (read-only, nothing copied); the hint names `replay --write`.
- Limit: a project rebuilt this way has no migration backup manifest, so `--remove-legacy` keeps `.lvp/` (`LEGACY_DIFFERS`).

**B2: AI recommendation counted as decided.** `foldProduct`: types without a status are `decided` only when the source is not `ai_recommended`; with it they are `pending`, `confirmed` false. `decided` + `ai_recommended` is never stored without `confirmed: true` (reducer degrades to `pending`; payload check refuses `{status:"decided", source:"ai_recommended"}` without `confirmed:true`; the live guard refuses `{status:"decided"}` without `confirmed:true` against an `ai_recommended` entry already in state, INVALID_PAYLOAD `product.confirmed`). State validation already refused decided + unconfirmed (`E_PRODUCT /product/confirmed`). Spec 01 and conventions updated.

**B3: continue branch a.** `skills/lvr-continue/SKILL.md` 5a now decides from `LVR state get --pointer /sessions/-1/recovered_error` (works on the healthy and the rebuild path; the prose fallback reads the journal against this run's `session_start`). Script: `state get` accepts `-1` as an array index (last element). The 2b `error` row (`project.error`) and `research_logged`/`context_research` row (A6) fixed; `docs/spec/03-skills.md` line 30 aligned.

**Advisories taken:** A2 (staged `.lvp` copy made writable), A3 (empty/unparsable lock older than 2 s is stale; a stale `.lvr-migrate.lock` is removed by `state migrate`), A4 (read-only `migrations/` is `STATE_WRITE_FAILED`; `--remove-legacy` before migrating is `LEGACY_DIFFERS`), A1 (documented: refusals before a journal exists leave no session), A6. Not taken: A5, A7, A8 (design-level or negligible).

**Fixtures** (`fixtures/27/cases.mjs`, 175 cases now): case 23 (B1; `stuck/` holds the 5 real stuck projects as anonymised `.lvp`-only copies, all `E_LOOPBACK` from loop-backs without `opened_at`; the sixth pattern is covered by synthetic truncated, missing-state, no-journal and lagging copies of the futsal project; exact STATE_INVALID hint asserted), case 24 (B2, exact INVALID_PAYLOAD message), case 25 (B3, healthy and rebuild path, SKILL.md text), case 26 (advisories). Only 5 stuck projects exist on this machine (the verifier's "6" included one that no longer reproduces).

**Changed expectations:** none in 03/04/26/40. Results: 27 175 PASS + fuzz 30x60 (1800 events) 0 failures; 03 9 PASS; 04 104; 26 58; 40 35 cases + text checks, rc 0; lint, tsc, `check:skills` rc 0; all copies `cmp` equal after `sync:skills`.

## Fix round 2

Not committed. Changes are in `scripts/lvr.mjs` (7 skill copies synced), `docs/spec/01-state.md`, `skills/lvr-conventions.md` (7 copies synced) and `fixtures/27/cases.mjs`.

### B2b: a payload with no `source` never confirms or relabels an AI recommendation

- Rule (owner decision P6): confirmation only comes from an explicit `confirmed: true`, with `source` kept as `ai_recommended`. A different pick needs an explicit `source: "user"`.
- Live guard (`liveGuard`, checked against the healed state), when `state.product.source === "ai_recommended"`:
  - `types` (non-empty) and no `source` is refused with INVALID_PAYLOAD `product.source`. Message: `Payload field "product.source" is invalid: expected explicit: "user" to choose another type, or "ai_recommended" with confirmed true to confirm the recommendation (a product payload with types and no source never changes an AI recommendation).` This covers `{types}`, `{status:"decided", types}` and `{status:"decided", types, confirmed:true}`.
  - `{status:"decided"}` with no `confirmed: true` is refused with `product.confirmed` (the round-1 message).
  - `{status:"decided", source:"user"}` with no `types` and no `confirmed: true` is refused with `product.types`. Message: `... expected the user's own types when source is user (without types this would relabel the AI recommendation as the user's choice).`
  - Flags-only payloads still pass and change nothing else.
- Replay (`foldProduct`): when a payload has no `source` and the entry is `ai_recommended`, the fold keeps the source and the rationale, and the status stays `pending` with `confirmed` false. The `confirmed` rule is unchanged. A hand-appended old line therefore cannot decide it on rebuild, and replay still equals live.
- Spec 01 (payload-extension row) and conventions (line 175) document the rule.

### A4 (rest): read-only `.lvr/migrations/`

- All three remaining unwrapped places in `makeBackup` (the cleanup `readdir`/`rm`, the `mkdir` of the staging folder, the final write catch) now throw `STATE_WRITE_FAILED` (exit 1) with `details.hint` = "Make .lvr/migrations writable (for example `chmod -R u+w .lvr/migrations`), then run `state migrate` again. Nothing was changed."
- Nothing is written: the `.lvr` tree sha is identical, no staging folder and no `.lvr-migrate.lock` remain. After `chmod 755` the same command migrates.

### Fixtures

`fixtures/27/cases.mjs` gains case 27 (B2b: 5 refusals with exact messages, nothing written, flags-only ok, explicit `source:"user"` decides, explicit `decided+user+confirmed` allowed, replay of a hand-appended no-source line stays pending and ai_recommended) and case 28 (A4). 175 -> 191 cases. No existing expectation changed.

### Results

- Fixture 27: 191 pass, quick fuzz 6x40 0 failures. Full fuzz 30x60: 1800 events (1428 accepted), 0 failures.
- Fixtures 03 (all), 04 (104 checks), 26 and 40: ALL PASS.
- `npm run lint`: 0 errors (1 pre-existing warning in `research/J-signals-probe.mjs`). `npx tsc --noEmit`: clean. `npm run check:skills`: `drift: []`, `problems: []`. `cmp`: 7 script copies and 7 conventions copies equal to the sources.
