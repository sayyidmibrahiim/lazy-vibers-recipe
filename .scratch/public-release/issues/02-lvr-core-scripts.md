# 02: lvr.mjs core (state, journal, replay, gate)
Status: done (2026-11-20) · Blocked by: 01 · Type: task · Agent: Sonnet (Opus review)
Source: research/D-install-and-scripts.md (27 candidates).

Build a zero-dep Node ≥22 file (owner 2026-11-19: Node 18/20 are EOL; `npx skills` already needs ≥22.20), `scripts/lvr.mjs`. One synced copy goes in each skill as `skills/<s>/scripts/lvr.mjs`. Each SKILL.md calls it and keeps a prose fallback for when Node is absent.
- [x] `journal append`: assigns seq, ISO ts and the event type. Event types are validated against conventions.
- [x] `state write|validate`: checks the schema from spec 01 and writes atomically (tmp + rename, Windows-safe).
- [x] `answer record` / `decision record`: writes the journal + state as one checkpoint.
- [x] `replay`: rebuilds state.json from the journal. This is the ONE implementation that all skills use.
- [x] `gate`: Folder Gate checks 1–5, returning JSON.
- [x] `slug`: slug rules from S0.
- [x] `probe grade`: grades the 3 capability probes.
- [x] `booster check`: delegates to ticket 05's registry.
- [x] Output is JSON on stdout; errors give a non-zero exit plus a message.
Verify:
- Unit tests (ticket 22) on the futsal fixture.
- `replay` output deep-equals the live state.json.
- Runs on Windows, macOS and Linux (ticket 19).

## Comments
- 2026-11-20: done after 3 fix rounds (round 3 approved by owner, scoped to X1). Evidence: `runs/02-design.md`, `runs/02-impl.md` (rounds 1–3 + Y1 patch), `runs/02-verify.md` (verify + re-verifies after rounds 1, 2, 3).
- Final re-verify (Opus, round 3): X1 closed in every variant; T0–T9, T12, T16–T20, T22 PASS; fuzz 7/11/23/31 `[]`; 30 parallel writers OK; N2/N5 PASS. One regression Y1 found with a one-line fix tested by the verifier; applied verbatim and re-run with the verifier's scripts (X1, sticky lag, Y1 refused, fuzz `[]`). `npm run lint`, `npx tsc --noEmit`, `npm run check:skills` rc 0; all 7 script and 7 conventions copies `cmp` equal.
- Deferred by design: unit tests on the futsal fixture → ticket 22; Windows/macOS run → ticket 19. Open advisories (non-blocking): E1, E2, C1, C3–C5, A1–A6, A8, B3 (see `runs/02-verify.md`).
- Owner decisions during the ticket: script Node floor ≥22; `engines.node` ≥24 (app needs `node:sqlite`).
