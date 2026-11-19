# 22: CI + tests
Status: ready-for-agent · Blocked by: 02, 04 · Type: task · Agent: Sonnet
- [ ] Manifest load-checks for every harness CLI available in CI (`claude plugin validate .`, codex marketplace add in a scratch CODEX_HOME, `npx skills add <repo> --list`); see runs/18-impl.md (from ticket 18).
- [ ] `node --test` for lvr.mjs: replay, lint, gate, signals (cached).
- [ ] `npm run check:skills`:
  - references are byte-synced with docs/spec
  - frontmatter is valid
  - every `/lvr-*` reference resolves
  - boosters.json, agents.json and profiles pass their schemas
  - no stray `lvp`
  - links resolve
- [ ] GitHub Actions: lint, tsc, build, tests, check:skills, plus the OS matrix (ticket 19).
