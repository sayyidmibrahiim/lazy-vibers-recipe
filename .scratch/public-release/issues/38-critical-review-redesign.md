# 38: lvr-review-plan — critical, consistent plan review (rename of recheck-plan, R4)
Status: ready-for-agent · Blocked by: 02, 26, 27 · Type: task · Agent: Opus (skill text) → Sonnet (scripts)
Source: research/L-critical-review-design.md §5 (the full design). Owner requirement: critical, honest, gap-hunting, several steps ahead, skeptical, assume-worse; ONE review must catch all gaps and give all fixes; on re-run be honest; apologize for anything missed earlier.

- [ ] 15 lenses, including:
  - truth + freshness, unknown-unknowns, product-type packs, scope
  - **builder dry-run**, data, security/ToS, cost ×10/×0.1
  - schedule with outside-view uplift, one-way doors, coherence
  - testability, FMEA, UX completeness, second/third-order + pre-mortem
- [ ] A coverage matrix of lens × bundle file. Every required cell must end as:
  - findings, or
  - clean + a verbatim quote, or
  - n/a + a reason
  `lvr review coverage` rejects fabricated quotes.
- [ ] An anchored 0–10 scale. Severity is a lookup (impact × likelihood, FMEA detectability), so the score is a pure function of the findings: the same plan always gets the same score.
- [ ] Single-pass protocol:
  - P0 inventory → P1 sweep → P2 pre-mortem (3 horizons) → P3 consequence chains
  - P4 fix closure with an **apply-all simulation**
  - P5 saturation passes until 0 new findings
  - P6 score
- [ ] Ledger `.lvr/review/LEDGER.jsonl` with stable hash ids.
- [ ] Run-N: a blind sweep first, then reconcile. Each new finding is classified as:
  - `new-due-to-change`
  - `world-changed`
  - `missed-earlier`
  - `checklist-gap`
- [ ] The last two require: an **apology** + a root cause + a learned check (`learned-checks.md`) so the gap can never be missed again.
  - Show `score_now` and `score_if_caught_in_run1`.
- [ ] Stability: unchanged files mean identical scores. Otherwise every delta must be explained, or the report is blocked (SCORE-DRIFT).
- [ ] Honest verdicts:
  - BUILD-READY / FIX-THEN-BUILD / NOT-READY
  - clean = say so with evidence, never pad
  - gaps = never soften
- [ ] Anti-sycophancy rules (§5.11).
- [ ] Review is read-only (R3); add `--apply` mode that applies user-approved fixes, then re-runs the affected lenses.
- [ ] An optional fresh-context pass through a subagent, labelled honestly.
- [ ] A `--scope-only` light review at the S7 lock.
- [ ] Optimism correction (uplift table), labelled as a heuristic. Do not hard-code the unconfirmed Flyvbjerg figures.
- [ ] Scripts: `lvr review snapshot|claims|coverage|ids|ripple|verify|ledger-diff|score|stability|render|freshness`.
Verify (§5.14):
- Run twice on an unchanged fixture: byte-equal report.
- Mutate one price: only L01/L08 + ripple change, classified `new-due-to-change`.
- Plant a gap, hide it from run 1, reveal it in run 2: classified `missed-earlier` + apology + learned check.
