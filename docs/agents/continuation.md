# Repository handoff

Use the [repository rules](../../AGENTS.md) and [spec overview](../spec/00-overview.md) when changing Lazy Vibers Recipe. Open the latest `master` and check `git status --short` and `git log --oneline -12` before continuing the release roadmap. Read the ticket and its evidence before changing its status.

**Release roadmap: 37 of 40 tickets complete.**

## Verified work

| Commit | Delivered |
| --- | --- |
| `2457d6a` | Critical review redesign with 225 passing ticket checks. |
| `db441e1` | Read-only dashboard with plans, diagrams, decisions, reviews, and session history. |
| `f97820d` and `32e34d8` | Public quickstarts, demo plan, English UI and documents, and screenshots. |
| `705d0a8` | Sanitized Mermaid diagram rendering and updated the affected `minimatch` dependency. |
| `10d4bd9` and `ee0aef4` | Planning specialists on master. Real Claude Code and OpenCode processes dispatched both roles with a local scripted provider. The native and inline records passed validation and replay. |
| `e1e11ae` | Contributor guide, security policy, changelog, issue templates, and the booster review rubric. |
| `d583182` | Restored the sanitized Futsal example. The public checkout omits the working archive. Gitleaks found zero leaks in the scanned history and the public checkout. The example opened in the production dashboard and its journal replayed with zero differences. |

## Remaining work

| Ticket | Status and next check |
| --- | --- |
| 19 · Platform matrix | All six standard matrix jobs passed after pinning LF at the canonical sources. Recipe installation, S0–S2, pinned booster deployment, and cleanup passed with the installed helper on four harness layouts. The added installed-copy test still needs a confirmed green Windows Node 22 result. [Runner evidence](https://github.com/sayyidmibrahiim/lazy-vibers-recipe/actions/runs/45299244598) |
| 24 · Real project trials | Capture real owner decisions for a KPR house-hunter workflow and a Supabase-backed web project. Give each bundle to a separate builder with no Recipe skill context and record M0 questions, guesses, and scores. The published scripted examples do not supply this evidence. |
| 25 · v1.0.0 release | Finish the real project trials and release verification before tagging. The GitHub About description, topics, branch protection, and Release require repository API or settings access. The cloud API route returned HTTP 403. |

## Recover the working archive

The working archive is ignored in the current checkout. Commit `d583182ef0cbfab510bd5f8b098cfc743520074f` retains its exact files, including the original resume prompt, issue trackers, verification notes, and fixtures. Open the [archive snapshot on GitHub](https://github.com/sayyidmibrahiim/lazy-vibers-recipe/tree/d583182ef0cbfab510bd5f8b098cfc743520074f/.scratch). The table above records current work after that snapshot.

To inspect the archive in a separate temporary folder, run from the checkout.

```bash
archive_dir=$(mktemp -d)
git archive d583182ef0cbfab510bd5f8b098cfc743520074f .scratch | tar -x -C "$archive_dir"
```

The earlier recovery branches are `handoff/ticket-17` and `handoff/tickets-19-20`. Their published progress is integrated on `master`. Use the tagged evidence revisions and current handoff when reviewing historical results.
