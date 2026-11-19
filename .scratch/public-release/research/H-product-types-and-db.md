# H — Product-type profiles + DATA/DB design skills (2026-11-19)

Method: WebSearch (aggregator listings = leads only), then `git clone --depth 1` into scratchpad `curate-h/`, SKILL.md read, license file + last commit checked, stars via `gh api`. Scores = /20 per RUBRIC.md, from reading, not execution. "Not read" = lead only, not scored.
Date basis: today 2026-11-19, so "<=6 months" = commit after 2026-05-19.

## 0. Key findings

1. Data design is solved by composition, not one skill: (a) a storage-choice rule set that we author (no good skill exists), (b) `database-schema-designer` (onewave-ai) for schema/relations/indexes/ERD/migrations, (c) `supabase-postgres-best-practices` (official) as a rule reference + RLS, (d) vendor skills only when the user's chosen store is that vendor.
2. Vendor skills exist for Supabase (official), Neon (official), Firebase/Firestore (Google), Prisma (official, setup-only). Drizzle: repo has NO SKILL.md (searched `find -name SKILL.md`: 0 hits; only docs/orm source). All vendor skills are build/operate-oriented, not planning; use them as conditional references, not core.
3. Game, browser extension, chatbot UX are weak in the ecosystem: only thin skills (2-4 KB). Best answer is data-driven profile content we author (questions + bundle templates), with at most one reference skill.
4. Boosters stay light: none of the DB skills needs installing at init. Load only when `stores_data=true` (flag from S2/S3, not the product type).

## 1. Part 2 first (owner priority): DATA / DB

### 1.1 Scored candidates

| Job | Skill (repo) | License | Last commit | Stars | Size | Score | Verdict |
|---|---|---|---|---|---|---|---|
| Schema+relations+indexes+ERD+migrations | `database-schema-designer` (onewave-ai/claude-skills) | MIT (root LICENSE) | 2026-10-19 | 436 | SKILL 6.3 KB + 4 refs (19.6 KB) | **15** | WINNER (conditional, load at S6/S9 when stores_data) |
| Postgres rules, RLS, types, locking | `supabase-postgres-best-practices` (supabase/agent-skills) | MIT (frontmatter + root) | 2026-10-02 | 3,104 | SKILL 3.2 KB + 30 rule files | **15** | WINNER as reference (fetch only matching rule files) |
| Supabase platform + security checklist | `supabase` (same repo) | MIT | 2026-10-02 | 3,104 | 14.3 KB | 13 | conditional: only if store = Supabase |
| Schema design + SQL-vs-NoSQL + Mermaid ERD + scripts | `database-designer` (alirezarezvani/claude-skills) | MIT | 2026-11-17 | 30,093 | 13.2 KB + 3 py scripts + expected_outputs | 15 | tie with winner; loses on size (rubric: tie -> smaller). Keep as fallback; its `schema_analyzer.py` could lint DDL. |
| Zero-downtime migrations, DDL analyzer | `database-architect`, `schema-evolution-planner` (wyattowalsh/agents) | MIT | 2026-11-17 | 6 | 10 KB / 8.4 KB, py scripts need `uv` | 13 | loser (low adoption, uv dep); expand-contract idea already in winner's migration step |
| Multi-tenant, RLS, vector schema | `schema` (simota/agent-skills) | MIT | 2026-11-18 | 102 | 21.6 KB | 11 | loser (>20 KB, agent-collab jargon); only mine ideas |
| PG table design | `postgresql-table-design` (wshobson/agents) | MIT | 2026-11-18 | n/a (not fetched) | 7.9 KB | ~13 | loser to winner (PG-only) |
| Storage choice | `database-design` (vudovn/antigravity-kit) | MIT | 2026-08-31 | 8,225 | 1.7 KB + `database-selection.md` 1.1 KB | ~10 | too thin: decision tree = 5 lines. Take the idea, author our own |
| Firestore modelling + security rules | `firebase-firestore` (firebase/agent-skills, Google) | Apache-2.0 | 2026-11-09 | 520 | 5.1 KB (+ rules skills 28 KB) | 11 | conditional: only if store = Firestore |
| Neon Postgres ops | `neon-postgres` (neondatabase/agent-skills) | Apache-2.0 | 2026-11-18 | 116 | 21 KB (parent `neon` 38 KB) | ~9 | skip; ops/branching/egress, not planning, oversized |
| Prisma | `prisma-orm-setup` etc. (prisma/skills) | MIT | 2026-11-09 | 80 | 7 KB | ~9 | skip; setup/upgrade only. `prisma-database-setup` is a deprecated stub |
| Drizzle | none | - | - | - | - | - | no official skill in drizzle-team/drizzle-orm |
| Data modeler (tenancy refs) | `data-modeler` (jtmthf/skills) | NO LICENSE file | 2026-07-08 | n/a | 14 KB | - | GATE FAIL (no license) |
| files-vs-SQLite | `files-as-database` (BuilderIO/agent-native) | not verified | - | 7,724 | - | not read | clone failed ("current branch appears to be broken"); lead only, via search snippet: "files for content/config, SQLite for structured data". Re-try later. |

Overlap rule applied: onewave schema-designer (15, 6 KB) kept over alirezarezvani database-designer (15, 13 KB, tie -> smaller), wyattowalsh, simota, wshobson.

### 1.2 Evidence (quotes from SKILL.md)

- onewave `database-schema-designer`: "Designs relational and document database schemas ... tables and collections, keys, relationships, constraints, indexes driven by real query patterns, ERDs, and reversible migration scripts - with PostgreSQL (including Supabase) as the default and MySQL, SQLite, and MongoDB supported." Workflow step 1 asks only for: "Entities and how they relate, in plain language" + "the 5-10 most frequent or most important queries" + volume + tenancy. Has "Checks before delivering" (every FK has explicit ON DELETE + index; no `varchar(255)` by habit; multi-tenant needs RLS) and a worked example. Output contract `references/output-format.md`: Assumptions / ERD / DDL / Query-to-index map / Design decisions / Migrations up+down / Verification / Later. Caveat: ERD is Mermaid; LVR bundle wants ASCII/text, so wrap: ask for `erDiagram` then render as ASCII box/crow's-foot table in `DATA_MODEL.md` (or keep mermaid fenced if the app rule "no Mermaid" is only for the LVP generator; owner to decide). `other-engines.md` covers MySQL, SQLite ("Declare tables STRICT ... PRAGMA foreign_keys = ON"), MongoDB.
- supabase `supabase-postgres-best-practices`: description says "Load this skill BEFORE writing or changing anything that lives in a Postgres database: creating or altering tables and columns ..., schema design, migrations ..., RLS policies and the tests that verify them, indexes ...". Rule files named `schema-primary-keys.md`, `schema-foreign-key-indexes.md`, `security-rls-basics.md`, `security-rls-performance.md`, `schema-partitioning.md`, `advanced-jsonb-indexing.md`. Each rule = incorrect vs correct SQL. `supabase` main skill: "Never use `user_metadata` claims in JWT-based authorization decisions", "TO authenticated alone is authentication without authorization (BOLA / IDOR)", "UPDATE policies require both USING and WITH CHECK". (RLS traps worth quoting into our SECURITY section.)
- vudovn `database-selection.md` (the only "which store" content found): decision tree "Simple / Embedded / Local -> SQLite", "AI / Vector search -> PostgreSQL + pgvector", "Edge -> Turso". Too thin to depend on.

### 1.3 Gap: storage choice must be authored by us

No skill gives a defensible JSON-files / SQLite / Postgres(Supabase/Neon) / Firestore / vector-DB decision with plain-language questions. Proposal: a data-driven reference `data-store-choice.md` in the Recipe (not a booster), consumed at S6. Draft:

| Ask (plain Indonesian/English) | Answer drives |
|---|---|
| Who uses it: only me / a few people / the public? | single-user local -> files or SQLite; multi-user -> server DB |
| Does it run on my machine only, or online? | local -> SQLite/files; online -> Postgres (Supabase/Neon) or Firestore |
| Must people log in and see only their own data? | yes -> Postgres + RLS (Supabase) or Firestore + security rules |
| How many records in a year (tens / thousands / millions)? | <10k personal -> JSON/markdown files ok; 10k+ or joins -> SQL |
| Do you search/filter/sort/join across records often? | yes -> SQL; no (just notes/configs) -> files |
| Does it need to work offline on phones? | yes -> SQLite on device + sync (or Firestore offline) |
| Is search by meaning needed (RAG)? | yes -> pgvector (same DB) before a separate vector DB; separate (Qdrant/Pinecone) only at large scale |
| Must data be exportable/human-editable (agent skill, n8n)? | yes -> files (JSON/MD/YAML) or SQLite; keep a plain-text export |

Output rule: always write `DATA_MODEL.md` + `STORAGE_DECISION` section (choice, 1 rejected alternative, why, migration path if scale grows). If answer is "files": still produce a schema (JSON schema / frontmatter fields + folder layout + id strategy), no hand-waving.

### 1.4 Proposed pipeline hook for data

- Trigger flag `stores_data` (set when S1/S2/S3/S4 mention saving, users, history, accounts, documents, lists, or product type default says so).
- S2 (stack): ask the 8 storage questions above (cap 4 shown at once by interview-length rule).
- S4 per feature F-NN: "what is saved / read / changed / deleted?" fills an entity list (nouns, relationships in plain words, the 5-10 key screens/queries).
- S6: storage decision + conditional load of `database-schema-designer` workflow (steps 2-6 only; interview already did step 1).
- S9: `DATA_MODEL.md` = ERD (ASCII) + DDL or JSON schema + query-to-index map + migration plan (up/down) + retention/delete rules (GDPR-style "delete my data") + RLS policy table if Supabase/Firestore.
- Gap-lint: every entity has a PK, every relationship names cardinality + ON DELETE, every key query has an index or an explicit "scan ok", every user-owned table has an access rule.
- Vendor skill loaded only on explicit choice: Supabase -> `supabase` + best-practices; Firestore -> `firebase-firestore`; Neon -> skip (use best-practices).

## 2. Part 1: per product type

### 2.1 Best skills per type (spec/plan-relevant), scored

| Type | Skill (repo) | License | Last commit | Stars | Score | Use |
|---|---|---|---|---|---|---|
| Web app | existing winners (api-designer, architecture-designer, ui-ux-pro-max, spec-kit data model) + schema-designer above | - | - | - | - | no new skill |
| Mobile app | `mobile-design` (vudovn/antigravity-kit) | MIT | 2026-08-31 | 8,225 | ~13 | READ FOR QUESTIONS: it has "ASK BEFORE ASSUMING (MANDATORY)" list, platform decision matrix, "AI MOBILE ANTI-PATTERNS" and a framework decision tree. 15.6 KB (token 1). Mine its question list; load on demand. |
| | `mobile-release` (alirezarezvani) | MIT | 2026-11-17 | 30,093 | ~13 | store-rejection checklist (privacy manifest, target API level, permission declarations); 3 stdlib scripts. Use as S6/S9 "store readiness" reference. 5.8 KB. |
| | `expo-overview` + `eas-app-stores` (expo/skills) | MIT | 2026-11-15 | 4,189 | ~11 | only when framework = Expo; router skill, build-oriented. Conditional. |
| Game | `game-design` (vudovn game-development) | MIT | 2026-08-31 | 8,225 | ~12 | 2.6 KB: loop table, GDD sections (Pitch/Core Loop/Mechanics/Progression/Art/Audio), balancing flow model. Thin: use as seed; we author GDD template. `game-developer` (jeffallan, MIT) is coding-only (ECS/Unity profiler) -> skip for planning |
| RAG | `rag-architect` (jeffallan/claude-skills) | MIT | 2026-11-16 | 12,451 | **14** | design: 5-step workflow w/ checkpoints, refs for vector DBs, embeddings, chunking, retrieval, evaluation |
| | `evaluate-rag` (hamelsmu/evals-skills) | MIT (repo) | 2026-08-15 | 1,679 | **15** | eval plan: "Do error analysis on end-to-end traces first", Recall@k first-pass, faithfulness/relevance, synthetic QA. Different job from rag-architect: keep both |
| MCP server | `mcp-builder` (anthropics/skills) | Apache-2.0 (LICENSE.txt in skill dir) | 2026-11-16 | 197,386 | **14** | 4 phases, tool naming, "API coverage vs workflow tools", evaluation (10 verifiable read-only questions) + scripts. Loses nothing to alirezarezvani `mcp-server-builder` (12, OpenAPI->MCP scaffold, 3.8 KB) or jeffallan `mcp-developer` (12, code-focused). Use ONLY its Phase 1-2 (research/plan) + eval design for the Recipe |
| n8n / automation | `n8n-credentials-and-security-official`, `n8n-workflow-lifecycle-official`, `n8n-agents-official` (n8n-io/skills) | Apache-2.0 | 2026-11-11 | 613 | ~12 | official. Lifecycle = PLAN->BUILD->VALIDATE->TEST->PUBLISH->HANDOFF; credentials: "Secrets via the credential system, never in text fields"; "Credential creation is the user's job". 19.6 KB lifecycle (token 1). Planning part only. `czlonkowski/n8n-skills` (6,675 stars, MIT, 2026-11-18) `n8n-workflow-patterns` (6 patterns) NOT READ: lead |
| Agent skill / plugin | `skill-creator` (anthropics, 17), `agent-spec` (pm-claude-skills, 16) | - | - | - | already in map | no change. Add `agent-designer` below if multi-agent |
| CLI tool | `create-cli` (steipete/agent-scripts) | MIT | 2026-11-13 | 7,504 | **14** | 3.3 KB; clarify list (name, primary user, input sources, output contract `--json`, interactivity, config precedence) + deliverables list (command tree, flags table, exit-code map, dry-run, 5-10 examples). Caveat: it points to `references/cli-guidelines.md` derived from clig.dev (CC BY-SA per search snippet, unverified) -> do not vendor that file; fetch/cite instead |
| Browser extension | none good | - | - | - | - | only `chrome-extension-developer` (popey mirror of sickn33 collection, 3.5 KB, MV3 coding rules, no license field, 0-star mirror repo, score ~9). Author profile ourselves (permissions rationale, store listing, MV3 contexts). Lead not read: `browser-extension-builder` (sickn33), `browser-extension` (xenitv1 w/ manifest auditor) |
| Chatbot / AI agent | `agent-designer` (alirezarezvani/claude-skills) | MIT | 2026-11-17 | 30,093 | ~15 | 3.9 KB; pattern decision table (single / supervisor / pipeline / hierarchical), tool-schema generation (Anthropic+OpenAI formats), 3 scripts. Use at S6 when product has an agent. `prompt-engineer` (jeffallan) already in map for LLM spec |
| | `llm-evaluation` (popey/antigravity mirror, 14 KB) | repo MIT | 2026-07-24 | 0 | not scored | mirror; skip, use evaluate-rag ideas |

Excluded/flagged: jtmthf (no license), popey repo is a re-host of the antigravity-awesome-skills collection (provenance unclear -> prefer originals), borghei `rag-architect` (license NOASSERTION per search; not cloned).

### 2.2 Overlap decisions

- RAG: rag-architect (14) vs alirezarezvani rag-architect (4.3 KB, not scored in depth) vs popey rag-engineer/rag-implementation (mirrors): keep jeffallan + hamelsmu evaluate-rag (complementary).
- MCP: anthropics mcp-builder 14 > alirezarezvani 12 = jeffallan 12.
- DB: see 1.1.
- Skill authoring/agent: unchanged.

## 3. Draft profile table (data-driven `profiles/<id>.yaml`)

Common fields: `id`, `detect` (keywords), `stores_data_default`, `extra_questions` (by section), `bundle_files`, `conditional_skills`, `lint_rules`.
Existing S1-S8 sections stay; profiles ADD questions (3-6 each), never replace the base ones. All questions plain language; where a term is technical, the agent explains with an example.

### web (baseline) and mobile

| Type | Extra questions (section: question) | Extra bundle files | Conditional skills |
|---|---|---|---|
| **web app** | S2: Public site or logged-in app? S2: Which devices matter most (phone/desktop)? S3: Do users create accounts, or is it open? S4: What must work with a bad connection or empty data? S6: Where do you host (free tier ok)? | `DATA_MODEL.md` (if stores_data), `ROUTES_SITEMAP.md` | schema-designer, api-designer, ui-ux-pro-max, threat-modeling |
| **mobile app** | S2: iPhone, Android, or both? Native or one codebase (React Native/Flutter/Expo)? S2: Must it work offline? S3: Which phone permissions (camera, location, notifications, contacts) and why each? S4: First-open experience and what happens when the user denies a permission? S6: Publish to App Store / Play Store, or personal/test install? S8: Store review items (privacy labels, screenshots, age rating) | `PLATFORM_PERMISSIONS.md` (permission -> reason text -> denied fallback), `STORE_LISTING.md`, `OFFLINE_SYNC.md` (if offline) | mobile-design (questions), mobile-release (store readiness), schema-designer (device SQLite + sync), threat-modeling |

### game

| Extra questions | Extra bundle files | Conditional skills |
|---|---|---|
| S1: What does the player do in the first 30 seconds (the core loop: act -> feedback -> reward -> repeat)? S2: Engine/platform (Godot, Unity, web/Phaser, mobile) and target frame rate/devices? S4: How does a session start, end, win, lose? What does the player keep between sessions (save data)? S4: Progression: what unlocks, what gets harder, how fast? S5: Name 2-3 similar games and what yours does differently S6: Single or multiplayer; if multiplayer, who hosts? S7: What is the smallest playable slice (vertical slice) | `GDD.md` (pitch, core loop, mechanics, progression, art/audio direction), `CORE_LOOP.md`, `BALANCING.md` (tunable numbers table: value, default, min/max, why), `SAVE_DATA.md` (schema, versioning), `ASSET_LIST.md` | game-design (vudovn, seed only), schema-designer only if online/persistent accounts; game-developer NOT used at planning |

### RAG system

| Extra questions | Extra bundle files | Conditional skills |
|---|---|---|
| S1: Which questions should it answer, and for whom? Give 10 real example questions (becomes the eval set) S3: What is the knowledge source (files, site, DB), how many documents, how often does it change, any private/secret content? S4: What should it do when the answer is not in the documents? Must it show sources? S6: Where does it run (local/cloud), cost ceiling per query? S8: How will we know it is good (target: Recall@k, faithfulness; who labels?) | `CORPUS.md` (sources, formats, size, refresh, access/PII), `CHUNKING_EMBEDDING.md`, `RETRIEVAL_DESIGN.md` (store, hybrid search, rerank, filters), `RAG_EVAL_PLAN.md` (question set, metrics, thresholds, error-analysis loop), `DATA_MODEL.md` (chunk + metadata schema) | rag-architect, evaluate-rag, schema-designer (pgvector), prompt-engineer, threat-modeling (prompt injection via documents) |

### MCP server

| Extra questions | Extra bundle files | Conditional skills |
|---|---|---|
| S1: Which tool/service does the AI need to use, and what 3 jobs should it do first? S2: Local on my machine (stdio) or online for others (HTTP)? Which language? S3: Does the underlying service need login (API key, OAuth)? Whose account, who pays? S4: For each tool: input, output, what can go wrong, is it read-only or does it change things (needs confirmation)? S6: Rate limits, logging, how secrets are stored | `MCP_TOOLS.md` (name, description, input/output schema, read/write, error cases), `TRANSPORT_AUTH.md`, `MCP_EVAL.md` (10 realistic read-only questions with verifiable answers), `INSTALL_MANIFEST.md` (claude config snippet) | mcp-builder (Phase 1-2 + eval), threat-modeling, api-designer |

### n8n / automation workflow

| Extra questions | Extra bundle files | Conditional skills |
|---|---|---|
| S1: What starts it (schedule, webhook, new email/row, button)? What is the finished result? S2: n8n cloud or self-hosted? S3: Which apps/accounts does it touch; who creates each credential? S4: Step by step: input -> app/node -> decision rule -> output; what happens on failure (retry, notify, stop)? S4: Can it run twice by accident (duplicates)? S8: Test with sample data before turning on; who is notified on errors | `WORKFLOW_SPEC.md` (trigger, node list, branches, sub-workflows), `CREDENTIALS_CHECKLIST.md` (credential type, scopes, who creates, never in text fields), `ERROR_HANDLING.md` (retry/idempotency/alerts), `TEST_DATA.md` | n8n-io official lifecycle + credentials-and-security (plan parts), n8n-agents-official (if AI agent), threat-modeling |

### agent skill / plugin (personal AI workflow)

| Extra questions | Extra bundle files | Conditional skills |
|---|---|---|
| S1: What task do you repeat, and when would you say "run it"? (trigger phrases) S2: Which harness(es) (Claude Code, Codex, Gemini CLI, OpenCode...) and Windows/Linux/macOS? S3: Personal profile data it needs (budget, location, preferences), allowed sites, what must never leave the machine? S4: Steps: input -> tool -> decision rule -> output; where must it stop and ask you? S6: Scripts vs prompt: which steps are deterministic? Token budget? S8: 5 test cases: should-trigger, should-not-trigger, edge case | `SKILL_DRAFT.md` (frontmatter + body), `TRIGGERS.md` (positive/negative phrases), `PROFILE_SCHEMA.md`, `TOOLS_LIST.md`, `EVALS.md`, `INSTALL_MANIFESTS.md` | skill-creator, agent-spec, agent-designer (if multi-step agent), prompt-engineer, schema-designer if data is more than a small profile file |

### CLI tool

| Extra questions | Extra bundle files | Conditional skills |
|---|---|---|
| S1: Who runs it (you, scripts, other people)? What does the command name say in one sentence? S2: Language/runtime; single binary or needs a runtime; Windows/Linux/macOS? S4: Input (args, files, stdin), output (text, `--json`), exit codes; destructive actions need confirmation / `--dry-run`? S4: Where do settings live (flags, env vars, config file) and what overrides what? S6: How is it installed and updated (npm, pip, brew, binary)? | `CLI_SPEC.md` (command tree, flags table, examples), `OUTPUT_ERRORS.md` (stdout/stderr, exit-code map), `CONFIG.md`, `INSTALL_RELEASE.md` | create-cli (steipete), schema-designer only if it keeps a local DB (SQLite) |

### browser extension

| Extra questions | Extra bundle files | Conditional skills |
|---|---|---|
| S1: Which websites does it act on, and what does it change or read on them? S2: Chrome only, or Firefox/Edge/Safari too? S3: Which permissions are really needed (each = a reason shown to users)? Does it send page data anywhere? S4: Where does the user interact (toolbar popup, side panel, page overlay, right-click)? S6: Where is data stored (browser storage vs your server); sync across devices? S8: Store listing: description, screenshots, privacy policy | `EXTENSION_MANIFEST_PLAN.md` (contexts: service worker / content script / popup, permissions + justification), `PRIVACY_POLICY_OUTLINE.md`, `STORE_LISTING.md` | threat-modeling (page data, injection), schema-designer only if server sync; no skill reference (authored content) |

### chatbot / AI agent

| Extra questions | Extra bundle files | Conditional skills |
|---|---|---|
| S1: Who talks to it, about what, and what is OUT of scope (it must refuse)? S2: Where does it live (web widget, WhatsApp/Telegram, app, voice)? S3: What knowledge/data does it use; may it act (book, send, pay)? S4: Tone/persona; what does it say when unsure, when angry user, when asked for a human? S6: Memory: forget after chat or remember user? Model/cost ceiling per chat? S8: 20 test conversations incl. jailbreak/off-topic | `AGENT_SPEC.md` (role, scope, tools, handoff-to-human), `CONVERSATION_FLOWS.md` (happy/unhappy dialogs), `PROMPT_SPEC.md`, `GUARDRAILS.md` (refusals, PII, injection), `CHAT_EVAL.md`, `DATA_MODEL.md` (conversations, memory) | agent-designer, prompt-engineer, evaluate-rag (if knowledge base -> also RAG profile), threat-modeling, schema-designer |

Profiles may combine (e.g. chatbot + RAG + web app): `types: [web, rag, chatbot]` -> union questions, dedupe bundle files, one `DATA_MODEL.md`.

## 4. Proposed profile mechanics (for the spec)

- File: `profiles/<id>.yaml` in the skill pack; interview reads the matching profile(s) at S1 (type selection by plain choice + free text "other").
- `extra_questions` are appended to the section's question budget after the base questions; each carries `why` (one plain sentence) and `feeds` (bundle file/section). A question with no `feeds` is rejected by lint.
- `bundle_files` extends the 20-file bundle; gap-lint rule per file ("file exists, non-empty, every `feeds` target answered or marked `unknown` with owner decision").
- `conditional_skills` = names only; fetched at the section that needs them, removed after use (boosters-light policy).
- `stores_data` is a separate flag (not a type): any type can trigger the data module.
- Unknown type: fall back to base interview + ask "what does it produce/store/connect to?" and let the agent build an ad-hoc profile, saved as `profiles/custom.yaml` in the project.

## 5. Open items / not verified

- `BuilderIO/agent-native files-as-database` clone failed; unverified.
- `czlonkowski/n8n-skills` workflow-patterns, `sickn33` browser-extension-builder, `xenitv1` browser-extension (manifest auditor), `borghei` rag-architect, `hamelsmu` other eval skills: leads from search, not read.
- Stars/licenses: from `gh api` + LICENSE files; anthropics skills use per-skill LICENSE.txt (Apache seen in map, mcp-builder LICENSE.txt present but not opened here).
- clig.dev license (CC BY-SA, snippet only) before vendoring any CLI rubric text.
- ERD format decision (Mermaid vs ASCII) is owner/spec call.
- All scores are reading-based estimates, not execution.
