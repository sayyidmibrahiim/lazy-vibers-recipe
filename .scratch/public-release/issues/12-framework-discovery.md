# 12: Framework discovery (S5b)
Status: ready-for-agent · Blocked by: 02, 08 · Type: task · Agent: Sonnet
Source: research/J (+ J-signals-probe.mjs, J-candidates.json).

- [ ] `lvr.mjs signals <candidates>`:
  - Sources: GitHub, npm, deps.dev, PyPI, crates, pub, OSV, OpenSSF Scorecard, endoflife.date, Context7, llms.txt.
  - Handle rate limits (60/h unauthenticated → cache + optional token), monorepo tags, Context7 mismatches, GitHub/npm version skew.
- [ ] Procedure:
  1. Candidate pool per profile.
  2. Hard filters.
  3. Script signals.
  4. Weighted 7-criteria matrix with user-persona shifts.
  5. Tie-break.
  6. AI writes the top 3 with trade-offs.
  7. User picks.
  8. Decision recorded with `recheck_by`.
- [ ] The seed candidate list per profile is kept in `references/frameworks.json`.
Verify: a fixture run gives the same ranking on cached signals; every signal is cited with its date.
