# Repository handoff

This guide records the verified baseline and remaining work for Lazy Vibers Recipe. The [repository rules](../../AGENTS.md) and [spec overview](../spec/00-overview.md) define how to work on the source repository. Use the [resume protocol](../../.scratch/RESUME-PROMPT.md) when taking over the release roadmap.

## Verified baseline

| Commit | Delivered |
| --- | --- |
| `db441e1` | Read-only dashboard with plans, diagrams, decisions, reviews, and session history. |
| `f97820d` | README quickstarts and the fictional Meeting Room Booker sample. |
| `32e34d8` | English UI and CLI messages, English checks for generated documents, conversation in the user's language, a repository language audit, and English README screenshots. |

The verified language update passed the production build, browser walkthroughs, 52 archived tests, and 41 working-tree tests. Three working-tree tests come from the pending platform matrix. The cloud could execute the local CLI helpers for the README, and the live Codex model connection was unavailable. The [README](../../README.md) links the exact screenshots and quickstart. The [language decision](../adr/0002-global-first-english-source-of-truth.md) explains how to preserve raw input and replay while writing new documents in English.

## Continue the release roadmap

**34 of 40 tickets are closed.** Check `git status --short`, `git log --oneline -12`, and `git stash list` before changing files. A fresh clone has the published commits and tracker status. The original cloud workspace also contains the local work listed below.

| Ticket | Next step |
| --- | --- |
| [17 · Specialist routing](../../.scratch/public-release/issues/17-agent-routing.md) | In the original workspace, inspect stash `af6d741`. The local simulation passed. Run the real planning delegation on Claude Code and OpenCode before closing the ticket. |
| [19 · Platform matrix](../../.scratch/public-release/issues/19-os-harness-matrix.md) | The workflow and its tests are local. Collect native harness and Windows/macOS evidence after the scripted Linux pass. |
| [20 · Repository hygiene](../../.scratch/public-release/issues/20-repo-hygiene.md) | The owner approved publishing the author email in the existing history. The sanitized Futsal example and detailed notes are local. Finish archive separation and verify the public checkout. |
| [23 · Public docs](../../.scratch/public-release/issues/23-public-docs.md) | The README and install guide are available. The remaining contributor and release docs depend on ticket 17. |
| [24 · Real project trials](../../.scratch/public-release/issues/24-dogfood-proof.md) | The owner runs two projects after tickets 17 and 19. The synthetic demo and screenshot walkthrough are separate evidence. |
| [25 · v1.0.0 release](../../.scratch/public-release/issues/25-release.md) | The repo URL and visibility already match the target. The release depends on the remaining tickets. The GitHub About description update is pending because cloud API access returned 403. |

On a fresh clone, obtain the original workspace or its local work before continuing tickets 17, 19, or 20. Use the live trackers and Git evidence for completion status. The earlier [release verification snapshot](../../.scratch/public-release/runs/FINAL.md) is historical evidence.
