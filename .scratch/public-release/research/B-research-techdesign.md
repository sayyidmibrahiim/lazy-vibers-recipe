# B — Research & technical design skills (S5/S6, technical files of S9)

Method: cloned each repo (depth 1), read the SKILL.md plus references/templates, scored with RUBRIC.md (/20). Dates = repo HEAD commit as of 2026-11-19 (shallow clones, so per-skill dates are not available). Stars are fetched via the GitHub API and used as tiebreak only. Cloned content was only read, never run. Column order: Act, Out, Ver, NonTech, Harness, Token, Det, Evid, Maint, Adopt.

Gate notes: all candidates are MIT/Apache/ISC unless flagged. Flags:
- trailofbits/skills is CC-BY-SA-4.0 (share-alike, not on the permitted list) and the skills are code/audit-time, not plan-time. Excluded.
- mendableai/firecrawl (server repo) is AGPL-3.0. We only reference the firecrawl/cli skills (ISC) and the MCP server config, never the server code.
- Kiro-style specs: Kiro is a proprietary IDE with no open SKILL.md corpus. No gate-passing candidate; the EARS requirement idea is already covered by the spec-kit templates.
- No NC-licensed candidate found.

## Candidates table

| # | Repo / skill | Fn | Lic | Last commit | SKILL.md size | A O V N H T D E M A | Total |
|---|---|---|---|---|---|---|---|
| 1 | product-on-purpose/pm-skills `discover-competitive-analysis` | competitor | Apache-2.0 | 2026-11-14 | 4.5 KB +2 refs, evals | 2 2 2 1 2 2 0 2 2 1 | **16** |
| 2 | product-on-purpose/pm-skills `develop-adr` | ADR | Apache-2.0 | 2026-11-14 | 4.8 KB +2 refs, evals | 2 2 2 1 2 2 0 2 2 1 | **16** |
| 3 | jeffallan/claude-skills `api-designer` | API contract | MIT | 2026-11-16 | 8.0 KB +5 refs | 2 2 2 1 2 2 1 0 2 2 | **16** |
| 4 | bmad-code-org/BMAD-METHOD `bmad-architecture` | architecture | MIT | 2026-11-12 | 15 KB | 2 2 2 1 0 1 2 1 2 2 | **15** (harness-locked) |
| 5 | jeffallan `prompt-engineer` | AI/LLM spec | MIT | 2026-11-16 | 6.0 KB +6 refs | 2 2 2 1 2 2 0 0 2 2 | **15** |
| 6 | jeffallan `architecture-designer` (+nfr-checklist, database-selection, adr-template refs) | architecture / NFR / stack | MIT | 2026-11-16 | 4.9 KB +5 refs | 2 2 2 0 2 2 0 0 2 2 | **14** |
| 7 | briiirussell/cybersecurity-skills `threat-modeling` | threat model | MIT | 2026-11-18 | 11 KB | 2 2 2 1 2 1 0 1 2 1 | **14** |
| 8 | wshobson/agents `architecture-decision-records` | ADR | MIT | 2026-11-18 | 5.0 KB +2 refs | 2 2 1 1 2 2 0 0 2 2 | 14 |
| 9 | github/awesome-copilot `create-architectural-decision-record` | ADR | MIT | 2026-11-19 | 3.1 KB | 2 2 1 1 2 2 0 0 2 2 | 14 |
| 10 | github/awesome-copilot `threat-model-analyst` | threat model | MIT | 2026-11-19 | 5.9 KB +8 refs, skeletons | 2 2 2 0 1 2 0 0 2 2 | 13 (repo-analysis, needs existing code) |
| 11 | github/awesome-copilot `ai-prompt-engineering-safety-review` | AI guardrails | MIT | 2026-11-19 | 10 KB | 2 2 1 1 2 1 0 0 2 2 | 13 |
| 12 | zircote/sigint `competitive-analysis` | competitor | MIT | 2026-07-06 | 8.5 KB +refs, evals, example | 2 2 1 1 2 1 0 2 2 0 | 13 |
| 13 | wshobson `openapi-spec-generation` | API contract | MIT | 2026-11-18 | 2.0 KB +2 refs | 2 2 1 0 2 2 0 0 2 2 | 13 |
| 14 | rsmdt/the-startup `api-contract-design` | API contract | MIT | 2026-10-26 | 4.3 KB +templates | 2 2 1 1 2 2 0 0 2 1 | 13 |
| 15 | shawnpang/startup-founder-skills `tech-stack-eval` | tech stack | MIT | 2026-03-16 | 8.1 KB | 2 2 1 1 1 2 0 0 1 1 | 11 |
| 16 | alirezarezvani/claude-cto-team `cost-estimator` | cost | MIT | 2025-12-18 | 13 KB | 2 2 1 1 2 1 0 0 1 1 | 11 (prices dated 2024-2025) |
| 17 | alirezarezvani/claude-cto-team `tech-stack-recommender` | tech stack | MIT | 2025-12-18 | 21 KB | 2 2 1 1 2 0 0 0 1 1 | 10 |
| 18 | wshobson `slo-implementation` | NFR / ops | MIT | 2026-11-18 | 7.2 KB +1 ref | 2 1 1 0 2 2 0 0 2 2 | 12 |
| 19 | wshobson `stride-analysis-patterns` | threat model | MIT | 2026-11-18 | 2.5 KB +1 ref | 2 1 0 1 2 2 0 0 2 2 | 12 |
| 20 | wshobson `prompt-engineering-patterns` | AI spec | MIT | 2026-11-18 | 5.2 KB +6 refs, 1 script | 2 1 1 0 2 2 1 0 2 2 | 13 |
| 21 | wshobson `competitive-landscape` | competitor | MIT | 2026-11-18 | 7.6 KB | 2 1 0 1 2 2 0 0 2 2 | 12 |
| 22 | phuryn/pm-skills `competitor-analysis` | competitor | MIT | 2026-11-08 | 4.8 KB | 2 1 1 1 2 2 0 0 2 1 | 12 |
| 23 | browserbase/skills `competitor-analysis` (sickn33 fork is the same, 9.5 KB) | competitor | MIT | 2026-11-16 | 32 KB +6 refs, 8 scripts | 2 2 1 0 0 0 2 1 2 2 | 12 (harness/key-locked) |
| 24 | browserbase/skills `search` | web research | MIT | 2026-11-16 | 3.8 KB | 2 0 0 0 0 2 0 0 2 2 | 8 |
| 25 | firecrawl/cli `firecrawl-search` | web research | ISC | 2026-11-18 | 14 KB | 2 0 0 0 1 1 0 0 2 1 | 7 |
| 26 | wshobson `cost-optimization` | cost | MIT | 2026-11-18 | 6.8 KB | 2 0 1 0 2 2 0 0 2 2 | 9 (optimizes existing spend, not estimating) |
| 27 | dralgorhythm `threat-modeling`, sickn33 `threat-modeling-expert` | threat model | MIT | 2026-07 / 2026-11 | 2.3 / 2.5 KB | about 10 each | 10 |
| 28 | mattgierhart `prd-v05-technical-stack-selection` | tech stack | MIT | 2026-07-15 | 19.6 KB | 2 2 1 0 1 1 0 0 2 1 | 10 (enterprise vendor-fit oriented) |
| 29 | github/spec-kit templates (`spec-template`, `plan-template`, `commands/plan`) | spec-driven | MIT | 2026-11-18 | 4.5 + 3.8 KB templates | 2 2 2 1 2 2 2 2 2 2 | **19** (templates and CLI scripts, not a SKILL.md) |
| 30 | Fission-AI/OpenSpec `openspec-propose` | spec-driven | MIT | 2026-11-18 | 16.6 KB, needs `openspec` CLI | 2 2 2 1 0 1 2 2 2 2 | 16 (CLI-locked) |
| 31 | github `create-specification`, `prd` | spec-driven | MIT | 2026-11-19 | 5.5 / 4.3 KB | about 12 | 12 |
| 32 | github `technology-stack-blueprint-generator` | stack | MIT | 2026-11-19 | 9.8 KB | not applicable (reverse-engineers an existing codebase) | 5 |
| X | trailofbits/skills | security | CC-BY-SA-4.0 | 2026-11-12 | audit-time | excluded by gate | n/a |

## Per-function winners and losers

### Competitor / market research (S5)
Winner: pm-skills `discover-competitive-analysis` (16). Its Apache-2.0 repo is already a core booster (S1/S4), so no new install. It has a 7-step method, a TEMPLATE, an EXAMPLE and evals, and it marks verified versus inferred facts.
Losers: sigint 13, wshobson competitive-landscape 12, phuryn 12 (a near duplicate of pm-skills), browserbase competitor-analysis 12, sickn33 fork 11.
The browserbase skill is MIT but harness-locked. It needs the `browse` CLI, a `BROWSERBASE_API_KEY`, and explicitly forbids the harness WebSearch. SKILL.md is 32 KB. It also writes to `~/Desktop` and spawns subagents. Do not use it as the S5 method. Keep it as an optional "deep run" if the user has a key.
Also `discover-market-sizing` (pm-skills, 13 KB, same family): use for TAM/SAM if S5 needs sizing.

### Web research backend (S5)
No winner on the rubric. Both are tool-wrapper skills with no output contract (browserbase search 8, firecrawl-search 7). Both need a CLI and an API key.
Rule: the method comes from the pm-skills skill above. The web backend is whichever of these is installed (or the MCP server). If none is installed, the fallback is the harness's own search/fetch, with sources logged. Prefer firecrawl as the MCP server (configure it, no skill needed). The firecrawl `research-index` is biomedical papers only and not relevant.

### Tech-stack selection (S6)
Winner on rubric among stack-specific skills: shawnpang `tech-stack-eval` 11. It has a weighted scoring matrix, a TCO table, confidence levels and "push back on solution-first". It is flawed for us because it assumes a startup-context file and is pitched at engineers.
Better practical fit: jeffallan `architecture-designer` (14) has a `database-selection.md` ref and the NFR checklist.
Verdict: use the jeffallan skill as the S6 pass (stack choice as ADRs plus NFR-driven choice). Take only the scoring-matrix output shape from shawnpang as a reference.
Losers: alirezarezvani recommender 10 (21 KB), mattgierhart 10, github stack-blueprint 5 (wrong job).

### Architecture docs (S6 / ARCHITECTURE.md)
Rubric order: `bmad-architecture` 15 beats jeffallan `architecture-designer` 14. bmad-architecture is the best idea ("architecture spine": fix only what two independent builders could choose incompatibly, defer the rest). But it depends on `uv run {project-root}/_bmad/scripts/...` memlog and customization scripts, plus an `active_initiative` config. It is not runnable outside BMAD.
Decision: reference template only. Steal the invariants test and the "Deferred" list. The loadable pass is jeffallan `architecture-designer` (14, MIT, 4.9 KB). It checks "Verify full requirements coverage" and loops back on failed review.
Loser: github `architecture-blueprint-generator` (13 KB, reverse-engineers code, not plan-time).

### ADRs (S9 DECISIONS/ADR)
Winner: pm-skills `develop-adr` (16): Nygard format, TEMPLATE and EXAMPLE, quality checklist, evals, plus a model-choice consequences step that helps for AI features. Already a booster family.
Losers: wshobson ADR 14, github create-ADR 14 (coded bullets, machine-friendly, in case a stricter format is wanted), sickn33 ADR 12 (14 KB).

### Data model (S9 DATA-MODEL)
Gap: no dedicated, gate-passing, plan-time data-model skill found (the ones that exist are DB-specific, such as cosmosdb-datamodeling or the Postgres/Mongo ops skills).
Use: spec-kit `plan.md` phase 1 pattern ("Extract entities from feature spec -> data-model.md") plus jeffallan `database-selection.md`. Reference template only. The interview already supplies entities.

### API contract / OpenAPI (S9 API-CONTRACT)
Winner: jeffallan `api-designer` (16): 6-step workflow, a `redocly lint` gate (and a prism mock step), refs for REST/versioning/pagination/errors/OpenAPI.
Losers: wshobson openapi-spec-generation 13 (thin), rsmdt api-contract-design 13 (has templates).
Caveat: the lint and mock commands need Node. They are "if available" checks. The user never sees them.

### Security and threat modeling (S6 / S9 SECURITY)
Winner: briiirussell `threat-modeling` (14): design-time STRIDE + abuse cases + attack trees. It has a fixed output template (Scope, DFD, Assumptions, Threats, Open questions, Decision log) and a validation step (coverage check, adversarial second pass, trace to tests). It states an authorization boundary.
Loser: github `threat-model-analyst` 13. It is far more thorough (34 rules, verification checklist, skeletons) but written to analyze an existing repository, so it is not usable at plan time. Keep as reference for its verification checklist.
Others: wshobson STRIDE 12, dralgorhythm/sickn33 10.

### NFRs, observability and ops (S6 / S9)
Winner: jeffallan `nfr-checklist.md` (ref of architecture-designer): questions paired with common targets (users, rps, p95, availability table). It is interview-friendly. wshobson `slo-implementation` (12) is a loser as a skill and a helper for turning an availability target into SLO and error-budget wording. It is PromQL-heavy, so reference only.

### Cost estimation (S6 / COSTS)
Winner: alirezarezvani `cost-estimator` (11): TCO, build vs buy, cost by scale, hidden-cost checklist. Caution: price tables are headed "2024-2025", so tell the model to treat them as stale and to verify with the web at use time. Last commit 2025-12.
Losers: wshobson cost-optimization 9, bagelhole llm-cost-optimization 11 (an LLM-spend reference, consider for AI-feature cost lines only).

### AI/LLM feature specs: prompts, evals, guardrails (S9)
Winner: jeffallan `prompt-engineer` (15): has structured outputs, evaluation frameworks and system prompts as refs, and a validation checkpoint ("If accuracy < 80% ... identify failure patterns before iterating").
Guardrails pass: github `ai-prompt-engineering-safety-review` (13): safety, bias, security, effectiveness analysis.
Losers: wshobson prompt-engineering-patterns 13 (has a script), wshobson llm-evaluation 12.

### Spec-driven frameworks (S9 structure)
- spec-kit templates (19): the best bundle shape reference. `[NEEDS CLARIFICATION]` markers, prioritized user stories, FR-nnn MUST statements, measurable success criteria, a plan template with Technical Context, a constitution check, and research.md / data-model.md / contracts/ outputs.
- OpenSpec (16, already booster): proposal/specs/design/tasks structure. Its skill is CLI-locked (`openspec` CLI) so it is structure reference only, as the booster table already says.
- BMAD (15 for architecture; the rest is heavy and tied to `_bmad`): a persona-and-workflow system. Mine it for patterns only.
- Kiro: no open skill (see gate notes).
- github create-specification / prd (12): lighter alternatives. No gain over the above.

## Evidence quotes (re-verified by re-reading SKILL.md)

- pm-skills ADR: `## Quality Checklist ... - [ ] Consequences include both positive and negative outcomes`; `Use the template in references/TEMPLATE.md`; `evals/` dir present.
- pm-skills competitive: `Mark which conclusions are based on verified data vs. inference.` (step 7); `3-5 competitors are analyzed, including direct and indirect`.
- jeffallan api-designer: `Specify contract — Create OpenAPI 3.1 spec; validate before proceeding: npx @redocly/cli lint openapi.yaml`.
- jeffallan architecture-designer: `Verify full requirements coverage before proceeding.` and `If review fails, return to step 3 with recorded feedback.`
- jeffallan nfr-checklist: `| Expected concurrent users? | 100 / 1K / 10K / 100K |`.
- briiirussell threat-modeling: `Abuse cases catch what STRIDE misses ... "business intent violated."`; `Coverage check — every element in the DFD has a STRIDE table; every threat has a mitigation`.
- jeffallan prompt-engineer: `Validation checkpoint: If accuracy < 80% on the test set, identify failure patterns before iterating`.
- alirezarezvani cost-estimator: `### Cloud Compute Pricing (2024-2025)` (stale-price risk) and `## Hidden Cost Checklist`.
- spec-kit spec-template: `FR-006: System MUST authenticate users via [NEEDS CLARIFICATION: auth method not specified ...]`.
- bmad-architecture: `If two units one level down built this independently, could they choose incompatibly? Fix it here only when the answer is yes`; and the harness lock: `uv run {project-root}/_bmad/scripts/resolve_customization.py`.
- browserbase competitor-analysis: `Required: BROWSERBASE_API_KEY env var and the browse CLI installed`; `NEVER WebSearch.`
- openspec-propose: `compatibility: Requires openspec CLI.`

## Where each is used and how

| Skill | Step | Mode |
|---|---|---|
| pm-skills discover-competitive-analysis (+ market-sizing) | S5 competitor/market | **Load at start of S5** (already installed with the core pm-skills booster; no new install) |
| Web backend: browserbase search, Firecrawl MCP, or harness search | S5 | Tool the S5 pass calls; not a method. Existing booster slot. |
| browserbase competitor-analysis | S5 optional deep run | Optional only; needs browse CLI and a key. Do not make core. |
| jeffallan architecture-designer (+ database-selection, nfr-checklist refs) | S6 stack, architecture, NFR | **Apply as a pass** after interview answers are locked; ARCHITECTURE.md and NFR table |
| shawnpang tech-stack-eval | S6 | Reference template only (scoring-matrix and TCO table shape) |
| bmad-architecture | S6 | Reference template only (invariants test, Deferred list) |
| pm-skills develop-adr | S9 DECISIONS/ADR files | **Apply as a pass** per decision; shares the booster install |
| jeffallan api-designer | S9 API-CONTRACT (OpenAPI) | **Apply as a pass**; lint only if node exists |
| briiirussell threat-modeling | S6/S9 SECURITY (threats, abuse cases) | **Apply as a pass**; translate to plain language in the interview |
| github threat-model-analyst | S9 SECURITY verify | Reference only (verification checklist), not the runtime pass |
| alirezarezvani cost-estimator | S6/S9 COSTS | Apply as a pass; refresh prices from the web, never trust the table |
| jeffallan prompt-engineer + github ai-prompt-engineering-safety-review | S9 AI-FEATURE spec (prompts, evals, guardrails) | Apply as a pass only when the product has an LLM feature |
| spec-kit templates | S9 file structure | Reference template only (spec/plan/data-model/contracts shape, NEEDS CLARIFICATION markers) |
| OpenSpec | S9 | Reference template only (existing booster) |
| wshobson slo-implementation | S9 observability | Reference only |

Proposed new booster rows (all MIT or Apache-2.0, no NC): jeffallan/claude-skills (architecture-designer, api-designer, prompt-engineer), briiirussell/cybersecurity-skills (threat-modeling), alirezarezvani/claude-cto-team (cost-estimator), github/awesome-copilot (AI safety review, optional). pm-skills is already core.
Risks: repos are third-party and can change. Pin by commit when installing. jeffallan and briiirussell skills are written for engineers, so they need an LVP adapter layer that rewords questions in plain language for the non-technical owner. None of them ship deterministic validators beyond the optional redocly lint.
