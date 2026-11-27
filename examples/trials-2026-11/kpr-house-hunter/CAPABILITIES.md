# Capabilities

Agent skills that help a builder with this stack (Python 3.14 per S5.q3, Django 6.1.3 [cite: version · https://docs.djangoproject.com/en/stable/ref/settings/ · n.d. · acc 2026-11-27 · primary · live], SQLite, server-rendered HTML). None is a runtime dependency of the app.

| Name | Kind | License | Install | Notes |
|---|---|---|---|---|
| planning-and-task-breakdown | skill | MIT | `npx skills add addyosmani/agent-skills --skill planning-and-task-breakdown` | split each milestone into tasks before coding |
| database-schema-designer | skill | MIT | `npx skills add onewave-ai/claude-skills --skill database-schema-designer` | review models, indexes and migrations against SPEC/data-model.md |
| threat-modeling | skill | MIT | `npx skills add briiirussell/cybersecurity-skills --skill threat-modeling` | re-check SECURITY.md when a route or input is added |
| ux-copy | skill | Apache-2.0 | `npx skills add anthropics/knowledge-work-plugins --skill ux-copy` | Indonesian messages for new states |
| user-stories | skill | MIT | `npx skills add phuryn/pm-skills --skill user-stories` | when /lvr-add-feature adds a feature |
| architecture-designer | skill | MIT | `npx skills add jeffallan/claude-skills --skill architecture-designer` | only if the app is ever shared beyond the laptop |
| ponytail | skill | MIT | `npx skills add DietrichGebert/ponytail` | keep code minimal (CODE_STYLE.md simplicity rules) |
| anti-slop | skill | MIT | `npx skills add elithrar/dotfiles --skill anti-slop` | edit docs and copy |

No item is non-commercial (NC); nothing here is vendored into the app.
