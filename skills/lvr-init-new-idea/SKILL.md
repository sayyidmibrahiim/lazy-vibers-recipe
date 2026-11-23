---
name: lvr-init-new-idea
description: Opens a new LVR pipeline for a brand-new product idea — runs the Folder Gate, declares and probes the model tier, boots the core Boosters, and captures the idea in S0 intake. Use when the user wants to start a new product or idea from scratch; refuses to run in a folder that already holds a project and routes to /lvr-continue or /lvr-review-plan instead.
---

# lvr-init-new-idea

Opening skill of the LVR pipeline. It turns the user's target directory into an initialized LVR project — `.lvr/` created, S0 intake done, S1 ready to start — then hands control to the Section loop. It is self-contained: everything it needs lives in this skill folder.

## Load first

Before any check, question, or file write:

1. Read `references/principles.md` (the Constitution). All 14 principles bind this skill.
2. Read `references/conventions.md` (the operational manual). It owns the state schema, journal event list, Folder Gate details, and model-tier tables; the steps below reference it instead of repeating it.
3. Follow the conversation language and the before-write English document check in conventions §4.
4. **Script helper (preferred when Node is available).** This skill ships `scripts/lvr.mjs` (Node ≥22, nothing to install). `<skill-dir>` = the folder holding this SKILL.md (use the base directory the harness reports; otherwise look for `lvr-<this-skill>/scripts/lvr.mjs` in the skills directories listed in INSTALL.md). Once per session run `node "<skill-dir>/scripts/lvr.mjs" version`. If it prints JSON with `"lvr_schema":2`, run the `Script:` command given at each step below (`LVR` = `node "<skill-dir>/scripts/lvr.mjs" --dir "<PROJECT_DIR>"`) and act on its JSON. **Preflight (every skill except /lvr-init-new-idea):** run `LVR state migrate --check`. If `needed` and `blocked` is null, run `LVR state migrate` and tell the user in one plain line (English source): "This project was made with an older LVR version. I updated its bookkeeping files to the new format; the old files are kept in `.lvr/migrations/`." (If `copied_from` is `.lvp`, ask once whether to remove the old `.lvp/` folder, default keep; on yes run `LVR state migrate --remove-legacy`.) If `blocked` is set, /lvr-continue follows its recovery for `blocked.code`; every other skill stops and recommends /lvr-continue. If any command answers `SCHEMA_TOO_NEW` (exit 1), the project was made by a newer LVR: change nothing and tell the user to update all LVR skills together. **Session:** after the preflight (init: in its Step 1) append `session_start` with `{"skill":"<this skill>","harness":"<harness id>","session_id":"<id the harness exposes>" or null with "session_id_reason":"<why>","model":"<model id>","cwd":"<cwd>"}` — use the confirmed ID source in `references/harnesses.json` and never invent an id — and at every exit append `session_end` with `{"reason":"done|paused|context_guard|error|cancelled","note":"<why>"}` (`note` is required for `cancelled`, which is how a refusal is recorded; `error` is journaled only after an unrecoverable failure left work half-done, never for a refusal). If `node` is missing, the command cannot start, or `lvr_schema` differs, say once (English source): "Node.js is not available here, so I'll do the bookkeeping by hand." Then follow each step's prose — the prose is the fallback and stays authoritative for behavior. Never hand-edit `.lvr/` files to work around a script error (`"ok":false`): report its `code` plainly and stop that step. On any non-zero exit (`"ok":false`) stop the step, show the error and follow `error.details.hint`; exit code 3 means the event was journaled (`journaled_seq`) or blocked but `state.json` was NOT updated (`STATE_LAGS`, `STATE_MISSING`, `STATE_INVALID`, `STATE_SEQ_UNKNOWN`, `JOURNAL_BEHIND_STATE`): do not continue the interview, run `/lvr-continue` (its Step 2 maps each code to the exact command). Pass long text through `--in -` with a quoted heredoc (`<<'EOF'`) or a PowerShell here-string (`@'…'@ |`), never inline in double quotes.

## Flow at a glance

Run in this order:

1. **Folder Gate + web research check** — decide where the project folder is (refuse, proceed in place, or create a subfolder); then confirm web search and page fetch work, or stop before anything is written.
2. **Model tier + capability probe** — refuse early if this model cannot run the pipeline.
3. **Booster bootstrap** — core Boosters present, or their absence explicitly chosen by the user.
4. **S0 intake + Domain Brief** — idea verbatim, User Language, slug + display name, market; first `state.json`; then the researched brief of what the user doesn't know.
5. **Section loop (S1 onward)** — the generic engine below; every Section opens with its research scan.

The journal starts immediately after the gate selects the project folder and the web research check passes; the first `state.json` is written at the start of S0. The order is deliberate: the web check runs before anything is written (a harness without web research cannot run LVR, and a clean folder lets the user simply re-run), the probe runs before the booster bootstrap so an incapable model is refused before any install work, and booster statuses are known before S0 records them in state.

## Step 1 — Folder Gate

Mandatory first action. Run the checks in order; the first match wins. `PROJECT_DIR` is the folder the gate selects.

Script: `LVR gate check --dir "<cwd>" [--idea-slug s]` → act on `verdict`. For a Check 4/5 subfolder: `LVR gate subfolder --slug s` (picks the first free name and creates the folder; an existing empty folder of that name — left by a run that stopped at the web check — is reused, `reused: true`).

### Check 1 — does an LVR project already live here?

If `<cwd>/.lvr/state.json` exists → refuse. Also refuse if `.lvr/` exists with `journal.ndjson` but no readable `state.json` (a damaged prior run; `/lvr-continue` rebuilds state by journal replay).

- Read `state.json` for a plain summary (project name, current Section) and the journal's last line for the last activity timestamp.
- Say (English source): "This folder already holds an LVR project ('\<name\>', currently at Section \<S\>, last activity \<time\>). I won't start a new idea on top of it. Run `/lvr-continue` to resume it — it prints the full progress summary and offers the next step. To start a different idea, run `/lvr-init-new-idea` in an empty folder."
- If `state.json` exists but is unreadable, same refusal, adjusted: "This folder holds an LVR project whose state file is damaged. Run `/lvr-continue` — it rebuilds the state from the journal."
- Append `folder_gate_rejected` to the existing journal (continue its `seq` numbering). Stop the skill. Change nothing else.
  - Script: `LVR journal append --type folder_gate_rejected --payload '{"check":1}'`

### Check 2 — is the folder empty?

List `<cwd>`. Ignore exactly these OS junk files: `.DS_Store`, `Thumbs.db`, `desktop.ini`. If nothing else remains:

- Say: "This folder is empty — I'll set the new project up right here."
- `PROJECT_DIR` = cwd. Journal `folder_gate_passed`. Continue at Step 2.

### Check 3 — does an existing (non-LVR) project live here?

If the folder contains project markers and no `.lvr/` → refuse. Markers: `.git`, `package.json`, `Cargo.toml`, `pubspec.yaml`, `pyproject.toml`, `go.mod`, `.solution`, `*.csproj` — or any similar manifest or lockfile indicating an existing codebase.

- Say: "This folder looks like an existing project (found: \<markers\>). I won't start a new LVR idea inside it. Create or move to an empty folder and run `/lvr-init-new-idea` there. If what you want is a critical review of this project's existing plan, that's `/lvr-review-plan`."
- Nothing is written to disk (there is no LVR journal here to record the refusal). Stop the skill.

### Check 4 — is this a projects root?

If `<cwd>` itself has no markers but at least one direct subdirectory contains project markers (typical: `~/projects/`), the idea gets its own subfolder. When scanning subdirectories, ignore dependency and build outputs (`node_modules`, `.venv`, `dist`, `build`, `target`).

- Derive a provisional slug (rules in Step 4) from the idea text in the user's request. If no idea text is available yet, ask one quick question (English source): "In one short line — what are we building? Just enough to name the folder." Derive the slug from the answer.
- Say: "This looks like a projects root (found: \<example subdirectories\>). I'll create a new subfolder `\<slug\>/` for this idea and work there — OK?" Confirm, or take the user's alternative name.
- On confirm: create `./<slug>/` (an existing empty `<slug>/` is reused; if the name is taken by anything else, use the next free `<slug>-2` and say so); `PROJECT_DIR` = that folder.
- Journal `folder_gate_subfolder_created`. Continue at Step 2.

### Check 5 — loose files?

Non-empty, no markers, no `.lvr/` → ask (English source): "This folder has loose files (e.g. \<up to three names\>) but no project markers. Where should the new project live? 1. A new subfolder `\<slug\>/` here — recommended, keeps the idea self-contained. 2. Right here, next to the loose files." If no idea text exists yet, the `\<slug\>` placeholder has no source: ask the same quick question as Check 4 ("In one short line — what are we building?") and derive the slug from it.

- Choice 1 → confirm the slug, create the subfolder, `PROJECT_DIR` = it. Journal `folder_gate_subfolder_created`.
- Choice 2 → `PROJECT_DIR` = cwd. Journal `folder_gate_passed`.
- Continue at Step 2.

### After any passing check

1. **Web research check** (principle 14, conventions §7 and §10) — before anything is written. Run one real web search with a neutral query that is not about the user's idea (for example `Node.js release schedule`), then fetch result pages one at a time, up to 3 different results, and read their text. Pass: the search returned at least one result URL and at least one of those fetches returned readable page text. One page that refuses (403, 404, login wall, empty page) is not a failure — take the next result; only an error from the search, no result URL, or 3 failed fetches fail the check. Keep the query, the URL of the page you read, its title, and today's date for step 4.
   - Fail → say (English source): "I can't do web research in this session (\<cause: no web search tool | no page-fetch tool | the error text\>). LVR never plans from memory — every price, rule and recommendation must come from a current source — so I'm stopping before I write anything. To turn web research on: Claude Code — allow the WebSearch and WebFetch tools (on Amazon Bedrock web search is not available, so add a search MCP server). Codex CLI — set `web_search = "live"` in `~/.codex/config.toml`, or start it with `codex --search`. Gemini CLI — keep the google_web_search and web_fetch tools enabled in settings.json (on Antigravity CLI, check its web tools are on). OpenCode — allow web search when it asks and pick a provider (`/connect`). Any harness — add a web search + fetch MCP server such as Firecrawl, Brave Search or Exa, with its API key. Then run `/lvr-init-new-idea` again\<, inside `\<slug\>/` when the gate created that folder\>." Stop the skill. Write nothing (no `.lvr/`, no journal); a subfolder the gate just created stays empty, and the next run in the parent reuses that empty `<slug>/` instead of making `<slug>-2`.
2. Create `PROJECT_DIR/.lvr/`.
3. Start `PROJECT_DIR/.lvr/journal.ndjson`: line 1 `session_start` (payload: skill name + cwd), line 2 the gate event (`folder_gate_passed` or `folder_gate_subfolder_created`).
   - Script: `LVR journal append --dir "<PROJECT_DIR>" --type session_start --payload '{"skill":"lvr-init-new-idea","cwd":"<cwd>","session_id":null,"session_id_reason":"<why the harness exposes no id>"}'` (add `harness`, `model` and a real `session_id` when the harness exposes them; never invent one), then `--type folder_gate_passed` or `--type folder_gate_subfolder_created`. The first append creates `.lvr/` and the journal; `seq` and `ts` are assigned for you.
4. Journal the web research check: `research_logged` with `section` null, `purpose` "web_check", the query and `fetch <url>` as `queries`, the fetched page as the one source (`live` true), `outcome` "found".
   - Script: `LVR research log --in -` with `{"section":null,"purpose":"web_check","topic":"web research check","queries":["<query>","fetch <url>"],"sources":[{"url":"<url>","title":"<title>","accessed":"<YYYY-MM-DD>","primary":false,"live":true}],"outcome":"found"}`.
5. Journal lines: `{"ts": <ISO-8601 UTC>, "seq": <n>, "type": "...", "payload": { ... }}`; `seq` starts at 1 and increments per line; payloads are free-form objects carrying the ids named in each step below. Append every later event; never rewrite.

## Step 2 — Model tier + capability probe

### Declare the tier

- Read the tier from harness config where available; otherwise ask (English source): "How big is the model running this harness? 1. Large — frontier or 1M-class API (Gemini, GPT-6 family, Claude 5.x, DeepSeek V4). 2. Medium — open-weight mid (Qwen3.5, Llama 4, Gemma 3 27B). 3. Small — compact or local (Mistral Small, small Gemma/Qwen)."
- Map the answer to `T1 | T2 | T3` → `model_profile.tier`. Journal `tier_declared` (payload: tier).
  - Script: `LVR journal append --type tier_declared --payload '{"tier":"T2"}'`

### Capability probe (mandatory for T2 and T3, skipped for T1)

Script: `LVR probe prompts` prints the three prompts; `LVR probe grade --step json --in -` and `--step order --in -` grade the raw reply (stdin) — `"pass"` is true/false; `--step sentence` only runs mechanical checks (`"graded":false`), so you judge the meaning. Then `LVR journal append --type capability_probe_passed --payload '{"steps":["json","order","sentence"]}'` or `--type capability_probe_failed --payload '{"step":"<step>"}'`.

- T1 → set `model_profile.probe` = "skipped"; no probe events; continue at Step 3.
- T2/T3 → run all three probes now, before any further work. Prefer a fresh no-context model call (subagent) for an honest result; otherwise run each as a clean single attempt in this session and grade strictly:

  1. **Strict JSON** — Prompt: `Return exactly this JSON object, nothing else, with ANSWER replaced by the value of 7×6: {"probe":"json","answer":ANSWER}`. Pass: the reply parses as exactly that object (surrounding whitespace tolerated; no prose, no code fences) with `answer` = 42.
  2. **Three-step order** — Prompt: `Do these steps in order and output only their results, one per line: 1. write the word ALPHA. 2. write the number 2. 3. write GAMMA backwards.` Pass: the reply contains ALPHA, 2, AGMA — in that order.
  3. **Sentence continuation** — Prompt: `Continue this sentence so it makes sense, and write only the continuation: "The cashier scanned the item twice because"`. Pass: a coherent, grammatical completion of that sentence (no restart, no topic change, no gibberish).

- All pass → journal `capability_probe_passed`; `model_profile.probe` = "passed". Continue at Step 3.
- Any fail → journal `capability_probe_failed` (payload: which step). Say (English source): "This model failed the capability probe (\<step\>), so it cannot run the LVR pipeline reliably. Switch this harness to a larger model, then run `/lvr-init-new-idea` again. Nothing has been captured yet, so nothing is lost." Stop the skill. Never push on with a model that cannot follow the pipeline's rules.

## Step 3 — Booster bootstrap

Goal: every core Booster installed, or its absence explicitly chosen by the user. Never silent — quality is never silently degraded.

### Core boosters

| Core booster | Pinned source in `references/boosters.json` | License | Used at |
|---|---|---|---|
| pm-skills interview patterns | `product-on-purpose/pm-skills` | Apache-2.0 | S1, S4, S5, S7, S9 |
| grilling | `mattpocock/skills` | MIT | S0–S4 |
| planning-and-task-breakdown | `addyosmani/agent-skills` | MIT | S8 |
| ponytail | `DietrichGebert/ponytail` | MIT | S9, S10 |
| anti-slop | `elithrar/dotfiles` | MIT | S9 |
| SimpleEnglish (document-rule subset) | `AminBlg/SimpleEnglish` | MIT | S9 |

Read `references/boosters.json` for each booster's commit, selected skill names, and supported harnesses. Use `LVR booster plan --section S9 --harness codex` for an example of the section plan. Each command uses a local checkout of the listed repository at the exact recorded commit. Substitute that checkout for `./<pinned-checkout>` and run from the project root. The command installs only the specified skills into the selected harness's project-local skill locations. A file found on disk still needs a loadability check in that harness.

A **conditional** booster applies when its section and product conditions match. Unknown conditions stay pending. A **reference** entry names material to consult and credit. It has no install command. Web access remains a required capability from Step 1.

### Procedure

Script: `LVR booster check --journal` checks every core booster in the registry and journals one `booster_check` each. If it returns `"code":"REGISTRY_MISSING"`, check the six names by hand. Recover the pinned registry from the same release before installing any missing skill. Journal each result with `LVR journal append --type booster_check --payload '{"name":"<name>","repo":"<repo>","result":"present"}'` (same for `booster_install_ok|failed`, `booster_choice`).

Run this loop once per core booster, in the table order above, then move to the next booster:

1. **Presence check** — the harness's skill/plugin list, or its known skills directories (e.g. `~/.claude/skills/`, `<cwd>/.claude/skills/`, `~/.agents/skills/`). Journal `booster_check` for this booster (payload: name, result `present|missing`). Presence maps to status `installed` only if the skill is actually loadable in this harness (listed/importable); present-but-unloadable → status `degraded` with a note (degraded surfacing rules apply).
2. For a missing skill, follow [the project-local staging procedure](references/booster-lifecycle.md). It records newly deployed copies with `booster_installed`. Confirm the skill loads before marking the check complete. On failure, journal `booster_install_failed` and offer the choice below.
3. **Interactive failure choice** — core boosters are output-quality dependencies, so failure is never silent. Say (English source): "Core booster '\<name\>' could not be installed (\<reason\>). Output quality depends on it. Choose: 1. Help me install it fully — I'll walk through this harness's install steps with you. 2. Continue degraded — output quality drops; the project is marked 'degraded' in state, journal, and the final OVERVIEW. 3. Stop here — nothing is lost; you can resume later with /lvr-continue."

   Journal `booster_choice` (payload: booster, choice) and set the status:
   - Choice 1 → work through the real install steps with the user; success → status `installed` (+ journal `booster_install_ok`); still failing → present the choice again.
   - Choice 2 → status `degraded`; carry a note that S9 must surface it in OVERVIEW.md. Next booster.
   - Choice 3 → status `failed`; say: "Stopping here. Nothing is lost — run `/lvr-continue` once the booster situation is sorted." Stop the skill.
4. After the last booster: hold all statuses in memory; Step 4 writes them into `state.json`.

## Step 4 — S0 intake

Purpose: capture the raw idea fully; detect User Language; propose slug + display name; confirm the market. No structured questions in S0 — those start at S1. When S0 closes, the Domain Brief is built before S1 starts (step 8).

**Booster** — load grilling for targeted clarifying questions after the user gives their idea. The free-form opening and the short follow-up limit still apply.

1. **Open the Section**: journal `section_start` (payload: section "S0"). Write the first `PROJECT_DIR/.lvr/state.json`, shape per conventions §2, with:
   - `schema_version`: 2 (the v2 keys — `project.error` null, `product` unasked, empty `pipeline.research`, `boosters.installed` `[]`, `framework_decision` null, `release_check` `{}`, `review` null, `agents_delegated` `[]`, `sessions` with this run's session — take their defaults from the journal-built state; conventions §2)
   - `project`: slug = the confirmed or provisional slug ("" if none yet), name "", idea_raw "" (filled in step 3), user_language "" (filled in step 4), created_at = the `section_start` S0 timestamp (ISO-8601 UTC), status "interview"
   - `pipeline`: current_section "S0", sections `{ "S0": { "status": "in_progress", "started_at": <now> } }`, loop_backs `[]`
   - `decisions`: `[]`
   - `boosters`: core = the six entries above with their Step-3 statuses (`installed | missing | failed | degraded`), enhancer `[]`
   - `model_profile`: `{ "tier": <T1|T2|T3>, "probe": "passed"|"skipped", "declared_at": <the tier_declared journal timestamp> }`
   - `milestones`: `[]`, `deployment`: null, `handoff`: null

   This state write plus the `section_start` journal line form one checkpoint.
   - Script: `LVR journal append --type section_start --payload '{"section":"S0"}'` — this creates `state.json` from the journal (tier, probe and booster statuses folded in); the field list above is what it produces.
2. **Capture the idea** — say (English source): "Tell me everything in your head about this idea — what it is, who it's for, why you want it. Multi-paragraph is welcome; don't organize it, just pour it out." Ask clarifying mini-questions ONLY if the idea is under ~2 sentences (one short round: who is it for, where should it run), then move on. The mini-round questions and answers are folded verbatim into the captured idea stored as `S0.q1` (they are part of the intake) and noted in the S0 record.
3. **Record it**: store the idea verbatim (User Language, unedited) as answer `S0.q1` under `pipeline.sections.S0.answers` — `{ "q": <the capture prompt>, "a": <verbatim idea>, "skipped": false }`. Journal `answer_recorded` + state write. One checkpoint.
   - Script: `LVR answer record --section S0 --in -` with `{"q":"<capture prompt>","a":"<verbatim idea>","project":{"idea_raw":"<verbatim idea>"}}`.
4. **User Language**: resolve the conversation language using conventions §4. Confirm the detected language when the user has not specified one. Record the confirmation as `S0.q2`; journal `answer_recorded`; set `project.user_language` (user-correctable — a correction replaces the detection). Checkpoint.
   - Script: `LVR answer record --section S0 --in -` with `{"q":"<question>","a":"<reply>","project":{"user_language":"<code>"}}`.
5. **Slug + display name**: propose a kebab-case slug and a Title Case display name. Slug rules: lowercase letters, digits, hyphens; 2–4 words from the idea's core noun phrase (the base slug — a `-2` suffix the Folder Gate adds for a taken folder name does not count); transliterate non-Latin scripts into English words (e.g. "aplikasi kasir warung" → `warung-cashier` / "Warung Cashier"). Say: "Working name: \*\*\<Name\>\*\* (slug: `\<slug\>`). Keep it, or rename?" If the gate already created a subfolder and the user changes the slug, rename that subfolder (it contains only `.lvr/` at this point). Record as `S0.q3`; journal `answer_recorded`; set `project.slug` and `project.name`. Checkpoint.
   - Script: `LVR slug make --text "<english words>"` / `LVR slug validate --slug <slug>` before proposing; on confirmation `LVR answer record --section S0 --in -` with `{"q":"<question>","a":"<reply>","project":{"slug":"<slug>","name":"<Name>"}}`.
5b. **Market**: infer the country where the product will be used from the idea text (and the language as a weak hint). Say (English source): "I'll research the rules and costs for \<country\> — is that where people will use it? If it's more than one country, name the main one." Record the reply as the next S0 answer (`S0.q4` unless clarifying replies took earlier ids); journal `answer_recorded`. Checkpoint. The Domain Brief researches this market.
   - Script: `LVR answer record --section S0 --in -` with `{"q":"<question>","a":"<reply>"}`.
6. **Write the Section Record** `PROJECT_DIR/.lvr/docs/sections/S0-intake.md` (create the folders):

   ```markdown
   # S0 — Intake

   <!-- lvr:english-summary -->

   ## Idea summary

   <2–4 English sentences summarizing the original idea in S0.q1>

   ## Metadata

   - User Language: <code> (detected, confirmed by user)
   - Slug: `<slug>` · Display name: <name>
   - Market: <country> (<S0 answer id>)

   ## Decisions this Section

   None (metadata confirmations only).
   ```

7. **Close the Section**: update state — `sections.S0` = `{ "status": "done", "record": "S0-intake.md", "started_at": ..., "completed_at": ..., "answers": { ... } }`; `current_section` = "S1". Journal `section_done`. One checkpoint.
   - Script: `LVR journal append --type section_done --payload '{"section":"S0","record":"S0-intake.md"}'`
8. **Domain Brief** (principle 14) — research what a person in the user's position usually does not know about this idea in this market: rules and regulations, typical and hidden costs, common failure modes, key terms, what similar users expect. Procedure, search lists, and the file template: `references/sections/S0-domain-brief.md` §1. Write `PROJECT_DIR/.lvr/docs/research/domain-brief.md`, appending one heading per research step (T2: one step per sub-query; T3: one step per turn), 8–15 items, each with a `U-NN` id, a cite group (conventions §10), and a target Section. Journal each step as `context_research` (scope `brief`). Show nothing to the user yet: each item is presented in its target Section (engine step 1b). Close when all five headings are filled and `cite check` on the brief is clean.
   - Script: per step `LVR research log --context --in -` with `{"section":"S0","scope":"brief","topic":"<heading>","queries":["…"],"sources":[…],"outcome":"found","findings":["U-01","U-02"]}`; at the end `LVR cite check --file .lvr/docs/research/domain-brief.md` until `clean` is true.
9. Continue immediately into the Section loop (S1) unless the user pauses.

## Section loop engine (S1 onward)

Generic procedure for every Section. Per-Section procedures for S0–S9 live in this file (index below). When S0 closes, continue straight into S1 unless the user pauses. Before opening a section, run the section's booster plan and follow [the project-local staging procedure](references/booster-lifecycle.md) for any applicable missing conditional skills. In a resumed section, check its current skills before continuing the recorded step.

1. **Start** — journal `section_start` (payload: the Section id); set `sections.<S>` = `{ "status": "in_progress", "started_at": <now> }`; `current_section` = \<S\>. Checkpoint (journal + state).
   - Script: `LVR journal append --type section_start --payload '{"section":"<S>"}'`
1b. **Context research** (principle 14) — once per Section, before its first batch (a loop-back into the Section does not repeat it). Do these in order; do not show or ask anything before step 4:
   1. **Brief freshness gate (S1–S5)** — run `LVR cite check --file .lvr/docs/research/domain-brief.md`. For every finding of id I6, I7, I8 or I10 whose `owner` is this Section and whose brief row still has an empty `Became`: research that item again now (`LVR research log --context`, `scope` "scan", `findings` = that U-id, `note` "refresh"), replace its Source cell with the new cite group, and run the check again. Repeat until the check shows no such finding for this Section's items. An item whose new research fails (search and fetch worked, nothing usable) gets an `[unverified: <category> · RQ-NNN]` marker and will be a question, never a decision. (S6–S8 do this with `LVR cite check --all`, researching every expired fact and every record that repeats it.)
   2. **Scan** (`references/sections/S0-domain-brief.md` §2) — S1–S4 at least one targeted search for the Section's topic in the user's market; S5 the research itself; S6–S8 searches as needed after the re-check. Append new items to the brief and journal the scan as `context_research` (scope `scan`).
   3. **Tool outage rule (conventions §10)** — a search or fetch tool error in steps 1–2 is not failed research: say the error, give the enable steps, journal one `web_check` event with `outcome` "failed", and stop; never write a marker or carry on for it. `failed` and markers are only for research that ran and found nothing usable.
   4. **Present** — show the open items targeted at this Section as "Things you may not know" (§3 of that file: User Language, each with "(source, date)") and turn each into a question (it counts toward the batch size) or a `designer_filled` decision whose rationale cites the item and its tag — an item whose source is an `[unverified: …]` marker is always a question. Record the `Became` cell, and one `## Context research` line in the Section Record (S6 has no record of its own: its line goes under `## Risks (S6)` in `S5-research.md`).
   - Script: `LVR research log --context --in -` with `{"section":"<S>","scope":"scan","topic":"…","queries":["…"],"sources":[…],"outcome":"found","findings":["U-11"]}` (`"findings":[]` plus `"note"` when nothing is new).
2. **Load** — follow the tier's reload discipline (conventions §7): T1/T2 load this Section's procedure block and its Boosters at Section start; T3 loads, every turn, only principles + `state.json` + this Section's procedure block + the current record — never the transcript.
   - Use [the section map](references/booster-map.md). After a skill or reference actually informs the work, journal `LVR journal append --type booster_loaded --payload '{"section":"<S>","name":"<name>","usage":"start|pass|reference"}'`, setting one usage value. This also applies to the S0 clarifiers. Record a fallback in the Section Record whenever an applicable install was unavailable.
   - Run `LVR profile plan` after the product choice. Add that Section's profile questions and exit checks to the base bank. Apply the same question cap. Use profile suggestions for the relevant planning aids and specialist roles. Keep those additions inactive until the choice is confirmed.
2b. **Coverage and adaptive depth** — follow [the evidence and pacing guide](references/sections/adaptive-interview.md). Save each exit fact and link prior answers or decisions. Confirm supported prior facts in one batch. Ask only targeted follow-ups on missing facts, with explicit choices where the procedure requires them. Checkpoint evidence using `coverage` on each relevant event. Use `LVR interview progress --section <S> --in -` and show the known/total count in User Language. While a fact lacks evidence, it stays open or becomes a visibly recorded permitted assumption.
3. **Micro-batch loop** — batch size by tier: T1 up to 3, T2 up to 2, T3 exactly 1 (conventions §7). Phrase every question in User Language, plain and outcome-oriented, with a one-line reason it matters; choose the next batch from the previous answers. After EVERY answer: journal `answer_recorded` (payload `{ "section", "answer_id", "q", "a", "skipped" }` — `q` as asked, `a` verbatim, both User Language; `a` null for skipped) + state write (`sections.<S>.answers["<S>.qNN"] = { "q", "a", "skipped" }`, `q` stored as asked in User Language) — one checkpoint per answer. Bank question numbers are a suggested pool order; the authoritative id is `S<N>.qNN`, assigned at ask time within the Section. Keep both controls visible with every batch: **skip** (recorded with `"skipped": true`; never blocks) and **that's enough for this Section** in the conversation language (jumps straight to the exit-criteria check). A deferral ("later") is not a skip: the question stays open and may be re-asked in a targeted batch. Only an explicit skip — or leaving it unanswered at the exit check, which fires the `assumed` fallback — records `skipped: true`. Never re-ask a recorded answer — check `answers` before composing each batch.
   - Script: after every answer `LVR answer record --section <S> --in -` with `{"q":"<as asked>","a":"<verbatim>"}` (add `"skipped":true` for a skip; the id `<S>.q<n>` is assigned for you). Answers can never be silently overwritten (`ANSWER_EXISTS`).
4. **Decisions** — any decision surfaced in the Section goes into `decisions[]` (`D-NNN`, status `user_confirmed | assumed | designer_filled` per principle 12) at the checkpoint where it is made; `assumed` and `designer_filled` also land in ASSUMPTIONS.md at S9. Status follows who decided: an explicit user choice made in conversation is `user_confirmed` even if the topic was designer-surfaced; `designer_filled` is only for decisions the user never made themselves. A decision that rests on a fact cites it in its rationale (a `U-NN` item or a cite tag, conventions §10); one that rests on an unverified fact is never `designer_filled` — ask the user, or it becomes an S6 blocking risk (principle 1).
   - Script: put `"decisions":[{"section":"<S>","summary":"…","rationale":"…","status":"user_confirmed"}]` in the same `answer record` input (ids `D-NNN` are assigned), or use `LVR decision record --event <carrier-event> --payload '{…}' --decision '{…}'` at the checkpoint where it is made.
5. **Exit-criteria check** — when the questions are done or the user says enough, verify every exit criterion this Section's procedure lists. Unmet → say specifically what is missing (plain language) and run one more targeted batch. If the user still wants to move on with criteria unmet, mark the Section `blocked`, record the unmet criteria in its record, and stop before the next Section — never silently advance past unmet exit criteria. Journal `section_blocked` (payload: the Section id + the unmet criteria) as part of that checkpoint. Unblock path: when the user later supplies what was missing, re-run the exit-criteria check; on pass the Section closes normally (`section_done`, its record updated with the resolved criteria). Blocked sections resume like in-progress ones via /lvr-continue.
   - Script: `LVR journal append --type section_blocked --payload '{"section":"<S>","unmet":["…"]}'`
   - Check progress against the saved fact list. Each completed claim has eligible recorded evidence. An assumption must be allowed by this Section and named with its decision ID.
6. **Done** — write the Section Record `PROJECT_DIR/.lvr/docs/sections/<S>-<name>.md`: English question and answer summaries keyed by the original `S<n>.q<n>` IDs, the Section's decision summary, and the exit-criteria results. Update state (`status` "done", `record`, `completed_at`, `current_section` = next Section (after S9 it stays S9)). Journal `section_done`. One checkpoint.
   - Script: `LVR journal append --type section_done --payload '{"section":"<S>","record":"<S>-<name>.md"}'`
   - After S7 closes, freeze the chosen profile files with `LVR profile plan --write`. The command records the planned additions once. Keep that list through S9 and show any profile packs it could not find.
7. **Next** — continue with the next Section's procedure block. After S9 closes, suggest `/lvr-handoff`. S10 Build is not an interview Section: the bundle must suffice for any builder without this skill, and the optional `/lvr-build` tracks its progress in `project.status`.

### Section procedures index

| Section | Procedure | Purpose (one line) |
|---|---|---|
| S0 Intake | In this file (Step 4) | Capture the raw idea fully; detect User Language; propose slug + name |
| S1 Context | In this file (`### S1 — Context`) | Problem, target users, platform shape, what "working" means for the user |
| S2 Conditions | In this file (`### S2 — Conditions`) | What the user already has and can pay: devices, accounts, hosting, budget ceiling |
| S3 Data & privacy | In this file (`### S3 — Data & privacy`) | Login, personal data, payments, third-party services, where data may legally live |
| S4 Features | In this file (`### S4 — Features`) | Feature expectations in detail, iteratively until the user says "enough" |
| S5 Deep research | In this file (`### S5 — Deep research`) | Competitor scan, stack candidates with reasons, cost table, regional availability |
| S6 Feasibility Loop | In this file (`### S6 — Feasibility loop`) | Confront research findings with answers; open conflicts, risks, cost surprises |
| S7 Scope lock | In this file (`### S7 — Scope lock`) | Freeze the MVP: every feature → in-MVP or Parking Lot (recorded, never deleted) |
| S8 Milestone plan | In this file (`### S8 — Milestone plan`) | Break the MVP into M0…Mn, each independently verifiable |
| S9 Compile | In this file (`### S9 — Compile`) | Compile Section Records + decisions + milestones into the Blueprint Bundle |

## Section procedures (S1–S9)

Each block below is one Section's procedure for the engine above; the block plus its referenced bank file is the Section's procedure load (engine step 2). Records use the engine's step-6 shape; decisions follow engine step 4; the controls and checkpoint rules live in the engine and conventions — referenced, not repeated.

### S1 — Context

Purpose: problem, target users, platform shape, what "working" means for the user. Record: `S1-context.md`. The English text here and in the bank is the source; questions are spoken in User Language at runtime (conventions §4).

**Booster** — load grilling at start for ready interview decisions. Apply `define-problem-statement` and `mom-test` when shaping the problem and grounded follow-ups. Use `define-jtbd-canvas` as a reference. Keep the internal question bank for degraded mode.

**Storage trigger** — record `product.flags.stores_data` on the evidence-bearing S3 answer for any product type. When the answer is unclear, ask which information must survive between uses. When true, use [the data module](references/bundle/data-module.md) within the existing batch limit and carry its evidence to S6.

**Question strategy** — establish in this order, each batch composed from the previous answers (bank: `references/sections/S1-context.md`):

1. The problem, in the user's own words — one concrete moment, not a category.
2. Who exactly has it — a named kind of person, never "everyone".
3. Platform shape — website, phone app, or both (drives the S2 fee surface).
4. What "working" means — the change the user wants to see in six months.
5. Gap-fillers for whatever the opening answers left open: the workaround today, who it is not for, rough scale, screen language, other approvals, the day-one task.

**First question** — ask what kind of product the owner wants and show the plausible choices in User Language. Use `LVR profile list` for the shipped profiles. Accept several types, for example web and mobile. If the owner says they are unsure, ask what people will do, what it produces, where it runs, and what it connects to. Continue the base questions until the context supports a recommendation. Explain the recommendation from recorded answers and ask the owner to confirm it. A preview with `LVR profile plan --types <id,id>` leaves the choice open.

Record a direct choice on the answer with `"product":{"types":["web"],"source":"user"}`. Record a recommendation with `"product":{"types":["web"],"source":"ai_recommended","status":"pending","rationale":"<recorded reasons>"}`. On a clear yes, carry `"product":{"status":"decided","source":"ai_recommended","confirmed":true}` on the confirmation answer. Record an explicit alternative as a direct choice. Do not close S1 while the recommendation is awaiting confirmation.

Then use bank questions 1, 2 and 4 within the tier's batch limit and continue in the strategy order. When the platform evidence establishes whether people use a visual interface, carry `product.flags.has_ui` on that answer. Use the confirmed evidence for the UI booster plan and resolve any mismatch with a profile default.

**Decision surfaces**:

- Platform shape → `D-NNN user_confirmed`; skipped → `assumed` (propose browser-first for a phone-form idea; state the proposal when recording).
- Target users → `user_confirmed`; skipped → `assumed` (the user's own circle).
- Success picture → `user_confirmed`; skipped → `assumed` ("it removes the manual steps of the stated problem").
- Owner vs customer views, and the installable-browser alternative to a store app → `designer_filled` — a non-technical user does not think in roles and cannot know a website can install to the home screen; record proactively, show visibly for correction.

**Exit criteria** (engine step 5; cite the satisfying answer id or decision id):

- [ ] Problem recorded in the user's own words (not skipped).
- [ ] At least one named target-user group recorded.
- [ ] Platform shape chosen: web / phone / desktop / a combination.
- [ ] Success picture recorded.

**Section Record** — `PROJECT_DIR/.lvr/docs/sections/S1-context.md` (this skeleton is shared by S1–S4; later Sections only add their specific rows):

```markdown
# S1 — Context

<!-- lvr:english-summary -->

## Answers
- **<S1.qNN> <English question summary>** — <English answer summary>

## Decisions this Section
- **<D-NNN>** <summary> — <rationale> · status: <user_confirmed | assumed | designer_filled>

## Exit criteria
- [<x>] <criterion> — evidence: <answer id or decision id>

## Booster
<pm-skills: installed | degraded — internal bank used>

## Context research
<scan RQ id> · items shown: <U-ids> · became: <answer ids, decision ids>
```

### S2 — Conditions

Purpose: what the user already has and can pay — devices, accounts, hosting, budget ceiling. Record: `S2-kondisi.md` (historical filename, conventions §5). English is the source; questions are spoken in User Language at runtime.

**Booster** — load grilling for unresolved budget, device and deployment choices. Use the internal cost leads, then verify the actual prices live. Bank: `references/sections/S2-conditions.md`.

**Price verification (principle 1)** — the bank's fact-sheet is a lead list last read 2026-11-08, older than the 30-day `price` limit. Before quoting ANY price to the user: read it live from the source, quote it with its cite tag (conventions §10), and log the step (`LVR research log`, `purpose: "claim"`). Research that really fails → log it as failed, quote the number with `[unverified: price · RQ-NNN]`, say so plainly, and treat it as a question for the user — never the basis of a `designer_filled` decision. Never quote from memory.

**Question strategy** — establish in this order: devices in hand; what the user already pays for; the monthly budget ceiling; then route by the S1 platform shape (store in play → store fees and accounts; website → domain; hands-on plausible → willingness to run commands); close with admin email, paying from the user's country, data-location preference, and weekly maintenance time.

**First batch** — bank questions 1 → 2 → 3 (devices, existing payments, ceiling), trimmed to the tier limit (conventions §7).

**Usage and costs** — reuse the volume in S1 or ask for a normal and a busy month within the batch limit. Keep units and sources. Apply the [usage-cost check](references/bundle/plan-quality.md#s2-and-s5--costs-at-different-usage-levels) and carry the figures to S5.

**Hard rule (conventions §5)** — before closing S2, cross-check the S1 platform shape against the fact-sheet: any paid account the chosen platform needs and the user lacks (e.g. iOS → Apple Developer USD 99/yr) is surfaced NOW with the verified price and a proceed/defer choice — never deferred to S5.

**Decision surfaces**:

- Budget ceiling → `D-NNN user_confirmed`; skipped → `assumed` (ceiling 0; record what that rules out).
- Deploy target → `user_confirmed`; skipped → `assumed` (free-tier hosting).
- Store-account proceed/defer → `user_confirmed` (proceed) or `assumed` (defer — S5 must not drop it).
- Custom domain vs free subdomain, the backup duty, and the maintenance/who-updates reality → `designer_filled` — a non-technical user cannot know domains renew yearly until they lapse, that backups never happen by accident, or that rented hosting goes dark when payment stops; record proactively, show visibly for correction.

**Exit criteria** (engine step 5; cite the satisfying answer id or decision id):

- [ ] Budget ceiling recorded (a number, or an explicit "nothing").
- [ ] Deployment surface and devices/accounts list recorded.
- [ ] Typical and busy-month activity recorded with units and evidence, or remaining unknowns identified.
- [ ] Every paid account the platform needs surfaced with a verified price and a recorded proceed/defer answer.

**Section Record** — `S2-kondisi.md` on the shared S1 skeleton, plus a `## Prices quoted` table (`| Item | Price quoted | Type | Source |`): one row per price shown to the user, its Source cell a cite group or an `[unverified: price · RQ-NNN]` marker. S5, S9 and the bundle copy these tags; `cite check` checks them.

### S3 — Data & privacy

Purpose: login, personal data, payments, third-party services, where data may legally live. Record: `S3-data.md`. English is the source; questions are spoken in User Language at runtime.

**Booster** — load grilling for ready data and privacy decisions. Consult the sourced Domain Brief. Bank: `references/sections/S3-data-privacy.md`.

**Question strategy** — establish in this order: login yes/no (the biggest fork); if login, reuse-existing-account vs new username+password; the personal-data inventory; which of it is sensitive; money inside the app; then third-party connections, where data may legally live, offline behavior, erasure, who sees whose data, and what must survive a loss.

**First batch** — bank questions 1 → 3 → 5 (login, data inventory, money) — the three exit-criteria questions; trim to the tier limit (conventions §7).

**Abuse and access** — follow the [S3 checklist](references/bundle/plan-quality.md#s3--abuse-and-access). Record `product.flags.public_form` from the answer about accountless submissions. Plan and apply `threat-modeling` when applicable, with the internal checklist as fallback. Record rate-limit and CAPTCHA decisions for each public form, including recovery and a verification check.

**Decision surfaces**:

- Auth (login yes/no, and method when yes) → `D-NNN user_confirmed`; skipped → `assumed` (no login — S6 will confront this with research if S4 contradicts it).
- Personal data kept and payments in-app → `user_confirmed`; skipped → `assumed` (empty inventory / no payments), recorded plainly so S6 can confront it.
- Password-reset mail sender (when login exists) → `designer_filled` — nobody asks what happens after "forgot password".
- Offline-first local storage (when the user wants offline) → `designer_filled` — the user cannot enumerate caching, sync, or conflict choices; record them proactively, show visibly for correction.
- Privacy-policy page at launch (any login, any personal data, any store presence) → `designer_filled` — app-store review rejects without one; never a question, always a recorded decision.
- Account/data deletion path → `designer_filled` (erasure is a duty, not a feature request).
- The privacy-policy, deletion, and any other legal decision cites the Domain Brief or scan item behind it (`per U-NN` + its tag); with no cited rule for the user's market, research it now (`LVR research log`) or ask — never a legal claim from memory.

**Exit criteria** (engine step 5; cite the satisfying answer id or decision id):

- [ ] Data inventory recorded (or explicitly empty).
- [ ] Auth yes/no recorded (and method when yes).
- [ ] Payments yes/no recorded.
- [ ] The privacy-policy decision recorded when any of its triggers holds.
- [ ] Abuse outcomes, controls and verification recorded. Public forms include rate-limit and CAPTCHA decisions.

**Section Record** — `S3-data.md` on the shared S1 skeleton, plus `## Abuse and access` with form evidence, risk scenarios, controls and decision IDs.

### S4 — Features

Purpose: feature expectations captured in detail, iteratively, until the user says enough. Record: `S4-fitur.md`. English is the source; questions are spoken in User Language at runtime.

**Booster** — load grilling at the start of the capture rounds. Apply `mom-test`, `deliver-edge-cases`, `user-stories` and `deliver-acceptance-criteria` where relevant. Use the UI aids from the section plan for interface ideas. Keep the bank and surface degraded mode when using it alone.

**Capture format (F-01…)** — every feature is captured per the format in `references/sections/S4-features.md`: plain-words name, one named kind of user, a click-by-click happy-path script (a stranger holding the phone could follow each step without asking anything), priority must/should/could confirmed aloud, and the failure cases the user cares about. Apply `deliver-edge-cases` to every F-NN and record the [four unhappy paths](references/bundle/plan-quality.md#s4--unhappy-paths), including recovery and a test or a reason a path cannot occur. When capturing each F-NN, also coin an English display name — the journal preserves the original wording and the English name is what SPEC/requirements.md, USER_FLOWS.md, and blueprint.json use. A name without a script is a placeholder, not a feature.

**Question strategy** — a capture loop: the one thing (the F-01 seed); walk it through like holding the phone — that IS the script; the next thing, one feature per script, never a blob; per feature: who taps it, what "done" leaves behind, what would annoy them; repair weak scripts by copying the old workaround; the three-that-matter round assigns priorities; the first-run emptiness question surfaces empty-state decisions.

**First batch** — bank question 1 ("If this app could do only ONE thing on day one, what would it be?"); question 2 (the walk-through) follows as its own turn regardless of tier — F-01's script is the section's first real work.

**AI feature interview** — for each feature that uses a model, apply the [S4 AI questions](references/bundle/ai-feature.md#s4-capture). Record input, output, source permissions and what must never be wrong. Carry `product.flags.has_llm` on the evidence-bearing answer, and `product.flags.has_rag` when there is retrieval. Apply `prompt-engineer` when available. Keep the work within the normal batch limit.

**Interface interview** — when the profile plan has `has_ui: true`, use its [feel, voice and accessibility questions](references/bundle/ui-spec.md#s4-interview) after a feature walk-through. Apply `ux-copy` and `antislop-human` from the S4 booster plan, or the internal reference if degraded. Record the concrete answers that feed UI_SPEC.md. Skip questions already answered.

**Decision surfaces**:

- Per-feature priority → `D-NNN user_confirmed`, confirmed aloud — never inferred.
- Empty-state behavior per affected feature → `designer_filled` (nobody asks what person #1 sees on an empty screen).
- A feature named as a blob and split into parts → the split recorded `designer_filled` until the user corrects it.
- Features left unmentioned after the three-that-matter round default to `could`, said visibly; the user's acceptance of that default is one `user_confirmed` decision.

**The "enough" protocol** — when the user says they have given enough: stop capturing (no "are you sure?"); draft routine unhappy-path defaults for correction and scan every F-NN for a complete script, a priority and the four unhappy paths, and scan the F-NN feature blocks (name, who, priority, happy path) for placeholder language ("and whatever else", "etc."); then one final complete-or-drop batch covering all failing features — for each, fix the failure (finish its script in one last walk-through, confirm the missing priority aloud, or resolve the behavior that blocks an unhappy path) or drop it into a "named but not captured" list (recorded, never counted as a feature); refusing the batch → exit criterion unmet → Section `blocked` with the failing features named. Full protocol: `references/sections/S4-features.md`.

**Exit criteria** (engine step 5; cite the satisfying answer id or decision id):

- [ ] The user explicitly said enough (the control, or the natural end of the capture loop).
- [ ] Every captured F-NN has a complete click-by-click happy path and a priority.
- [ ] Every F-NN covers abandonment, invalid input, concurrency/retry, and expiry/hold. Each path has observable recovery or a reason it is inapplicable.
- [ ] No "and whatever else"/"etc." placeholders in the F-NN feature blocks (name, who, priority, happy path); original answer wording stays in the journal.

**Section Record** — `S4-fitur.md` on the shared S1 skeleton, plus the feature list: each F-NN in the English capture format as its own subsection before the exit criteria.

### S5 — Deep research

Purpose: competitor scan, stack candidates with reasons, cost table, regional availability. Record: `S5-research.md` (becomes `RESEARCH.md` at S9). Mostly AI work: the Conductor does the research; the user is asked only targeted questions when findings demand a fact no record holds. English is the source; research runs on English sources plus the primary local sources of the user's market, summarized in English (conventions §4); questions are spoken in User Language at runtime. At Section start also set `project.status` = "researching" (conventions §2). The S5 research is this Section's scan (engine step 1b): start with the Domain Brief items targeted at S5.

**Booster** — load `discover-competitive-analysis` for the scan. Use plain search with the internal procedure when this aid is unavailable and record the degraded aid. Search and fetch are still required. If search or fetch stops working mid-Section (a tool error is an outage, not failed research — conventions §10), stop with the enable guidance and resume with `/lvr-continue`.

**Claim discipline (principles 1 and 14)** — every claim in the record carries a cite group (conventions §10); key facts have one primary source or two independent sites; the freshest primary source wins and conflicts are recorded. `unverified` only after logged research failed: `[unverified: <category> · RQ-NNN]`. Log every research step (`LVR research log`, `purpose: "s5"`). Reuse what S2 and the Domain Brief already cited by copying the tag with the claim; a copied tag past its freshness limit is researched again. Recommendations cite the research they rest on — never an unsourced "best practice". Bank: `references/sections/S5-research.md`.

**Work strategy** — four outputs, in order (templates and sub-query lists: `references/sections/S5-research.md`):

1. **Competitor scan** — ≥3 direct or adjacent products: what they do, pricing model, one lesson for this idea.
2. **Stack options / S5b** — run [framework discovery](references/sections/S5b-framework.md) for a new stack or a compatible addition when needed. Shortlist comparable options for the confirmed profiles, apply hard checks, rank dated signals and document the trade-offs. A confirmed existing stack or a project without a framework choice can skip discovery with a recorded reason.
3. **Recommended stack** — present one recommendation and its strongest downside with other eligible S5b options. Tie the reasons to S1–S4. Let the user choose, then record the selection and its recheck date.
4. **Cost table** — build on the S2 fact-sheet; add regional payment-gateway availability for the user's market (S2 country + S3 payments answers) and every new recurring cost the recommended stack introduces. Apply the [usage-cost check](references/bundle/plan-quality.md#s2-and-s5--costs-at-different-usage-levels) to fixed fees, variable units and busy-month totals. Cover input and output tokens separately when applicable.

**Tier chunking (conventions §7)** — T1: full queries per output. T2: split each output into sub-queries; append each sub-query's findings to the record before the next one starts. T3: one sub-topic per turn, append every step. Never hold the whole research in context — the file on disk is the memory (principle 13); `/lvr-continue` resumes from the last complete sub-query.

**First batch** — the competitor scan's first sub-query (T1: the whole scan), appended to the record before anything else moves on.

**User questions** — none by default; targeted batches (`S5.qNN`, engine rules) only when a finding needs a user fact — which competitor really matters, whether a regional constraint applies, whether a new recurring cost still fits the ceiling. Skip/enough controls stay visible.

**Decision surfaces**:

- Recommended stack → presented in plain language; the user's pick or acceptance → `D-NNN user_confirmed`; skipped → `assumed` (the recommendation stands).
- A recommendation resting on a free tier → its paid fallback (tier + cited price) recorded next to it as `designer_filled` — a non-technical user cannot know free tiers have cliffs. A paid-fallback price that stays `[unverified: …]` makes the decision a question for the user instead (principle 1).

**Exit criteria** (engine step 5; cite the record section, answer id, or decision id):

- [ ] Competitor scan covers ≥3 direct/adjacent products with what they do and a pricing model.
- [ ] ≥2 eligible stack options with trade-offs and a recorded S5b choice, or a documented reason discovery was skipped.
- [ ] One recommended stack with reasons tied to the S1–S4 answers and S2 resources.
- [ ] Cost table present, built on the S2 fact-sheet, with regional payment-gateway availability, dated rates, typical and busy usage, and per-user cost when measurable.
- [ ] Every claim carries a cite group or a logged `[unverified: …]` marker; `LVR cite check --file .lvr/docs/sections/S5-research.md` is clean.

**Section Record** — `PROJECT_DIR/.lvr/docs/sections/S5-research.md`:

```markdown
# S5 — Deep research

## Booster
<discover-competitive-analysis: used | degraded — internal scan with live web sources>

<findings, appended per sub-query; every claim: a cite group, or `[unverified: <category> · RQ-NNN]` after logged failed research>

## Competitor scan
## Stack options and trade-offs
<S5b conditions, filtered options, weights, ranked options, signal dates and snapshot reference; or the reason discovery was skipped>
## Recommended stack
## Cost table and regional availability

<!-- lvr:english-summary -->

## Answers
- **<S5.qNN> <English question summary>** — <English answer summary>
(or "None — no user questions were needed.")

## Decisions this Section
- **<D-NNN>** <summary> — <rationale> · status: <user_confirmed | assumed | designer_filled>

## Exit criteria
- [<x>] <criterion> — evidence: <record section, answer id, or decision id>

## Context research
<RQ ids of the S5 research steps> · brief items handled: <U-ids> · became: <answer ids, decision ids>
```

### S6 — Feasibility loop

Purpose: confront the S5 findings with the recorded answers; surface conflicts, risks, cost surprises. Output: risks appended to `S5-research.md` — S6 keeps no record of its own (conventions §5). Mostly AI work: the Conductor walks the findings itself; the user is asked only when a risk needs their call. The English text here is the source; questions are spoken in User Language at runtime.

**Booster** — apply `architecture-designer` to trade-offs and `threat-modeling` when triggered. Use `cost-estimator` as a checklist and refresh all prices. Work from the S5 record and the S1–S4 records. For a project that stores data, apply the storage choice and schema checks in [the data module](references/bundle/data-module.md). After the owner confirms a store, record the applicable vendor flags and rerun the section's booster plan before loading vendor guidance.

**Work strategy** — first the freshness re-check (engine step 1b: `LVR cite check --all`; research every expired fact again and update every record that repeats it). Then walk every S5 finding (competitor lessons, stack trade-offs, cost rows, regional constraints, `[unverified: …]` claims) and classify each. An unverified key fact that a recommendation, a decision, or the plan rests on is `blocking` unless the user confirms it aloud (record that as a `user_confirmed` decision):

- `blocking` — it contradicts a recorded answer or makes the plan unbuildable or unaffordable (cost busts the S2 ceiling; the S3 "no login" answer collides with what features need; a regional rule forbids the data plan).
- `note` — informational; shapes later documents, blocks nothing.

Every finding carries one line of evidence: the record row or answer id it comes from. `note` → recorded, done. `blocking` → the loop-back below is mandatory, never optional (conventions §5 hard rule).

**First batch** — start with the mandatory [regulated-domain screen](references/bundle/plan-quality.md#s6--regulated-domain) for finance, health, legal services and minors, then classify the other S5 findings. Record the supporting evidence for each. Use the same loop-back for material unknowns. No user turn is needed until a risk needs their call.

**The loop-back (every blocking risk)**:

**Routing** — send the loop-back to the Section that owns the conflicted decision: budget/cost → S2, feature/UX behavior → S4, data/privacy → S3, platform/context → S1. Two sections own it → pick the one whose exit criterion fails. Still unclear → ask the user which Section to revisit (one question).

1. Open a `pipeline.loop_backs[]` entry — `{ "id": "L-NN", "from": "S6", "to": "<owning S1–S4 section>", "reason": "<one line>", "opened_at": <now>, "resolved_at": null }`; journal `loop_back_opened`. One checkpoint.
   - Script: `LVR journal append --type loop_back_opened --payload '{"id":"L-01","from":"S6","to":"S4","reason":"…"}'`
2. Jump to the owning section's procedure block and run targeted micro-batches on the loop-back's reason only — the section is not re-run (its exit criteria still hold); new answers get fresh `S<n>.q<n>` ids, never re-asking recorded ones; note the loop-back in that section's record.
3. Close: set `resolved_at`; journal `loop_back_closed`. When closing, search the Section Records for claims the resolution overrides and update each one's affected content as part of closing the entry (e.g. a feature's F-NN script promising push notifications) — records must never keep a claim the decisions have overridden; the state answers keep their capture-time text (journal + state preserve the original answer; the corrected wording lives in the record); journal nothing extra (the `loop_back_closed` payload lists the touched records). One checkpoint. Return to S6.
   - Script: `LVR journal append --type loop_back_closed --payload '{"id":"L-01"}'`
4. Re-run the affected findings against the new answers. A new blocking risk opens a fresh entry (L numbering continues). Repeat until none remains.
5. If a session dies mid-loop-back, `/lvr-continue` reads the open entry (`resolved_at` null) and resumes the targeted batch — `current_section` stays "S6" throughout.

**Accepted risks** — a blocking risk the user hears and consciously accepts is never a silent shrug: record a decision (`D-NNN`, `user_confirmed`, section S6) with the risk, the rationale, and what accepting it costs; the risk's line points at the decision id. Only then does it stop blocking.

**User questions** — targeted batches only (engine rules, `S6.qNN`), when a risk needs the user's call: which constraint bends, whether to pay, whether to descope. Controls stay visible.

**Decision surfaces**:

- Every consciously accepted blocking risk → `user_confirmed` with rationale (above).
- A user choice made during a loop-back (raise the budget, drop a feature) → recorded in the owning section as that section's answer or decision, not silently in S6.

**Exit criteria** (engine step 5; cite the risk line or decision id):

- [ ] Every S5 finding classified `blocking` or `note` with one line of evidence.
- [ ] Regulated-domain screen recorded for finance, health, legal services and minors. Open requirements have an owning section or role.
- [ ] Zero open blocking risks — each closed via a loop-back (`resolved_at` set) or accepted as a `user_confirmed` decision.
- [ ] The risks section is appended to `S5-research.md` with every outcome recorded.

**Record** — `## Risks (S6)` appended to `PROJECT_DIR/.lvr/docs/sections/S5-research.md`; S6 keeps no record of its own: set `sections.S6.record` = "S5-research.md" (the risks append there) and `sections.S6.status` = "done" when the loop exits clean:

```markdown
## Risks (S6)

- **R-<n> (blocking | note)** — <finding> · evidence: <record row / answer id> · outcome: <resolved via L-NN | accepted → D-NNN | note only>
```

### S7 — Scope lock

Purpose: freeze the MVP — every feature F-NN → `in-MVP` or Parking Lot (recorded, never deleted). Record: `S7-scope.md`; journal `scope_locked`. At Section start also set `project.status` = "review" (conventions §2; the `section_start` S7 checkpoint carries it). Mostly AI work: the Conductor prepares the split; the user makes the cuts and gives one explicit confirmation. English is the source; questions are spoken in User Language at runtime (conventions §4).

**Booster** — apply `define-prioritization-framework` to the shortlist before the user confirms it. Guide: `references/sections/S7-scope.md`.

**Work strategy** (walk protocol in the bank):

1. Walk every F-NN from the S4 record, one by one: `in-MVP` or Parking Lot — guided by the S4 priorities (must → in-MVP by default; should/could → proposed for the lot), the S2 budget, and the S6 risk outcomes.
2. Parked items get a one-line reason each — recorded, never deleted, never silently dropped.
3. **MVP-size sanity**: if the in-MVP list holds more than ~8 features, say so plainly ("more than a first version builds well") and offer a concrete cut; the user decides — the warning never auto-cuts.
4. **Scope review** (on by default, skippable): when `<this skill dir>/../lvr-review-plan/SKILL.md` exists, offer it in one plain line ("Before you lock this, I can run a quick critical check of the scope. It takes a few minutes; you can skip it."). Unless the user skips, load that skill and run its `--scope-only` mode on the split exactly as shown (its `references/protocol.md` §10: lenses L01, L02, L04, L08, L10, L15). Then tell the user its verdict in plain words: "scope sound: lock it", "fix before locking" or "do not lock yet", with the blocking and major findings. The user decides: a fix changes the split (present it again), and an accepted risk becomes a decision at the lock. The review never edits the plan and never locks for the user. Skill missing → say once "The review skill is not installed, so I'll lock without the extra check." and go on.
   Script: `LVR journal append --type review_started --payload '{"run":<N>,"scope":"scope-only"}'` → the review skill's `LVR review …` steps → `review_done` (payload from `LVR review render --run <N>`). `<N>` = `state.review.runs` + 1 (1 when `review` is null).
5. Present the final list — in-MVP plus Parking Lot — and ask for explicit confirmation of the whole list.

**First batch** — the F-NN walk producing the proposed split; the first user turn is the size warning (when it fires), the scope review offer and its outcome, then the confirmation.

**The lock moment** — `scope_locked` fires only after the user explicitly confirms the final list (a plain yes to "is this the first version?"; a skip is not a lock — the skip attempt is journaled like any answer, `answer_recorded` with `skipped: true`, before the re-ask). On confirmation, one checkpoint: journal `scope_locked` (payload: the in-MVP feature ids) + state write (no field change; `project.status` is already "review" since Section start). Then write the record and close S7 (`section_done`, second checkpoint): scope counts as locked only once both exist (conventions §5). From the lock on, the feature list is frozen: changes go through /lvr-add-feature, never quiet edits. Refused confirmation → exit criterion unmet → engine step 5: the Section is marked `blocked` with the contested items named.

Script: `LVR journal append --type scope_locked --payload '{"in_mvp":["F-01"],"parking_lot":[],"decision":"D-NNN"}'`

**User questions** — the confirmation is the one mandatory question; the size-cut offer and contested features may add targeted batches (`S7.qNN`). Controls stay visible.

**Decision surfaces**:

- The confirmed split → `D-NNN user_confirmed` (the lock decision; the record's per-feature lines carry the detail).
- A must-priority feature parked anyway (budget or risk) → allowed only aloud; its parked line cites the S6 risk or S2 constraint that forces it.

**Exit criteria** (engine step 5; cite the answer id or decision id):

- [ ] Every F-NN from S4 marked `in-MVP` or Parking Lot — none missing, none deleted.
- [ ] Each parked item carries a one-line reason.
- [ ] The user explicitly confirmed the final list; `scope_locked` is journaled.
- [ ] The MVP-size sanity check ran; when > ~8 features, the warning and the user's call are recorded.
- [ ] The scope review ran, was skipped by the user, or is not installed, and the record's `## Scope review` says which.

**Section Record** — `PROJECT_DIR/.lvr/docs/sections/S7-scope.md`:

```markdown
# S7 — Scope lock

## In-MVP
- **F-01** <name> — <one line what it is>

## Parking Lot (recorded, never deleted)
- **F-0n** <name> — parked because: <one line>

## Size check
<in-MVP count; when > ~8: the warning given + the user's call>

## Scope review
- Run <N> · <"scope sound: lock it" | "fix before locking" | "do not lock yet"> · blocking <n>, major <n>, minor <n> · report `.lvr/review/REVIEW-<date>-<N>.md`
- User's call: <fixed: what changed | accepted: D-NNN | went ahead as is>
(or one line: "skipped by the user (S7.qNN)" / "review skill not installed")

## Lock
- Confirmed: <S7.qNN> · decision <D-NNN> · journaled `scope_locked` <ts>
- Frozen from here: changes go through /lvr-add-feature.

<!-- lvr:english-summary -->

## Answers
- **<S7.qNN> <English question summary>** — <English answer summary>
(always at least the confirmation: the skip attempt + re-ask, then the explicit yes)

## Decisions this Section / Exit criteria / Context research
<engine step-6 shape, as the S1–S4 skeleton>
```

### S8 — Milestone plan

Purpose: break the in-MVP list into milestones `M0…Mn`, each independently verifiable. Record: `S8-milestones.md` (becomes `MILESTONES.md` + `VERIFICATION.md` at S9); the state's top-level `milestones[]` gets one entry per milestone (id, goal, features covered) — milestones live in this one place and are never mirrored under `pipeline`. Mostly AI work: the Conductor drafts the plan; the user reviews it. English is the source; questions are spoken in User Language at runtime (conventions §4).

Script: close S8 with `LVR journal append --type section_done --payload '{"section":"S8","record":"S8-milestones.md","milestones":[{"id":"M0","goal":"…","features":["F-01"]}]}'` — the `milestones` array fills `state.milestones[]`.

**Booster** — load `planning-and-task-breakdown` for milestone decomposition, dependencies and verification. Its fallback is the internal decomposition bank in `references/sections/S8-milestones.md`.

**M0 — the walking skeleton (generic)** — the thinnest slice that runs end to end on the real stack: deployed to the S2 deploy target (the future HANDOVER target), real at every layer (real stack, real data store, nothing stubbed end to end), carrying exactly one real user task (the S1 day-one answer; F-01's happy path when that was skipped) from first tap to visible result, provable by one command or scripted check.

**Quality and operations** — apply the [S8 checks](references/bundle/plan-quality.md#s8-and-s9--measurable-quality-and-operations). Assign every applicable quality or ops target to a milestone with a named owner and observable verification. Include time zones, support matrix, accessibility, error tracking, availability, owner alerts and a restore drill.

**Work strategy** (templates and rules in the bank):

1. Seed M0 from the walking-skeleton definition.
2. Order the remaining in-MVP features into milestones, grouped by the data or flow they share; every F-NN lands in exactly one milestone; the final milestone re-verifies the M0 deploy still passes.
3. Size each milestone: completable by a builder agent in one focused session; anything bigger splits at a feature boundary.
4. Per milestone write: goal, deliverables, measurable acceptance criteria, verification procedure, rough cost/effort.

**First batch** — draft the whole plan, M0 first; the user sees it only at the final review.

**Acceptance-criteria rules** — every criterion is machine-checkable: a command with expected output, a scripted step, or a visual check stated as an observable fact plus how to look ("after reload, the list shows the saved item"). "Looks good" and "works well" are not criteria (conventions §5 hard rule). The verification procedure names exact commands, expected outputs, and what to look at — S9 compiles them into VERIFICATION.md.

**User questions** — one review at the end: present the plan in plain language (order, rough effort, what M0 proves); corrections become targeted batches (`S8.qNN`). Controls stay visible.

**Decision surfaces**:

- Milestone order and grouping → `designer_filled`, shown at the review (a non-technical user cannot sequence builds); explicit user choices between offered options → `user_confirmed`.
- Cost/effort figures are rough estimates with their basis stated — real prices carry their cite tag copied from S2/S5 (or an `[unverified: …]` marker), checked fresh by the engine step 1b re-check.

**Exit criteria** (engine step 5; cite the milestone id):

- [ ] M0 exists and satisfies the walking-skeleton definition.
- [ ] Milestones cover 100% of in-MVP features — each F-NN in exactly one — plus deploy to the S2 target.
- [ ] Every milestone has goal, deliverables, acceptance criteria, verification procedure, rough cost/effort.
- [ ] Every acceptance criterion is machine-checkable (command or scripted step — never "looks good").
- [ ] Every milestone is sized for one focused builder session.

**Section Record** — `PROJECT_DIR/.lvr/docs/sections/S8-milestones.md`:

```markdown
# S8 — Milestone plan

## M<n> — <name>
- **Goal:** <one line>
- **Deliverables:** <F-NNs built, files/components, deploy/config steps>
- **Acceptance criteria:** <numbered; every one machine-checkable>
- **Verification:** <exact commands + expected outputs; visual checks as observable facts>
- **Rough cost/effort:** <estimate + basis>

<!-- lvr:english-summary -->

## Answers
- **<S8.qNN> <English question summary>** — <English answer summary>
(or "None — the review passed without corrections.")

## Decisions this Section / Exit criteria / Context research
<engine step-6 shape, as the S1–S4 skeleton>
```

### S9 — Compile

Before compiling a project with a recorded framework decision, recheck S5b evidence if its `recheck_by` date is due. Carry verified pins and documentation sources to the stack section of `SPEC/architecture.md`. Route a feasibility change through S6 and preserve the chosen stack until the user confirms a change.

Purpose: compile the Section Records + `decisions[]` + `milestones[]` into the Blueprint Bundle of 20 base Markdown files, frozen profile additions and the derived index (conventions §8; the per-file specs are packaged in `references/bundle/templates.md`). The bundle lives in the project folder next to `.lvr/` and must be self-sufficient: any harness, with no LVR skills installed, can build the product from it. Mostly AI work: the Conductor compiles; the user is brought in only when a gap needs their call. The entire bundle is written in English. The viewer displays the saved files (principle 5, conventions §4). The bundle files are S9's output: no `S9-*.md` Section Record is written (conventions §5).

**Booster** — apply `deliver-prd` for PRD, `api-designer` when applicable, and `user-stories` and `deliver-acceptance-criteria` for requirements. Reference `develop-adr` and the Spec Kit templates when applicable. Apply ponytail to code style, then SimpleEnglish and anti-slop to prose. Apply the applicable UI or AI aids to those files. Fetch [the AGENTS.md format](https://raw.githubusercontent.com/agentsmd/agents.md/main/README.md) as documentation. Use the licensed anti-slop snapshot only as a degraded fallback when needed. Surface degraded uses in OVERVIEW.

**Profile files** — read the frozen `profile_files` from `LVR profile plan`. Draft each additional file from the relevant profile questions and records. Keep the previously closed bundle outputs and existing IDs. The blueprint generator copies the extra paths into `profile_files` when the list is nonempty. For a skill/plugin or agent, use [the personal workflow templates](references/bundle/workflow.md) for the draft skill, local profile schema, tools, evaluations and install plan. Carry each destination's exact data boundary into the plan.

**AI feature output** — when the frozen profile plan includes `SPEC/ai.md`, use [the AI specification guide](references/bundle/ai-feature.md). Apply `prompt-engineer` and `evaluate-rag` for retrieval work. Carry model choice, fallback, prompt contract, data boundaries, safeguards, hallucination policy, per-call cost and the runnable evaluation set. Run `LVR ai cases` and `LVR ai eval` with the dry-run adapter, then document the real model checks in VERIFICATION.md.

**Interface output** — when the frozen profile plan lists `UI_SPEC.md`, compile it with [the measurable UI specification](references/bundle/ui-spec.md). Use the recorded feel, voice and accessibility choices. Run the packaged [contrast checker](references/third-party/antislop-human/contrast-check.py) on the planned palette when Python is available. Copy the verified helper and its MIT license to `.lvr/verification/` for builder checks, and put the exact checks and expected results in VERIFICATION.md. Preserve existing frozen plans when resuming.

**Quality, operations and data sources** — use [the S9 checklist](references/bundle/plan-quality.md#s9--data-sources-and-integrations). Carry S4 failures into requirements and flows, S3 abuse controls and S6 conclusions into SECURITY.md, and S2/S5 cost evidence into RESEARCH.md and OVERVIEW.md. Place measurable ops and restore steps in MILESTONES.md, VERIFICATION.md and HANDOVER.md. Add the named data sources and integrations section to SPEC/architecture.md, with permissions, refresh cadence, stale-data handling and source evidence.

**Stored data output** — when `stores_data` is true, compile the chosen storage and schema into SPEC/data-model.md and its access and privacy checks into SECURITY.md. Use [the data module](references/bundle/data-module.md). The schema's Mermaid ERD is the diagram exception.

**Work material (engine step 2)** — at Section start load: every Section Record in `.lvr/docs/sections/` (S0–S8), `state.json` (for `decisions[]`, `milestones[]`, `boosters.core`), and `references/bundle/templates.md`. T3: never the transcript — each turn reloads only the templates plus the records that feed the one file being compiled.

**Work strategy** — the 6-step compilation order, run in sequence:

1. **Draft** — compile each base file from the Section Records + `decisions[]` + `milestones[]`, following its skeleton in `references/bundle/templates.md` and the before-write English check in conventions §4, in bundle order (conventions §8): `AGENTS.md` → `OVERVIEW.md` → … → `CLAUDE.md`/`GEMINI.md`. Then compile the frozen additions. Templates carry the structure; content comes only from the records — never invented. A gap the records cannot fill becomes an `assumed` decision (listed in ASSUMPTIONS.md) or a Limitations note, not a fabrication.
2. **Cross-check pass** — over the drafted bundle; fix every failure with a targeted edit to the offending file(s), then re-check. The full list:
   - every F-NN has a USER_FLOWS.md entry and a SPEC/requirements.md row;
   - every decision in `decisions[]` has a DECISIONS.md row — and DECISIONS.md holds nothing `decisions[]` lacks;
   - every `assumed` and `designer_filled` decision is listed in ASSUMPTIONS.md with why + how to replace or confirm it;
   - stack, entity, and feature names are identical across all files (conventions §8 format rules);
   - every milestone acceptance criterion has a VERIFICATION.md procedure (exact commands, expected outputs, what to look at);
   - every price in the OVERVIEW.md and RESEARCH.md cost tables cites its S2 or S5 row (principle 1);
   - every claim in the records and the bundle carries a valid, fresh cite group or a logged `[unverified: …]` marker; no memory sources; no unsourced recommendation; no `designer_filled` decision on an unverified fact; every Domain Brief item became a question or decision (principles 1 and 14; conventions §10) — an expired fact is researched again, never compiled stale;
   - all required files from the frozen and declared bundle list exist and are non-empty.
   - Script: `LVR crosscheck` runs this whole list (rules X1–X8, read-only; X8 = `cite check --all`, findings I1–I13) over the drafted bundle and returns `findings[]` with exact messages; fix only what it reports, with targeted edits, then run it again until `clean` is true. Its `needs_model[]` items (stack and entity names identical across files; Why and confirm lines specific; verification steps exact and covering their criterion; OVERVIEW and RESEARCH prices really sourced; also the cost tables agree) are yours to check by reading — the script never guesses them. A duplicated `## F-NN` block or an F-NN that exists in only some files is reported by the script (X1). Parked features keep a `SPEC/requirements.md` block marked parked, a `SCOPE.md` row, and a `USER_FLOWS.md` heading marked `(parked — see SCOPE.md)` (conventions §5); the script checks all three.
3. **SimpleEnglish document-rules pass** — short sentences, active voice, jargon defined on first use (principle 7); applies to all bundle files, strictest for OVERVIEW.md; never fights GFM structure.
4. **Anti-slop editing pass** — concrete and specific, no filler (principle 6); rewrite slop lines, never drop content.
5. **Emit blueprint.json** — the v2 manifest in `references/bundle/templates.md` §19, derived from `state.json`: regenerate it, never hand-edit it. Write the one-line CLAUDE.md + GEMINI.md stubs (exact line in the templates).
   - Script: `LVR blueprint emit` (add `--in -` with the stack, `idea_summary_en` and costs JSON when it answers `BLUEPRINT_NEEDS_INPUT`; the hint shows the shape) and `LVR handoff stubs`. Both write only what is missing or wrong.
6. **Close** — journal `doc_generated` per file (payload: the file path) with a state write each — one checkpoint per file (conventions §9). Then: `project.status` = "bundled"; `sections.S9` closes per engine step 6 with `record` = the bundle files; `current_section` stays "S9" (S10 Build has no section pointer; `/lvr-build` tracks it in `project.status`); suggest `/lvr-handoff` (engine step 7). S9 is resumable per file: a file already on disk that passes the cross-check is kept — only missing or failing files are drafted again, never a silent blanket rewrite.
   - Script: `LVR journal append --type doc_generated --payload '{"file":"<path>"}'` per file.

**Tier behavior (conventions §7)**:

- T1/T2: one file per turn, checkpoint per file.
- T3: one file SECTION per turn with append-chunks — write the file's skeleton, then append one top-level section per turn, checkpointing per chunk.
- **Truncation recovery** (conventions §7): on `finishReason=length`, a mid-sentence cutoff, or a missing required section — reload the last complete block from the file on disk, continue exactly from there with no repetition, and append; checkpoint `truncation_recovered` after every successful append; repeat until the skeleton's required structure is complete. Never save a truncated file as complete; never regenerate from scratch what can be continued.

**Degraded surfacing** — every degraded booster (the Section Records' `Booster: … (degraded — …)` lines and any degraded status in `boosters.core` or `boosters.enhancer`) and every Section that ran blocked and later resolved MUST surface in OVERVIEW.md under a `## Limitations` heading — one plain line each. Never silently dropped: quality caveats live where the owner reads.

**Regeneration** — per file, explicit, only on user request or on a handoff gap-fix (`/lvr-handoff` re-lints instead of regenerating — conventions §9). Never blanket-regenerate the bundle; blueprint.json is the standing exception — derived and always regenerated from state, never hand-edited.

**Owner documents** — OVERVIEW.md and HANDOVER.md are written FOR the non-technical owner: plain language (strictest SimpleEnglish reading level in OVERVIEW.md), real numbers in the cost table, no step that assumes reading code. Present any localized explanation in conversation (principle 5, conventions §4).

**Branding check (conventions §2)** — offer it while drafting OVERVIEW.md: the display name may still change here. A change is one `user_confirmed` decision, applied across the bundle before the cross-check runs. Any branding rename applies to `project.name` in state **before** the bundle is compiled, so OVERVIEW.md always carries the final name.

Script: a confirmed display-name change is `LVR decision record --event doc_generated --payload '{"file":"OVERVIEW.md","project":{"name":"<new name>"}}' --decision '{"section":"S9","summary":"…","rationale":"…","status":"user_confirmed"}'` (`payload.project.name` updates `project.name`).

**User questions** — none by default; targeted batches (`S9.qNN`, engine rules) only when a compile gap needs the user's call — a real naming choice, or a conflict the records cannot resolve. Controls stay visible.

**Decision surfaces**:

- Display-name change at the branding check → `D-NNN user_confirmed`.
- A compile gap resolved by assumption (no record answers it) → `assumed`, listed in ASSUMPTIONS.md.

**Exit criteria** (engine step 5; cite the file path):

- [ ] Every base Markdown file and frozen profile addition exists and is non-empty. Apply the documented bundle format to each file.
- [ ] The cross-check list above passes on every item.
- [ ] If SPEC/ai.md is planned, it has a checked prompt and data contract, fallback, cost and at least ten runnable cases with observable pass conditions.
- [ ] If UI_SPEC.md is planned, it has concrete tokens, screens and states, copy, motion, layout and accessibility checks. Its contrast results and outstanding builder checks are recorded.
- [ ] Feature failure paths and abuse controls have verification steps. The bundle records its quality and operations targets, and a named data sources and integrations section.
- [ ] blueprint.json matches `state.json` and follows the manifest schema in `references/bundle/templates.md` §19.
- [ ] CLAUDE.md + GEMINI.md stubs written; AGENTS.md follows the agents.md spec.
- [ ] Every degraded booster and blocked-then-resolved Section appears in OVERVIEW.md → Limitations.
- [ ] `project.status` = "bundled"; `doc_generated` journaled for every file.

## Interruption contract

- Stopping is safe at any point. After every checkpoint moment (each answer, Section start/done, booster install or choice, file write, error), journal and state are consistent on disk.
- Maximum loss: the current unanswered micro-batch. Before S0's first state write, loss is zero — the journal already holds the gate, tier, and booster events.
- Resume is `/lvr-continue`'s job, never this skill's. If the user re-runs init in a folder that now has `.lvr/state.json`, Folder Gate Check 1 refuses and routes to `/lvr-continue`. If a session died before the first state write, re-running `/lvr-init-new-idea` is clean.
- `journal.ndjson` is append-only: never rewrite, reorder, or delete lines; on state corruption, `/lvr-continue` rebuilds by journal replay.

## Never list

The full rules live in `references/principles.md`; these are the ones this skill enforces constantly:

- Never re-ask a recorded answer — check `sections.<S>.answers` before composing every batch; the captured idea (S0.q1 / `idea_raw`) is covered by the same rule: later Sections' gap-fill questions must not re-collect what the idea text already answers. (Principle 10)
- Never generate any Blueprint Bundle file before scope lock (S7) — compilation happens only at S9. (Conventions §5 hard rules)
- Never vendor NC-licensed content into any LVR file — NC boosters are runtime dependencies only: credit, never copy. (Principle 11)
- Never answer a checkable fact from memory — research it and cite it (conventions §10); `[unverified: …]` only after logged research failed, and never as the basis of a `designer_filled` decision. (Principle 1)
- Never continue without web research — no web search or page fetch → explain how to enable it and stop. (Principle 14)
- Never let an item from the Domain Brief or a Section scan go unhandled — each becomes a question or a cited decision. (Principle 14)
