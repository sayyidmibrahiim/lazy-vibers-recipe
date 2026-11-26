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
| 24 · Real project trials | The owner approved the two trial scopes below. Both fresh folders passed the folder check and the published network policy reaches the Codex model endpoint. Codex rejected its saved login with HTTP 401 and requested sign-in. Resume from the live-search interview preflight after reauthentication. |
| 25 · v1.0.0 release | Finish ticket 24, then publish and verify the release. Installation from clean `master` passed. Git push and the repository API read succeed. The GitHub integration returns HTTP 403 when updating About or reading branch protection. The tag, release installation, About, topics, and branch protection remain pending. |

### Approved trial scopes

| Project | First workflow |
| --- | --- |
| KPR House Hunter | Filter a user-provided local listings file into a shortlist. Keep the personal profile and financial inputs local. |
| Futsal Court Booking | Let a player see an open court slot and reserve it. Store the reservation in Supabase and verify that only one request wins when two players try to reserve the same slot. Use the [recorded Futsal example](../../examples/futsal-booking/README.md) for context during the new interview. |

The database portion of the Futsal booking check passed in a disposable PostgreSQL 17.12 container. With the documented `UNIQUE (court_id, booking_date, slot)` constraint, two overlapping transactions showed that the second insert waited for the first and then failed with SQLSTATE `23505`. Exactly one row persisted. Changing the court, date, or slot allowed a new booking. [Data model](../../examples/futsal-booking/SPEC/data-model.md)

The direct local REST check also passed using the Supabase PostgreSQL `17.12.0.002` and PostgREST `v16.6` images. Two concurrent requests returned HTTP `201` and `409` with one matching row. Booking a different time succeeded and a request without credentials could not read bookings. The full Supabase CLI stack stopped when its local Auth service failed a health check, so the REST check used a disposable role and locally signed token. The Futsal app and independent M0 builder trial remain pending.

For ticket 24, use a fresh folder per project and the [Recipe quickstart](../../README.md#start-a-new-idea). Save the reviewed bundles. Export each bundle to a separate folder that contains no installed Recipe skills and start a fresh builder there with `HANDOFF-PROMPT.md`. Ask it to implement only M0 and run the checks in `VERIFICATION.md`. Record the results, every question and guess, and the scorecard for each bundle. The ticket requires scores of at least 4 on every artifact and at most two builder guesses per milestone. Remove private values before adding approved evidence to `examples/`.

The published cloud network policy reaches the Codex model endpoint, GitHub REST API, and official sources for both trials. A follow-up environment draft adds `auth.openai.com` for `codex login --device-auth` and a personal `LVR_GITHUB_ADMIN_TOKEN` binding scoped to `api.github.com`. After that draft is published, sign in to Codex again and retry a fresh session with live search. For the GitHub settings, bind a fine-grained token restricted to this repository with `Administration` read and write access. The eventual GitHub Release also requires `Contents` write access. Use the bound token for `gh` without printing it, and verify repository permissions before making changes.

## Next session (local Claude Code, 2026-11-26)

A local review of `d4ea316` on Node 24 passed skill sync, language, lint, type checking, and the production build. One test, `tests/lvr/booster-cleanup.test.mjs`, failed only because booster detection read the host home folder, where `grilling` and `simple-english` were already installed. The test now runs with an isolated `HOME`, and all 46 tests pass.

The local checkout has no `.scratch/` folder. Recover it from `d583182` as described below when a ticket file is needed.

Resume in this order:

1. Ticket 24 can run locally in Claude Code, which avoids the cloud Codex 401. Create two fresh folders outside this repository, run `/lvr-init-new-idea` for each approved scope with live search, then `lvr-review-plan` and handoff. Ask the owner only for decisions the plan needs.
2. For each bundle, copy it to a separate folder with no Recipe skills, start a fresh builder session with `HANDOFF-PROMPT.md`, build M0 only, and run `VERIFICATION.md`. Record questions, guesses, test results, and the scorecard. Save sanitized evidence under `examples/`.
3. Ticket 25: the local `gh` login is the repository owner with `repo` scope, so About, topics, branch protection, the tag, and the GitHub Release can be tried from here. Record the endpoint and error if any call fails.

## Recover the working archive

The working archive is ignored in the current checkout. Commit `d583182ef0cbfab510bd5f8b098cfc743520074f` retains its exact files, including the original resume prompt, issue trackers, verification notes, and fixtures. Open the [archive snapshot on GitHub](https://github.com/sayyidmibrahiim/lazy-vibers-recipe/tree/d583182ef0cbfab510bd5f8b098cfc743520074f/.scratch). The table above records current work after that snapshot.

To inspect the archive in a separate temporary folder, run from the checkout.

```bash
archive_dir=$(mktemp -d)
git archive d583182ef0cbfab510bd5f8b098cfc743520074f .scratch | tar -x -C "$archive_dir"
```

The earlier recovery branches are `handoff/ticket-17` and `handoff/tickets-19-20`. Their published progress is integrated on `master`. Use the tagged evidence revisions and current handoff when reviewing historical results.
