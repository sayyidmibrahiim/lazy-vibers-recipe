# 05: Booster registry + 3 tiers
Status: ready-for-agent · Blocked by: 01 · Type: task · Agent: Sonnet
Sources: brainstorm-02 map, research/A,B,C,F,G,H,J.

- [ ] Create `skills/<s>/references/boosters.json`. It is one source, synced to every skill.
  - Fields per booster: id, repo, pinned SHA, license, tier (core/conditional/reference), sections, trigger condition, and the install command per harness.
  - Triggers include, for example: `product_type in [...]`, `stores_data`, `has_ui`, `has_llm`, `regulated_domain`.
- [ ] Core (installed at init, ≤6): pm-skills, grilling, planning-and-task-breakdown, ponytail, anti-slop (elithrar), SimpleEnglish.
- [ ] Conditional and reference lists come from the curation map.
- [ ] Rule: no NC, AGPL or unlicensed boosters. Every entry needs a license check (verified 2026-11-19).
- [ ] `lvr.mjs booster check|plan` reports what this project needs, per section.
Verify: a schema test passes; every repo/SHA resolves (an online check script).
