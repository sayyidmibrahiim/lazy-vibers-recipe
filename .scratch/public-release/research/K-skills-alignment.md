# K: Alignment of the non-init skills with the new direction

Scope: lvp-continue, lvp-handoff, lvp-recheck-plan (non-review items only), lvp-add-feature, lvp-build, lvp-personal-brand, skills/README.md.
Basis: spec.md (D1-D12), brainstorm-03/04, tickets 01-26. Read-only analysis of the current SKILL.md files plus their references/.
Size: S = text edit, M = procedure rewrite, L = new design or multiple files.
Ticket column: number of an existing ticket, or NOT COVERED (NC) with the proposed new ticket in parentheses.

## Cross-cutting observation

Tickets 01-26 are written around `lvr-init-new-idea`. They give the other skills only three things:
- rename (01)
- one `replay` script (02)
- handoff scripts (04)

Four facts are invisible to the other skills today:
- The bundle is no longer a fixed 20 files (08). Every "all 20 files" check in continue, handoff, recheck and build is therefore wrong.
- The "no Mermaid" rule (handoff B19, recheck R3.5) now contradicts D7.
- "No web access -> `unverified` and continue" appears in add-feature, recheck and brand. It contradicts D12/ticket 26.
- The README promise "folder removal is the complete uninstall" contradicts D4 (JIT installs plus uninstall at the end).

## lvp-continue

| # | Change | Why / decision | Ticket | Size |
|---|---|---|---|---|
| C1 | Rename; `.lvp` -> `.lvr`; `/lvr-*` pointers | D1 | 01 | S |
| C2 | Replace the prose replay table (Step 2b) with `lvr.mjs replay`; keep a prose fallback | D8 | 02 | M |
| C3 | Replay handles `section_blocked`, `impact_analysis`, `folder_gate_rejected`; E-01 (S9 vs S10); E-06 | sync audit | 03 | S |
| C4 | Replay and state must carry the new facts: active profiles + flags, S5b framework decision, `boosters.installed[]` (scope/path/SHA), `context_research`, research log, `agent_delegated`, and S5b in the Section map | D2, D3, D4, D9, D10, D11 | NC (27) | M |
| C5 | Resume at the exact boundary under adaptive depth: persist and replay the per-section coverage map ("S4: 6 of 9 facts known") | ticket 16 | NC (27) | M |
| C6 | Capability probe adds web access; if absent, explain how to enable it and stop (no memory fallback) | D12 | NC (32) | S |
| C7 | On resume, check freshness: facts older than `freshness.json` limits (prices >90d etc.) are re-researched before the Section continues | D12 | NC (32) | M |
| C8 | Resuming a Section re-installs its missing conditional boosters (JIT) and reports boosters by tier (core/conditional/reference) | D3, D4 | NC (32) | S |
| C9 | A delegation journaled `agent_delegated` with no result is re-run (idempotent) on resume | D9 | NC (32) | S |
| C10 | If the pipeline ended or died before the "uninstall N boosters?" prompt, resume offers the cleanup | D4 | NC (36) | S |
| C11 | Progress summary and 0-byte-file check use the variable file list (20 base + profile files from state/blueprint) | D2, ticket 08 | NC (28) | S |
| C12 | Section-procedure lookup and the "init skill not installed" fallback point at `lvr-init-new-idea` and its `profiles/`, `boosters.json`, `agents.json` | 05, 08, 17 | NC (32) | S |
| C13 | If `product_type` is missing (project started before profiles) ask it before continuing S1+ | D2 | NC (32) | S |
| C14 | `probe grade` and `gate` via script | 02 | 02 | S |

NOT COVERED: 10 (C4, C5, C6, C7, C8, C9, C10, C11, C12, C13).

## lvp-handoff

| # | Change | Why / decision | Ticket | Size |
|---|---|---|---|---|
| H1 | Rename | D1 | 01 | S |
| H2 | Call `lint`, `crosscheck`, `blueprint emit`, `stubs`, `handoff-prompt`; AI fixes only what lint reports; prose fallback | D8 | 04 | M |
| H3 | Lint calls `cite check` (sources, dates, freshness); a decision resting on an `unverified` fact cannot be `designer_filled` | D12 | 26 | S |
| H4 | "All 20 files" becomes base 20 + profile files. Lint groups B/F need structure rows for UI_SPEC, SPEC/ai.md, data module files and the workflow bundle (SKILL.md draft, user-profile schema, TOOLS, EVALS, install plan) | D2, tickets 10, 11, 14, 15 | NC (28) | M |
| H5 | B19 "no Mermaid fences" must allow the Mermaid ERD in the data model and still ban other Mermaid | D7 | NC (28) | S |
| H6 | `blueprint.json` schema v2: profiles, flags, extra files, boosters, framework decision, freshness dates, agents. Ticket 08 only lists files | D2, D10 | NC (28) | M |
| H7 | Before emit, re-research expired facts instead of only flagging them (handoff may happen weeks after S9) | D12 | NC (37) | M |
| H8 | Print and write booster install lines for the BUILDER (native install; core-for-builder such as verification-before-completion, design boosters when `has_ui`). The current CAPABILITIES row format is a pre-D4 "read/install line" | D3, D4 | NC (37) | M |
| H9 | Owns the "uninstall N boosters installed for this project?" prompt after handoff | D4 | 06 | S |
| H10 | Stubs for more harnesses than CLAUDE.md/GEMINI.md (QWEN.md, Kimi, Cursor/Copilot rules pointing at AGENTS.md); ticket 18 covers manifests, not stubs | 18 | NC (37) | S |
| H11 | Anti-slop pass (elithrar) on HANDOFF-PROMPT.md and owner-facing text; ticket 07 lists only verification-before-completion for handoff | D6 | NC (37) | S |
| H12 | "Fix now" jumps into owning procedures of `lvr-init`, including profile-specific sections; keep the precise-instructions fallback | D2 | NC (37) | S |

NOT COVERED: 8 (H4, H5, H6, H7, H8, H10, H11, H12).

## lvp-recheck-plan (non-review items only)

The critical-review redesign is excluded; another agent handles it.

| # | Change | Why / decision | Ticket | Size |
|---|---|---|---|---|
| R1 | Rename; `/lvr-*` | D1 | 01 | S |
| R2 | R3.1 "all 20 bundle entries" becomes the variable list; rows for UI_SPEC, ai.md (eval set >= 10), data module, workflow bundle | D2 | NC (28) | S |
| R3 | R3.5 "no Mermaid" gets the ERD exception | D7 | NC (28) | S |
| R4 | Step 4 "no web -> unverified, continue" is replaced by: stop with guidance. `unverified` only after recorded failed queries | D12 | NC (33) | S |
| R5 | Staleness is decided by `references/freshness.json` limits, not ad hoc; freshest primary source wins; >=2 sources for key facts | D12 | NC (33) | M |
| R6 | Mechanical R3 checks and R2 sweep call `lvr lint`, `crosscheck`, `cite check`, `replay` instead of prose | D8 | NC (33) | M |
| R7 | Re-run `signals` for the S5b framework decision when `recheck_by` is due (ticket 12 sets the field, nothing consumes it) | D10 | NC (33) | M |
| R8 | Refresh the Domain Brief: regulations amended, new rates/fees, since the brief date | D11 | NC (33) | M |
| R9 | Audit rows for profile exit-criteria additions and for UI_SPEC / ai.md / data-module consistency (ERD vs schema) | D2 | NC (33) | M |
| R10 | JIT-install the booster a re-audit needs (threat-modeling, cost-estimator live prices), then clean up | D4 | NC (33) | S |
| R11 | May delegate specialist re-audit (DB, security, cost) through the routing table; same planning-only brief and journal `agent_delegated` | D9 | NC (33) | M |
| R12 | R3.6 limitations list covers degraded boosters by tier plus failed delegations | D3, D9 | NC (33) | S |

NOT COVERED: 11 (R2-R12).

## lvp-add-feature

| # | Change | Why / decision | Ticket | Size |
|---|---|---|---|---|
| A1 | Rename | D1 | 01 | S |
| A2 | `blueprint.json` regenerated by `blueprint emit` | D8 | 04 | S |
| A3 | `lvr ids next` (F-NN, D-NNN, M<n> from disk) instead of prose derivation | D8 | NC (29) | S |
| A4 | Parked features get a USER_FLOWS stub or B9 is relaxed (pick one) | E-05 | 03 | S |
| A5 | Replay handles the `feature_*` events (only `impact_analysis` is listed in 03) | 03 | NC (27) | S |
| A6 | The never-rule "never add a bundle file" blocks profile effects. A feature can flip `has_ui`, `has_llm` or `stores_data`, and must then add UI_SPEC / SPEC/ai.md / the data module through the profile engine, with a decision. Define when a new file is legal | D2, tickets 08, 11, 14, 15 | NC (29) | L |
| A7 | Context research for the feature: Domain Brief delta, "Things you may not know" with source + date, then question or `designer_filled` with citation | D11 | NC (29) | M |
| A8 | Step 4 "no web -> unverified" removed; sources + dates + freshness; cross-check key facts | D12 | NC (29) | S |
| A9 | JIT boosters for capture and impact (deliver-edge-cases, user-stories, acceptance-criteria, threat-modeling, cost-estimator) | D3, D4, ticket 07 | NC (29) | S |
| A10 | Capture applies the plan-quality gaps: mandatory unhappy paths, abuse/threat, regulated-domain check, usage-based cost, NFR/ops. Ticket 13 targets init S4 only | ticket 13 | NC (29) | M |
| A11 | Adaptive depth for capture: coverage map, fewer questions for a detailed request, more for a thin one | ticket 16 | NC (29) | S |
| A12 | A feature that needs a new framework, library or service runs a mini S5b (signals + top 3 + recorded decision) | D10 | NC (29) | M |
| A13 | Delegation for impact rows: database-architect for data-model/ERD edits, threat-model for SECURITY.md, with the planning-only brief | D9 | NC (29) | M |
| A14 | Impact matrix gets rows for UI_SPEC, ai.md, data-module files, workflow bundle, and the Mermaid ERD (append-only edit rule for Mermaid) | D2, D7 | NC (29) | M |
| A15 | After apply, run `lint`, `crosscheck` and `cite check` on the touched files | D8, ticket 26C | NC (29) | S |
| A16 | Boosters and agent profiles installed during the feature are uninstalled when it closes (or at the pipeline's cleanup) | D4 | NC (36) | S |

NOT COVERED: 13 (A3, A5-A16).

## lvp-build

| # | Change | Why / decision | Ticket | Size |
|---|---|---|---|---|
| B1 | Rename | D1 | 01 | S |
| B2 | Writes `project.status` building/complete; who emits `error` | E-04 | 03 | S |
| B3 | Replay keeps milestones added after the lock | E-06 | 03 | S |
| B4 | "Load builder context in AGENTS.md order" must include UI_SPEC, SPEC/ai.md, data module/migrations, workflow-bundle files, and the profile file list from `blueprint.json` | D2 | NC (30) | S |
| B5 | Preflight freshness gate: re-verify framework/library versions (live), prices and quotas against `freshness.json` and the S5b `recheck_by`. Stale means refresh or route to recheck, never build on it | D10, D12 | NC (30) | M |
| B6 | Builder-time boosters installed natively and cleaned up: verification-before-completion, design boosters when `has_ui` (vercel guidelines verify, contrast-check.py, emilkowalski budget, impeccable opt-in), supabase-postgres-best-practices, mcp-builder/n8n per profile | D3, D4, D6 | NC (30) | L |
| B7 | Verification kinds beyond commands: run the ai.md eval set and EVALS.md, migration up/down, RLS checks, contrast and motion checks | tickets 10, 11, 14, 15 | NC (30) | M |
| B8 | Deployment check and "done" per product type. The current check is live URL + HTTP status. MCP server, CLI, n8n, skill/plugin, extension, game and mobile need their own definition (install and run, publish link, store build) | D2 | NC (31) | L |
| B9 | During the build, use live docs (Context7 / official docs), not model memory; an API that differs from the plan is a bundle defect routed to recheck | D12 | NC (30) | S |
| B10 | `lvr verify run` (capture command, exit code, output, timestamp) and `state milestone set` via the script, so the log format is not prose-dependent | D8 | NC (30) | M |
| B11 | Agent delegation while building (code review, DB, security specialists). The planning-only brief does not fit builder work; needs a design decision, or an explicit "out of 1.0" | D9 | NC (30) | M |
| B12 | For skill/plugin and workflow products, build and verify the manifests and install plan | ticket 10 | NC (30) | M |
| B13 | Stack decision carries `recheck_by`; build refuses an expired one without a re-run | D10 | NC (30) | S |

NOT COVERED: 10 (B4-B13).

## lvp-personal-brand

| # | Change | Why / decision | Ticket | Size |
|---|---|---|---|---|
| P1 | Rename | D1 | 01 | S |
| P2 | Spec/conventions list `brand_*` events; replay handles them | E-02/03 | 03 | S |
| P3 | `cite check` over `brand/`; market claims within the 12-month freshness limit; cross-check | D12, ticket 26C | NC (34) | S |
| P4 | Prose pass with anti-slop (elithrar) and ux-copy voice. Core boosters are uninstalled at pipeline end, so brand must JIT re-install and clean up | D3, D4, D6 | NC (34) | S |
| P5 | Gate "deployment live + HTTP 2xx" only fits web. Needs the per-type definition from B8 (npm/marketplace link, release, store listing) | D2 | NC (31) | M |
| P6 | Platform facts in `brand-templates.md` (LinkedIn character limits, formats) verified live with date, not frozen | D12 | NC (34) | S |
| P7 | Workflow-mode products: no personal data from the user-profile schema, EVALS cases or TOOLS in brand files | ticket 10 | NC (34) | S |
| P8 | Optional writer/marketing agent through the routing table (planning-only brief) | D9 | NC (34) | S |
| P9 | Evidence table accepts new proofs: EVALS results, eval pass rates, UI_SPEC compliance check output | tickets 10, 15 | NC (34) | S |

NOT COVERED: 7 (P3-P9).

## skills/README.md

| # | Change | Why / decision | Ticket | Size |
|---|---|---|---|---|
| D1 | Rename (title, catalog, commands, `.lvr/`) | D1 | 01 | S |
| D2 | Layout and catalog: `scripts/lvr.mjs`, `boosters.json`, `agents.json`, `freshness.json`, `profiles/`; S0-S9 + S5b; "20 files" becomes base + profile files | D2, D8, D10 | NC (35) | S |
| D3 | Install table and manifests per harness | ticket 18 | 18 | M |
| D4 | The "Uninstall" section says folder removal is the complete uninstall and "skills add no hooks/config". After D4 boosters installed at runtime need the pipeline-end uninstall; describe it | D4 | NC (35) | S |
| D5 | Requirements: Node >= 18 for `lvr.mjs` (prose fallback otherwise); web access is mandatory | D8, D12 | NC (35) | S |
| D6 | License section text: "NC boosters are runtime dependencies" vs ticket 05 "no NC, AGPL or unlicensed" | ticket 05 | NC (35) | S |
| D7 | Product types, boosters tiers and CREDITS pointer in this README. Ticket 23 covers only the root README | D2, D3 | NC (35) | S |
| D8 | References byte-synced to docs/spec | ticket 22 | 22 | S |

NOT COVERED: 5 (D2, D4, D5, D6, D7).

## Summary of NOT COVERED

continue 10, handoff 8, recheck-plan 11, add-feature 13, build 10, personal-brand 7, skills/README 5. Total 64 rows, which consolidate into the 10 proposed tickets below.

## Proposed new tickets (27-37 range; ticket 26 is the last existing)

| New # | Title | Folds in | Blocked by | Size | Agent |
|---|---|---|---|---|---|
| 27 | State + journal schema v2 and replay coverage | C4, C5, A5; new events/fields from 05, 06, 08, 12, 16, 17, 26, S5b in the Section map; fixtures per event | 02, 03 | L | Opus design, Sonnet build |
| 28 | Variable bundle contract: base 20 + profile files | C11, H4, H5, H6, R2, R3, A14 (file part); conventions section 8; lint/audit structure rows for UI_SPEC, ai.md, data module, workflow bundle; Mermaid-ERD exception to the no-Mermaid rule; `blueprint.json` schema v2 | 04, 08 | L | Opus design, Sonnet build |
| 29 | lvr-add-feature alignment | A3, A6-A15: profile-flag flips and the "no new bundle file" rule, context research, no-unverified, JIT boosters, S4 gap rules, adaptive depth, mini S5b, delegation, `ids next`, post-apply lint | 07, 08, 12, 13, 16, 17, 26, 28 | L | Opus |
| 30 | lvr-build alignment | B4-B7, B9-B13: context order, freshness preflight, builder boosters, eval/migration/UI verification, `verify run`, builder delegation decision, manifests | 14, 15, 11, 12, 26, 28 | L | Opus design, Sonnet build |
| 31 | "Live/done" definition per product type | B8, P5: add `verification_kind`/`release_check` to each profile (09), used by build deployment check and the brand gate | 09 | M | Sonnet |
| 32 | lvr-continue alignment | C6-C9, C12, C13 | 02, 05, 06, 27 | M | Sonnet |
| 33 | lvr-recheck-plan non-review alignment | R4-R12 (the review redesign stays with the other agent; coordinate on Step 3 text) | 04, 12, 26, 28 | M | Sonnet |
| 34 | lvr-personal-brand alignment | P3, P4, P6-P9 | 06, 26 | S | Sonnet |
| 35 | skills/README.md rewrite | D2, D4-D7 | 06, 08, 18 | S | Sonnet |
| 36 | Booster lifecycle after "pipeline end": reinstall and cleanup rules for continue, recheck, add-feature, build, brand | C10, A16, B6 (cleanup part), R10, P4 (reinstall part). Define "pipeline end" and who owns the uninstall prompt when later skills install again. Extends 06 | 06 | M | Opus |
| 37 | lvr-handoff alignment | H7, H8, H10, H11, H12 | 04, 06, 18, 28 | M | Sonnet |

Suggested order: 27 and 28 right after 04 (before M2/M3), because five skills depend on them. 29, 30, 32, 33, 34, 35, 37 land in M4 or M5. 31 follows 09. 36 follows 06. Add 27-28 to M1/M3 and the rest to M4/M7 in spec.md. Ticket 24 (dogfood) should also run `lvr-add-feature` and `lvr-recheck-plan` once on the KPR bundle, to prove the profile-flip and research paths.

## Decisions that need the owner

- B11: are builder-time specialist agents in 1.0? The planning-only brief would have to be replaced by a coding brief. The cheap choice is to leave delegation to planning skills only and say so.
- A6: add-feature may add a bundle file when a profile flag flips, with a recorded decision. The alternative, parking such a feature and sending the user to a fresh `init`, is worse. Recommend allowing it.
- P5/B8: for non-web products "live" means the product is installable and runs from a clean environment. State this explicitly.
