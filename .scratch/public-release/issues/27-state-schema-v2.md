# 27: State/journal schema v2 + full replay coverage
Status: ready-for-agent · Blocked by: 02, 03 · Type: task · Agent: Opus design → Sonnet
Source: research/K (continue + cross-skill rows).
- [ ] Schema v2 adds (incl. `sessions[]` for ticket 39):
  - `product_types[]` and flags
  - `boosters.installed[]`
  - `research[]` / `context_research`
  - `agents_delegated[]`
  - `framework_decision`
  - review ledger pointer
  - `release_check`
- [ ] New journal events go into conventions:
  - `context_research`
  - `booster_installed` / `booster_uninstalled`
  - `agent_delegated`
  - `framework_selected`
  - `review_started` / `review_done`
- [ ] `replay` handles every one of them.
- [ ] An idempotent migration v1 → v2 for existing `.lvr/`/`.lvp/` projects.
Verify: replay = live state on fixtures for every event; the v1 fixture migrates cleanly.

## Comments
- From ticket 03 (V-05): `error` is defined in conventions §2/spec 01, but no SKILL.md says when its own run journals it. Add it with the event-ownership work. See `runs/03-verify.md`.
