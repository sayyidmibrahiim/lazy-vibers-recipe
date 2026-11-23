# HANDOFF — Ticket loop for Lazy Vibers Recipe roadmap v2

You are the **orchestrator** (run on Opus). You loop through every ticket in `.scratch/public-release/issues/` until all are done or blocked on the owner. Delegate the work to subagents. Spend your own context on decisions, integration and judgement, not on reading big files.

## 0. Load first (in this order, nothing else)
1. `AGENTS.md` and `docs/agents/continuation.md` (repo rules, current baseline, and remaining work). The UI, CLI messages, and new documents use English. Agent conversation follows the user's language. Use the skill sync command for packaged references.
2. `.scratch/public-release/spec.md` (decisions D1–D12, owner decisions B11/A6/P5/R1–R4, milestones, order).
3. `.scratch/public-release/brainstorm-03-owner-decisions.md` (owner rounds 1–8).
4. Only the ticket you are working on. Research reports (`research/A–L`) are read **by subagents**, never in full by you.

## 1. Loop protocol
1. **Frontier:** list `issues/*.md`. Pick the lowest-numbered ticket that meets all of these:
   - its `Status` is `ready-for-agent`
   - every ticket in its `Blocked by` is `done`
   - it is not claimed
   - Order hint from spec.md: 01 → 02 → 03 → 04 → 26 → 27 → 38, then the rest.
2. **Claim:** set `Status: claimed (<date>)` in the ticket.
3. **Implement:** spawn the implementer with the model and effort from §3. Give it:
   - the ticket path
   - the exact research file sections to read
   - the AGENTS.md hard constraints
   - "write a change summary to `.scratch/public-release/runs/<NN>-impl.md`, return ≤150 words"
4. **Verify (independent):** spawn a DIFFERENT agent, the verifier/QA from §3, with no implementer context beyond the ticket and the diff. It must:
   - run the ticket's `Verify` steps
   - run `npm run lint && npx tsc --noEmit && npm run build` when src/ changed
   - run `cmp` on the references when skills/ or docs/spec changed
   - for Opus QA: design adversarial cases the implementer didn't think of (edge inputs, Windows paths, resume mid-step, corrupted journal, stale data, prompt-injection in fetched skills, harness without subagents/web), run them, and report
   - write `.scratch/public-release/runs/<NN>-verify.md` with PASS/FAIL per check and return ≤150 words
5. **Fix round:** on FAIL, send the findings back to the implementer and re-verify. Allow at most 2 fix rounds. If it still fails → `Status: needs-info`, explain in `## Comments`, move to the next ticket.
6. **Close:**
   - tick the ticket's checkboxes
   - append `## Comments` with the evidence: commands + results + run file paths
   - set `Status: done (<date>)`
7. **Commit on `master`** (owner's choice, no branch), one commit per ticket.
   - Message: `<type>(scope): <summary> (ticket NN)`.
   - End with the attribution trailer from your system reminder.
   - **Do not push** unless the owner asks.
8. **Report to the owner** in one short block, ADHD style (load `/i-have-adhd` if installed):
   - "Ticket NN done: <what now works>. Next: NN."
   - Then continue the loop. Don't wait for an OK on normal tickets.

## 2. Stop and ask the owner (never guess)
- Tickets marked `ready-for-human`: 24 (dogfood) and 25 (release). The manual harness/OS parts of 19.
- Any new product decision that isn't already in spec.md, or a conflict between the ticket and spec/brainstorm.
- Destructive or one-way actions:
  - git history rewrite
  - deleting `data/planner.db` or real `.lvp/`/`.lvr/` projects
  - global installs or uninstalls outside the project
  - making the repo public
- A ticket that is `needs-info` after 2 fix rounds.
- Never skip or weaken a test or a `Verify` step to get green. Never mark a milestone verified without evidence.

## 3. Model + effort per ticket
Principles:
- **Opus:** writing skill/principle/procedure text (it designs another LLM's behaviour), architecture and contract design, adversarial QA on logic or behaviour tickets.
- **Sonnet:** code from a clear design, data files, manifests, docs drafting, mechanical verification.
- **Haiku:** pure scans and greps only.
- Implementer ≠ verifier, always.

| # | Ticket | Implementer | Verifier / QA |
|---|---|---|---|
| 01 | Rename → lvr | Sonnet · medium | Sonnet · high (hunt hidden `lvp`: JSON fixtures, case variants, paths, keyframes) |
| 02 | lvr.mjs core | Opus · high design → Sonnet · high code | **Opus · high** (adversarial: corrupt journal, seq gaps, Windows paths, atomic write) |
| 03 | Contract fixes E-01..E-14 | Opus · high | Sonnet · high re-runs the audit method of research/E → Opus · medium judge |
| 04 | Handoff scripts | Sonnet · high | **Opus · high** |
| 26 | Research-grounded behaviour | Opus · xhigh (principles + procedures) → Sonnet · high (`cite check`, `research log`) | **Opus · high** (try to sneak memory-based or stale claims past it) |
| 27 | State schema v2 + migration | Opus · high design → Sonnet · high | **Opus · high** (migration of real v1 fixtures, replay parity) |
| 38 | lvr-review-plan | Opus · xhigh (skill text, lenses, scale) → Sonnet · high (`lvr review *` scripts) | **Opus · xhigh** (planted-miss test, byte-equal re-run, sycophancy probes) |
| 05 | Booster registry | Sonnet · medium | Sonnet · medium (online check that every repo/SHA/license resolves) |
| 06 | JIT install/uninstall + A/B | Opus · high design → Sonnet · high | **Opus · high** (user-owned skill untouched, failure paths, A/B evidence) |
| 07 | Apply curation map | Opus · high | Opus · medium |
| 08 | Product-type engine | Opus · xhigh design → Sonnet · high | **Opus · high** |
| 09 | Ten profiles | Sonnet · high, one agent per profile, in parallel | Opus · high review of all ten |
| 10 | Workflow-mode bundle | Opus · high | **Opus · high** (KPR house-hunter dry run) |
| 11 | Data module | Opus · high (delegate to DB-architect profile per research/F) | **Opus · high** |
| 12 | Framework discovery S5b | Sonnet · high (script, reuse research/J probe) + Opus · medium (procedure text) | **Opus · high** (rate limits, wrong Context7 hit, version skew) |
| 13 | Plan-quality gaps | Opus · high | **Opus · high** (re-run the futsal audit) |
| 14 | UI_SPEC | Sonnet · high | Opus · medium |
| 15 | AI-feature spec | Opus · high | **Opus · high** |
| 16 | Adaptive depth | Opus · xhigh | **Opus · high** (rich vs thin S0 scripts) |
| 17 | Agent routing (planning specialists only, B11) | Opus · high | **Opus · high** (no-subagent harness fallback) |
| 18 | Manifests every harness | Sonnet · medium | Sonnet · medium |
| 19 | OS × harness matrix | Sonnet · medium (CI matrix) | owner for manual harness runs |
| 20 | Hygiene + de-personalize | Haiku · low (scans) → Sonnet · medium | Sonnet · medium |
| 21 | Web app scope | Sonnet · medium | Sonnet · high (run the app, open the example) |
| 39 | Dashboard + session tracker | Opus · high (data contract, session-id research per harness, UX) → Sonnet · high (parsers + views) | **Opus · high** (legacy/partial/corrupt projects, unverified resume commands, no network calls) |
| 22 | CI + tests | Sonnet · high | **Opus · high** (find the untested paths) |
| 23 | Public docs | Sonnet · high, then the anti-slop pass | Opus · medium |
| 28 | Variable bundle contract | Sonnet · high | Opus · medium |
| 29 | add-feature alignment | Opus · high | **Opus · high** |
| 30 | build alignment | Opus · high | **Opus · high** |
| 31 | Done per product type | Sonnet · medium | Sonnet · high |
| 32 | continue alignment | Sonnet · high | **Opus · high** (resume in every new mid-step) |
| 33 | recheck non-review alignment | merge into 38 if 38 rewrote the skill; else Sonnet · medium | Sonnet · medium |
| 34 | personal-brand alignment | Sonnet · medium | Sonnet · medium |
| 35 | skills README | Sonnet · medium | Sonnet · medium |
| 36 | Booster lifecycle end | Sonnet · high | Opus · medium |
| 37 | handoff alignment | Sonnet · high | **Opus · high** |
| 24 | Dogfood proof | owner runs it; Opus · xhigh audits | — |
| 25 | Release | owner | — |

## 4. Token economy rules
- Subagents write long output to `.scratch/public-release/runs/` and return ≤150 words. You read a run file only when a decision depends on it.
- Pass subagents exact file paths and line ranges instead of pasting content.
- Run independent tickets in parallel when their `Blocked by` allows it and they touch different files (e.g. 18 alongside 02; 09's ten profiles in parallel).
- Don't re-research what `research/A–L` already settled; re-verify only facts older than the freshness limits in spec.md R2.

## 5. Done definition for the whole loop
- Every ticket except 24/25 is `done` or `needs-info` with a reason.
- A final Opus · high pass re-runs the sync audit (research/E method) and `npm run check:skills`, then writes `.scratch/public-release/runs/FINAL.md`.
- Tell the owner: done count, needs-info list, the next human steps (19 manual, 24, 25).
