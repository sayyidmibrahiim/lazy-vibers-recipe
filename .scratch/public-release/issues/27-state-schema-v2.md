# 27: State/journal schema v2 + full replay coverage
Status: done (2026-11-21) · Blocked by: 02, 03 · Type: task · Agent: Opus design → Sonnet
Source: research/K (continue + cross-skill rows).
- [x] Schema v2 adds (incl. `sessions[]` for ticket 39):
  - `product_types[]` and flags
  - `boosters.installed[]`
  - `research[]` / `context_research`
  - `agents_delegated[]`
  - `framework_decision`
  - review ledger pointer
  - `release_check`
- [x] New journal events go into conventions:
  - `context_research`
  - `booster_installed` / `booster_uninstalled`
  - `agent_delegated`
  - `framework_selected`
  - `review_started` / `review_done`
- [x] `replay` handles every one of them.
- [x] An idempotent migration v1 → v2 for existing `.lvr/`/`.lvp/` projects.
Verify: replay = live state on fixtures for every event; the v1 fixture migrates cleanly.

## Comments
- From ticket 03 (V-05): `error` is defined in conventions §2/spec 01, but no SKILL.md says when its own run journals it. Add it with the event-ownership work. See `runs/03-verify.md`.
- From ticket 26 (Q5): consider `pipeline.research` in state for the Domain Brief and per-section scans (today derived from the journal + brief file). See `runs/26-impl.md`.
- 2026-11-21: done after 2 fix rounds. Design Opus high (`runs/27-design.md`), implementer Sonnet high (`runs/27-impl.md`), verifier Opus high (`runs/27-verify.md`).
- Owner answers (spec P6/V1, brainstorm-03 round 9): product type asked once for migrated pre-S1 projects, AI recommendation needs explicit user confirmation; `SCHEMA_TOO_NEW` stop, never downgrade; refused runs = cancelled sessions.
- Evidence: 43 real old projects (copies) migrate to valid v2, `.lvp` byte-identical, 5 formerly stuck ones recover; ≥120 SIGKILLs no data loss; replay covers all 60 events; fixtures 27 (191 cases), 03, 04, 26, 40 PASS; fuzz 0 failures; lint/tsc/check:skills 0; copies cmp-equal.
- Fixed round 1: B1 recovery loop on damaged `.lvp`, B2 unconfirmed AI recommendation saved as decided, B3 continue retry offer. Round 2: B2b sourceless payload confirming a recommendation, A4 read-only migrations folder.
- Orchestrator: re-pinned fixtures/40/text.mjs negative controls to 52fb850 (HEAD-based controls broke once ticket 40 was committed); verifier confirmed sound.
- Advisories A14 (prose-journal replay can still mark a recommendation decided for 3 payload forms) and A7 (`restored: true` skips the live P6 check) → ticket 08.
