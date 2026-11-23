# Build Loop Reference

Companion to `/lvr-build`. The bundle is the contract; the build loop is the proof. A milestone is done only when its recorded verification procedure passes with captured output.

## 1. Preflight

Before the first milestone:

- [ ] `state.json` parses; `pipeline.sections.S8` and `S9` are done; scope is locked (conventions §5: `scope_locked` event and S7 done).
- [ ] `LVR lint run` and `LVR crosscheck` agree with `blueprint.json`. Read its declared files, or the base list for a v1 bundle. Include affected profile files in milestone context.
- [ ] Every entry of `state.milestones[]` has an id that also exists in `MILESTONES.md`.
- [ ] Every milestone in `MILESTONES.md` has a matching procedure in `VERIFICATION.md`.
- [ ] `AGENTS.md`, `DECISIONS.md`, `CODE_STYLE.md`, `SECURITY.md`, and `HANDOVER.md` exist and are non-empty.
- [ ] No open blocking review finding: `state.review.last.open.blocking` = 0 when a finished review exists (`state.review.last.done_at` set). A project reviewed only before the rename: no open blocking finding in the latest `.lvr/recheck/RECHECK-*.md`. No review at all: not a blocker.
- [ ] `LVR verify freshness` returns `clean: true`. Before each milestone and each fresh-assumption retry, repeat it for price, quota and version citations and the S5b `recheck_by` dates on the stack and library slots. Without Node, use `freshness.json`, the saved citation dates and each slot's deadline.

A failed preflight item is a `build_blocked` with the owning skill named, journaled before any `build_started` (no state field changes). Do not start coding around a broken plan.

Refresh expired facts from official pricing, docs or release sources and log the actual research. Use the [S5b procedure](sections/S5b-framework.md) for exact pins and new signal dates. Surface unverified build-critical facts even when the expiry check is clean. When a version, quota or price changes the plan, the service is unreachable, or the approved evidence needs an edit, record the affected item and route to `/lvr-review-plan` to refresh the plan. Build uses refreshed evidence from disk and never silently changes the accepted stack. For older bundles without a structured S5b record, check the exact pins from the existing plan against official sources before relying on them. Use the approved current documentation for API calls, even when the version pin is fresh. A conflicting API requires a plan check.

## 2. Milestone selection

1. Read `state.milestones[]` in order.
2. Select the first entry where `verified` is not `true`.
3. Never re-run a verified milestone. Never reorder milestones.
4. If every milestone is verified, rerun the release checks, then close `build_done` and point at `/lvr-personal-brand` after they pass.

## 3. Verification protocol

For the selected milestone:

1. Read its goal, deliverables, acceptance criteria, and verification procedure.
2. Implement the deliverables in the project folder, following `CODE_STYLE.md` and `SECURITY.md`. Never edit bundle documents to make a check pass.
3. Run the procedure exactly as written from its specified environment. Pass the executable and literal arguments to `LVR verify run --in -` with `{"argv":["<program>","<argument>"],"cwd":"<project-relative folder>"}`. It captures stdout, stderr, start/end timestamps and exit code. If the recorded procedure has shell syntax, give the documented shell explicitly with the original expression as an argument. Read instructions from the approved bundle before executing them. Use the documented harness tool directly for a browser or device check. Without Node, capture the same observations by hand.
4. Capture, per command:
   - the exact command line;
   - exit code;
   - exact stdout/stderr in the raw evidence file, with secret values redacted;
   - timestamp.
   Save each capture as `.lvr/verification/results/<milestone>-attempt-<n>-command-<n>.json`. Keep the same capture on resume. Use a new command number for each command in the recorded procedure. Write the interpretation in English in `VERIFICATION.md` and reference the evidence file.
5. Compare exit code and observations with the expected result. A timeout, execution error, incomplete output or partial match cannot pass. The command wrapper's `ok: true` means the capture completed. Read `passed` and check the output against every assertion. Set `timeout_ms` for a documented command that legitimately needs more time.

Run the checks associated with each changed part of the approved bundle.

| Bundle evidence | Verification |
| --- | --- |
| `UI_SPEC.md` | Reproduce recorded states at the required widths and with the keyboard. Check actual foreground/background tokens using the pinned contrast tool or the documented formula. Capture reduced-motion and focus checks and observe the mobile layout. [UI checks](bundle/ui-spec.md) |
| `SPEC/ai.md` | Export `LVR ai cases`, run each case on the approved application/model path without exposing expected answers to it, and run `LVR ai eval --in FILE` on observed results. Also record rubric, model, version, cost limits and any critical failures. [AI evaluation](bundle/ai-feature.md) |
| `SPEC/data-model.md` | On disposable test data, execute migrations up and down where supported, backup/restore where specified, query constraints, and allowed and denied access such as cross-owner RLS. Capture concrete rows and results. [Data verification](bundle/data-module.md) |
| `EVALS.md`, `INSTALL_MANIFESTS.md`, workflow files | Test the actual manifest and its approved target. Run recorded examples, permission denials, trigger or import, and expected response before using the release check. [Workflow checks](bundle/workflow.md) |

If the recorded procedure is wrong or impossible (for example the command does not exist on this stack), do not invent a replacement. Report the milestone as blocked (journal `build_blocked`; it keeps `verified: false` — milestones have no blocked field), report the procedure defect, and recommend `/lvr-review-plan` (check L12.1) — a wrong verification is a bundle finding, not a build decision.

## 4. Failure ladder

1. First failure → fix the cause inside the milestone's scope, re-run the same procedure. Journal `milestone_failed` with the attempt number and the decisive output line.
2. Second failure → inspect the assumption that might be wrong before editing again. If the plan itself is wrong, stop.
3. Third attempt is not allowed. Journal `build_blocked`, keep the milestone unverified, and stop the build loop with a plain report: what failed, the exact command, the output, the suspected cause, and the next owner (`user`, `/lvr-review-plan`, or `/lvr-add-feature`).

Never weaken a check, delete an assertion, or mark a partial pass to move on.

## 5. Recording results

Check the English text of the new entry using conventions §4 before appending it to `VERIFICATION.md`. Preserve earlier entries and keep command text exact.

~~~~markdown
## Build log — <YYYY-MM-DDTHH:MM:SSZ>

### M<n> — <name> — PASS | FAIL
- Attempt: <n>
- Command: `<exact command>`
- Exit code: <n>
- Evidence: `.lvr/verification/results/<milestone>-attempt-<n>-command-<n>.json`
- Observed output: <English summary of the relevant actual output>
- Result: <which acceptance criteria passed/failed>
- State: verified at <ts> | blocked, owner <skill/user>
~~~~

After writing the log, run `LVR state milestone set --id M<n> --in -` with `status`, `attempt`, and the observed `criteria_passed` list or decisive failure `output`. The helper checkpoints the corresponding result. If interrupted between the log and checkpoint, compare the journal and log and record the existing result once. `blueprint.json` stays derived and is refreshed by `/lvr-handoff`.

## 6. Release verification

Use `LVR release plan` to read `release_check` from each confirmed profile. For an older bundle with a recorded web URL and no chosen type, the plan uses its web check. If an older bundle has neither, establish its type from the approved plan and confirm it with the owner if uncertain. Without Node, read the same fields in `profiles/<type>.json` and keep the same evidence.

1. Use the actual artifact or deployment specified by the milestone. Test the released version from a fresh client, runtime, harness, browser profile or device appropriate to its type. Open the web deployment from a clean client and check one expected product fact with a 2xx response. For installable products, prove installation and the profile's run criterion.
2. Capture the environment, target including the artifact version, command or action, result, and timestamp in `VERIFICATION.md`. Summarize observed output in English and reference the original evidence with secrets removed. In `LVR release record --in -`, send JSON with `product_type`, `status` (`passed` or `failed`), `target`, `evidence` and the `clean_environment` used for a pass. Include numeric `http_status` and observed `product_fact` for a web pass. On web success, journal `deployment_verified` with the URL. Other types use their release records directly.
3. Keep a missing or unsuccessful check open and report the specific artifact or evidence required. A prior entry or a working development copy cannot satisfy the current check.

## 7. Anti-cheating rules

- The verification command is part of the contract; changing it to pass is a failure.
- Test fixtures may be added; assertions and expected outputs may not be weakened.
- A green build with a modified verification procedure is worse than a red build with the original procedure.
- `.lvr/` writes are limited to `project.status` (`building` at `build_started`, `complete` at `build_done`), `milestones[].verified`, `verified_at`, `deployment`, `release_check`, raw verification evidence in `.lvr/verification/results/`, and journal appends. Everything else is read-only.

## 8. Build boosters

Load the pinned `verification-before-completion` reference for evidence. Use `LVR booster plan --section S9 --harness NAME` for applicable interface and persistence aids and `--section S8` for MCP and n8n. Load only the entries the milestone uses. When applicable, read web interface and animation guidance, run the pinned contrast check, and observe the Emil motion budget. Use Impeccable for confirmed design work with owner opt-in. When Supabase is the approved deployment, use the Supabase aids and Postgres/RLS reference. Read reference-only entries at their catalog pins.

For installable entries use the [project-local lifecycle](booster-lifecycle.md). Check existing copies, stage the exact pin, install through the actual harness, and record verified use or a degraded result. Keep tracked build aids until the build finishes or its scope closes. Then list eligible installs and remove only Recipe-owned paths approved by the owner. On a pause keep paths and journal checkpoints for resume. Builder-time specialist agents stay out of 1.0 under B11. Use the skill and the recorded procedures in this build. Specialist builder roles can be designed after 1.0.
