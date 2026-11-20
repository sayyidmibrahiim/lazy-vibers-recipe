# 03: Fix cross-skill contract findings (sync audit)
Status: done (2026-11-20) · Blocked by: 02 · Type: task · Agent: Sonnet
Source: research/E-skills-sync-audit.md (0 blocker, 6 major, 14 minor).

- [x] E-01: pick S9 vs S10 for `current_section` after compile. Make init, continue and the spec agree.
- [x] E-02/03:
  - `replay` handles `section_blocked`, `impact_analysis` and `folder_gate_rejected`.
  - Spec 01 lists `section_blocked` and the `brand_*` events.
- [x] E-04: `/lvr-build` writes `project.status` `building`/`complete`. Define who emits `error`.
- [x] E-05: parked features from add-feature get a USER_FLOWS stub. Otherwise lint B9 must be relaxed for parked features. Pick one.
- [x] E-06: `replay` keeps milestones and decisions added after the lock.
- [x] E-07: unify the scope-lock test (and/or).
- [x] E-12: refresh spec 00.
- [x] All 14 minors.
- [x] Archive the stale `g1-g3-grilling-handoff.md`.
Verify:
- Re-run the audit agent: 0 major.
- Replay fixtures exist for each fixed event.

## Comments
- 2026-11-20 owner-approved rulings: E-01 `current_section` stays S9 after S9; E-04 /lvr-build writes `building`/`complete`, `error` defined (any skill, restored by opening events); E-05 parked features get a USER_FLOWS section marked parked, B9 unchanged; E-07 scope locked = `scope_locked` event AND S7 done (conventions §5).
- Implementer (Opus high): `runs/03-impl.md`. Fresh re-audit (Sonnet high, research/E method): `runs/03-verify.md` → 0 blocker, 0 major, 6 minor; E-01..E-20 fixed. Judge (Opus medium): FIX-FIRST on 4 wording lines (V-01, V-02, V-04, V-06), applied by the orchestrator.
- Evidence after the wording fixes: `bash .scratch/public-release/fixtures/03/run.sh` 9/9 PASS (all 9 FAIL on the pre-ticket script); `npm run check:skills` drift []; `npm run lint` 0; `npx tsc --noEmit` 0.
- Follow-ups: V-03 (helper text cites INSTALL.md / ADR-0004 not shipped in a skill) → ticket 20, re-check in 35. V-05 (no SKILL.md says when to journal `error`) → ticket 27.
