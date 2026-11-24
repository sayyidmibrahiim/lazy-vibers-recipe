# Ticket 19 — same-context verify

| Platform or harness | Result | Evidence |
|---|---|---|
| Linux, Node 22.23.5 and 24.22.3 | PASS | All three portable CLI tests passed on both versions. |
| GitHub Actions configuration | PASS local validation | YAML parses and contains six OS and Node pairs with the portable test and byte-sync check. Remote runners require published workflow evidence. |
| Linux, Codex / Skills CLI 1.9.0 | PASS scripted | The installer found seven skills and installed the selected init skill into .agents/skills. The installed helper recorded S0–S2, loaded pinned grilling in the native layout, approved project-local cleanup in the disposable copy and replayed with no diff. |
| Claude Code, Gemini CLI, OpenCode | PENDING owner | Executables and authenticated sessions are unavailable in this workspace. |
| macOS and Windows | PENDING owner | The current workspace is Linux. The three OS workflow is prepared for a runner. |

The Codex smoke used synthetic details and recorded the supplied answers directly through the installed helper. No external product services or live deployments participated. The fixture and workflow are ready to rerun.

## Recovery-branch runner evidence

- PASS — The platform tests passed on Linux, macOS, and Windows on both Node versions in [the GitHub Actions run](https://github.com/sayyidmibrahiim/lazy-vibers-recipe/actions/runs/45274763720).
- FAIL — Both Windows jobs failed only at byte-sync. Linux and macOS passed both steps. The source LF attributes address the checkout difference while keeping byte-for-byte sync strict.
- PENDING — Verify both Windows jobs on the updated commit and observe native S0–S2 and booster operations on Claude Code, Gemini CLI, and OpenCode.

## Installed helpers and repaired matrix

- PASS — [The master matrix run](https://github.com/sayyidmibrahiim/lazy-vibers-recipe/actions/runs/45298129944) finished both the CLI tests and byte-sync on all six combinations of Linux, macOS, Windows, Node 22, and Node 24. A separate `core.autocrlf=true` checkout also retained LF parity.
- PASS — Skills CLI 1.9.0 installed Recipe for Claude Code, Codex, Gemini CLI, and OpenCode in four disposable Linux projects. Each installed helper recorded S0–S2, deployed the exact pinned `grilling` booster from its staging project, verified the managed receipt, and removed that exact path after fixture approval. All four replays were identical to their recorded state.
- PASS locally — The portable suite now copies the shipped init skill to a project-local location and records and replays S0–S2. The additional test still needs to finish on the actual Windows runner.
- FAIL — The added installed-copy test ran in the [next matrix](https://github.com/sayyidmibrahiim/lazy-vibers-recipe/actions/runs/45298786032). Five jobs passed. The Windows Node 22 job failed during the test step. The public annotation only exposed the exit code. The next matrix exports the test diagnostic as a public annotation when a job fails.
