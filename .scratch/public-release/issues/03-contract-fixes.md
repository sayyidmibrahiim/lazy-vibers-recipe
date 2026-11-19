# 03: Fix cross-skill contract findings (sync audit)
Status: ready-for-agent · Blocked by: 02 · Type: task · Agent: Sonnet
Source: research/E-skills-sync-audit.md (0 blocker, 6 major, 14 minor).

- [ ] E-01: pick S9 vs S10 for `current_section` after compile. Make init, continue and the spec agree.
- [ ] E-02/03:
  - `replay` handles `section_blocked`, `impact_analysis` and `folder_gate_rejected`.
  - Spec 01 lists `section_blocked` and the `brand_*` events.
- [ ] E-04: `/lvr-build` writes `project.status` `building`/`complete`. Define who emits `error`.
- [ ] E-05: parked features from add-feature get a USER_FLOWS stub. Otherwise lint B9 must be relaxed for parked features. Pick one.
- [ ] E-06: `replay` keeps milestones and decisions added after the lock.
- [ ] E-07: unify the scope-lock test (and/or).
- [ ] E-12: refresh spec 00.
- [ ] All 14 minors.
- [ ] Archive the stale `g1-g3-grilling-handoff.md`.
Verify:
- Re-run the audit agent: 0 major.
- Replay fixtures exist for each fixed event.
