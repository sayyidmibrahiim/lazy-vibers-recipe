# 36: Booster lifecycle after the pipeline ends
Status: done (2026-11-23) · Blocked by: 06 · Type: task · Agent: Sonnet
- [x] Define who uninstalls when: after handoff, or after build if `/lvr-build` will run.
- [x] Re-install on `/lvr-add-feature` or a review re-run.
- [x] Record everything in state.
- [x] Never touch user-owned skills.

## Comments

`node --test tests/lvr/booster-cleanup.test.mjs` verified per-run receipt boundaries, consent, durable keep choices, preservation of owner copies and replay. Shared suites, including original lifecycle coverage, passed. See `runs/36-impl.md` and `runs/36-verify.md`.
