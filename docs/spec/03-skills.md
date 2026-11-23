# Spec 03 — Skill Contracts & Constitution

Skills are plain markdown instruction files (Agent Skills format) living in `skills/lvr-<name>/SKILL.md` in this repo, installed into harnesses via standard installers (see `05-boosters.md`). Per-harness thin adapters are generated from the same source. Each skill also ships `scripts/lvr.mjs` (D8): deterministic steps run there, prose stays as the fallback.

"Scope locked" means the same thing in every contract below: a `scope_locked` journal event **and** S7 `done` (`02-sections.md`, S7).

## `/lvr-init-new-idea` (v0)

**Precondition**: none — the Folder Gate decides (`01-state.md`).

**Flow**:
1. Folder Gate → proceed / create subfolder / refuse with pointers; then the web research check (spec 07 §1) before anything is written — fail → explain how to enable web search + fetch, stop.
2. S0 intake: capture idea verbatim, detect + confirm User Language, propose slug + name, confirm the market (country); then the Domain Brief (spec 07 §2).
3. **Booster bootstrap** (core check → install → interactive failure handling; `05-boosters.md`).
4. Sections S1–S8 in order with checkpoints, each opened by its per-Section scan and "Things you may not know" (spec 07 §2); S6 loop-backs as specified; at S7, before the lock question, the light scope review (`08-review.md` §14) when `/lvr-review-plan` is installed (skippable); scope lock mandatory before S8.
5. S9 compile the Blueprint Bundle.
6. Suggest `/lvr-handoff`.

**Never**: re-ask a recorded answer · generate the bundle before scope lock · write NC-licensed content into any LVR file · answer a factual question from memory (research and cite it; `unverified` only after logged research failed) · continue without web research.

**Interruption**: safe anywhere; resume is `/lvr-continue`'s job.

## `/lvr-continue` (v0)

**Input**: optional path (default cwd).

**Flow**:
1. Read `.lvr/state.json`. Missing → explain and suggest `/lvr-init-new-idea` (with Folder Gate guidance). Corrupt → rebuild by journal replay, report what was reconstructed.
2. Print a plain-language progress summary: project name, current Section, answered/total, pending loop-backs, booster status, last activity time.
3. Offer the right next action: retry the failed step (if this run's session recovered from an `error`: `sessions[-1].recovered_error` is not null) / resume interview / answer pending loop-back / finish S9 generation (if scope locked, bundle incomplete) / run handoff (if bundled, handoff open) / suggest `build`, `add-feature` or `review-plan` (if bundled, handoff done).
4. Before any Section work: the web research check (spec 07 §1; fail → journal it, explain, stop). Then finish a missing or partial Domain Brief (S0 done) and the current Section's scan if not yet journaled.
5. Resume the current Section exactly where it stopped (micro-batch boundary).

**Never**: skip ahead of scope lock · re-ask answered questions.

## `/lvr-handoff` (v0)

**Precondition**: S1–S8 `done` + scope locked.

**Flow**:
1. Run `lint run`, `crosscheck` and `cite check --all` over the base and declared profile files. Refresh expired facts through the owning procedure. Complete `needs_model` checks with quoted evidence.
2. Gaps → report in plain language + offer to jump back to the owning Section. Journal: `gap_found`.
3. With zero citation findings, use `handoff gate` to require a full review at `FIX-THEN-BUILD` or `BUILD-READY`, or the owner's recorded approval to proceed despite the current review. Emit `blueprint.json` using `blueprint emit`.
4. Verify `AGENTS.md` and write the applicable harness pointers using `handoff stubs`.
5. Use `handoff prompt` to write the builder instructions. For a v2 index include the profile paths and per-type release checks.
6. Use `handoff install-lines --builder` for pinned aids and provide a builder kickoff command. Journal `handoff_done` with the selected cleanup owner.

## v1 skills

### `/lvr-review-plan` (v1, implemented; formerly `/lvr-recheck-plan`)

Full contract: `08-review.md`. Skill: `skills/lvr-review-plan/` (lenses, scale, protocol). Owner decisions R1–R4 apply. No manifest format supports a command alias, so `/lvr-recheck-plan` is gone. The rename is documented in README.md, INSTALL.md and skills/README.md, and old journals keep their `recheck_*` events (informational on replay).

**Precondition**: `.lvr/state.json` readable, scope locked, S1–S9 done, bundle present (`AGENTS.md`, `blueprint.json`). Otherwise refuse with guidance to `/lvr-continue`. `--scope-only`: S1–S6 done and S9 not done. `--apply`: the last run is a finished full run with counted findings.

**Flow**:
1. Open: journal `review_started` (`run`, `scope`, optional `mode`). An open run resumes under its number.
2. Blind sweep, P0–P5: snapshot and claim register → lens × file sweep over the 15 lenses (every R cell ends as findings, clean + verbatim quote, n/a + reason, or blocked) → pre-mortem at 3 horizons → consequence chains → fix closure with the apply-all simulation → saturation passes until one adds 0 findings (at least 2). Research is live (`purpose: recheck`); no web research → stop with the enable guidance (spec 07 §1).
3. Reconcile (run 2 and later): join with `.lvr/review/LEDGER.jsonl` by stable id: carried, fixed (its `verify` passes), partial or regressed; new ids are classed `new-due-to-change`, `world-changed`, `missed-earlier` or `checklist-gap`. The last two need an apology, a root cause and a learned check.
4. Score (severity lookup, lens score 0–10, overall = floor((mean + min)/2), verdict per R1), stability check (score drift blocks the report: `SCORE_DRIFT`), then render `.lvr/review/REVIEW-<date>-<N>.md`.
5. Close: journal `review_done` (`run`, `verdict`, `score`, `open`, `missed_earlier`, `report`, `lens_scores`, `ledger_sha256`).

Events: `review_started` and `review_done` only (the ledger carries the finding detail). The five `recheck_*` types stay valid for old journals and are never written again.

**Never**: edit the plan outside `--apply` (R3) · apply a fix without an explicit approval · silent scope change · Parking Lot deletion · milestone verification · fabricated source, date or quote · rewriting journal or ledger lines · softening a finding or padding a clean result.

### `/lvr-add-feature` (v1, implemented)

**Precondition**: state readable, scope locked, S1–S9 done, bundle present. Request present or asked first.

**Flow**:
1. Open: journal `feature_started`; derive next `F-NN`, `D-NNN`, `M<n>` from files on disk.
2. Capture per `references/feature-capture.md`: verbatim request, English name, named user, complete click path, failure cases, priority confirmed aloud.
3. Targeted research: only new services, data classes, platform facts, legal constraints; cite tags per spec 07 (`unverified` only after logged research failed). No web research → stop with the enable guidance. (Full alignment: ticket 29.)
4. Impact analysis: every affected bundle file with exact edit; no new bundle files.
5. Scope decision: extend milestone, append milestone, or Parking Lot; explicit answer recorded as `D-NNN user_confirmed`.
6. Apply append-only, one file per turn, `feature_applied` per file; state decision + milestone appended; `blueprint.json` regenerated. A parked feature gets a requirements row marked parked, a Parking Lot scope row, and a `USER_FLOWS.md` section marked `(parked — see SCOPE.md)`; no milestone.
7. Close with `/lvr-review-plan` then `/lvr-handoff`.

Post-lock captures and their decision lines live in `.lvr/docs/sections/S4-additions.md`; done Section Records are never mutated.

**Never**: renumber ids · rewrite history · add bundle files · expand MVP without an explicit answer.

### `/lvr-build` (v1, implemented)

**Precondition**: state readable, scope locked, S8–S9 done, bundle files (`AGENTS.md`, `MILESTONES.md`, `VERIFICATION.md`, `CODE_STYLE.md`, `SECURITY.md`, `DECISIONS.md`, `HANDOVER.md`) present, milestones non-empty. Handoff not done → warn, continue only on explicit answer.

**Flow**:
1. Preflight (build-loop §1): ids match, every milestone has a verification procedure, no open blocking review finding (`state.review.last.open.blocking` = 0; a project reviewed before the rename: its latest `.lvr/recheck/RECHECK-*.md`). A failed item journals `build_blocked` only (no state field changes) and stops before `build_started`.
2. Journal `build_started` (`project.status` = `building`). Load context in `AGENTS.md` order and read the files declared in the bundle index.
3. Select the first unverified milestone, check freshness with `verify freshness`, and load applicable project-local build aids. Recheck expired price, quota, version and stack evidence from official sources before proceeding.
4. Execute the recorded verification. Use `verify run` to capture exact command output, exit status and times. Exercise associated interface checks, AI evals, data migrations and access checks, and workflow install tests.
5. Append the observation to `VERIFICATION.md`, then use `state milestone set` to checkpoint the result. A pass writes `milestone_verified`. For failure use the two-attempt ladder and `build_blocked` when unresolved.
6. At release, check each applicable type from `release plan` and capture the result with `release record`. A passing web check also records `deployment_verified`.
7. When all milestones and each release check pass, journal `build_done` (`project.status` = `complete`). Follow the project-local booster cleanup and recommend `/lvr-handoff`, then `/lvr-personal-brand`. Builder-time specialist agents are deferred until after 1.0 (B11).

`.lvr/` writes are limited to `project.status` (`building`/`complete`), `milestones[].verified`, `verified_at`, `deployment`, `release_check`, its session (`session_start`/`session_end`), and journal appends. Never skip or weaken a verification.

### `/lvr-personal-brand` (v1, implemented)

**Precondition**: state readable, all milestones verified, and release proof for each confirmed product type passes again in a clean environment. Web checks the recorded deployment for 2xx and one expected product fact. Installable products repeat the profile check on the recorded artifact. Require `AGENTS.md`, `OVERVIEW.md`, `DECISIONS.md` and `VERIFICATION.md`. Name the missing evidence if the gate fails. Handoff is optional.

**Gate rationale**: branding before proof produces fiction, so the gate is evidence, not a checkbox.

**Flow**:
1. Gate using `release plan` and current observed product evidence.
2. Open: journal `brand_started`; load `OVERVIEW.md` → `DECISIONS.md` → `SCOPE.md` → `VERIFICATION.md` → `RESEARCH.md` → `HANDOVER.md` → `state.json`. `SCOPE.md`, `RESEARCH.md` and `HANDOVER.md` are not gated: a missing one is skipped and named in the kit's open questions.
3. Owner facts: ask only what the bundle cannot answer (display name, role, brand goal, audience priority, tone, links, exclusions). Skipped fact → visible open question, never a guess.
4. Use verified product results and current cited facts. Mark owner-approved statements without proof as `(claimed)`. Use live first-party guidance for platform limits and redact private workflow inputs.
5. Draft one file per turn under `brand/`: `BRAND.md`, `LINKEDIN-PROFILE.md`, `CONTENT-PLAN.md`; journal `brand_file_generated` per file.
6. Run the anti-slop prose pass, verify citations and links, then journal `brand_done`. Use the project-local lifecycle for cleanup.

**Never**: post, schedule, or message on any platform · invent metrics, users, revenue, awards, endorsements · place brand files in the Blueprint Bundle or edit bundle files · replace the English source with a localized variant · run before the gate passes.

## Constitution — `lvr-principles.md`

Loaded by every LVR skill before any work. The list below is a summary; the full English text is `skills/lvr-principles.md`, which every skill ships byte-for-byte as `references/principles.md`.

1. **Evidence-first** — every factual claim, recommendation, price, regulation, version and statistic carries a source URL, a published/updated date and an access date; the freshest primary source wins and conflicts are recorded; key facts need two independent sources or one primary source; freshness limits come from `freshness.json`; `unverified` only after research really failed, with the queries logged; a decision resting on an unverified fact is never `designer_filled` — the user confirms it or it becomes an S6 blocking risk.
2. **Anti-yes-man** — if the user's idea has a gap, show it immediately with a concrete fix option. Disagreement is a duty, not a risk.
3. **Recheck before agreeing AND before disagreeing** — verify, then take a position.
4. **Allowed to say "I don't know"** — followed immediately by "let me research".
5. **User Language** — interact in the user's language; artifacts stay English source of truth.
6. **No slop** — concrete, specific, no filler; final documents pass the anti-slop editing pass.
7. **Plain language** — documents follow SimpleEnglish document rules (short sentences, active voice, jargon defined); this never fights GFM structure.
8. **Simplicity + surgical changes** — minimal sufficient solution (ponytail ladder), touch only what the task needs (karpathy surgical rule).
9. **Verification-before-completion** — nothing is "done" without its verification step passing; milestones are the unit of proof.
10. **State discipline** — every meaningful event is checkpointed; a session that dies must lose nothing but the current question.
11. **License discipline** — NC content is a runtime dependency, never vendored.
12. **Fill what the user couldn't ask** — the owner is non-technical: they cannot name what they don't know. Important decisions that were never surfaced are made proactively, recorded with status `designer_filled`, and shown visibly for correction — never silent, never buried. The gap between what users say and what they need is the pipeline's job, not theirs.
13. **Disk is memory** — the pipeline's memory lives in `.lvr/`, never in the context window. Any model able to follow the skill files finishes what any model started: checkpoint on pressure, reload from disk instead of improvising, continue truncated work instead of regenerating (spec 06).
14. **Research what the user doesn't know** — a Domain Brief after S0 and a scan before each Section surface the rules, costs and pitfalls the owner cannot ask about, shown in User Language with source and date; each becomes a question or a cited `designer_filled` decision; recommendations cite the research, never an unsourced "best practice"; no web research → stop, never continue on memory (spec 07).
