# 01 verify — rename lvp -> lvr (independent verifier)
Overall: PASS (no blocking misses; 2 non-blocking notes)

## 1. git grep -niE 'lvp|lazy.?vibe planner' — PASS
Command: `git grep -niE 'lvp|lazy.?vibe planner' -- . ':!.scratch' ':!docs/adr'`
- Only hit: src/app/open-folder-form.tsx:53 = literal path `.scratch/lvp-core/dogfood/run` (folder kept on purpose; path is valid). ACCEPTABLE (note: user-facing hint shows "lvp-core" in a public UI; optional cosmetic).
- docs/adr: 8 hits across 0001-0006 = history. ACCEPTABLE.
- .scratch/public-release, .scratch/lvp-core: history notes. ACCEPTABLE.
- .scratch/lvp-v1/issues/10-15 and .scratch/g1-g3-grilling-handoff.md: old closed-ticket/handoff history, still say lvp. ACCEPTABLE (inside .scratch).
- Dogfood fixture .scratch/lvp-core/dogfood/run/: `grep -rniIE 'lvp|lazy.?vibe planner' | grep -vi lvp-core` => 0 hits; only the `.scratch/lvp-core/...` cwd/project_dir path strings in journal.ndjson lines 1-2 (kept parent folder). `.lvp` dir absent (`find . -name '.lvp*'` empty); `.lvr/` present with docs/sections, journal, state.json.
- Extra patterns: `vibers?[ -_]?planner|vibe[ -_]planner` => README.md:38, skills/README.md:43,48 `<owner>/lazy-vibers-planner` (GitHub repo slug placeholder; repo dir name). ACCEPTABLE/unknown (repo slug may rename later).
- Case variants `l[vV][pP]` outside .scratch/adr: only the same open-folder-form.tsx:53.

## 2. lint / tsc / build — PASS
`npm run lint` rc=0 (1 warning: .scratch/public-release/research/J-signals-probe.mjs unused var; not part of src, pre-existing/untracked-ish).
`npx tsc --noEmit` rc=0. `npm run build` rc=0, routes include /api/lvr/open.
Node v24.18.1.

## 3. cmp references — PASS
`for f in skills/lvr-*/references/principles.md; do cmp $f skills/lvr-principles.md; done` and same for conventions.md vs skills/lvr-conventions.md: 7/7 + 7/7 identical, no output, fail=0.
Other references (feature-capture, build-loop, lint-checklist, brand-templates, audit-checklist, bundle/templates, sections/*) are skill-owned, no byte-mirror source in docs/spec; not cmp-able (same as before rename). Content already lvr (no lvp hits).

## 4. Hidden lvp hunt — PASS
- SKILL.md `name:` == folder for all 7 (lvr-add-feature, lvr-build, lvr-continue, lvr-handoff, lvr-init-new-idea, lvr-personal-brand, lvr-recheck-plan).
- package.json name and package-lock.json name (both top-level and packages[""]) = lazy-vibers-recipe; no lvp in either.
- src: keyframes lvr-pulse/lvr-rise (globals.css:205,221), __lvrDb (db.ts), /api/lvr/open fetch (open-folder-form.tsx:21), lvr-fs.ts, lvr-client.tsx, slash commands /lvr-personal-brand, /lvr-recheck-plan (lvr-client.tsx:483). No localStorage/env var using lvp. .env.example clean. .gitignore has no lvp/lvr entries (nothing stale).
- Tracked paths containing "lvp" outside .scratch: none (`git ls-files | grep -i lvp` => only .scratch history paths).

## 5. JSON validity — PASS
state.json ok, blueprint.json ok, journal.ndjson 110 lines all parse; every *.json in repo (excl node_modules/.next) parses.

## Notes (non-blocking)
- ~/.claude/skills and ~/.agents/skills still hold old lvp-* installs (outside repo; owner decision, per impl note).
- src/app/open-folder-form.tsx:53 displays `.scratch/lvp-core/dogfood/run`; consider cosmetic change if the folder is ever renamed.
