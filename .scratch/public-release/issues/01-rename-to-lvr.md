# 01: Rename LVP → Lazy Vibers Recipe (lvr)
Status: done (2026-11-19) · Blocked by: none · Type: task · Agent: Sonnet

- [x] Rename the 7 skill folders: `git mv skills/lvp-* skills/lvr-*`.
- [x] Rename `skills/lvp-principles.md` and `skills/lvp-conventions.md` to `lvr-*`. Update every `references/` snapshot and keep them byte-identical to `docs/spec`.
- [x] Change every slash command from `/lvp-*` to `/lvr-*` across skills/, docs/, README, GLOSSARY and AGENTS.md.
- [x] Rename the protocol folder `.lvp/` → `.lvr/`. This covers the spec, skills, `src/lib/lvp-fs.ts` (→ `lvr-fs.ts`), `/api/lvp/open` (→ `/api/lvr/open`) and its client.
- [x] Change the display name "Lazy Vibe Planner" → "Lazy Vibers Recipe". `package.json` name becomes `lazy-vibers-recipe`; regenerate the lockfile.
- [x] Rename src identifiers: `__lvpDb`, the `Lvp*` types and the `lvp-*` keyframes.
- [x] Convert the dogfood fixture `.lvp/` → `.lvr/`.
Verify:
- `git grep -niE 'lvp|lazy.?vibe planner'` returns only history notes in closed tickets and ADRs.
- `npm run lint && npx tsc --noEmit && npm run build` passes.
- `cmp` passes on all references.

## Comments
- 2026-11-19 verified by an independent Sonnet · high verifier (implementation: runs/01-impl.md, verification: runs/01-verify.md).
  - `git grep -niE 'lvp|lazy.?vibe planner'` → no misses outside history. The only src hit is src/app/open-folder-form.tsx:53, the literal path `.scratch/lvp-core/dogfood/run`. That folder name is closed-ticket history, kept on purpose.
  - The dogfood fixture is converted to `.lvr/`. state.json, blueprint.json and all 110 journal lines parse.
  - `npm run lint` rc=0 (1 warning in research/J-signals-probe.mjs). `npx tsc --noEmit` rc=0. `npm run build` rc=0, and `/api/lvr/open` is built.
  - `cmp`: 7/7 principles.md and 7/7 conventions.md match skills/lvr-principles.md and skills/lvr-conventions.md.
- Left for later:
  - README.md:38 and skills/README.md:43,48 still use the repo slug `lazy-vibers-planner`. The GitHub repo rename belongs to ticket 25 (release).
  - The old global installs ~/.agents/skills/lvp-* and ~/.claude/skills/lvp-* are untouched (outside the project; owner decision).
