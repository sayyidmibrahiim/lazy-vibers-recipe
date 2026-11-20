# Spec 07 — Research, Citations, Freshness

Version: v1 (ticket 26). Date: 2026-11-20. Constitution: principles 1 (Evidence-first) and 14 (Research what the user doesn't know). Freshness limits: owner ruling R2.

This file is the contract for the research procedure and for the two script commands that check it: `cite check` and `research log` in `scripts/lvr.mjs`. Everything marked **normative** is exact: the Conductor writes it, the script parses it, and tests compare against it. The installed skills carry a compact copy in `references/conventions.md` §10.

## 1. Web research is a hard requirement

- Web research = a working web search tool **and** a working page-fetch tool (built into the harness, or an MCP server). Search alone cannot read a primary pricing or regulation page; fetch alone cannot find one.
- **Web research check** (every tier, every skill that interviews or researches): run one real search with a neutral query that is not about the user's idea (for example `Node.js release schedule`), then fetch one result page and read its text. Pass: the search returned at least one result URL, and the fetch returned readable page text (not an error, a login wall, or an empty page).
- Pass → journal it as `research_logged` with `purpose: "web_check"` (§5). In `/lvr-init-new-idea` the check runs before `.lvr/` exists, so it is journaled right after `session_start`.
- Fail → say the cause (no search tool, no fetch tool, or the error text), give the enable steps for common harnesses (§1.1), and **stop**. Never continue on memory; there is no degraded research mode. In `/lvr-init-new-idea` nothing is written (re-running is clean). In `/lvr-continue` the failed check is journaled (`outcome: "failed"`, `reason`) and the project stays as it was.

### 1.1 Enable guidance (English source, checked 2026-11-20)

- **Claude Code** — allow the `WebSearch` and `WebFetch` tools in the permission settings. On Amazon Bedrock, web search is not available: add a search MCP server. On Google Cloud (Google managed), web search needs Opus 4, Sonnet 4, Haiku 4.5 or a later model. [cite: version · https://code.claude.com/docs/en/feature-availability · n.d. · acc 2026-11-20 · primary · live]
- **Codex CLI** — set `web_search = "live"` in `~/.codex/config.toml`, or start Codex with `codex --search`. The default `"cached"` mode serves results from a cache, which can be older than the 30-day price limit; `"disabled"` turns the tool off. [cite: version · https://learn.chatgpt.com/docs/config-file/config-basic · n.d. · acc 2026-11-20 · primary · live] [cite: version · https://learn.chatgpt.com/codex/local-config · n.d. · acc 2026-11-20 · primary · live]
- **Gemini CLI** — keep the built-in `google_web_search` and `web_fetch` tools enabled (do not exclude them in `settings.json`). Gemini CLI is being replaced by Antigravity CLI; there, check that its web tools are enabled. [cite: version · https://geminicli.com/docs/cli/tutorials/web-tools/ · upd 2026-02-13 · acc 2026-11-20 · primary · live]
- **OpenCode** — allow web search when it asks on first use and pick a provider (`/connect` in the TUI, or the provider's environment variable); `"websearch": false` in `opencode.jsonc` turns it off. [cite: version · https://opencode.ai/docs/websearch/ · n.d. · acc 2026-11-20 · primary · live]
- **Any harness** — add a web search and fetch MCP server (for example Firecrawl, Brave Search, or Exa) with its API key, then restart the harness.

The skills keep this list as plain text (no tags) in their stop message; this spec keeps the sources.

## 2. Domain Brief and per-Section scans

- **Domain Brief** — `.lvr/docs/research/domain-brief.md`, built right after S0 closes and before S1's first batch, on the confirmed idea and market (`S0` metadata). It lists what a person in the user's position usually does not know: rules and regulations for the market, typical and hidden costs, common failure modes, key terms, what similar users expect. Target: 8–15 items. Every item has an id `U-NN`, a source (§3), a target Section (`S1`–`S8`), and a `Became` cell. Template and search lists: `skills/lvr-init-new-idea/references/sections/S0-domain-brief.md`.
- **Per-Section scan** — before the first batch of each Section S1–S8 (once per Section; a loop-back does not re-scan):
  - S1–S4: at least one targeted search for the Section's topic in the user's market.
  - S5: the deep research is the scan; it starts with the brief items targeted at S5.
  - S6–S8: the freshness re-check — `cite check --all`; every expired fact is researched again before the Section uses it — plus targeted searches as needed.
  - New items are appended to the brief's `## Per-section scans` table (same columns, ids continue). A scan with nothing new records one line: `- <S> scan (RQ-NNN): no new unknowns — <reason>`.
- **Presenting** — before the Section's first batch, the open items targeted at the Section (brief or scan) are shown to the user as "Things you may not know", in the User Language, each with its source site and date. Each item then becomes either a question (it counts toward the tier's batch size) or a `designer_filled` decision whose rationale cites the item (`U-NN`) and its tag. The `Became` cell records the answer id or decision id.
- **Journal** — each research step of the brief or a scan is one `context_research` event (§5).
- **Decisions on unverified facts** — a decision that rests on an `unverified` fact is never `designer_filled`: the user confirms it (`user_confirmed`), or it becomes an S6 blocking risk.
- **Recommendations** cite the research they rest on (a `U-NN` item or a cite tag); "best practice" or "industry standard" is never a reason on its own.

## 3. Citation syntax (normative)

### 3.1 Cite tag

One source for one claim:

```
[cite: <category> · <url> · <date> · acc <YYYY-MM-DD>( · <flag>)*]
```

- The tag opens with the literal `[cite: ` (lowercase) and closes with `]`. Fields are separated by ` · ` (space, U+00B7 middle dot, space). A tag inside inline code or a fenced code block is not a tag.
- `<category>` — a key of `freshness.json` → `categories` (§4).
- `<url>` — starts with `http://` or `https://`; no spaces; a space is written `%20` and `]` is written `%5D`.
- `<date>` — the date the page itself states: `pub YYYY-MM-DD` (published) or `upd YYYY-MM-DD` (last updated; prefer `upd` when the page shows both); `YYYY-MM` or `YYYY` instead of a full date when the page gives only that; `n.d.` when the page states no date.
- `acc YYYY-MM-DD` — the day the Conductor read the page. Required.
- Flags, each at most once, in any order after `acc`:
  - `primary` — the source owns the fact: the vendor's own pricing or docs page, the regulator's or government's publication, the law text, the official statistics office.
  - `live` — the value was read off the live page on the access date (a pricing page showing today's price).
  - `amend-check YYYY-MM-DD` — on that day the Conductor searched for newer amendments of the cited regulation and found none.
- Examples:
  - `Vercel Hobby costs USD 0/month [cite: price · https://vercel.com/pricing · n.d. · acc 2026-11-20 · primary · live]`
  - `Personal data law applies to the booking list [cite: regulation · https://www.example-regulator.go.id/law-27-2022 · pub 2022-10-17 · acc 2026-11-20 · primary · amend-check 2026-11-20]`

### 3.2 Group

The evidence for one claim is a **group**: one or more cite tags with only whitespace between them (`[cite: …] [cite: …]`). A table cell boundary (`|`) or any other text ends the group. All tags in a group share one category. A group holds cite tags or exactly one unverified marker, never both.

### 3.3 Unverified marker

```
[unverified: <category> · RQ-NNN(, RQ-NNN)*]
```

Allowed only after research really failed: every `RQ-NNN` names a journaled `research_logged` or `context_research` event with `outcome: "failed"` and at least one non-empty query. The bare word "unverified" is not a marker; write it in backticks when talking about markers.

### 3.4 User facts

A fact the user stated (their budget, devices, country) is sourced by its answer id `S<n>.q<n>` on the same line. Only a recorded, non-skipped answer counts.

## 4. Freshness (`freshness.json`, normative)

Source of truth: `skills/lvr-freshness.json`, synced byte-identical to `skills/<skill>/references/freshness.json` by `npm run sync:skills`. One file, used everywhere.

```json
{ "schema_version": 1, "note": "…",
  "categories": { "<category>": { "max_age_days": 30, "key_fact": true, "clock": "standard", "covers": "…" } } }
```

- `categories` keys are the only valid categories. Each entry needs `max_age_days` (integer ≥ 1), `key_fact` (boolean: the source rule in §4.2 applies), `clock` (`standard | published | amendment`), and `covers` (string). Other top-level keys are ignored. A missing field or a wrong type makes the file invalid.
- v1 content:

| Category | max_age_days | key_fact | clock | Covers |
|---|---|---|---|---|
| `price` | 30 | yes | standard | prices, fees, interest and loan rates, commissions, purchase taxes, plan costs, exchange rates |
| `quota` | 30 | yes | standard | free-tier limits, quotas, rate limits, caps |
| `version` | 30 | yes | standard | software and API versions, release and support status |
| `legal` | 60 | yes | standard | terms of service, vendor policies, licences, vendor availability by country |
| `regulation` | 60 | yes | amendment | laws, government and central-bank rules, permits, tax law, data-protection law |
| `market` | 90 | no | standard | competitors, comparable products, market practice, user expectations |
| `statistic` | 365 | no | published | published statistics, surveys, datasets |
| `general` | 365 | no | standard | definitions, how things work, key terms, failure modes |

`price`, `quota`, `version` 30 days, `legal` 60, `market` 90, `statistic` 365, and the amendment rule for regulations are the R2 ruling. `regulation` uses the `legal` limit for its amendment check; `general` is an LVR addition.

- Script lookup order: `--freshness PATH`, then `<script dir>/../references/freshness.json`, then `<script dir>/../skills/lvr-freshness.json`. Not found → `FRESHNESS_MISSING`; unreadable or invalid → `FRESHNESS_INVALID`. Both are `ok:false`, exit 1, nothing checked.

### 4.1 Dates and age

- `today` = the UTC date of `LVR_NOW` when set, else of the system clock.
- A partial date resolves to the first day of its period (`pub 2026-05` → 2026-05-01, `pub 2025` → 2025-01-01): the conservative reading.
- `age(d)` = whole days from `d` to `today`. A cite is **fresh** when `age ≤ max_age_days`.
- As-of date of one valid cite, by the category's clock:
  - `standard` — `acc` when the cite has `live`; otherwise its `pub`/`upd` date. `n.d.` without `live` → I4.
  - `published` — its `pub`/`upd` date (`live` is ignored). `n.d.` → I4.
  - `amendment` — no per-cite date: the group's as-of date is its newest `amend-check`. `n.d.` → I4.

### 4.2 Group rules

Cites with I3, I4 or I5 findings are dropped from their group first; a group with no cite left gets no further findings.

1. Freshness:
   - `standard` and `published`: no cite in the group is fresh → I6. One fresh cite keeps the group fresh (the freshest source wins).
   - `amendment`: no cite has `amend-check` → I8; otherwise the newest `amend-check` older than `max_age_days` → I6.
2. Source rule, for `key_fact` categories, only when step 1 passed: the fresh cites (amendment: all remaining cites) include at least one `primary` cite, or come from at least two different registrable domains. Otherwise → I7.

**Registrable domain**: lowercase the host and strip a leading `www.`; an IP address is its own domain. When the host has at least 3 labels, its last label has 2 letters, and its second-to-last label is one of `ac biz co com desa edu go gov mil my ne net or org ponpes sch web`, keep the last 3 labels; otherwise keep the last 2. So `docs.vercel.com` = `vercel.com`, `www.ojk.go.id` = `ojk.go.id`, and `bi.go.id` ≠ `ojk.go.id`.

## 5. Research log events (normative)

Every research step (one topic, any number of queries) is journaled once, found or failed. Both types are informational in v1 replay (no state field) and are valid before `state.json` exists (the journal must exist: after `session_start`).

`research_logged`:

```json
{ "id": "RQ-004", "section": "S2", "purpose": "claim", "topic": "Vercel Hobby plan price and terms",
  "queries": ["vercel hobby plan price", "fetch https://vercel.com/pricing"],
  "sources": [ { "url": "https://vercel.com/pricing", "title": "Vercel Pricing", "published": null, "updated": null,
                 "accessed": "2026-11-20", "primary": true, "live": true } ],
  "outcome": "found", "reason": null, "conflicts": [] }
```

- `id` — assigned by the script: `RQ-` + the next number across both event types (max + 1), at least 3 digits. A payload that carries `id` is refused.
- `section` — `S0`…`S9`, or `null` (the web check before S0).
- `purpose` — `web_check | claim | s5 | refresh | feature | recheck`.
- `topic` — non-empty English text.
- `queries` — at least one non-empty string: each search query as typed; a direct page read is written `fetch <url>`.
- `sources` — array of `{ url, title?, published?, updated?, accessed, primary?, live? }`: `url` http(s); `published`/`updated` `YYYY`, `YYYY-MM`, `YYYY-MM-DD` or null; `accessed` `YYYY-MM-DD`, not after today; `primary`, `live` booleans (default false). `outcome: "found"` needs at least one source.
- `outcome` — `found | failed`. `failed` needs `reason`: a non-empty string saying why nothing usable was found.
- `conflicts` — optional: `[{ "claim", "kept": <url>, "dropped": [<url>], "why" }]`, written whenever sources disagree; the freshest primary source wins.

`context_research` — the same fields without `purpose`, plus:

- `scope` — `brief | scan`. `brief` needs `section: "S0"`; `scan` needs `S1`…`S8`.
- `findings` — the `U-NN` ids this step added or updated. `brief` needs at least one; `scan` may be empty when `note` says why.
- `note` — optional string, for example `no new unknowns — the S2 costs were all covered by U-04…U-07`.

### 5.1 `research log` command

`node lvr.mjs research log (--in FILE|- | --payload JSON) [--context] [--dir DIR]`

- Validates the payload per §5; a bad field → `INVALID_PAYLOAD` (`details.field`, `details.expected`), nothing written.
- Assigns `id`, appends `research_logged` (default) or `context_research` (`--context`) with one checkpoint, like `journal append`.
- Output: the `journal append` envelope plus `"id": "RQ-NNN"` and `"type"`.

## 6. `cite check` command (normative)

`node lvr.mjs cite check (--all | --file PATH [--file PATH …]) [--freshness PATH] [--dir DIR]`

- Read-only. Neither or both of `--all` / `--file` → `MISSING_FLAG` (usage, exit 2). A `--file` outside the project folder → `PATH_OUTSIDE_PROJECT`; missing → `FILE_NOT_FOUND`; not `.md` → `INVALID_PATH` (all exit 1).
- Reads `.lvr/state.json` (answer ids, decisions, Section statuses) and `.lvr/journal.ndjson` (RQ events) when present.
- Exit 0 whenever the check ran: findings are data (`clean: false`).

### 6.1 Files

- `--all` scans, when present, in this order: `.lvr/docs/sections/*.md` (by name), `.lvr/docs/research/*.md` (by name), then the bundle Markdown files in conventions §8 order: `AGENTS.md`, `OVERVIEW.md`, `DECISIONS.md`, `SPEC/prd.md`, `SPEC/requirements.md`, `SPEC/data-model.md`, `SPEC/api.md`, `SPEC/architecture.md`, `USER_FLOWS.md`, `CODE_STYLE.md`, `SECURITY.md`, `RESEARCH.md`, `SCOPE.md`, `MILESTONES.md`, `VERIFICATION.md`, `ASSUMPTIONS.md`, `HANDOVER.md`, `CAPABILITIES.md`. It also checks `decisions[]` in `.lvr/state.json` for I11.
- Never scanned: `blueprint.json`, `CLAUDE.md`, `GEMINI.md`, `HANDOFF-PROMPT.md`, `brand/`, `.lvr/recheck/`.
- Ignored inside a file: fenced code blocks (```` ``` ```` or `~~~`), inline code spans, HTML comments, and in `VERIFICATION.md` every `## Build log — …` section.

### 6.2 Zones (where a missing source is a finding)

- **Source tables** — in any scanned file, a GFM table whose header row has a cell that starts with "source" (case-insensitive, after trimming and removing `*` and `_`). Every data row needs a source.
- **Research zones** — the whole of `RESEARCH.md`, `.lvr/docs/sections/S5-research.md` and every `.lvr/docs/research/*.md`; the `## Prices quoted` section of `.lvr/docs/sections/S2-*.md`; the `## What it costs` section of `OVERVIEW.md`. A section runs to the next heading of the same or a higher level. Every line or row that states one of these needs a source:
  - **price** — a currency mark next to a digit: `Rp`, `IDR`, `USD`, `US$`, `$`, `€`, `EUR`, `£`, `GBP`, `SGD`, `S$`, `MYR`, `RM`, `INR`, `₹`, `¥`, `JPY` before the number (one optional space between), or `IDR`, `USD`, `EUR`, `GBP`, `SGD`, `MYR`, `INR`, `JPY`, `rupiah`, `dollar`, `dollars` after it;
  - **fee or rate** — a number followed by `%`, on a line that also has a word starting with `fee`, `rate`, `interest`, `commission`, `mdr`, `tax`, `vat`, `levy`, `charge`, `payment`, `transaction`, `bunga`, `biaya`, `pajak`, `komisi`, `provisi`, `denda`, `cicilan`, `transaksi` or `pembayaran` (case-insensitive);
  - **version** — `v` + digits with at least one `.digits` (`v4.2`), or three dot-separated numbers (`16.2.1`).
- A line or row **has a source** when it holds a cite group, an unverified marker, the bare word "unverified" (reported as I9, never also as I1), or the answer id of a recorded, non-skipped answer (when `state.json` is unreadable, any `S<n>.q<n>` counts and warning `NO_STATE` is added).
- Exempt: headings, table header and separator rows, and rows whose first cell (without `*` and `_`) starts with "Total" (case-insensitive).

### 6.3 Checks everywhere

In every scanned file, outside the ignored text:

- every cite tag and unverified marker is parsed and checked (I3–I10);
- memory phrases, case-insensitive: `model knowledge`, `model-knowledge`, `assistant's memory` (straight or curly apostrophe), `from memory`, `no live check`, `training data`, `knowledge cutoff` → I2;
- the bare word `unverified` (whole word, outside a marker) → I9;
- recommendation phrases on a line with no cite group, case-insensitive: `best practice`, `best practices`, `industry standard`, `industry-standard`, `experts recommend`, `recommended by experts`, `widely recommended`, `commonly recommended` → I12; and a section whose heading starts with "Recommended" or is "Stack comparison and trade-offs" with no cite tag in it → I12;
- `designer_filled` decisions resting on an unverified fact → I11. Decision text read from: `decisions[]` in `state.json` (`summary` + `rationale`; `--all` only), `DECISIONS.md` table rows whose `Status` cell is `designer_filled`, `ASSUMPTIONS.md` blocks whose `## D-NNN …` heading ends in `(designer_filled)` (to the next `## `), and record lines matching `**D-NNN** … status: designer_filled`. It rests on an unverified fact when its text holds an unverified marker, the bare word "unverified", or a `U-NN` whose Domain Brief row has an unverified marker or the bare word in its Source cell. One finding per decision per file.
- In `.lvr/docs/research/domain-brief.md`: each table row whose first cell is `U-NN` is a brief item. The table needs `Section` and `Became` columns. When `state.json` is readable and the item's Section is `done`, its `Became` cell must hold an answer id (`S<n>.q<n>`) or a decision id (`D-NNN`) → else I13. A missing or invalid Section cell (not `S1`–`S8`) → I13.
- Warning `NO_DOMAIN_BRIEF` when `state.json` says S0 is `done` and the brief file is missing (a project started before ticket 26; `/lvr-continue` builds it). Warning `NO_JOURNAL` when the journal is missing: no `RQ` id resolves, so every unverified marker is I9.

### 6.4 Findings (normative ids, codes, messages)

Each finding: `{ "id", "group": "I", "code", "file", "line", "message", "owner", "kind": "bundle_gap", "needs_model": false, "claim" }`. `line` is 1-based (null for `state.json`). `claim` is the trimmed source line, cut to 160 characters with `…`. Messages use these exact templates (`<…>` filled in):

| ID | code | Fires when | Message |
|---|---|---|---|
| I1 | `missing_source` | a Source-table row has no source | `No source on this row of a Source table: add a [cite: …] tag, an [unverified: …] marker, or the answer id it came from.` |
| I1 | `missing_source` | a research-zone line states a price, fee or rate, or version with no source | `States a <price\|fee or rate\|version> with no source: add a [cite: …] tag, an [unverified: …] marker, or the answer id it came from.` (first kind found, in that order) |
| I1 | `missing_source` | the line's only source is an answer id that is not a recorded, non-skipped answer | `Answer id <id> is not a recorded answer, so it cannot be the source.` |
| I2 | `memory_source` | a memory phrase | `Cites model memory ("<phrase>"): research the fact and cite it, or log the failed research and use an [unverified: …] marker.` |
| I3 | `malformed_cite` | a tag, group or marker breaks §3 | `Malformed tag: <reason>.` — reason one of: `unknown category "<x>"` · `URL must start with http:// or https://` · `date must be pub or upd YYYY[-MM[-DD]], or n.d.` · `access date must be acc YYYY-MM-DD` · `unknown or repeated flag "<x>"` · `wrong number of fields` · `tag is not closed` · `mixed categories in one claim (<a>, <b>)` · `cite and unverified marker in one claim` · `unverified marker needs a category and at least one RQ-NNN` |
| I4 | `missing_date` | `n.d.` without `live` (standard clock) | `No date for a <category> fact: give pub or upd from the page, or add live if the value was read off the live page.` |
| I4 | `missing_date` | `n.d.` on a published or amendment clock | `A <category> source needs its published date; n.d. is not allowed.` |
| I5 | `bad_date` | an impossible date, a date after today, or `pub`/`upd` after `acc` | `Impossible date <d>.` · `Date <d> is after today (<today>).` · `Published date <d> is after the access date <acc>.` |
| I6 | `expired` | §4.2 step 1 | `Expired <category> fact: the newest source is <age> days old (limit <max>): research it again.` · amendment: `Amendment check is <age> days old (limit <max>): search for newer amendments again.` |
| I7 | `single_source` | §4.2 step 2 | `Key <category> fact rests on one non-primary source (<domain>): add a primary source or a second independent one.` |
| I8 | `amendment_unchecked` | §4.2 step 1, amendment | `Regulation cited without an amendment check: confirm there is no newer amendment and add amend-check YYYY-MM-DD.` |
| I9 | `unverified_no_queries` | the bare word | `Bare "unverified" with no research log: research the fact, or log the failed research and write [unverified: <category> · RQ-NNN].` |
| I9 | `unverified_no_queries` | a marker id that does not resolve | `<RQ-NNN> is not a failed research_logged or context_research event with queries.` |
| I10 | `unverified_stale` | the newest referenced RQ event is older than the category limit | `Failed research <RQ-NNN> is <age> days old (limit <max> for <category>): try the research again.` |
| I11 | `designer_filled_unverified` | §6.3 | `designer_filled decision <D-NNN> rests on an unverified fact: ask the user to confirm it, or record it as an S6 blocking risk.` |
| I12 | `unsourced_recommendation` | a phrase / a section | `Recommendation leans on "<phrase>" with no citation: cite the research it rests on.` · `Recommendation section "<heading>" has no citation: cite the research behind it.` |
| I13 | `brief_unresolved` | §6.3 | `Domain Brief item <U-NN> has no target Section (S1–S8).` · `Domain Brief item <U-NN> never became a question or decision, but <S> is done: record the answer id or decision id in Became.` · `Domain Brief table lacks the Section or Became column.` |

Order of checks inside one tag: I3, then I4 and I5; a tag with any of these leaves its group (§4.2). A marker: I3, then I9, then I10. One I1 per line at most. Findings sort by file (scan order), then line, then the number in the id; `state.json` findings come last, by decision id.

**Owner**: `.lvr/docs/sections/S<n>-*.md` → `S<n>` (`S4-additions.md` → `lvr-add-feature`); a Domain Brief item row → its Section cell when valid, else `S0`; other `.lvr/docs/research/*.md` lines → `S0`; `state.json` → the decision's `section`; bundle files → `S9`.

### 6.5 `needs_model`

Fixed items, emitted when at least one file was scanned, each `{ "id", "group": "I", "file": "all scanned files", "message", "owner": "S9", "kind": "bundle_gap", "needs_model": true }`:

- `I1` — Check prose facts the script cannot see (no number: rules, availability, "free", "supports X", competitor facts) for a cite tag, an unverified marker, or an answer id; facts restated outside the zones carry the same tag as their source line.
- `I3` — Check that each cite's category fits the fact (a price tagged `market` or `general` dodges the 30-day limit).
- `I6` — Check that each cited page really states the claim, and that `primary`, `live` and `amend-check` are honest.
- `I7` — Check that sources counted as independent are not one source republished, and that disagreeing sources are recorded as a conflict with the winner named.
- `I12` — Check that every recommendation traces to the research (a `U-NN` item or a cite), not to taste.

### 6.6 Output

```json
{ "ok": true, "cmd": "cite check", "today": "2026-11-20", "clean": false,
  "files": ["RESEARCH.md"],
  "findings": [ { "id": "I6", "group": "I", "code": "expired", "file": "RESEARCH.md", "line": 37,
                  "message": "Expired price fact: the newest source is 43 days old (limit 30): research it again.",
                  "owner": "S9", "kind": "bundle_gap", "needs_model": false, "claim": "| Vercel Pro | USD 20/month | …" } ],
  "needs_model": [ … ],
  "stats": { "files": 1, "tags": 12, "groups": 9, "by_category": { "price": 6, "market": 3 }, "unverified": 0, "brief_items": 0 },
  "warnings": [ { "code": "NO_DOMAIN_BRIEF", "message": "…" } ] }
```

`clean` = no findings. `stats.tags` counts every parsed tag (valid or not); `groups` and `by_category` count groups whose category is valid; `unverified` counts markers; `brief_items` counts `U-NN` rows.

## 7. Callers

- `/lvr-init-new-idea` — web research check (Step 1); Domain Brief after S0, then `cite check --file .lvr/docs/research/domain-brief.md` until clean; the per-Section scan in the engine (S6–S8 run `cite check --all`); `cite check --file .lvr/docs/sections/S5-research.md` before S5 closes; S9 cross-check rule X8.
- `/lvr-continue` — the web research check before any Section work; finishes a missing or partial Domain Brief before the next batch.
- `/lvr-handoff` — gap lint group I: `lint run` runs the `cite check --all` checks and adds the I findings and `needs_model` items to its output (`--group I` alone is allowed; `--journal` journals them as `gap_found` like any finding). Prose fallback: `references/lint-checklist.md` group I.
- `crosscheck` — rule X8 "Every claim carries a valid, fresh citation or a logged unverified marker" = ids I1–I13. X6 (E4) defers to group I: E4 accepts a date, a `[cite: …]` tag or an `[unverified: …]` marker, never a bare `unverified` (which I9 forbids).
- `/lvr-recheck-plan`, `/lvr-add-feature` — research follows the same syntax, limits and events; `cite check` lists expired facts (their full rework: tickets 33 and 29).

## 8. Script changes this spec asks for (phase 2)

- `EVENT_TYPES`: append `research_logged`, `context_research` after `resume`, and add both to the conventions §3 "Event types:" line in the same order in the same change (`npm run check:skills` compares the two lists).
- Both events replay as informational; `research log` validates per §5.
- `cite check` per §6; `LINT_GROUPS` gains `I`; `crosscheck` gains X8.
- Load `freshness.json` per §4 (never hard-code the limits).

### 8.1 As built (phase 2)

- `cite check --file` may repeat; a `--freshness PATH` that does not exist is `FRESHNESS_MISSING` (an explicit path never falls through to the defaults).
- `lint run` runs group I with the same analysis as `cite check --all`; `--group I` alone is allowed; its output has no `warnings` field.
- `research log` and `journal append --type research_logged|context_research` share one path: the script assigns `RQ-NNN` under the lock; a payload `id` is refused by both.
- E4 no longer accepts a bare `unverified` (ruling 7); E4 messages are unchanged.
