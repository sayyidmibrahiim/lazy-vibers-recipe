# Spec 03 — Skill Contracts & Constitution

Skills are plain markdown instruction files (Agent Skills format) living in `skills/lvr-<name>/SKILL.md` in this repo, installed into harnesses via standard installers (see `05-boosters.md`). Per-harness thin adapters are generated from the same source. Each skill also ships `scripts/lvr.mjs` (D8): deterministic steps run there, prose stays as the fallback.

"Scope locked" means the same thing in every contract below: a `scope_locked` journal event **and** S7 `done` (`02-sections.md`, S7).

## `/lvr-init-new-idea` (v0)

**Precondition**: none — the Folder Gate decides (`01-state.md`).

**Flow**:
1. Folder Gate → proceed / create subfolder / refuse with pointers; then the web research check (spec 07 §1) before anything is written — fail → explain how to enable web search + fetch, stop.
2. S0 intake: capture idea verbatim, detect + confirm User Language, propose slug + name, confirm the market (country); then the Domain Brief (spec 07 §2).
3. **Booster bootstrap** (core check → install → interactive failure handling; `05-boosters.md`).
4. Sections S1–S8 in order with checkpoints, each opened by its per-Section scan and "Things you may not know" (spec 07 §2); S6 loop-backs as specified; scope lock mandatory before S8.
5. S9 compile the Blueprint Bundle.
6. Suggest `/lvr-handoff`.

**Never**: re-ask a recorded answer · generate the bundle before scope lock · write NC-licensed content into any LVR file · answer a factual question from memory (research and cite it; `unverified` only after logged research failed) · continue without web research.

**Interruption**: safe anywhere; resume is `/lvr-continue`'s job.

## `/lvr-continue` (v0)

**Input**: optional path (default cwd).

**Flow**:
1. Read `.lvr/state.json`. Missing → explain and suggest `/lvr-init-new-idea` (with Folder Gate guidance). Corrupt → rebuild by journal replay, report what was reconstructed.
2. Print a plain-language progress summary: project name, current Section, answered/total, pending loop-backs, booster status, last activity time.
3. Offer the right next action: retry the failed step (if the loaded status is `error`) / resume interview / answer pending loop-back / finish S9 generation (if scope locked, bundle incomplete) / run handoff (if bundled, handoff open) / suggest `build`, `add-feature` or `recheck-plan` (if bundled, handoff done).
4. Before any Section work: the web research check (spec 07 §1; fail → journal it, explain, stop). Then finish a missing or partial Domain Brief (S0 done) and the current Section's scan if not yet journaled.
5. Resume the current Section exactly where it stopped (micro-batch boundary).

**Never**: skip ahead of scope lock · re-ask answered questions.

## `/lvr-handoff` (v0)

**Precondition**: S1–S8 `done` + scope locked.

**Flow**:
1. **Gap lint** (`lvr.mjs lint run`; judgment checks come back as `needs_model`) — checklist: every bundle file exists and non-empty · every milestone has measurable acceptance criteria + verification procedure · every `assumed` decision appears in ASSUMPTIONS.md · every decision has rationale · cost table present · OVERVIEW.md present · `blueprint.json` matches state · no contradictions with `decisions[]` · every claim cited, fresh, and sourced per spec 07 (group I = `cite check --all`).
2. Gaps → report in plain language + offer to jump back to the owning Section. Journal: `gap_found`.
3. Emit `blueprint.json` (schema in `04-bundle.md`; `lvr.mjs blueprint emit`).
4. Write harness adapters: `CLAUDE.md`, `GEMINI.md` (one-line pointers to AGENTS.md), verify AGENTS.md against the agents.md spec (`lvr.mjs handoff stubs`).
5. Compose the **entry prompt** (English; `lvr.mjs handoff prompt` writes the fixed template): read AGENTS.md first · execute milestones in order · verify each milestone before claiming done · record results in VERIFICATION.md · consult DECISIONS.md before asking · open questions go to journal, never silently guessed · follow CODE_STYLE.md.
6. Print the recommended install lines for `CAPABILITIES.md` boosters and the builder kickoff commands for the harness the user is currently in. Journal: `handoff_done`.

## v1 skills

### `/lvr-recheck-plan` (v1, implemented)

**Precondition**: `.lvr/state.json` readable, scope locked, S1–S9 done, bundle present. Otherwise refuse with guidance to `/lvr-continue`.

**Flow**:
1. Open: journal `recheck_started`; inventory state, journal, Section Records, all 20 bundle files.
2. Audit: run `references/audit-checklist.md` groups R1–R6 literally — decision integrity, evidence freshness, cross-file coherence, feasibility/risk, bundle self-sufficiency, state/artifact consistency. Every failure is a finding `RC-NN` with severity, evidence, owner, fix; journal `recheck_finding`.
3. Refresh: re-verify claims past their freshness limit (`references/freshness.json`; `cite check --all` lists them) or unsourced claims live; update every file repeating the claim; journal `recheck_research_refresh`. No web research → stop with the enable guidance (spec 07 §1); never refresh from memory. (Full alignment with spec 07: ticket 33.)
4. Report: write `.lvr/recheck/RECHECK-<date>.md` (never overwrite a prior report); split fixes into mechanical and user-decision.
5. Apply: mechanical one file per turn (`recheck_fix_applied`); user-decision fixes only after an explicit answer, recorded as `D-NNN`; `blueprint.json` regenerated from state + bundle when stale.
6. Re-audit R3, R6, and every touched group; append results; journal `recheck_done`.

**Never**: silent scope change · Parking Lot deletion · milestone verification · fabricated source/date · rewriting journal lines.

### `/lvr-add-feature` (v1, implemented)

**Precondition**: state readable, scope locked, S1–S9 done, bundle present. Request present or asked first.

**Flow**:
1. Open: journal `feature_started`; derive next `F-NN`, `D-NNN`, `M<n>` from files on disk.
2. Capture per `references/feature-capture.md`: verbatim request, English name, named user, complete click path, failure cases, priority confirmed aloud.
3. Targeted research: only new services, data classes, platform facts, legal constraints; cite tags per spec 07 (`unverified` only after logged research failed). No web research → stop with the enable guidance. (Full alignment: ticket 29.)
4. Impact analysis: every affected bundle file with exact edit; no new bundle files.
5. Scope decision: extend milestone, append milestone, or Parking Lot; explicit answer recorded as `D-NNN user_confirmed`.
6. Apply append-only, one file per turn, `feature_applied` per file; state decision + milestone appended; `blueprint.json` regenerated. A parked feature gets a requirements row marked parked, a Parking Lot scope row, and a `USER_FLOWS.md` section marked `(parked — see SCOPE.md)`; no milestone.
7. Close with `/lvr-recheck-plan` then `/lvr-handoff`.

Post-lock captures and their decision lines live in `.lvr/docs/sections/S4-additions.md`; done Section Records are never mutated.

**Never**: renumber ids · rewrite history · add bundle files · expand MVP without an explicit answer.

### `/lvr-build` (v1, implemented)

**Precondition**: state readable, scope locked, S8–S9 done, bundle files (`AGENTS.md`, `MILESTONES.md`, `VERIFICATION.md`, `CODE_STYLE.md`, `SECURITY.md`, `DECISIONS.md`, `HANDOVER.md`) present, milestones non-empty. Handoff not done → warn, continue only on explicit answer.

**Flow**:
1. Preflight (build-loop §1): ids match, every milestone has a verification procedure, no open blocking recheck finding. A failed item journals `build_blocked` only (no state field changes) and stops before `build_started`.
2. Journal `build_started` (`project.status` = `building`); load context in `AGENTS.md` order.
3. Select the first `state.milestones[]` entry not `verified`; never re-run a verified milestone.
4. Implement deliverables, run the recorded procedure exactly, capture command/exit code/output.
5. Pass → append to `VERIFICATION.md`, set `verified` + `verified_at`, journal `milestone_verified`. Fail → one fix attempt, then a fresh-assumption check, then `build_blocked`; two failures maximum.
6. Deployment milestone → live check, then `state.deployment = { status: "live", url, verified_at }`.
7. All verified → `build_done` (`project.status` = `complete`); recommend `/lvr-handoff`, then `/lvr-personal-brand`.

`.lvr/` writes are limited to `project.status` (`building`/`complete`), `milestones[].verified`, `verified_at`, `deployment`, and journal appends. Never skip or weaken a verification.

### `/lvr-personal-brand` (v1, implemented)

**Precondition (machine-checked, every run)**: state readable; `state.milestones[]` non-empty and every entry `verified: true`; `state.deployment.status` = `"live"` with a URL; that URL fetched now returns 2xx and one expected product fact; `AGENTS.md`, `OVERVIEW.md`, `DECISIONS.md`, `VERIFICATION.md` present. Any failure → refuse naming the exact unmet gate. Handoff is not required.

**Gate rationale**: branding before proof produces fiction, so the gate is evidence, not a checkbox.

**Flow**:
1. Gate: the five checks above, live URL included; a stored `deployment` field alone is never accepted.
2. Open: journal `brand_started`; load `OVERVIEW.md` → `DECISIONS.md` → `SCOPE.md` → `VERIFICATION.md` → `RESEARCH.md` → `HANDOVER.md` → `state.json`. `SCOPE.md`, `RESEARCH.md` and `HANDOVER.md` are not gated: a missing one is skipped and named in the kit's open questions.
3. Owner facts: ask only what the bundle cannot answer (display name, role, brand goal, audience priority, tone, links, exclusions). Skipped fact → visible open question, never a guess.
4. Evidence table: every claim `verified` / owner-approved `(claimed)` / `forbidden`.
5. Draft one file per turn under `brand/`: `BRAND.md`, `LINKEDIN-PROFILE.md`, `CONTENT-PLAN.md`; journal `brand_file_generated` per file.
6. Self-check (evidence rule, name consistency, links, nothing posted) then journal `brand_done`.

**Never**: post, schedule, or message on any platform · invent metrics, users, revenue, awards, endorsements · place brand files in the Blueprint Bundle or edit bundle files · replace the English source with a localized variant · run before the gate passes.

## Constitution — `lvr-principles.md`

Loaded by every LVR skill before any work. The list below is a summary; the full English text is `skills/lvr-principles.md`, which every skill ships byte-for-byte as `references/principles.md`.

1. **Evidence-first** — every factual claim, recommendation, price, regulation, version and statistic carries a source URL, a published/updated date and an access date; the freshest primary source wins and conflicts are recorded; key facts need two independent sources or one primary source; freshness limits come from `freshness.json`; `unverified` only after research really failed, with the queries logged; a decision resting on an unverified fact is never `designer_filled` — the user confirms it or it becomes an S6 blocking risk.
2. **Anti-yes-man** — if the user's idea has a gap, show it immediately with a concrete fix option. Disagreement is a duty, not a risk.
3. **Recheck before agreeing AND before disagreeing** — verify, then take a position.
4. **Allowed to say "I don't know"** — followed immediately by "let me research".
5. **User Language** — interact in the user's language; artifacts stay English source of truth.
6. **No slop** — concrete, specific, no filler; final documents pass the humanizer pattern list.
7. **Plain language** — documents follow SimpleEnglish document rules (short sentences, active voice, jargon defined); this never fights GFM structure.
8. **Simplicity + surgical changes** — minimal sufficient solution (ponytail ladder), touch only what the task needs (karpathy surgical rule).
9. **Verification-before-completion** — nothing is "done" without its verification step passing; milestones are the unit of proof.
10. **State discipline** — every meaningful event is checkpointed; a session that dies must lose nothing but the current question.
11. **License discipline** — NC content is a runtime dependency, never vendored.
12. **Fill what the user couldn't ask** — the owner is non-technical: they cannot name what they don't know. Important decisions that were never surfaced are made proactively, recorded with status `designer_filled`, and shown visibly for correction — never silent, never buried. The gap between what users say and what they need is the pipeline's job, not theirs.
13. **Disk is memory** — the pipeline's memory lives in `.lvr/`, never in the context window. Any model able to follow the skill files finishes what any model started: checkpoint on pressure, reload from disk instead of improvising, continue truncated work instead of regenerating (spec 06).
14. **Research what the user doesn't know** — a Domain Brief after S0 and a scan before each Section surface the rules, costs and pitfalls the owner cannot ask about, shown in User Language with source and date; each becomes a question or a cited `designer_filled` decision; recommendations cite the research, never an unsourced "best practice"; no web research → stop, never continue on memory (spec 07).
