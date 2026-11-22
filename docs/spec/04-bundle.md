# Spec 04 — Blueprint Bundle

The bundle is the product. It is generated at S9 (and maintained by v1 skills), lives in the project folder next to `.lvr/`, and must be **self-sufficient**: any harness, with no LVR skills installed, can build the product from it.

## Twenty base Markdown files

| File | Owner | Audience | Content rules |
|---|---|---|---|
| `AGENTS.md` | S9 | builder | Entry point per agents.md spec: what the product is, how to load context (read DECISIONS → SPEC → MILESTONES), working rules, pointers to all other files |
| `OVERVIEW.md` | S9 | owner | Plain-English (SimpleEnglish doc rules, strictest here): what was decided, total cost table, how the product will be used, what is parked. The web UI renders this in User Language |
| `DECISIONS.md` | S9 | builder | Append-only log: D-001… with summary, rationale, alternatives considered (optional — record when a real alternative was rejected; `None recorded` is valid), date. Mirrors `decisions[]` |
| `SPEC/prd.md` | S9 | builder | Problem, context, target users, value proposition, goals/non-goals, success metrics |
| `SPEC/requirements.md` | S9 | builder | F-01… per feature: behavior, priority (must/should/could), acceptance criteria (Gherkin where natural) |
| `SPEC/data-model.md` | S9 | builder | Entities, fields (name/type/constraints), relations + cardinality, indexes + why, validation rules, sample JSON |
| `SPEC/api.md` | S9 | builder | Conventions, endpoint table, request/response examples for critical endpoints, status codes, error format |
| `SPEC/architecture.md` | S9 | builder | Stack + reasons (mirrors DECISIONS), components, **ASCII data-flow diagram**, folder structure, local run instructions, failure points |
| `USER_FLOWS.md` | S9 | builder + owner | Per feature: flow diagram (ASCII) + numbered click-by-click interaction script (the "posting ke IG" style), both happy path and key alternatives |
| `CODE_STYLE.md` | S9 | builder | Language/framework conventions, naming, testing expectations, error handling, simplicity rules (ponytail principles adapted to the chosen stack) |
| `SECURITY.md` | S9 | builder | Auth model, PII inventory + protection, secrets handling, dependencies policy, compliance notes (region-appropriate) |
| `RESEARCH.md` | S5/S9 | builder + owner | Competitor scan, comparable products, stack comparison with trade-offs, cost table — every claim with a cite tag (source, published/updated date, access date) or a logged `[unverified: …]` marker (spec 07) |
| `SCOPE.md` | S7/S9 | builder + owner | MVP list (F-01…) + Parking Lot, explicit |
| `MILESTONES.md` | S8/S9 | builder | M0…Mn: goal, deliverables, acceptance criteria, estimate |
| `VERIFICATION.md` | S8/S9 | builder | Per milestone: verification procedure (commands, expected outputs, visual checks); global smoke test; "definition of verified" |
| `ASSUMPTIONS.md` | S9 | builder + owner | Every decision not `user_confirmed`: `assumed` (asked, skipped) and `designer_filled` (proactively filled — the user couldn't have known to ask), each with why + how to replace/confirm it |
| `HANDOVER.md` | S9 | owner | How to run, deploy, update, back up; where secrets/API keys live; who to ask what |
| `CAPABILITIES.md` | S9 | builder | Recommended boosters for this stack (install lines), license-tagged; NC items marked runtime-dependency-only |
| `CLAUDE.md`, `GEMINI.md` | S9 | harnesses | One-line stubs pointing to AGENTS.md |

S9 also writes the derived `blueprint.json` index for tooling and the viewer. It accompanies the 20 Markdown files.

Format rules (Markdown files): GitHub-flavored Markdown · English source · no Mermaid (ASCII diagrams) · SimpleEnglish document rules · consistency enforced (same stack/entity/feature names everywhere).

For the AGENTS.md format, consult the upstream specification at [agentsmd/agents.md](https://raw.githubusercontent.com/agentsmd/agents.md/main/README.md). The format is documentation.

## Profile additions

After the scope is locked, `profile plan --write` saves the selected types and their extra paths in `.lvr/profile-plan.json`. It keeps that list on retries. S9 uses it for the additional files. The derived v1 index includes `profile_files` when the snapshot has extra paths. Existing indexes with no extra paths retain their original shape. The complete bundle manifest and lint expansion are ticket 28.

[Personal workflow plans](09-workflows.md) define the draft skill, local profile schema, tools, evaluations and install plan for the skill and agent profiles.

## Compilation order (S9)

1. Draft each file from section records + `decisions[]` + `milestones[]`.
2. **Cross-check pass**: every F-… has a USER_FLOWS entry and requirements entry; every decision has a DECISIONS.md row; every non-confirmed decision (`assumed` + `designer_filled`) is in ASSUMPTIONS.md; stack names identical across files; every claim carries a valid, fresh cite tag or a logged unverified marker (spec 07). `lvr.mjs crosscheck` runs this list mechanically (feature coverage including parked features, decisions mirror, ASSUMPTIONS, display and feature names, acceptance criterion vs VERIFICATION, cost sources, file presence, citations — rule X8 = `cite check --all`) and leaves the judgment items (stack and entity names, specificity) to the model.
3. SimpleEnglish document-rules pass.
4. Anti-slop editing pass.
5. Emit `blueprint.json` + harness adapters.
6. Journal `doc_generated` per file (checkpoint granularity).

## Maintenance after S9 (v1 skills)

The base Markdown files and the frozen profile files define the plan for that run. The derived index is regenerated when its inputs change. The v1 skills maintain those outputs as follows:

| Skill | Bundle effect | Side artifacts (never in the bundle) |
|---|---|---|
| `/lvr-handoff` | regenerates `blueprint.json`, refreshes the entry prompt; rewrites a `CLAUDE.md` / `GEMINI.md` that is not exactly the stub, after copying it to `<file>.bak-<date>` (never lost silently) | `HANDOFF-PROMPT.md`, `CLAUDE.md.bak-<date>`, `GEMINI.md.bak-<date>` |
| `/lvr-review-plan` (formerly `/lvr-recheck-plan`) | none in review mode (read-only, R3). `--apply` edits only the files of user-approved fixes, and regenerates `blueprint.json` with `blueprint emit` | `.lvr/review/` (`LEDGER.jsonl`, `learned-checks.md`, `REVIEW-<date>-<N>.md`, `runs/`); legacy `.lvr/recheck/RECHECK-<date>.md` |
| `/lvr-add-feature` | appends the requirement, flow, scope, milestone, verification, decision, assumption, research, and cost rows | `.lvr/docs/sections/S4-additions.md` |
| `/lvr-build` | appends `## Build log — <ts>` sections to the end of `VERIFICATION.md`; never edits a requirement or an acceptance criterion | `state.project.status`, `state.milestones[].verified`, `state.deployment` |
| `/lvr-personal-brand` | none — the bundle is read-only here | `brand/BRAND.md`, `brand/LINKEDIN-PROFILE.md`, `brand/CONTENT-PLAN.md` |

Rules: existing ids are never renumbered; earlier `VERIFICATION.md` entries and `DECISIONS.md` rows are never rewritten; `blueprint.json` stays derived; parked features keep a requirements row marked parked, a scope row with the reason, and a `USER_FLOWS.md` section whose heading is marked `(parked — see SCOPE.md)` (the captured script, no diagram required), and require no milestone or verification procedure. Structure checks allow the trailing `## Build log — <ts>` sections `/lvr-build` appends to `VERIFICATION.md`.

## `blueprint.json` schema (v1, stable — consumers: web UI, external harnesses)
```jsonc
{
  "schema_version": 1,
  "generated_at": "2026-11-08T12:00:00Z",
  "project": { "slug": "...", "name": "...", "user_language": "id",
               "idea_summary_en": "...", "status": "bundled" },
  "stack": { "primary": "next-supabase", "components": ["Next.js", "Supabase"],
             "reasons_ref": "DECISIONS.md#D-003" },
  "features": [ { "id": "F-01", "name": "...", "in_mvp": true, "flows_ref": "USER_FLOWS.md#F-01" } ],
  "decisions_count": { "confirmed": 12, "assumed": 3, "designer_filled": 5 },
  "milestones": [ { "id": "M0", "goal": "...", "verified": false,
                    "acceptance_count": 4, "ref": "MILESTONES.md#M0" } ],
  "costs": { "monthly_usd": 0, "one_time_usd": 0, "table_ref": "RESEARCH.md#cost-table" },
  "capabilities": [ { "name": "...", "kind": "skill|mcp|plugin", "license": "MIT",
                      "nc": false, "install": "npx skills add ..." } ],
  "pointers": { "agents": "AGENTS.md", "overview": "OVERVIEW.md",
                "verification": "VERIFICATION.md", "state": ".lvr/state.json" }
}
```

Rules: `blueprint.json` is a **derived** file — regenerate, never hand-edit (`lvr.mjs blueprint emit`: refuses, writing nothing, when a feature id has two requirements blocks or an F-NN has no requirements block; writes only when a field other than `generated_at` drifts; `stack`, `idea_summary_en` and money totals the bundle does not state in a parseable way are kept from the existing file or supplied by the model); `.lvr/state.json` remains the pipeline's own source of truth. The `ref` / `*_ref` values are logical pointers `<file>#<id>`, not Markdown anchors: the id is the feature (`F-01`), decision (`D-003`) or milestone (`M0`) id that starts the target heading or table row, and `costs` names the `## Cost table` section (`RESEARCH.md#cost-table`).
