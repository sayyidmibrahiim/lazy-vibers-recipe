# Ticket 26 — implementation run, phase 1 of 2 (research-grounded behaviour)

Date: 2026-11-20 · Implementer: Opus (xhigh) · Not committed. `scripts/lvr.mjs` not touched.
Phase 2 (Sonnet) builds `lvr.mjs research log` and `lvr.mjs cite check` from the contract below.

## Contract location (phase 2 reads these, in this order)

1. `docs/spec/07-research.md` — the normative contract:
   - §3 cite tag / group / unverified marker / user-fact syntax;
   - §4 `freshness.json` schema, lookup order, date and age rules, group rules (freshness, key fact, registrable domain);
   - §5 `research_logged` / `context_research` payloads, plus §5.1 `research log`;
   - §6 `cite check`: files, zones, detectors, checks, findings I1–I13 with exact codes and message templates, owner, sort order, `needs_model`, output;
   - §7 callers;
   - §8 the script change list.
2. `skills/lvr-conventions.md` §10 — the compact operational copy the skills ship, including the no-script fallback.
3. `skills/lvr-freshness.json` — the limits. Synced to every skill as `references/freshness.json`.

Limits follow the R2 owner ruling, with no other value anywhere:

| Category | Limit (days) |
|---|---|
| price / quota / version | 30 |
| legal | 60 |
| regulation | 60, plus an `amend-check` |
| market | 90 |
| statistic | 365 |
| general (LVR addition) | 365 |

## Phase-2 instructions (from spec 07 §8)

- Append `research_logged` and `context_research` to `EVENT_TYPES` after `resume`, and add them to the conventions §3 "Event types:" line in the same change. I left that line unchanged on purpose, so `check:skills` stays green until the script supports the events.
- Both events replay as informational. They are valid before state exists. `id` is script-assigned (`RQ-NNN`, max+1); a payload that carries `id` is refused.
- `cite check` per §6. `LINT_GROUPS` gains `I`. `crosscheck` gains X8 (I1–I13). X6/E4 are unchanged.
- Load `freshness.json` per §4: `--freshness`, then `SCRIPT_DIR/../references/freshness.json`, then `SCRIPT_DIR/../skills/lvr-freshness.json`. Never hard-code the limits.
- Once that lands, drop the "until the commands exist" fallback sentence in conventions §10.

## Changes per file

**New**

- `docs/spec/07-research.md` — the contract.
- `skills/lvr-freshness.json` — the limits.
- `skills/lvr-init-new-idea/references/sections/S0-domain-brief.md`:
  - Domain Brief procedure and template (`U-NN`, Section/Became columns);
  - per-Section scan table;
  - "Things you may not know" (question or cited `designer_filled`, never `designer_filled` on an unverified item);
  - resume rules.

**Data change: `scripts/sync-skills.mjs`.** One entry registers `skills/lvr-freshness.json` → `<skill>/references/freshness.json` (not optional). The header comment also changed. The 7 copies are generated.

**Spec**

- `00-overview.md` — spec list gains 07, plus a ground rule.
- `01-state.md`:
  - `research/` folder;
  - `RQ-NNN` / `U-NN` ids;
  - the two events (pointing to 07 §5);
  - checkpoint moments.
- `02-sections.md`:
  - mechanics: scan, "Things you may not know", evidence;
  - S0: market + Domain Brief;
  - S2: live price cites;
  - S3: brief regulation items;
  - S5: no fallback;
  - S6: an unverified key fact is a risk;
  - S9: X8.
- `03-skills.md`:
  - init / continue / handoff flows;
  - recheck and add-feature research lines (tickets 33/29);
  - Constitution 1 and 14.
- `04-bundle.md` — RESEARCH row; cross-check X8.
- `05-boosters.md` — competitor-analysis renamed "(research depth)"; web research is a required capability, not a booster.
- `06-model-tiers.md` — web check for every tier, journaled as `research_logged web_check`, never as probe events.

**Constitution and conventions**

- `skills/lvr-principles.md`:
  - 14 principles;
  - principle 1 strengthened: URL + published/updated + access date, freshest primary source wins, conflicts recorded, key-fact rule, `unverified` only after logged failure, never `designer_filled` on it;
  - new principle 14 "Research what the user doesn't know".
- `skills/lvr-conventions.md`:
  - tree gains `research/`;
  - ids `RQ` / `U`;
  - research language;
  - S0 row (market + brief);
  - per-Section scan line;
  - §7 web check;
  - checkpoint moments;
  - new §10 "Research and citations".
- `GLOSSARY.md` (Indonesian) — "Domain Brief" and "Freshness limit"; the Constitution entry is updated.

**Init skill**

- `skills/lvr-init-new-idea/SKILL.md`:
  - 14 principles;
  - flow;
  - web check as step 1 after the gate, before `.lvr/` exists: fail → enable guidance + stop, nothing written;
  - booster row renamed, and web research marked as not a booster;
  - S0 step 5b market (`S0.q4`) + Metadata line;
  - step 8 Domain Brief;
  - engine step 1b (scan + "Things you may not know");
  - step 4: decisions cite facts;
  - S1 `## Context research` line;
  - S2 live price cites + `## Prices quoted` table;
  - S3 legal decisions cite brief items;
  - S5 model-knowledge fallback removed, new claim discipline, record template;
  - S6 freshness re-check, unverified key fact = blocking;
  - S8 cost tags;
  - S9 cross-check X8;
  - Never list.
- `references/sections/S2-conditions.md` — the fact-sheet is now a lead list older than 30 days; quote only with a live cite; `unverified-figure` / "model verified" removed.
- `references/sections/S3-data-privacy.md` — q7 shows brief items; q9's `designer_filled` deletion path must cite a `U-NN` regulation item, otherwise ask.
- `references/sections/S5-research.md` — no fallback; cite groups, logged failures, copied tags, a recommendation must cite, `cite check --file` before close; "Degraded mode" section removed.
- `references/bundle/templates.md` — OVERVIEW cost table gains a source column with copied tags; RESEARCH keeps tags verbatim and re-researches expired ones.

**Other skills**

- `skills/lvr-continue/SKILL.md`:
  - 14 principles;
  - Step 4b web check (journaled pass/fail, stop with enable steps);
  - 5b research-first (missing or partial brief, missing scan);
  - S0 market;
  - 5c freshness re-check before compile;
  - replay table row;
  - Never list.
- `skills/lvr-handoff/SKILL.md` and `references/lint-checklist.md` — groups A–I; new group I (I1–I13 in prose, owners); X8.
- Web research is now required, with no "keep `unverified` and continue". Limits come from `freshness.json`:
  - `skills/lvr-add-feature/SKILL.md`
  - `references/feature-capture.md`
  - `skills/lvr-recheck-plan/SKILL.md`
  - `references/audit-checklist.md` — R2.1–R2.5 thresholds are now 30/60/90 instead of 90/180/90.

**Unchanged:** the shared Script-helper block. Its md5 is identical across all 7 SKILL.md once the step number is stripped. All user-facing example wording is an English source, spoken in User Language at runtime.

**Checks:** `npm run sync:skills` → ok (21 copied). `npm run check:skills` → `{"ok":true,"drift":[],"problems":[]}`.

## Open questions

1. `general` category (365 days) is beyond R2. It covers definitions, how things work, and failure modes. Keep it, or fold those facts into `market` (90)?
2. `regulation` uses 60 days for both the source and its `amend-check`. R2 gives no separate amendment interval.
3. Pre-S0 stop when the gate created a subfolder: the folder stays empty and the stop message says to re-run inside it. Needs a check that the gate then proceeds in place, not as "refuse".
4. ADR-0004 (loud degraded mode) contradicts the hard stop for web research. Suggest ADR-0007 "Web research is required" superseding ADR-0004 for research only.
5. No state fields were added for the brief or scans: they are derived from the journal and the brief file. Ticket 27 may want `pipeline.research` in state.
6. Rework still to do: recheck/add-feature (tickets 33/29), build/personal-brand (ticket 34). Mine are minimal alignment edits only.
7. E4/X6 still accept a bare `unverified` (the script was not touched). I9 now contradicts it. Phase 2 or ticket 33 should make E4 defer to group I.
8. The market question adds one S0 answer (`S0.q4` unless clarifying replies took earlier ids). Confirm this is acceptable in "S0 has no structured questions".
9. `boosters.core` competitor-analysis "degraded" now means "plain web search used". Statuses are unchanged; only the meaning is narrower.

## Test plan

1. **KPR dry run** (T1, an Indonesian mortgage-calculator idea):
   - init asks the market question;
   - `domain-brief.md` has ≥8 `U-NN` items covering OJK/BI rules, provisi/admin/notaris/BPHTB fees and bunga rates;
   - every rate/fee cite is `price` with an as-of date ≤30 days old (R2 tightens the ticket's 90);
   - regulation rows carry `amend-check`;
   - `cite check --file .lvr/docs/research/domain-brief.md` gives `clean:true`;
   - S1 opens with "Things you may not know" and every shown item gets a `Became` value.
2. **No-web harness** (WebSearch/WebFetch denied):
   - init stops after the gate with the enable guidance for that harness, and no `.lvr/` exists;
   - in an existing project, `/lvr-continue` journals `research_logged` `outcome:failed` and stops before any batch;
   - status-only and handoff guidance still work.
3. **Futsal** (`.scratch/public-release/fixtures/04/futsal-fixed`, on a temp copy), `LVR_NOW=2026-11-20 lvr cite check --all` must report:
   - I1 (old `<url> (date)` sources and the OVERVIEW `Rp 100.000 … (D-005)` row, since a decision id is not a source);
   - I2 ("model knowledge, no live check", "assistant's memory");
   - I9 (bare `unverified`);
   - I11 (D-018 `designer_filled` on an unverified price);
   - I12 ("Recommended stack" and "Stack comparison and trade-offs" with no cite);
   - warning `NO_DOMAIN_BRIEF`.

   A re-sourced copy should give `clean:true`, `findings:[]`. It needs fresh cite tags, logged `RQ` failures behind markers, D-018 re-recorded as `user_confirmed` or an S6 risk, and `S2.q3` (the recorded Rp 100.000 budget answer) on the OVERVIEW line.
4. **Unit cases per code (phase 2):**
   - I3: each reason;
   - I4: `n.d.` with/without `live`, and on a statistic;
   - I5: future date and pub after acc;
   - I6: 31-day price, 61-day `amend-check`, a partial date `2026-10`;
   - I7: one non-primary source, two `www.`/sub-domain duplicates, a `co.id` pair;
   - I8;
   - I9: a marker with an unknown RQ, a `found` RQ, and an RQ with no queries;
   - I10;
   - I11: a state-only decision, `--file` without state;
   - I12: a phrase, and a section;
   - I13: a missing column, an invalid Section, Section done with an empty `Became`;
   - `MISSING_FLAG`, `PATH_OUTSIDE_PROJECT`, `FRESHNESS_MISSING`, `FRESHNESS_INVALID`;
   - `research log` refusing a payload `id`, `found` with no sources, and `failed` with no `reason`.

## Orchestrator rulings on the open questions (2026-11-20)
1. Keep `general` = 365 days (stable definitions/how-things-work; same horizon as R2 statistics). Documented as an extension of R2.
2. Regulation source and amend-check both 60 days: accepted.
3. Verifier tests that the gate proceeds in place after the pre-S0 stop in a created subfolder.
4. Write ADR-0007 "Web research is required" superseding ADR-0004 for research only (follows D12, already an owner decision). Phase 2.
5. `pipeline.research` in state → ticket 27 (note added there).
6. Rework of recheck/add-feature/build/brand stays with tickets 29/33/34.
7. Phase 2: E4 and X6 defer to group I for `unverified` (no bare `unverified` accepted where I9 forbids it).
8. The S0 market question is accepted (D11 needs the user's country/market).
9. Accepted.

## Phase 2 (scripts)

Scope done in `scripts/lvr.mjs` (and its 7 synced copies), `skills/lvr-conventions.md`, `docs/spec/01-state.md`, `docs/spec/07-research.md` (new section 8.1 "As built"), `docs/spec/00-overview.md`, `docs/adr/0007-web-research-is-required.md`, `docs/adr/0004-...` (partial-supersede note), fixtures 04 (adapted) and 26 (new). Not committed.

### Commands and output shapes
- `cite check (--all | --file PATH...) [--freshness PATH]` returns `{ok, cmd, today, clean, files, findings, needs_model, stats, warnings}`. A finding is `{id, group:"I", code, file, line, message, owner, kind:"bundle_gap", needs_model, claim}`; `state.json` findings have `line:null` and sort last. `needs_model` is I1, I3, I6, I7, I12. Warnings: `NO_STATE`, `NO_DOMAIN_BRIEF`, `NO_JOURNAL`. Clock is `LVR_NOW`; limits come from `references/freshness.json` (beside the script, or `--freshness`).
- Errors: `MISSING_FLAG` (exit 2, none or both of `--all`/`--file`), `PATH_OUTSIDE_PROJECT`, `FILE_NOT_FOUND`, `INVALID_PATH` (not `.md`), `FRESHNESS_MISSING`, `FRESHNESS_INVALID` (all exit 1).
- `research log --payload JSON [--context]` (also `--in`) returns the journal-append envelope plus `id` (`RQ-NNN`, script-assigned as max+1 across `research_logged` and `context_research`, under the lock). A payload `id` is refused; `found` needs sources; `failed` needs `reason`; `--context` validates `scope` (brief/scan), `findings`, `note`. `journal append --type research_logged|context_research` takes the same path. Both types are in `EVENT_TYPES` and the conventions "Event types:" line; spec 01 updated. Valid before `state.json` exists (web check right after `session_start`, state reason `NO_STATE_YET`).
- Group I is wired into `lint run` (default groups now A-I, `--group I` allowed) and `crosscheck` (X8, 8 rules).

### Deviations and interpretations
- `--file` is repeatable; an explicit `--freshness` that is missing never falls through to the bundled file (FRESHNESS_MISSING).
- `designer_filled` in DECISIONS.md rows is matched without stripping underscores (found while testing: `cleanCell` removed `_`, so the status never matched; DECISIONS.md is therefore now an I11 source, which raised the futsal count by one).
- Ruling 7: E4 now accepts only a date, a cite tag or an `[unverified: ...]` marker; a bare `unverified` no longer satisfies it. X6 follows E4.

### Changed expectations (fixtures 04), none weakened
- `run.sh`: lint calls use `--group A,B,C,D,E,F,G,H` and crosscheck goes through `XC()` (asserts X8 is listed, then filters it). Reason: 04 predates citations; every A-H/X1-X7 expectation is unchanged and group I / X8 are covered by fixtures/26. The crosscheck check is renamed accordingly.
- `futsal-fixed` (and the `e_*` overlays): bare `unverified` cost cells replaced by `[unverified: price|market · RQ-00N]` in 8 files (OVERVIEW, RESEARCH, S5 record, DECISIONS and related rows), because E4 no longer accepts a bare word. The expected E4 findings in the broken overlays are the same rows and messages.

### Fixture results
- fixtures/26/run.sh: ALL PASS (74 PASS lines): `cases.mjs` 58 cases (one per I1-I13 with exact message and line, extra I3/I4/I5/I6 reasons, clean 0 findings, freshness expired + on-the-limit for price, quota, version, legal, market, statistic, general, regulation amend-check, error codes, `research log` accepts and refusals, `journal check` in_sync, `replay --compare` []) plus the futsal cases.
- Futsal as it is: `cite check --all` FLAGS it, 101 findings (I1 19, I2 27, I9 49, I11 4, I12 2; warning NO_DOMAIN_BRIEF). `lint run --group I` and `crosscheck` (X8 fails, X1-X7 ok) agree.
- Re-sourced futsal (`resource.mjs`: citations only, plausible URLs, acc 2026-11-20, memory phrases reworded, three failed `research log` steps behind the markers): `cite check --all` 0 findings, full `lint run` A-I clean, `crosscheck` X1-X8 ok, `journal check` healthy, `replay --compare` diff identical to the original hand-built fixture (it has its own pre-existing differences; research events add none). 101 days later the price cites expire (I6).
- Regression: fixtures/03 no FAIL; fixtures/04 ALL PASS (104 checks); CLI fuzz (18 research events plus refused payloads) `journal check` in_sync, `replay --compare` []; `npx tsc --noEmit` clean; `npm run lint` 0 errors (1 warning in an unrelated scratch file, `research/J-signals-probe.mjs`); `check:skills` ok; 7 script copies, conventions and freshness copies `cmp` identical; the Script-helper block is identical in all 7 SKILL.md apart from the step number.
