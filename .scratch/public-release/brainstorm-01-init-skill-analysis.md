# Brainstorm 01 — init-new-idea analysis (2026-11-19)

## Flow
Pre-flight: Folder Gate → model tier + probe (T2/T3: 3 probes) → 9 core boosters (install / degraded / stop).
| S | What | Who |
|---|---|---|
| S0 | idea verbatim, language, slug+name | user |
| S1 | problem, users, platform, success picture | user |
| S2 | devices, accounts, budget; live-verified prices | user |
| S3 | login, PII, money, data location | user |
| S4 | features F-NN, click-by-click script, priority | user (heaviest) |
| S5 | ≥3 competitors, ≥2 stacks, 1 recommendation, cost table | AI |
| S6 | findings vs answers; blocking → loop-back to S1–S4 | AI+user |
| S7 | scope lock, Parking Lot, >8 warning | user confirms |
| S8 | M0 walking skeleton … Mn, machine-checkable criteria | AI, user reviews |
| S9 | compile 20-file bundle, cross-check, blueprint.json | AI |
Unique: per-answer checkpoint journal; decision status labels; no-fact-from-memory rule.

## Dogfood bundle audit (futsal booking, Sonnet audit)
Strong (4–4.5): PRD, data model, milestones+DoD, verification plan.
Medium (3–3.5): user stories/AC, API contract, decision log, ops/handover, cost.
Weak (1–2.5): NFRs, threat model, observability.
Verdict: M0–M3 mostly buildable; agent would guess on unpaid-booking expiry/hold, abuse protection, timezone, validation, UI design, email provider. No builder has consumed HANDOFF-PROMPT yet → buildability assessed, not proven.

## Quality gaps (candidate tickets)
1. Mandatory unhappy paths per feature in S4 (abandon, bad input, concurrency).
2. NFR + ops block (timezone, browser/a11y, error tracking, uptime, owner alerts).
3. Abuse/threat model in S3 (public forms → rate limit/captcha decision).
4. "AI feature" branch: model, prompt, data/RAG, guardrails, eval set, per-use cost, fallback.
5. Regulated-domain detection (finance, health, legal, minors) → S6 mandatory finding.
6. Usage-based cost (per user / month), not only fixed costs.
7. Data sources & integrations artifact (origin, license/ToS, refresh cadence).
8. Real proof: a builder agent builds M0 from HANDOFF-PROMPT; count guesses.
UX: S0–S9 ≈ 1–2 h for a non-technical user → consider "express" mode.
Out of scope on purpose: business plan / GTM.

## Naming
YOR considered (collision: Yor Forger; ambiguous). Superseded by brainstorm 02: "Lazy Vibers Recipe".
