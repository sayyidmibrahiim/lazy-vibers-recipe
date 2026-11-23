# Spec 07 — Research, Citations, Freshness

Version: v1.1 (ticket 26, hardened by ticket 40). Date: 2026-11-20. Constitution: principles 1 (Evidence-first) and 14 (Research what the user doesn't know). Freshness limits: owner ruling R2.

This file is the contract for the research procedure and for the two script commands that check it: `cite check` and `research log` in `scripts/lvr.mjs`. Everything marked **normative** is exact: the Conductor writes it, the script parses it, and tests compare against it. The installed skills carry a compact copy in `references/conventions.md` §10.

## 1. Web research is a hard requirement

- Web research = a working web search tool **and** a working page-fetch tool (built into the harness, or an MCP server). Search alone cannot read a primary pricing or regulation page; fetch alone cannot find one.
- **Web research check** (every tier, every skill that interviews or researches): run one real search with a neutral query that is not about the user's idea (for example `Node.js release schedule`), then fetch result pages one at a time, **up to 3 different results**, and read their text. Pass: the search returned at least one result URL, and at least one of those fetches returned readable page text (not an error, a login wall, or an empty page). One site refusing the fetch (403, 404, login wall, empty page) is not a failure: take the next result. Fail: the search errored, returned no result URL, or all 3 fetches failed.
- Pass → journal it as `research_logged` with `purpose: "web_check"` (§5). In `/lvr-init-new-idea` the check runs before `.lvr/` exists, so it is journaled right after `session_start`.
- Fail → say the cause (no search tool, no fetch tool, or the error text), give the enable steps for common harnesses (§1.1), and **stop**. Never continue on memory; there is no degraded research mode. In `/lvr-init-new-idea` nothing is written (re-running is clean). In `/lvr-continue` the failed check is journaled (`outcome: "failed"`, `reason`) and the project stays as it was.

### 1.0 A tool outage is not failed research (A14)

- `outcome: "failed"` on a research step (§3.3, §5) means only one thing: **search and fetch both worked and nothing usable was found**. Usable = a page that states the fact and passes the freshness limit.
- Outage = the search tool errors (an error, a timeout, "tool not available", "not permitted"; not "0 results"), or no readable page could be fetched from up to 3 different results of one query and again from up to 3 results of one differently worded second query. An outage is **not** research: never write `failed` for it, never write an `[unverified: …]` marker for it (the script enforces this: a marker whose `RQ-NNN` is a failed `web_check` event is I9, §3.3), never carry on.
- On an outage in any step of any skill: say the cause (the error text), give the enable steps (§1.1), and **stop**, exactly like a failed web check. Journal one `research_logged` with `purpose: "web_check"`, the current `section`, `outcome: "failed"` and the error text as `reason` (in `/lvr-init-new-idea` before `.lvr/` exists: nothing is written). `/lvr-continue` re-runs the web check before any work, so the run resumes cleanly.
- One page that refuses a fetch while search and the other fetches work is neither an outage nor a failure: take the next result (up to 3), then judge by the rules above.

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
  - **Brief freshness gate (A13), first, in S1–S5** (S6–S8 use `cite check --all`, below): run `cite check --file .lvr/docs/research/domain-brief.md`. For every finding whose `owner` is this Section and whose id is I6, I7, I8 or I10 (the item's source expired, or is too thin, or its failed research went stale) and whose item is still open (`Became` empty): research the item again (one `context_research` step, `scope: "scan"`, `findings` = that item, `note` saying it is a refresh), replace its `Source` cell, and run the check again. Repeat until no such finding is left for this Section's items. Items whose research failed again become `[unverified: …]` markers (§3.3) and are questions, never decisions. Only then does the scan search for new unknowns and show the items.
  - S1–S4: at least one targeted search for the Section's topic in the user's market.
  - S5: the deep research is the scan; it starts with the brief items targeted at S5.
  - S6–S8: the freshness re-check — `cite check --all`; every expired fact is researched again before the Section uses it — plus targeted searches as needed.
  - New items are appended to the brief's `## Per-section scans` table (same columns, ids continue). A scan with nothing new records one line: `- <S> scan (RQ-NNN): no new unknowns — <reason>`.
- **Presenting** — before the Section's first batch, the open items targeted at the Section (brief or scan) are shown to the user as "Things you may not know", in the User Language, each with its source site and date (the date is the page's own `pub`/`upd` date, or the access date for a `live` read; never "I checked it today" without it). Each item then becomes either a question (it counts toward the tier's batch size) or a `designer_filled` decision whose rationale cites the item (`U-NN`) and its tag. The `Became` cell records the answer id or decision id.
- **Journal** — each research step of the brief or a scan is one `context_research` event (§5).
- **Decisions on unverified facts** — a decision that rests on an `unverified` fact is never `designer_filled`: the user confirms it (`user_confirmed`), or it becomes an S6 blocking risk. "Rests on" follows every link (§6.3 I11): a marker or the bare word in its text, a `U-NN` whose Source is unverified, the id of a failed research event, a brief item that names it in `Became`, or another decision that itself rests on one.
- **Recommendations** cite the research they rest on (a `U-NN` item or a cite tag); "best practice" or "industry standard" is never a reason on its own.

## 3. Citation syntax (normative)

### 3.1 Cite tag

One source for one claim:

```
[cite: <category> · <url> · <date> · acc <YYYY-MM-DD>( · <flag>)*]
```

- The tag opens with the literal `[cite: ` (lowercase) and closes with `]`. Fields are separated by ` · ` (space, U+00B7 middle dot, space). A tag inside inline code or a fenced code block is not a tag.
- `<category>` — a key of `freshness.json` → `categories` (§4).
- `<url>` — starts with `http://` or `https://`; no spaces; a space is written `%20` and `]` is written `%5D`. It must parse as a URL whose host is a public site (A7): the host name contains a dot and is not `localhost`, `*.localhost`, `*.local`, `*.internal`, or an IPv4 address in a private, loopback, link-local, carrier-grade (100.64/10), multicast or reserved range (`0.*`, `10.*`, `100.64–127.*`, `127.*`, `169.254.*`, `172.16–31.*`, `192.168.*`, `224+.*`). A public IPv4 address passes and is its own registrable domain (§4.2). IPv6 literals have no dot and are refused.
- `<date>` — the date the page itself states: `pub YYYY-MM-DD` (published) or `upd YYYY-MM-DD` (last updated; prefer `upd` when the page shows both); `YYYY-MM` or `YYYY` instead of a full date when the page gives only that; `n.d.` when the page states no date.
- `acc YYYY-MM-DD` — the day the Conductor read the page. Required.
- Flags, each at most once, in any order after `acc`:
  - `primary` — the source owns the fact: the vendor's own pricing or docs page, the regulator's or government's publication, the law text, the official statistics office.
  - `live` — the value was read off the live page on the access date (a pricing page showing today's price).
  - `amend-check YYYY-MM-DD` — on that day the Conductor searched for newer amendments of the cited regulation and found none. It cannot be earlier than the tag's `pub`/`upd` date (A8; a search for amendments before the text existed proves nothing).
- Examples:
  - `Vercel Hobby costs USD 0/month [cite: price · https://vercel.com/pricing · n.d. · acc 2026-11-20 · primary · live]`
  - `Personal data law applies to the booking list [cite: regulation · https://www.example-regulator.go.id/law-27-2022 · pub 2022-10-17 · acc 2026-11-20 · primary · amend-check 2026-11-20]`

### 3.2 Group

The evidence for one claim is a **group**: one or more cite tags with only whitespace between them (`[cite: …] [cite: …]`). A table cell boundary (`|`) or any other text ends the group. All tags in a group share one category. A group holds cite tags or exactly one unverified marker, never both.

### 3.3 Unverified marker

```
[unverified: <category> · RQ-NNN(, RQ-NNN)*]
```

Allowed only after research really failed: every `RQ-NNN` names a journaled `research_logged` or `context_research` event with `outcome: "failed"` and at least one non-empty query. An event with `purpose: "web_check"` never counts (B1): it records a tool outage (§1.0), and an outage is not research, so a marker that names it is I9 with the message `<RQ-NNN> is a failed web check (a tool outage), not failed research: enable the web tools and research the fact again.` The bare word "unverified" is not a marker; write it in backticks when talking about markers.

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

`price`, `quota`, `version` 30 days, `legal` 60, `market` 90, `statistic` 365, and the amendment rule for regulations are the R2 ruling. `regulation` uses the `legal` limit twice (orchestrator ruling 2 on ticket 26: "regulation source and amend-check both 60 days"): for its amendment check and for the day its source was read (A12; §4.2); `general` is an LVR addition.

- Script lookup order: `--freshness PATH`, then `<script dir>/../references/freshness.json`, then `<script dir>/../skills/lvr-freshness.json`. Not found → `FRESHNESS_MISSING`; unreadable or invalid → `FRESHNESS_INVALID`. Both are `ok:false`, exit 1, nothing checked.

### 4.1 Dates and age

- `today` = the UTC date of `LVR_NOW` when set, else of the system clock.
- A partial date resolves to the first day of its period (`pub 2026-05` → 2026-05-01, `pub 2025` → 2025-01-01): the conservative reading.
- `age(d)` = whole days from `d` to `today`. A cite is **fresh** when `age ≤ max_age_days`.
- As-of date of one valid cite, by the category's clock:
  - `standard` — `acc` when the cite has `live`; otherwise its `pub`/`upd` date. `n.d.` without `live` → I4.
  - `published` — its `pub`/`upd` date (`live` is ignored). `n.d.` → I4.
  - `amendment` — no per-cite freshness date from `pub`/`upd` (a law's own publication date is its enactment date and never ages out); the group has two as-of dates: its newest `amend-check` and its newest `acc` (the day the source was read). Both must be within `max_age_days` (A12). `n.d.` → I4.

### 4.2 Group rules

Cites with I3, I4 or I5 findings are dropped from their group first; a group with no cite left gets no further findings.

1. Freshness:
   - `standard` and `published`: no cite in the group is fresh → I6. One fresh cite keeps the group fresh (the freshest source wins).
   - `amendment`: no cite has `amend-check` → I8; otherwise the newest `amend-check` older than `max_age_days` → I6 (amendment message); otherwise the newest `acc` older than `max_age_days` → I6 (source-read message, A12).
2. Source rule, for `key_fact` categories, only when step 1 passed: the fresh cites (amendment: all remaining cites) include at least one `primary` cite, or come from at least two different registrable domains. Otherwise → I7.

**Registrable domain**: lowercase the host and strip a leading `www.`; an IP address is its own domain. When the host has at least 3 labels, its last label has 2 letters, and its second-to-last label is one of `ac biz co com desa edu go gov mil my ne net or org ponpes sch web`, keep the last 3 labels; otherwise keep the last 2. So `docs.vercel.com` = `vercel.com`, `www.ojk.go.id` = `ojk.go.id`, and `bi.go.id` ≠ `ojk.go.id`.

## 5. Research log events (normative)

Every research step (one topic, any number of queries) is journaled once, found or failed. Both types are valid before `state.json` exists (the journal must exist: after `session_start`). In state schema v2 they fill the `pipeline.research` index (spec 01: the brief's and each scan's research ids and findings, the log count, the failed ids, the last web check); the payloads stay in the journal only.

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
- `sources` — array of `{ url, title?, published?, updated?, accessed, primary?, live? }`: `url` http(s) with a public host (§3.1, A7); `published`/`updated` `YYYY`, `YYYY-MM`, `YYYY-MM-DD` or null, not after today and not after `accessed` (A10; a partial date counts from its first day); `accessed` `YYYY-MM-DD`, not after today; `primary`, `live` booleans (default false). `outcome: "found"` needs at least one source; `outcome: "failed"` needs `sources` empty (A10: a failed step names the pages it could not use in `reason`).
- `outcome` — `found | failed`. `failed` needs `reason`: a non-empty string saying why nothing usable was found, and only after search and fetch worked (§1.0). A tool outage is never logged as `failed` research.
- `conflicts` — optional: `[{ "claim", "kept": <url>, "dropped": [<url>], "why" }]`, written whenever sources disagree; the freshest primary source wins.

`context_research` — the same fields without `purpose`, plus:

- `scope` — `brief | scan`. `brief` needs `section: "S0"`; `scan` needs `S1`…`S8`.
- `purpose` is **refused** on `context_research` (A10: `INVALID_PAYLOAD`, `details.field: "purpose"`).
- `findings` — the `U-NN` ids this step added or updated. `brief` needs at least one, except a step with `outcome: "failed"` and a non-empty `note` (A11: nothing was found for that heading; the brief's `None found — <queries, RQ id>` line cites this event); `scan` may be empty when `note` says why.
- `note` — optional string, for example `no new unknowns — the S2 costs were all covered by U-04…U-07`.

### 5.1 `research log` command

`node lvr.mjs research log (--in FILE|- | --payload JSON) [--context] [--dir DIR]`

- Validates the payload per §5; a bad field → `INVALID_PAYLOAD` (`details.field`, `details.expected`), nothing written.
- Assigns `id`, appends `research_logged` (default) or `context_research` (`--context`) with one checkpoint, like `journal append`.
- Output: the `journal append` envelope plus `"id": "RQ-NNN"` and `"type"`.
- `journal check` reports `duplicate_rq_ids` (A18): an `RQ-NNN` carried by more than one event of a hand-edited journal makes the journal not healthy, adds a journal warning, and `cite check` adds warning `DUPLICATE_RQ_ID`; the first event with that id is the one markers resolve against. The script itself never assigns a duplicate.

## 6. `cite check` command (normative)

`node lvr.mjs cite check (--all | --file PATH [--file PATH …]) [--freshness PATH] [--dir DIR]`

- Read-only. Neither or both of `--all` / `--file` → `MISSING_FLAG` (usage, exit 2). A `--file` outside the project folder → `PATH_OUTSIDE_PROJECT`; missing → `FILE_NOT_FOUND`; not `.md` → `INVALID_PATH` (all exit 1).
- Reads `.lvr/state.json` (answer ids, decisions, Section statuses) and `.lvr/journal.ndjson` (RQ events) when present.
- Exit 0 whenever the check ran: findings are data (`clean: false`).

### 6.1 Files

- `--all` scans, when present, in this order: `.lvr/docs/sections/*.md` (by name), `.lvr/docs/research/*.md` (by name), then the bundle Markdown files in conventions §8 order: `AGENTS.md`, `OVERVIEW.md`, `DECISIONS.md`, `SPEC/prd.md`, `SPEC/requirements.md`, `SPEC/data-model.md`, `SPEC/api.md`, `SPEC/architecture.md`, `USER_FLOWS.md`, `CODE_STYLE.md`, `SECURITY.md`, `RESEARCH.md`, `SCOPE.md`, `MILESTONES.md`, `VERIFICATION.md`, `ASSUMPTIONS.md`, `HANDOVER.md`, `CAPABILITIES.md`. It also checks `decisions[]` in `.lvr/state.json` for I11.
- Never scanned: `blueprint.json`, `CLAUDE.md`, `GEMINI.md`, `HANDOFF-PROMPT.md`, `brand/`, `.lvr/recheck/`, `.lvr/review/`.
- Ignored inside a file: fenced code blocks (```` ``` ```` or `~~~`), inline code spans, HTML comments, and in `VERIFICATION.md` every `## Build log — …` section.

### 6.2 Zones (where a missing source is a finding)

- **Source tables** — in any scanned file, a GFM table whose header row has a cell that starts with "source" (case-insensitive, after trimming and removing `*` and `_`). Every data row needs a source.
- **Research zones** — the whole of `RESEARCH.md`, `OVERVIEW.md`, `SPEC/architecture.md`, `SECURITY.md`, `CAPABILITIES.md`, `.lvr/docs/sections/S5-research.md` and every `.lvr/docs/research/*.md`; and the `## Prices quoted` section of `.lvr/docs/sections/S2-*.md`. Heading text is matched case-insensitively, trimmed. A section runs to the next heading of the same or a higher level. (A5: the bundle files that restate vendor, legal and cost facts are whole-file zones. The other bundle files and Section Records hold the user's own figures, estimates and test data, and stay outside the zones: their prose facts are the `needs_model` I1 item, except vendor prices, which have the narrow rule below.) Every line or row that states one of these needs a source:
  - **Detection text (A6)**: the line with its cite tags and markers blanked, then Unicode NFKC folded (full-width digits and signs become ASCII), zero-width characters (U+200B–U+200D, U+2060, U+FEFF) and `*` / `_` emphasis removed. In a research zone, inline code is text (a price in backticks is a price); in other cases inline code is ignored. A cite tag inside inline code is still not a tag.
  - **price** — a currency mark next to a digit (`Rp` in any case, with an optional dot: `Rp 50.000`, `Rp. 50.000`, `Rp.50.000`): `Rp`, `IDR`, `USD`, `US$`, `$`, `€`, `EUR`, `£`, `GBP`, `SGD`, `S$`, `MYR`, `RM`, `INR`, `₹`, `¥`, `JPY` before the number (one optional space between), or `IDR`, `USD`, `EUR`, `GBP`, `SGD`, `MYR`, `INR`, `JPY`, `rupiah`, `dollar`, `dollars` after it, with an optional scale word between the number and that word (`ribu`, `rb`, `juta`, `jt`, `miliar`, `milyar`, `triliun`, `thousand`, `million`, `billion`, `k`, `m`, `b`: `5 juta rupiah`, `5jt IDR`);
  - **fee or rate** — a number followed by `%`, on a line that also has a word starting with `fee`, `rate`, `interest`, `commission`, `mdr`, `tax`, `vat`, `levy`, `charge`, `payment`, `transaction`, `bunga`, `biaya`, `pajak`, `komisi`, `provisi`, `denda`, `cicilan`, `transaksi` or `pembayaran`, or the whole word `dsr`, `dti`, `ltv`, `dp`, `suku` or `uang muka` (case-insensitive);
  - **version** — `v` + digits with at least one `.digits` (`v4.2`), or three dot-separated numbers (`16.2.1`).
- A `brand/*.md` draft explicitly passed with `--file` also uses whole-file research rules. Draft files remain outside the Blueprint Bundle and its `--all` scan.

- **Vendor price outside the zones (B2)**: in every other scanned file (decision records, Section Records, `DECISIONS.md`, `ASSUMPTIONS.md`, requirements, milestones…), a line that is not exempt, has no source (next bullet) and holds **both** a price (the detector above) with a **non-zero** amount **and** a billing cue → I1 `States a vendor price with no source: add a [cite: …] tag, an [unverified: …] marker, or the answer id it came from.` Billing cues, case-insensitive on the detection text: `/mo`, `/month`, `/yr`, `/year`, `/bulan`, `/tahun`, `per month|year|seat|user|transaction|bulan|tahun|transaksi`, and the words `monthly`, `yearly`, `annual`, `bulanan`, `tahunan`, `fee`, `fees`, `biaya`, `plan`, `tier`, `paket`, `subscription`, `langganan`, `renew`, `renewal`, `perpanjang`, `pricing`, `billed`, `developer account`. This catches a researched vendor price restated in a decision or record (`Apple USD 99/yr`). Not flagged: a zero amount (`Rp 0`), a price with no billing cue (`Rp 150.000/hour` test data), a percentage (`30% DP`). A user's own budget written with a billing cue (`ceiling Rp 100.000/month`) carries its answer id like any user fact (§3.4). Slash cues need a word boundary (`/mo` does not match `/more`). A percentage-only vendor fee (`2.9% transaction fee`) or a version outside the zones is still the `needs_model` I1 item.
- A line or row **has a source** when it holds a cite group, an unverified marker, the bare word "unverified" (reported as I9, never also as I1), or the answer id of a recorded, non-skipped answer (when `state.json` is unreadable, any `S<n>.q<n>` counts and warning `NO_STATE` is added).
- Exempt: headings, table header and separator rows, and rows whose first cell (without `*` and `_`) starts with the whole word "Total" or "Totals" (case-insensitive: `Total per month` is exempt, `Totally hidden plan` is not).
- **Category fit (A4)**: in a research zone, on a non-exempt line where the price or fee-or-rate detector fires, at least one cite group or marker must have a category from `price`, `quota`, `legal`, `regulation`, `statistic`; where only the version detector fires, one from `version`, `quota`, `legal`, `regulation`. Otherwise → I3 `category "<cat>" does not fit a <price|fee or rate|version>` (`<cat>` = the first category on the line). This makes the common dodge mechanical: a price tagged `market` or `general`. Judging a `statistic`, `legal` or `regulation` tag that holds a vendor price stays with the `needs_model` I3 item.

### 6.3 Checks everywhere

In every scanned file, outside the ignored text:

- every cite tag and unverified marker is parsed and checked (I3–I10);
- memory phrases, case-insensitive: `model knowledge`, `model-knowledge`, `assistant's memory` (straight or curly apostrophe), `from memory`, `no live check`, `training data`, `knowledge cutoff`, `my knowledge`, `as I recall`, `based on my training`, `from my training`, and the Indonesian `pengetahuan model`, `dari ingatan`, `tanpa cek`, `setahu saya`, `berdasarkan pengalaman` (A9) → I2; <!-- language-audit: verbatim -->
- the bare word `unverified` (whole word, outside a marker) → I9;
- recommendation phrases on a line with no cite group, case-insensitive: `best practice`, `best practices`, `industry standard`, `industry-standard`, `experts recommend`, `recommended by experts`, `widely recommended`, `commonly recommended` → I12; and a section whose heading starts with "Recommended" or is "Stack comparison and trade-offs" with no cite tag in it → I12;
- `designer_filled` decisions resting on an unverified fact → I11. Decision text read from: `decisions[]` in `state.json` (`summary` + `rationale`; findings in `--all` only), `DECISIONS.md` table rows whose `Status` cell is `designer_filled`, `ASSUMPTIONS.md` blocks whose `## D-NNN …` heading ends in `(designer_filled)` (to the next `## `), and record lines matching `**D-NNN** … status: designer_filled`. Case and `*`, `_`, backtick emphasis around the status word do not matter (A17: `Designer_Filled`, `**designer_filled**`). It rests on an unverified fact when any of these holds (A1, A2):
  - its text holds an unverified marker or the bare word "unverified";
  - its text holds a `U-NN` (any case) whose Domain Brief row has an unverified marker or the bare word in its Source cell;
  - its text holds an `RQ-NNN` that names a failed research event with queries;
  - a Domain Brief row with an unverified Source names the decision in its `Became` cell, even if the decision text mentions no `U-NN`;
  - its text holds the id of another decision that itself rests on an unverified fact (followed to the end of the chain; the chain is built from `state.json` and every scanned file).
  One finding per decision per file.
- In `.lvr/docs/research/domain-brief.md`: each table row whose first cell is `U-NN` is a brief item. The table needs `Section` and `Became` columns. When `state.json` is readable and the item's Section is `done`, its `Became` cell must hold an answer id (`S<n>.q<n>`) or a decision id (`D-NNN`) → else I13. A missing or invalid Section cell (not `S1`–`S8`) → I13. When `state.json` is readable, every id in `Became` must exist (A3): an answer id that is a recorded, non-skipped answer, a decision id that is in `decisions[]`; otherwise → I13 (also when the Section is not done).
- Warning `NO_DOMAIN_BRIEF` when `state.json` says S0 is `done` and the brief file is missing (a project started before ticket 26; `/lvr-continue` builds it). Warning `NO_JOURNAL` when the journal is missing: no `RQ` id resolves, so every unverified marker is I9.

### 6.4 Findings (normative ids, codes, messages)

Each finding: `{ "id", "group": "I", "code", "file", "line", "message", "owner", "kind": "bundle_gap", "needs_model": false, "claim" }`. `line` is 1-based (null for `state.json`). `claim` is the trimmed source line, cut to 160 characters with `…`. Messages use these exact templates (`<…>` filled in):

| ID | code | Fires when | Message |
|---|---|---|---|
| I1 | `missing_source` | a Source-table row has no source | `No source on this row of a Source table: add a [cite: …] tag, an [unverified: …] marker, or the answer id it came from.` |
| I1 | `missing_source` | a research-zone line states a price, fee or rate, or version with no source | `States a <price\|fee or rate\|version> with no source: add a [cite: …] tag, an [unverified: …] marker, or the answer id it came from.` (first kind found, in that order) |
| I1 | `missing_source` | a line outside the research zones states a vendor price: a non-zero price plus a billing cue (B2) | `States a vendor price with no source: add a [cite: …] tag, an [unverified: …] marker, or the answer id it came from.` |
| I1 | `missing_source` | the line's only source is an answer id that is not a recorded, non-skipped answer | `Answer id <id> is not a recorded answer, so it cannot be the source.` |
| I2 | `memory_source` | a memory phrase | `Cites model memory ("<phrase>"): research the fact and cite it, or log the failed research and use an [unverified: …] marker.` |
| I3 | `malformed_cite` | a tag, group or marker breaks §3 | `Malformed tag: <reason>.` — reason one of: `unknown category "<x>"` · `URL must start with http:// or https://` · `date must be pub or upd YYYY[-MM[-DD]], or n.d.` · `access date must be acc YYYY-MM-DD` · `URL must point to a public site (a host name with a dot, not localhost or a private address)` · `unknown or repeated flag "<x>"` · `wrong number of fields` · `tag is not closed` · `mixed categories in one claim (<a>, <b>)` · `cite and unverified marker in one claim` · `unverified marker needs a category and at least one RQ-NNN` · `category "<cat>" does not fit a <price\|fee or rate\|version>` (§6.2) |
| I4 | `missing_date` | `n.d.` without `live` (standard clock) | `No date for a <category> fact: give pub or upd from the page, or add live if the value was read off the live page.` |
| I4 | `missing_date` | `n.d.` on a published or amendment clock | `A <category> source needs its published date; n.d. is not allowed.` |
| I5 | `bad_date` | an impossible date, a date after today, or `pub`/`upd` after `acc` | `Impossible date <d>.` · `Date <d> is after today (<today>).` · `Published date <d> is after the access date <acc>.` · `Amendment check <d> is before the published date <pub>.` |
| I6 | `expired` | §4.2 step 1 | `Expired <category> fact: the newest source is <age> days old (limit <max>): research it again.` · amendment: `Amendment check is <age> days old (limit <max>): search for newer amendments again.` · `Regulation source was read <age> days ago (limit <max>): read it again and search for newer amendments.` |
| I7 | `single_source` | §4.2 step 2 | `Key <category> fact rests on one non-primary source (<domain>): add a primary source or a second independent one.` |
| I8 | `amendment_unchecked` | §4.2 step 1, amendment | `Regulation cited without an amendment check: confirm there is no newer amendment and add amend-check YYYY-MM-DD.` |
| I9 | `unverified_no_queries` | the bare word | `Bare "unverified" with no research log: research the fact, or log the failed research and write [unverified: <category> · RQ-NNN].` |
| I9 | `unverified_no_queries` | a marker id that does not resolve | `<RQ-NNN> is not a failed research_logged or context_research event with queries.` |
| I9 | `unverified_no_queries` | a marker id that is a failed `web_check` event (B1) | `<RQ-NNN> is a failed web check (a tool outage), not failed research: enable the web tools and research the fact again.` |
| I10 | `unverified_stale` | the newest referenced RQ event is older than the category limit | `Failed research <RQ-NNN> is <age> days old (limit <max> for <category>): try the research again.` |
| I11 | `designer_filled_unverified` | §6.3 | `designer_filled decision <D-NNN> rests on an unverified fact: ask the user to confirm it, or record it as an S6 blocking risk.` |
| I12 | `unsourced_recommendation` | a phrase / a section | `Recommendation leans on "<phrase>" with no citation: cite the research it rests on.` · `Recommendation section "<heading>" has no citation: cite the research behind it.` |
| I13 | `brief_unresolved` | §6.3 | `Domain Brief item <U-NN> has no target Section (S1–S8).` · `Domain Brief item <U-NN> never became a question or decision, but <S> is done: record the answer id or decision id in Became.` · `Domain Brief item <U-NN> names <id> in Became, but no such recorded answer or decision exists.` · `Domain Brief table lacks the Section or Became column.` |

Order of checks inside one tag: I3, then I4 and I5; a tag with any of these leaves its group (§4.2). A marker: I3, then I9, then I10. One I1 per line at most. Findings sort by file (scan order), then line, then the number in the id; `state.json` findings come last, by decision id.

**Owner**: `.lvr/docs/sections/S<n>-*.md` → `S<n>` (`S4-additions.md` → `lvr-add-feature`); a Domain Brief item row → its Section cell when valid, else `S0`; other `.lvr/docs/research/*.md` lines → `S0`; `state.json` → the decision's `section`; bundle files → `S9`.

### 6.5 `needs_model`

Fixed items, emitted when at least one file was scanned, each `{ "id", "group": "I", "file": "all scanned files", "message", "owner": "S9", "kind": "bundle_gap", "needs_model": true }`:

- `I1` — Check prose facts the script cannot see for a cite tag, an unverified marker, or an answer id: rules, availability, "free", "supports X", competitor facts, and any price, percentage fee or rate, or version the script cannot see (a percentage-only vendor fee such as `2.9% transaction fee`, a version outside the zones, a number written in words); facts restated outside the zones carry the same tag as their source line.
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

- `/lvr-init-new-idea` — web research check (Step 1; a stop leaves at most an empty `<slug>/`, which the next run reuses, A16); Domain Brief after S0, then `cite check --file .lvr/docs/research/domain-brief.md` until clean; the per-Section scan in the engine, whose first step in S1–S5 is the brief freshness gate (§2, A13) and in S6–S8 `cite check --all`; `cite check --file .lvr/docs/sections/S5-research.md` before S5 closes; S9 cross-check rule X8. A tool outage in any step stops the skill (§1.0).
- `/lvr-continue` — the web research check before any Section work; finishes a missing or partial Domain Brief before the next batch.
- `/lvr-handoff` — gap lint group I: `lint run` runs the `cite check --all` checks and adds the I findings and `needs_model` items to its output (`--group I` alone is allowed; `--journal` journals them as `gap_found` like any finding). Prose fallback: `references/lint-checklist.md` group I.
- `crosscheck` — rule X8 "Every claim carries a valid, fresh citation or a logged unverified marker" = ids I1–I13. X6 (E4) defers to group I: E4 accepts a date, a `[cite: …]` tag or an `[unverified: …]` marker, never a bare `unverified` (which I9 forbids).
- `/lvr-review-plan` (formerly `/lvr-recheck-plan`) — lens L01 runs `cite check --all` and `lvr review freshness`, fetches every load-bearing fact again (`research_logged`, `purpose: recheck`), and refreshes expired Domain Brief items; no web research → stop (§1.0). Contract: `08-review.md`.
- `/lvr-add-feature` — research follows the same syntax, limits and events; `cite check` lists expired facts (full rework: ticket 29).

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

### 8.2 Hardening (ticket 40: advisories A1–A19 of the ticket-26 verification)

| Advisory | Rule | Where |
|---|---|---|
| A1, A2 | I11 follows `Became`, failed-RQ ids, `U-NN` in any case, and decision-to-decision links | §6.3 |
| A3 | `Became` ids must exist (I13) | §6.3, §6.4 |
| A4 | category fit on price, fee-or-rate and version lines in research zones (I3) | §6.2, §6.4 |
| A5 | whole-file research zones: `OVERVIEW.md`, `SPEC/architecture.md`, `SECURITY.md`, `CAPABILITIES.md` (deviation: not every bundle file) | §6.2 |
| A6 | detection text folding, `rp` any case, scale words, `Total` word rule, inline code is text in zones, `dsr dti ltv dp suku uang muka` | §6.2 |
| A7 | URL host must be public (cite tags and `research log` sources) | §3.1, §5 |
| A8 | `amend-check` not before `pub`/`upd` (I5) | §3.1, §6.4 |
| A9 | memory phrases, English and Indonesian | §6.3 |
| A10 | `research log`: published/updated not after accessed or today, no `purpose` on `context_research`, no sources on `failed` | §5 |
| A11 | `scope: brief` may be a failed step with `findings: []` plus `note` | §5 |
| A12 | regulation: the source must also have been read within the limit (ruling 2 read literally) | §4, §4.1, §4.2 |
| A13 | brief freshness gate at the start of every S1–S5 scan; "(source, date)" in the message | §2 |
| A14, A15 | outage is not failed research; web check tries up to 3 results | §1, §1.0 |
| A16 | `gate subfolder` and `gate check` reuse an existing empty `<slug>/` | skill Check 4 |
| A17 | DECISIONS.md Status read case- and emphasis-insensitively | §6.3 |
| A18 | `journal check` flags duplicate RQ ids | §5.1 |
| A19 | zone headings case-insensitive | §6.2 |
| B1 | a failed `web_check` event never backs a marker (I9) | §3.3, §6.4 |
| B2 | vendor price (non-zero amount + billing cue) outside the zones needs a source (I1); `needs_model` I1 text covers numeric prices | §6.2, §6.4, §6.5 |
| N1 | `Rp.` with a dot detected as a price | §6.2 |
