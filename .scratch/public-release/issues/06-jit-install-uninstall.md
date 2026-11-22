# 06: Just-in-time native install + cleanup
Status: done (2026-11-23) · Blocked by: 05, 18 · Type: task · Agent: Sonnet
Decision D4: real installs only, never "read the file".

- [x] Before a section starts, install its missing conditional boosters with the harness's native mechanism. Use project-local scope when the harness supports it (`.agents/skills`, `.claude/skills`, …).
- [x] Record each install in state: `boosters.installed[]` with scope, path and SHA.
- [x] A failed install keeps the existing choice: help / degraded / stop.
- [x] At pipeline end (after handoff), ask: "Uninstall N boosters installed for this project?" Uninstall only those Recipe installed; never touch user-owned skills.
- [x] MCP boosters (Playwright, Firecrawl) always need explicit consent.
- [x] A/B check: run S4 on the fixture with a booster installed vs. absent (degraded). Document the quality delta that justifies each core booster.
Verify:
- After uninstall, the project dirs match their pre-run state.
- User-global skills are untouched.

## Comments

- 2026-11-23: Verified native Codex staging, tracked project-local deployment, consent-gated cleanup, and original project/global skill preservation. The same-context futsal feature-capture comparison covered 2 of 5 cases with the internal guide and 5 of 5 with the installed aids. All seven lifecycle checks and shared regression checks passed. See [verification](../runs/06-verify.md).
