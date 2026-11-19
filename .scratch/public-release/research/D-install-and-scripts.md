# D — Cross-harness install + script offload (research, 2026-11-19)

Confidence tags: [V] verified from official/primary page fetched today; [R] reference repo (ihaveadhd) manifest read directly; [S] search snippets/third-party only, re-verify before publishing docs.

## 1. Matrix

| Harness | Install mechanism | Manifest(s) | Skills path (project / global; same on Win/mac/Linux, `~` = %USERPROFILE% on Windows) | Scripts? | Multi-skill bundle |
|---|---|---|---|---|---|
| Any (45-75 agents) | `npx skills add owner/repo [-g] [-a agent] [--skill x] [--copy]` (Node >= 22.20) | none; scans `skills/*/SKILL.md`; also reads `.claude-plugin/marketplace.json` [S] | writes canonical `.agents/skills/<name>` (project) and symlinks/copies into each agent dir [V partial] | yes (copies whole folder) | yes |
| Claude Code | `/plugin marketplace add owner/repo` then `/plugin install name@marketplace`; or manual copy | `.claude-plugin/plugin.json` + `.claude-plugin/marketplace.json` [R]; `skills/` at plugin root | `.claude/skills/` / `~/.claude/skills/`; plugin cache under `~/.claude/plugins` | yes (Bash tool; `${CLAUDE_PLUGIN_ROOT}` for hooks/MCP) | yes (one plugin, many skills) |
| Codex CLI | `$skill-installer`, or plugin marketplace (`codex plugin marketplace add`); manual copy | `.codex-plugin/plugin.json` (`"skills":"./skills/"`) + `.agents/plugins/marketplace.json` [R] | repo `.agents/skills` (scanned cwd up to root), user `~/.agents/skills`, admin `/etc/codex/skills`; symlinked folders followed [V] | yes, `scripts/` optional; sandbox may restrict | yes (plugins recommended for 2+ skills) [V] |
| Gemini CLI | `gemini skills install <git-url> --path skills`, `gemini skills link <dir>`, or extension `gemini extensions install <url>` | `gemini-extension.json` (+ `GEMINI.md` context) [R] | `.gemini/skills` or `.agents/skills` (alias wins) / `~/.gemini/skills`, `~/.agents/skills` [S] | yes | yes |
| opencode | manual copy / `npx skills`; plugin JS for commands | none required for skills; `.opencode/plugins`, `.opencode/command` [R] | `.opencode/skills`, `~/.config/opencode/skills`; also reads `.claude/skills`, `.agents/skills` [V-ish, opencode.ai/docs/skills] | yes (bash tool) | yes |
| Cursor | manual copy / `npx skills` | none (`.cursor/skills` [R]) | `.cursor/skills` / `~/.cursor/skills` [S] | yes (terminal tool) | yes |
| GitHub Copilot (VS Code, CLI, agent) | manual copy / `npx skills` | none | `.github/skills` (also `.claude/skills`, `.agents/skills` per recent docs [S]) / `~/.copilot/skills` [S] | yes | yes |
| Windsurf | manual / npx skills | none | `.windsurf/skills` / `~/.codeium/windsurf/skills` [S] | yes | yes |
| Cline | manual / npx skills | none | `.cline/skills` / `~/.cline/skills` [S] | yes | yes |
| Roo Code | manual / npx skills | none | `.roo/skills` / `~/.roo/skills` [S] | yes | yes |
| Kilo Code | manual / npx skills | none | `.kilo/skills` (+ `.agents/skills`) / `~/.kilo/skills`, `~/.agents/skills` (older: `.kilocode`) [S, kilo.ai/docs] | yes | yes |
| Qwen Code | `qwen extensions install <url>` | `qwen-extension.json` (`"skills":"skills"`) [R] | `.qwen/skills` / `~/.qwen/skills` [S] | yes | yes |
| Kimi CLI | plugin install | `kimi.plugin.json` (`"skills":"./skills/"`) [R]; skills dir `.agents/skills`, `~/.config/agents/skills` [S] | as left | yes | yes |
| Pi | manual / npx skills | none | `.pi/skills` / `~/.pi/agent/skills` [S] | yes | yes |
| Antigravity (agy) | `agy plugin install <git-url>` | root `plugin.json` [R] | via plugin | yes | yes |
| ZCode (existing README) | manual | none | `.zcode/skills` / `~/.zcode/skills` | yes | yes |

Sources: https://cdn.jsdelivr.net/gh/vercel-labs/skills@main/README.md (2026-11-19), https://learn.chatgpt.com/docs/build-skills.md (Codex, fetched 2026-11-19), https://opencode.ai/docs/skills, https://geminicli.com/docs/cli/skills/, https://code.claude.com/docs/en/plugin-marketplaces.md, https://kilo.ai/docs/customize/skills, https://mintlify.com/vercel-labs/skills/guides/supported-agents (agent paths table; page returned 410 on fetch, snippets only), reference repo manifests (local clone). Vercel docs per-agent table lives in `docs/agents.md` of vercel-labs/skills: pull it before writing final per-agent paths.

Key convergence: `.agents/skills/` is the de-facto shared project path (Codex, Gemini, opencode, Copilot, Kilo, Kimi, vercel CLI canonical). Claude Code is the main holdout (`.claude/skills`), Cursor/Windsurf/Cline/Roo/Qwen/Pi have own dirs.

## 2. Recommended repo layout (one repo, all harnesses)

```
skills/                      # THE single source: real files, no symlinks
  lvp-*/SKILL.md, references/, scripts/ (see s3/s4)
  lvp-principles.md, lvp-conventions.md  # keep; mirrored into references/
scripts/lvr.mjs              # shared CLI (see below)
.claude-plugin/plugin.json + marketplace.json   (source "./")
.codex-plugin/plugin.json                       ("skills":"./skills/")
.agents/plugins/marketplace.json                (Codex marketplace)
gemini-extension.json (+ GEMINI.md short context file)
qwen-extension.json   ("skills":"skills")
kimi.plugin.json      ("skills":"./skills/")
plugin.json           (Antigravity, optional)
INSTALL.md            (per-harness collapsible, copy ihaveadhd style)
package.json          (optional: bin for `npx lazy-vibers-recipe`; see below)
```
- Do NOT add per-harness skill copies (`.cursor/skills`, `.opencode`) in the repo; the reference repo's copies are for dogfooding. `npx skills add` and manual `cp -r skills/lvp-* <dest>` cover Cursor/Windsurf/Cline/Roo/Kilo/Pi/Copilot/opencode.
- Skills dir must be at `skills/<name>/SKILL.md` for npx skills, Claude plugin, Codex, Gemini `--path skills`, Qwen, Kimi: one location serves all.
- Symlinks: git on Windows only creates real symlinks with Developer Mode/admin + `core.symlinks=true`; otherwise checkouts get text files containing the target path, silently breaking skills. `npx skills add` defaults to symlinking from `.agents/skills`; on Windows it falls back to copy [S]; document `--copy`. Keep repo free of symlinks; cross-skill shared files (principles, conventions, scripts) are duplicated by a `npm run sync` (or `node scripts/sync-refs.mjs --check` in CI) step, matching current mirror rule.
- Scripts duplication problem: each skill must be self-contained after install (installers copy only that folder). Therefore put the CLI at `skills/<each>/scripts/lvr.mjs` generated from one source `scripts/lvr.mjs` by the sync step (+ CI check for drift). SKILL.md invokes it by path relative to the skill dir (`node "<skill-dir>/scripts/lvr.mjs" ...`); the skill states how to resolve `<skill-dir>` (harness gives the base dir at load; else search known dirs). Claude Code exposes `${CLAUDE_SKILL_DIR}`/`${CLAUDE_PLUGIN_ROOT}` [S], not portable, so do not depend on it.
- Frontmatter: keep `name` (== folder) and `description` only; avoid Claude-only keys. Add `agents/openai.yaml` is optional for Codex.

## 3. Script runtime recommendation

| Option | Win | mac | Linux | Notes |
|---|---|---|---|---|
| Node `.mjs`, zero deps | present if user runs npx-based installs, Codex (npm), Gemini CLI (npm), opencode (often npm/bun), Qwen, Kimi? (Python/uv), Claude Code native installer ships NO node | usually via nvm/brew | usually | `node:fs`, `node:crypto`, `JSON` built in; `node >=18` suffices; identical behavior across OS; one file |
| Python 3 | not preinstalled (Store stub), py launcher sometimes | python3 stub needs Xcode CLT | usually | version/PATH name (`python` vs `python3` vs `py`) chaos |
| bash + PowerShell | PS yes, bash no (Git Bash only) | bash 3.2 old, zsh | yes | two codebases, JSON handling painful, quoting bugs; double maintenance |

Recommendation: **Node >= 18 `.mjs`, zero dependencies, single file per skill (`lvr.mjs`), UTF-8, LF, only `node:` builtins, paths via `path`, no shell-outs, JSON-in/JSON-out on stdout, exit code 0/1/2.** Reasons: npx is already the primary install path (skills CLI needs Node 22.20 itself); Codex, Gemini, Qwen, opencode, Pi, Cline/Roo/Kilo (VS Code/Electron) ecosystems are Node-centric; JSON/NDJSON is the native data format. Gaps: Claude Code native install and Kimi (Python) users may lack Node, so each SKILL.md gets a 3-line preflight: `node -v`; if missing, fall back to the documented manual procedure in `references/` (keep the current prose steps as the degraded path, labelled "fallback if no Node"). Sandboxed harnesses (Codex workspace-write, Claude Code sandbox): script only touches `PROJECT_DIR/.lvp/` and cwd, no network, no spawn, so it fits inside default write sandboxes; never write outside project. Never require `npm install`. No dependency on a package registry at runtime (supply-chain + offline friendly).

## 4. Deterministic steps to script (CLI: `node scripts/lvr.mjs <group> <cmd> [flags]`, all output JSON on stdout, `--dir <PROJECT_DIR>` default cwd)

| # | Step (source) | CLI | Inputs | Outputs | Saving |
|---|---|---|---|---|---|
| 1 | Folder Gate checks 1-5 (init Step 1) | `gate check [--idea-slug s]` | cwd listing, junk-file ignore list, marker list (.git, package.json, Cargo.toml, pubspec.yaml, pyproject.toml, go.mod, .solution, *.csproj), projects-root scan ignoring node_modules/.venv/dist/build/target | `{verdict: refuse_existing_lvp\|refuse_damaged\|pass_empty\|refuse_project\|need_subfolder\|ask_loose, markers[], examples[], last_activity, name, section}` | med (kills many tool calls + reading) |
| 2 | Slug derivation + free-name pick (`slug`, `-2` suffix) | `slug make --text "..." [--taken-in .]` | idea text / words | `{slug, display, free_slug}`; transliteration of non-Latin stays with the model (script validates `^[a-z0-9]+(-[a-z0-9]+){1,3}$`, dedupes) so `slug validate` | low |
| 3 | Journal init + append with seq, ISO ts, atomic append | `journal append --type T --payload '{...}'` (payload via stdin for long text) ; `journal init --skill s` | type validated against the 50-event list (conventions §3); last seq read from file tail | `{seq, ts}`; fixes seq races/gaps; rejects unknown type | **high** (every checkpoint, dozens of times per run) |
| 4 | Checkpoint = journal append + state patch together | `checkpoint --type T --payload '{}' --patch '[{"op":"set","path":"pipeline.sections.S1.status","value":"in_progress"}]'` | event + JSON-pointer-style patch ops | writes journal line, then state.json via temp file + rename; returns new seq | **high** |
| 5 | state.json read/validate/write against schema v1 (conventions §2) | `state validate`, `state get <path>`, `state set <path> <json>`, `state init --slug --tier ...` | state.json | `{ok, errors[]}`; enum checks (status, tier, booster status, D-NNN format, section order) | high |
| 6 | Record answer (answer_recorded + state answers + decision append) | `answer record --section S1 --id S1.q3 --q "..." --a "..." [--skipped]` ; `decision add --id D-004 --status user_confirmed --summary ... --section S1` | text from model | auto-numbers next `D-NNN`/`q` id; journal + state in one atomic checkpoint; returns ids | **high** (largest per-turn saver: no hand-edited JSON) |
| 7 | Capability probe grading (init Step 2, continue Step 3) | `probe grade --step json\|order\|sentence --reply-file f` (sentence needs model/human judgement; script grades first two only) | model reply | `{pass, reason}`; `probe prompts` prints the exact 3 prompts | low-med (tiny, but removes grading ambiguity; T1 skips anyway) |
| 8 | Booster presence check (init Step 3) | `booster check [--all\|--name x]` | scans known skill dirs per OS: `.claude/skills`, `.agents/skills`, `.cursor`, `.gemini`, `.opencode`, `.qwen`, `~/.config/opencode`, etc. + MCP config files for Playwright/Firecrawl (read-only, key presence only, never print values) | `{boosters:[{name,present,where,loadable:"unknown"}]}` + auto journal `booster_check` ×9 (`--journal`) | **high** (9-iteration loop collapses to one call) |
| 9 | Journal replay rebuild (continue 2b) | `state rebuild [--write]` | journal.ndjson, S0/S8 records, DECISIONS.md/records for decisions | rebuilt state + report JSON (counts, derived-indirectly list, untranslatable seqs, unrecoverable answers); backs up corrupt file as `state.corrupt-<date>.json` | **high** (largest single table in continue; pure function) |
| 10 | Healthy-state consistency repair (continue 2a) | `state repair` | state + records + journal | fixes `current_section` rule, folds answers from records, scope-lock derive | med |
| 11 | Scope-lock / status derive | `state scope` | journal + S7 | `{locked, evidence_seq}` | low (used by handoff, continue, build, brand, add-feature) |
| 12 | Progress summary data (continue Step 4) | `status summary` | state + journal tail | JSON: sections done compact range, answers N/M skipped, open loop-backs, boosters degraded list, last activity; model only translates/phrases | med |
| 13 | Bundle presence + 0-byte check (conventions §8 list, 20 files) | `bundle check` | file tree | `{missing[], empty[], present[]}` | med |
| 14 | Gap lint groups A-H (handoff, `lint-checklist.md`) | `lint run [--group A..H] [--journal]` | bundle files, state, journal | findings `[{id, group, file, message, owner}]`; A presence, B headings-in-order per template, C decisions mirror (D-NNN in state vs DECISIONS.md), D milestones machine checks, E cost presence/consistency, F SCOPE.md vs state, G stubs + AGENTS.md coverage, H blueprint.json vs state; semantic checks marked `needs_model:true` | **high** (handoff is nearly all lint; 140-line checklist executed literally) |
| 15 | Recheck audit mechanical groups (R1-R6 subset: heading/ref/ID consistency, dated claims regex, blueprint drift) | `lint audit --groups R1,R3` | bundle | findings; semantic items flagged for model | med-high |
| 16 | blueprint.json emission + drift compare ignoring `generated_at` | `blueprint emit [--check]` | state + bundle (stack, features in_mvp, decisions_count, milestones acceptance_count, costs, capabilities) | writes only on drift; `{changed:bool}` | **high** (template derive; error-prone by hand) |
| 17 | Harness stubs | `handoff stubs` | none | writes CLAUDE.md/GEMINI.md exact one-liner if missing/wrong; verifies AGENTS.md has 4 required parts (heading + file-map entries for every bundle file) | med |
| 18 | HANDOFF-PROMPT.md write | `handoff prompt` | fixed template + slug | deterministic file (spec says content is deterministic) + kickoff command table by harness | med-high (pure boilerplate) |
| 19 | Booster install lines from CAPABILITIES.md | `handoff install-lines` | CAPABILITIES.md rows | printable lines with name+license, NC flagged | low-med |
| 20 | Section Record skeleton + S0 record | `record new --section S1 --name context` | state answers/decisions | writes shared markdown skeleton prefilled with answers rows (EN summary left as `<EN: >` for model) ; `record check` verifies exit-criteria rows ticked with evidence ids | med-high |
| 21 | Cross-check lint (S2 hard rule platform vs fees, S6 conflicts: answers contradicting each other e.g. auth none vs S4 feature needing login) | `xcheck run` | state answers + keyword tables | candidate conflicts list (model confirms) | low-med (heuristic; keep advisory) |
| 22 | Milestone/F-NN id allocation, MILESTONES.md parse, VERIFICATION.md append-only entries (build, add-feature) | `milestone next`, `milestone record --id M2 --result pass --output-file f` (sets state verified + journal `milestone_verified`), `feature next-id` | MILESTONES.md, state | next unverified milestone + its procedure text; append block in fixed template | med-high (build loop) |
| 23 | Brand gate (brand Step 1): all milestones verified, deployment live, URL fetch 2xx + product-name substring | `brand gate --fact "Product Name"` | state; HTTP GET via `fetch` (Node 18+ builtin) | `{pass, unmet[]}` (only network call in the tool; opt-in flag `--live`) | med |
| 24 | Link check in brand kit / bundle (relative links resolve) | `links check` | markdown | broken list | low-med |
| 25 | Context-guard / tier tables (batch size by tier, reload set) | `tier info --tier T2` | tier | `{batch:2, reload:[...]}` | low (but removes conventions §7 read) |
| 26 | Price-fact staleness (S2 fact sheet dated 2026-11-08) | `facts age --file` | date | days old, must-reverify | low |
| 27 | Refs sync / drift (maintainer) | `node scripts/sync-refs.mjs [--check]` | `skills/lvp-*.md`, docs/spec | copies to each skill `references/` and `scripts/lvr.mjs` | maintainer CI only |

Not scriptable (leave to model): interviewing, translating, EN summaries, research, semantic checks, decisions rationale, sentence-continuation probe.

Highest ROI first cut (ship v1 with these 8): 3/4 (journal+checkpoint), 5 (state validate), 6 (answer+decision), 9 (rebuild), 1 (gate), 8 (booster check), 14+16+17+18 (lint, blueprint, stubs, prompt). Estimated: removes most hand-written JSON and the longest literal-procedure reads; SKILL.md text for those steps shrinks to "run X, act on JSON", cutting both per-turn tool-output tokens and skill-load tokens (init SKILL.md is 628 lines).

Design rules for the CLI: idempotent; never rewrite journal lines (append via `fs.appendFileSync` with `\n`, LF forced even on Windows); atomic state write (tmp + rename; on Windows rename over existing works via `fs.renameSync`); refuses paths outside `--dir`; `--help` per command; error JSON `{ok:false, code, message}` with plain English message the model translates; `--version` printed and checked against SKILL.md `lvr-schema` constant so skill/script mismatch is detected. Add `node:test` tests in repo CI on ubuntu/macos/windows matrix.

## 5. Open items to verify before publishing
- Vercel `docs/agents.md` exact table (Kimi, Pi, Qwen, Cline ids) and Windows symlink fallback behavior.
- Claude Code docs: exact skill-dir variable names, `strict:false` marketplace entries.
- Cursor and Copilot official skill docs (only third-party confirmation found); Kilo `.kilo` vs `.kilocode`.
- Codex `codex plugin marketplace add` flow vs `$skill-installer`.
