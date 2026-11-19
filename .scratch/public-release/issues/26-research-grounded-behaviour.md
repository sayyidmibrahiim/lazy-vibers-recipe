# 26: Research-grounded behaviour (context research + freshness)
Status: ready-for-agent · Blocked by: 02 · Type: task · Agent: Opus (principle + procedure text) → Sonnet (script)
Decisions D11, D12. This changes every section, so it lands before M2.

## A. Context research loop (unknown-unknowns), D11
- [ ] New principle 14: **"Research what the user doesn't know."**
  - The user rarely knows the domain and rarely says what they don't know.
  - The agent researches it; model memory never fills that gap.
- [ ] After S0: a **Domain Brief** in `.lvr/docs/research/domain-brief.md`, built from live research on the idea's domain. It covers:
  - rules/regulations for the user's country
  - typical costs and hidden fees
  - common failure modes and pitfalls
  - key terms
  - what similar users usually expect
  - Example (KPR house-hunter): OJK/BI rules, DSR norms, BI rate and current KPR rates, BPHTB/notary/provision fees, SLIK checks, fixed vs floating traps.
- [ ] Before each section's first batch: re-scan the brief and the latest answers for section-specific unknowns, with targeted searches.
- [ ] Each finding is shown to the user as "Things you may not know" (in the User Language), with source + date. It then becomes either:
  - a question (when the user must choose), or
  - a `designer_filled` decision that cites the research (when there is a safe default).
- [ ] Journal `context_research` (query, sources, findings ids).

## B. Research-grounded answers + freshness, D12
- [ ] Principle 1 is strengthened, and the S5 "model-knowledge fallback" is removed.
  - Every factual claim, recommendation, price, regulation, version or statistic carries: source URL, publication/updated date, access date.
  - **Freshest source wins.** When sources disagree, use the newest primary source and record the conflict.
  - **Cross-check:** key facts (prices, regulations, legal/financial numbers, framework versions, quotas/limits) need ≥2 independent sources, or 1 primary official source.
  - **Freshness limits** (in `references/freshness.json`):
    - prices/quotas ≤ 30 days
    - regulations: confirm no newer amendment
    - versions/releases: live
    - market/competitor data ≤ 12 months
    - beyond the limit → re-research
- [ ] Web research becomes a **hard requirement**: it is a core capability, not "degraded-optional".
  - If the harness has no web access: explain the cause and how to enable it, then stop.
  - Never continue on memory.
- [ ] `unverified` is allowed only after research actually failed, with the queries tried recorded.
  - A decision that depends on an `unverified` fact cannot be `designer_filled`. The user must confirm it, or it becomes an S6 blocking risk.
- [ ] Recommendations (stack, framework, storage, boosters) cite the research that drove them. "Best practice" with no source is not allowed.

## C. Script support
- [ ] `lvr.mjs cite check <file>` scans section records and bundle files for claims without source/date and for expired freshness. It outputs a JSON report. The S9 crosscheck + handoff lint call it.
- [ ] `lvr.mjs research log` appends query + sources to the journal (keeps the research auditable and resumable).

## D. Spec/doc sync
- [ ] principles.md (14 principles), conventions §, spec 02 (S0 brief, per-section scan, S5 without fallback), 05-boosters (web search = core capability), GLOSSARY ("Domain Brief", "freshness limit"). Sync every `references/` copy.

Verify:
- KPR dry run: the Domain Brief surfaces ≥8 unknowns with sources ≤90 days old for rates/fees, and the interview asks about or fills each one.
- Futsal re-run: zero claims without sources (`cite check` = 0).
- A harness without web stops with guidance instead of continuing.
