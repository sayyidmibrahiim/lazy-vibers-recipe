# S5 research guide — Deep research

Work guide for Section S5. The English text is the source; research runs on English sources plus the primary local sources of the user's market, and findings are summarized in English (conventions §4). S5 is mostly Conductor work — the few user questions are at the bottom. Record: `PROJECT_DIR/.lvr/docs/sections/S5-research.md`; findings are appended to it per sub-query, never held whole in context (principle 13).

Web research is required (principle 14). On a search or fetch outage, stop with enablement guidance. Load `discover-competitive-analysis` for the scan. If the skill is unavailable, use the internal procedure with live web tools and record that aid as degraded.

## Claim discipline (principles 1 and 14)

- Every claim line or row carries a cite group (conventions §10): `<claim> [cite: <category> · <url> · <pub|upd date or n.d.> · acc <date>( · primary)( · live)]`. Key facts (`price`, `quota`, `version`, `legal`, `regulation`) need one primary source or two independent sites; regulations carry `amend-check`.
- Research that really fails: log it (`LVR research log`, `outcome: "failed"`, the queries and the reason), then write `[unverified: <category> · RQ-NNN]`. A recommendation or `designer_filled` decision never rests on it: ask the user, or S6 treats it as a blocking risk.
- Log every research step with `LVR research log --in -` (`purpose: "s5"`); when sources disagree, record the conflict (`conflicts[]`) and keep the freshest primary source.
- Reuse what S2 or the Domain Brief already cited: copy the tag with the claim. A copied tag past its freshness limit is researched again (the `cite check` I6 finding).
- Recommendations cite the research they rest on (a `U-NN` item or a cite tag); "best practice" alone is never a reason.
- Before S5 closes: `LVR cite check --file .lvr/docs/sections/S5-research.md` is clean.

## Sub-query plan (chunking by tier, conventions §7)

T1 runs the four outputs as full queries. T2 splits each output into sub-queries and appends findings to the record before the next sub-query starts. T3 runs one sub-topic per turn and appends every step. The file on disk is the memory; `/lvr-continue` resumes from the last complete sub-query.

1. **Competitor scan**: (a) products that solve the S1 problem statement; (b) each one's pricing model; (c) adjacent tools and the workarounds people tolerate today (the S1 workaround answer names one).
2. **Stack options**: (a) hosting/deploy candidates against the S2 budget + hands-on answers; (b) data/auth layers against the S3 answers; (c) what the S4 must-features demand (files? background jobs? offline?).
3. **Recommended stack**: one pass tying candidates to the recorded answers — no new research, just the tie-break.
4. **Cost table**: (a) recurring costs of the recommended stack, built on the fact-sheet rows; (b) payment-gateway availability in the user's market (S2 country answer + S3 payments answer); (c) store fees when S1 puts a store in play.

## Output templates

Competitor scan — ≥3 rows; direct = solves the same problem, adjacent = the workaround users tolerate:

| Product | What it does | Pricing model | Lesson for this idea | Source |
|---|---|---|---|---|

Stack trade-offs — ≥2 candidates; the recommendation is argued after the table, not inside it, and cites the rows and items it rests on (`cite check` I12 flags a recommendation section with no citation). Factual cells (prices, limits, availability) carry their cite group in the cell:

| Dimension | Option A | Option B |
|---|---|---|
| Fits the S2 budget ceiling | | |
| Fits the S2 hands-on/maintenance answer | | |
| Covers the S3 auth/payments answers | | |
| Carries the S4 must-features | | |
| Regional availability | | |
| Maintenance burden | | |

Cost table — build on the S2 record's `## Prices quoted` rows (copy their tags); add what is new. Every row's Source cell holds a cite group, an `[unverified: …]` marker, or the answer id of a user-stated cost:

| Item | Price | Type | Source |
|---|---|---|---|

Plus a `## Regional availability` subsection: payment gateways that work in the user's market, store availability when a store is in play, and data-location constraints inherited from S2/S3.

## User questions (rare, targeted — `S5.qNN` ids in ask order)

Bank order is not ask order; ask only when a finding needs a fact no record holds. Controls (skip, "enough for this Section") follow the engine.

### 1. Which competitor matters
- **Ask:** "Of these, which one do people actually compare you against today?"
- **Why it matters:** the lesson rows rank against the rival in the user's head, not the biggest name.

### 2. Regional constraint check
- **Ask:** "<finding> — does this apply to you?" (when research surfaces a regional rule the records do not cover)
- **Why it matters:** regional rules prune stacks harder than price does.

### 3. Does the new cost fit
- **Ask:** "The stack I would recommend adds <X> per month. Does that still fit your ceiling?"
- **Why it matters:** a cost surprise belongs on the table now; one the user does not resolve lands in S6 as a blocking risk.
