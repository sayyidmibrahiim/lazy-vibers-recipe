# 06: Just-in-time native install + cleanup
Status: ready-for-agent · Blocked by: 05, 18 · Type: task · Agent: Sonnet
Decision D4: real installs only, never "read the file".

- [ ] Before a section starts, install its missing conditional boosters with the harness's native mechanism. Use project-local scope when the harness supports it (`.agents/skills`, `.claude/skills`, …).
- [ ] Record each install in state: `boosters.installed[]` with scope, path and SHA.
- [ ] A failed install keeps the existing choice: help / degraded / stop.
- [ ] At pipeline end (after handoff), ask: "Uninstall N boosters installed for this project?" Uninstall only those Recipe installed; never touch user-owned skills.
- [ ] MCP boosters (Playwright, Firecrawl) always need explicit consent.
- [ ] A/B check: run S4 on the fixture with a booster installed vs. absent (degraded). Document the quality delta that justifies each core booster.
Verify:
- After uninstall, the project dirs match their pre-run state.
- User-global skills are untouched.
