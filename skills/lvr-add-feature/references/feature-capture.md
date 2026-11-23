# Feature Capture and Impact Analysis

Companion to `/lvr-add-feature`. The capture form is mandatory: a feature without a complete script is a placeholder, and placeholders never enter the bundle.

## 1. Capture form (`F-NN`)

Ask in the user's language, one micro-batch at a time (tier limits apply). Record verbatim answers in the additions record.

| Field | Rule |
|---|---|
| Verbatim request | The user's own words, unedited. |
| Display name (EN) | Short noun phrase used in every bundle file. Coin it; confirm when ambiguous. |
| Who uses it | One named kind of person, never "everyone". |
| Happy path | Numbered click-by-click script a stranger could follow: opening state → each tap/input → visible result. No step may say "and then it works". |
| Failure cases | Abandonment, invalid input, concurrency or retry, and expiry or hold. For each, record visible recovery, saved state and a test or a concrete inapplicability reason. |
| Priority | `must` / `should` / `could`, confirmed aloud, never inferred. |
| Scope proposal | Extend current milestone / new milestone / Parking Lot, with one-line reasoning. |

Use the declared F-NN from `ids next --reserve`. Use the actual decision and milestone IDs from `ids next` when preparing the next checkpoint.

Apply [adaptive coverage](sections/adaptive-interview.md) to this feature only. Put the list in its additions block. Link earlier answers and direct evidence to keys like `feature.f-05.flow`. Confirm a detailed request in one batch and ask targeted questions about gaps. Give the known/total count and preserve the current tier limit.

Apply [the plan quality checks](bundle/plan-quality.md). Record public forms and abuse controls, regulated-domain impacts, variable costs, measurable operation targets and changes to integrations. Follow [the data module](bundle/data-module.md) when the feature stores new information. For model use, capture the inputs, output, allowed sources, critical errors and fallback from [the AI guide](bundle/ai-feature.md). Document UI changes using [the interface guide](bundle/ui-spec.md).

## 2. Targeted research

Before suggesting a solution, research the feature-specific changes to the Domain Brief. Append a dated delta to the additions block and log `context_research`. Show the user the relevant new findings in plain language, with source and date. Turn them into targeted questions or sourced design decisions. Do not overwrite closed Section Records.

For each reused citation check freshness before counting it. Research material stale, incomplete or conflicting facts and retain their source dates. A web tool outage pauses the affected research and uses the capability guidance. An unverified marker requires research that actually ran and failed.

Research only what this feature changes:

- new external service/API → pricing, license, regional availability, ToS for the intended use;
- new data class → legal/regional storage constraint;
- new platform capability → current support status.

Every claim: a cite group, or an `[unverified: <category> · RQ-NNN]` marker after logged research failed (conventions §10). Reuse existing `RESEARCH.md` rows when the claim is already evidenced and its tag is within its freshness limit (`references/freshness.json`): copy the tag instead of re-researching.

### Mini S5b

For a new framework, library or service, use [the S5b framework procedure](sections/S5b-framework.md) in a single compatibility slot. Start from the already approved stack, then check version, platform, region, budget, permission and migration boundaries. Run cited `signals` and compare eligible options with `framework rank`. Explain up to three choices and their risks. Ask the user, then record the decision with its evidence reference and `recheck_by`.

Use `framework_selected` with a named library slot after a stack decision exists. For an older bundle, carry the recorded approved stack into a stack-slot event first, with the existing decision ID and only verified version fields. If the recorded stack is unclear, ask for clarification before choosing a library. A new pick does not replace the accepted stack without an owner decision.

## 3. Impact matrix

Walk every row; mark `edit`, `append`, `none`, with the exact section/row. A row marked `edit` must name the existing text being changed.

| Bundle file | Ask |
|---|---|
| `SPEC/requirements.md` | New F-NN row; acceptance criteria. |
| `USER_FLOWS.md` | Flow diagram + click script, when in MVP; for a parked feature the section heading marked `(parked — see SCOPE.md)` plus the captured script. |
| `SCOPE.md` | In-MVP row or Parking Lot row with one-line reason. |
| `MILESTONES.md` | Extend an existing milestone's deliverables, or append one new milestone. |
| `VERIFICATION.md` | Procedure matching every new acceptance criterion. |
| `SPEC/data-model.md` | New entity/field/relation/validation/sample. |
| `SPEC/api.md` | New endpoint or changed contract. |
| `SPEC/architecture.md` | Component, storage, external dependency, data-flow change. |
| `SECURITY.md` | Auth, PII, secret, permission, or compliance change. |
| `DECISIONS.md` | One new decision for the scope + design choice. |
| `ASSUMPTIONS.md` | Every new `assumed` / `designer_filled` decision. |
| `RESEARCH.md` | New evidence rows + cost impact. |
| `OVERVIEW.md` | Owner-visible feature line + updated cost totals if changed. |
| `CAPABILITIES.md` | New booster/tool dependency with license + install line. |
| `HANDOVER.md` | Ops/deploy/backup change only. |
| `CODE_STYLE.md` | Only when the feature introduces a new code convention. |
| `UI_SPEC.md`, `SPEC/ai.md` | Adjust the new behavior and tests, or add from an approved flag change. |
| Workflow files | Update the trigger, data and permissions, evaluations, and install plan where changed. [Workflow guide](bundle/workflow.md) |
| `AGENTS.md` | Include each approved new file in the file map. |
| `blueprint.json` | Always regenerate: new feature, milestone, decision counts, costs. |
| `CLAUDE.md`, `GEMINI.md` | Unchanged. |

Use `LVR booster plan --section S4` for capture, S6 for security, architecture and cost, and S9 when a confirmed flag enables a specific output aid. Use the [project-local booster procedure](booster-lifecycle.md) and log actual use. Pending flags can use the internal sections while the owner decides.

For schema and ERD changes, draft a planning-only storage assessment and list access, migration and restore checks. For security, draft assets and trust boundaries, abuse outcomes, controls and tests. Delegate those bounded reviews through `agent plan` if the installed helper supports it. Choose a verified read-only transport. Otherwise use the described review in the current conversation. Journal `agent_delegated` with the actual transport, and merge evidence-bearing findings as the Conductor. Never send user data beyond the approved scope.

## 4. Application rules

- Append-only by default. Existing decisions, milestones, scope rows, and records are never rewritten.
- A new decision gets the next `D-NNN`, `section: "S4"` (the owning section), a rationale, and `user_confirmed` (scope choice) or `assumed` / `designer_filled` per principle 12.
- A new milestone: append `M<n+1>` with goal, deliverables, measurable acceptance criteria, verification procedure, rough cost/effort, and `verified: false` in state.
- Parking Lot: record the requirement row marked parked + the scope row with the reason + a `USER_FLOWS.md` section whose heading is marked `(parked — see SCOPE.md)`, holding the captured script. No milestone and no verification procedure.
- A6 applies to an in-MVP change. Obtain one explicit approval listing the new flag, path and impact. The `feature_applied` approval payload carries `product.flags`, the exact `bundle_files` and the full matching `user_confirmed` decision already recorded. Repeat its contents without changing its meaning. Then run `LVR profile add-file --file PATH --flag KEY --decision-id D-NNN` before creating the file. Parked features keep the current paths and flags. A data-model edit stays in the existing file and uses the one permitted Mermaid ERD.
- Re-run lint, crosscheck and citations after writing. Record results with the feature. Finish only when the new or changed paths pass their applicable checks. For a missed checkpoint, compare disk and journal to the applied rows, then record the missing edge without repeating an edit.
- Costs change → update `RESEARCH.md`, `OVERVIEW.md`, and `blueprint.json` in the same run, all from the same verified number.
- One file per turn; `feature_applied` journal event per file. Never leave half a cross-file edit without a checkpoint.

## 5. Post-lock record

Write `.lvr/docs/sections/S4-additions.md`, append-only:

```markdown
# S4 — Additions after scope lock

## F-NN — <display name>
- Captured: <date> · Priority: <must|should|could> · Scope: <in-MVP milestone|new milestone|Parking Lot>
- Request (verbatim, <language>): <text>
- Who: <named user>
- Happy path: <numbered script>
- Failure cases: <four outcomes with observable tests or scoped reasons>
- Coverage: <keys and supporting answers>
- Profile approval: <flag, paths, decision, or no new files>
- Research: <claims with source + date, or unverified>
- **<D-NNN>** <summary> — <rationale> · status: <user_confirmed | assumed | designer_filled>
- Files touched: <list>
```

One decision line per decision made for this feature (the scope decision at Step 6, plus any design decision made during capture), appended when the decision is made, in the same shape as a Section Record's decision lines: a state rebuild reads these lines for decisions `DECISIONS.md` does not hold yet. `Files touched` is appended at close.

This file is evidence for future plan reviews (`/lvr-review-plan`); S9 does not compile it, and the skill applies the bundle edits itself.
