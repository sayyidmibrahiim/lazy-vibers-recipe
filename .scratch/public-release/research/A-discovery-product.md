# A - Discovery and product definition (S0-S4, S7)

Date: 2026-11-19. Method: web search plus aggregators, then shallow clones in scratchpad `curate-a/`. Every SKILL.md below was opened and read. Cloned content was never executed. Stars come from `gh api` and are a tiebreak only. Dates are the last commit (`git log -1 --format=%cs`). Sizes are bytes of SKILL.md.

Score columns follow RUBRIC.md, in order: Act, Out, Self, NonTech, Harn, Tok, Help, Evid, Maint, Adopt (each 0-2, total /20).

Scoring notes:
- Help (deterministic helpers) counts per-skill scripts only. Repo-wide CI or validators do not count.
- Evid counts evals, tests or worked examples.
- These are my judgement scores. Ties are marked.

## Gate failures and flags (do not bundle)

| Repo / skill | Problem | Use |
|---|---|---|
| deanpeters/Product-Manager-Skills (user-story, prd-development, discovery-interview-prep, problem-statement, ...) | CC BY-NC-SA 4.0 (NC and share-alike). Strong content: user-story ~18, prd-development ~16 | Runtime-only reference. Never copy into skills/ or the bundle |
| orbweva/founder-discovery (discovery, 16.8 KB) | CC BY-NC-SA 4.0 | NC, skip |
| slgoodrich/agents (prioritization-methods, prd-templates, user-story-templates, ...) | PolyForm Noncommercial 1.0.0 | NC, skip |
| cexll/myclaude (product-requirements) | AGPL-3.0, copyleft | Skip |
| amplitude/builder-skills (mom-test, create-user-stories, prioritize) | No LICENSE file in the repo, so no grant. Content good (mom-test ~14) | Gate fail until a license appears |
| obra/superpowers brainstorming | MIT, but harness-coupled: it chains to `superpowers:writing-plans`, has a visual-companion server, and is 15 KB | Reference only, not a loadable pass |

## Candidates (22 scored, MIT/Apache unless stated)

| # | Repo : skill | Lic | Last commit | Size B | Act | Out | Self | NonTech | Harn | Tok | Help | Evid | Maint | Adopt | Total |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | product-on-purpose/pm-skills : deliver-user-stories | Apache-2.0 | 2026-11-14 | 4205 | 2 | 2 | 2 | 1 | 2 | 2 | 0 | 2 | 2 | 1 | 16 |
| 2 | product-on-purpose/pm-skills : deliver-acceptance-criteria | Apache-2.0 | 2026-11-14 | 4316 | 2 | 2 | 2 | 1 | 2 | 2 | 0 | 2 | 2 | 1 | **16** |
| 3 | product-on-purpose/pm-skills : deliver-edge-cases | Apache-2.0 | 2026-11-14 | 4342 | 2 | 2 | 2 | 1 | 2 | 2 | 0 | 2 | 2 | 1 | **16** |
| 4 | product-on-purpose/pm-skills : define-problem-statement | Apache-2.0 | 2026-11-14 | 3728 | 2 | 2 | 2 | 1 | 2 | 2 | 0 | 2 | 2 | 1 | **16** |
| 5 | product-on-purpose/pm-skills : deliver-prd | Apache-2.0 | 2026-11-14 | 8975 | 2 | 2 | 2 | 1 | 2 | 1 | 0 | 2 | 2 | 1 | 15 |
| 6 | product-on-purpose/pm-skills : define-jtbd-canvas | Apache-2.0 | 2026-11-14 | 4327 | 2 | 2 | 1 | 1 | 2 | 2 | 0 | 2 | 2 | 1 | **15** |
| 7 | product-on-purpose/pm-skills : define-prioritization-framework | Apache-2.0 | 2026-11-14 | 20183 | 2 | 2 | 2 | 1 | 2 | 1 | 0 | 2 | 2 | 1 | **15** |
| 8 | phuryn/pm-skills : create-prd | MIT | 2026-11-08 | 7301 | 2 | 2 | 1 | 1 | 2 | 2 | 0 | 1 | 2 | 2 | 15 |
| 9 | phuryn/pm-skills : user-stories | MIT | 2026-11-08 | 2991 | 2 | 2 | 1 | 2 | 2 | 2 | 0 | 1 | 2 | 2 | **16** |
| 10 | phuryn/pm-skills : interview-script | MIT | 2026-11-08 | 4817 | 2 | 1 | 0 | 1 | 2 | 2 | 0 | 1 | 2 | 2 | 13 |
| 11 | phuryn/pm-skills : prioritization-frameworks | MIT | 2026-11-08 | 4455 | 1 | 1 | 0 | 1 | 2 | 2 | 0 | 1 | 2 | 2 | 12 |
| 12 | wondelai/skills : mom-test | MIT | 2026-11-13 | 16817 + 6 refs | 2 | 1 | 2 | 1 | 2 | 1 | 0 | 1 | 2 | 2 | **14** |
| 13 | wondelai/skills : jobs-to-be-done | MIT | 2026-11-13 | 16493 | 2 | 1 | 1 | 1 | 2 | 1 | 0 | 1 | 2 | 2 | 13 |
| 14 | mattpocock/skills : grilling (+ grill-me wrapper) | MIT | 2026-11-12 | 2077 | 2 | 1 | 2 | 2 | 1 | 2 | 0 | 0 | 2 | 2 | **14** |
| 15 | alirezarezvani/claude-skills : grill-me | MIT | 2026-11-17 | 2904 + 3 py | 2 | 1 | 1 | 1 | 1 | 2 | 2 | 0 | 2 | 2 | 14 |
| 16 | obra/superpowers : brainstorming | MIT | 2026-11-03 | 15190 + scripts | 2 | 1 | 2 | 2 | 0 | 1 | 0 | 2 | 2 | 2 | 14 (harness-coupled) |
| 17 | rsmdt/the-startup : requirements-elicitation | MIT | 2026-10-26 | 5413 + refs | 2 | 2 | 2 | 1 | 1 | 2 | 0 | 0 | 2 | 1 | 13 |
| 18 | rsmdt/the-startup : feature-prioritization | MIT | 2026-10-26 | 3750 + refs | 2 | 2 | 1 | 1 | 1 | 2 | 0 | 0 | 2 | 1 | 12 |
| 19 | mohitagw15856/pm-claude-skills : agent-spec | MIT | 2026-11-16 | 4484 | 2 | 2 | 2 | 1 | 2 | 2 | 0 | 1 | 2 | 2 | **16** |
| 20 | marchatton/agent-skills : ask-questions-if-underspecified | MIT | 2026-03-10 | 3786 | 2 | 1 | 1 | 2 | 2 | 2 | 0 | 0 | 1 | 0 | 11 |
| 21 | marchatton/agent-skills : spec-flow-analyzer | MIT | 2026-03-10 | 4792 | 2 | 1 | 1 | 1 | 1 | 2 | 0 | 0 | 1 | 0 | 9 |
| 22 | fernandezbaptiste/specialist-agent : prd | MIT | 2026-03-21 | 8393 | 2 | 2 | 2 | 1 | 2 | 1 | 0 | 0 | 1 | 0 | 11 |

Stars (tiebreak): phuryn/pm-skills 28.2k, mattpocock/skills 327k, obra/superpowers 321k, alirezarezvani/claude-skills 30k, wondelai/skills 2.7k, mohitagw15856/pm-claude-skills 1.6k, product-on-purpose/pm-skills 824, rsmdt/the-startup 583, amplitude/builder-skills 164, marchatton/agent-skills 5, specialist-agent 0.

Totals that differ from the plain column sum are noted: #6 and #7 sum to 15.

## Per-function winners and losers

| Function | Winner (score) | Losers (score) |
|---|---|---|
| S0 grill / interrogation | **mattpocock grilling (14)**. Tie at 14 with alirezarezvani grill-me and obra brainstorming. Smaller and more permissive breaks it, and grilling is 2 KB. Its frontier-round pattern matches LVP micro-batches | alirezarezvani grill-me (14; one question per turn, Python helpers read plan docs, which an interview from scratch doesn't have), obra brainstorming (14, harness-coupled), marchatton ask-questions (11) |
| S1 problem framing | **pm-skills define-problem-statement (16)** | None competing |
| S1 user/problem interview technique (Mom Test) | **wondelai mom-test (14)**. Its 7-row diagnostic is a checkable score | phuryn interview-script (13, written for interviewing customers, no self-check), amplitude mom-test (~14, no license) |
| S1 JTBD | **pm-skills define-jtbd-canvas (15)** | wondelai jobs-to-be-done (13) |
| S2 PRD | **Tie 15/15: pm-skills deliver-prd vs phuryn create-prd.** The rule (smaller, permissive) picks phuryn create-prd (7.3 KB vs 9.0 KB). Pragmatic pick: keep pm-skills deliver-prd, which is already a core booster, adds no new install, and has an optional "Agent Execution Contract" for a builder with no authoring context | fernandezbaptiste prd (11), rsmdt specify-requirements (not scored separately) |
| S3 user stories | **phuryn user-stories (16)**. Ties pm-skills deliver-user-stories (16); phuryn is smaller (3.0 KB vs 4.2 KB) and its "plain language a primary school graduate can understand" fits | pm-skills deliver-user-stories (16, kept as the Gherkin-bearing alternative) |
| S3 acceptance criteria (Gherkin) | **pm-skills deliver-acceptance-criteria (16)** | None |
| S4/S7 edge cases and unhappy paths | **pm-skills deliver-edge-cases (16)** | marchatton spec-flow-analyzer (9) |
| S7 scope / MVP (MoSCoW, RICE) | **pm-skills define-prioritization-framework (15)**. MoSCoW and RICE with an applicability filter | phuryn prioritization-frameworks (12, reference only), rsmdt feature-prioritization (12) |
| Elicitation (5 Whys, requirement IDs) | rsmdt requirements-elicitation (13), runner-up reference only | None |
| Agent / workflow spec | **mohitagw15856 agent-spec (16)** | None found with an interview step. AbsolutelySkilled ai-agent-design was not read (its SKILL.md path was not found in the clone) |

## Evidence (quoted, re-read from SKILL.md)

- pm-skills deliver-edge-cases
  - Act: "Walk Through Input Validation ... Explore Boundary Conditions ... Define Recovery Paths"
  - Out: "A complete edge-case catalog fills every template section: Feature Overview; Edge Case Categories; Error Messages; Recovery Paths; and Test Scenarios."
  - Self: "- [ ] Recovery paths are specified (not just error detection)"
- pm-skills deliver-acceptance-criteria
  - Act: "Use Given/When/Then language only."
  - Self: "- [ ] No implementation details leak into the acceptance criteria"
  - Fit: "Review for testability ... If a statement is subjective, rewrite it into a measurable outcome."
- pm-skills define-problem-statement
  - Act: "Identify the User Segment ... Avoid vague descriptions like 'users'"
  - Out: "A complete problem statement fills every template section"
- pm-skills deliver-prd
  - Act: "Write the Agent Execution Contract (only when an executor will implement this without the authoring context)"
  - Fit: "A PRD that omits a section its feature does not need is complete; a PRD that includes an empty one is not."
- pm-skills define-prioritization-framework
  - Act: "RICE ... ICE ... MoSCoW (Must / Should / Could / Won't) | Decision involves binary commitment per item or scope bounding"
  - Self: "Show which frameworks ran and which were excluded, with brief rationale."
- pm-skills define-jtbd-canvas
  - Act: "Use the format: 'When [situation], I want to [motivation], so I can [desired outcome].'"
- phuryn user-stories
  - Fit: "Use plain language a primary school graduate can understand"
  - Self: "Respect INVEST criteria: Independent, Negotiable, Valuable, Estimable, Small, Testable"
- phuryn create-prd
  - Act: "Don't invent. What you don't know goes to 7.4 Assumptions and open questions"
  - Fit: "Complete means no gap that blocks a decision about the first version"
- wondelai mom-test
  - Self: "Score a conversation (or interview plan) by the seven-row Quick Diagnostic below: 1 point per row that passes."
  - Act: "Rule 2: Ask about specifics in the past, not generics or hypotheticals about the future"
- mattpocock grilling
  - Act: "Ask the whole frontier in one round: number each question and give your recommended answer."
  - Self: "The session is done when the frontier is empty: every branch of the design tree visited, nothing left silently assumed."
  - Fit: "Finding facts is your job, never the user's."
- mohitagw agent-spec
  - Out: "Agent Spec: [name] ... 1. Goal & scope ... 2. Tools / actions ... 7. Evaluation ... 8. Failure handling"
  - Self: "- [ ] Every tool is marked reversible/irreversible, and every irreversible action has a human gate"
  - Act: "The safe default on uncertainty is 'stop and ask', not 'guess and act'"
- amplitude mom-test (reference only; the repo has no LICENSE)
  - Act: "For each bad question, provide the Mom Test rewrite"

## Section / step mapping (how each is used)

| Section | Skill | Mode |
|---|---|---|
| S0 intake / S1 interview | mattpocock `grilling` | Load at S0 start as the interview discipline. Ask unresolved decisions in rounds; stop when the frontier is empty. Keep LVP's own micro-batch size and plain-language rule. Drop its "dispatch a sub-agent" step on harnesses without sub-agents |
| S1 problem and user | pm-skills `define-problem-statement` | Apply as a pass. Its template feeds the problem and user section |
| S1 interview question craft | wondelai `mom-test` | Apply as a pass to the question list only, using the past-behaviour and no-pitch rules and the 7-row diagnostic. Use the 3 rules plus diagnostic, not the full 16 KB, and load `references/question-patterns.md` on demand. LVP interviews the owner about their own product, not customers |
| S1 JTBD | pm-skills `define-jtbd-canvas` | Reference template only. Use the job statement "When... I want... so I can..." |
| S2 PRD | pm-skills `deliver-prd` (or phuryn `create-prd`, tie) | Reference template. Apply its "Agent Execution Contract" step to the builder handoff. Ignore the `.claude/pm-skills.local.md` Project Memory section, which is optional |
| S3 user stories | phuryn `user-stories` | Apply as a pass. Plain language plus INVEST. Pair with deliver-acceptance-criteria for Gherkin |
| S3/S4 requirements AC | pm-skills `deliver-acceptance-criteria` | Apply as a pass per story. Output goes straight into the requirements file |
| S4 unhappy paths | pm-skills `deliver-edge-cases` | Apply as a pass over the whole feature set. Its categories become an owner-friendly checklist ("what if the user does X wrong") |
| S7 scope / MVP | pm-skills `define-prioritization-framework` | Apply as a pass. Use MoSCoW for scope lock and RICE only if the owner can supply numbers. Note it is 20 KB: load it on demand, not at start |
| Any step where the product is an agent or skill | mohitagw `agent-spec` | Load when the S0 idea is classified as agent/skill/workflow. Its 8-part output replaces the app-oriented PRD sections, with the PRD's goals and scope kept |

## Booster set implied

The current pm-skills booster stays and covers 5 of the 9 winners (problem statement, acceptance criteria, edge cases, prioritization, JTBD, plus PRD). Proposed additions to the core list (all MIT, `npx skills add`):

1. mattpocock/skills `grilling`
2. phuryn/pm-skills `user-stories`
3. wondelai/skills `mom-test`
4. mohitagw15856/pm-claude-skills `agent-spec` (only when the idea is an agent)

## Caveats

- Scores for skills I did not read in full (define-jtbd-canvas self-check, wondelai jobs-to-be-done) are estimated from the head of the file.
- mohitagw15856/pm-claude-skills holds 1386 mass-produced skills. agent-spec reads well, but quality is uneven across the repo, so pin the single skill, not the repo.
- github/awesome-copilot (prd skill) was not cloned because it timed out. It was not scored.
- amplitude/builder-skills would score about 14 for mom-test but has no license.
