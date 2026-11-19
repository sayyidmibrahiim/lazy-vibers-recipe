# 08: Product-type profile engine
Status: ready-for-agent · Blocked by: 02, 05 · Type: task · Agent: Opus (design) → Sonnet (build)

- [ ] S1 asks the product type first. Multi-select is allowed, e.g. web + mobile.
- [ ] `references/profiles/<type>.json` holds:
  - extra questions per section (S1–S8)
  - extra bundle files
  - conditional boosters
  - specialist agents
  - flags: `stores_data`, `has_ui`, `has_llm`
  - exit-criteria additions
- [ ] The engine merges the active profiles into each section's question pool and the S9 file list.
- [ ] The bundle stays "fixed per run": the 20 base files + the profile files listed in blueprint.json.
- [ ] Spec 02/04 are updated to describe profiles.
Verify: unit tests confirm that merging 2 profiles is deterministic, and that the futsal (web) output is unchanged.
