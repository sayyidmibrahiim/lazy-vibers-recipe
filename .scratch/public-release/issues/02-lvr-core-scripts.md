# 02: lvr.mjs core (state, journal, replay, gate)
Status: ready-for-agent · Blocked by: 01 · Type: task · Agent: Sonnet (Opus review)
Source: research/D-install-and-scripts.md (27 candidates).

Build a zero-dep Node ≥18 file, `scripts/lvr.mjs`. One synced copy goes in each skill as `skills/<s>/scripts/lvr.mjs`. Each SKILL.md calls it and keeps a prose fallback for when Node is absent.
- [ ] `journal append`: assigns seq, ISO ts and the event type. Event types are validated against conventions.
- [ ] `state write|validate`: checks the schema from spec 01 and writes atomically (tmp + rename, Windows-safe).
- [ ] `answer record` / `decision record`: writes the journal + state as one checkpoint.
- [ ] `replay`: rebuilds state.json from the journal. This is the ONE implementation that all skills use.
- [ ] `gate`: Folder Gate checks 1–5, returning JSON.
- [ ] `slug`: slug rules from S0.
- [ ] `probe grade`: grades the 3 capability probes.
- [ ] `booster check`: delegates to ticket 05's registry.
- [ ] Output is JSON on stdout; errors give a non-zero exit plus a message.
Verify:
- Unit tests (ticket 22) on the futsal fixture.
- `replay` output deep-equals the live state.json.
- Runs on Windows, macOS and Linux (ticket 19).
