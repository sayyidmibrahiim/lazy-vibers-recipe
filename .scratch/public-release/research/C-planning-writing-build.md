# C — Planning, writing quality, handoff and build (curation report)

Date 2026-11-19. All repos cloned shallow to the scratchpad `curate-c/` and SKILL.md files read (not executed).
Score = RUBRIC.md, 10 criteria x 0-2, /20. Column order:
Act / Out / Ver / NonTech / Harness / Token / Helpers / Evid / Maint / Adopt.
Maint: <=6 mo = 2. Adopt: >=1k stars = 2, >=100 = 1 (tiebreak only).
Size = main SKILL.md bytes. Scores are my judgement from reading; evidence quotes below.

## Candidates

| # | Repo : skill | License | Last commit | Size | Act/Out/Ver/NT/Har/Tok/Hlp/Evd/Mnt/Ado | Total |
|---|---|---|---|---|---|---|
| 1 | AminBlg/SimpleEnglish : simple-english (CURRENT) | MIT | 2026-11-10 | 7.9 KB + refs | 2/1/2/2/2/2/2/2/2/2 | **19** |
| 2 | obra/superpowers : verification-before-completion | MIT | 2026-11-03 | 3.6 KB | 2/1/2/0/2/2/0/1/2/2 | **14** |
| 3 | addyosmani/agent-skills : planning-and-task-breakdown | MIT | 2026-11-18 | 10.7 KB | 2/2/2/1/2/1/0/1/2/2 | **16** |
| 4 | anthropics/skills : skill-creator | Apache-2.0 | 2026-11-16 | 33 KB + refs/scripts | 2/2/2/1/1/1/2/2/2/2 | **17** |
| 5 | nextlevelbuilder/ui-ux-pro-max-skill : ui-ux-pro-max | MIT | 2026-11-19 | 18.6 KB + refs/scripts | 2/2/1/0/1/2/2/2/2/2 | **16** |
| 6 | DietrichGebert/ponytail : ponytail (CURRENT) | MIT | 2026-10-29 | 3.5 KB (+4 sub-skills) | 2/1/1/1/1/2/1/2/2/2 | **15** |
| 7 | obra/superpowers : test-driven-development | MIT | 2026-11-03 | 9.6 KB | 2/1/2/0/2/1/0/1/2/2 | **13** |
| 8 | obra/superpowers : writing-plans | MIT | 2026-11-03 | 10.3 KB | 2/2/2/0/1/1/0/1/2/2 | **13** |
| 9 | addyosmani/agent-skills : incremental-implementation | MIT | 2026-11-18 | 9.6 KB | 2/1/2/0/2/1/0/1/2/2 | **13** |
| 10 | mattpocock/skills : to-spec | MIT | 2026-11-12 | 3.0 KB | 2/2/1/1/1/2/0/0/2/2 | **13** |
| 11 | blader/humanizer : humanizer (CURRENT) | MIT | 2026-11-09 | 32 KB, no refs | 2/1/2/1/2/0/0/0/2/2 | **12** |
| 12 | addyosmani/agent-skills : test-driven-development | MIT | 2026-11-18 | 17 KB | 2/1/2/0/2/1/0/1/2/2 | **12** |
| 13 | mattpocock/skills : writing-for-agents (AGENTS.md/skill authoring) | MIT | 2026-11-12 | 10.9 KB | 2/1/1/0/2/1/0/0/2/2 | **11** |
| 14 | agentsmd/agents.md (CURRENT; spec site repo, no SKILL.md) | MIT | 2026-09-10 | README 2 KB | 1/2/0/1/2/2/0/0/2/2 | **12** |
| 15 | multica-ai/andrej-karpathy-skills : karpathy-guidelines (CURRENT) | MIT (README) | 2026-04-20 | 2.5 KB | 1/0/1/1/2/2/0/1/1/2 | **11** |
| 16 | microsoft/playwright-mcp (CURRENT; MCP server, not a skill) | Apache-2.0 | 2026-11-18 | n/a | 2/0/0/0/2/2/2/2/2/2 = 14 (MCP, not rubric-comparable) | **14*** |
| 17 | obra/superpowers : writing-skills | MIT | 2026-11-03 | 16.7 KB + refs | 2/1/2/0/1/1/0/1/2/2 | **12** |
| 18 | jwilger/agent-skills : design-system | CC0 | 2026-07-05 | 7.7 KB | 2/1/1/0/2/2/0/0/2/0 | **10** |
| 19 | bm629/agent-skills : authoring-test-plan | MIT | 2026-10-31 | 26 KB + refs | 2/2/2/0/1/1/0/0/2/0 | **10** |
| 20 | anthropics/skills : frontend-design | Apache-2.0 (LICENSE.txt) | 2026-11-16 | 9.4 KB | 1/0/0/0/2/1/0/0/2/2 | **8** |

Stars (tiebreak): SimpleEnglish 4.6k, ponytail 194k, humanizer 71k, karpathy 234k, agent-skills 119k, superpowers 321k, anthropics/skills 197k, mattpocock 328k, ui-ux-pro-max 151k, playwright-mcp 40k, agents.md 26k, bm629 7, jwilger 5.
Notes: no candidate is NC-licensed. No gate failures. Harness-lock: skill-creator (agents/ subagents, `claude -p` in scripts), ui-ux-pro-max (uses `${CLAUDE_PLUGIN_ROOT}` paths + python3), mattpocock to-spec (needs its own setup skill/issue tracker), superpowers writing-plans (assumes subagent execution), bm629 (frontmatter `extensions.claude`/`forge`).
playwright-mcp has no SKILL.md; gate satisfied via its README/server (reachable, read).

## Per-function winners (overlap rule applied)

1. **Writing quality, plain language (S9 docs, OVERVIEW strictest): SimpleEnglish 19 — KEEP.** Only candidate with plain-language rules for non-native/non-technical readers AND a deterministic linter (`evals/ste_lint.py`, `slop.tsv`) plus evals. No competitor in the plain-language lane scored near it.
2. **De-slop pass (S9): humanizer 12 — KEEP, but flag.** Beat the other humanizer forks found in search (jooray, jpeggdev, charlesjones: not cloned, no evidence they exceed it). Weak points: 32 KB single file (Token 0), no helper scripts/evals. Overlap with SimpleEnglish (which also bans AI slop: "no AI slop", slop.tsv). Recommendation: keep as optional second pass on S9 prose; if token budget matters, SimpleEnglish alone covers 80%. Tie-break rule does not apply (19 vs 12 are not the same job: humanizer = tone restoration, SimpleEnglish = readability).
3. **Task / milestone breakdown (S8): addyosmani planning-and-task-breakdown 16 — ADD (new).** Beats superpowers writing-plans (13; dev-agent oriented, subagent assumptions) and mattpocock to-spec (13; tracker-locked). Has task template, S/M/L sizing, vertical slicing, checkpoints, final checklist.
4. **Verification / test planning (S8, S10): superpowers verification-before-completion 14 — ADD (new, tiny).** Gate function "run the command, read output, then claim". For test-plan authoring, bm629 authoring-test-plan scores 10 (26 KB, thorough but heavy, 7 stars); use only as reference template. Not recommended as booster.
5. **TDD (S10 builder rule): superpowers test-driven-development 13** over addy TDD 12 (17 KB) and mattpocock tdd 11. Optional; the bundle's own TESTING doc plus karpathy/ponytail may be enough. Do NOT add if booster count must stay small.
6. **Coding-style/simplicity (CODE_STYLE, S10): ponytail 15 over karpathy 11 — keep ponytail; karpathy is REPLACE-candidate / merge.** Both are the same job (smallest change, no speculation). Overlap rule: keep highest = ponytail (15, tests+benchmarks, active); karpathy is 2.5 KB, no output contract, 7 months old. Honest caveat: karpathy is smaller and has the strongest adoption; if the team wants one tiny skill, karpathy is acceptable. Recommendation: keep ponytail, drop karpathy (or keep both only because current table does and they are cheap).
7. **Browser verification (S10): playwright-mcp — KEEP** (MCP server, active, Apache-2.0; no skill competitor of equal quality; addy browser-testing-with-devtools 12 is a Chrome-DevTools alternative, not a replacement).
8. **AGENTS.md authoring (S9 / handoff): agents.md spec (12) + mattpocock writing-for-agents (11) — KEEP agents.md, ADD writing-for-agents as reference.** The agents.md repo is the website source; the spec text lives on agents.md, so "fetch the spec text at use time" is right (`npx skills add agentsmd/agents.md` will not find a SKILL.md — verify or change that install line). writing-for-agents supplies the actual authoring method (context pointers, information hierarchy, keep AGENTS.md short).
9. **UI/UX design spec (S9 design doc / tokens): ui-ux-pro-max 16 — ADD as optional.** Only candidate that exports tokens (`--design-system --tokens dtcg`) and has tests. Developer-facing (NonTech 0) and heavy; use at S9 in the DESIGN doc step only, and only when python3 is available. Losers: jwilger design-system 10, bm629 authoring-design-system (not scored in full), anthropics frontend-design 8 (aesthetic prompt for code, not a spec).
10. **Skill/plugin authoring (when product IS a skill): anthropics skill-creator 17 — ADD as conditional.** Beats superpowers writing-skills 12. Apache-2.0. Claude-specific scripts (subagent graders, `claude -p`); the planning knowledge (interview, test prompts, description tuning) is portable. Use as reference template only, not run.

## Evidence quotes (re-read of SKILL.md)

- SimpleEnglish: "Write plain English that a smart reader outside your field understands on one read." (Act/NT). "## Self-Check Before You Deliver" (Ver). Helpers: `evals/ste_lint.py`.
- humanizer: "Rewrite AI-sounding text so it reads like the writer, not a chatbot. Keep what it says." ; step 3 "Check the draft." (Ver). 32,394 bytes (Token 0).
- addy planning: "## Task [N]: [Short descriptive title]" template (Out); "- [ ] Every task has acceptance criteria" (Ver); "If a task is L or larger, it should be broken into smaller tasks." (Act).
- verification-before-completion: "BEFORE claiming any status or expressing satisfaction: 1. IDENTIFY: What command proves this claim?" (Act/Ver).
- superpowers TDD: "NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST"; "## Verification Checklist".
- ponytail: "The best code is the code never written." ; "a reply a busy human understands in one read".
- karpathy: "**Define success criteria. Loop until verified.**"
- writing-for-agents: "Reference for writing any document an agent consumes: a skill, an `AGENTS.md` / `CLAUDE.md`".
- agents.md README: "AGENTS.md is a simple, open format for guiding coding agents."
- ui-ux-pro-max: "`--tokens` is valid only with `--design-system`. It prints a machine-readable token document" ; "## Before Delivering App UI".
- skill-creator: "A skill for creating new skills and iteratively improving them."
- frontend-design: "Guidance for distinctive, intentional visual design when building new UI" (build-time, not spec).
- bm629 authoring-test-plan: "to a bar where a tester executes it with no questions, every behavior traced."

## Section/step mapping and usage mode

| Skill | Section/step | Mode |
|---|---|---|
| simple-english | S9 all docs; OVERVIEW strictest; also owner-facing questions in S1-S8 (language) | load at start of S9, apply as pass (+ run `ste_lint.py` if python available) |
| humanizer | S9 final pass | apply as pass, optional second after SimpleEnglish |
| planning-and-task-breakdown | S8 (milestones/tasks/TASKS doc); S9 task file | load at S8 start; use its task template + checklist as output contract |
| verification-before-completion | S8 verification plan wording; S10 builder gate; handoff lint | reference; paste gate function into builder prompt |
| ponytail (or karpathy) | S9 CODE_STYLE; S10 builder | reference, installed in builder harness |
| test-driven-development (obra) | S10 builder rule (optional) | reference only |
| playwright-mcp | S10 verification when a build runs | MCP configured in builder harness |
| agents.md + writing-for-agents | S9 AGENTS.md, handoff check | spec fetch + reference template |
| ui-ux-pro-max | S9 DESIGN/tokens doc, only for UI products | optional, run script for token export |
| skill-creator | S1-S9 when product is an agent skill; S9 structure | reference template only |

## Current-booster verdicts

- humanizer: KEEP (optional second pass; token-heavy, 12/20).
- SimpleEnglish: KEEP (19/20, top of list).
- karpathy-guidelines: REPLACE with / merge into ponytail (11 vs 15); acceptable to keep as the tiny alternative.
- ponytail: KEEP (15).
- playwright-mcp: KEEP (MCP server, Apache-2.0; not skill-scored).
- agents.md: KEEP, but fix install line (repo has no SKILL.md) and pair with writing-for-agents.

## Not examined in depth
Search-only mentions (not cloned, unscored): jooray/humanizer, jpeggdev/humanize-writing, charlesjones-dev writing-humanize, softaworks/humanizer, cloudflare/agents test-plan (no SKILL.md found in clone), paperclipai qa-acceptance, troykelly acceptance-criteria-verification. Third-party aggregator pages conflict on star counts; stars here come from `gh api`.
