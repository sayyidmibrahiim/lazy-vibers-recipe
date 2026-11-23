# 31: "Live/done" definition per product type
Status: done (2026-11-23) · Blocked by: 09 · Type: task · Agent: Sonnet
- [x] Each profile gets `release_check`. Rule: installable + runs from a clean environment, plus type-specific proof:
  - web: URL 2xx
  - CLI: npm/PyPI install + `--help`
  - MCP: client lists the tools
  - n8n: workflow imports + test execution
  - skill/plugin: install on 1 harness + trigger
  - extension: store/unpacked load
  - mobile: store/TestFlight build
  - game: build runs
- [x] Used by build's deployment check and by personal-brand's gate.

## Comments

`node --test tests/lvr/release.test.mjs` verifies all ten profiles through installed skill copies, clean-environment evidence, web failures, multi-type records and replay. A local package install and `--help` passed in a disposable project. Shared regressions passed. See `runs/31-impl.md` and `runs/31-verify.md`.
