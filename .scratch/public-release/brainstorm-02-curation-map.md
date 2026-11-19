# Brainstorm 02 — Curation map, scripts, install, modes (2026-11-19)

Sources: research/A–E + RUBRIC.md. Spot-check by main session: licenses of all winners confirmed (per-skill `license:` lines where no root LICENSE: anthropics=Apache LICENSE.txt, browserbase=MIT, karpathy=MIT, firecrawl-cli=ISC). Scores = agents' reading of SKILL.md (/20), not execution.

## Owner direction (2026-11-19)
1. Install everywhere: all harnesses, Windows/Linux/macOS.
2. Deterministic steps → scripts to cut tokens.
3. Core value = curated best-in-class GitHub skills → complete plan files; measurable scoring, overlap → keep best.
4. Must also plan PERSONAL AI WORKFLOWS (output = skill/plugin, e.g. house-hunter for KPR), not only apps.
5. Name: Lazy Vibers Recipe (child of /home/ibrahim/projects/lazy-vibers; Recipe = planning only).
6. All skills must stay in sync.

## Section → skill map (winners)
| Section | Function | Skill (repo) | Score | How used |
|---|---|---|---|---|
| S0–S4 | interview discipline | `grilling` (mattpocock/skills, MIT) | 14 | load at S0 |
| S1 | problem statement | `define-problem-statement` (product-on-purpose/pm-skills, Apache) | 16 | pass |
| S1, S4 | question hygiene | `mom-test` (wondelai/skills, MIT) | 14 | pass, refs on demand |
| S1 | JTBD | `define-jtbd-canvas` (pm-skills) | 15 | reference template |
| S4 | edge/unhappy paths | `deliver-edge-cases` (pm-skills) | 16 | pass per F-NN |
| S4/S9 | user stories | `user-stories` (phuryn/pm-skills, MIT) | 16 | pass |
| S4/S9 | Gherkin AC | `deliver-acceptance-criteria` (pm-skills) | 16 | pass |
| S5 | competitor scan | `discover-competitive-analysis` (pm-skills) | 16 | load at S5 |
| S5 | web backend | Firecrawl/Browserbase MCP or harness search | – | tool, not skill |
| S6 | architecture + NFR | `architecture-designer` (jeffallan/claude-skills, MIT) | 14 | pass |
| S6/S9 | threat model + abuse | `threat-modeling` (briiirussell/cybersecurity-skills, MIT) | 14 | pass |
| S6/S9 | cost | `cost-estimator` (alirezarezvani/claude-skills, MIT) | 11 | pass; prices re-verified live |
| S7 | prioritization | `define-prioritization-framework` (pm-skills) | 15 | on demand |
| S8 | milestones/tasks | `planning-and-task-breakdown` (addyosmani/agent-skills, MIT) | 16 | load at S8 |
| S9 | PRD | `deliver-prd` (pm-skills) | 15 | pass |
| S9 | ADR | `develop-adr` (pm-skills) | 16 | pass |
| S9 | API contract | `api-designer` (jeffallan) | 16 | pass |
| S9 | data model / structure | spec-kit templates (github/spec-kit, MIT) | 19 | reference template |
| S9 | AI feature spec | `prompt-engineer` (jeffallan) | 15 | when idea has LLM |
| S9 | UI spec (optional) | `ui-ux-pro-max` (nextlevelbuilder, MIT; needs python3) | 16 | UI products only |
| S9 | plain language | SimpleEnglish (AminBlg, MIT) | 19 | KEEP, pass |
| S9 | de-slop | humanizer (blader, MIT) | 12 | KEEP, optional 2nd pass |
| S9/S10 | code style | ponytail (DietrichGebert, MIT) | 15 | KEEP; karpathy (11) merged/dropped |
| Handoff/S10 | verify gate | `verification-before-completion` (obra/superpowers, MIT) | 14 | builder prompt + lint |
| Workflow mode | agent/workflow spec | `agent-spec` (mohitagw15856/pm-claude-skills, MIT) | 16 | when product = skill/agent |
| Workflow mode | skill authoring | `skill-creator` (anthropics/skills, Apache) | 17 | S9 template |
| Build | browser verify | playwright-mcp (Apache) | – | KEEP (MCP) |
Excluded: deanpeters, orbweva (CC BY-NC-SA), slgoodrich (PolyForm NC), cexll (AGPL), amplitude (no license), trailofbits (CC-BY-SA, code-audit), Firecrawl server (AGPL; CLI ISC ok).
Fix: current `agents.md` booster install line is wrong (repo has no SKILL.md) → fetch spec text instead.

## Booster policy change (proposal)
Current: 9 "core" boosters must be installed or degraded. With ~25 winners that is too heavy. Proposal: 3 tiers
- core (≤5, install at init): pm-skills, grilling, SimpleEnglish, planning-and-task-breakdown, ponytail
- conditional (installed when the idea triggers it): threat-modeling, prompt-engineer, agent-spec, skill-creator, ui-ux-pro-max, api-designer
- reference (vendored excerpt or fetched on demand; credit, no install): spec-kit templates, ADR, cost, JTBD
Open: vendoring permissive excerpts into references/ vs runtime install.

## Product modes (owner point 4)
S1 asks product type → branch: `app` (current) | `workflow` (personal skill/plugin/agent). Workflow mode changes S1 (trigger, desired result), S2 (harness, tools/MCP, token budget), S3 (local personal profile, allowed sites), S4 (workflow steps: input → tool → decision rule → output), S8 (eval cases), S9 bundle (SKILL.md draft, profile schema, tools list, evals, install manifests).

## Scripts (research/D)
Runtime: zero-dep Node ≥18 `.mjs` (one `lvr.mjs`, synced copy per skill); prose fallback in SKILL.md. No symlinks (Windows).
Highest value: journal append/checkpoint, state validate/write, answer/decision record, journal replay rebuild, Folder Gate, booster presence, gap lint A–H, blueprint emit, stubs, HANDOFF-PROMPT. 27 candidates total.
Replay as ONE shared script also fixes sync findings E-01/02/03/06.

## Install everywhere (research/D)
Single `skills/<name>/` copy + manifests: `.claude-plugin/`, `.codex-plugin/`, `.agents/plugins/marketplace.json`, `gemini-extension.json`, `qwen-extension.json`, `kimi.plugin.json`, root `plugin.json`. Others via `npx skills add` / copy. Unverified paths: Cursor, Copilot, Windsurf, Kimi, Pi, Qwen, Kilo.

## Sync audit (research/E): 0 blocker, 6 major, 14 minor
E-01 S9 vs S10 current_section · E-02/03 replay ignores section_blocked, impact_analysis, folder_gate_rejected; spec lacks brand_* · E-04 build never writes project.status · E-05 parked features lack USER_FLOWS vs lint B9 · E-06 replay loses post-lock milestones/decisions · E-07 scope-lock and/or · E-12 spec 00 stale.

## Naming
Lazy Vibers Recipe · prefix `lvr` (`/lvr-*`, `.lvr/`) · repo `lazy-vibers-recipe` — pending owner confirmation.
