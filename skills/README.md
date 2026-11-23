# Lazy Vibers Recipe skills

Recipe interviews you about a product idea, checks the facts behind the plan, and writes a blueprint with scope, milestones and ways to verify the result. Each product has its own project folder. The skill stores the interview and journal in `.lvr/` so another session can continue from disk.

## Install

Use a local checkout on Linux, macOS or Windows. Run one of these commands from the project where you want the skills available. On the first run, select your coding tool from the installer's list.

```bash
# Linux or macOS
npx skills@1.9.0 add /path/to/lazy-vibers-recipe --copy
```

```powershell
# Windows PowerShell
npx.cmd skills@1.9.0 add 'C:\path\to\lazy-vibers-recipe' --copy
```

Add `--agent codex` or another installer-supported name to select a tool directly. For a manual install, copy the seven skill folders into the directory your tool reads. Each copy includes `SKILL.md`, `references/` and `scripts/`. The helper uses Node.js 22 or newer. Native plugin and extension commands, verification status and tool-specific exceptions are listed in [INSTALL.md](../INSTALL.md).

| Coding tool | Common project directory for manual copies |
| --- | --- |
| Claude Code | `.claude/skills/` |
| Codex CLI, Antigravity, Pi | `.agents/skills/` |
| Gemini CLI | `.gemini/skills/` or `.agents/skills/` |
| OpenCode | `.opencode/skills/` or `.agents/skills/` |
| Cursor | `.cursor/skills/` or `.agents/skills/` |
| GitHub Copilot | `.github/skills/` or `.agents/skills/` |
| Windsurf | `.windsurf/skills/` |
| Cline | `.cline/skills/` |
| Roo Code | `.roo/skills/` or `.agents/skills/` |
| Kilo Code | `.kilo/skills/` or `.agents/skills/` |
| Qwen Code | `.qwen/skills/` |
| Kimi Code CLI | `.kimi-code/skills/` or `.agents/skills/` |
| ZCode | `.zcode/skills/` |

Global paths use `~` on Linux and macOS and `%USERPROFILE%` on Windows. Some tools use a different directory layout for global installs. Confirm the destination in [the per-tool guide](../INSTALL.md#harness-table).

Open your coding tool in an empty project folder and invoke `/lvr-init-new-idea`. Codex accepts `$lvr-init-new-idea`. Claude Code's plugin install uses `/lazy-vibers-recipe:lvr-init-new-idea`. The first step checks the folder and asks for your product idea.

## Choose a skill

| Skill | When to use it |
| --- | --- |
| `/lvr-init-new-idea` | Start a product, answer the planning questions, and generate its blueprint. |
| `/lvr-continue` | Resume a saved or interrupted project. It can rebuild damaged state from the journal. |
| `/lvr-review-plan` | Check a finished plan for gaps, record evidence and get a build verdict. The S7 scope review also uses this skill. |
| `/lvr-handoff` | Check the saved blueprint and prepare the entry prompt for the builder. |
| `/lvr-add-feature` | Capture, research and review changes to a previously locked plan. |
| `/lvr-build` | Build milestones in order and save the observed verification results. |
| `/lvr-personal-brand` | Draft a brand kit after every milestone and the product's release checks pass. |

A project can use more than one product type. Recipe ships profiles for web apps, mobile apps, browser extensions, command-line tools, MCP servers, n8n workflows, skills or plugins, agents, document-based answers (RAG), and games. The confirmed type adds its own questions, files and release check to the base blueprint. A web release is checked at its deployed address. A command-line release is installed in a clean environment and tested with `--help`.

## Research access

Planning and review need working web search and page fetch. Recipe checks both before continuing and records the dated sources it uses. If either tool is unavailable, the skill explains how to enable it. The project and its recorded answers are available for status and recovery. A failed query can be recorded when the tool ran and returned no usable source. [Research contract](../docs/spec/07-research.md)

## Extra tools and removal

| Booster tier | Use |
| --- | --- |
| Core | Checked when a new project starts. Includes the interview, planning and editing aids shared across products. |
| Conditional | Loaded when a confirmed product type, feature or platform needs it. |
| Reference | Read at its recorded source and version. |

Recipe stages missing installable boosters in the project as work reaches them. At handoff or the end of a chosen Recipe build, it lists the exact copies it installed and asks before removing them. A later feature, review or brand run can load missing aids and clean up its own copies. Existing skills and settings stay available. [Booster lifecycle](lvr-booster-lifecycle.md)

For the Recipe pack itself, use your tool's uninstall procedure or remove the exact seven skill folders you copied. `npx skills@1.9.0 list` shows installs in the current project. Keep the project folders and their `.lvr/` records. When updating a copied installation, update all seven together and remove the old copied `lvr-recheck-plan` folder if present. Its current command is `/lvr-review-plan`. [Install and uninstall by tool](../INSTALL.md#uninstall)

## Credits

The booster catalog records the upstream authors, pinned versions and licenses. Recipe is MIT licensed. [Booster credits](../CREDITS.md) · [MIT license](../LICENSE)

Maintainers can regenerate shipped copies with `npm run sync:skills` and verify them with `npm run check:skills`.
