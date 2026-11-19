# Ticket 21 implementation

## Files changed
- src/app/page.tsx: home is now the read-only .lvr viewer (open-folder form + list of opened folders).
- src/app/legacy/page.tsx (old home, moved) and src/app/legacy/new-project-form.tsx (git mv): legacy generator UI; notFound() unless flag.
- src/lib/legacy.ts (new): legacyEnabled(), legacyGuard() -> 404 { error } in Indonesian.
- Guarded with legacyGuard(): api/projects, api/projects/[id], api/projects/[id]/blueprint, api/docs/[id], api/docs/[id]/revise. /api/lvr/open untouched.
- src/app/p/[id]/page.tsx: non-LVR projects 404 unless flag; LVR projects always viewable. project-client back link -> /legacy.
- src/lib/lvr-fs.ts: discovers UI_SPEC.md (root or SPEC/) and profile files (profile/, profiles/ dirs, or *profile*.md at root/SPEC) by glob, no fixed schema. New category "profile".
- src/components/markdown.tsx + new mermaid-block.tsx: ```mermaid rendered client-side with bundled `mermaid` (dynamic import, no CDN, securityLevel strict), raw-code fallback + message on error. Other fences stay <pre>, white-space: pre (globals.css).
- package.json/lock: added mermaid. .env.example and README.md: ENABLE_LEGACY_GENERATOR documented.
- db.ts untouched (migrations already idempotent); data/planner.db untouched.

## Verification (scratch copy on same fs, hardlinked node_modules; /tmp copy failed as turbopack root)
- lint rc=0 (only pre-existing/unused warnings), tsc rc=0, next build rc=0 (routes: /, /legacy, /p/[id], api).
- Flag unset, port 3217: / 200 "Buka blueprint"; POST /api/lvr/open on fixture copy -> id; /p/<id> 200; /legacy 404; /api/projects/x -> 404 {"error":"Generator lama dinonaktifkan. ..."}; POST /api/projects 404; /api/docs/x 404.
- Flag =1: /legacy 200 with "Generator lama" link on /; /api/projects/x -> 404 "Proyek tidak ditemukan." (real handler).
- Viewer HTML for fixture copy lists UI Spec, Profile: PROFILE-web, Profile: mobile.
- Headless Chrome on a scratch page: valid erDiagram -> inline <svg> in .mermaid-figure; invalid mermaid -> "Diagram gagal dirender" + raw code; ASCII fence stays <pre><code>.
- Test additions (mermaid ERD, UI_SPEC, profiles) were only in a /tmp copy of the fixture; fixture unchanged. Scratch dirs and test servers removed. Port 3100 untouched.

## Notes
- Viewer still registers opened folders in SQLite (existing behaviour), so `/` needs the nodejs runtime.
- Turbopack warns about lvr-fs.ts dynamic path tracing (pre-existing).

## Fix round 1
1. Mermaid offline: htmlLabels:false (labels with <img>/<a> render as inert text) plus a DOMParser-based sanitizeSvg in src/components/mermaid-block.tsx (drops script/img/image/iframe/object/link/etc., on* attrs, non-local href/src, url() to non-# targets in attrs/style). Headless Chrome with a local request-logging server on :3299 and payload blocks (<img src=http://..>, <a href=http://..>, style fill:url(http://..), click href): external hits = [] ; valid ERD still renders as SVG; unsupported payloads fall back to raw code.
2. Symlink containment in src/lib/lvr-fs.ts: all reads go through realpath-guarded wrappers; escape throws LvrPathError. /api/lvr/open returns 400 {"error":"Folder berisi tautan (symlink) yang mengarah ke luar folder proyek. Ditolak demi keamanan."}; /p/[id] 404s. Proof: clean fixture copy -> 200; SPEC/prd.md -> /etc/passwd -> 400 with that message, and previously registered /p/<id> -> 404.
3. README and .env.example state only the exact value "1" enables ENABLE_LEGACY_GENERATOR.
4. Turbopack dynamic-fs warnings silenced (/*turbopackIgnore: true*/ on path.join in lvr-fs.ts); scratch build shows 0 warnings.
Lint rc=0 (1 pre-existing warning), tsc rc=0, scratch build rc=0. Scratch dirs and servers removed.
