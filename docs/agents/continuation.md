# Repository handoff

This guide records the verified baseline and remaining work for Lazy Vibers Recipe. The [repository rules](../../AGENTS.md) and [spec overview](../spec/00-overview.md) define how to work on the source repository. Use the [resume protocol](../../.scratch/RESUME-PROMPT.md) when taking over the release roadmap.

## Verified baseline

| Commit | Delivered |
| --- | --- |
| `2457d6a` | Verified critical review redesign with all 225 ticket checks passing. |
| `db441e1` | Read-only dashboard with plans, diagrams, decisions, reviews, and session history. |
| `f97820d` | README quickstarts and the fictional Meeting Room Booker sample. |
| `32e34d8` | English UI and CLI messages, English checks for generated documents, conversation in the user's language, a repository language audit, and English README screenshots. |

The verified language update passed the production build, browser walkthroughs, 52 archived tests, and 41 working-tree tests. Three working-tree tests come from the pending platform matrix. The cloud could execute the local CLI helpers for the README, and the live Codex model connection was unavailable. The [README](../../README.md) links the exact screenshots and quickstart. The [language decision](../adr/0002-global-first-english-source-of-truth.md) explains how to preserve raw input and replay while writing new documents in English.

## Continue the release roadmap

**35 of 40 tickets are closed.** Check `git status --short` and `git log --oneline -12` before changing files. The published handoff branches preserve earlier implementation and run notes.

| Ticket | Next step |
| --- | --- |
| [19 · Platform matrix](../../.scratch/public-release/issues/19-os-harness-matrix.md) | The saved workflow and tests passed the scripted Linux checks. Collect native harness and Windows/macOS evidence. |
| [20 · Repository hygiene](../../.scratch/public-release/issues/20-repo-hygiene.md) | The owner approved publishing the author email in the existing history. Start from the saved sanitized Futsal example. Finish archive separation and verify the public checkout. |
| [23 · Public docs](../../.scratch/public-release/issues/23-public-docs.md) | The README and install guide are available. Finish the contributor and release documentation. |
| [24 · Real project trials](../../.scratch/public-release/issues/24-dogfood-proof.md) | The owner runs two projects after tickets 17 and 19. The synthetic demo and screenshot walkthrough are separate evidence. |
| [25 · v1.0.0 release](../../.scratch/public-release/issues/25-release.md) | The repo URL and visibility already match the target. The release depends on the remaining tickets. The GitHub About description update is pending because cloud API access returned 403. |

## Retrieve pending work

```bash
git fetch origin 'refs/heads/handoff/*:refs/remotes/origin/handoff/*'
```

- [handoff/ticket-17](https://github.com/sayyidmibrahiim/lazy-vibers-recipe/tree/handoff/ticket-17) preserves the earlier draft. The integrated specialist routing and its verification are on `master`.
- [handoff/tickets-19-20](https://github.com/sayyidmibrahiim/lazy-vibers-recipe/tree/handoff/tickets-19-20) saves the platform matrix in `5cc63ba` and the Futsal example in `d8915a3`, each with its run notes. Use the commit for the ticket you are resuming.

Use the live trackers and Git evidence for completion status. The earlier [release verification snapshot](../../.scratch/public-release/runs/FINAL.md) and the saved run notes record the state at their original checkpoints.
