# 22: CI + tests
Status: done (2026-11-23) · Blocked by: 02, 04 · Type: task · Agent: Sonnet
- [x] Manifest load-checks for every harness CLI available in CI (`claude plugin validate .`, codex marketplace add in a scratch CODEX_HOME, `npx skills add <repo> --list`); see runs/18-impl.md (from ticket 18).
- [x] `node --test` for lvr.mjs: replay, lint, gate, signals (cached).
- [x] `npm run check:skills`:
  - references are byte-synced with docs/spec
  - frontmatter is valid
  - every `/lvr-*` reference resolves
  - boosters.json, agents.json and profiles pass their schemas
  - no stray `lvp`
  - links resolve
- [x] GitHub Actions: lint, tsc, build, tests, check:skills, plus the OS matrix (ticket 19).

## Comments

Clean export passed fresh install, metadata checks, tests, typecheck and build. Real Claude manifest validation and Skills CLI discovery passed locally. The container and OS workflows are prepared for remote runs. [Implementation](../runs/22-impl.md) · [same-context verification](../runs/22-verify.md).
