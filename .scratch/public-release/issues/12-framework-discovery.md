# 12: Framework discovery (S5b)
Status: done (2026-11-23) · Blocked by: 02, 08 · Type: task · Agent: Sonnet
Source: research/J (+ J-signals-probe.mjs, J-candidates.json).

- [x] `lvr.mjs signals <candidates>`:
  - Sources: GitHub, npm, deps.dev, PyPI, crates, pub, OSV, OpenSSF Scorecard, endoflife.date, Context7, llms.txt.
  - Handle rate limits (60/h unauthenticated → cache + optional token), monorepo tags, Context7 mismatches, GitHub/npm version skew.
- [x] Procedure:
  1. Candidate pool per profile.
  2. Hard filters.
  3. Script signals.
  4. Weighted 7-criteria matrix with user-persona shifts.
  5. Tie-break.
  6. AI writes the top 3 with trade-offs.
  7. User picks.
  8. Decision recorded with `recheck_by`.
- [x] The seed candidate list per profile is kept in `references/frameworks.json`.
Verify: a fixture run gives the same ranking on cached signals; every signal is cited with its date.

## Comments

Seven focused checks passed. Cached rank and journal replay match on repeat. Live npm, PyPI and pub.dev were verified, with other source cases covered by fixtures. The shared regressions passed. See [implementation](../runs/12-impl.md) and [same-context verification](../runs/12-verify.md).
