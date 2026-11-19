# 31: "Live/done" definition per product type
Status: ready-for-agent · Blocked by: 09 · Type: task · Agent: Sonnet
- [ ] Each profile gets `release_check`. Rule: installable + runs from a clean environment, plus type-specific proof:
  - web: URL 2xx
  - CLI: npm/PyPI install + `--help`
  - MCP: client lists the tools
  - n8n: workflow imports + test execution
  - skill/plugin: install on 1 harness + trigger
  - extension: store/unpacked load
  - mobile: store/TestFlight build
  - game: build runs
- [ ] Used by build's deployment check and by personal-brand's gate.
