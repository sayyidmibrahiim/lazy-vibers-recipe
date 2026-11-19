# 18: One repo, every harness
Status: done (2026-11-19) · Blocked by: 01 · Type: task · Agent: Sonnet
Source: research/D (reference implementation: ayghri/i-have-adhd).

- [x] `skills/<name>/` is the only real copy. No symlinks.
- [x] Manifests:
  - `.claude-plugin/{plugin,marketplace}.json`
  - `.codex-plugin/plugin.json`
  - `.agents/plugins/marketplace.json`
  - `gemini-extension.json`
  - `qwen-extension.json`
  - `kimi.plugin.json`
  - root `plugin.json` (Antigravity)
- [x] INSTALL.md per harness, with paths per OS. Re-verify the unverified rows (Cursor, Copilot, Windsurf, Kimi, Pi, Qwen, Kilo).
- [ ] `npx skills add sayyidmibrahiim/lazy-vibers-recipe` works.
Verify: manifest load-checks in CI where a CLI exists.

## Comments
- 2026-11-19 implemented by Sonnet · medium (runs/18-impl.md), verified by an independent Sonnet · medium verifier (runs/18-verify.md): PASS, no required fixes.
  - `find . -path ./node_modules -prune -o -type l -print` → no symlinks; all 7 `lvr-*` skills have one real copy under skills/, and every manifest that lists skills covers all 7.
  - All 8 manifests parse; name/version consistent (0.9.0, slug sayyidmibrahiim/lazy-vibers-recipe); no lvp, email or home-path leftovers.
  - `claude plugin validate .` passed; scratch `CLAUDE_CONFIG_DIR` marketplace add + install → v0.9.0 enabled, 7 skills cached. Scratch `CODEX_HOME` `codex plugin marketplace add` ok. `npx skills add <local repo> --copy` finds all 7 skills. Nothing landed in ~/.claude, ~/.codex, ~/.agents or ~/.gemini.
  - INSTALL.md spot-checked against live docs (Claude Code, Cursor, Gemini, Kilo). `npm run lint` 0 errors.
- Left for later:
  - Box 4 (`npx skills add sayyidmibrahiim/lazy-vibers-recipe`) is unticked: the repo is not public and not yet renamed. Ticket 25 already checks `npx skills add` from a clean machine.
  - The CI manifest load-check belongs to ticket 22 (the repo has no CI yet); a suggested job is in runs/18-impl.md.
  - Gemini, Qwen, Kimi, Antigravity and Pi are checked against docs only (no local CLI). The Antigravity `plugin.json` schema, the Windsurf paths and the Pi install command stay marked "unverified" in INSTALL.md; that is ticket 19's manual matrix.
  - Optional: mention Gemini's `--consent` flag in INSTALL.md.
