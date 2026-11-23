# Ticket 19 — same-context verify

| Platform or harness | Result | Evidence |
|---|---|---|
| Linux, Node 22.23.5 and 24.22.3 | PASS | All three portable CLI tests passed on both versions. |
| GitHub Actions configuration | PASS local validation | YAML parses and contains six OS and Node pairs with the portable test and byte-sync check. Remote runners require published workflow evidence. |
| Linux, Codex / Skills CLI 1.9.0 | PASS scripted | The installer found seven skills and installed the selected init skill into .agents/skills. The installed helper recorded S0–S2, loaded pinned grilling in the native layout, approved project-local cleanup in the disposable copy and replayed with no diff. |
| Claude Code, Gemini CLI, OpenCode | PENDING owner | Executables and authenticated sessions are unavailable in this workspace. |
| macOS and Windows | PENDING owner | The current workspace is Linux. The three OS workflow is prepared for a runner. |

The Codex smoke used synthetic details and recorded the supplied answers directly through the installed helper. No external product services or live deployments participated. The fixture and workflow are ready to rerun.
