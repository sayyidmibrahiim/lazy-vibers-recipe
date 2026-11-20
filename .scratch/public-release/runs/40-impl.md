# Ticket 40: research-check hardening: implementation report

Implementer: Sonnet (high), 2026-11-20. Nothing committed. Order followed: spec 07 first, then conventions §10 and the skill texts, then `scripts/lvr.mjs` and `npm run sync:skills`, then fixtures.

Fixtures: `fixtures/40/run.sh` (30 new-script cases, 16 baseline controls, 25 text checks): ALL PASS. `fixtures/03` rc 0, `fixtures/04` ALL PASS (104), `fixtures/26` ALL PASS (74, expectations changed as listed below). `npm run lint` rc 0 (one existing warning in `J-signals-probe.mjs`), `npx tsc --noEmit` rc 0, `npm run check:skills` `ok:true drift:[]`, `cmp` clean for 7 scripts, 7 conventions, 7 freshness.json. Script-helper block md5-identical across the 7 SKILL.md (asserted by `fixtures/40/text.mjs`). CLI fuzz (3 seeds x 300 random valid and invalid `research log` calls, including `--context`): journal healthy, `in_sync`, replay `diff: []`, no duplicate RQ ids. futsal-fixed lint A-H and crosscheck X1-X7 stay clean (fixtures/04).

Negative controls: `fixtures/40/baseline/scripts/lvr.mjs` is a frozen copy of the ticket-26 script (HEAD at the start of ticket 40). Every MUST case fails there (`PASS negative control ...` x16 in `run.sh`). Skill-text checks also assert that `git show HEAD:<file>` lacks the new phrase while the change is uncommitted.

## Per advisory

Line numbers are `scripts/lvr.mjs` unless noted. Spec = `docs/spec/07-research.md`. Case names are the fixtures/40 `cases.mjs` titles.

| # | Rule as implemented | Where | Fixture and result |
|---|---|---|---|
| A1 | I11 also fires when a Domain Brief row with an unverified Source names the decision in `Became`, even if the decision text has no `U-NN` | `restsDirect` ~2813, `briefBecame` | `A1` + `T26 D-002`: caught (baseline: missed) |
| A2 | I11 also fires for an `RQ-NNN` that is a failed event, `U-NN` in any case, and a `D-NNN` that itself rests on one (fixpoint over state + all scanned files) | `restsDirect`, `i11Ids` fixpoint ~2813-2829 | `A2` + `T26 D-003/D-004/D-006`: caught |
| A3 | I13: every id in `Became` must be a recorded non-skipped answer or a decision in `state.decisions` (also when the Section is not done); message `Domain Brief item <U-NN> names <id> in Became, but no such recorded answer or decision exists.` | ~2882 | `A3` + `T26 U-04/U-05`: caught (skipped answer id is also refused) |
| A4 | In a research zone, a non-exempt line where the price or fee-or-rate detector fires needs a category in `price quota legal regulation statistic`; version only: `version quota legal regulation`. I3 `category "<cat>" does not fit a <price\|fee or rate\|version>` | `MONEY_CATS` ~2732, check ~3004 | `A4` + `T26 A17/A18`: caught |
| A5 | Whole-file research zones: `OVERVIEW.md`, `SPEC/architecture.md`, `SECURITY.md`, `CAPABILITIES.md` (plus the existing `RESEARCH.md`, S5 record, research files, S2 `## Prices quoted`) | `WHOLE_FILE_ZONES` ~2731 | `A5` + `T26 arch/OVERVIEW`: caught; `MILESTONES.md` figure documented as allowed. **Deviation 1** |
| A6 | Detection text: NFKC, zero-width and `*`/`_` removed; `rp` any case; scale words before a trailing currency word; `Total`/`Totals` as the first whole word only; inline code is text in zones; keywords `dsr dti ltv dp suku uang muka` | `detectText` 2608, regexes 2599-2603, exemption in the row loop | `A6` + `T26 B11/B17/B20, B06, A26/A46/A29, Totally`: caught. Fence, comment and heading stay allowed |
| A7 | Cite URL host must be public (dot; not localhost, `.local`, `.internal`, private/loopback/link-local/CGNAT/reserved IPv4); same check on `research log` sources. A public IPv4 passes | `publicHostOk` 2667; `parseCite`; ~3148 | `A7` + `T26 A11/A33`: caught. IPv6 literal: cannot be written in a tag (`]` closes it), so it already failed as `wrong number of fields` |
| A8 | `amend-check` earlier than `pub`/`upd` is I5 `Amendment check <d> is before the published date <pub>.`; equal date passes | `citeAnalyze` I5 block | `A8` + `T26 A16`: caught |
| A9 | Memory phrases added: `my knowledge`, `as I recall`, `based on my training`, `from my training`, `pengetahuan model`, `dari ingatan`, `tanpa cek`, `setahu saya`, `berdasarkan pengalaman` | `MEMORY_PHRASES` 2589 | `A9` + `T26 A43`: caught |
| A10 | `research log`: `published`/`updated` not after `accessed` or today; `purpose` refused on `context_research`; `sources` refused on `failed` (chose "refuse", not "document") | ~3129-3166 | `A10`: refused with exact `details.field`; same-day and partial dates pass |
| A11 | `scope: brief` may have `findings: []` when `outcome: failed` and `note` is non-empty | ~3135 | `A11`: accepted; no note, or `found` with `[]`, still refused |
| A12 | Ruling 2 read literally ("source and amend-check both 60 days"): for `regulation` the newest `acc` (the day the source was read) must also be within the limit. New I6 message `Regulation source was read <age> days ago (limit <max>): read it again and search for newer amendments.`; the amend-check message keeps priority. A law's own `pub`/`upd` date is not aged (**Deviation 2**) | ~2975-2977; spec §4, §4.1, §4.2 | `A12`: 690-day read with fresh amend-check is I6; pub 2022 with a fresh read passes |
| A13 | Skill text: engine step 1b is now 4 ordered steps: (1) brief freshness gate `LVR cite check --file .lvr/docs/research/domain-brief.md`, re-research every I6/I7/I8/I10 finding owned by this Section with an empty `Became`, repeat until none, failed again becomes a marker and a question; (2) scan; (3) outage rule; (4) present, with "(source, date)" instead of "I checked each one today" | `skills/lvr-init-new-idea/SKILL.md` (engine 1b), `references/sections/S0-domain-brief.md` §2/§3, conventions §10, spec §2, `skills/lvr-continue/SKILL.md` Step 5b | `text.mjs` A13 x4 with HEAD negative controls; `A13` mechanism case: an expired item surfaces with `owner` = its Section and clears after the re-research |
| A14 | Outage is not failed research: `failed` and markers only when search and fetch worked and found nothing usable; a search error, or no readable page from up to 3 results of a query and again of one reworded query, stops with the enable steps; one `web_check` event with `outcome: failed` is journaled | conventions §10, spec §1.0, init 1b step 3 and S5 booster line, S5-research.md, S0-domain-brief §1, continue Step 4b | `text.mjs` A14 x5 with HEAD negative controls; `A10`/`A11` fix the failed-event shapes |
| A15 | Web check fetches up to 3 different results; one site's 403/404/login wall is not a failure | init Step 1, continue Step 4b, conventions §10, spec §1 | `text.mjs` A15 x4 with HEAD negative controls |
| A16 | Chosen: Check 4 reuses an existing empty `<slug>/` (junk files aside) in `gate subfolder`, `gate check` (`free_slug`, `free_slug_reused`) and `slug free` (`reused`); a non-empty folder still gets `<slug>-2` | `freeSlug` 1459; `gate subfolder` handler; init Check 4 and web-check stop text; spec 01 | `A16`: second `gate subfolder` returns `reused:true`; baseline gives `-2` |
| A17 | Status cell and `(designer_filled)` heading and record line matched ignoring case and `*` `_` backtick | `isDesignerFilled` 2744, `designerFilledIn` 2747 | `A17` + `T26 Designer_Filled/**designer_filled**`: caught |
| A18 | `readJournal` reports `duplicate_rq_ids`; `journal check` becomes unhealthy, journal warning, `cite check` warning `DUPLICATE_RQ_ID`; markers resolve against the first event | `readJournal` 255/263, `researchIndex` 2723, ~3055 | `A18`: `healthy:false`, `duplicate_rq_ids:["RQ-001"]`, warning present |
| A19 | `## Prices quoted` zone heading matched case-insensitively and trimmed | `zoneSection` ~2859 | `A19`: `## prices quoted` is a zone |

Also synced: conventions §10 and `lvr-handoff/references/lint-checklist.md` group I (prose fallback), `docs/spec/01-state.md` gate check 4, ADR-0007 (hardening paragraph), spec 07 §8.2 (advisory table).

## Ticket-26 adversarial rows re-run

| Row | Result now |
|---|---|
| A11/A33 `https://x`, `http://localhost/fee` | caught (A7) |
| A16 amend-check before pub | caught (A8) |
| A17/A18 expired price tagged `market` / `general` | caught as I3 category fit (A4); the price now fails the category check before its age matters |
| A26/A46/A29 `5 juta rupiah`, `rp 50.000`, `DSR maksimal 30%` | caught (A6) |
| A43 `as I recall from my knowledge`, `based on my training` | caught (A9) |
| D-002 Became case; D-003/D-004/D-006; DECISIONS.md Status case; U-04/U-05 phantom ids | caught (A1, A2, A17, A3) |
| B11/B17/B20 zero-width, emphasis, full-width digits; B06 inline code in a zone; "Totally hidden plan"; arch/OVERVIEW price | caught (A6, A5) |
| Allowed (documented): B05 fenced price, B07 HTML comment, B08 heading, a `statistic`-tagged price, figures in `MILESTONES.md`, two public IPv4 hosts as two domains (A35), IPv6 literal | allowed |

## Deviations (each documented in spec 07)

1. **A5 narrower than "every scanned bundle file".** Running price/fee/version detection on every bundle file added 42 findings on futsal-fixed, almost all the user's own design values (30% DP), estimates (`Rp 0` per milestone) and test data (`Rp 150.000/hour` in VERIFICATION and requirements), none a researched fact. Those can only be silenced by inventing sources. I widened the zones to the four bundle files that restate vendor, legal and cost facts (`OVERVIEW.md` whole file, `SPEC/architecture.md`, `SECURITY.md`, `CAPABILITIES.md`). That catches both examples the verifier named; the rest stay with the `needs_model` I1 item. If the orchestrator wants the literal rule, change `WHOLE_FILE_ZONES` and use all files; it needs about 42 answer ids or cites in the futsal re-source script.
2. **A12 date reading.** The ticket offers "make the regulation's own pub/upd date subject to its limit". A law's `pub` date is its enactment date (the spec's own example is `pub 2022-10-17` and must stay valid), so I read "source" in ruling 2 as the day the source was read (`acc`). Both `acc` and `amend-check` must be within 60 days, and `amend-check` is not before `pub`/`upd` (A8). This is the only reading that keeps the canonical regulation example valid.
3. **A4 allowed set** includes `statistic` and `legal` and `regulation` for price/fee lines (a purchase-tax rate under `regulation`, an average rent under `statistic` are legitimate). The old A17/A18 dodges (`market`, `general`) are mechanical now; judging a `statistic` or `legal` tag that holds a vendor price stays with the `needs_model` I3 item.
4. **`Total` exemption** is the whole first word (`Total per month` exempt; `Totally hidden plan` not), because exempting only a cell that equals `Total` would flag the sum rows of the OVERVIEW cost table.
5. **A3** applies the "non-skipped answer" rule literally: a `Became` that names a skipped answer is I13.
6. **Refresh event shape:** a re-research of a brief item is a `context_research` (`scope: scan`, `findings` = the U-id, `note` "refresh"). `purpose: "refresh"` belongs to `research_logged` and is refused on `context_research` by A10.

## Changed expectations (none weakened)

| File | Change | Reason |
|---|---|---|
| `fixtures/26/run.sh` | futsal unsourced count 101 to 107; `I1=19` to `I1=25`; `lint run --group I` and crosscheck X8 findings 101 to 107 | A5: six more I1 findings (OVERVIEW lines 7 and 60; `SPEC/architecture.md` lines 8, 19, 108, 110), all vendor/price facts the zones now cover. No other id changed |
| `fixtures/26/resource.mjs` | six more sources added (answer ids `S0.q1`, Vercel cite); the logged-failure markers `[unverified: market · RQ-001]` become `[unverified: price · RQ-001]` | A5 for the six lines; A4: those markers sit on price and fee rows, where `market` no longer fits. The re-sourced expectation (0 findings, lint A-I clean, X1-X8 ok, 101-days-later I6/I10 only) is unchanged |
| `fixtures/03`, `fixtures/04` | none | still pass untouched |
| fixtures/26 unit cases (58) | none | all pass as before |

## Notes for the verifier

- `skills/lvr-init-new-idea/SKILL.md` engine 1b is the main behavioural text; the fixture checks order and key phrases, not model behaviour.
- `gate check` output gains `slug.free_slug_reused`; `slug free` gains `reused`; `journal check` gains `duplicate_rq_ids`.
- Fixture files: `fixtures/40/{run.sh,cases.mjs,text.mjs,baseline/}`.

## Fix round 1

Verifier items B1 and B2 (BLOCKING) and N1 (top advisory). Order followed: spec 07, conventions §10 and lint-checklist, then `scripts/lvr.mjs`, then `npm run sync:skills`, then fixtures. Nothing committed.

| Item | Rule | Where | Fixture and result |
|---|---|---|---|
| B1 | A failed `research_logged` with `purpose: "web_check"` (a tool outage) never counts as failed research for a marker. `researchIndex` now keeps `failed` (backs a marker), `outage` and `failedEv`; a marker naming it is I9 `<RQ-NNN> is a failed web check (a tool outage), not failed research: enable the web tools and research the fact again.` I11 stays conservative: a `designer_filled` decision that cites a failed web_check RQ is still I11 (`failedEv`). An unknown id keeps the old I9 message | `scripts/lvr.mjs` `researchIndex` (~2718), I9 loop (~2965); spec 07 §3.3, §1.0, §6.4, §8.2; conventions §10 Unverified; lint-checklist I9 | `fixtures/40` `B1` (two markers plus one mixed-list marker give the outage message, a real failed RQ passes, D-001 "per RQ-001" is I11): negative control FAILS on baseline as intended; `B1` journal accepted + unknown id: INFO |
| B2 | Outside the research zones, in every scanned file: a non-exempt line with no source, a price with a **non-zero** amount and a billing cue is I1 `States a vendor price with no source: add a [cite: …] tag, an [unverified: …] marker, or the answer id it came from.` Cues: `/mo /month /yr /year /bulan /tahun` (word boundary), `per month|year|seat|user|transaction|bulan|tahun|transaksi`, `monthly yearly annual bulanan tahunan fee fees biaya plan tier paket subscription langganan renew renewal perpanjang pricing billed developer account`. Not flagged: `Rp 0`, `Rp 150.000/hour`, `30% DP`, a sourced line, an answer-id line, a Total row. `needs_model` I1 text rewritten (no "no number"; it now names percentage-only fees, versions outside the zones, numbers in words) | `vendorPrice` and the I1 `kind` selection (~2610-2625, ~3027); `needs_model` list (~3071); spec §6.2 (new bullet), §6.4, §6.5, §8.2; conventions §10 "Vendor prices outside the research files"; lint-checklist I1 | `fixtures/40` `B2` (exact message on 5 lines; cite, answer id, zero, no-cue, percentage, `/more` and a Total row stay clean) and `B2` DECISIONS.md vs RESEARCH.md (vendor message vs plain price message): both negative controls fail on baseline |
| N1 | `Rp.` with a dot (`Rp. 50.000`, `Rp.50.000`, `rp. 50.000`) is a price | `CURRENCY_BEFORE` and `AMOUNT_BEFORE_G` | `fixtures/40` `N1`: negative control fails on baseline |

Result on futsal-fixed: unsourced 107 to 114 findings (I1 25 to 32), the 7 new ones exactly the verifier's list (S1-context 16, S2-kondisi 18, DECISIONS 8 and 13, ASSUMPTIONS 6, 7, 19). The re-sourced twin is clean again: 0 findings, lint A-I clean, X1-X8 ok. Percentage-only vendor fees outside the zones (verifier N9) remain `needs_model`.

Text checks added to `fixtures/40/text.mjs` (7, each with a HEAD negative control while uncommitted).

Regression: fixtures 03 rc 0, 04 ALL PASS (104), 26 ALL PASS (74), 40 ALL PASS (102 PASS lines: 35 cases, 20 baseline controls, 7 more text checks). CLI fuzz 3 seeds x 300 calls: healthy, `in_sync`, replay `diff: []`, no duplicate RQ ids. `npm run lint` rc 0 (the same one existing warning), `npx tsc --noEmit` rc 0, `npm run check:skills` ok, `cmp` clean for 7 scripts, 7 conventions, 7 freshness.json.

### Changed expectations (none weakened)

| File | Change | Reason |
|---|---|---|
| `fixtures/26/run.sh` | futsal unsourced count 107 to 114, `I1=25` to `I1=32`, lint group I and X8 findings 107 to 114; the owner set `S2/S5/S7/S9` becomes `S1/S2/S5/S7/S9` | B2 adds 7 real I1 findings; one of them is in `S1-context.md` line 16, owned by S1 |
| `fixtures/26/resource.mjs` | `S1-context.md` added to `FILES`; new `INLINE` map puts the Apple, Google and .com cites right after the 7 prices (inline, so Status cells and `status: designer_filled` stay intact) | the re-sourced twin must stay at 0 findings; each price keeps its source's cite (`A` developer.apple.com, `N` namecheap.com) |
| `fixtures/40/cases.mjs` A19 | the out-of-zone line `- Not a zone USD 30 per month.` becomes `- Not a zone, a test amount USD 30.` | the old line is a vendor price with a billing cue, which B2 now flags; the case's intent (a price outside the `## prices quoted` zone is not an A5 finding) is unchanged. The expected findings list is the same |
| `fixtures/03`, `04` | none | still pass untouched |

### Deviations

- The B2 rule lists cues, not "currency plus any word", so a vendor price written with no billing word (`Apple charges USD 99`) outside the zones stays `needs_model`. This is the verifier's own proposed rule.
- A user's own budget written with a billing cue (`ceiling Rp 100.000/month`) must carry its answer id, as every user fact does (spec 07 §3.4); none of the futsal user values hit this.
- Advisories N2-N12 other than N1 are not implemented in this round; N12 is closed by the corrected deviation 1 in this file ("none a researched fact" was wrong: D-007's namecheap price is one, now caught by B2).
