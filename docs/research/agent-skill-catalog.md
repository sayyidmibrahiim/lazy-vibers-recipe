# External Agent Skills for the LVR Pipeline

Research conducted on 2026-11-07.
The research used web search (WebSearch) and checked each repository directly on GitHub. Star counts and last activity dates come from the GitHub API as of the research date. Counts are rounded.
The LVR pipeline takes non-technical users from idea to blueprint to build. It includes `/lvr-init-new-idea`, `/lvr-continue`, `/lvr-review-plan` (formerly `/lvr-recheck-plan`), `/lvr-handoff`, `/lvr-add-feature`, and the optional `/lvr-build`.

The research excluded skills that were already installed or known, including Matt Pocock's skills (wayfinder, research, grilling, to-spec, to-tickets, triage, implement, implement-spec, tdd, domain-modeling, handoff, retro, teach), github/spec-kit, miqdadbadjuber/anti-slop, petergyang/no-ai-slop, and Nutlope/hallmark.

---

## Executive summary

- The agent skills ecosystem uses Anthropic's SKILL.md format. Almost every candidate repository declares support for Claude Code, Codex, Gemini CLI, and Cursor, which fits LVR's portability requirements.
- [deanpeters/Product-Manager-Skills](https://github.com/deanpeters/Product-Manager-Skills) was the strongest candidate for interviewing non-technical users. It offers 77 product management skills, including the Mom Test-style `discovery-interview-prep`. Its license is CC BY-NC-SA 4.0. [product-on-purpose/pm-skills](https://github.com/product-on-purpose/pm-skills) is an Apache 2.0 alternative.
- The official [browserbase/skills](https://github.com/browserbase/skills) repository covers competitor research through `competitor-analysis`, which produces an HTML report, and adversarial UI testing through `ui-test`. [arnabbagxd/Brand-building-skills](https://github.com/arnabbagxd/Brand-building-skills) is a newer, active collection with 28 branding skills.
- For specs and PRDs beyond spec-kit, [Fission-AI/OpenSpec](https://github.com/Fission-AI/OpenSpec) (74k★) offers lightweight spec-driven development across tools. Its change-folder layout, `proposal.md/specs/design.md/tasks.md`, closely fits the needs of an LVR bundle. [bmad-code-org/BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD) (55k★) is a comprehensive agentic agile method best used as a reference.
- Official platform collections track their frameworks. These include [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) (React, Next.js, and Vercel), [shadcn-ui](https://ui.shadcn.com/docs/skills), [supabase/agent-skills](https://github.com/supabase/agent-skills), [expo/skills](https://github.com/expo/skills), [flutter/agent-plugins](https://github.com/flutter/agent-plugins), and [software-mansion-labs/skills](https://github.com/software-mansion-labs/skills) and [callstackincubator/agent-skills](https://github.com/callstackincubator/agent-skills) for React Native.
- [blader/humanizer](https://github.com/blader/humanizer) (66k★) was the strongest writing-quality candidate. It covers 26 patterns from Wikipedia's "Signs of AI writing" guide and can complement existing writing-quality tools.
- The [agents.md](https://github.com/agentsmd/agents.md) standard (25k★) and the multi-harness adapter patterns in [wshobson/agents](https://github.com/wshobson/agents) (42k★) and [affaan-m/ECC](https://github.com/affaan-m/ECC) (299k★) are the main references for handoff and portability.
- Two broad collections offer useful individual skills. [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) (113k★) has 25 lifecycle skills covering interviews, specs, planning, builds, verification, and shipping. [obra/superpowers](https://github.com/obra/superpowers) (313k★) provides methods for brainstorming, writing plans, TDD, and verification before completion.
- The Indonesian-language Threads search found little catalog coverage. Results were mostly general recommendations for addyosmani/agent-skills, frontend-design and webapp-testing, or Superpowers.

---

## (a) Interviews and discovery for non-technical users

| Repository | What it does | Quality | How LVR can use it | Priority |
|---|---|---|---|---|
| [deanpeters/Product-Manager-Skills](https://github.com/deanpeters/Product-Manager-Skills) | 77 PM skills across three tiers. Includes `discovery-interview-prep` (Mom Test-style interview preparation), `discovery-process` (frame, research, synthesize, and validate), `opportunity-solution-tree`, `pol-probe` (low-cost validation), `prd-development`, `user-story` (Mike Cohn format and Gherkin), `epic-breakdown-advisor`, `press-release` (Working Backwards), and 14 market intelligence skills. | 7.9k★. Regular releases, most recently v0.84 in Aug 2026. Last push Oct 2026. | Use it as an interview pattern and question bank for user circumstances, resources, and features in `/lvr-init-new-idea`. Adapt `press-release` as an idea-summary template. | **Required reference.** CC BY-NC-SA 4.0 permits personal use and adaptation, subject to its terms. Commercial repackaging falls outside that license. |
| [product-on-purpose/pm-skills](https://github.com/product-on-purpose/pm-skills) | 68 Triple Diamond PM skills. Includes `interview-synthesis` (research transcripts to insights), `competitive-analysis`, `market-sizing`, `journey-map`, `persona`, `lean-canvas`, `deliver-prd`, OKRs, and design sprints. | 790★. Very active. Version v2.35.0 released 30 Oct 2026. | Use the Apache 2.0 `interview-synthesis` pattern to turn LVR interview answers into decisions. | Recommended |
| [borghei/Claude-Skills](https://github.com/borghei/Claude-Skills) | 385 cross-team skills. Includes `customer-interview-script` with Mom Test methods for rephrasing weak questions and question banks by interview type. Also covers competitor and market research. | 1.1k★. Last push Oct 2026. | Draw on the individual Mom Test-style skill to extend the `/lvr-init-new-idea` question bank. | Recommended |
| [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) — `interview-me` and `idea-refine` | Structured interviews and idea refinement before writing a spec. | 113.7k★. Last push 1 Nov 2026. | Reference for the initial context section. Check for overlap with the installed grill-me skill from Matt Pocock. | Recommended |

[ORBWEVA/founder-discovery](https://github.com/ORBWEVA/founder-discovery) (Mom Test and JTBD) had 1★ and little activity.

## (b) Competitor research, naming, and branding

| Repository | What it does | Quality | How LVR can use it | Priority |
|---|---|---|---|---|
| [browserbase/skills](https://github.com/browserbase/skills) | Official Browserbase collection of 18 skills. Includes `competitor-analysis` (automatic competitor discovery and deep research with an HTML report), `company-research` (ICP), `search` and `fetch` (web research without a browser), and `ui-test`. | 3.8k★. Last push 27 Oct 2026. 50 open PRs. | Use `competitor-analysis` during deep research in `/lvr-init-new-idea` and `/lvr-review-plan`. It requires a Browserbase API key and offers `search` and `fetch` as fallbacks. | **Required reference** |
| [arnabbagxd/Brand-building-skills](https://github.com/arnabbagxd/Brand-building-skills) | About 28 branding skills. Includes `brand-naming` (generates names and their rationale or evaluates an existing name, with automatic mode detection), `brand-identity`, `brand-voice`, `brand-positioning`, `brand-audit`, `competitor-branding`, and `aso`. | 843★. Last push 6 Nov 2026. Early-stage repository with 8 commits. | Use its MIT-licensed question bank for LVR naming and branding. Product name, tagline, and domain and social handle availability checks can be added to the bundle. | Recommended |
| [anthropics/skills](https://github.com/anthropics/skills) — `brand-guidelines` | Official Anthropic skill for consistent brand guidelines. | 188k★. Last push 6 Nov 2026. | Reference for a brief brand guideline in document generation. | Optional |

## (c) Spec and PRD generation beyond spec-kit

| Repository | What it does | Quality | How LVR can use it | Priority |
|---|---|---|---|---|
| [Fission-AI/OpenSpec](https://github.com/Fission-AI/OpenSpec) | Cross-tool spec-driven development CLI. Includes `/opsx:explore` (exploration without commitment), `/opsx:propose` (change folder with proposal.md, specs, design.md, and tasks.md), `/opsx:apply`, `/opsx:archive`, `/opsx:verify`, and `/opsx:continue`. | 74.2k★. Very active. Last push 7 Nov 2026. | The change-folder layout closely fits a per-feature LVR bundle. Use it as a reference for the spec structure, `/lvr-continue`, and `/lvr-add-feature`. | **Required reference** for the patterns |
| [bmad-code-org/BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD) | Agentic agile method with analyst, PM, UX, architect, and test agents. Its workflows make decisions explicit and preserve them as context. v6 stable, v7 alpha expected mid-Nov 2026. | 55.1k★. Last push 7 Nov 2026. | Reference for the adversarial review in `/lvr-review-plan`, drawing from BMAD's test architect, and for explicit decisions in DECISIONS.md. | Recommended as a pattern reference |
| [deanpeters/Product-Manager-Skills](https://github.com/deanpeters/Product-Manager-Skills) — `prd-development` | Structured PRD covering problem, personas, solution, metrics, and stories. | 7.9k★. Aug 2026. | Alternate template for PRD generation alongside Matt Pocock's to-spec. | Recommended |
| [product-on-purpose/pm-skills](https://github.com/product-on-purpose/pm-skills) — `deliver-prd` | Full PRD covering problem, metrics, stories, scope, and dependencies. | 790★. Oct 2026. | Source for the `/lvr-handoff` completeness checklist. | Optional |
| [SpillwaveSolutions/sdd-skill](https://github.com/SpillwaveSolutions/sdd-skill) | Guides agents through Spec-Kit for greenfield and brownfield projects and tracks feature status. | 111★. Last push 17 Nov 2025, about 12 months before the research date. | — | Low priority due to inactivity and overlap with the known spec-kit |

## (d) Task and milestone planning beyond Matt Pocock's skills

| Repository | What it does | Quality | How LVR can use it | Priority |
|---|---|---|---|---|
| [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) — `planning-and-task-breakdown` | Breaks work into small tasks with clear ordering so agents can complete them reliably. | 113.7k★. Last push 1 Nov 2026. | Apply its principles to milestone planning (M0..Mn), including milestone size limits and acceptance criteria. | **Required reference** |
| [eyaltoledano/claude-task-master](https://github.com/eyaltoledano/claude-task-master) | AI task management from PRD through tasks, dependencies, and tracking. Provides an MCP server. | 28.3k★. Last push 28 Apr 2026, about six months before the research date. Still distributed, with slower activity. | Reference for milestone and dependency patterns in blueprint.json. The MCP server is optional. | Recommended |
| [VoltAgent/awesome-claude-code-subagents](https://github.com/VoltAgent/awesome-claude-code-subagents) — `project-manager` | 161+ subagents organized by category. `project-manager` covers milestone planning, work breakdown, and risk registers. | 26.4k★. Last push 2 Nov 2026. | Use the risk register and work breakdown formats in verification.md and milestone plans. | Recommended |
| [obra/superpowers](https://github.com/obra/superpowers) — `writing-plans`, `executing-plans`, and `brainstorming` | Methods for writing and executing agent plans. | 313.7k★. Last push 3 Nov 2026. | Use as a comparison for ways of working already covered by Matt Pocock's wayfinder and to-tickets. | Optional |

## (e) Additional writing-quality skills

| Repository | What it does | Quality | How LVR can use it | Priority |
|---|---|---|---|---|
| [blader/humanizer](https://github.com/blader/humanizer) | Popular writing-quality skill based on 26 patterns from Wikipedia's "Signs of AI writing". Preserves the meaning when rewriting. Judges favored it 16/16 times in a blind test. | 65.7k★. Last push 28 Oct 2026. Active CHANGELOG. | Add the 26 patterns to the writing-quality guidance in `lvr-principles.md` and apply them in the final editing pass for reader-facing documents. Keep GFM as the output format. | **Required reference** |
| [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) — `writing-guidelines` | More than 80 documentation and prose rules from Vercel's handbook. | 33.6k★. Last push 28 Oct 2026. | Reference for clarity in the English spec documents. Adapt relevant points. | Optional |
| [kimhons/humanize](https://github.com/kimhons/humanize) | Layered writing-quality framework with a rule file, hook, subagent reviewer, CLI scorer, and 38 patterns. | 4★. Two commits at the research date. | The PostToolUse hook and scorer provide architecture ideas. | Low priority given the project's size and age |

## (f) Build skills by platform

| Repository | What it does | Quality | How LVR can use it | Priority |
|---|---|---|---|---|
| [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) | Official Vercel collection. Includes `react-best-practices` (40+ React and Next.js performance patterns), `web-design-guidelines` (100+ UI and accessibility rules), `composition-patterns`, `react-native-guidelines`, `vercel-optimize`, `deploy-to-vercel`, and `writing-guidelines`. | 33.6k★. Last push 28 Oct 2026. | Recommend skills in blueprint.json when the stack uses Next.js, React, or Vercel. The web design guidelines also inform UI acceptance criteria. | **Required reference** |
| Official [shadcn-ui](https://ui.shadcn.com/docs/skills) skills from [shadcn-ui/ui](https://github.com/shadcn-ui/ui), installed with `npx shadcn add --skill` | Project-aware guidance for finding and composing shadcn/ui components. | shadcn-ui/ui had 127.5k★. Last push 6 Nov 2026. | Recommend when the stack uses shadcn and Tailwind. | **Required reference** when the stack applies |
| [supabase/agent-skills](https://github.com/supabase/agent-skills) | Official Supabase skills for agent-assisted development, including auth, databases, and RLS. | 3.0k★. Last push 5 Nov 2026. | Recommend for Supabase auth and database work in the data and privacy section. | **Required reference** when the stack applies |
| [expo/skills](https://github.com/expo/skills) | Official Expo skills for building, deploying, upgrading, and debugging apps using Expo and EAS. | 4.1k★. Last push 6 Nov 2026. | Recommend for mobile work, including builds for app stores. | Recommended |
| [flutter/agent-plugins](https://github.com/flutter/agent-plugins) (formerly `flutter/skills`) | Official Flutter coding-agent skills and plugins. | 3.2k★. Last push 5 Nov 2026. | Recommend for a Flutter stack. | Recommended |
| [software-mansion-labs/skills](https://github.com/software-mansion-labs/skills) | Production React Native patterns for the New Architecture, available as a Claude Code plugin from Software Mansion. | 302★. Last push 4 Nov 2026. | Recommend for React Native, including the Expo context. | Recommended |
| [callstackincubator/agent-skills](https://github.com/callstackincubator/agent-skills) | React Native skills optimized for coding agents, from Callstack. | 1.7k★. Last push 8 Oct 2026. | Alternative or companion to Software Mansion's React Native skills. | Optional |
| [Jeffallan/claude-skills](https://github.com/Jeffallan/claude-skills) | 67 full-stack skills across frontend, backend, API design, and other domains, with domain-specific references. | 12.3k★. Last push 30 Oct 2026. | General platform coverage where there is no official vendor skill. | Recommended |
| [laguagu/claude-code-nextjs-skills](https://github.com/laguagu/claude-code-nextjs-skills) | Skills for Next.js 16, AI SDK 7, pgvector, and Bun. | 72★. Last push 2 Nov 2026. | Small, active collection for stacks that combine Next.js and AI. | Optional |
| [zaferayan/skills](https://github.com/zaferayan/skills) | Skills for production Expo React Native and StoreKit 2 in-app purchases (expo-iap). | 114★. Last push 5 Nov 2026. | Use for in-app payments on mobile. | Optional |
| [zakariaf/Flutter-Skills](https://github.com/zakariaf/Flutter-Skills) | Cross-harness Flutter skills for architecture, Riverpod 3.x, and testing. | 65★. Last push 23 Sep 2026. | Community Flutter alternative. | Optional |

The desktop search found no active, tested Electron or Tauri skill repository that met the criteria. For desktop work, use general full-stack skills from Jeffallan with the framework's documentation.

## (g) Verification, testing, and QA

| Repository | What it does | Quality | How LVR can use it | Priority |
|---|---|---|---|---|
| [browserbase/skills](https://github.com/browserbase/skills) — `ui-test` | "AI-powered adversarial UI testing". Analyzes a Git diff and tests the changes, or explores an app for bugs. Supports localhost. | 3.8k★. Last push 27 Oct 2026. | Use as a verification tool for `/lvr-build`. Run ui-test against the UI acceptance criteria. | **Required reference** |
| [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) — `browser-testing-with-devtools` and `debugging-and-error-recovery` | Browser testing over the DevTools protocol and a debugging loop. | 113.7k★. Last push 1 Nov 2026. | Apply its patterns to manual and automated per-milestone checklists in verification.md. | **Required reference** |
| [anthropics/skills](https://github.com/anthropics/skills) — `webapp-testing` | Official skill for testing a web app from its server without login credentials. | 188k★. Last push 6 Nov 2026. | Reference for smoke-test procedures in verification.md. | Recommended |
| [affaan-m/ECC](https://github.com/affaan-m/ECC) | 314 skills, 71 agents, and 98 commands across harnesses. Includes `e2e-testing`, `tdd-workflow`, `verification-loop`, and `security-review`. Weekly releases, including 2.2.3 on 1 Oct 2026. | 298.6k★. Last push 6 Nov 2026. | Draw on individual skills and use its multi-harness adapters as a reference for `/lvr-handoff`. | Recommended for individual skills |
| [obra/superpowers](https://github.com/obra/superpowers) — `verification-before-completion` and `systematic-debugging` | Verification before claiming completion. | 313.7k★. Last push 3 Nov 2026. | Add verification before completion to the evidence requirements in `lvr-principles.md`. | **Required reference** for the principle |
| [microsoft/playwright-mcp](https://github.com/microsoft/playwright-mcp) | Official Playwright MCP for browser automation. | 39.3k★. Last push 6 Nov 2026. | Default web verification MCP for `/lvr-build`. | **Required MCP** |
| [ChromeDevTools/chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp) | Official Chrome DevTools MCP for coding agents. | 54.9k★. Last push 6 Nov 2026. | Alternative or companion for visual debugging. | Recommended MCP |

## (h) Deployment and DevOps

| Repository | What it does | Quality | How LVR can use it | Priority |
|---|---|---|---|---|
| [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) — `deploy-to-vercel` and `vercel-optimize` | Deploys via Git push, CLI, or temporary deployments. Audits costs, performance, and caching. | 33.6k★. Last push 28 Oct 2026. | Recommend a deployment skill in blueprint.json for a Vercel stack. Use its guidance for final deployment acceptance criteria. | **Required reference** for Vercel |
| [BretFisher/skills](https://github.com/BretFisher/skills) | DevOps skills from Bret Fisher, including creating and auditing GitHub Actions with secure defaults (`/gha-audit`). | 21★. Last push 6 Nov 2026. Small collection maintained by an active practitioner. | Source for CI/CD and security checklists in verification.md. Recommend `/gha-audit` for stacks with CI. | Recommended |
| [ruvnet/claude-flow (now ruflo)](https://github.com/ruvnet/ruflo) | Broad multi-agent harness framework with CI/CD skills. | 81.1k★. Last push 6 Nov 2026. | Use as a reference for CI/CD ideas. | Low priority given its scope |
| [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) — `ci-cd-and-automation` and `shipping-and-launch` | Skills for shipping and CI/CD. | 113.7k★. Last push 1 Nov 2026. | Reference for the final milestone's release checklist. | Optional |

## (i) Handoff and portability across harnesses

| Repository | What it does | Quality | How LVR can use it | Priority |
|---|---|---|---|---|
| [agentsmd/agents.md](https://github.com/agentsmd/agents.md) (formerly `openai/agents.md`) | AGENTS.md specification for agent instructions, used by 60,000+ projects. One file serves Codex, Cursor, Gemini CLI, Copilot, and Devin. | 25.4k★. Last push 10 Sep 2026. | Use the specification as the canonical format reference for HANDOVER.md and AGENTS.md. The LVR bundle must generate a conforming AGENTS.md. | **Required reference** |
| [wshobson/agents](https://github.com/wshobson/agents) | Plugins, agents, skills, and commands for Claude Code, Codex CLI, Cursor, OpenCode, Antigravity CLI, and Copilot. Adapters build per-tool formats from one source. | 42.3k★. Last push 5 Nov 2026. | Reference for `/lvr-handoff` adapters that turn one blueprint into a starting prompt and harness-specific configuration. | **Required reference** for adapters |
| [vercel-labs/skills](https://github.com/vercel-labs/skills) (`npx skills`) | Cross-harness skill installer and registry, with the `find-skills` skill. | 38.4k★. Last push 6 Nov 2026. | Include `npx skills add <repo>` in blueprint.json for skill, plugin, and MCP recommendations to make them portable. | Recommended |
| [affaan-m/ECC](https://github.com/affaan-m/ECC) | Native multi-harness support for Claude Code, Codex, and Qoder, plus beta adapters for Cursor, OpenCode, and Copilot CLI. | 298.6k★. Last push 6 Nov 2026. | Reference for the target harness list and per-harness adaptation in `/lvr-handoff`. | Recommended |
| [obra/superpowers](https://github.com/obra/superpowers) | Explicitly supports several harnesses, including Claude Code, Codex, and Gemini CLI. | 313.7k★. Last push 3 Nov 2026. | Reference for portable skills and multi-harness configuration patterns. | Optional |

---

## Secondary MCP recommendations

All entries were checked on GitHub on 2026-11-07.

| MCP | Repository | Use in LVR |
|---|---|---|
| Context7 | [upstash/context7](https://github.com/upstash/context7) (64.3k★, last push 6 Nov 2026) | Consult current library documentation during builds to reduce incorrect API guesses. |
| Playwright MCP | [microsoft/playwright-mcp](https://github.com/microsoft/playwright-mcp) (39.3k★) | Automated UI verification in `/lvr-build`. |
| Chrome DevTools MCP | [ChromeDevTools/chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp) (54.9k★) | Debugging, performance checks, and visual QA. |
| GitHub MCP | [github/github-mcp-server](https://github.com/github/github-mcp-server) (34.3k★) | Issues and pull requests for users with GitHub repositories. |
| Supabase MCP | [supabase/mcp](https://github.com/supabase/mcp) (3.0k★) | Manage authentication and databases for Supabase stacks. |
| Firecrawl MCP | [firecrawl/firecrawl-mcp-server](https://github.com/firecrawl/firecrawl-mcp-server) (7.8k★) | Web scraping for deep research and competitor analysis. |

---

## Ten integration priorities

1. **blader/humanizer** — Add its 26 writing patterns to `lvr-principles.md` and to the final editing pass. The repository had 66k★ and reported a 16/16 result in a blind test.
2. **Fission-AI/OpenSpec** — Use the change-folder layout (proposal.md, specs, design.md, and tasks.md) and the `continue` and `verify` commands as a reference for `/lvr-continue` and `/lvr-add-feature`. It was active and had 74k★.
3. **deanpeters/Product-Manager-Skills** — Use the discovery and PRD question bank for non-technical users. It covers the Mom Test, Working Backwards, user stories, and Gherkin. Follow the non-commercial license for adaptations.
4. **browserbase/skills** — Use `competitor-analysis` for deep research and `ui-test` for adversarial verification in `/lvr-build`. The collection uses the MIT license.
5. **addyosmani/agent-skills** — Draw from 25 lifecycle skills, including `planning-and-task-breakdown`, `browser-testing-with-devtools`, and `interview-me`. The organization resembles the LVR Conductor.
6. **vercel-labs/agent-skills** — Recommend official skills for React, Next.js, and Vercel in blueprint.json. Use `web-design-guidelines` as input to UI acceptance criteria.
7. **agentsmd/agents.md and wshobson/agents** — Use their instruction format and one-source, multiple-harness adapter pattern for `/lvr-handoff`. The target harnesses include Claude Code, Codex, Gemini CLI, Cursor, and Antigravity.
8. **obra/superpowers** — Apply verification before completion and the discipline in writing-plans to the LVR Constitution. Use the individual patterns where they complement the installed Matt Pocock skills.
9. **Official platform skills** — Suggest shadcn-ui/ui (`npx shadcn add --skill`), supabase/agent-skills, expo/skills, or flutter/agent-plugins in blueprint.json according to the interview's stack decision.
10. **upstash/context7 and microsoft/playwright-mcp** — Recommend these first for up-to-date documentation and browser verification. They work across popular harnesses.

---

## Candidates with lower integration priority

| Repository | Reason |
|---|---|
| [SpillwaveSolutions/sdd-skill](https://github.com/SpillwaveSolutions/sdd-skill) (111★) | Last push 17 Nov 2025, around 12 months before research. Wraps Spec-Kit, which was already known. |
| [kimhons/humanize](https://github.com/kimhons/humanize) (4★, 2 commits) | The hook and scorer provide design ideas. The repository was still small and early-stage. |
| [ORBWEVA/founder-discovery](https://github.com/ORBWEVA/founder-discovery) (1★) | Mom Test and JTBD cover the subject. The repository showed little activity or community uptake. |
| [ruvnet/claude-flow / ruflo](https://github.com/ruvnet/ruflo) (81.1k★) | The framework's CI/CD skills are relevant. The whole harness exceeds LVR's needs. |
| [alexander-kastil/skills-collection](https://github.com/alexander-kastil/skills-collection) (19★) | Claims "860+ skills" with little community uptake. The official vendor collections already cover the relevant platforms. |
| [ducafecat/skills](https://github.com/ducafecat/skills) (6★) | Small collection covering Flutter. Prefer the official flutter/agent-plugins. |
| [travisvn/awesome-claude-skills](https://github.com/travisvn/awesome-claude-skills) (15.7k★) | Last push Apr 2026. ComposioHQ and hesreallyhim were more current at the research date. Useful as an index. |
| [eyaltoledano/claude-task-master](https://github.com/eyaltoledano/claude-task-master) (28.3k★) | Last push Apr 2026, around six months before research. Suitable as a pattern reference. |
| "150+ DevOps skills" collection cited in a blog post | The research could not verify a corresponding GitHub repository. |

---

## Threads findings

Threads offered little dedicated coverage of skills catalogs.

- Indonesian-language searches for "claude skills rekomendasi" and "agent skills kumpulan" found the following posts. <!-- language-audit: verbatim -->
  - "Buat kamu yang coding pakai Claude Code" recommends **addyosmani/agent-skills** (a skill per stage from spec to release) and **Graphify** (Graphify-Labs/graphify). Graphify fell outside the catalog and was not investigated further. <!-- language-audit: verbatim -->
  - "5 Plugin Claude Code Rahasia" recommends Anthropic's official **frontend-design and webapp-testing** bundle (`/plugin install example-skills@anthropic-agent-skills`) and obra's **Superpowers**. These findings agree with the GitHub research. <!-- language-audit: verbatim -->
  - A post mentions "gstack" (cloning a skill to `~/.claude/skills/gstack`). The research could not verify its GitHub repository.
- The search found no Threads posts recommending specific skills for non-technical discovery, branding, or portability across harnesses.

---

## Research method and reliability

- Star counts and activity dates came from the GitHub API (`/repos/<owner>/<repo>` fields `stargazers_count` and `pushed_at`) on 2026-11-07 and were rounded. The names shown reflect redirects, including `affaan-m/everything-claude-code` → `affaan-m/ECC`, `flutter/skills` → `flutter/agent-plugins`, and `openai/agents.md` → `agentsmd/agents.md`.
- The research checked each repository's README and file layout on GitHub using WebFetch.
- The estimate of 60,000+ projects using AGENTS.md comes from the project site and 2026 ecosystem coverage. [agents.md](https://agents.md)
