# 18: One repo, every harness
Status: ready-for-agent · Blocked by: 01 · Type: task · Agent: Sonnet
Source: research/D (reference implementation: ayghri/i-have-adhd).

- [ ] `skills/<name>/` is the only real copy. No symlinks.
- [ ] Manifests:
  - `.claude-plugin/{plugin,marketplace}.json`
  - `.codex-plugin/plugin.json`
  - `.agents/plugins/marketplace.json`
  - `gemini-extension.json`
  - `qwen-extension.json`
  - `kimi.plugin.json`
  - root `plugin.json` (Antigravity)
- [ ] INSTALL.md per harness, with paths per OS. Re-verify the unverified rows (Cursor, Copilot, Windsurf, Kimi, Pi, Qwen, Kilo).
- [ ] `npx skills add sayyidmibrahiim/lazy-vibers-recipe` works.
Verify: manifest load-checks in CI where a CLI exists.
