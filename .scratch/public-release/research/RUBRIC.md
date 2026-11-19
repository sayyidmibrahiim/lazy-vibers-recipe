# Skill curation rubric (measurable)

Gate (fail = excluded): permissive license (MIT/Apache/BSD/CC-BY; NC → runtime-only, flag) · repo reachable · SKILL.md (or equivalent) actually read.

Score each 0–2, total /20:
1. Actionability — concrete steps/procedure, not vibes.
2. Output contract — defines an output template/structure we can feed into a bundle file.
3. Self-verification — checklist, exit criteria, or validation step.
4. Non-technical-user fit — plain language, interview-friendly.
5. Harness-agnostic — no hard dependency on one harness's private features.
6. Token efficiency — SKILL.md size (≤8 KB=2, ≤20 KB=1, >20 KB=0) + progressive disclosure via references/.
7. Deterministic helpers — ships scripts/validators that offload work from the model.
8. Evidence — evals/tests/examples in repo.
9. Maintenance — last commit ≤6 months=2, ≤12=1, else 0.
10. Adoption — stars/installs (tiebreak signal only: ≥1k=2, ≥100=1).

Overlap rule: when 2+ skills do the same job, keep the highest score; tie → smaller + more permissive. Record losers with score.
