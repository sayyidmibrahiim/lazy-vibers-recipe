# LVR Conventions

Canonical source: `docs/spec/*` in the LVR repository. This file is the packaged snapshot for installed skills: every skill ships it byte-for-byte as `references/conventions.md` (`npm run check:skills` guards the copies; drift against `docs/spec` is a review item).

schema_version: 1 · date: 2026-11-20

Companion files: `lvr-principles.md` — the Constitution, loaded before any LVR work; `lvr-freshness.json` (installed as `references/freshness.json`) — the freshness limits for cited facts (section 10). The Conductor (the model running the pipeline) applies the rules below.

## 1. Folder model

One folder = one idea = one product. Never mix two ideas or two products in one folder.

```
<project-folder>/
├── .lvr/
│   ├── state.json        State: authoritative snapshot (rewritable)
│   ├── journal.ndjson    Journal: append-only event log (never rewritten)
│   ├── docs/
│   │   ├── sections/     Section Records: S0-intake.md, S1-context.md, ...
│   │   └── research/     domain-brief.md: Domain Brief + per-Section scan items (section 10)
│   └── recheck/          Recheck reports: RECHECK-<date>.md (audit artifacts)
├── (after S9: Blueprint Bundle files + builder code live here)
├── HANDOFF-PROMPT.md     Builder entry prompt from /lvr-handoff (side artifact, never part of the bundle)
└── brand/                Personal-brand kit from /lvr-personal-brand (never part of the bundle)
```

`state.json` is the single source of truth for "where are we". `journal.ndjson` is the audit trail: if the State is corrupted or missing, rebuild it by journal replay. Section Records are the raw material S9 compiles.

## 2. State schema (`state.json`, v1)

```json
{
  "schema_version": 1,
  "project": {
    "slug": "warung-cashier",
    "name": "Warung Cashier",
    "idea_raw": "...",
    "user_language": "id",
    "created_at": "2026-11-08T09:00:00Z",
    "status": "interview"
  },
  "pipeline": {
    "current_section": "S4",
    "sections": {
      "S0": { "status": "done", "record": "S0-intake.md",
              "answers": { "S0.q1": { "q": "...", "a": "...", "skipped": false } } },
      "S1": { "status": "in_progress" }
    },
    "loop_backs": [
      { "id": "L-01", "from": "S6", "to": "S3", "reason": "research found cost conflict",
        "opened_at": "...", "resolved_at": null }
    ]
  },
  "decisions": [
    { "id": "D-001", "section": "S2",
      "summary": "Deploy on the VPS the user already owns",
      "rationale": "owner pays nothing extra", "status": "user_confirmed" }
  ],
  "boosters": {
    "core": [ { "name": "simple-english", "repo": "AminBlg/SimpleEnglish",
                "license": "MIT", "tier": "core", "status": "installed" } ],
    "enhancer": []
  },
  "model_profile": { "tier": "T1", "probe": "skipped", "declared_at": "..." },
  "milestones": [
    { "id": "M0", "goal": "...", "features": ["F-01"],
      "verified": false, "verified_at": null }
  ],
  "deployment": null,
  "handoff": null
}
```

Field notes:

- `project.slug`: kebab-case, used as the folder name. `project.name`: display name, locked at S1 (may still change at the S9 branding step). `idea_raw`: verbatim user input in User Language. `user_language`: detected at S0, user-correctable.
- `pipeline.current_section`: the first Section in S0…S9 order that is not `done`; it stays "S9" once S9 is done. S10 (build) is tracked by `project.status` (`building`/`complete`), never by `current_section`. Section statuses win when they disagree (/lvr-continue repairs the pointer).
- `pipeline.sections`: one entry per Section with `status`, `record`, timestamps, and recorded answers. Section status enum: `pending | in_progress | done | blocked`. `blocked` = the user moved on with exit criteria unmet: journal `section_blocked` (payload: `section`, `unmet` list), the unmet criteria also go into the Section Record, `current_section` stays on it, and it resumes like `in_progress`.
- `answers[].q` is stored exactly as asked, in User Language; the English summary lives in the Section Record.
- `pipeline.loop_backs`: open Feasibility Loop entries (S6); `resolved_at` is set when the entry closes.
- `decisions[].status`: `user_confirmed | assumed | designer_filled`. `assumed` = asked, user skipped or deferred. `designer_filled` = never surfaced — the user couldn't have known to ask. Both `assumed` and `designer_filled` decisions are also listed in ASSUMPTIONS.md.
- `boosters`: two arrays, `core` (Booster required for output quality) and `enhancer` (Booster that adds quality). Booster status enum: `installed | missing | failed | degraded`.
- `model_profile.tier`: `T1 | T2 | T3` — behavior rules in section 7.
- `milestones`: top-level only — filled at S8, one entry per milestone; never mirrored under `pipeline`. `/lvr-build` sets `verified` + `verified_at`. `deployment`: written by `/lvr-build` when the live check passes. `handoff`: filled by /lvr-handoff.

Project status enum: `interview` → `researching` (S5–S6) → `review` (S7 start until S9 done) → `bundled` (S9 done) → `building` → `complete`; `error` can occur at any point (recoverable via /lvr-continue, with an `error` event in the Journal). Who sets it: S5 `section_start` → `researching`; S7 `section_start` → `review`; S9 `section_done` → `bundled`; /lvr-build `build_started` → `building`, `build_done` → `complete`.

`error`: any skill journals `error` (payload: `skill`, `step`, plain `message`) when an unrecoverable failure stops its run with work half-done (a file it cannot write, a tool that crashes mid-step) — never for a refusal, a failed probe, a failed milestone, or context pressure (those have their own events). It sets `project.status` = "error" and remembers the previous status; the next skill run's opening event (`resume` — every /lvr-continue run appends one — or `session_start`, `handoff_started`, `recheck_started`, `feature_started`, `brand_started`), or the next `section_start`, `section_done`, `section_blocked` or `answer_recorded`, restores it. /lvr-continue offers the retry from the status it loaded, before its own `resume`.

ID conventions: questions `S<n>.q<n>`, unpadded (`S1.q9`) · features `F-01…` · decisions `D-001…` · milestones `M0, M1, …` · loop-backs `L-01…` · research log entries `RQ-001…` · Domain Brief items `U-01…` (section 10).

## 3. Journal (`journal.ndjson`)

Append-only; never rewritten. Every state mutation emits at least one event; `answer_recorded` fires per answer (that is the Checkpoint granularity). Its payload is `{ "section", "answer_id", "q", "a", "skipped" }` — `q` is the question text exactly as asked, `a` the user's verbatim answer, both in User Language; `a` is null when the answer was skipped. Legacy payloads carrying only `{ "section", "answer_id", "skipped" }` remain replayable — rebuilds fold q/a from the Section Record when the payload has no text. Each line:

```json
{"ts": "2026-11-08T09:00:00Z", "seq": 1, "type": "answer_recorded", "payload": { }}
```

Event types: `session_start`, `folder_gate_passed`, `folder_gate_rejected`, `folder_gate_subfolder_created`, `tier_declared`, `capability_probe_passed`, `capability_probe_failed`, `context_guard_triggered`, `truncation_recovered`, `tier_changed`, `booster_check`, `booster_install_ok`, `booster_install_failed`, `booster_choice`, `section_start`, `section_done`, `section_blocked`, `answer_recorded`, `loop_back_opened`, `loop_back_closed`, `scope_locked`, `doc_generated`, `handoff_started`, `gap_found`, `handoff_done`, `recheck_started`, `recheck_finding`, `recheck_research_refresh`, `recheck_fix_applied`, `recheck_done`, `feature_started`, `feature_captured`, `feature_research`, `impact_analysis`, `feature_scope_decision`, `feature_applied`, `feature_done`, `build_started`, `milestone_started`, `milestone_verified`, `milestone_failed`, `build_blocked`, `deployment_verified`, `build_done`, `brand_started`, `brand_file_generated`, `brand_done`, `error`, `resume`, `research_logged`, `context_research`.

Every event type is replayable; types with no state effect (`folder_gate_rejected`, `impact_analysis`, `brand_*`, …) are informational.

Payload extensions: any event may also carry `project` as an object (`slug`, `name`, `idea_raw`, `user_language`; a string `project` is just the project slug and is ignored), `decisions[]` and `milestones[]`, which the state transition folds into `state.json`; `section_done` carries `record`, `booster_check` may carry `license` and `tier`, `milestone_verified` carries `verified_at`, `deployment_verified` carries `url`. A rebuild prefers payload data over disk derivation. What events did not carry comes from disk: milestones from `MILESTONES.md` when the bundle exists (it also holds post-lock milestones), else the S8 record; decisions from `DECISIONS.md` (else the Section Records) plus the decision lines in `S4-additions.md`.

## 4. Language rules

- English is the source of truth for all artifacts. There are no stored translation files; output is translated to User Language dynamically at runtime.
- All interaction with the user happens in User Language.
- Section Records keep the user's answers verbatim in User Language; the Conductor adds an English summary per answer.
- Feature names: the S4 record keeps the user's verbatim words; each F-NN also carries a coined English display name — that English name is what SPEC/requirements.md, USER_FLOWS.md, and blueprint.json use.
- S9 compiles English documents from the summaries; OVERVIEW.md additionally reflects the verbatim intent.
- Research (Domain Brief, Section scans, S5) runs on English sources plus the primary local sources of the user's market (regulators, local price pages); results are summarized in English. "Things you may not know" items are stored in English and shown in User Language at runtime.

## 5. Section map

Sections run strictly in order, except loop-backs opened by the Feasibility Loop (S6). Questions come in micro-batches (size by tier, section 7), phrased in User Language with a one-line reason why each question matters. Controls are always visible: skip (recorded, does not block) and "that's enough for this Section" (jump to the exit-criteria check). Recorded answers are never re-asked.

| Section | Purpose (one line) | Output record | Bundle contribution |
|---|---|---|---|
| S0 Intake | Capture the raw idea fully; detect User Language; propose slug + name; confirm the market; then build the Domain Brief | `S0-intake.md` + `research/domain-brief.md` | project metadata (`idea_raw`, `user_language`) |
| S1 Context | Problem, target users, platform shape, what "working" means for the user | `S1-context.md` | `SPEC/prd.md` |
| S2 Conditions | What the user already has and can pay: devices, accounts, hosting, budget ceiling | `S2-kondisi.md` | `DECISIONS.md` (platform, budget), `HANDOVER.md` (deploy target) |
| S3 Data & privacy | Login, personal data, payments, third-party services, where data may legally live | `S3-data.md` | `SPEC/data-model.md`, `SPEC/api.md`, `SECURITY.md` |
| S4 Features | Feature expectations in detail, iteratively until the user says "enough" | `S4-fitur.md` | `SPEC/requirements.md`, `USER_FLOWS.md` |
| S5 Deep research | Competitor scan, stack candidates with reasons, cost table, regional availability | `S5-research.md` | `RESEARCH.md` |
| S6 Feasibility Loop | Confront research findings with answers; open conflicts, risks, cost surprises | risks appended to `S5-research.md` | risk list in `RESEARCH.md`; accepted risks become decisions |
| S7 Scope lock | Freeze the MVP: every feature → `in-MVP` or Parking Lot (recorded, never deleted); `project.status` → `review` at Section start | `S7-scope.md` | `SCOPE.md` |
| S8 Milestone plan | Break the MVP into M0…Mn, each independently verifiable | `S8-milestones.md` | `MILESTONES.md`, `VERIFICATION.md` |
| S9 Compile | Compile Section Records + decisions + milestones into the Blueprint Bundle | (bundle files) | all bundle files (section 8) |
| S10 Build | Optional (/lvr-build); not an interview Section — no section entry, no `current_section` pointer; progress is `project.status` + `milestones[].verified`; the bundle must be sufficient for any builder | — | — |

Every Section S1–S8 opens with its per-Section scan and the "Things you may not know" items for it, before the first batch (section 10).

Hard rules: if the chosen platform needs a paid account the user lacks, surface it during S2 with the price (do not defer it to research); any blocking risk in S6 makes a loop-back mandatory; scope lock is mandatory before S8; every Acceptance Criterion from S8 must be machine-checkable or scripted (never "looks good").

**Scope locked** — one definition for every skill: a `scope_locked` event exists in the Journal **and** `pipeline.sections.S7.status` = "done". Either fact alone is not a lock (the event precedes the S7 record checkpoint; an S7 closed without the event never had its explicit confirmation). There is no state field for it; derive it every time (script: `scope_locked_seq` from `journal check` plus the S7 status).

Post-lock additions: `/lvr-add-feature` records captures and their decision lines (`- **D-NNN** summary — rationale · status: …`) in `.lvr/docs/sections/S4-additions.md` (append-only) and edits the bundle directly; done Section Records are never mutated, and S9 does not compile the additions file. A parked feature still gets a requirements row marked parked, a Parking Lot row, and a `USER_FLOWS.md` section marked `(parked — see SCOPE.md)`; no milestone.

## 6. Folder Gate

Mandatory first step of idea init. Check in this order:

1. cwd contains `.lvr/state.json` → refuse init. Print the progress summary and recommend /lvr-continue.
2. cwd is empty (ignore OS junk: `.DS_Store`, `Thumbs.db`, `desktop.ini`) → proceed in place.
3. cwd has project markers (`.git`, `package.json`, `Cargo.toml`, `pubspec.yaml`, `pyproject.toml`, `go.mod`, `.solution`, `*.csproj`, …) and no `.lvr/` → refuse: an existing project lives here. Recommend running init in an empty or new folder; offer the generic audit skill (/lvr-recheck-plan) for that project.
4. cwd has at least one subdirectory with project markers (e.g. a projects root) → create the subfolder `./<slug>/` (slug from the idea, confirm with the user) and proceed there. Journal: `folder_gate_subfolder_created`.
5. cwd is non-empty with no markers (loose files) → ask the user: proceed here or create a subfolder (recommend the subfolder).

## 7. Model tiers

The pipeline must complete on any model the harness offers. Its memory lives on disk, never in the context window; the window is a workbench reloaded from disk, not a warehouse.

| Tier | Class | Input context | Max output | Examples |
|---|---|---|---|---|
| T1 | 1M-class APIs (frontier and flash) | 1M–1.05M | 64k–128k+ | Gemini 4 / 3.6 Flash, GPT-6 family, Claude 5.x, DeepSeek V4 |
| T2 | open-weight mid | 128k–262k | often unpublished | Qwen3.5, Llama 4, Gemma 3 27B |
| T3 | compact/local | 32k–128k | small | Mistral Small, small Gemma/Qwen |

Harness overhead (system prompt, tool definitions, skills) eats ~30k–85k tokens before any user content: T2/T3 budgets must subtract it. "Flash" no longer implies a small window; only Flash-Lite/nano and open small models are small.

Tier declaration and probe: the user declares the tier (or it is read from harness config) and it is stored in `model_profile.tier`. The capability probe is mandatory for T2/T3 and skipped for a declared T1: before S1, the model must produce a small strict-JSON object, follow a 3-step instruction in order, and continue an unfinished sentence correctly. Probe failure → refuse to run (the saved State stays safe) and journal `capability_probe_failed`.

Web research check (every tier, T1 included): the probe tests the model; this tests the harness. One real web search plus one page fetch must work — in idea init before `.lvr/` is created, in /lvr-continue before any Section work. Failure → explain the cause and how to enable web tools (section 10), then stop: there is no memory fallback at any tier. It is journaled as `research_logged` with `purpose: "web_check"`, never as a probe event.

Per-tier behavior rules:

| Behavior | T1 | T2 | T3 |
|---|---|---|---|
| Question micro-batch | up to 3 | up to 2 | 1 |
| Research (S5) | full queries | split into sub-queries; append RESEARCH.md incrementally | one sub-topic per turn; append every step |
| Bundle compile (S9) | one file per turn | one file per turn | one file section per turn (append-chunks) |
| Reload discipline | on Section start | on Section start | every turn: load only principles + `state.json` + the current Section's spec slice + the current record — never the transcript |
| Booster loading | per Section | per Section, one at a time | only the one in use; drop after use |

Context guard (input side): watch for repeated instruction-following failures, forgotten rules stated earlier, and tool-call confusion. Respond in order: checkpoint immediately (`context_guard_triggered`) → drop to a stricter reload discipline → if unresolved, stop cleanly and hand over to /lvr-continue (fresh window, disk intact). Never push through with degraded attention.

Truncation self-recovery (output side): detect `finishReason=length`, a mid-sentence cutoff, or a missing required section of a file. Recover by append-continue: reload the last complete block from the file on disk, continue exactly from there with no repetition, and append; repeat until the file's required structure is complete. Checkpoint `truncation_recovered` after every successful append. Never regenerate from scratch what can be continued; never save a truncated file as complete.

Cross-model resume: on /lvr-continue, a tier change compared to `model_profile.tier` → journal `tier_changed`, re-apply this section's rules for the new tier, and warn the user when downgrading (probe re-runs). An upgrade keeps an earlier `passed` probe; a change that lands on T2/T3 while `model_profile.probe` is not `passed` runs the probe as well. Any model finishes what any model started.

## 8. Blueprint Bundle file list

The bundle lives in the project folder next to `.lvr/` and must be self-sufficient: any harness, with no LVR skills installed, can build the product from it. Files are compiled at S9 (content for RESEARCH.md originates at S5, SCOPE.md at S7). 20 entries; CLAUDE.md and GEMINI.md share the last line.

| File | One-line purpose |
|---|---|
| `AGENTS.md` | Builder entry point: what the product is, how to load context (read DECISIONS → SPEC → MILESTONES), working rules, pointers to all other files |
| `OVERVIEW.md` | Owner document (strictest plain-language rules): what was decided, total cost table, how the product is used, what is parked |
| `DECISIONS.md` | Append-only decision log D-001… with summary, rationale, alternatives considered, date; mirrors `decisions[]` |
| `SPEC/prd.md` | Problem, context, target users, value proposition, goals/non-goals, success metrics |
| `SPEC/requirements.md` | Per feature F-01…: behavior, priority (must/should/could), acceptance criteria |
| `SPEC/data-model.md` | Entities, fields, relations + cardinality, indexes + why, validation rules, sample JSON |
| `SPEC/api.md` | Conventions, endpoint table, request/response examples for critical endpoints, status codes, error format |
| `SPEC/architecture.md` | Stack + reasons (mirrors DECISIONS), components, ASCII data-flow diagram, folder structure, local run instructions, failure points |
| `USER_FLOWS.md` | Per feature: ASCII flow diagram + numbered click-by-click script, happy path and key alternatives |
| `CODE_STYLE.md` | Language/framework conventions, naming, testing expectations, error handling, simplicity rules for the chosen stack |
| `SECURITY.md` | Auth model, PII inventory + protection, secrets handling, dependencies policy, compliance notes (region-appropriate) |
| `RESEARCH.md` | Competitor scan, comparable products, stack comparison with trade-offs, cost table; every claim with source + date |
| `SCOPE.md` | MVP list (F-01…) + Parking Lot, explicit |
| `MILESTONES.md` | M0…Mn: goal, deliverables, Acceptance Criteria, estimate |
| `VERIFICATION.md` | Per milestone: verification procedure (commands, expected outputs, visual checks); global smoke test; "definition of verified" |
| `ASSUMPTIONS.md` | Every decision not `user_confirmed`, each with why + how to replace or confirm it |
| `HANDOVER.md` | Owner document: run, deploy, update, back up; where secrets and API keys live; who to ask what |
| `CAPABILITIES.md` | Recommended Boosters for this stack (from the Capability Registry), license-tagged; NC items marked runtime-dependency-only |
| `blueprint.json` | Machine snapshot for UI and harnesses; derived file — regenerate it, never hand-edit |
| `CLAUDE.md`, `GEMINI.md` | One-line stubs pointing to AGENTS.md |

Format rules for all files: GitHub-flavored Markdown · English · no Mermaid (ASCII diagrams only) · plain-language rules · identical stack, entity, and feature names everywhere.

## 9. Checkpoint rules

A Checkpoint = one Journal write + one State write, together.

When `scripts/lvr.mjs` is available, every Checkpoint goes through it (journal first, then state, under one lock); the prose procedures are the fallback.

Checkpoint moments: every answer · every Section start and done · every research step (`research_logged` / `context_research`) · every Booster install or choice · every generated file · every error · each Handoff step.

- Interruption-safe: a session that dies leaves a consistent `state.json` at the last checkpoint; work loss is at most the current unanswered micro-batch.
- Rebuild: load `state.json`; if it is unreadable, replay the Journal and report what was reconstructed; the corrupt file MAY be preserved once as `.lvr/state.corrupt-<date>.json` (not part of the canonical write set).
- Idempotency: Sections marked `done` are never re-run; re-running the Handoff re-lints instead of regenerating; regeneration is explicit and per file.

## 10. Research and citations

Principles 1 and 14 in operational form. Full contract (exact parsing, finding messages, output shape): `docs/spec/07-research.md` in the LVR repository.

**Web research is required.** Web search and page fetch must both work (harness tools or an MCP server). No web → say the cause, give the enable steps, stop; never continue on memory. Enable steps (English source): Claude Code — allow `WebSearch` and `WebFetch`; on Amazon Bedrock web search is unavailable, so add a search MCP server. Codex CLI — `web_search = "live"` in `~/.codex/config.toml`, or start with `codex --search`. Gemini CLI — keep `google_web_search` and `web_fetch` enabled (not excluded in `settings.json`); on Antigravity CLI, check its web tools are on. OpenCode — allow web search on first use and pick a provider (`/connect` or the provider's environment variable); `"websearch": false` turns it off. Any harness — add a web search + fetch MCP server (for example Firecrawl, Brave Search, Exa) with its API key.

**Cite tag** — one source for one claim, on the same line as the claim:

```
[cite: <category> · <url> · <date> · acc <YYYY-MM-DD>( · primary)( · live)( · amend-check <YYYY-MM-DD>)]
```

- Separator ` · ` (space, middle dot, space). `<category>` is a key of `references/freshness.json`. `<url>` is http(s), no spaces (`%20`, `]` as `%5D`). `<date>` is what the page states: `pub YYYY-MM-DD` or `upd YYYY-MM-DD` (also `YYYY-MM` or `YYYY`), or `n.d.`. `acc` = the day you read it.
- Flags: `primary` = the source owns the fact (vendor's own page, regulator, law text, official statistics office). `live` = the value was read off the live page on the access date. `amend-check YYYY-MM-DD` = on that day you searched for newer amendments of the regulation and found none.
- A claim with two sources: two tags side by side, same category. Example: `Vercel Hobby costs USD 0/month [cite: price · https://vercel.com/pricing · n.d. · acc 2026-11-20 · primary · live]`.

**Freshness** (`references/freshness.json`, one file for every skill): `price`, `quota`, `version` 30 days · `legal` (ToS, policies, licences, vendor availability by country) 60 · `regulation` 60 for its amendment check · `market` 90 · `statistic` 365 · `general` 365. Age is counted from `acc` for a `live` cite, else from the page's `pub`/`upd` date (statistics: always the published date; regulations: the newest `amend-check`). A partial date counts from the first day of its period. Past the limit → research it again before use. The freshest primary source wins; when sources disagree, record the conflict and which source won.

**Key facts** (`price`, `quota`, `version`, `legal`, `regulation`) need one fresh `primary` source or two fresh sources from different sites. Regulations always need `amend-check`.

**Unverified** — only after research really failed: log the failed research (below), then write `[unverified: <category> · RQ-NNN]` with the failed log ids. The bare word "unverified" is not enough. A decision that rests on an unverified fact is never `designer_filled`: ask the user to confirm it, or record it as an S6 blocking risk.

**User facts** — a fact the user stated is sourced by its answer id (`S2.q3`) on the same line.

**Recommendations** cite the research they rest on (a `U-NN` item or a cite tag). "Best practice" or "industry standard" alone is never a reason.

**Domain Brief** — `.lvr/docs/research/domain-brief.md`, built right after S0 closes: 8–15 items on the market's rules and regulations, typical and hidden costs, failure modes, key terms, and what similar users expect. Rows: `| ID | Finding (EN) | Why it matters | Source | Section | Became |`; `U-NN` ids; `Section` = the target Section S1–S8; `Became` = the answer id or decision id the item turned into. Template: `lvr-init-new-idea/references/sections/S0-domain-brief.md`.

**Per-Section scan** — before the first batch of S1–S8 (once per Section): S1–S4 at least one targeted search; S5 the research itself; S6–S8 the freshness re-check (`cite check --all`, research every expired fact again) plus searches as needed. New items go to the brief's `## Per-section scans` table; nothing new → one line `- <S> scan (RQ-NNN): no new unknowns — <reason>`. Then show the open items for the Section as "Things you may not know" (User Language, source site + date each). Each item becomes a question (counts toward the batch size) or a `designer_filled` decision whose rationale cites the `U-NN` and its tag.

**Research log** — every research step (one topic, any number of queries), found or failed, is one journal event:

- `research_logged` — `{ id, section, purpose: web_check|claim|s5|refresh|feature|recheck, topic, queries[], sources[{url, title, published, updated, accessed, primary, live}], outcome: found|failed, reason, conflicts[] }`. `failed` needs `reason`; `found` needs a source; a direct page read is the query `fetch <url>`.
- `context_research` — the same without `purpose`, plus `scope: brief|scan`, `findings` (U-ids), optional `note`.
- `id` = `RQ-NNN`, assigned by the script. Both events are informational on replay and valid before `state.json` exists.
- Script: `LVR research log --in -` (add `--context` for `context_research`). Check: `LVR cite check --all` or `--file <path>` — findings I1–I13; fix every one. Without Node, run the checks by reading, per `lvr-handoff/references/lint-checklist.md` group I.
