# Roadmap v2 — Lazy Vibers Recipe 1.0 (public)

**Goal:** ship **Lazy Vibers Recipe** (prefix `lvr`, repo `lazy-vibers-recipe`) as a public, install-anywhere planning pack.
- It turns any idea into a complete, execution-ready plan, so a builder agent never has to guess.
- Ideas can be an app, a game, a RAG system, an MCP server, an n8n workflow, a skill/plugin, or another product type.
- Plans are built from the best curated GitHub skills and specialist agents.

**Positioning:** the more detail the user gives, the less the AI guesses, so the interview moves faster. Thin answers mean the AI asks more questions, so the result never hallucinates and matches what the user expects. Completeness and execution-readiness are the differentiator.

**Family:**
- Recipe is the planning skill pack of Lazy-Vibers (`/home/ibrahim/projects/lazy-vibers`), installable on its own.
- The contract between the two is `blueprint.json` + `.lvr/`.
- Recipe ships first.

**Sources:**
- `brainstorm-01..04*.md`
- `research/A–J` (rubric: `research/RUBRIC.md`)
- bake-off: `research/I-bakeoff-key.md`

## Locked decisions

| # | Decision |
|---|---|
| D1 | Name Lazy Vibers Recipe, prefix `lvr` (`/lvr-*`, `.lvr/`), repo `lazy-vibers-recipe` |
| D2 | Data-driven product-type profiles (10 types at launch); `stores_data` flag triggers the data module |
| D3 | Boosters in 3 tiers. **Core** (installed at init) · **conditional** (installed just-in-time when the idea or section needs it) · **reference** (excerpt/template, credited) |
| D4 | Boosters are really installed through each harness's native mechanism, never just "read". Install is project-local where supported; uninstall at pipeline end with confirmation |
| D5 | Selection by measured quality (rubric /20, blind bake-offs where the outputs are comparable), never by size or stars |
| D6 | Prose de-slop = anti-slop (elithrar, 92/94). Design = impeccable, emilkowalski motion, ux-copy, antislop-human, antislop-layoutmobile, vercel guidelines |
| D7 | ERD in Mermaid; every other diagram ASCII |
| D8 | Deterministic steps run in one zero-dep Node `lvr.mjs` (synced copy per skill) with a prose fallback |
| D9 | Specialist agents through a routing table: native spawn, then explicit spawn, then inline role-play. Profiles are always wrapped in a planning-only brief |
| D10 | Framework discovery = new step S5b, live-signal scored |
| D11 | Context research (unknown-unknowns): from S0 on, the AI researches the idea's domain for what the user doesn't know and didn't say. Findings are shown with sources, then turned into questions or `designer_filled` decisions. Never from model memory |
| D12 | Research-grounded answers: every AI claim, recommendation and filled decision rests on live research with the freshest source found. Cross-check key facts with ≥2 sources; set freshness limits; no model-memory fallback. Web research is a hard requirement |

## Milestones

| M | Theme | Tickets | Exit |
|---|---|---|---|
| M1 | Foundations | 01 rename · 02 core scripts · 03 contract fixes · 04 handoff scripts · 26 research-grounded behaviour | `/lvr-*` works end to end on the futsal fixture; replay = live state |
| M2 | Booster system | 05 registry + tiers · 06 just-in-time install/uninstall · 07 apply curation map | Every section loads its winners; uninstall leaves no trace |
| M3 | Product types | 08 profile engine · 09 ten profiles · 10 workflow-mode bundle · 11 data module · 12 framework discovery | A KPR house-hunter workflow and a Supabase web app both compile complete bundles |
| M4 | Plan quality | 13 interview gaps · 14 UI_SPEC · 15 AI-feature spec · 16 adaptive depth | Futsal re-run closes all 7 audit gaps |
| M5 | Delegation | 17 agent routing | DB/security/research tasks auto-delegate on 3 harnesses |
| M6 | Install anywhere | 18 manifests · 19 OS × harness matrix | Install verified on ≥4 harnesses × 3 OS |
| M8 | Skill alignment + review | 27 schema v2 · 28 variable bundle · 29 add-feature · 30 build · 31 done-per-type · 32 continue · 33 recheck alignment · 34 brand · 35 skills README · 36 booster lifecycle · 37 handoff · **38 critical review** | Every skill obeys D1–D12; review run twice = identical; planted miss → apology |
| M7 | Public release | 20 hygiene · 21 web app scope · 22 CI + tests · 23 docs · 24 dogfood proof · 25 release | Repo public, v1.0.0 tagged |

## Order

- 01 → 02 → 03 → 04 → 26 (26 before M2: it changes every section)
- then M2 (05 → 06 → 07)
- then M3 (08 → 09/10/11/12 in parallel)
- then M4 + M5 in parallel
- then M6
- M8 runs alongside M3–M6 (follow each ticket's Blocked by); 38 right after 26/27
- then M7 (24 needs everything incl. M8; 25 last)

## Out of scope for 1.0

- Lazy-Vibers multi-harness orchestrator (separate repo).
- Hosted service.
- Native iOS HIG/Material skill (gap; reference only).
- Full web UI translation.

## Owner decisions (resolved 2026-11-19)
- B11: no builder-time specialist agents in 1.0. Delegate only to specialists that truly fit thinking, planning, research and brainstorm/interview work. "Build-time agents: after 1.0."
- A6: add-feature may add a bundle file when a profile flag flips, with a recorded decision.
- P5: "live" for non-web = installable + runs from a clean environment + per-type proof.
- R1: overall = floor((mean + min lens)/2); BUILD-READY needs 0 blocking, min ≥8, overall ≥8.
- R2: one `freshness.json` everywhere: prices/quotas/versions 30 days, ToS/legal 60, market 90, statistics 365.
- R3: review never edits the plan; fixes go through a separate apply step after the user OKs them.
- R4: rename to `lvr-review-plan`.
