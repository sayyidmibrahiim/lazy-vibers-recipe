# 05: Booster registry + 3 tiers
Status: done (2026-11-23) · Blocked by: 01 · Type: task · Agent: Sonnet
Sources: brainstorm-02 map, research/A,B,C,F,G,H,J.

- [x] Create `skills/<s>/references/boosters.json`. It is one source, synced to every skill.
  - Fields per booster: id, repo, pinned SHA, license, tier (core/conditional/reference), sections, trigger condition, and the install command per harness.
  - Triggers include, for example: `product_type in [...]`, `stores_data`, `has_ui`, `has_llm`, `regulated_domain`.
- [x] Core (installed at init, ≤6): pm-skills, grilling, planning-and-task-breakdown, ponytail, anti-slop (elithrar), SimpleEnglish.
- [x] Conditional and reference lists come from the curation map.
- [x] Rule: no NC, AGPL or unlicensed boosters. Every entry needs a license check (verified 2026-11-19).
- [x] `lvr.mjs booster check|plan` reports what this project needs, per section.
Verify: a schema test passes; every repo/SHA resolves (an online check script).

## Comments

- 2026-11-23: Registry schema and behavior tests passed (5 of 5). The online checker verified all 27 exact pins and licenses. Shared fixtures, skill sync, lint and TypeScript passed. See [verification](../runs/05-verify.md).
