# 01 impl — rename lvp → lvr
Implemented by the first (interrupted) orchestrator run; changes left uncommitted in the working tree (last write 09:29 UTC 2026-11-19).
Scope seen in `git status`: skill folders + references renamed, lvp-principles/conventions → lvr-*, docs/spec, README, GLOSSARY, AGENTS.md,
src (lvr-fs.ts, /api/lvr/open, lvr-client.tsx, __lvrDb, keyframes), package.json name + lockfile, dogfood fixture `.lvp/` → `.lvr/`.
Kept on purpose: `.scratch/lvp-core/` folder name (closed-ticket history), history notes in .scratch and docs/adr.
Not touched: global installs in ~/.agents/skills/lvp-* and ~/.claude/skills/lvp-* symlinks (outside project; owner decision).
