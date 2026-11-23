# Spec 05 — Boosters and section routing

The pinned registry defines sources, installs and triggers. In an installed skill it is available as `references/boosters.json`. The lifecycle procedure covers staging, ownership, cleanup and user-visible failure handling.

| Tier | Use |
|---|---|
| Core | Check and install during bootstrap. The affected step stops on failure to offer help, degraded mode or stop. |
| Conditional | Supply only when the section and known product conditions apply. Keep unknown conditions pending. |
| Reference | Consult and credit the exact source for the work at hand. |

The six core entries are PM skills, grilling, planning-and-task-breakdown, ponytail, anti-slop, and SimpleEnglish. Each entry needs a permissive license. Historical plans may contain separately disclosed runtime-only dependencies under ADR-0001. Web search and page fetch stay mandatory under spec 07. Temporary loss of web access stops research with enablement guidance.

## Route by section

| Stage | Load at start | Apply as a pass | Consult as a reference |
|---|---|---|---|
| S0 | grilling for targeted follow-ups | | |
| S1 | grilling for ready decisions | define-problem-statement, mom-test | define-jtbd-canvas |
| S2 | grilling for budget and device questions | | Internal cost leads, then verify every actual price live |
| S3 | grilling for unresolved data and privacy choices | threat-modeling when public forms, stored data or a regulated domain apply | Domain Brief sources |
| S4 | grilling for the feature capture rounds | mom-test, deliver-edge-cases, user-stories, deliver-acceptance-criteria. For UI ideas, use applicable impeccable, emil-design-eng, ux-copy, antislop-human, and antislop-layoutmobile guidance for layout, motion and accessibility. For AI features, apply prompt-engineer. | |
| S5 | discover-competitive-analysis for the scan | | |
| S6 | | architecture-designer, threat-modeling when applicable | cost-estimator for the checklist and cost model. Refresh every price before using it. |
| S7 | | define-prioritization-framework | |
| S8 | planning-and-task-breakdown | | |
| S9 | | deliver-prd, applicable api-designer, user-stories and deliver-acceptance-criteria for requirements, ponytail for code style, simple-english then anti-slop for prose. Where applicable, use ui-ux-pro-max, impeccable, emil-design-eng, ux-copy, antislop-human, and antislop-layoutmobile for interface work. Use prompt-engineer for AI features, evaluate-rag for retrieval, and agent-spec or skill-creator where the product calls for them. | develop-adr, spec-kit-templates when data applies, cost-estimator, the upstream AGENTS.md format, and applicable review-animations-standards and web-interface-guidelines |
| Handoff | | | verification-before-completion for the builder's evidence gate |

When a skill or reference actually informs the work, append a `booster_loaded` event with its name, section and usage (`start`, `pass`, or `reference`). Record handoff uses under S9. A presence check does not establish a load. If the preferred skill was unavailable, document the fallback in the Section Record and surface the degraded mode in OVERVIEW.

Use the installed anti-slop skill for the S9 prose pass. The MIT snapshot in `references/third-party/anti-slop/` is available as a degraded reference when a user proceeds without the install. Fetch the [AGENTS.md format](https://raw.githubusercontent.com/agentsmd/agents.md/main/README.md) as documentation.

Keep the registry, routing and shipped references together when changing a dependency. Credit each pinned source and verify its license before adding it.
