# 21: Web app scope
Status: done (2026-11-19) · Blocked by: 01 · Type: task · Agent: Sonnet
- [x] The read-only `.lvr/` viewer becomes the home page. The legacy 5-doc generator goes behind `ENABLE_LEGACY_GENERATOR=1` (or is removed). The DB migration stays idempotent.
- [x] The viewer renders UI_SPEC, profile files and the Mermaid ERD.
- [x] Superseded in part by 39 (dashboard views); 21 keeps: home = viewer, legacy generator behind flag.

## Comments
- 2026-11-19 implemented by Sonnet · medium (runs/21-impl.md, incl. fix round 1), verified by an independent Sonnet · high verifier (runs/21-verify.md): PASS after 1 fix round. All builds ran in a scratch copy so the live `next start` on :3100 kept serving (still 200).
  - `npm run lint && npx tsc --noEmit && npm run build` rc=0, 0 Turbopack warnings after fix round 1.
  - `/` = read-only `.lvr/` viewer; the futsal fixture (.scratch/lvp-core/dogfood/run) renders its 19 docs in headless Chrome.
  - Legacy generator moved to `/legacy` behind `ENABLE_LEGACY_GENERATOR=1` (only the exact value `1`; documented in README and .env.example). Flag off: `/legacy`, `/api/projects/*`, `/api/docs/*` and DB `/p/[id]` → 404 `{ error }` in Indonesian, no legacy links. Flag on: works as before. data/planner.db untouched; no schema change.
  - Mermaid (new dep `mermaid` ^12.3.0) renders offline with `htmlLabels` off + SVG sanitizing; invalid blocks fall back to raw code; ASCII fences stay monospace/no-wrap. Fix round 1: zero external requests in headless Chrome for `<img>`, `<image href>`, xlink, foreignObject, `classDef`/`style url()` and `%%{init}%%` override payloads; no XSS.
  - UI_SPEC and profile files discovered by filename and rendered; absent is fine. Path traversal rejected; fix round 1: symlinks escaping the project root rejected via realpath (400 on open, 404 for an already-opened project), symlinks inside the project still render.
- Left for later:
  - An already-opened project with an escaping symlink shows the generic Next 404 page, not an Indonesian message (minor; ticket 39 owns the dashboard views).
