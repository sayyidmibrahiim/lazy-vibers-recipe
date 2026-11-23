# Glossary

The LVR pipeline turns a raw idea into a Blueprint Bundle that a coding agent can use to build the product.

## Language

**LVR**

Lazy Vibers Recipe. All skills use the `lvr-` prefix.

_Avoid_: lazy-vibers, LVR tools, planner

**Section**

A numbered part of the pipeline with one decision goal. The Sections are S0 intake, S1 initial context, S2 constraints, S3 data and privacy, S4 features, S5 deep research, S6 feasibility, S7 scope lock, S8 milestone planning, S9 document generation, and S10 build.

_Avoid_: step, phase

**Section Record**

The file at `.lvr/docs/sections/SN-*.md` that summarizes a Section in English. S9 compiles the finished Bundle from these records.

_Avoid_: notes, draft, log

**Conductor**

The coordination role in `/lvr-init-new-idea`. It loads external skills at the start of the Section that needs them and releases them at its end. This keeps the active context small.

_Avoid_: router, orchestrator, loader

**Checkpoint**

A State write after a durable event such as a recorded answer, completed Section, or completed research. A later session can resume from the Checkpoint and keep earlier decisions.

_Avoid_: save, autosave

**State**

The current pipeline snapshot in `.lvr/state.json`. It is the source of truth for progress in the CLI and UI.

_Avoid_: database, session

**Journal**

The append-only event history in `.lvr/journal.ndjson`. Replay rebuilds State from it, including verbatim answers.

_Avoid_: history, log on its own

**Blueprint Bundle**

The finished plan directory a coding agent can use to build the product. It holds instructions, specifications, decisions, milestones, verification procedures, assumptions, owner documents, recommendations, and `blueprint.json`.

_Avoid_: blueprint on its own, docs, output

**Builder Kit**

The part of the Bundle for the builder, including `AGENTS.md`, `DECISIONS.md`, milestones, verification, assumptions, and the LVR principles.

_Avoid_: builder docs, scaffold

**Feasibility Loop**

The S6 process that reopens a focused owner discussion when deep research uncovers a conflict or risk before scope lock.

_Avoid_: backtracking, retry

**Parking Lot**

The features deferred until after the MVP. The S7 Section Record and Bundle mark them explicitly in `SCOPE.md`, the requirements rows, and `USER_FLOWS.md`.

_Avoid_: backlog, wishlist, later

**Milestone**

A numbered unit of build work such as M0 or M1. Each has acceptance criteria and a verification procedure an agent can run.

_Avoid_: task for a large unit, phase

**Acceptance Criteria**

Measurable conditions that determine whether a Milestone is complete, together with the verification procedure.

_Avoid_: definition of done, checklist on its own

**Constitution**

The principles in `lvr-principles.md` that all LVR skills load. They cover evidence, independent judgment, checking a claim before agreeing, plain English, uncertainty, and discovering questions the owner has yet to ask.

_Avoid_: rules, policy, system prompt

**Capability Registry**

A researched catalog of external skills, plugins, and MCP servers, with evidence about quality, license, and activity. It informs recommendations by stack and Section. [Research catalog](docs/research/agent-skill-catalog.md)

_Avoid_: skill list, marketplace

**Plan Review**

The critical review in `/lvr-review-plan`, previously `/lvr-recheck-plan`. Fifteen Lenses examine the Bundle with evidence, assign standard severities, and produce a score from 0 to 10 and a verdict such as `BUILD-READY`, `FIX-THEN-BUILD`, `NOT-READY`, or `INCOMPLETE`. The review writes approved repairs in `--apply` mode and offers a `--scope-only` mode before the S7 scope lock.

_Avoid_: recheck, QA pass, sanity check

**Lens**

One perspective in Plan Review, from L01 truth and freshness to L15 long-term effects. Each Lens specifies checks, documents, and evidence in the review skill's `lenses.md`.

_Avoid_: category, checklist group

**Coverage Matrix**

The Lens-by-document table in Plan Review. Each cell records a finding, a clean result backed by a source quote, a reason a check does not apply, or a blocker. An empty cell marks unfinished work.

_Avoid_: checklist, progress table

**Review Ledger**

The append-only findings in `.lvr/review/LEDGER.jsonl`. The stable `RV-<lens>-<hash>` ID lets reviewers track resolved and newly introduced findings. If a finding was missed, the next review acknowledges it, explains why, and adds a check.

_Avoid_: findings list, audit log

**Impact Analysis**

The map produced by `/lvr-add-feature` before a feature enters the Bundle. Each row names the affected file, the action (`edit`, `append`, or `none`), and the exact section or line.

_Avoid_: diff, changelist

**Build Loop**

The Milestone cycle in `/lvr-build`. It selects the first unverified Milestone, implements it, runs the recorded procedure, captures the result, updates `VERIFICATION.md` and State, and continues. It stops with a report after two failures.

_Avoid_: run, execution, CI

**Brand Kit**

The separate output of `/lvr-personal-brand` in `brand/`, containing `BRAND.md`, `LINKEDIN-PROFILE.md`, and `CONTENT-PLAN.md`. It requires verified Milestones and release evidence. Every claim points to evidence, and the skill produces drafts for the owner to publish.

_Avoid_: marketing kit, personal branding files as part of the Bundle

**Booster**

An external skill that LVR uses as a dependency. Core Boosters are required for full output quality. Enhancers improve it. LVR checks for required Boosters when needed. A blocked installation is visible and offers three choices: get help, accept a clearly marked limited result, or stop. Runtime use of non-commercial content follows the license policy.

_Avoid_: plugin, add-on, optional skill

**Designer-filled**

A decision the Conductor proposes proactively because the owner would be unlikely to know to ask about it. State and `ASSUMPTIONS.md` make it visible and editable by the owner.

_Avoid_: silent default, auto-assume, best practice as a reason

**Domain Brief**

The Conductor's `.lvr/docs/research/domain-brief.md` after S0. It explains 8 to 15 relevant regulations, costs, common failures, terms, or user expectations. Each `U-NN` item has a dated source and a target Section. Section scans add items to the same file, and each item leads to a question or a cited `designer_filled` decision.

_Avoid_: research notes, background, context dump

**Freshness limit**

The maximum age of a cited fact before rechecking it. The shared `freshness.json` defines limits by category. The original categories used 30 days for price, quota, and version, 60 for terms and legal facts, 90 for market facts, and 365 for statistics. The regulations check also confirms whether a newer amendment exists.

_Avoid_: TTL, cache age, stale threshold on their own

**Handoff**

The `/lvr-handoff` process that checks the Blueprint Bundle for gaps, verifies compatibility across harnesses, and prepares the builder's entry prompt.

_Avoid_: deliver, export

**Folder Gate**

The required folder check at the start of `/lvr-init-new-idea`. It uses an empty folder, offers a new subfolder for unrelated work, or recommends the appropriate skill for an existing project.

_Avoid_: safety check, preflight

**User Language**

The language for agent conversation. The agent follows the user's stated preference or latest clear message, falls back to the saved session language, and defaults to English. The interface and generated documents use English.

_Avoid_: locale, language setting

**Overview**

The English owner document `OVERVIEW.md` in the Bundle. It explains the decisions, costs, and how the owner will use the product. The viewer displays its saved text.

_Avoid_: `RINGKASAN.md` (legacy name), user readme
