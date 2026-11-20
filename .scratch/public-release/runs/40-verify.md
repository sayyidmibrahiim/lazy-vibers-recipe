# Ticket 40: independent QA verification

Verifier: Opus (high), 2026-11-20. I wrote none of the implementation and committed nothing. I edited no source files. Test projects and scripts are in `/tmp/claude-1000/-home-ibrahim-projects-lazy-vibers-recipe/23c653d2-751b-4de6-8fd1-e7e40b1114ae/scratchpad/v40/`:

- `must.mjs`, `should.mjs`, `a5.mjs`, `fuzz.mjs`, and the helper `h.mjs`
- `head/`: the HEAD script
- `wz/`: a patched copy where every file is a zone
- `nr/`: a patched copy with the proposed narrow rule
- `p/`: the generated projects

I formed the verdict below before reading `runs/40-impl.md`. The deviation rulings that follow were checked against it afterwards.

**Overall verdict: FAIL. There are 2 BLOCKING items (B1, B2), and both are narrow fixes. Everything else passes: the 4 Must items work with my own variants, the Should items are caught or documented, fixtures 03/04/26/40 pass, the build is green, and the copies are in sync.**

## 1. Must items with my own variants

### A1/A2/A3 (I11 through every link; phantom `Became`): PASS (two small case gaps, advisories N4 and N5)

| Variant (`must.mjs`) | Now | HEAD |
|---|---|---|
| V1: `Became = D-001` on a row of the `## Per-section scans` table (second table) whose Source is a marker. `Became = D-002` on a row whose Source is the bare word `unverified` | I11 D-001 and I11 D-002 (+ I9 for the bare word) | missed |
| V2: `per rq-001` (lowercase failed RQ). Chain: D-001 (state) ← D-002 (state, "same as D-001") ← D-003 (DECISIONS.md, `**Designer_Filled**`) ← D-004 (ASSUMPTIONS.md, `(DESIGNER_FILLED)`). D-006 `per RQ-002` (found) | I11 on D-001, D-002, D-003 and D-004. D-006 is clean | all missed |
| V2: D-005 "same as **d-001**" (lowercase decision id) | **not caught** (N4) | missed |
| V3: `Became` link plus a 2-level chain D-001 ← D-002 ← D-003 | I11 ×3 | missed |
| V4: phantom `Became` with S5 not done: `D-999`, `S1.q77`, a skipped `S1.q2`, `D-001, D-998` in a list | I13 ×4 with the exact message | missed |
| V4: `Became = d-997` (lowercase), and a brief row whose id is lowercase `u-07` (unverified, `Became` D-001) | not checked: the row is not a brief item, so neither I11 nor I13 fires (N4) | missed |
| V6: `designer_filled` D-002 "per D-001", where D-001 is `assumed` and has a marker in its text | **not caught** (N5) | missed |

### A12 (regulation source age): PASS

| Line | Result |
|---|---|
| Read 690 days ago, fresh amend-check | I6 `Regulation source was read 690 days ago (limit 60)…` |
| Law enacted 2022 (`pub 2022-10-17`), read 7 days ago, fresh amend-check | clean |
| Read 61 days ago / 60 days ago | I6 / clean (the boundary is correct) |
| `live` flag, read 200 days ago | I6 (`live` gives no bypass) |
| amend-check before `pub 2022` (year only), or before `upd 2026-11-01` | I5 `Amendment check … is before the published date …` |
| amend-check 10 days ago, before the source was read 5 days ago | clean. I rule this **allowed**: you can search for amendments by the law's name before reading its text, and both dates are inside 60 days. Please document it (N6) |
| A group of an old-read cite that has the amend-check and a fresh-read cite (another domain) that has none | clean, because the group takes the newest of each date (N6) |

HEAD misses the 690-day case.

### A13 (brief freshness gate in every S1–S5 scan): PASS

The text says the same thing in all five places:

- init engine 1b, now four ordered steps with "do not show or ask anything before step 4"
- `S0-domain-brief.md` §2
- conventions §10
- spec 07 §2
- continue Step 5b

The text names the command (`cite check --file .lvr/docs/research/domain-brief.md`), the ids to act on (I6/I7/I8/I10), the selector (`owner` = this Section and `Became` empty), the loop ("re-run until none is left"), the failure branch (a marker, then a question) and the journal shape (`context_research`, scan, `note` "refresh"). Each of these is mechanical. You can test it from the journal: the refresh events have to come before the scan event and before any `answer_recorded`. The loop ends, because a fresh failed RQ does not trigger I10.

One gap: a Section that is resumed after more than 30 days, with items still not presented, does not re-run the gate (N11).

### A14/A15 (an outage is not failed research): text PASS, script FAIL → B1

The text is consistent and unambiguous:

- spec §1.0
- conventions §10
- init engine step 3 and the S5 booster line
- `S5-research.md`
- `S0-domain-brief.md` §1/§4
- continue Step 4b

Every path that names an outage says to stop. One 403 is explicitly not an outage (try 3 results, then 3 results of a reworded query). `failed` requires that search and fetch both worked.

**B1, the hole:** spec §1.0 tells the Conductor to journal an outage as `research_logged` with `purpose: "web_check"` and `outcome: "failed"`. `researchIndex` treats any failed event that has queries as valid backing for a marker, and that includes the web_check event.

- V5: `Gateway fee is 2% per transaction [unverified: price · RQ-001]`, where RQ-001 is a failed web_check whose reason is "WebSearch tool error: not permitted". The marker passes with no I9.

So a run that logs the outage and then carries on with markers that point at it passes `cite check`, lint group I and X8. That contradicts the normative rule in §1.0, "never write an `[unverified: …]` marker for it". It is a contract miss inside a Must item.

Wording paths I found, all advisories:

- (a) Spec §1.0 excludes "0 results" from the outage definition. A search backend that silently returns nothing for every query (an exhausted quota, for example) is therefore logged as `failed`, and fetch was never exercised (N7).
- (b) Engine 1b step 3 says "a search or fetch tool error … stop" but omits the "one site's 403 is not an error" carve-out. This errs on the safe side: it causes a false stop, not a false continue (N7).

## 2. Should items (A4–A11, A16–A19): PASS

Every item is caught, or explicitly allowed in spec 07 §6.2/§8.2. Fixture 40 has one case per advisory with exact messages, plus the re-run of the ticket-26 adversarial table: every "out of contract" row is now caught or documented as allowed.

My new variants (`should.mjs`):

| Variant | Result |
|---|---|
| `rp 50.000`, `5 juta rupiah`, `IDR50rb`, `Rp 50.000`, `USD 20`, `` `Rp 50.000` `` (inline code in a zone), `Rp 50.000 <!-- [cite…] -->` (a cite hidden in a comment) | I1 price |
| `DSR maksimal 30%`, `Biaya admin 2,5 %`, `Uang Muka 20%`, `LTV-80%`, `Rate 7.5 % per year` | I1 fee or rate |
| `http://localhost/x`, `https://x`, `https://192.168.1.10/x`, `http://0x7f.0.0.1/x`, `http://2130706433/x` (WHATWG normalises both to 127.0.0.1) | I3 public-host |
| `Setahu Saya`, `Dari Ingatan saya`, `TANPA CEK ulang`, `Berdasarkan pengalaman` | I2 ×4 |
| A fee line with `[unverified: market · RQ-001]` | I3 category fit. A `market`+`price` mix gives I3 mixed categories. A price tagged `legal` is allowed (documented) |
| `##   PRICES QUOTED  ` and a nested `### Prices quoted` in S2 | zone → I1 |
| `research log`: `published: "2026-12"` (a future month), `updated` > `accessed`, a `10.0.0.1` source, `failed` with sources, `purpose` on `context_research`, a brief `failed` + `[]` + blank note | each one refused with the right `details.field`. A brief `failed` + `[]` + a note is accepted (A11) |
| A18: a duplicated RQ-001 event | `journal check` reports `healthy:false` and `duplicate_rq_ids:["RQ-001"]` |

**New evasions (advisories):**

- **`Rp. 50.000` and `Rp.50.000` are missed.** This is the most common Indonesian way to write a price. Fix: `[Rr][Pp]\.?\s?\d` (N1).
- `20€`, where the symbol follows the number (N2).
- `uang  muka` with a double space (N2).
- The memory phrases `seingat saya` and `menurut pengetahuan saya` (N3).
- `localhost.localdomain` and reserved test domains such as `example.com` pass as hosts (N10).
- Out of scope, and I accept that: homoglyphs (`5O.000`, Cyrillic `р`), numbers written as words (`lima juta rupiah`), and a price with no currency mark (`50 ribu`).

## 3. A5 deviation (zones limited to OVERVIEW, SPEC/architecture, SECURITY, CAPABILITIES): partially accepted → B2

Keeping whole-file zones out of the user-value files is acceptable. I reproduced the noise: with every file as a zone (`wz/`), the re-sourced futsal fixture produces 34 more I1 findings. Almost all of them are the user's own values:

- the DP of 30%
- `Rp 0` estimates
- the `Rp 150.000/hour` test data

**But an unsourced external price does reach the builder unflagged:**

- **Plants (`a5.mjs`):** `Midtrans fee Rp 4.000 per transaction` and `Vercel Pro USD 20/month` in SPEC/requirements.md, `Supabase Pro USD 25/month` in MILESTONES.md, `Stripe fee 2.9% + USD 0.30` in AGENTS.md, and `Vercel Pro USD 20/month` in an S2 section outside `## Prices quoted`. None gives a finding. A tagged but stale price outside the zones is still I6, because tags are checked everywhere; only untagged prices slip through.
- **The canonical fixture itself:** the re-sourced futsal is certified as "0 findings". It still contains `designer_filled` D-002 ("Apple USD 99/yr, Google USD 25") and D-007 (".com USD 12.08 / USD 19.98, verified 2026-11-07, namecheap.com") in DECISIONS.md, ASSUMPTIONS.md (3 lines) and the S1/S2 record lines. These are researched vendor prices with no cite tag, so they will go stale without anything noticing.
- **The model fallback does not cover them either.** The `needs_model` I1 text reads "Check prose facts the script cannot see (**no number**: …)", which steers the model check away from numeric prices.

D12 says "every … filled decision rests on live research … set freshness limits". This case is exactly that, so it is **BLOCKING (B2)**.

The impl note says the 42 findings were "almost all the user's own design values … none a researched fact". The second half is not correct: D-007's price is a researched fact.

**Proposed narrow rule (prototype in `nr/scripts/lvr.mjs`):**

- **Where:** outside the zones, in every scanned file.
- **When it fires:** I1 `price` on a line where the currency detector fires with a **non-zero** amount **and** a billing or vendor cue is present. The cues are `/yr|/year|/mo|/month|/bulan|/tahun`, `per month|year|seat|user|bulan|tahun`, and `fee|fees|biaya|plan|tier|paket|subscription|langganan|renew|renewal|perpanjang|pricing|billed|developer account`.
- **When it does not fire:** when the line holds a cite group, a marker, or a recorded answer id.
- **Result on the re-sourced futsal:** exactly 7 findings, all real vendor prices: DECISIONS.md:8 and :13, ASSUMPTIONS.md:6, :7 and :19, S1-context.md:16 and S2-kondisi.md:18. There are **0 false positives**: `Rp 150.000/hour`, `Rp 0` and DP 30% are not flagged.
- **Result on the unsourced futsal:** 107 → 114 findings (I1 25 → 32).
- **Result on my plants:** 5 of the 6 unsourced plants are caught. Percentage-only vendor fees outside the zones (`2.9% transaction fee` in DECISIONS.md, `MDR QRIS 0.7%` in S3) stay with `needs_model` (N9).
- **Fixture follow-up:** `fixtures/26/resource.mjs` needs cites on those 7 lines, and run.sh needs the new counts.

## 4. Changed expectations in fixtures/26: PASS (stricter, not weaker)

- **Counts go up:** 101 → 107 findings and I1 19 → 25. No other id changed. The 6 new lines are real zone content:
  - OVERVIEW.md:7 and SPEC/architecture.md:19 (30% DP, user value) get `S0.q1`.
  - OVERVIEW.md:60 and SPEC/architecture.md:8, :108, :110 (Vercel prices) get the Vercel cite.
- **Marker categories:** in `resource.mjs`, the markers move from `[unverified: market · RQ-001]` to `price`. They sit on price and fee rows, where `market` was itself the A17/A18 dodge, so the move is a correction that A4 now enforces.
- **Unchanged:** the re-sourced target (0 findings, A–I clean, X1–X8 ok, I6/I10 after 101 days) and the 58 unit cases.

## 5. Regression: PASS

- `fixtures/03` rc 0; `fixtures/04` ALL PASS (104 checks); `fixtures/26` ALL PASS; `fixtures/40` ALL PASS (30 new cases, 16 baseline negative controls, text checks with HEAD negative controls).
- `fixtures/40/baseline/scripts/lvr.mjs` is byte-identical to `git show HEAD:scripts/lvr.mjs`. My own Must variants V1–V4 and A12-690d also all miss on HEAD (`head/`).
- **CLI fuzz** (6 projects × 40 random calls: `research log`, `--context`, answers, section events, 7 kinds of bad payload):
  - 171 calls accepted, 69 bad payloads refused, 0 wrong outcomes
  - `replay --compare` gives `diff: []` on every project
  - `journal check` reports healthy, with no duplicate RQ ids
- `npm run lint` rc 0: one warning, in `.scratch/public-release/research/J-signals-probe.mjs`, which is not a ticket-40 file.
- `npx tsc --noEmit` rc 0.
- `npm run check:skills` rc 0: `{"ok":true,"drift":[],"problems":[],"unchanged":28}`.
- `cmp`: `scripts/lvr.mjs`, `lvr-conventions.md`, `lvr-freshness.json` and `lvr-principles.md` against all 7 skills are identical.
- The Script-helper paragraph (number stripped) has the same md5 in all 7 SKILL.md files (`bec08f2e…`), unchanged from HEAD.

## Deviation rulings

| Deviation | Ruling |
|---|---|
| 1. A5 zones limited to OVERVIEW / SPEC/architecture / SECURITY / CAPABILITIES | **Partially accepted.** Not making the user-value files whole-file zones is right. The resulting gap for external prices is BLOCKING (B2) and needs the narrow rule above. |
| 2. A12: 60 days applies to `acc` + amend-check, not to the law's enactment date | **Accepted.** A law's `pub` date never expires. Ruling 2 says "regulation source and amend-check both 60 days", and reading "source" as the day the source was read keeps the spec's own `pub 2022-10-17` example valid. Verified: the 690-day read fails, and the 2022 law read last week passes. |
| 3. A4 allows `statistic`/`legal`/`regulation` on price lines | Accepted. The common dodges (`market`, `general`) are mechanical now, and the rest stays with `needs_model` I3. |
| 4. `Total` is the whole first word | Accepted. Verified: "Totally hidden plan" is flagged and Total rows stay exempt. |
| 5. A3: a skipped answer in `Became` is I13 | Accepted. It follows §3.4 literally. |
| 6. A refresh is a `context_research` scan with note "refresh" | Accepted. It is consistent with A10. |

## BLOCKING

- **B1: a failed web_check (outage) event backs an `[unverified: …]` marker.**
  - Contract: spec §1.0 says "never write an `[unverified: …]` marker for it [an outage]", and §1.0 itself tells the Conductor to journal the outage as a failed `web_check`.
  - What happens: `researchIndex` counts that event as failed research, so the marker passes I9, lint group I and X8.
  - Fix: in `researchIndex`, `failed` must also require `e.payload.purpose !== "web_check"`, so a marker that names it gets I9. Keep I11 conservative: a `designer_filled` decision that cites a web_check RQ can stay I11. Spec §3.3 should add "(not a `web_check`)". Add a fixture/40 case and a baseline negative control.
- **B2: an unsourced external price outside the zones reaches the builder unflagged.**
  - Contract: this contradicts D12, and the canonical futsal fixture shows it with `designer_filled` D-002 and D-007.
  - Fix: add the narrow rule from §3 (non-zero currency amount + a billing or vendor cue, outside the zones, in every scanned file), sync spec 07 §6.2 and §8.2, conventions §10 and lint-checklist I1, and update `fixtures/26` (cites on the 7 lines; counts 107 → 114, I1 25 → 32).
  - Also reword the `needs_model` I1 text so it no longer says "no number". It should cover percentages and versions outside the zones as well.

## Advisories

- **N1:** `Rp. 50.000` / `Rp.50.000` are not detected. Allow an optional `.` after `Rp`. This is the highest-priority advisory.
- **N2:** a currency symbol after the number (`20€`, `20 $`); `uang\s+muka` with more than one space.
- **N3:** add the memory phrases `seingat saya` and `pengetahuan saya`.
- **N4:** match case-insensitively:
  - `D-NNN` in decision chains ("same as d-001" is missed)
  - brief row ids (a `u-07` row escapes I11 via `Became` and I13)
  - `Became` ids (`d-997`)
- **N5:** spec §6.3 says "another decision that itself rests on an unverified fact", but the script follows only `designer_filled` decisions. A `designer_filled` "per D-001", where D-001 is `assumed` and has a marker, passes. Either extend the check to `assumed` or reword the spec to "another designer_filled decision that is itself I11", as the ticket wording has it.
- **N6:** A12 group-level pairing: the amend-check from one cite and a fresh `acc` from another cite pass together. Consider requiring both on the same cite. Also document "amend-check before `acc` is allowed".
- **N7:** A14 wording:
  - (a) when every query of a step returns 0 results, re-run the neutral web-check query, and treat it as an outage if that also returns nothing;
  - (b) add the "one site's 403 is not a tool error" carve-out to engine 1b step 3;
  - (c) optionally, require a non-web_check `failed` event to list at least one `fetch <url>` query, as evidence that fetch worked.
- **N9:** percentage-only vendor fees outside the zones (`2.9% transaction fee`, `MDR 0.7%`) stay `needs_model` even after B2. Name them explicitly in the reworded `needs_model` I1 text.
- **N10:** hosts `localhost.localdomain` and the reserved names `example.com|net|org`, `.test`, `.invalid`, `.example` pass A7.
- **N11:** A13: `/lvr-continue` should re-run the brief freshness gate when the current Section's scan event is older than 30 days and items targeted at it are still unpresented.
- **N12:** `runs/40-impl.md` deviation 1 says the extra findings are "none a researched fact". D-007's namecheap price is one. Correct the note when B2 lands.

Verdict: **FAIL until B1 and B2 are fixed.** Both are small changes; no rework of the ticket is needed.

## Re-verify after fix round 1

Scope: "## Fix round 1" in `runs/40-impl.md`, plus the script diff since my last check. The changes are:

- `CURRENCY_BEFORE` now accepts `Rp\.?`.
- New `vendorPrice` with `BILLING_CUE`.
- `researchIndex` gains `outage` and `failedEv`.
- I9 has an outage message.
- I11 uses `failedEv`.
- The I1 `kind` selection adds "vendor price" outside the zones.
- The `needs_model` I1 text is reworded.

Spec 07 (§3.3, §6.2, §6.4, §8.2), conventions §10 and the lint-checklist are synced. My scripts are `r1.mjs`, plus `must.mjs`, `a5.mjs` and `fuzz.mjs` re-run, all in `scratchpad/v40/`. I edited nothing and committed nothing.

### B1 (an outage must not back a marker): PASS

| Variant (journal: RQ-001 failed web_check · RQ-002 a later web_check that succeeded · RQ-003 a genuine failed `claim` · RQ-004 a failed web_check with `section: null`) | Result |
|---|---|
| Marker naming RQ-001 | I9 `RQ-001 is a failed web check (a tool outage), not failed research: …` |
| Marker naming RQ-003 (genuine failure) | clean: it backs the marker |
| Marker `RQ-003, RQ-001` (mixed list) | I9 outage message: one outage id in the list is enough to fail it |
| Marker naming RQ-004 (`section: null`, the init-time check) | I9 outage message |
| Marker naming RQ-002 (the later web_check that succeeded) | I9 "is not a failed … event": correct, a passing check is not a failure |
| `designer_filled` D-001 "per RQ-001", D-002 "per rq-004", D-003 "per RQ-003" | I11 ×3 (I11 still fires through an outage) |
| D-004 "per RQ-002" (succeeded web_check) | clean |

The V5 case from round 0 now gets the I9 outage message plus I11. On the HEAD script the same project gives 1 finding instead of 19.

### B2 (vendor prices outside the zones): PASS

- **The 7 vendor lines:** on the unsourced futsal they are exactly the 7 B2 findings (114 total, I1 32). On the re-sourced futsal the result is 0 findings (fixtures/26).
- **My earlier plants:** 5 of the 6 are caught now: the S2 line outside `## Prices quoted`, `AGENTS.md` Stripe, the two `SPEC/requirements.md` lines, and `MILESTONES.md` Supabase. The stale-tagged line is still I6. The percentage-only `2.9%` stays `needs_model`, and the reworded `needs_model` I1 text now names exactly that case (N9).

New variants, all outside the zones in `SPEC/requirements.md` and `MILESTONES.md`:

| Line | Result |
|---|---|
| `Apple developer account USD 99 per year` · `Hosting Rp 150.000/bulan` · `Storage €5 monthly plan` · `Rp. 25.000/bulan langganan` · `Langganan bulanan Rp 49rb` · `Supabase Pro 25 USD/month` · `Pro tier USD 0.50 per GB` · table row `Domain .com \| USD 19.98/yr \| renewal` | I1 vendor price |
| `Vercel Hobby $0 free plan` · `Plan: USD 0 now` · `Estimate: Rp 0 per month` | clean: the non-zero rule works, and `0.50` is still non-zero |
| `harga sewa lapangan Rp 100.000 per jam` · `Given a court priced Rp 150.000/hour … DP is Rp 45.000` · table row `Court rent \| Rp 100.000 per jam` · `Total per month \| Rp 300.000` | clean: no cue, or a Total row |
| `… Rp 100.000 per jam (S2.q3)` · `Budget ceiling Rp 100.000/month (S2.q3)` | clean: the answer id is the source |
| `Owner budget Rp 2 juta per month` (no id) · `Budget ceiling Rp 100.000/month (D-005)` | I1: a false positive on a user value |
| `Biaya admin per booking Rp 5.000 (owner's choice)` · `Test: set the booking fee to Rp 10.000` | I1: a false positive on a user value or test data |
| `Apple charges USD 99 to publish` (no cue) | missed: documented deviation, `needs_model` |
| `Monthly fee \| \`Rp 9.000\`` (inline code, outside the zones) | missed: inline code is ignored outside the zones, as specified |

**False-positive ruling: acceptable, not blocking.**

- A user's own budget or fee with a billing word gets flagged, and the remedy already exists and is required by the contract: the answer id on the same line (spec 07 §3.4). A `D-NNN` was never a source; ticket 26 already applies that to the OVERVIEW row.
- The futsal fixture, a realistic full bundle, has 0 false positives.
- One open edge, advisory **N13**: arbitrary test data that contains a cue word ("set the booking fee to Rp 10.000") has no natural answer id. Options:
  - name the answer id of the fee it exercises;
  - or add a narrow exemption for `VERIFICATION.md` and `Scripted tap:` / `Given … when … then` lines;
  - or document that test amounts are written without billing words.

### Changed expectations: PASS (stricter, not a dodge)

- **`fixtures/26/run.sh`:** 107 → 114 findings and I1 25 → 32, with exactly the 7 lines I listed. The lint group I and X8 totals follow. The owner set gains S1 because `S1-context.md:16` is a real finding owned by S1. Nothing was removed.
- **`fixtures/26/resource.mjs`:** inline cites are added right after each price. The script guards that each `from` string matches exactly one line, and the Status cells and `status: designer_filled` text are untouched, so the I11 and A17 paths are unaffected. The re-sourced twin is clean because the prices now have sources, not because detection was weakened.
  - Fixture-honesty advisory **N14**: "Google USD 25" is backed by the Apple developer page cite (`A`). The script cannot tell (it is `needs_model` I6), but the reference fixture should cite Google's own Play Console page for that number.
- **`fixtures/40` A19:** `- Not a zone USD 30 per month.` became `- Not a zone, a test amount USD 30.` The case tests the zone heading only. B2's flagging of an out-of-zone vendor price is asserted separately by the `B2` cases, which fail on the baseline as negative controls, and by my own variants above (the S2 line outside `## Prices quoted` is flagged). Legitimate.

### Regression: PASS

- Fixtures:
  - `fixtures/03`: rc 0
  - `fixtures/04`: ALL PASS (104 checks)
  - `fixtures/26`: ALL PASS
  - `fixtures/40`: ALL PASS (35 new cases, 20 baseline negative controls with 0 ineffective, 102 PASS lines in total)
- The baseline is still byte-identical to `git show HEAD:scripts/lvr.mjs`.
- My round-0 variants (V1–V6, A12) give the same results as before. The only change is V5, which now also gets I9 (the B1 fix). There is no regression.
- CLI fuzz (6 × 40 calls): 171 accepted, 69 bad payloads refused, 0 wrong outcomes, `replay --compare` `diff: []` on every project, journals healthy.
- `npm run lint` rc 0 (the same one existing warning, in `J-signals-probe.mjs`). `npx tsc --noEmit` rc 0. `npm run check:skills` rc 0 (`{"ok":true,"drift":[],"problems":[],"unchanged":28}`).
- `cmp`: the script, conventions, freshness and principles files against all 7 skills are identical. The Script-helper paragraph md5 is identical across all 7 SKILL.md files (`bec08f2e…`) and unchanged from HEAD.
- N1 (`Rp. 50.000`, `Rp.50.000`) is fixed: both are detected inside and outside the zones.

### BLOCKING

None. B1 and B2 are closed.

### Advisories still open

- From round 0: N2–N7, N9 (percentage-only vendor fees; now named in the `needs_model` text), N10 and N11.
- New:
  - N13: false positives on test data that contains a cue word.
  - N14: the Google price in the fixture is backed by the Apple cite.
  - N15: a vendor price with no billing word ("Apple charges USD 99 to publish") outside the zones is not detected. This is documented and left to `needs_model`.

**Overall verdict after fix round 1: PASS.**
