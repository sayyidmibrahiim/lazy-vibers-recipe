# Ticket 06 verification

Same-context verify (Codex, 2026-11-23). Native smoke on Linux and controlled feature-capture comparison below.

## Native staging and cleanup

- A pinned copy of `grilling` was installed through Skills CLI 1.9.0 in a local staging project. `booster deploy` placed it in the resulting Codex path. The installed list showed the skill. The journal contained its pinned SHA, project scope, and exact path. The approved cleanup restored the pre-test skill directory contents and preserved the original project lockfile byte for byte. Replay matched live state.
- The native conditional-path smoke used `user-stories` at S4 before opening S4. The same install and cleanup flow left the original project directories and user-global skill inventory intact.
- Seven lifecycle tests cover clean removal, duplicate deployment, user ownership, modified copies, pinned SHA and section checks, symlink replacement, and the MCP consent gate. Five registry tests remain green.
- Tests used copies. Cross-platform and additional live harness checks belong to ticket 19.

## Futsal feature capture, installed versus degraded

I used recorded S4.q1–q8 as the shared input and replayed the feature-capture pass in the same context. I evaluated five concrete cases in the resulting questions and acceptance notes. No owner answers or additional product decisions were invented. The installed pass used the actual pinned `grilling` and `deliver-edge-cases` skill files from native Codex installs. This was a paired spot check with one model instance.

| Case | Bank only | Installed aid |
|---|---|---|
| A successful booking immediately hides the slot | Covered | Covered |
| The player transfers 30% manually and the admin confirms it | Covered | Covered |
| Two players reach the same slot at once | Missing | One valid booking wins. The other player returns to slot selection. |
| A slow response lets the player tap Booking again | Asked what the player should see | Asked to confirm one booking and recovery of its result after reconnection. |
| The payment proof is illegible or the amount is wrong | Asked about a failed upload | Proposed an explicit rejection reason and a retry on the same booking page. |

The bank-only pass covered 2 of 5 cases with an observable outcome. The installed pass covered 5 of 5. Grilling moved the collision question into the current decision round and held reminder timing for later. The PM edge-case template made the repeated tap and rejected proof observable acceptance cases. Proposed outcomes were questions to confirm, with D-004 used only where already recorded.

Four core skills are scheduled outside this S4 probe. Their grounds for inclusion come from the prior measured comparisons.

| Core skill | Use and recorded evidence |
|---|---|
| planning-and-task-breakdown | S8. The work receives explicit checkpoints, sizes, and verification. The earlier comparison scored the template 16 vs 13 for the next alternatives. |
| ponytail | S9/S10. Test and benchmark checks support a smaller implementation. The earlier comparison scored 15 vs 11 for the overlapping alternative. |
| anti-slop | S9. The two editing trials scored 92 and 94 against the alternative groups. The reports retained the source facts. |
| SimpleEnglish | S9. Readability checks and a small linter help a nontechnical owner check the bundle. The earlier evaluation scored 19 of 20. |

Sources: [futsal S4 record](../fixtures/04/futsal-fixed/.lvr/docs/sections/S4-fitur.md), [tool comparisons](../research/C-planning-writing-build.md), [editing trials](../brainstorm-04-agents-design-types.md).

## Regression result

Verdict PASS. All 12 registry and lifecycle tests passed. Fixtures 03, 04, 26, 27, 38 and 40 passed, including 225 review checks and the 240-event state fuzz run. All 43 synced skill files matched. Lint and typechecking passed with the existing research-probe lint warning.
