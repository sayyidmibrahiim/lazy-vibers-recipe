# Brainstorm 03 — Owner decisions (2026-11-19)

1. Product types: not just app vs workflow — MANY: web, mobile, game, RAG, MCP server, n8n workflow, skill/plugin, etc. → data-driven "product type profiles".
2. Family: Lazy-Vibers (/home/ibrahim/projects/lazy-vibers, currently OpenCode-only) should eventually run on all harnesses. Recipe = a Lazy-Vibers skill, installable separately.
   Also wanted: Lazy-Vibers-style auto-delegation — use GitHub "agency agents" profiles; when a specific task appears, auto-summon the agent whose profile fits.
   Data storage: any idea that stores data (plugin/skill/web/mobile) must get the right DB design skill/agent: choose store (SQLite, files, Supabase, …) + schema + relations.
3. Booster tiers approved (core / conditional / reference). Plus: boosters must be light — use then remove, or similar.
Notes: consider modern skills (web design guidelines, anti-slop, design/micro-animation rules, etc.).
Positioning (corrected 2026-11-19): the more detail the user gives, the less the AI has to guess about expectations → fewer questions, interview advances faster. Thin answers → AI asks MORE questions so the result never hallucinates and stays true to what the user expects. Completeness + execution-readiness is the differentiator.
Naming: Lazy Vibers Recipe (prefix confirmation still implicit).

## Round 4 decisions (2026-11-19)
- Boosters "read, not installed": accepted ONLY if no quality drop vs installed. Must be proven by A/B before adoption.
- Selection criterion is QUALITY, never size. humanizer vs anti-slop vs antislop vs stop-slop → head-to-head blind test. (Note: "anti-slop" and "antislop" are two different skills.)
- ERD in Mermaid; other diagrams ASCII. Approved.
- NEW: pipeline must include a framework-discovery step: for ideas that need a framework, find the best modern framework that fits the user's needs and conditions.

## Round 5 decisions (2026-11-19)
- De-slop: prose pass = anti-slop (elithrar, bake-off winner 92/94); design = miqdadbadjuber antislop-human + antislop-layoutmobile (+ contrast-check.py). APPROVED.
- Boosters "read, not installed": REJECTED. Reason: harness-native install is what makes references/, scripts and triggers work; reading the file does not maximize the skill. Boosters are really installed. Lightness comes from: install just-in-time per section, project-local scope where the harness supports it, uninstall at pipeline end with user confirmation.

## Round 6 decisions (2026-11-19) → D11, D12, ticket 26
- Users don't know much and don't say it. The agent must RESEARCH the idea's context for those unknown-unknowns itself (not fill them from model memory). Owner had stated this in an earlier harness session.
- Every AI answer must be research-based and validated against the most up-to-date data findable. Mandatory.

## Round 7 (2026-11-19) — other skills + review skill
- All other skills must be aligned with the brainstorm decisions (not just the old spec). → research/K.
- Review skill (recheck-plan) must be: critical vs the plan, honest, gap-hunting, several steps ahead, skeptical, pessimistic about estimates. CONSISTENT across runs: one full review must catch ALL gaps and give all fixes; on re-run, if no gaps remain → say so honestly; if gaps appear that should have been caught earlier → admit + apologize (and explain why). Research the behaviour. → research/L.
- Commit deferred by owner.

## Round 8 (2026-11-19)
B11 no build-time agents; only specialists fit for thinking/planning/research/brainstorm. A6, P5, R1–R4 accepted as recommended (see spec.md "Owner decisions").
