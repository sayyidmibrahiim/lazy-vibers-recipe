# RESUME PROMPT: continue whatever was in progress (any harness, any model)

Paste this into any coding agent (Claude Code, Codex, Gemini CLI, Qwen, Kimi, Cursor, …) opened in this repo:

> Read and follow `.scratch/RESUME-PROMPT.md` exactly.

---

You are taking over work that another agent started, possibly in a different harness or model. That agent stopped without warning: a usage limit, a crash, or a closed window. You have no memory of what it did. **Trust only evidence in the repo, never assumptions.** This prompt names no task on purpose: work out what is done and what isn't, then act.

Read the [current repository handoff](../docs/agents/continuation.md) before using old run reports. It distinguishes published commits from local work and records which owner decisions have already been made.

## 0. Rules that override everything below
1. **Done work is frozen.** Don't edit, reformat, "improve", regenerate or re-run anything that belongs only to a finished task. If a finished task's check fails now, report it to the owner and don't fix it silently.
2. **Never throw away unfinished work.** No `git checkout -- .`, `git reset --hard`, `git clean`, `git stash drop`, and no deleting files you didn't create. Uncommitted changes are the previous agent's work in progress.
3. **No redoing.** If a step's output exists and passes its check, it's done. Continue from the first step that is missing or failing.
4. Follow the repo's own rules: `AGENTS.md` (and `CLAUDE.md`/`GEMINI.md` if present). If the repo has a loop/handoff protocol (§1.2), its stop conditions apply to you too.
5. Never push, rewrite git history, make the repo public, delete real user data/projects, or install or uninstall anything outside the repo unless the owner asks in this session.

## 1. Orient (read-only, ~5 min)
Collect evidence before you touch anything:
1. Repo rules: `AGENTS.md`, plus `CLAUDE.md`/`GEMINI.md` if present.
2. Protocol docs: `find . -path ./node_modules -prune -o \( -iname 'HANDOFF*.md' -o -iname 'spec.md' -o -iname 'FINAL.md' \) -print`. If a loop protocol exists (e.g. `.scratch/public-release/HANDOFF-LOOP.md`), it defines the process: read it fully and follow it.
3. Task list: tracker files, e.g. `.scratch/*/issues/*.md`. Read only the `Status:` line of each, with `grep -H '^Status:'`.
4. Git: `git status --short`, `git log --oneline -20`, `git diff --stat`.
5. Work notes: `.scratch/*/runs/*.md` (newest first: `ls -t`), and `.scratch/RESUME-LOG.md` if it exists (the last agent's own checkpoints).
6. Is someone still working? If files changed in the last ~3 minutes (`find . -newermt '-3 minutes' -not -path './node_modules/*' -not -path './.git/*' -not -path './.next/*'`), another agent may still be running. Wait 3 minutes and check again before you continue the same task.

## 2. Build the status board
Give every task exactly one state, using these evidence rules:

| State | Evidence required |
|---|---|
| **DONE** | Status `done` **and** a commit that mentions it (`git log --oneline --grep 'ticket NN'`) **and** no uncommitted changes that belong to it. A task without a tracker counts as done if its deliverable exists and its check passes. |
| **IN PROGRESS** | Any of: status `claimed`; uncommitted changes in its files; run notes (`NN-impl.md` / `NN-verify.md`) without a closing commit; status `done` with no commit. |
| **NOT STARTED** | `ready-for-agent`, every blocker DONE, no run notes, no diff. |
| **BLOCKED** | A blocker isn't DONE. |
| **OWNER** | `ready-for-human`, `needs-info`, or it needs a product decision that isn't written down in the spec/decision docs. |

If a task is unclear, mark it IN PROGRESS and verify it read-only before acting.

**Find the exact step of an IN-PROGRESS task.** The newest *section* across its run notes decides, not the newest file:
- No impl notes, only a claim → start the implementation.
- Impl notes, no verify notes → run the independent verification.
- The last verify section says FAIL / BLOCKING → do the next fix round. Count the rounds already done, and stop at the protocol's limit (default 2) and ask the owner.
- The last impl section ("Fix round N") is newer than the last verify section → re-verify that fix round.
- The last verify section says PASS → close it: tick the boxes, add comments with evidence, set status done, commit as the protocol says.

## 3. Work
1. **First, the IN-PROGRESS tasks**, from their exact step and in the protocol's order. Then pick NOT STARTED tasks following the protocol's frontier rule; if there is no protocol, take the lowest number whose blockers are DONE.
2. **Different harness, same rigour:**
   - **No subagents:** do the roles one after another. Before verifying, re-read only the task + `git diff` as if you'd never seen it, and label the notes "same-context verify".
   - **Different models than the protocol's table:** the table's model names are *capability tiers*, not products. Read them as roles and map each to your own provider's lineup yourself. Don't ask the owner, and don't hard-code a model name anywhere in the repo:
     - **Top tier** (table says the strongest tier, e.g. `Opus`): skill/principle/procedure text, architecture and contract design, adversarial verification. Use your provider's most capable model at the highest reasoning effort it offers.
     - **Mid tier** (e.g. `Sonnet`): code from a clear design, data files, manifests, docs drafts, mechanical verification. Use a strong, fast model at medium–high effort.
     - **Low tier** (e.g. `Haiku`): pure scans and greps. Use the cheapest model or no special effort.
     - The effort word in the table (`low`/`medium`/`high`/`xhigh`) maps to your harness's closest reasoning setting. `xhigh` means the maximum available.
     - If you can't switch model or effort mid-task (one model per session), run every step on the model of the **highest tier any step of the current task needs**. Never go lower than the table asks for verification.
     - Write the model you actually used in the RESUME-LOG line (`<harness/model>`), so the owner can audit the mapping.
   - **No web access:** mark external facts as unverified instead of guessing.
   - Never weaken a test or skip a Verify step to get green.
3. **Checkpoint after every step.** Append one line to `.scratch/RESUME-LOG.md`, so the next agent can continue if you get cut off too:
   `<ISO time> | <harness/model> | task NN | <step finished> | next: <exact next step>`
4. **When you touch shared files** (scripts, specs, synced skill files), finish by running the regression checks for already DONE tasks (their fixtures/tests, lint, typecheck, sync checks). A DONE task's check that turns red because of your change is your bug: fix your change, not the done work.
5. **Stop and ask the owner** when you hit an OWNER task, the protocol's stop conditions, a product decision that isn't recorded, or a destructive action. Ask one clear question with options and your recommendation. Meanwhile, continue with other tasks that don't depend on the answer.

## 4. When everything is finished
When every task is DONE or OWNER:
1. Run the full check set once: the protocol's "done" definition, all fixtures/tests, lint, typecheck, build (in a copy if a live server uses `.next`), and sync checks.
2. Write the final report the protocol asks for (e.g. `runs/FINAL.md`), if it doesn't exist yet.
3. Give the owner a **walkthrough**:
   - What's done (count + one line per big feature, in plain words)
   - How to try it yourself (3–5 concrete steps/commands)
   - What still needs the owner (OWNER tasks, with the one action each needs)
   - Any known minor issues (max 5)

## 5. How to talk to the owner
- **Plain, non-technical Indonesian.** No jargon; if a technical word can't be avoided, explain it in a few words.
- ADHD-friendly:
  - Start with the current state or action.
  - Numbered steps, at most 5 items per list.
  - Give concrete time estimates.
  - Show progress ("9 dari 38 tugas selesai").
  - No preamble, no recap, no closing pleasantries.
  - End with exactly one next action.
- Your first message after orienting:
  - The status board in short: done / in progress (with exact step) / next / waiting for owner.
  - Then start working right away. Don't wait for an OK unless it's an OWNER item.
