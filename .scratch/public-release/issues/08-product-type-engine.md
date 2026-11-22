# 08: Product-type profile engine
Status: done (2026-11-23) · Blocked by: 02, 05 · Type: task · Agent: Opus (design) → Sonnet (build)

- [x] S1 asks the product type first. Multi-select is allowed, e.g. web + mobile.
- [x] `references/profiles/<type>.json` holds:
  - extra questions per section (S1–S8)
  - extra bundle files
  - conditional boosters
  - specialist agents
  - flags: `stores_data`, `has_ui`, `has_llm`
  - exit-criteria additions
- [x] The engine merges the active profiles into each section's question pool and the S9 file list.
- [x] The bundle stays "fixed per run": the 20 base files + the profile files listed in blueprint.json.
- [x] Spec 02/04 are updated to describe profiles.
Verify: unit tests confirm that merging 2 profiles is deterministic, and that the futsal (web) output is unchanged.

## Comments
- Owner 2026-11-21 (spec P6, brainstorm-03 round 9): when the user does not know the product type, keep interviewing ("emangnya mau bikin apa?") until the context is full, then RECOMMEND the type with reasons for the user to confirm. Never stop at "I don't know". The schema field comes from ticket 27 (`product_types[]` source = user | ai_recommended + rationale + confirmed).
- From ticket 27 verify (A14, A7): replay of a hand-written journal can still mark an AI recommendation decided for 3 payload forms, and `restored: true` skips the live P6 check. Close both with the product-type flow. See `runs/27-verify.md`.

- 2026-11-23: Five profile cases plus all shared checks passed. The futsal output stayed byte-identical. The base count describes the 20 Markdown outputs and the generated index is counted separately. See [verification](../runs/08-verify.md).
