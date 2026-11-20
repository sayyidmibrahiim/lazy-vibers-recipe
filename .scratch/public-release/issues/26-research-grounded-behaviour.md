# 26: Research-grounded behaviour (context research + freshness)
Status: done (2026-11-20) · Blocked by: 02 · Type: task · Agent: Opus (principle + procedure text) → Sonnet (script)
Decisions D11, D12. This changes every section, so it lands before M2.

## A. Context research loop (unknown-unknowns), D11
- [x] New principle 14: **"Research what the user doesn't know."**
  - The user rarely knows the domain and rarely says what they don't know.
  - The agent researches it; model memory never fills that gap.
- [x] After S0: a **Domain Brief** in `.lvr/docs/research/domain-brief.md`, built from live research on the idea's domain. It covers:
  - rules/regulations for the user's country
  - typical costs and hidden fees
  - common failure modes and pitfalls
  - key terms
  - what similar users usually expect
  - Example (KPR house-hunter): OJK/BI rules, DSR norms, BI rate and current KPR rates, BPHTB/notary/provision fees, SLIK checks, fixed vs floating traps.
- [x] Before each section's first batch: re-scan the brief and the latest answers for section-specific unknowns, with targeted searches.
- [x] Each finding is shown to the user as "Things you may not know" (in the User Language), with source + date. It then becomes either:
  - a question (when the user must choose), or
  - a `designer_filled` decision that cites the research (when there is a safe default).
- [x] Journal `context_research` (query, sources, findings ids).

## B. Research-grounded answers + freshness, D12
- [x] Principle 1 is strengthened, and the S5 "model-knowledge fallback" is removed.
  - Every factual claim, recommendation, price, regulation, version or statistic carries: source URL, publication/updated date, access date.
  - **Freshest source wins.** When sources disagree, use the newest primary source and record the conflict.
  - **Cross-check:** key facts (prices, regulations, legal/financial numbers, framework versions, quotas/limits) need ≥2 independent sources, or 1 primary official source.
  - **Freshness limits** (in `references/freshness.json`):
    - prices/quotas ≤ 30 days
    - regulations: confirm no newer amendment
    - versions/releases: live
    - market/competitor data ≤ 12 months
    - beyond the limit → re-research
- [x] Web research becomes a **hard requirement**: it is a core capability, not "degraded-optional".
  - If the harness has no web access: explain the cause and how to enable it, then stop.
  - Never continue on memory.
- [x] `unverified` is allowed only after research actually failed, with the queries tried recorded.
  - A decision that depends on an `unverified` fact cannot be `designer_filled`. The user must confirm it, or it becomes an S6 blocking risk.
- [x] Recommendations (stack, framework, storage, boosters) cite the research that drove them. "Best practice" with no source is not allowed.

## C. Script support
- [x] `lvr.mjs cite check <file>` scans section records and bundle files for claims without source/date and for expired freshness. It outputs a JSON report. The S9 crosscheck + handoff lint call it.
- [x] `lvr.mjs research log` appends query + sources to the journal (keeps the research auditable and resumable).

## D. Spec/doc sync
- [x] principles.md (14 principles), conventions §, spec 02 (S0 brief, per-section scan, S5 without fallback), 05-boosters (web search = core capability), GLOSSARY ("Domain Brief", "freshness limit"). Sync every `references/` copy.

Verify:
- KPR dry run: the Domain Brief surfaces ≥8 unknowns with sources ≤90 days old for rates/fees, and the interview asks about or fills each one.
- Futsal re-run: zero claims without sources (`cite check` = 0).
- A harness without web stops with guidance instead of continuing.

## Comments
- 2026-11-20: done. Phase 1 Opus xhigh (skill text + contract `docs/spec/07-research.md`), phase 2 Sonnet high (`cite check`, `research log`, group I in `lint run`, crosscheck X8, E4/X6 defer to group I, ADR-0007). Run files: `runs/26-impl.md` (incl. orchestrator rulings on 9 open questions), `runs/26-verify.md`.
- Verifier Opus high: PASS, nothing blocking. Every box A–D met in the text; S5 model-knowledge fallback gone everywhere; every contract case caught in the adversarial table.
- Dry runs: KPR Domain Brief 12 items, clean after one forced re-research; no-web harness stops; gate proceeds in place in the created subfolder.
- Evidence: fixtures/26, 04, 03 run.sh all PASS (fixtures/04 edits legitimate: futsal-fixed 5 cost cells re-sourced per ruling 7, no expected result changed); futsal unchanged → 101 findings, re-sourced copy → 0; lint/tsc/check:skills 0; all copies cmp-equal.
- Advisories A1–A19 (contract holes, each with a proposed rule) → new ticket 40, run next.
