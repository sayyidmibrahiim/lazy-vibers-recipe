# 29: lvr-add-feature alignment
Status: done (2026-11-23) · Blocked by: 07, 08, 26, 28 · Type: task · Agent: Opus
Source: research/K rows A3, A6–A15.
- [x] Context research + freshness for the new feature (D11/D12).
- [x] S4 gap rules: unhappy paths, abuse, AI and data.
- [x] Adaptive depth.
- [x] Mini S5b when the feature needs a new framework or library.
- [x] JIT boosters and delegation.
- [x] `ids next`.
- [x] Post-apply lint.
- [x] A profile-flag flip (e.g. the feature adds AI or data) adds the needed bundle file with a recorded decision (A6).

## Comments

`node --test .scratch/public-release/fixtures/29/*.test.mjs` covers reservation, resume, legacy adoption, confirmed AI file addition and post-apply checks. Shared regression suites, npm tests, skill sync, lint and typecheck passed. See `runs/29-impl.md` and `runs/29-verify.md`.
