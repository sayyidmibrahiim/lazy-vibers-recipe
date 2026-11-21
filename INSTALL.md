# Install: Lazy Vibers Recipe (LVR)

Seven skills (`lvr-init-new-idea`, `lvr-continue`, `lvr-handoff`, `lvr-recheck-plan`, `lvr-add-feature`, `lvr-build`, `lvr-personal-brand`). The only real copy lives in `skills/<name>/`; every manifest in this repo points at that folder. There are no symlinks in the repo.

Repo: `sayyidmibrahiim/lazy-vibers-recipe` (version 0.9.0, pre-release). Verification dates below are 2026-11-19.

> `~` means your home folder. On Windows it is `%USERPROFILE%` (for example `C:\Users\you`). Skill paths are written with `/`; Windows accepts them in the shells below, or use `\`.
> Installed skills never write outside the project folder they run in (they create `.lvr/` there).

## Quickest path (any harness): `npx skills add`

Needs Node 22.20 or later.

```bash
npx skills add sayyidmibrahiim/lazy-vibers-recipe            # project scope, pick agents interactively
npx skills add sayyidmibrahiim/lazy-vibers-recipe -g         # global scope
npx skills add sayyidmibrahiim/lazy-vibers-recipe --skill '*' -a claude-code -a codex --copy -y   # non-interactive
npx skills add sayyidmibrahiim/lazy-vibers-recipe --list     # list only
```

Use `--copy` on Windows or any filesystem without symlink support (the default is a symlink to a canonical copy under `.agents/skills`). Local checkout: `npx skills add ./path/to/clone --copy`.
Source: https://github.com/vercel-labs/skills (`docs/commands.md`, `docs/agents.md`), checked 2026-11-19.

## Harness table

| Harness | Install | Project skills path | Global skills path | Status |
|---|---|---|---|---|
| Claude Code | plugin marketplace | `.claude/skills/` | `~/.claude/skills/` | verified |
| Codex CLI | plugin marketplace | `.agents/skills/` | `~/.agents/skills/` | verified |
| Gemini CLI | extension or `gemini skills install` | `.gemini/skills/` or `.agents/skills/` | `~/.gemini/skills/` or `~/.agents/skills/` | verified |
| Antigravity (`agy`) | `agy plugin install` | `.agents/skills/` | `~/.gemini/config/skills/` | paths verified, root `plugin.json` schema unverified |
| opencode | `npx skills` or manual | `.opencode/skills/`, `.agents/skills/`, `.claude/skills/` | `~/.config/opencode/skills/`, `~/.agents/skills/`, `~/.claude/skills/` | verified |
| Cursor | `npx skills` or manual | `.agents/skills/`, `.cursor/skills/` | `~/.agents/skills/`, `~/.cursor/skills/` | verified |
| GitHub Copilot | `npx skills`, `gh skill`, or manual | `.github/skills/`, `.claude/skills/`, `.agents/skills/` | `~/.copilot/skills/`, `~/.agents/skills/` | verified |
| Windsurf | `npx skills` or manual | `.windsurf/skills/` | `~/.codeium/windsurf/skills/` | unverified (official page moved; see below) |
| Cline | `npx skills` or manual | `.cline/skills/` (also `.claude/skills/`) | `~/.cline/skills/` | verified |
| Roo Code | `npx skills` or manual | `.roo/skills/`, `.agents/skills/` | `~/.roo/skills/`, `~/.agents/skills/` | verified |
| Kilo Code | `npx skills` or manual | `.kilo/skills/`, `.agents/skills/` | `~/.kilo/skills/`, `~/.agents/skills/` | verified |
| Qwen Code | extension or `npx skills` | `.qwen/skills/` | `~/.qwen/skills/` | extension verified; skills dirs per skills CLI table |
| Kimi Code CLI | `/plugins install` in the TUI | `.kimi-code/skills/`, `.agents/skills/` | `~/.kimi-code/skills/`, `~/.agents/skills/` | verified |
| Pi | `npx skills` or manual | `.agents/skills/` | `~/.agents/skills/` | partly verified; `pi install` syntax unverified |
| ZCode | manual or `npx skills` | `.zcode/skills/` | `~/.zcode/skills/` | per skills CLI table only |

On Windows the global paths resolve under `%USERPROFILE%` (for example `%USERPROFILE%\.claude\skills\`). Linux and macOS use the same `~/...` paths. Exceptions where the docs name a different base: Kilo documents Windows as `\Users\<you>\.kilo\skills\`; Cline documents `C:\Users\<you>\.cline\skills\`; both equal `%USERPROFILE%`.

## Manual copy (any harness)

Copy whole skill folders, never just `SKILL.md`:

```bash
# Linux / macOS, project scope into .agents/skills (shared by Codex, Gemini, Copilot, Cursor, Kilo, Roo, Pi, Kimi, opencode)
mkdir -p .agents/skills && cp -r skills/lvr-* .agents/skills/
```

```powershell
# Windows PowerShell
New-Item -ItemType Directory -Force .agents\skills | Out-Null
Get-ChildItem skills -Directory -Filter 'lvr-*' | Copy-Item -Destination .agents\skills -Recurse -Force
```

The loose `skills/lvr-principles.md` and `skills/lvr-conventions.md` are repo source copies, already mirrored into each skill's `references/`; they are not installed.

## Per harness

### Claude Code

```bash
claude plugin marketplace add sayyidmibrahiim/lazy-vibers-recipe
claude plugin install lazy-vibers-recipe@lazy-vibers-recipe
claude plugin list          # expect: enabled
```

Skills appear as `/lazy-vibers-recipe:lvr-init-new-idea` and so on. Update: `claude plugin marketplace update lazy-vibers-recipe && claude plugin update lazy-vibers-recipe@lazy-vibers-recipe`. Remove: `claude plugin uninstall lazy-vibers-recipe`.
Manifests: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` (`source: "./"`, skills auto-discovered from `skills/`).
Manual alternative: copy to `.claude/skills/` or `~/.claude/skills/`.
Sources: https://code.claude.com/docs/en/plugins-reference , https://code.claude.com/docs/en/plugins/marketplace-reference (2026-11-19).

### Codex CLI

```bash
codex plugin marketplace add sayyidmibrahiim/lazy-vibers-recipe
```

Then enable the plugin from Codex's plugin directory (the docs describe marketplace add/list/upgrade/remove; the reference repo also documents `codex plugin add <plugin>@<marketplace>`, not confirmed in the official page). Invoke a skill explicitly with `$lvr-init-new-idea`.
Manifests: `.codex-plugin/plugin.json` (`"skills": "./skills/"`), `.agents/plugins/marketplace.json` (git `url` source, `ref: main`).
Manual alternative: copy to `.agents/skills/` (repo) or `~/.agents/skills/` (user).
Sources: https://learn.chatgpt.com/docs/build-skills , https://developers.openai.com/codex/plugins/build (2026-11-19).

### Gemini CLI

```bash
gemini extensions install https://github.com/sayyidmibrahiim/lazy-vibers-recipe
# or skills only:
gemini skills install https://github.com/sayyidmibrahiim/lazy-vibers-recipe --path skills --scope user
```

Manifest: `gemini-extension.json`. The official extension reference lists no `skills` key; extensions expose skills by having a `skills/<name>/SKILL.md` directory at the extension root, which this repo has. The extensions page also notes Gemini CLI is being replaced by Antigravity CLI (June 18, 2026), see below.
Manual alternative: `.gemini/skills/` or `.agents/skills/` (the `.agents` alias wins within a tier), `~/.gemini/skills/` or `~/.agents/skills/`.
Sources: https://geminicli.com/docs/extensions/reference/ , https://geminicli.com/docs/cli/skills/ (2026-11-19).

### Antigravity (`agy`)

```bash
agy plugin install https://github.com/sayyidmibrahiim/lazy-vibers-recipe
agy plugin list
```

Manifest: root `plugin.json` (name and description only, copied from the shape of the reference repo). The official skills page documents the install commands and where plugin skills load from (`~/.gemini/config/plugins/<plugin>/skills/`) but does not document the `plugin.json` schema: that file is **unverified (https://antigravity.google/docs/skills, 2026-11-19)**.
Manual alternative: `.agents/skills/` (project) or `~/.gemini/config/skills/` (global; works in App, CLI, IDE).

### Qwen Code

```bash
qwen extensions install https://github.com/sayyidmibrahiim/lazy-vibers-recipe
# project-only: add --scope project
```

Manifest: `qwen-extension.json` (`"skills": "skills"`); skills register as `lazy-vibers-recipe:<skill>`.
Manual alternative: `.qwen/skills/`, `~/.qwen/skills/` (paths from the skills CLI table; not re-checked on a Qwen page).
Source: https://qwenlm.github.io/qwen-code-docs/en/users/extension/introduction/ (2026-11-19).

### Kimi Code CLI

Inside the TUI:

```
/plugins install https://github.com/sayyidmibrahiim/lazy-vibers-recipe
/reload
```

Manifest: `kimi.plugin.json` (`"skills": "./skills/"`). A local-directory install copies the folder into `$KIMI_CODE_HOME/plugins/managed/<id>/`, so reinstall after edits. There is no `kimi plugin install` shell command in the docs.
Manual alternative: `.kimi-code/skills/` or `.agents/skills/` (project root = nearest `.git`), `~/.kimi-code/skills/` or `~/.agents/skills/`.
Sources: https://moonshotai.github.io/kimi-code/en/customization/plugins , .../skills (2026-11-19).

### opencode

No manifest needed. `npx skills add ... -a opencode`, or copy into `.opencode/skills/` / `~/.config/opencode/skills/`. It also reads `.claude/skills`, `.agents/skills` and `~/.claude/skills`, `~/.agents/skills`.
Source: https://opencode.ai/docs/skills (2026-11-19). The page does not cover opencode plugin installation.

### Cursor

`npx skills add sayyidmibrahiim/lazy-vibers-recipe -a cursor`, or copy into `.agents/skills/` or `.cursor/skills/` (project) / `~/.agents/skills/` or `~/.cursor/skills/` (global). Cursor also reads `.claude/skills` and `.codex/skills`. Cursor's own GitHub import needs a `.cursor-plugin/marketplace.json`, which this repo does not ship.
Source: https://cursor.com/docs/context/skills (2026-11-19).

### GitHub Copilot

Skills load in the Copilot app, Copilot CLI, cloud agent, and agent mode in VS Code, Visual Studio and JetBrains (support varies by version). Use `npx skills ... -a github-copilot`, `gh skill` (see the "Adding agent skills" guide), or copy into `.github/skills/`, `.claude/skills/` or `.agents/skills/` (project) / `~/.copilot/skills/` or `~/.agents/skills/` (personal). Personal skills are not available to cloud sandboxes.
Source: https://docs.github.com/en/copilot/concepts/agents/about-agent-skills (2026-11-19).

### Windsurf

**Unverified (https://docs.windsurf.com/windsurf/cascade/skills now redirects to docs.devin.ai, which no longer describes Cascade skills, 2026-11-19).** The skills CLI table lists `.windsurf/skills/` and `~/.codeium/windsurf/skills/`, and the Devin docs confirm `.windsurf/skills/` is still read as a legacy location. Use `npx skills add ... -a windsurf` or copy to those paths, then confirm in Windsurf that the skills are listed.

### Cline

`npx skills ... -a cline` (writes `.agents/skills/` per the CLI table), or copy to `.cline/skills/` (recommended), `.clinerules/skills/` or `.claude/skills/` (project) / `~/.cline/skills/` (global; Windows `C:\Users\<you>\.cline\skills\`). If a global and a project skill share a name, the global one wins.
Source: https://docs.cline.bot/customization/skills (2026-11-19). Note: the skills CLI table lists Cline with `.agents/skills/`; the Cline page does not list that path, so prefer `.cline/skills/` for Cline.

### Roo Code

Copy to `.roo/skills/` or `.agents/skills/` (project) / `~/.roo/skills/` or `~/.agents/skills/` (global; Windows `%USERPROFILE%\.roo\skills\`). `.roo/` wins over `.agents/`; mode-specific variants use `skills-<mode>/`.
Source: https://roocodeinc.github.io/Roo-Code/features/skills (2026-11-19).

### Kilo Code

Copy to `.kilo/skills/` (project) / `~/.kilo/skills/` (global). `.agents/skills/` and `~/.agents/skills/` also load by default; `.claude/skills` loads only with Claude Code Compatibility enabled. The old `.kilocode` directory is not mentioned on the current page, so use `.kilo`. You can also add a directory under `skills.paths` in `~/.config/kilo/kilo.jsonc`.
Source: https://kilo.ai/docs/customize/skills (2026-11-19).

### Pi

Pi reads `.agents/skills/` (project, searched upward to the repo root) and `~/.agents/skills/` (global), and also user/project directories the page does not name. Copy there or use `npx skills ... -a pi`. Pi packages (npm or git) exist but **`pi install` syntax is unverified (https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/skills.md, 2026-11-19)**. Run `/reload` after changes. An earlier note listed `.pi/skills` and `~/.pi/agent/skills`; the current page does not confirm them.

### ZCode

Not re-checked on an official page; the skills CLI table gives `.zcode/skills/` and `~/.zcode/skills/`.

## Updating

Update all LVR skills together (re-run the install command for every skill, or `npx skills add` without `--skill`). The skills share one state file; a skill that is older than the project (`SCHEMA_TOO_NEW`) refuses to touch it and changes nothing. Projects made by an older LVR are migrated by the first updated skill that opens them; the old files are kept in `.lvr/migrations/`.

## Verify an install

Open the harness in an empty folder and run `/lvr-init-new-idea` (or `$lvr-init-new-idea` in Codex). It should run the Folder Gate and start S0 intake.

## Uninstall

Claude Code: `claude plugin uninstall lazy-vibers-recipe`. Codex: `codex plugin marketplace remove lazy-vibers-recipe`. Gemini: `gemini extensions uninstall lazy-vibers-recipe`. Qwen (`qwen extensions uninstall`) and Antigravity (`agy plugin uninstall`) follow the reference repo's docs and are unverified on official pages. Manual installs: delete the `lvr-*` folders from the paths above. Project data in `.lvr/` is yours and is never removed.

## Maintainer note

The `owner/repo` forms above can only be tested end to end once the repository is public (release ticket 25). Local-path forms (`claude plugin marketplace add <dir>`, `codex plugin marketplace add <dir>`, `npx skills add <dir>`) were validated before release.
