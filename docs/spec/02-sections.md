# Spec 02 — Sections S0–S10

Each Section has: **purpose**, **question strategy**, **booster routing**, **output** (section record + state effects), **exit criteria**. Sections run strictly in order, except loop-backs (S6).

See [the section booster map](05-boosters.md) for the installed sources and use modes. Journal actual use as `booster_loaded`.

## Interview mechanics (all question Sections)

- Track each exit fact with [journal-backed interview coverage](15-adaptive-interview.md). Confirm facts already supplied together, ask focused follow-ups for missing evidence, and show progress.
- **Micro-batch adaptive**: 1–3 questions per turn. The Conductor chooses the next batch from the previous answers; batches never exceed 3.
- Every question is phrased in **plain language oriented to the outcome** ("Do you already pay for a server somewhere?" not "Do you have VPS infrastructure?"), spoken in **User Language**, with a one-line reason why it matters.
- Controls always visible: **skip** (recorded, does not block), **cukup/that's enough for this Section** (jump to exit criteria check).
- Every answer → `answer_recorded` (checkpoint). Answers are never re-asked once recorded.
- **Research what the user doesn't know** (principle 14, spec 07 §2): before the first batch of each Section S1–S8 the Conductor runs a per-Section scan (S1–S4: at least one targeted search; S5: the research itself; S6–S8: the freshness re-check `cite check --all` plus searches as needed) and shows the open Domain Brief and scan items for that Section as "Things you may not know", in User Language, each with source and date. Each item becomes a question (counts toward the batch size) or a `designer_filled` decision that cites it. Journal: `context_research` per research step.
- **Evidence** (principle 1, spec 07 §3–4): every fact the Conductor states carries a cite tag (source URL, published/updated date, access date) within its freshness limit from `freshness.json`; `unverified` only after logged research failed. Web research is required: without it the skills stop (spec 07 §1).

## S0 — Intake

- Purpose: capture the raw idea fully, detect User Language.
- Questions: none structured — free-form "tell me everything in your head", multi-paragraph encouraged. Ask clarifying mini-questions only if the idea is under ~2 sentences.
- Booster: load grilling for targeted clarifying questions.
- Output: `S0-intake.md` (verbatim idea + language + working slug + market); `project.idea_raw`, `user_language`.
- Exit: idea recorded, slug + display name proposed and confirmed (name can still change at S9 branding step), market (country) confirmed.
- **Domain Brief** (after S0 closes, before S1's first batch): `.lvr/docs/research/domain-brief.md` — 8–15 cited items on the market's rules and regulations, typical and hidden costs, failure modes, key terms, and what similar users expect; each with an id `U-NN`, a source, and a target Section. Journal `context_research` (scope `brief`). Spec 07 §2.

## S1 — Context awal (what & for whom)

- Purpose: problem, target users, platform shape (web / mobile / desktop / multiple), what "working" means for the user.
- Ask the product type first. Accept multiple types. When the owner is unsure, continue the interview until the recorded context supports a recommendation. Present the reasons and ask for confirmation. A pending recommendation never activates additions.
- Use `profile list` to see available profiles and `profile plan` to join the confirmed types. A preview with `--types <id,id>` inspects options without writing a choice.
- Booster: load grilling. Apply `define-problem-statement` and `mom-test` and consult the JTBD reference.
- Output: `S1-context.md`; feeds `SPEC/prd.md`.
- Exit: problem + audience + platform + success picture recorded.

### Profile additions

A shipped profile under `skills/lvr-profiles/<id>.json` is copied to each skill's `references/profiles/`. Its JSON fields are `schema_version: 1`, `id`, `label`, `flags`, `sections`, and `bundle_files`. Flags can define `stores_data`, `has_ui`, and `has_llm`. Entries in `sections` are keyed by S1 through S8. They may list `questions` with `id`, `question`, `why` and `feeds`, plus `exit_criteria`, `boosters`, and `agents`.

The plan merges confirmed profiles in ID order. It deduplicates files and identical questions, rejects conflicting definitions for one question ID, and lists unknown profile IDs if a matching pack is unavailable. Profile defaults combine with OR and recorded project flags take precedence. The plan adds questions to the base bank within the existing batch limit and adds exit checks to the Section's checklist.

## S2 — Kondisi (resources & constraints)

- Purpose: what the user already has and can pay: devices, accounts (Apple Developer, Play Console, domains), hosting/VPS, monthly budget ceiling, willingness to run commands at all.
- Booster: grilling for ready decisions. Use the internal cost fact-sheets as a lead list + live web verification of every price quoted (cite tag with source + dates, `price` limit 30 days; research that fails is logged and the price carries an `[unverified: …]` marker — it never decides a `designer_filled` decision).
- Output: `S2-kondisi.md`; feeds `DECISIONS.md` (platform/budget) and `HANDOVER.md` (deploy target).
- Exit: budget ceiling + deployment surface + accounts list recorded. **Hard rule**: if the chosen platform needs a paid account the user lacks (e.g. iOS → Apple Developer), surface it NOW with price and ask to proceed/defer — do not defer to research.

## S3 — Data & privasi

- Run the [abuse and access checks](12-plan-quality.md#s3--abuse-and-access) for S3. Record accountless forms and the rate-limit and human-verification decisions.
- Purpose: login? personal data? payments/money? third-party services? where data may legally live.
- Booster: grilling for ready decisions. The Domain Brief's regulation items for the user's market feed the questions and decisions (a legal decision cites its `U-NN` item).
- Output: `S3-data.md`; feeds `SPEC/data-model.md` (auth, PII), `SPEC/api.md`, `SECURITY.md`.
- Exit: data inventory + auth yes/no + payments yes/no recorded.

## S4 — Fitur

- Purpose: feature expectations in detail, iteratively until the user says "enough".
- Booster: load grilling. Apply `mom-test`, `deliver-edge-cases`, `user-stories`, and `deliver-acceptance-criteria`. Apply applicable interface aids.
- Mechanics: per feature — name, who uses it, step-by-step happy path (the "klik tombol ini → selesai" script), edge cases the user cares about. Features get IDs `F-01…`.
- Output: `S4-fitur.md`; feeds `SPEC/requirements.md` + `USER_FLOWS.md`.
- For a confirmed interface, record the visual direction, copy voice and accessibility needs. Compile [UI_SPEC.md](13-ui-spec.md) after scope lock.
- Every captured feature names abandonment, invalid input, concurrency/retry and expiry/hold outcomes, using deliver-edge-cases and the [internal checks](12-plan-quality.md#s4--unhappy-paths).
- Post-lock additions: recorded by `/lvr-add-feature` in `S4-additions.md` (append-only); S4 itself is never re-run.
- Exit: user explicitly says enough; feature list has no "and whatever else" placeholders.

## S5 — Deep research

- Purpose: competitor scan, comparable products, tech stack candidates with **reasons**, cost table, availability in the user's region (payment gateways, app stores).
- Booster: load `discover-competitive-analysis` for the scan. Web search and fetch remain required (spec 07 §1).
- Rules: every claim carries a cite tag (spec 07 §3) and is journaled (`research_logged`); key facts need two independent sources or one primary source; recommendations cite the research they rest on. Research uses English sources plus primary local sources for the user's market (regulators, local price pages); results summarized in English. `cite check` on the record is clean before S5 closes.
- After the competitor scan, run [S5b framework discovery](11-framework-discovery.md) when the product needs a stack choice. Store the confirmed choice and evidence in the S5 decision.
- Carry the S2 volume basis into S5 and model typical/busy-month variable costs, including model tokens, following [the quality checks](12-plan-quality.md).
- Output: `S5-research.md`; becomes `RESEARCH.md`.
- Exit: ≥2 eligible stack options with trade-offs and a recorded choice, or a documented reason to skip discovery. Include the cost table.

## S6 — Feasibility loop

- Purpose: confront research findings with answers; open conflicts, risks, cost surprises.
- Booster: apply `architecture-designer` and applicable `threat-modeling`. Use `cost-estimator` as a reference and re-verify prices.
- Mechanics: each finding → `risk` (blocks) or `note` (informational). An unverified key fact that a decision or the plan rests on is a `risk` unless the user confirms it. Any risk → **loop-back is mandatory, not optional**: open `loop_backs[]` entry, jump to the affected earlier Section (S1–S4), ask targeted questions, close the entry on resolution, return to S6. Repeat until no blocking risks.
- Always record a finance, health, legal and minors screen. Research applicable rules and route unknown requirements through the feasibility loop.
- Output: risk list appended to `S5-research.md`; loop-backs in state.
- Exit: zero blocking risks (or risk consciously accepted by user → becomes a decision with rationale).

## S7 — Scope lock

- Purpose: freeze MVP. Every feature F-01… → `in-MVP` or `parking-lot`. Parking lot is recorded, never deleted.
- Booster: apply `define-prioritization-framework` before the owner confirms the scope.
- Status: `project.status` → `review` at Section start (`section_start` S7).
- Output: `S7-scope.md`; becomes `SCOPE.md`. Journal: `scope_locked` at the explicit confirmation.
- Scope review (spec 08 §14): after the walk and the size check, and before the lock question, a light review (lenses L01, L02, L04, L08, L10, L15) runs on the proposed split when `/lvr-review-plan` is installed. It is on by default and skippable. It journals `review_started`/`review_done` (`scope: scope-only`) and gives a scope verdict ("scope sound: lock it" / "fix before locking" / "do not lock yet"). The user decides. The outcome goes into the S7 record's `## Scope review`.
- Exit: user explicitly confirms the MVP list.
- **Scope locked** (one definition, used by every skill): a `scope_locked` event exists in the journal **and** `pipeline.sections.S7.status` = `done`. Either fact alone is not a lock: the event precedes the record checkpoint, and an S7 closed without the event never had its explicit confirmation.

## S8 — Milestone plan

- Purpose: break the MVP into `M0…Mn`, each independently verifiable.
- Booster: `planning-and-task-breakdown` principles (addyosmani). Fallback: internal decomposition rules.
- Rules: **M0 is a walking skeleton** (thinnest end-to-end slice that runs). Every milestone: goal, deliverables, measurable acceptance criteria, verification procedure (commands/visual checks), rough cost/effort. Milestone sizes: completable by an agent in one focused session.
- Output: `S8-milestones.md`; becomes `MILESTONES.md` + `VERIFICATION.md`.
- Exit: every acceptance criterion is checkable by a machine or a scripted step (not "looks good").

## S9 — Doc generation (compilation)

- Purpose: compile section records + decisions + milestones into the Blueprint Bundle (file specs in `04-bundle.md`).
- Booster: apply `deliver-prd`, applicable API and design aids, ponytail for code style, and SimpleEnglish then anti-slop for prose. Consult `develop-adr`, applicable Spec Kit templates, and the AGENTS.md format.
- Mechanics: see compilation order in `04-bundle.md`. Every generated file → `doc_generated` + checkpoint.
- Exit: all bundle files exist and pass the internal consistency check (same stack names, same entity names, no contradictions with `decisions[]`) and the citation check (crosscheck X8 = `cite check --all`, spec 07 §6).

## S10 — Build (optional)

Not an interview Section. The bundle must be sufficient for any builder: `/lvr-handoff` produces the entry prompt; MILESTONES.md + VERIFICATION.md drive the loop. The optional `/lvr-build` skill executes it; the pipeline never *requires* it. S10 has no section entry and no `current_section` pointer (that stays `S9`); its progress is `project.status` (`building`, `complete`) plus `milestones[].verified`.
