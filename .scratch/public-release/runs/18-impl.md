# Ticket 18 implementation (2026-11-19)

## Files created
.claude-plugin/plugin.json, .claude-plugin/marketplace.json, .codex-plugin/plugin.json, .agents/plugins/marketplace.json, gemini-extension.json, qwen-extension.json, kimi.plugin.json, plugin.json (Antigravity), INSTALL.md. Edited: skills/README.md (one link line to INSTALL.md). All version 0.9.0, slug sayyidmibrahiim/lazy-vibers-recipe. No symlinks, no copied skill folders; all point at skills/.
Shape reference: ayghri/i-have-adhd manifests (read via gh api, pushed 2026-10-19).

## Sources (all fetched 2026-11-19)
- Claude Code: code.claude.com/docs/en/plugins-reference, /plugins/marketplace-reference
- Codex: developers.openai.com/codex/plugins/build, learn.chatgpt.com/docs/build-skills (via D research)
- Gemini: geminicli.com/docs/extensions/reference/, /docs/cli/skills/ (note: no `skills` key in manifest docs; page says Gemini CLI replaced by Antigravity CLI 2026-06-18)
- Qwen: qwenlm.github.io/qwen-code-docs/en/users/extension/introduction/
- Kimi: moonshotai.github.io/kimi-code/en/customization/plugins and /skills
- Antigravity: antigravity.google/docs/skills (plugin.json schema NOT documented)
- Cursor: cursor.com/docs/context/skills; Copilot: docs.github.com about-agent-skills; Windsurf: page redirects to docs.devin.ai (no Cascade info); Pi: badlogic/pi-mono skills.md; Kilo: kilo.ai/docs/customize/skills (.kilo, not .kilocode); Cline: docs.cline.bot/customization/skills; Roo: roocodeinc.github.io/Roo-Code/features/skills; opencode: opencode.ai/docs/skills
- Skills CLI: vercel-labs/skills docs/agents.md and docs/commands.md (repo pushed 2026-11-17)

## Validation
- All 8 JSON manifests parse (node JSON.parse): ok.
- `claude plugin validate .` -> Validation passed (advice only: README lacks marketplace install line). `claude plugin validate .claude-plugin/marketplace.json` -> passed.
- Scratch CLAUDE_CONFIG_DIR: `claude plugin marketplace add <repo dir>` + `claude plugin install lazy-vibers-recipe@lazy-vibers-recipe` -> v0.9.0, status enabled (scratch dir deleted).
- Scratch CODEX_HOME (codex-cli 0.163.0): `codex plugin marketplace add <repo dir>` + `marketplace list` -> ok. Plugin install/skill load not exercised.
- `npx -y skills add <repo dir> --list` -> all 7 lvr-* skills discovered. `--skill '*' -a claude-code --copy -y` in a throwaway dir with throwaway HOME -> 7 skills copied under .claude/skills/, each with SKILL.md + references/. Temp dir deleted. Nothing installed globally.
- No gemini, qwen, kimi, agy, pi CLIs locally: their manifests were checked against docs only, not load-tested.

## Remaining unverified
- `npx skills add sayyidmibrahiim/lazy-vibers-recipe` and every owner/repo/git-URL form (repo not public; ticket 25).
- Codex .agents/plugins/marketplace.json url source resolves only after publish; `codex plugin add` syntax not in official page.
- Antigravity root plugin.json schema; Windsurf paths (official page gone); Pi install command and `.pi/skills`; Qwen skills dirs and uninstall; ZCode.
- Gemini extension skills pickup is inferred from docs (skills/ dir), not load-tested.
- Cursor `.cursor-plugin/marketplace.json` not shipped (outside ticket scope).
- Ticket 18 CI load-check ("manifest load-checks in CI") not added: no CI exists in the repo and scripts/ is off limits; suggested job: `claude plugin validate .` + node JSON parse + `npx skills add . --list` expecting 7.
