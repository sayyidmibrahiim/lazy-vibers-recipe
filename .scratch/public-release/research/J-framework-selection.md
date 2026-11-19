# J — Framework Discovery (research, 2026-11-19)

Scope: add a FRAMEWORK DISCOVERY step to the Lazy Vibers Recipe pipeline (brainstorm-03 round-4 decision). Everything marked **[V date source]** was fetched live on 2026-11-19 by me; **[U]** = unverified (prior knowledge/opinion; must be re-fetched before it reaches a user). Skills were cloned to `/tmp/claude-1000/-home-ibrahim-projects-lazy-vibers-planner/ee201c87-bd98-5c51-a2d1-4022b81f176a/scratchpad/curate-j/` and only read, never run.

Artifacts produced next to this file:
- `J-signals-probe.mjs` — working zero-dep Node >=18 prototype of the signals fetcher (ran it on 61 candidates).
- `J-candidates.json` — its input (id, type, GitHub repo, npm/PyPI/crate/pub name, llms.txt URL, Context7 query).
- `J-signals-snapshot-2026-11-19.json` — raw output (evidence for every number in section 4).

---

## 1. Existing skills (scored with RUBRIC.md; read SKILL.md, nothing executed)

Searched GitHub repos + code search (`filename:SKILL.md` for "tech stack", "framework selection", "stack advisor", "which framework", "tech stack recommend"). Almost all hits are 0-star toy repos. Real candidates:

| # | Skill (repo) | License / last commit / stars | Gate | Act | Out | Self | NonTech | Harn | Tok | Help | Evid | Maint | Adopt | **/20** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `tech-stack-eval` (shawnpang/startup-founder-skills) | MIT / 2026-03-16 / 393 | pass | 2 | 2 | 1 | 1 | 2 | 2 (8.1 KB) | 0 | 1 | 1 | 1 | **13** (earlier pass said 11; I count inline examples + confidence tiers) |
| 2 | `the-architect` (Hainrixz/the-architect) | MIT / 2026-10-25 / 584 | pass | 2 | 2 | 2 | 1 | 1 | 1 (14.8 KB + references) | 0 | 1 | 2 | 1 | **13** |
| 3 | `tech-stack-evaluator` (alirezarezvani/claude-skills) | MIT / 2026-11-17 / 30k | pass | 1 | 1 | 1 | 0 | 1 (python) | 2 (4.3 KB) | 1 | 1 | 2 | 2 | **12** |
| 4 | `project-architect` (ersinkoc/project-architect) | MIT / 2026-10-03 / 259 | pass | 1 | 2 | 1 | 1 | 2 | 1 (9.2 KB) | 0 | 0 | 2 | 1 | **11** |
| 5 | `agent-framework-selection` (2583612384/...) | **no LICENSE** / 2026-09-30 / 0 | **FAIL** | 2 | 2 | 2 | 1 | 2 | 2 | 0 | 1 | 2 | 0 | (14, excluded) |

What each actually does (and what is missing):
- **#1 shawnpang tech-stack-eval**: 8-step workflow (clarify -> 2-4 candidates -> 6-8 weighted criteria -> 1-5 scores -> ecosystem health -> TCO -> migration -> recommendation), output template, anti-pattern list (resume-driven, hype-cycle). Asks team skills/budget. Weakness: ecosystem health is "evaluate GitHub activity..." with no endpoints/thresholds beyond Thriving/Stable/At-Risk labels; no hard-filter stage; no product-type awareness.
- **#2 the-architect**: best *process* match. State machine DISCOVERY -> DEEP DIVE -> ARCHITECTURE (gate: "user says yes, zero markers open") -> GENERATE. Shapes (14 product shapes incl. mobile, browser-extension, cli-library-mcp, agent-app, desktop, automation-bot) each with "Is this your project? Yes/No", default "runtime track", capabilities. Strong rule: *never write a version from memory*; a `stack-researcher` subagent resolves every pin from registry endpoints (npm registry, PyPI JSON, go proxy...) and returns package -> version -> source URL -> date, flagging prereleases/unmaintained; knowledge files carry "Last verified: 2026-10-17" and are explicitly a cache. Weaknesses: no scripts at all (validator is a subagent), no numeric scoring, no health thresholds, depends on `${CLAUDE_PLUGIN_ROOT}`, `AskUserQuestion`, Agent tool (it states fallbacks). Pinned-version tables go stale in weeks (they pin `go1.27.2`, `bubbletea v2.1.0`...) so DO NOT vendor numbers, only the pattern.
- **#3 alirezarezvani tech-stack-evaluator**: capability list + 7 Python scripts (`stack_comparator`, `tco_calculator`, `ecosystem_analyzer`, `security_assessor`, `migration_analyzer`). `ecosystem_analyzer.py` only scores a *dict you hand it* (weights github 25/npm 20/community 20/corporate 15/maintenance 20) - it fetches nothing live (grep found no HTTP code). Useful as a weights reference, not as a signals source. Python dependency breaks "zero-dep Node" policy.
- **#4 project-architect**: `references/tech-stacks.md` is a generic AskUserQuestion decision tree (language -> framework -> DB), tells the agent to web-verify versions. Nothing measurable.
- **#5 agent-framework-selection** (RAG/agents only, Chinese): the best *determinism* design I found: hard-constraint elimination -> 7 weighted dimensions with **anchored 1-5 rubric per dimension** (`references/scoring.md`: "default 3, moving needs an anchor") -> tie-break chain (hard-constraint advantage -> capability coverage -> deployment cost -> ecosystem) -> "no ties, no 'it depends'" -> conservative-default framework per scenario. Unlicensed => copy nothing; re-derive the ideas independently (ideas are free, text is not).

**Verdict (overlap rule):** no skill does what the owner wants (hard filters + LIVE health signals + AI-buildability + user-condition fit + recorded decision). Recommended reuse:
1. Do NOT make any of them a core booster. Reference tier only: `the-architect` (process + "never pin from memory" + shapes -> our product-type profiles) and shawnpang `tech-stack-eval` (output template + anti-pattern list, 8 KB).
2. Build our own: an `lvr` script `stack-signals` (section 2) + a ~3 KB `references/framework-discovery.md` procedure + a data file `frameworks.json` (section 3/4). This fits the "scripts offload deterministic work" direction (brainstorm-02).
3. Skip #3 (python, offline) and #4. Keep #5 only as a design citation after confirming the owner's tolerance for "idea inspired by unlicensed repo" (low risk).

---

## 2. Live signals an agent can fetch cheaply

All endpoints below were called on 2026-11-19 and returned HTTP 200 unless noted. Node >=18 global `fetch`; send a `user-agent` header. Prototype: `J-signals-probe.mjs`.

| Signal | Endpoint (GET unless noted) | Fields to read | Cost / gotchas |
|---|---|---|---|
| Repo health | `https://api.github.com/repos/{o}/{r}` [V] | `pushed_at`, `archived`, `stargazers_count`, `license.spdx_id`, `open_issues_count` (includes PRs - weak), `subscribers_count` | **60 req/h unauthenticated.** 61 candidates x 2 calls exceeded it. Probe uses `LVR_GH_CLI=1` to route via the user's own `gh api`. Never ship a token. `license` = `NOASSERTION` for multi-license repos (n8n, astro, convex, ai-sdk) -> fall back to package license. |
| Latest release | `.../repos/{o}/{r}/releases/latest` [V] | `tag_name`, `published_at` | Monorepos return the wrong tag (astro -> `@astrojs/node@11.1.14`, sveltekit -> `adapter-node`, flutter -> `3.19.0-0.1.pre`, ai-sdk -> `@ai-sdk/workflow-harness`). Prefer the package registry for version+date. Mismatch GH major vs registry major (e.g. MCP TS SDK GH `v2.4.0` vs npm `@modelcontextprotocol/sdk` `1.32.2`) = flag for human check. |
| Last commit | `.../commits?per_page=1` [V] | commit date | `pushed_at` is cheaper but includes any branch. |
| Issue responsiveness | `https://api.github.com/search/issues?q=repo:{o}/{r}+is:issue+is:closed+closed:>{D-90}&per_page=1` and the same with `created:>` [V] | `total_count` (closed90 / opened90) | Search API: 30 req/min. Svelte: 118 closed / 141 opened in 90 d = 0.84. Far better than raw `open_issues_count` (1312). |
| Latest version + license | npm: `https://registry.npmjs.org/{pkg}/latest` (scoped: `@scope%2Fname`) [V] | `version`, `license`, `deprecated`, `peerDependencies`, `engines` | Tiny. **Do not GET the full packument** (svelte = 4.8 MB; abbreviated form 1.8 MB). |
| Version publish date, advisories, deprecation | `https://api.deps.dev/v3/systems/{npm\|pypi\|cargo\|maven\|nuget\|go}/packages/{name}/versions/{ver}` [V npm] | `publishedAt`, `licenses`, `advisoryKeys`, `isDeprecated`, `links` | One uniform endpoint for most ecosystems; replaces the npm packument for dates. Package-level (`.../packages/{name}`) lists all versions with `publishedAt` -> compute breaking-bump cadence (183 KB for svelte; fine). |
| Downloads | npm: `https://api.npmjs.org/downloads/point/last-week/{pkg}` and `.../range/{from}:{to}/{pkg}` [V]; PyPI: `https://pypistats.org/api/packages/{pkg}/recent` [V]; crates: `https://crates.io/api/v1/crates/{name}` -> `recent_downloads` [V, needs UA, 1 req/s]; pub.dev: `https://pub.dev/api/packages/{pkg}` [V, version/date only]; RubyGems: `https://rubygems.org/api/v1/gems/{name}.json` [V]; Packagist: `https://packagist.org/packages/{vendor}/{pkg}.json` [V]; Hex: `https://hex.pm/api/packages/{name}` [V] | `downloads` | The range endpoint gives a trend (compare last 28 d vs the same window 6 months ago). Compare only WITHIN a product type; cross-type absolutes are meaningless (commander 766M vs hono 112M vs godot n/a). |
| Security / maintenance posture | OpenSSF Scorecard `https://api.securityscorecards.dev/projects/github.com/{o}/{r}` [V] | `score`, checks `Maintained`, `Security-Policy`, `Vulnerabilities`, `Contributors` | Coverage partial: 404 for hono, mastra (newer/uncovered). Treat as optional bonus, never a gate. |
| Known vulnerabilities for a pinned version | `POST https://api.osv.dev/v1/query` body `{"package":{"name":"next","ecosystem":"npm"},"version":"15.0.0"}` [V: returned GHSA RCE entry] | `vulns[]` | Run on the version we will pin, not on `latest` of history. Also reachable via deps.dev `advisoryKeys`. |
| Release/EOL lifecycle | `https://endoflife.date/api/{product}.json` (v1 style: `/api/v1/products/{product}`) [V next.js, nodejs; 404 for flutter] | `cycle`, `eol`, `latest`, `releaseDate`, `lts` | Excellent for "is the major I am about to pin supported": Next 16 current, 15 EOL 2027-01-31 [V]. Only ~400 products tracked. Flutter: use `https://storage.googleapis.com/flutter_infra_release/releases/releases_linux.json` [V: stable 3.50.0, 2026-11-11]. |
| LLM-readiness of docs | `{docs-site}/llms.txt` and `/llms-full.txt` [V] | HTTP 200 and body starts with `# `, not `<html` | Present: next, nuxt, svelte, vue, react.dev, tanstack, hono, fastify, nestjs, supabase, convex, expo, react-native, tauri, three, babylon, mastra, fastmcp, wxt, pydantic-ai, crewai... Absent (real 404): astro (at tested URL), fastapi (404 page of 91 KB - check body, not size), godot, electron, capacitor, phaser, plasmo, oclif. ai-sdk's is 5.6 MB (my 20 s timeout produced `n0`: use `Range`/HEAD-then-bytes limit). Not all 404s are final truth: sites move it (try `/docs/llms.txt`). |
| Context7 coverage | `https://context7.com/api/v1/search?query={name}` [V] | per result: `id`, `benchmarkScore` (0-100), `trustScore`, `totalSnippets`, `lastUpdateDate`, `versions`, `verified` | No key needed for search. **Top hit is often wrong** (vue -> `/vuejs/vue` = v2 repo, 42.1; claude-agent-sdk -> a third-party mirror; MCP TS SDK -> a 0-snippet site). Select the result whose `id` equals `/{owner}/{repo}` of the GitHub repo, else a `/websites/...` result whose title matches; else mark `unmatched`. Context7 MCP itself (`@upstash/context7-mcp`) is how the *builder* agent will read docs at build time - the Recipe should record the Context7 library id in STACK.md. |
| Vendor-shipped agent aids (strongest buildability signal) | `https://api.github.com/repos/{org}/skills`, `{org}/ai-tools`, `.claude-plugin/`, `AGENTS.md` presence via `.../contents` [V]; npm `{pkg}-mcp` | exists / last push / license | Verified [V]: `expo/skills` (4.2k stars, pushed today, MIT, has eval-harness + tests), `flutter/skills` (3.2k, BSD-3), `dart-lang/ai` (298), `sveltejs/ai-tools` (342, MIT; npm `@sveltejs/mcp` 0.1.31 MIT), `vercel/next-devtools-mcp` (838; npm `next-devtools-mcp` 0.4.0 MIT), `@supabase/mcp-server-supabase` 0.18.0 Apache-2.0, `@mastra/mcp` 2.10.0, Angular CLI ships an MCP server inside `@angular/cli` 22.3.0 (not confirmed by me - [U]). Not found: tauri, astro, godot, nuxt (by those names). |
| Annual surveys (slow signal; human/AI reads, not scripted) | State of JS 2025 `https://2025.stateofjs.com/en-US/libraries/meta-frameworks/` [V via WebFetch]; Stack Overflow 2026 (published 2026-10-06) `https://survey.stackoverflow.co/2026/`; State of React Native (Software Mansion; last confirmed result year 2024 survey: Expo ~60% [V via search snippet; 2025 numbers not found]) | usage / satisfaction / retention | Devographics charts are JS-rendered: WebFetch returned only text ("Astro has top satisfaction; Next.js gap 39% ... TanStack Start 235 write-ins; 11,411 respondents in happiness block"; survey ran 2025-09-24 to 11-10, results 2026-02-03 per search). No stable JSON API without a Devographics key -> use as *tiebreak commentary*, record year+URL, never as a computed input. Stack Overflow 2026: 30,903 responses; ASP.NET Core third in desired web tech 13.8% [V search snippet]. |
| Pricing / free tier | Vendor pricing pages (WebFetch) | free-tier limits, price | No API. S2/S5 rule already requires source+date per price. |

**Derived signals the script should compute (all deterministic):**
- `days_since_release`, `days_since_push`, `archived`, `deprecated`.
- `breaking_bumps_24m` = count of new major (or, for 0.x, new minor) versions in deps.dev version list in the last 730 d (churn proxy; heuristic, flag as such - e.g. next showed one x.0.0 in 24 mo, while 0.x projects need the minor rule).
- `issue_close_ratio_90d`, `weekly_dl`, `dl_trend` (28 d vs 28 d six months earlier), `peer_percentile` (download rank inside the same product type from `J-candidates.json`).
- `major_after_model_cutoff` = latest major published after the builder model's knowledge cutoff (declared at S0 model-tier probe) -> the model will hallucinate old APIs; require docs-via-Context7/llms.txt in the build handoff. Examples released recently [V]: React Router 8.5 ("v8"), Angular 22.3, Expo SDK 58, Laravel 13.43, Django 6.1, AI SDK 7.0, pydantic-ai 2.71, FastMCP 4.2, Electron 45, Astro 7.4, Flutter 3.50.
- `docs_llm_ready` = llms.txt (1) + llms-full (1) + Context7 matched with benchmark >= 70 and snippets >= 1000 (1) + vendor skill/MCP exists (1) => 0-4.
- `license_class`: `osi-permissive | osi-copyleft (AGPL/GPL) | source-available (SUL, FSL, BSL) | proprietary | unknown`, from package license + root LICENSE file; any `source-available` or `copyleft` shows a plain-language warning.

**Pitfalls found while running the probe** (put in the script's header and tests): monorepo release tags; `NOASSERTION`; Context7 top-hit mismatch; GH vs registry major mismatch (MCP SDK); `n8n` license is Sustainable Use (not OSI) while GH says NOASSERTION; unauthenticated GitHub rate limit; flutter needs a different source; pypistats may rate-limit; crates.io demands UA.

---

## 3. Selection procedure (measurable)

### 3.0 Where it sits in the pipeline
Today S5 exit says ">=2 stack options + recommended + cost table" with no method, and S2 only has a "paid account" hard rule. Proposal:

- **S1** adds `product_type` (data-driven profile list from brainstorm-03/04: web, mobile, game, RAG, agent, MCP, CLI, extension, desktop, workflow/n8n-style, skill/plugin, ...) and `needs_framework: yes|no|unknown` (skill/plugin and plain scripts may skip).
- **S2** captures the *condition vector* (below) - these are the hard-filter and weighting inputs. Add 3 questions: skill level ("never coded / can follow instructions / can code"), who builds ("AI agent alone / me + agent / team"), devices to test on.
- **S3/S4** produce *capability flags* from answers (auth, payments, realtime, offline, push, SEO, 3D, background jobs, file upload, LLM calls, data volume) - not asked again here.
- **S5b "Framework discovery"** (new substep inside S5, after competitor/research): runs the pipeline in 3.2. Output `S5-framework.md` -> `STACK.md` + decision `D-NN`. **S6** re-checks it (risk -> loop-back to S2/S4 if a hard filter eliminates every option, e.g. user is on a phone only and picked iOS native).
- Re-verify signals at **S9 compile** and at **handoff** if more than 14 days passed (signals are stamped with fetch date; stale = auto re-fetch).

### 3.1 Inputs ("condition vector" - everything is recorded in state, never re-asked)
`product_type, platforms_needed[], user_skill (0 non-coder | 1 follows steps | 2 codes), builder (agent | user+agent | team), team_size, budget_monthly_usd_max, hosting_have[] (none|vps|cloud-free-tier|vercel/netlify|app-stores), devices[], accounts_have[] (Apple Dev, Play Console, domain), language_pref|null, must_self_host (bool), data_residency, capability_flags[], offline_needed, time_to_first_version, preexisting_stack|null (if set, discovery is skipped or restricted to compatible add-ons), model_cutoff (from S0 tier probe)`.

### 3.2 Pipeline

**Step A - Candidate pool (script).** `frameworks.json` (our curated seed, section 4) filtered by `product_type`. User-named frameworks are always added. If the type is unknown/new: AI web-searches (extended mode) for "best {type} framework {year}" in English sources, adds <=8 candidates marked `unverified-origin`, then they pass the same pipeline.

**Step B - Hard filters (script, binary, each elimination logged with reason).** A candidate is dropped if any is true:
1. `license_class` incompatible: copyleft/source-available when user plans a commercial closed product or `must_self_host` conflicts (warn, not silent drop, for source-available; drop for no-license repos).
2. Platform: does not target every platform in `platforms_needed`.
3. Budget: cheapest viable hosting/store path > `budget_monthly_usd_max` (store fees e.g. Apple Developer from S2 are already surfaced; prices are in `frameworks.json` with source+date and re-verified by AI via WebFetch if older than 30 d).
4. Hosting: needs a runtime the user lacks and will not rent (e.g. Node server vs static-only host).
5. Skill floor: `framework.skill_floor > user_skill + (builder==agent ? 1 : 0)` (curated attribute, 0-2).
6. Health gates: `archived`, `deprecated`, last release > 365 d AND last push > 180 d, or open critical advisory on the version we would pin (OSV/deps.dev).
7. Capability: lacks any `must` capability flag (curated matrix).
Result must leave >=2 candidates; else loop-back (relax a *soft* condition with user consent, S6 mechanism).

**Step C - Signals (script).** `lvr stack-signals --candidates ids.json` -> JSON with every field in section 2, `fetched` date and source URL per field, errors as `null` + reason (never guessed numbers).

**Step D - Scoring matrix (script computes S-scores, AI supplies A-scores).** 0-5 per criterion; weighted sum x20 = 0-100.

| Criterion | Default weight | Who scores | How |
|---|---|---|---|
| C1 Fit to features/capabilities (S4 flags + type needs) | 25 | AI, anchored | 5 = every `must` + every `should` native; 3 = every `must`, some `should` via add-ons; 1 = workaround needed. Anchors prevent drift (borrowed *idea* from #5). |
| C2 Skill & team fit (learning curve, who maintains it, time to first version) | 15 | AI + curated attr | `skill_floor`, `concepts_to_learn`, plain-language error/UX of toolchain |
| C3 AI-agent buildability | 15 | **Script** (0-4 `docs_llm_ready` +1 for "major_after_model_cutoff == false" -> scaled 0-5) | + AI deduction if framework needs GUI-only tooling the agent cannot drive |
| C4 Ecosystem health & momentum | 15 | **Script**: recency (<=90 d=5, <=180=4, <=365=3, <=730=1), issue_close_ratio (>=0.8 =+1), dl_trend, peer_percentile, Scorecard bonus | thresholds live in a data file so they are tunable and auditable |
| C5 Cost & hosting fit | 10 | Script for filter pass + AI for fine cost | uses S2 budget; 5 = fits free tier with headroom |
| C6 Longevity & risk (license, backing, breaking cadence, lock-in, EOL date) | 10 | Script (`breaking_bumps_24m`, license_class, endoflife) + AI (backing) | |
| C7 Platform reach & performance for this use | 10 | AI, anchored | |

Persona weight shifts (documented, table in data file; weights always re-normalised to 100): `user_skill=0 & builder=agent` -> C2 +5, C3 +5, C7 -5, C6 -5. `team>=3` -> C6 +5, C2 -5. `budget=0` -> C5 +5, C7 -5. `must_self_host` -> C6 +5, C4 -5. Record the final weights in the decision.

**Step E - Rank and tie-break (script).** Sort by total. If #1-#2 gap < 5 points: apply, stopping at first that discriminates: (1) stricter hard-constraint margin, (2) higher C3, (3) lower C5 cost, (4) higher C4, (5) conservative default for the type (curated field `conservative_default: true`). Never emit a tie.

**Step F - Top 3 with trade-offs (AI).** Per option, in plain Indonesian/user language (Conventions: non-technical): "what you get / what it costs you / what can go wrong / how the AI builder will do with it", plus a one-line "pick this if...". The AI also gives its own recommendation, *and* must name the strongest argument against it.

**Step G - User picks (interview step).** 1 question, 3 options + "ask me more". Controls skip/enough still apply: if skipped, the recommended #1 is used and flagged `defaulted`.

**Step H - Record (script).** Journal event `framework_decision` + `DECISIONS.md` entry:
```
D-NN | stack | chosen: sveltekit@3.4.0 | date 2026-11-19
alternatives: [nuxt (score 81), next (79)] | filtered_out: [{id, rule, evidence}]
weights: {...}  scores: {...}  signals_ref: .lvr/signals-2026-11-19.json (sha256)
conditions_used: {...}  user_override: false  confidence: high|medium|low
recheck_by: 2026-12-19  warnings: [...]
```
`STACK.md` lists each pinned package with version, source URL, date, license, Context7 id, llms.txt URL ("builder reads docs from here, not memory").

### 3.3 What script does vs AI
| Script (`lvr stack-signals` / `stack-score`, deterministic, offline-testable with fixtures) | AI (judgment, language) |
|---|---|
| candidate pool from `frameworks.json`; hard filters 1,2,4,5,6,7 (+3 using stored price table) | extract the condition vector from interview answers in plain words; confirm back to user |
| all HTTP fetching, retries, rate-limit handling, license classification, field provenance | resolve ambiguous names (which package is "the" framework), pick Context7 id when match is unclear |
| C3, C4, C6(partial) scores, weight shifts, normalisation, ranking, tie-break, gap detection | C1, C2, C7 anchored scores with one-line justification each; C6 backing; C5 fine cost |
| writes signals JSON, decision record, STACK.md pin table, staleness check (>14 d) | verify prices on vendor pages (S2 rule), read survey commentary, write the top-3 trade-off text, run the user question |
| lint: every number in STACK.md has source+date; flag `unverified` | add new candidates for unseen types via web search, then hand them to the same script |

Fallback when Node is unavailable: SKILL.md prose procedure that does the same with WebFetch calls (slower, more tokens), every claim flagged `unverified` if not fetched (matches S5 rule).

### 3.4 Guardrails against known failure modes
- Hype: C4 uses *peer-relative* percentile and recency, but C6 penalises `breaking_bumps_24m >= 3` and `major_after_model_cutoff`.
- Popularity bias: a 0-star niche fit (e.g. Godot for a 2D game, PocketBase for a one-person CRUD) can win through C1/C2/C5 weights; log "popularity percentile" but do not gate on it.
- Preexisting stack or user-named framework: never overridden; scored for information only, with warnings.
- Do not let the AI "round up" a missing signal: missing = score 0 for that sub-signal + visible `unknown` badge.
- Anti-patterns list adopted from tech-stack-eval (resume-driven, hype-cycle, premature scale) as AI self-check before Step F.

---

## 4. Seed candidate list per product type (snapshot 2026-11-19)

Columns marked **[V 2026-11-19]** come from `J-signals-snapshot-2026-11-19.json` (GitHub API via `gh`, npm registry + api.npmjs.org, deps.dev, PyPI/pypistats, crates.io, context7.com, direct llms.txt GETs). "age d" = days since that version was published. Download figures are *last week* (npm), *last week* (PyPI), or *recent* (crates). `llms.txt: no` = HTTP 404 at the URL I tried, not proof of absence. `Context7 bench/snips` = top matching library's benchmarkScore / totalSnippets. Fit notes below tables are **[U]** (my prior knowledge; not fetched; must be revalidated, and the curated attributes `skill_floor`, `hosting`, `cost`, `capabilities` still need authoring in `frameworks.json`).


#### Web / full-stack

| id | stars | repo push (d) | license | latest pkg ver (age d) | weekly dl | llms.txt | Context7 bench/snips |
|---|---|---|---|---|---|---|---|
| next | 144k | 0 | MIT | 16.4.6 (9) | 97.7M | yes | 72.85/9524 |
| react-router | 57k | 1 | MIT | 8.5.2 (1) | 78.9M | no | 75.38/3074 |
| tanstack-start | 15k | 0 | MIT | 1.169.5 (11) | 13.7M | yes | 67.27/1309 |
| astro | 64k | 1 | MIT (npm) | 7.4.13 (1) | 12.3M | no | 75.78/7594 |
| nuxt | 61k | 0 | MIT | 4.6.4 (16) | 3.5M | yes | 72.67/4939 |
| sveltekit | 21k | 0 | MIT | 3.4.0 (0) | 5.5M | yes | 74.76/1715 |
| vue | 55k | 0 | MIT | 3.5.45 (14) | 25.9M | yes | 42.14/671 (top hit mismatched) |
| angular | 101k | 0 | MIT | 22.3.0 (1) | 8.3M | ? | 58.74/5649 |
| solidstart | 6k | 0 | MIT | 2.2.3 (3) | 229k | yes | 76.22/419 |

#### Backend / API

| id | stars | repo push (d) | license | latest pkg ver (age d) | weekly dl | llms.txt | Context7 bench/snips |
|---|---|---|---|---|---|---|---|
| hono | 33k | 0 | MIT | 4.13.19 (3) | 112.2M | yes | 64.4/1008 |
| fastify | 37k | 1 | MIT | 5.12.8 (17) | 23.6M | yes | 72.95/1902 |
| nestjs | 77k | 0 | MIT | 12.5.1 (3) | 25.0M | yes | 76.19/11043 |
| fastapi | 105k | 1 | MIT | 0.165.0 (1) | 136.1M | no | 75.79/4160 |
| django | 92k | 2 | BSD-3-Clause | 6.1.3 (16) | 12.2M | ? | 72.78/25349 |
| laravel | 35k | 0 | MIT | v13.43.0 (2) | - | no | 75.18/12062 |
| rails | 59k | 0 | MIT | v8.1.4.1 (15) | - | no | 76.9/18262 |

#### Backend-as-a-service

| id | stars | repo push (d) | license | latest pkg ver (age d) | weekly dl | llms.txt | Context7 bench/snips |
|---|---|---|---|---|---|---|---|
| pocketbase | 62k | 24 | MIT | v0.40.6 (27) | - | no | 57.64/1871 |
| supabase | 115k | 0 | Apache-2.0 | 2.119.1 (1) | 70.0M | yes | 74.41/27493 |
| convex | 13k | 0 | FSL-1.1-Apache (repo) / Apache-2.0 (npm client) | 1.51.0 (1) | 2.9M | yes | 73.81/5961 |

#### Mobile

| id | stars | repo push (d) | license | latest pkg ver (age d) | weekly dl | llms.txt | Context7 bench/snips |
|---|---|---|---|---|---|---|---|
| react-native | 127k | 0 | MIT | 0.88.1 (23) | 21.9M | yes | 72.6/8844 |
| expo | 54k | 0 | MIT | 58.0.26 (2) | 17.2M | yes | 63.64/18857 |
| flutter | 181k | 0 | BSD-3-Clause | 3.50.0 (stable, flutter_infra JSON) (8) | - | yes | 67.32/15839 |
| capacitor | 17k | 0 | MIT | 8.6.2 (7) | 8.2M | no | 52.19/1596 |
| kmp-compose | 19k | 0 | Apache-2.0 | v1.12.2 (35) | - | yes | 41.15/3824 |

#### Desktop

| id | stars | repo push (d) | license | latest pkg ver (age d) | weekly dl | llms.txt | Context7 bench/snips |
|---|---|---|---|---|---|---|---|
| tauri | 113k | 0 | Apache-2.0 | 2.12.5 (3) | 5.1M | yes | 72.31/2944 |
| electron | 124k | 0 | MIT | 45.4.1 (0) | 12.8M | no | 72.55/6226 |

#### Game / 3D / graphics

| id | stars | repo push (d) | license | latest pkg ver (age d) | weekly dl | llms.txt | Context7 bench/snips |
|---|---|---|---|---|---|---|---|
| godot | 120k | 1 | MIT | 4.7.2-stable (93) | - | ? | 64.73/147713 |
| phaser | 41k | 90 | MIT | 4.2.1 (133) | 895k | no | 58.45/2229 |
| three | 119k | 0 | MIT | 0.187.0 (20) | 37.3M | yes | 68.03/33037 |
| babylon | 26k | 0 | Apache-2.0 | 9.37.1 (1) | 380k | yes | 62.44/11410 |
| bevy | 50k | 0 | Apache-2.0 | 0.20.1 (21) | 2.1M | n/a | 42.89/5647 |
| pixijs | 49k | 2 | MIT | 8.23.0 (8) | 1.9M | yes | 69.5/4811 |

#### RAG / agents

| id | stars | repo push (d) | license | latest pkg ver (age d) | weekly dl | llms.txt | Context7 bench/snips |
|---|---|---|---|---|---|---|---|
| langgraph-js | 3k | 0 | MIT | 1.7.5 (2) | 5.1M | yes | 74.53/1398 |
| langchain-py | 150k | 0 | MIT | 1.5.2 (0) | 37.3M | yes | 61.59/47939 |
| llamaindex-py | 53k | 5 | MIT | 0.14.26 (5) | 414k | ? | 73.83/78834 |
| vercel-ai-sdk | 28k | 0 | Apache-2.0 (npm) | 7.0.177 (1) | 47.2M | ? | 74.19/15787 |
| mastra | 30k | 0 | Apache-2.0 (npm) | 1.85.0 (1) | 3.7M | yes | 73.19/32300 |
| pydantic-ai | 21k | 0 | MIT | 2.71.0 (0) | 1.6M | ? | 76.14/22573 |
| openai-agents-py | 31k | 0 | MIT | 0.25.0 (1) | 5.0M | yes | 75.64/1108 |
| claude-agent-sdk-ts | 2k | 0 | proprietary (see LICENSE) | 0.3.328 (0) | 19.7M | n/a | 78.06/1048 (top hit mismatched) |
| crewai | 61k | 0 | MIT | 1.15.43 (0) | 594k | yes | 65.44/3307 |
| google-adk | 22k | 0 | Apache-2.0 | 2.14.1 (6) | 2.7M | yes | 54/1187 |

#### MCP server

| id | stars | repo push (d) | license | latest pkg ver (age d) | weekly dl | llms.txt | Context7 bench/snips |
|---|---|---|---|---|---|---|---|
| mcp-ts-sdk | 14k | 0 | MIT (npm) | 1.32.2 (27) | 91.2M | yes | 55.03/0 (top hit mismatched) |
| mcp-py-sdk | 25k | 2 | MIT | 2.3.0 (47) | 80.1M | n/a | 77.47/5709 |
| fastmcp | 29k | 0 | Apache-2.0 | 4.2.2 (1) | 17.4M | yes | 72.86/8349 |

#### CLI

| id | stars | repo push (d) | license | latest pkg ver (age d) | weekly dl | llms.txt | Context7 bench/snips |
|---|---|---|---|---|---|---|---|
| commander | 28k | 0 | MIT | 15.1.0 (12) | 766.4M | n/a | 73.84/449 |
| oclif | 10k | 15 | MIT | 6.0.15 (24) | 594k | no | 81.05/388 |
| clack | 8k | 8 | MIT (npm) | 1.9.0 (10) | 46.6M | n/a | 81.08/568 |
| typer | 20k | 1 | MIT | 0.29.2 (1) | 74.3M | n/a | 74.16/1751 |
| clap | 17k | 2 | Apache-2.0 | 4.6.8 (2) | 295.0M | n/a | 61.3/895 |
| cobra | 45k | 131 | Apache-2.0 | v1.10.2 (350) | - | n/a | 68.58/441 |

#### Browser extension

| id | stars | repo push (d) | license | latest pkg ver (age d) | weekly dl | llms.txt | Context7 bench/snips |
|---|---|---|---|---|---|---|---|
| wxt | 11k | 0 | MIT | 0.21.5 (24) | 1.3M | yes | 71.2/1733 |
| plasmo | 13k | 1 | MIT | 0.90.5 (551) | 423k | n/a | 73.24/575 |
| crxjs | 4k | 17 | MIT (npm) | 3.0.0 (56) | 661k | n/a | 75.49/239 |

#### Workflow automation (n8n family)

| id | stars | repo push (d) | license | latest pkg ver (age d) | weekly dl | llms.txt | Context7 bench/snips |
|---|---|---|---|---|---|---|---|
| n8n | 211k | 0 | Sustainable Use (NOT OSI) | 2.48.5 (1) | 107k | n/a | 67.51/14075 |
| activepieces | 26k | 0 | MIT + proprietary ee/ dir | 0.93.0 (11) | - | n/a | 71.23/5820 |
| windmill | 19k | 0 | AGPL-3 + proprietary ee | v1.877.0 (0) | - | n/a | 64.5/6210 |
| kestra | 30k | 0 | Apache-2.0 | v2.0.11 (2) | - | n/a | 66.76/23333 |
| node-red | 24k | 2 | Apache-2.0 | 5.0.10 (2) | 94k | n/a | 66.87/2642 |
| temporal | 24k | 0 | MIT | v1.32.2 (17) | - | n/a | 55.82/5631 |
| trigger-dev | 17k | 1 | Apache-2.0 | 4.8.6 (1) | 1.6M | n/a | 73.96/8938 |

#### Reading the tables (verified oddities)
- `react-router` 8.x (78.9M/wk) is the Remix successor line [V]; `tanstack-start` is 1.x with 13.7M/wk on the `@tanstack/react-start` package and the highest write-in count among meta-frameworks in State of JS 2025 (235 mentions) [V via WebFetch].
- `vercel-ai-sdk` shows `llms.txt: ?` only because the 5.6 MB file exceeded my 20 s timeout; `https://ai-sdk.dev/llms.txt` returned 200 (5,609,083 bytes) [V]. Huge llms.txt files are themselves an AI-buildability smell: prefer `llms-full`/Context7 with section selection.
- `pocketbase` is the only seed entry with `repo push` older than 20 days (24 d) and its latest tag is v0.40.6 - still pre-1.0 [V]; flag `pre-1.0` as risk.
- `phaser` v4.2.1 is 133 d old, `plasmo` 551 d old (last release v0.90.5, 550 d) [V] -> Plasmo fails health gate 6 as the extension default; WXT (1.3M/wk, 24 d, llms.txt yes) is the live choice [V].
- `cobra` repo push 131 d, last release 350 d [V]: stable-but-quiet (Go CLI), not abandoned; script must distinguish "stable library" from "dead" using the `breaking_bumps` and OSV signals rather than recency alone. Add an `is_stable_lib` curated flag.
- `n8n` (211k stars) license = Sustainable Use License + `.ee.` files under proprietary terms [V LICENSE.md head]: "n8n alternative" discovery must show license class. `activepieces` = MIT outside `packages/ee` [V]; `windmill` = AGPLv3 + proprietary EE [V]; `kestra` Apache-2.0 [V]; `node-red` Apache-2.0 [V]; `temporal` MIT [V]; `trigger.dev` Apache-2.0 [V]. `convex` backend is FSL-1.1-Apache-2.0 [V], npm client Apache-2.0.
- Anthropic `claude-agent-sdk-typescript`: GitHub license null, npm license `SEE LICENSE IN README.md` [V] -> classify `proprietary/unknown` and surface before recommending for an open-source product.
- Flutter: `flutter` GitHub `releases/latest` is useless (`3.19.0-0.1.pre`, 1043 d); stable 3.50.0 published 2026-11-11 from `flutter_infra_release/releases/releases_linux.json` [V]. Godot 4.7.2-stable is 93 d old [V] (normal for a quarterly-ish cadence; compare to its own history, not to npm libs).

#### Fit notes per type [U - curated opinion, to be encoded as attributes and re-validated]
- **Web (content/marketing/blog)**: Astro (static-first, least JS, best for non-coders), Nuxt/SvelteKit/Next when app-like. **Web apps (logged-in SaaS)**: Next (largest ecosystem + most AI training data; cost = complexity + Vercel gravity), SvelteKit/Nuxt (simpler mental model), TanStack Start / React Router 8 (newer; agent knowledge thinner), Angular (large teams), Laravel/Rails/Django (batteries-included, one language, strong for solo). Plain static site + a small HTML/htmx stack for non-coders is a legitimate candidate: include a `no-framework` entry so the matrix can prefer *nothing*.
- **Backend/API**: Hono (edge/serverless, tiny), Fastify (Node), NestJS (structure for teams), FastAPI (Python/AI-adjacent), Django/Laravel/Rails when admin + auth + ORM matter. **BaaS**: PocketBase (single binary, SQLite, ideal for one-VPS solos; pre-1.0), Supabase (Postgres + auth + storage, free tier then ~$25 mo [U]), Convex (reactive DB; FSL license).
- **Mobile**: Expo/React Native (JS devs, OTA updates, vendor `expo/skills` repo [V] = strong agent support), Flutter (single UI toolkit; `flutter/skills` [V]), Capacitor (wrap a web app; weakest native feel), KMP/Compose Multiplatform (Kotlin teams). Hard S2 interplay: iOS needs Apple Developer account (price must be fetched, S2 rule).
- **Desktop**: Tauri 2 (small binaries, Rust core, also mobile), Electron (largest ecosystem, heavy).
- **Game**: Godot (2D/3D, free MIT, GDScript friendly to AI? - signal: Context7 shows `/websites/rs_godot_godot` 147k snippets [V] but that is the Rust binding docs, mismatched; official docs have no llms.txt [V]; AI buildability for GDScript is therefore **uncertain, test before recommending**), Phaser (web 2D; latest release 133 d), PixiJS (renderer only), Three.js/Babylon (web 3D), Bevy (Rust, 0.x with frequent breaking changes - high churn).
- **RAG/agents**: Python: pydantic-ai, LangGraph/LangChain (largest ecosystem, high API churn history), LlamaIndex (RAG-centric), OpenAI Agents SDK, CrewAI, Google ADK; TypeScript: Vercel AI SDK, Mastra, LangGraph.js, Claude Agent SDK (proprietary license). For simple "chat over my docs" non-coder cases the right answer may be *no framework* (a hosted file-search / managed RAG). Include `managed-service` entries with cost.
- **MCP servers**: official TS SDK (v1 line on npm 1.32.2 while repo is on v2.x [V mismatch - needs human check]), official Python SDK (`mcp` 2.3.0 [V]), FastMCP (Python, 4.2.2, 17M/wk [V]). Use `mcp-builder` skill (anthropics) for design after choice (brainstorm-04).
- **CLI**: Node (commander 766M/wk [V], clack for prompts, oclif for plugin-heavy), Python (typer), Rust (clap), Go (cobra/bubbletea). Pick by *distribution need*: single static binary (Go/Rust) vs "everyone has Node".
- **Browser extension**: WXT (cross-browser, Vite) first; CRXJS (Vite plugin, GitHub license metadata missing - npm says MIT [V]); Plasmo = health gate fail [V]. Manifest V3 constraints are not signal-measurable: AI must read Chrome/Firefox docs at S5.
- **Workflow automation / "n8n alternatives"**: n8n (fair-code), Activepieces (MIT core), Windmill (AGPL, code-first), Kestra (Apache, YAML/orchestration), Node-RED (Apache, IoT/home), Trigger.dev (code-first jobs), Temporal (durable execution, heavy). Hard filters 1 and 4 (license, self-host RAM) dominate.
- **Skill/plugin/personal workflow** (brainstorm-02 workflow mode): no framework; route to `skill-creator`/`agent-spec`. Discovery returns "none needed" and records why.

---

## 5. Open points / recommendations to the owner

1. **Placement**: confirm S5b as a substep of S5 (plus S2 inputs) rather than a new numbered Section; it needs S2 *and* S4 answers, which exist by S5. This avoids renumbering S6-S10 (E-12 sync debt).
2. **Data vs prose**: ship `frameworks.json` (types -> candidates -> curated attributes with `verified_on`) + `lvr stack-signals` + a 3 KB procedure reference. Curated attributes (skill_floor, hosting, cost_floor, capabilities, conservative_default) are the only human-maintained part; every entry carries `verified_on` and the script warns when > 90 d.
3. **Never vendor version numbers** (the-architect does and they rot; its own file says so). Versions come from the script at S5b and are re-checked at handoff.
4. **Unvalidated risks**: (a) my AI-buildability proxy (llms.txt + Context7 + vendor skills + post-cutoff major) is a plausible heuristic, not validated against actual agent build success - needs the A/B harness already planned in round 4 (build the same 3 sample apps with the top and bottom scoring stack, measure pass rate); (b) Context7 scores are the vendor's own benchmark; (c) peer-percentile downloads are inflated by CI/transitive installs; (d) GitHub unauthenticated rate limits mean end users without `gh` get at most ~25 candidates per hour - the script must batch, cache in `.lvr/cache` and degrade to the prose path.
5. **Licensing of reuse**: ideas from `agent-framework-selection` (unlicensed) must be re-derived; structure from the-architect and shawnpang is MIT (credit). Both `the-architect` and `tech-stack-eval` are reference tier, not installs.
6. **Not verified**: Angular CLI MCP server, PocketBase/Tauri/Godot vendor agent resources, Stack Overflow 2026 framework tables (page not fetchable as text), State of RN 2025 numbers, any pricing. Fit notes in section 4 are [U].
