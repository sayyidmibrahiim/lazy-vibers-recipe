# 19: Verify on 3 OS × ≥4 harnesses
Status: needs-info (2026-11-23) · Blocked by: 02, 06, 18 · Type: task · Agent: Sonnet + owner
- [x] Prepare the CI matrix (Windows, macOS, Ubuntu) and portable `lvr.mjs` tests for paths, line endings, and atomic writes in the original workspace.
- [ ] Manual or scripted install + S0–S2 run on Claude Code, Codex, Gemini CLI and opencode, plus at least one Windows host.
- [ ] Booster just-in-time install/uninstall verified per harness.
Verify: a PASS/FAIL table in Comments.

## Comments

| Check | Result |
|---|---|
| Node 22 and 24 Linux platform tests | PASS |
| Linux Codex installed S0–S2 and pinned booster lifecycle | PASS scripted |
| Claude Code, Gemini CLI, OpenCode | PENDING owner |
| macOS and Windows runner evidence | PENDING owner |

The matrix workflow, platform tests, `19-impl.md`, and `19-verify.md` are in the original cloud workspace. The remote runners still need evidence. [Repository handoff](../../../docs/agents/continuation.md)
