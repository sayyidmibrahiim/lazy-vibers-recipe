# LVR Pipeline Skills

Installable agent skills for the **Lazy Vibers Recipe (LVR)** pipeline: a model-agnostic interview flow that turns a raw product idea from a non-technical owner into a verified Blueprint Bundle (spec, data model, milestones, costs) — through Sections S0–S9 with disk-based state, evidence-first research, and anti-yes-man questioning. Any harness that can read a `SKILL.md` can run it.

## The one-folder-one-product model

One project folder = one idea = one product. An installed LVR skill never writes outside the folder it was run in: it creates `.lvr/` (state, append-only journal, Section Records) inside the project folder and refuses to mix two ideas into one folder. Installing the skills does not touch your projects; it only teaches the agent the pipeline.

## Repo layout

```
skills/
├── lvr-init-new-idea/        S0 intake + interview loop (S1–S8) + S9 compiler
├── lvr-continue/             Resume parked/interrupted pipeline, journal replay
├── lvr-handoff/              Gap lint (20 files), blueprint.json, builder harness stubs
├── lvr-recheck-plan/         Adversarial audit (R1–R6), research refresh, fixes in place
├── lvr-add-feature/          Post-lock feature mini-pipeline, impact matrix, append-only
├── lvr-build/                Milestone executor, exact verification capture, build log
├── lvr-personal-brand/       Gated brand kit (BRAND.md, LINKEDIN-PROFILE.md, CONTENT-PLAN.md)
├── lvr-principles.md         Canonical source copy of Constitution (NOT installed directly)
└── lvr-conventions.md        Canonical source copy of operational manual (NOT installed directly)
```

The loose `lvr-*.md` files at the top of `skills/` are the repo's canonical copies, mirrored verbatim into each skill's `references/`. Each `lvr-*/` directory is a self-contained skill with its own `SKILL.md` and `references/` folder.

## Skills catalog

| Skill | Command | Phase | Description |
|---|---|---|---|
| **lvr-init-new-idea** | `/lvr-init-new-idea` | S0–S9 | Starts a new product from a raw idea, runs Folder Gate, boots boosters, conducts the interview. |
| **lvr-continue** | `/lvr-continue` | S0–S9 | Resumes an existing LVR run, repairs state from journal if needed, drives next step. |
| **lvr-handoff** | `/lvr-handoff` | Post-S9 | Validates 20 bundle files against gaps, emits `blueprint.json`, writes the `CLAUDE.md`/`GEMINI.md` stubs pointing at `AGENTS.md`, composes the builder entry prompt. |
| **lvr-recheck-plan** | `/lvr-recheck-plan` | Audit | Runs R1–R6 adversarial checklist, refreshes stale research live, applies confirmed fixes. |
| **lvr-add-feature** | `/lvr-add-feature` | Extend | Mini-pipeline to capture, research, analyze impact, and append a post-lock feature. |
| **lvr-build** | `/lvr-build` | Build | Executes milestones in order, runs exact verification procedures, captures output in build log. |
| **lvr-personal-brand** | `/lvr-personal-brand` | Post-build | Generates a 3-file brand kit in `brand/`; machine-gated by verified milestones + live check. |

## Install (preferred): `npx skills add`

The [skills CLI](https://github.com/vercel-labs/skills) discovers skills at `skills/<name>/SKILL.md` in a repo — this repo already matches that layout, no flags or config needed:

```bash
npx skills add <owner>/lazy-vibers-planner
```

- It walks the repo's `skills/` directories, finds every `lvr-<name>/SKILL.md`, and installs those skill folders (including their `references/`) into the coding agent(s) it detects — you pick the agent(s) interactively.
- Scope: installed into the current project by default; add `-g` to install globally (available in every project).
- To install one skill only or pick an agent explicitly: `npx skills add <owner>/lazy-vibers-planner --skill lvr-init-new-idea -a claude-code`.
- It does not install the loose top-level `lvr-*.md` source copies and does not create `.lvr/` anywhere — project folders are created by the skill at runtime.

## Manual install (any harness)

A skill is just a folder — copy it into the harness's skills directory. Copy the whole `lvr-init-new-idea/` folder (with `references/`), never just the `SKILL.md`:

```bash
cp -r skills/lvr-init-new-idea <destination>/
```

| Harness | Project scope | Global scope |
|---|---|---|
| ZCode | `.zcode/skills/` | `~/.zcode/skills/` |
| Claude Code | `.claude/skills/` | `~/.claude/skills/` |
| Codex | `.agents/skills/` | `~/.agents/skills/` |
| Gemini CLI | `.agents/skills/` (alias) or `.gemini/skills/` | `~/.agents/skills/` (alias) or `~/.gemini/skills/` |

Project scope = only inside that project (put the folder in the project repo); global scope = every session of that harness. Gemini CLI has no config line to set for skills — it discovers `SKILL.md` folders natively (its `.agents/skills/` alias takes precedence over `.gemini/skills/` within the same tier). The unrelated `contextFileName` setting in `.gemini/settings.json` only renames GEMINI.md context files, not skills. Codex reads the shared `.agents/skills/` location used by several harnesses, so one manual copy there can serve multiple tools.

## What a correct install looks like

Each installed skill folder is self-contained. For example:

```
lvr-init-new-idea/
├── SKILL.md
└── references/
    ├── principles.md
    ├── conventions.md
    ├── bundle/ (bundle file templates for S9)
    └── sections/ (S1–S8 question banks)

lvr-recheck-plan/
├── SKILL.md
└── references/
    ├── principles.md
    ├── conventions.md
    └── audit-checklist.md

lvr-add-feature/
├── SKILL.md
└── references/
    ├── principles.md
    ├── conventions.md
    └── feature-capture.md

lvr-build/
├── SKILL.md
└── references/
    ├── principles.md
    ├── conventions.md
    └── build-loop.md

lvr-personal-brand/
├── SKILL.md
└── references/
    ├── principles.md
    ├── conventions.md
    └── brand-templates.md
```

Every skill references only paths inside its own folder (`references/…`) and, at runtime, the `.lvr/` directory and Blueprint Bundle of the target project. Smoke test: open the harness in an empty folder, run `/lvr-init-new-idea`, and confirm the skill runs the Folder Gate and starts S0 intake.

## Uninstall

Delete the skill folders from the harness's skills directory (the destinations in the table above). For a manual install, remove what you copied, e.g.:

```bash
rm -r ~/.claude/skills/lvr-*    # or .agents/skills/, .gemini/skills/, .zcode/skills/ …
```

For a `npx skills add` install, remove the same folder from the harness directory it reported, or use `npx skills list` in the project to see what was installed. Skills do not add config lines or hooks anywhere, so folder removal is the complete uninstall. Project folders created by the pipeline (`.lvr/`) are your data — the skills never remove them.

## License

LVR skill files in this repo are permissive (permissive-first policy, [ADR-0001](../docs/adr/0001-permissive-first-license-policy.md)): no non-commercial (NC) content is copied or derived into any skill file. NC-licensed Boosters the pipeline depends on are **runtime dependencies**: installed separately at runtime by the skill's booster bootstrap, credited, and never vendored into this repo, the skill folders, or any generated artifact. This repo is licensed [MIT](../LICENSE) — free to use, modify, and distribute with attribution.
