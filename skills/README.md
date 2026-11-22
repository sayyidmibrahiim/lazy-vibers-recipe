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
├── lvr-review-plan/          Critical plan review: 15 lenses, coverage matrix, score + verdict, findings ledger (formerly lvr-recheck-plan)
├── lvr-add-feature/          Post-lock feature mini-pipeline, impact matrix, append-only
├── lvr-build/                Milestone executor, exact verification capture, build log
├── lvr-personal-brand/       Gated brand kit (BRAND.md, LINKEDIN-PROFILE.md, CONTENT-PLAN.md)
├── lvr-principles.md         Canonical source copy of Constitution (NOT installed directly)
└── lvr-conventions.md        Canonical source copy of operational manual (NOT installed directly)
```

The loose `lvr-*.md` files at the top of `skills/` are the repo's canonical copies, mirrored verbatim into each skill's `references/`; `scripts/lvr.mjs` at the repo root is mirrored the same way into each skill's `scripts/`. Each `lvr-*/` directory is a self-contained skill with its own `SKILL.md`, `references/` and `scripts/` folder.

Keeping the copies in sync (maintainers): edit only the sources (`skills/lvr-conventions.md`, `skills/lvr-principles.md`, `skills/lvr-freshness.json`, `scripts/lvr.mjs`, and `docs/spec/08-review.md`, which ships only to `lvr-review-plan` as `references/contract.md`), then run `npm run sync:skills` to copy them into every skill and `npm run check:skills` to confirm (exit 0 = every copy is byte-identical; exit 1 names the drifted file). The sources themselves are hand-written snapshots of `docs/spec/` (the source of truth); that drift is a review item, not a byte check.

## Skills catalog

| Skill | Command | Phase | Description |
|---|---|---|---|
| **lvr-init-new-idea** | `/lvr-init-new-idea` | S0–S9 | Starts a new product from a raw idea, runs Folder Gate, boots boosters, conducts the interview. |
| **lvr-continue** | `/lvr-continue` | S0–S9 | Resumes an existing LVR run, repairs state from journal if needed, drives next step. |
| **lvr-handoff** | `/lvr-handoff` | Post-S9 | Validates 20 bundle files against gaps, emits `blueprint.json`, writes the `CLAUDE.md`/`GEMINI.md` stubs pointing at `AGENTS.md`, composes the builder entry prompt. |
| **lvr-review-plan** | `/lvr-review-plan` | Review | Reviews the finished plan through 15 lenses with quoted evidence, scores it 0–10 with an honest verdict, keeps a findings ledger across runs; read-only except `--apply` with approved fixes; `--scope-only` at the S7 lock. Formerly `/lvr-recheck-plan`. |
| **lvr-add-feature** | `/lvr-add-feature` | Extend | Mini-pipeline to capture, research, analyze impact, and append a post-lock feature. |
| **lvr-build** | `/lvr-build` | Build | Executes milestones in order, runs exact verification procedures, captures output in build log. |
| **lvr-personal-brand** | `/lvr-personal-brand` | Post-build | Generates a 3-file brand kit in `brand/`; machine-gated by verified milestones + live check. |

## Install (preferred): `npx skills add`

Per-harness commands and skill paths for every OS live in [INSTALL.md](../INSTALL.md); the summary below covers the common cases.

The [skills CLI](https://github.com/vercel-labs/skills) discovers skills at `skills/<name>/SKILL.md` in a repo — this repo already matches that layout, no flags or config needed:

```bash
npx skills add <owner>/lazy-vibers-recipe
```

- It walks the repo's `skills/` directories, finds every `lvr-<name>/SKILL.md`, and installs those skill folders (including their `references/`) into the coding agent(s) it detects — you pick the agent(s) interactively.
- Scope: installed into the current project by default; add `-g` to install globally (available in every project).
- To install one skill only or pick an agent explicitly: `npx skills add <owner>/lazy-vibers-recipe --skill lvr-init-new-idea -a claude-code`.
- It does not install the loose top-level `lvr-*.md` source copies and does not create `.lvr/` anywhere — project folders are created by the skill at runtime.

## Updating

**Renamed skill.** `lvr-recheck-plan` is now `lvr-review-plan` (`/lvr-review-plan`). No harness manifest supports a command alias, so the old command is gone. When you update a manual or `npx skills` install, delete the old `lvr-recheck-plan/` folder from your skills directory and install `lvr-review-plan/`. Old projects keep working: their `.lvr/recheck/` reports stay readable, and their `recheck_*` journal events still replay.

**Update all LVR skills together.** The skills share one project state file (`.lvr/state.json`, format version 2). A project made by a newer LVR is refused by an older skill with `SCHEMA_TOO_NEW` (nothing is changed, never downgraded), so a mix of old and new skills will stop working on projects the new ones touched. A project from an older LVR (or the pre-rename `.lvp/` folder) is migrated automatically the first time any updated skill opens it: the old files are kept in `.lvr/migrations/`, and an old `.lvp/` folder is only removed if you say yes.

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
    └── sections/ (question banks and guides for S1–S5, S7, S8; S6 and S9 run from SKILL.md)

lvr-review-plan/
├── SKILL.md
└── references/
    ├── principles.md
    ├── conventions.md
    ├── lenses.md        (the 15 lenses and their checks)
    ├── lenses.json      (the same checks, machine-readable, for `lvr review`)
    ├── scale.md         (severity lookup, lens score, overall score, verdict, uplift heuristic)
    ├── protocol.md      (run steps P0–P6, Run-N reconcile, --apply, --scope-only, hand procedures)
    └── contract.md      (work-file shapes, ids, ledger schema, `lvr review` commands and error codes)

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

Every skill also ships `scripts/lvr.mjs` (omitted above). Every skill references only paths inside its own folder (`references/…`, `scripts/…`) and, at runtime, the `.lvr/` directory and Blueprint Bundle of the target project. A few steps point at a sibling LVR skill (for example `/lvr-continue` hands interview Sections to `lvr-init-new-idea`); when that skill is not installed, the step says so and falls back loudly.

Install all seven skills into the same skills directory your harness actually scans. Some harnesses read only their own directory (Claude Code: `~/.claude/skills/` or `.claude/skills/`), others also read `~/.agents/skills/`; a skill copied or linked into a directory the harness does not scan is invisible to it. If you keep one copy in `~/.agents/skills/`, link each of the seven folders (not only some) into the harness directory, then check the harness's skill list. Smoke test: open the harness in an empty folder, run `/lvr-init-new-idea`, and confirm the skill runs the Folder Gate and starts S0 intake.

## Uninstall

Delete the skill folders from the harness's skills directory (the destinations in the table above). For a manual install, remove what you copied, e.g.:

```bash
rm -r ~/.claude/skills/lvr-*    # or .agents/skills/, .gemini/skills/, .zcode/skills/ …
```

For a `npx skills add` install, remove the same folder from the harness directory it reported, or use `npx skills list` in the project to see what was installed. Skills do not add config lines or hooks anywhere, so folder removal is the complete uninstall. Project folders created by the pipeline (`.lvr/`) are your data — the skills never remove them.

## License

LVR skill files in this repo are permissive (permissive-first policy, [ADR-0001](../docs/adr/0001-permissive-first-license-policy.md)): no non-commercial (NC) content is copied or derived into any skill file. NC-licensed Boosters the pipeline depends on are **runtime dependencies**: installed separately at runtime by the skill's booster bootstrap, credited, and never vendored into this repo, the skill folders, or any generated artifact. This repo is licensed [MIT](../LICENSE) — free to use, modify, and distribute with attribution.
