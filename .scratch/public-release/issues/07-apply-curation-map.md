# 07: Apply the curation map to S0–S9
Status: done (2026-11-23) · Blocked by: 05 · Type: task · Agent: Sonnet (Opus review of procedure text)

- [x] Each section procedure names the boosters it uses and how (load at start / apply as pass / reference template). Mapping per brainstorm-02 + 04.
- [x] Replace the old boosters:
  - humanizer → anti-slop (elithrar, vendored with credit)
  - karpathy merged into ponytail
  - fix the `agents.md` install line (the repo has no SKILL.md; fetch the spec text instead)
- [x] Add:
  - S1: define-problem-statement, mom-test
  - S4: deliver-edge-cases, user-stories, deliver-acceptance-criteria
  - S5: discover-competitive-analysis
  - S6: architecture-designer, threat-modeling, cost-estimator (live prices)
  - S7: prioritization
  - S8: planning-and-task-breakdown
  - S9: deliver-prd, develop-adr, api-designer, spec-kit templates
  - handoff: verification-before-completion
- [x] Add a CREDITS.md listing every booster, its license and SHA.
- [x] Keep `references/` in sync with docs/spec (the ticket 22 check).
Verify: the check script passes; a futsal re-run logs each booster load in the journal.

## Comments

- 2026-11-23: A native Codex futsal rehearsal logged all 26 selected uses across ten stages. Credits and shipped references verified. All 14 tests and shared fixture checks passed. See [verification](../runs/07-verify.md).
