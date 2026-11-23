# 30: lvr-build alignment
Status: done (2026-11-23) · Blocked by: 26, 28, 31 · Type: task · Agent: Sonnet (Opus review)
Source: research/K build rows.
- [x] Re-verify stale versions/prices against the freshness limits before each milestone.
- [x] Call the `lvr.mjs` scripts.
- [x] Booster lifecycle at build time.
- [x] Per-type release check (31).
- [x] The UI_SPEC/ai.md/data-model verification hooks.
- [x] No builder-time specialist agents in 1.0 (B11); document "after 1.0".

## Comments

`node --test tests/lvr/build.test.mjs` verifies the installed freshness gate, command capture, ordered milestone checkpoints and applicable builder boosters. Shared regressions, lint, typecheck, metadata and sync checks passed. See `runs/30-impl.md` and `runs/30-verify.md`.
