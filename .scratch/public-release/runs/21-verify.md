# Ticket 21 verification (independent)

Method: build/run in a hardlinked scratch copy (outside the repo), ports 3201-3205, copy of data/planner.db, Playwright-core + system Chrome. Scratch dir deleted, servers killed, live :3100 still 200. impl note not read before verdict.

## Verdict: PASS with advisories (no blocking fixes)

| # | Check | Result |
|---|-------|--------|
| 1 | lint + tsc + build | PASS. `npm run lint` rc=0 (1 pre-existing warning in a research .mjs), `npm run build` rc=0, `npx tsc --noEmit` rc=0 (after build; tsc fails before build as AGENTS.md says). Note: build shows 3 NEW Turbopack warnings "Dynamic filesystem access causes tracing of the whole project" at src/lib/lvr-fs.ts:149-151 (new discovery loop). |
| 2 | `/` = .lvr viewer, dogfood run | PASS. h1 "Buka blueprint. Baca dengan nyaman."; POST /api/lvr/open on a copy of .scratch/lvp-core/dogfood/run -> id; /p/<id> renders "Futsal Court Booking", 19 docs, tabs Ringkasan/Dokumen Bundle/Pipeline; every doc button opens. |
| 3 | Legacy flag | PASS. Flag off: GET /legacy 404, /p/<DB project> 404, GET/POST /api/projects*, /api/projects/<id>/blueprint, PATCH /api/docs/<id>, POST /api/docs/<id>/revise all 404 `{"error":"Generator lama dinonaktifkan. Setel ENABLE_LEGACY_GENERATOR=1 untuk mengaktifkannya."}` (guard is first statement, before any LLM/DB call). No `/legacy` href in `/` or LVR `/p/<id>` HTML when off. Flag on (=1): `/` shows "Generator lama" link, /legacy 200, /p/<db> 200 with ProjectClient (back link -> /legacy), /api/projects 400 validation, blueprint stream returns doc_done skipped/done, PATCH works. Edge: "true", "0", "" all stay OFF (strict `=== "1"`). No DB schema change (db.ts untouched) so migration stays idempotent. Page 404s use Next default English "not found" page (routes use Indonesian JSON). |
| 4 | Mermaid | PASS. Valid erDiagram -> SVG; invalid block -> label "Diagram gagal dirender. Menampilkan kode asli." + raw `<pre>`; no stray `dmmd` nodes; ASCII fence `white-space: pre`, Geist Mono, no wrap, overflow-x auto; 0 external requests (mermaid is bundled, lazy chunk from same origin). XSS: securityLevel strict holds; `<script>`, onerror/onmouseover/onload, `click ... call`, `click ... "javascript:"`, iframe, and an in-doc `%%{init: securityLevel:loose}%%` directive all inert (no `window.__xss*` set, no dialog, no on* attrs in SVG). ADVISORY A: sanitized labels still keep `<img src=http://...>` and `<a href=http://...>`; Chrome fetched `http://127.0.0.1:34999/beacon.png` when the doc was opened (tracking-pixel style outbound request from a hostile doc; same class as ordinary markdown `![](http://..)` which was already possible). Suggest `htmlLabels:false` / `flowchart.htmlLabels:false`, or CSP `img-src 'self' data:`. |
| 5 | UI_SPEC / profile / traversal | PASS. In a scratch copy: UI_SPEC.md ("UI Spec", under SPEC list), profile/web-app.md and root PROFILE-saas.md ("Profile: ...") render; stray NOTES.md hidden; absent files (dogfood run) fine. Symlinked *discovered* files (profile/passwd.md -> /etc/passwd, UI_SPEC_link.md) are skipped (Dirent.isFile). Open API with `../../etc`, `/etc`, `/etc/passwd`, `%2e%2e%2f`, `/x/../etc`, a subdir, `~/` -> 400 Indonesian error; no file-read endpoint exists (`/api/lvr/file` 404, only POST /api/lvr/open which reads fixed filenames under a folder having .lvr/state.json). ADVISORY B (pre-existing, not from this diff): a symlinked *known* bundle file (SPEC/prd.md -> /etc/hostname) is followed and rendered ("second-brain"). Fix: lstat/realpath check inside `resolved` in readLvrProject for BUNDLE_FILES/recheck/brand reads. |
| 6 | Tokens / Indonesian / docs | PASS. No raw hex, gray-/slate-/zinc-/neutral- in diff or new files; CSS uses var(--color-line/card). UI copy and errors Indonesian. README (English, per convention) and .env.example document ENABLE_LEGACY_GENERATOR=1. Minor: docs do not say only the exact value `1` enables it. |

## Optional fixes (non-blocking)
1. lvr-fs.ts:149-151: add `/*turbopackIgnore: true*/` (or restructure) to silence the 3 new build warnings.
2. Mermaid label HTML: disable htmlLabels or add img-src CSP (Advisory A).
3. realpath containment for bundle reads (Advisory B).
4. README/.env.example: state "only the value 1 enables it".

## Re-verify after fix round 1

Scratch hardlinked copy, ports 3211/3212, local beacon listener on 127.0.0.1:34999; scripts/skills (ticket 02) excluded. Cleaned up; :3100 still 200.

**Overall verdict: PASS (all advisories closed, no new issues).**

| Check | Result |
|---|---|
| A. Mermaid zero external requests | PASS. Payloads: `<img>`/`<a>`/`<iframe>`/`<svg><image href>` labels, `<foreignObject>`, `xlink:href` image/use, `classDef`/`style`/`linkStyle` with `url(http://...)`, `%%{init}%%` overriding securityLevel/htmlLabels/themeCSS (`@import`, `url()`)/fontFamily/themeVariables, `click ... call` and `click "http://"`, sequence/class/mindmap labels. Headless Chrome saw 0 requests to the beacon port and 0 external requests (beacon listener log empty). No img/image/iframe/script/foreignObject left in any SVG; no `@import` or external `url(` in embedded styles; hostile text survives only as escaped text; no `window.__xss*` set. Unparseable blocks fall back to raw code with the Indonesian notice. |
| B. Valid ERD | PASS. erDiagram renders as SVG (contains USER/COURT/BOOKING). |
| C. Symlink escape | PASS. Open API: file symlink (SPEC/prd.md -> /etc/hostname), SPEC dir symlink to outside dir, `.lvr/state.json` symlink to outside all return 400 `{error}` (Indonesian). Already-opened project, symlink swapped in afterwards: `/p/<id>` 404 and no leaked content; restoring the file returns 200. Symlink INSIDE the project (SPEC/api.md -> ../real/note.md) opens and renders ("inside real ok"). A symlinked project root folder whose target is a valid project also opens. Note: the already-opened case shows the generic Next 404 page, not the Indonesian message (acceptable). |
| D. Docs flag wording | PASS. README and .env.example say only the exact value `1` enables it. |
| E. Turbopack warnings | PASS. Build output has no warnings. |
| Regression 1 | PASS. lint rc=0 (1 pre-existing warning), build rc=0, tsc rc=0. |
| Regression 2 | PASS. Futsal fixture: 19 docs render; UI Spec and profile files render; ASCII/ERD/fallback unchanged. |
| Regression 3 | PASS. Flag off: /legacy, /p/<db project>, /api/projects* are 404 (JSON errors Indonesian), no legacy link on `/`. Flag on: all reachable (200/400 validation), `/` shows the legacy link. |
| Regression 5/6 | PASS. Traversal strings on open API still rejected; no raw hex/gray tokens introduced in changed files. |
