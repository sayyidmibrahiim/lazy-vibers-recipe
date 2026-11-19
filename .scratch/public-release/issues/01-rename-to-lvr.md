# 01: Rename LVP → Lazy Vibers Recipe (lvr)
Status: ready-for-agent · Blocked by: none · Type: task · Agent: Sonnet

- [ ] Rename the 7 skill folders: `git mv skills/lvp-* skills/lvr-*`.
- [ ] Rename `skills/lvp-principles.md` and `skills/lvp-conventions.md` to `lvr-*`. Update every `references/` snapshot and keep them byte-identical to `docs/spec`.
- [ ] Change every slash command from `/lvp-*` to `/lvr-*` across skills/, docs/, README, GLOSSARY and AGENTS.md.
- [ ] Rename the protocol folder `.lvp/` → `.lvr/`. This covers the spec, skills, `src/lib/lvp-fs.ts` (→ `lvr-fs.ts`), `/api/lvp/open` (→ `/api/lvr/open`) and its client.
- [ ] Change the display name "Lazy Vibe Planner" → "Lazy Vibers Recipe". `package.json` name becomes `lazy-vibers-recipe`; regenerate the lockfile.
- [ ] Rename src identifiers: `__lvpDb`, the `Lvp*` types and the `lvp-*` keyframes.
- [ ] Convert the dogfood fixture `.lvp/` → `.lvr/`.
Verify:
- `git grep -niE 'lvp|lazy.?vibe planner'` returns only history notes in closed tickets and ADRs.
- `npm run lint && npx tsc --noEmit && npm run build` passes.
- `cmp` passes on all references.
