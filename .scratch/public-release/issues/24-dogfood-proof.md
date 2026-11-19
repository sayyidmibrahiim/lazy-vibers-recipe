# 24: Dogfood proof (real runs)
Status: ready-for-human · Blocked by: 09–17, 19 · Type: task · Agent: owner + Opus audit
- [ ] Owner runs `/lvr-init-new-idea` end to end for:
  1. the KPR house-hunter personal workflow (skill/plugin profile)
  2. one web app with data (Supabase)
- [ ] A builder agent (no Recipe skills) builds M0 from HANDOFF-PROMPT for each. Count every guess and every question back.
- [ ] Re-run the bundle audit (research method of brainstorm-01).
Exit: all scorecard artifacts ≥4, and ≤2 builder guesses per milestone. Bundles are saved to `examples/`.
