# Repository handoff

Use the [repository rules](../../AGENTS.md) and [spec overview](../spec/00-overview.md) when changing Lazy Vibers Recipe. Open the latest `master` and check `git status --short` and `git log --oneline -12` before continuing the release roadmap. Read the ticket and its evidence before changing its status.

**Release roadmap: 39 of 40 tickets complete.**

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
| 24 · Real project trials | Done on 2026-11-27. The owner limited the trial to planning, because Recipe focuses on a thorough plan, so no builder run was made. Both plans reached Build-ready 10/10 on review run 3 with handoff bundles. [Trial evidence](../../examples/trials-2026-11/README.md) |
| 25 · v1.0.0 release | About, topics, and branch protection (required check `build-and-test`, linear history) are already set. Create the `v1.0.0` tag and the GitHub Release, then verify installation from the tag. |

The trial README lists five defects for later fixes, tracked locally as `.scratch/trial-defects/issues/01` to `05` (status `needs-triage`): answer source field, conversation language drift, host booster reuse, decision status after approval, and ledger corrections.

## Next session

1. Ticket 25: confirm CI passes on `master`, update `CHANGELOG.md` for 1.0.0, create the `v1.0.0` tag and the GitHub Release with `gh`, then install from the tag in a clean folder and record the result.
2. Optionally open tickets for the five trial defects in `examples/trials-2026-11/README.md`.

## Recover the working archive

The working archive is ignored in the current checkout. Commit `d583182ef0cbfab510bd5f8b098cfc743520074f` retains its exact files, including the original resume prompt, issue trackers, verification notes, and fixtures. Open the [archive snapshot on GitHub](https://github.com/sayyidmibrahiim/lazy-vibers-recipe/tree/d583182ef0cbfab510bd5f8b098cfc743520074f/.scratch). The table above records current work after that snapshot.

To inspect the archive in a separate temporary folder, run from the checkout.

```bash
archive_dir=$(mktemp -d)
git archive d583182ef0cbfab510bd5f8b098cfc743520074f .scratch | tar -x -C "$archive_dir"
```

The earlier recovery branches are `handoff/ticket-17` and `handoff/tickets-19-20`. Their published progress is integrated on `master`. Use the tagged evidence revisions and current handoff when reviewing historical results.
