# Repository handoff

Use the [repository rules](../../AGENTS.md) and [spec overview](../spec/00-overview.md) when changing Lazy Vibers Recipe. Open the latest `master` and check `git status --short` and `git log --oneline -12` before continuing the release roadmap. Read the ticket and its evidence before changing its status.

**Release roadmap: 38 of 40 tickets complete.**

## Verified work

| Commit | Delivered |
| --- | --- |
| `2457d6a` | Critical review redesign with 225 passing ticket checks. |
| `db441e1` | Read-only dashboard with plans, diagrams, decisions, reviews, and session history. |
| `f97820d` and `32e34d8` | Public quickstarts, demo plan, English UI and documents, and screenshots. |
| `705d0a8` | Sanitized Mermaid diagram rendering and updated the affected `minimatch` dependency. |
| `10d4bd9` and `ee0aef4` | Planning specialists on master. Real Claude Code and OpenCode processes dispatched both roles with a local scripted provider. The native and inline records passed validation and replay. |
| `e5c8197` and `92787bf` | Portable tests and byte-for-byte skill checks passed on Linux, macOS, and Windows with Node 22 and 24. The scripted installed-copy test reached S2 and replayed without drift on all six runners. Separate runs installed the Recipe and exercised pinned booster installation and cleanup in the Claude Code, Codex, Gemini CLI, and OpenCode layouts. [CI evidence](https://github.com/sayyidmibrahiim/lazy-vibers-recipe/actions/runs/45310745312) |
| `e1e11ae` | Contributor guide, security policy, changelog, issue templates, and the booster review rubric. |
| `d583182` and `9e04e04` | Restored the sanitized Futsal example. The public checkout omits the working archive. Gitleaks found zero leaks in the scanned history and the public checkout. The example opened in the production dashboard and its journal replayed with zero differences. |

A clean public snapshot passed 46 tests, lint, type checking, the production build, skill and language checks, and the npm vulnerability audit. The 52 archived Node tests and the regression scripts for tickets 03, 04, 26, 27, 38, and 40 also passed.

## Remaining work

| Ticket | Status and next check |
| --- | --- |
| 24 · Real project trials | The owner approved the two trial scopes below. Both fresh folders passed the folder check. The fresh Codex session with live search could not reach its model endpoint because the sandbox proxy returned HTTP 403. Resume from the interview preflight when model access works. |
| 25 · v1.0.0 release | Finish ticket 24, then publish and verify the release. Installation from clean `master` passed. The tag, release installation, GitHub About description, topics, and branch protection remain pending. Git push works. The sandbox proxy returned HTTP 403 for the GitHub REST API. |

### Approved trial scopes

| Project | First workflow |
| --- | --- |
| KPR House Hunter | Filter a user-provided local listings file into a shortlist. Keep the personal profile and financial inputs local. |
| Futsal Court Booking | Let a player see an open court slot and reserve it. Store the reservation in Supabase and verify that only one request wins when two players try to reserve the same slot. Use the [recorded Futsal example](../../examples/futsal-booking/README.md) for context during the new interview. |

For ticket 24, use a fresh folder per project and the [Recipe quickstart](../../README.md#start-a-new-idea). Save the reviewed bundles. Export each bundle to a separate folder that contains no installed Recipe skills and start a fresh builder there with `HANDOFF-PROMPT.md`. Ask it to implement only M0 and run the checks in `VERIFICATION.md`. Record the results, every question and guess, and the scorecard for each bundle. The ticket requires scores of at least 4 on every artifact and at most two builder guesses per milestone. Remove private values before adding approved evidence to `examples/`.

The cloud environment draft retains the current restricted network policy and proposes access to the Codex model endpoint, the GitHub REST API, and official sources for both trials. After the owner saves and publishes the draft, retry a fresh Codex session with live search and run `gh api repos/sayyidmibrahiim/lazy-vibers-recipe` before changing GitHub settings. Verify repository permissions separately if the API host becomes reachable.

## Recover the working archive

The working archive is ignored in the current checkout. Commit `d583182ef0cbfab510bd5f8b098cfc743520074f` retains its exact files, including the original resume prompt, issue trackers, verification notes, and fixtures. Open the [archive snapshot on GitHub](https://github.com/sayyidmibrahiim/lazy-vibers-recipe/tree/d583182ef0cbfab510bd5f8b098cfc743520074f/.scratch). The table above records current work after that snapshot.

To inspect the archive in a separate temporary folder, run from the checkout.

```bash
archive_dir=$(mktemp -d)
git archive d583182ef0cbfab510bd5f8b098cfc743520074f .scratch | tar -x -C "$archive_dir"
```

The earlier recovery branches are `handoff/ticket-17` and `handoff/tickets-19-20`. Their published progress is integrated on `master`. Use the tagged evidence revisions and current handoff when reviewing historical results.
