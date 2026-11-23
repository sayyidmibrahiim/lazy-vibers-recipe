# Build Loop Reference

Companion to `/lvr-build`. The bundle is the contract; the build loop is the proof. A milestone is done only when its recorded verification procedure passes with captured output.

## 1. Preflight

Before the first milestone:

- [ ] `state.json` parses; `pipeline.sections.S8` and `S9` are done; scope is locked (conventions §5: `scope_locked` event and S7 done).
- [ ] Every entry of `state.milestones[]` has an id that also exists in `MILESTONES.md`.
- [ ] Every milestone in `MILESTONES.md` has a matching procedure in `VERIFICATION.md`.
- [ ] `AGENTS.md`, `DECISIONS.md`, `CODE_STYLE.md`, `SECURITY.md`, and `HANDOVER.md` exist and are non-empty.
- [ ] No open blocking review finding: `state.review.last.open.blocking` = 0 when a finished review exists (`state.review.last.done_at` set). A project reviewed only before the rename: no open blocking finding in the latest `.lvr/recheck/RECHECK-*.md`. No review at all: not a blocker.

A failed preflight item is a `build_blocked` with the owning skill named, journaled before any `build_started` (no state field changes). Do not start coding around a broken plan.

## 2. Milestone selection

1. Read `state.milestones[]` in order.
2. Select the first entry where `verified` is not `true`.
3. Never re-run a verified milestone. Never reorder milestones.
4. If every milestone is verified, rerun the release checks, then close `build_done` and point at `/lvr-personal-brand` after they pass.

## 3. Verification protocol

For the selected milestone:

1. Read its goal, deliverables, acceptance criteria, and verification procedure.
2. Implement the deliverables in the project folder, following `CODE_STYLE.md` and `SECURITY.md`. Never edit bundle documents to make a check pass.
3. Run the procedure exactly as written: same command, same working directory, same environment. No substitutions.
4. Capture, per command:
   - the exact command line;
   - exit code;
   - full stdout/stderr (trim only repeated noise, never the failing lines);
   - timestamp.
5. Compare with the expected output. A partial match, a skipped assertion, or "it probably works" is a failure.

If the recorded procedure is wrong or impossible (for example the command does not exist on this stack), do not invent a replacement. Report the milestone as blocked (journal `build_blocked`; it keeps `verified: false` — milestones have no blocked field), report the procedure defect, and recommend `/lvr-review-plan` (check L12.1) — a wrong verification is a bundle finding, not a build decision.

## 4. Failure ladder

1. First failure → fix the cause inside the milestone's scope, re-run the same procedure. Journal `milestone_failed` with the attempt number and the decisive output line.
2. Second failure → inspect the assumption that might be wrong before editing again. If the plan itself is wrong, stop.
3. Third attempt is not allowed. Journal `build_blocked`, keep the milestone unverified, and stop the build loop with a plain report: what failed, the exact command, the output, the suspected cause, and the next owner (`user`, `/lvr-review-plan`, or `/lvr-add-feature`).

Never weaken a check, delete an assertion, or mark a partial pass to move on.

## 5. Recording results

Append to `VERIFICATION.md`; never rewrite earlier entries.

~~~~markdown
## Build log — <YYYY-MM-DDTHH:MM:SSZ>

### M<n> — <name> — PASS | FAIL
- Attempt: <n>
- Command: `<exact command>`
- Exit code: <n>
- Output:
```text
<captured output>
```
- Result: <which acceptance criteria passed/failed>
- State: verified at <ts> | blocked, owner <skill/user>
~~~~

Then, on PASS only: set `state.milestones[i].verified = true` and `verified_at`, journal `milestone_verified`, regenerate nothing else. `blueprint.json` stays derived; `/lvr-handoff` refreshes it at the end.

## 6. Release verification

Use `LVR release plan` to read `release_check` from each confirmed profile. For an older bundle with a recorded web URL and no chosen type, the plan uses its web check. If an older bundle has neither, establish its type from the approved plan and confirm it with the owner if uncertain. Without Node, read the same fields in `profiles/<type>.json` and keep the same evidence.

1. Use the actual artifact or deployment specified by the milestone. Test the released version from a fresh client, runtime, harness, browser profile or device appropriate to its type. Open the web deployment from a clean client and check one expected product fact with a 2xx response. For installable products, prove installation and the profile's run criterion.
2. Capture the environment, target including the artifact version, command or action, result, and timestamp in `VERIFICATION.md`. Record observed output with secrets removed. In `LVR release record --in -`, send JSON with `product_type`, `status` (`passed` or `failed`), `target`, `evidence` and the `clean_environment` used for a pass. Include numeric `http_status` and observed `product_fact` for a web pass. On web success, journal `deployment_verified` with the URL. Other types use their release records directly.
3. Keep a missing or unsuccessful check open and report the specific artifact or evidence required. A prior entry or a working development copy cannot satisfy the current check.

## 7. Anti-cheating rules

- The verification command is part of the contract; changing it to pass is a failure.
- Test fixtures may be added; assertions and expected outputs may not be weakened.
- A green build with a modified verification procedure is worse than a red build with the original procedure.
- `.lvr/` writes are limited to `project.status` (`building` at `build_started`, `complete` at `build_done`), `milestones[].verified`, `verified_at`, `deployment`, `release_check`, and journal appends. Everything else is read-only.
