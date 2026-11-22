# Review lenses (L01–L15)

The review contract. There are 15 lenses, each with numbered checks, the files it must read, and its evidence rule. `lenses.json` in this folder is the same registry in machine form, and `lvr.mjs review *` reads that file. The two files must agree: a check is added to both, or to neither.

Check ids are stable. Never renumber a check and never reuse an id. New checks are appended. A dropped check is marked `retired` (here and in `lenses.json`) and keeps its id. Project-local learned checks (`LC-NNN`, `.lvr/review/learned-checks.md`) run as extra rows of their lens (protocol §6).

T3 models: load one lens section at a time, plus the column table below.

## Columns (the files a lens reads)

Full review, one column per file. "Cells" lines below use these ids.

| Col | File | Col | File | Col | File |
|---|---|---|---|---|---|
| AGENTS | `AGENTS.md` | FLOWS | `USER_FLOWS.md` | ASSUMP | `ASSUMPTIONS.md` |
| OVERVIEW | `OVERVIEW.md` | STYLE | `CODE_STYLE.md` | HANDOVER | `HANDOVER.md` |
| DECISIONS | `DECISIONS.md` | SEC | `SECURITY.md` | CAPS | `CAPABILITIES.md` |
| PRD | `SPEC/prd.md` | RESEARCH | `RESEARCH.md` | BP | `blueprint.json` |
| REQ | `SPEC/requirements.md` | SCOPE | `SCOPE.md` | CLAUDE | `CLAUDE.md` |
| DATA | `SPEC/data-model.md` | MILE | `MILESTONES.md` | GEMINI | `GEMINI.md` |
| API | `SPEC/api.md` | VERIF | `VERIFICATION.md` | STATE | `.lvr/state.json` (plan view, contract.md §3) |
| ARCH | `SPEC/architecture.md` | | | BRIEF | `.lvr/docs/research/domain-brief.md` |

Scope-only review (at the S7 lock, protocol §10): `S0`–`S5` = the Section Records named in `state.pipeline.sections.<S>.record` (`S5` also holds the S6 risks), `BRIEF`, `STATE`, and `PROPOSAL` = `.lvr/review/runs/run-<N>/scope-proposal.md` (the split shown to the user before the lock).

Profile files (UI_SPEC, AI spec, data module, and others) become columns once the variable bundle exists (`blueprint.json` v2 `files[]`, tickets 28/08). Until then they are not cells.

`R` = required cell: it must end as findings, clean + quote, or na + reason. `o` = optional: read it when it helps, and validate it when it is filled. A column not listed is `-` for that lens. A finding may still point at a `-` file. Its cell is then created as `findings`.

## Evidence rule (every lens)

- **Locator and claim_key** (so two runs name a gap the same way, contract.md §5): the locator is the smallest unit (an `id:` unit before a heading) that holds the first line of your first evidence quote. Use the bare file only for an absent file or absence-only evidence. `claim_key` is `-`, unless one check finds two separate gaps in the same unit; then `<subject>:<aspect>` (`f-07:llm-cost`). When a later run words the same gap differently over the same quote, reconcile keeps its first id; a different gap in the same unit gets its own id (contract.md §10, "Identity"). Quote the text that shows the gap, nothing more.
- **A finding** needs at least one verbatim quote from the file it names (20 or more characters after normalisation, contract.md §4), or, for something missing, the `searched` terms that have 0 hits in the files named. It also needs a construction: `claim` starts with "Fails if" or "Fails when" and gives a concrete case. Instead of the construction, it may give a cited external fact (`fact` = a valid cite tag). A finding with neither a construction nor a cited fact is deleted, not softened.
- **A clean cell** needs at least one verbatim quote from that file that shows the check is met, plus `tried`: the attack you made and why it failed ("attempted and blocked: …").
- **An na cell** needs a reason from the enum (`stores-data-false`, `has-ui-false`, `file-absent-by-profile`, `file-not-yet-built`) plus a one-line note. The reason must fit the cell (contract.md §8): `stores-data-false` only in L06 and `has-ui-false` only in L14 when that flag is false; the two file reasons only for an absent file. A cell whose file holds a finding of the lens is a findings cell, never na. Pack checks for other product types are already left out, so a check that does not fit the product type needs no na.
- **A lens-level na** (`status: "na"`) is allowed only when the lens's "Applies" condition is false: L06 with `stores_data` false, L14 with `has_ui` false. Every other lens says "Applies: always" and is reviewed, whatever the user says about its relevance. A lens with a finding is never na.
- **A blocked cell** needs a reason (`file-unreadable`, `tool-failed`, `needs-access`) and a note. A blocked cell caps its lens at 8. No web access is never a blocked cell: the skill stops instead (conventions §10).
- **Load-bearing claims** (a decision, a cost line, an MVP constraint, or a milestone rests on them) are steelmanned, then attacked in L01 and in their subject lens. Each attack is logged: the claim id, the strongest version of the claim, "Fails if …", and the result (a finding id, or "blocked:" plus the quote or fact that defeats the attack).
- **Impact hints** below are the default `impact` for a typical case. Use the hint unless the evidence gives a reason to differ, and write that reason in `impact_reason`. Likelihood comes from the text (scale.md §1).

Each lens has a check `Lxx.0`: "the lens's core artifact is present". When that artifact is missing, the lens is scored 1 (scale.md §3), and the finding lists what is missing.

---

## L01 Claim truth and freshness

Core question: is every factual claim true today, from a source?
Core: RESEARCH. Owner Section: S5. Applies: always.
Cells (full): R OVERVIEW, DECISIONS, ARCH, SEC, RESEARCH, CAPS, ASSUMP, BRIEF · o PRD, API, HANDOVER, BP, STATE
Cells (scope-only): R S2, S3, S5, BRIEF · o S1, S4, PROPOSAL
Attack prompts: Where did this number come from, on what date? Is there a newer version of this page? Would a second source say the same? What does the vendor's own page say today?

| Check | S7 | What must be true | Signals | Impact | Old |
|---|---|---|---|---|---|
| L01.0 | ✓ | RESEARCH.md (or, scope-only, the S5 record) exists and holds sourced claims | file presence | I4 | |
| L01.1 | ✓ | Every price, fee, quota, limit, version, legal, regulation, market and statistic claim carries a valid cite group, a recorded answer id, or a logged `[unverified: <cat> · RQ-NNN]` marker | `cite check --all` I1 I3 I4 I9; `review claims` `source: none` | I3 (I4 when a decision or cost line rests on it) | R2.1 R2.5 |
| L01.2 | ✓ | No claim's provenance is model memory, and no recommendation leans on an unsourced "best practice" | I2, I12 | I3 | R2.5 |
| L01.3 | ✓ | Every cite is within its `freshness.json` limit on the review date. Expired facts are researched again now | `review freshness`; I6, I10 | I3 (I4 for a price, legal or regulation fact behind an MVP cost or legal decision) | R2.2 R2.3 R2.4 |
| L01.4 | ✓ | Every load-bearing fact has evidence level 3: a primary source, or two independent fresh sources | I7; claims `evidence_level` | I3 | |
| L01.5 | ✓ | Every load-bearing fact is fetched again in this run and compared. A changed value is a finding that names the old and new values | `research_logged` with `purpose: recheck` per fact | I3 | |
| L01.6 | ✓ | Where sources conflict, the conflict is recorded and resolved in the text (the freshest primary source wins), never picked silently | `conflicts[]` in the research log | I2 | |
| L01.7 | ✓ | Every regulation claim carries a fresh amendment check | I8, I6 | I3 (I4 when it gates launch) | R2.4 |
| L01.8 | ✓ | No `designer_filled` decision rests on an unverified fact. It is user-confirmed, or it is an S6 blocking risk | I11 | I3 | |
| L01.9 | ✓ | Every Domain Brief item has a target Section and became a question or a decision. Expired brief items are refreshed | I13; `cite check --file .lvr/docs/research/domain-brief.md` | I2 | |

Cap: a load-bearing claim that is still `[unverified: …]` after this run's research caps L01 at 6, and caps the verdict at FIX-THEN-BUILD (scale.md §4).

## L02 Unknown-unknowns

Core question: what does the domain know that the plan does not say?
Core: RESEARCH. Owner Section: S5. Applies: always.
Cells (full): R BRIEF, RESEARCH, PRD, SEC, ASSUMP, SCOPE · o DECISIONS, OVERVIEW, REQ, FLOWS, STATE
Cells (scope-only): R BRIEF, S1, S3, S5 · o S0, S4, PROPOSAL
Attack prompts: What would an expert in this domain ask first? What did comparable products get burned by? What guarantees failure here?

| Check | S7 | What must be true | Signals | Impact | Old |
|---|---|---|---|---|---|
| L02.0 | ✓ | RESEARCH.md (scope-only: the S5 record) exists | file presence | I4 | |
| L02.1 | ✓ | A Domain Brief exists, and each item became a question, a cited decision, or a parked note | BRIEF presence; I13 | I3 | |
| L02.2 | ✓ | Domain checklist. Each item is addressed with a quote, consciously parked, or na with a reason: regulation and licensing · abuse, fraud and spam · moderation of user content · offline and poor network · localization (language, currency, time zone, number format) · accessibility · store or platform policy · payments, refunds and tax · minors and age rules · data residency · support and disputes | one cell note per item | I3 (I4 for regulation, payments or minors when they apply) | |
| L02.3 | ✓ | For the comparable products in RESEARCH.md (at least 3; research more if fewer), list what each had to handle that this plan does not mention. Sources: public docs, changelogs, policy pages, post-mortems | fresh cites | I3 | |
| L02.4 | ✓ | Write the three questions a domain expert would ask first. Each is answered in the plan (quote) or is a finding | | I3 | |
| L02.5 | ✓ | Assumption map: every important, weakly evidenced assumption (evidence level 2 or lower) is in ASSUMPTIONS.md with how to test it, and the riskiest one is tested by an early milestone (full review only) | claims register | I3 | |
| L02.6 | ✓ | Inversion: list what would guarantee failure for this product type and market. The plan avoids each one (quote), or it is a finding | | I3 | |

## L03 Product-type fit

Core question: does the plan meet the failure modes of its product type?
Core: a stated product type (`state.product.types`, or the PRD or architecture says what kind of product it is). Owner Section: S1. Applies: always. Packs run only for the project's types.
Cells (full): R PRD, REQ, ARCH, SEC, MILE, VERIF · o DATA, API, FLOWS, HANDOVER, CAPS, STATE
Attack prompts: What kills this kind of product in its first month? What does the store, platform or client demand that a generic plan forgets?

| Check | S7 | What must be true | Signals | Impact | Old |
|---|---|---|---|---|---|
| L03.0 | | A product type is stated somewhere in the plan | `state.product`; PRD text | I3 | |
| L03.1 | | The type in state, PRD and architecture agree. A multi-type product (web + mobile) covers each type | | I3 | |
| L03.2 | | Base pack: the release target is named (URL, store, registry or marketplace), the release proof is defined (how to show it is live or installable), the update path is defined, and the platform accounts are listed with their cost | | I3 | |

Packs. The ids are provisional and must match the profile ids of tickets 08/09. A profile's exit criteria become pack checks when the profiles land.

| Check | Pack | What must be true | Impact |
|---|---|---|---|
| L03.10 | web | Hosting, domain and TLS are named with their cost | I3 |
| L03.11 | web | Browser support and responsive layout are stated | I2 |
| L03.12 | web | Cookie or consent banner is decided where the market requires one | I3 |
| L03.13 | web | A performance budget (page weight or load time) has a check | I2 |
| L03.20 | mobile | Store accounts, fees and review guidelines are researched and cited | I4 |
| L03.21 | mobile | Every device permission has a reason shown to the user | I3 |
| L03.22 | mobile | Offline and background behaviour is defined | I3 |
| L03.23 | mobile | Minimum OS versions and device classes are stated | I2 |
| L03.24 | mobile | Store listing assets and privacy labels are planned | I3 |
| L03.30 | game | The core loop is defined and playable by M1 | I3 |
| L03.31 | game | Economy and balance numbers have a tuning plan | I2 |
| L03.32 | game | Save, load and progress loss are handled | I3 |
| L03.33 | game | Age rating and platform certification are researched | I3 |
| L03.34 | game | A frame-rate or device performance target has a check | I2 |
| L03.40 | rag | Rights to use the corpus are cited | I4 |
| L03.41 | rag | The chunking and embedding choice has a reason | I2 |
| L03.42 | rag | An evaluation set with expected answers and a pass threshold exists | I3 |
| L03.43 | rag | A hallucination guard exists: answers cite their source, and the system refuses when no source is found | I3 |
| L03.44 | rag | Re-indexing and its cost are planned | I2 |
| L03.50 | mcp-server | Tool schemas validate their input | I3 |
| L03.51 | mcp-server | The auth and transport choice (stdio or HTTP) has a reason | I3 |
| L03.52 | mcp-server | Rate limits and timeouts are set | I3 |
| L03.53 | mcp-server | Prompt injection through tool output and other untrusted content is handled | I4 |
| L03.54 | mcp-server | It is tested against at least one named client | I3 |
| L03.60 | automation | Where credentials are stored is decided | I4 |
| L03.61 | automation | Retries and idempotency are defined (a re-run does not double-send) | I3 |
| L03.62 | automation | Execution quota and plan limits are cited | I3 |
| L03.63 | automation | An error branch with an alert exists | I3 |
| L03.64 | automation | The trigger choice (webhook or polling) has a reason | I2 |
| L03.70 | skill-plugin | The trigger description says when the skill fires and when it does not | I3 |
| L03.71 | skill-plugin | A harness compatibility list exists | I2 |
| L03.72 | skill-plugin | Install, update and uninstall paths are defined | I3 |
| L03.73 | skill-plugin | Tool and permission scope is minimal | I3 |
| L03.80 | cli | Install channels and supported OSes are stated | I3 |
| L03.81 | cli | The flags, exit codes and stdout/stderr contract is defined | I3 |
| L03.82 | cli | Config and secrets locations are defined | I3 |
| L03.83 | cli | Help text and error messages are planned | I2 |
| L03.90 | browser-extension | The manifest version is stated and permissions are minimal | I3 |
| L03.91 | browser-extension | The store review policy is researched | I3 |
| L03.92 | browser-extension | Host permissions and content-script injection risks are handled | I4 |
| L03.93 | browser-extension | Cross-browser support is stated | I2 |
| L03.100 | chatbot-agent | System prompt guardrails and refusal rules are defined | I3 |
| L03.101 | chatbot-agent | Destructive tools need confirmation | I4 |
| L03.102 | chatbot-agent | An eval set with red-team prompts exists | I3 |
| L03.103 | chatbot-agent | Cost per conversation and context limits are modeled | I3 |
| L03.104 | chatbot-agent | A path to a human or a fallback exists | I2 |

## L04 Scope and MVP discipline

Core question: is the MVP the smallest thing that proves the idea, and is scope locked and traceable?
Core: SCOPE (scope-only: PROPOSAL). Owner Section: S7. Applies: always.
Cells (full): R SCOPE, REQ, PRD, MILE, OVERVIEW, FLOWS · o DECISIONS, BP, STATE
Cells (scope-only): R PROPOSAL, S4, S1 · o S0, S2, S5, STATE
Attack prompts: What can we cut and still prove the idea? Which line hides a feature? What would the user miss on day one?

| Check | S7 | What must be true | Signals | Impact | Old |
|---|---|---|---|---|---|
| L04.0 | ✓ | SCOPE.md (scope-only: the proposal) exists | file presence | I4 | |
| L04.1 | ✓ | Every S4 feature, and every S4-additions capture, is classified in-MVP or Parking Lot exactly once. Full review: scope is locked (conventions §5) | lint F1–F4 | I4 | R6.2 |
| L04.2 | ✓ | Each in-MVP feature names its user job (who, and what for) and a kill criterion (what result would drop it) | | I3 | |
| L04.3 | | Traceability. Every in-MVP F-NN has a requirements block, a USER_FLOWS section, a SCOPE row and exactly one milestone. Every parked F-NN has a requirements row marked parked, a USER_FLOWS heading marked parked, and a scope row with a reason | crosscheck X1; lint B5 B9 F1–F4 | I3 (I4 when a feature has no milestone) | R3.2 |
| L04.4 | | No orphans: no requirement without a feature, and no milestone without a covered feature (parked features need no milestone) | lint D1, F-group | I3 | R4.8 |
| L04.5 | ✓ | Smallest proof: an in-MVP feature that the core value does not need is a finding (its fix is a decision: park it) | | I2 | |
| L04.6 | ✓ | Hidden creep: a non-functional line (admin panel, analytics, multi-language, export) that adds work without an F-id or a milestone | `review claims` | I3 | |
| L04.7 | ✓ | Parking Lot rows are intact: none deleted, renumbered or quietly moved into the MVP | | I3 | |

## L05 Builder dry-run (buildability)

Core question: can a builder agent run M0 from the bundle alone, without guessing?
Core: AGENTS and MILE. Owner Section: S9. Applies: always.
Cells (full): R AGENTS, ARCH, MILE, VERIF, STYLE, REQ, DATA, API, HANDOVER, CLAUDE, GEMINI · o OVERVIEW, DECISIONS, SEC, CAPS, FLOWS, BP
Attack prompts: I am the builder and I hold only these files. What do I type first? Which value is missing? Where would I have to guess?

| Check | S7 | What must be true | Signals | Impact | Old |
|---|---|---|---|---|---|
| L05.0 | | AGENTS.md and MILESTONES.md exist | file presence | I4 | |
| L05.1 | | All 20 bundle entries exist and are non-empty | lint A0–A18; crosscheck X7 | I4 | R3.1 |
| L05.2 | | AGENTS.md states what the product is, the load order (DECISIONS → SPEC → MILESTONES → VERIFICATION), the working rules, and a file map. It needs no LVR skill | lint G1–G6 | I4 | R3.7 R5.1 |
| L05.3 | | Local run is complete: prerequisites with versions, install steps, env vars with placeholder values (no real secrets), the run command, and the expected output | | I4 | R5.2 |
| L05.4 | | No bundle file requires reading `.lvr/` (appending open questions to the journal is the only allowed use) | | I3 | R5.5 |
| L05.5 | | Every relative file pointer resolves | lint B-group pointers | I2 | R5.7 |
| L05.6 | | CODE_STYLE.md and SECURITY.md are specific to the chosen stack, not generic filler | | I2 | R5.3 |
| L05.7 | | Dry-run of M0, then M1: walk each deliverable and acceptance step as a builder who holds only the bundle files. Every point where a decision, value, command, path, credential, version or expected result is missing is one finding, located at that step | | I3 (I4 when M0 cannot start) | |
| L05.8 | | No vague words in anything the builder must follow: "appropriate", "etc.", "similar", "as needed", "TBD", "TODO", "should probably", "some". Each one inside a requirement, step or acceptance criterion is a finding | `review claims` hedges | I2 | |
| L05.9 | | Every in-MVP feature can be built with the recorded stack, accounts, devices and budget. Nothing needs an account, service or device that the S2 record lacks | | I4 | R4.1 |
| L05.10 | | CLAUDE.md and GEMINI.md are exactly the one-line pointer. When handoff is done, HANDOFF-PROMPT.md exists and holds the full builder rule set | lint G-group; `handoff stubs` | I2 | R3.8 R3.10 R5.6 |

## L06 Data and state

Core question: is every entity, owner, lifecycle, migration, retention, backup and PII path defined?
Core: DATA. Owner Section: S3. Applies: unless `state.product.flags.stores_data` is `false` (na reason `stores-data-false`, with the PRD or architecture quote that says no data is stored). An unknown flag means the lens applies.
Cells (full): R DATA, REQ, SEC, ARCH, API · o FLOWS, HANDOVER, VERIF, MILE
Attack prompts: Two users save at once: what happens? The schema changes after launch: where does the old data go? A user asks to be deleted: what is left behind?

| Check | S7 | What must be true | Signals | Impact | Old |
|---|---|---|---|---|---|
| L06.0 | | SPEC/data-model.md exists | file presence | I4 | |
| L06.1 | | Every entity the requirements touch is in the data model with fields, keys and relations, and no model entity is unused | | I3 | |
| L06.2 | | Each entity has a create, read, update and delete owner (which feature, which role) | | I3 | |
| L06.3 | | Lifecycle: retention, deletion (including deletion on user request), and what happens to existing data on a schema change. There must be a migration story, never "delete the database" | | I3 (I4 when real user data is lost) | |
| L06.4 | | Concurrency and duplicates: two writes at once, a double submit, and retries are handled with idempotency keys or unique constraints | | I3 | |
| L06.5 | | Backup and restore: where, how often, and how a restore is tested | | I4 | |
| L06.6 | | Every personal field is in the SECURITY.md PII inventory with its protection | | I4 | R4.3 |
| L06.7 | | Import, export and data portability are planned, or a decision says they are not needed | | I2 | |

## L07 Security, privacy, legal and ToS

Core question: what is the worst thing an attacker, a user or a regulator can do?
Core: SEC. Owner Section: S3. Applies: always (L07.8 only when the product takes payments).
Cells (full): R SEC, DATA, API, ARCH, RESEARCH, DECISIONS, CAPS · o REQ, FLOWS, HANDOVER, ASSUMP, PRD
Attack prompts: Which endpoint works without login? Where is the key on day 30? Which term of service does this flow break? What does the regulator in this market fine for?

| Check | S7 | What must be true | Signals | Impact | Old |
|---|---|---|---|---|---|
| L07.0 | | SECURITY.md exists | file presence | I4 | |
| L07.1 | | Authentication and authorization per route, tool or screen: who may do what, with admin paths named | | I4 | R4.3 |
| L07.2 | | Secrets: where each one lives and who rotates it. Never in the repo; the example env file has placeholders only | | I4 | |
| L07.3 | | Privacy: the PII inventory matches the data model. A privacy-policy decision exists whenever there is a login, PII or a store presence. Consent is planned where the region requires it | | I4 | R4.3 |
| L07.4 | | Region rules for the confirmed market (data residency, consumer, age and sector rules) are cited and fresh | I6 I8 | I4 | |
| L07.5 | | The legal and ToS position of every integration, scraping or automation flow is cited, and either resolved or accepted as a `user_confirmed` decision with the cost written | | I4 | R4.4 R1.6 |
| L07.6 | | Dependency licenses fit the product (no NC or copyleft surprise in a closed product), and NC items are runtime-only | | I3 | R4.5 |
| L07.7 | | Untrusted input is handled: injection (SQL, prompt, HTML), uploads, rate limits and abuse controls on public endpoints | | I3 (I4 on a public write endpoint) | |
| L07.8 | | Payments: the product stores no card data unless the plan covers the required compliance, and refunds and chargebacks are handled | | I4 | |

## L08 Cost and capacity

Core question: do money and quota hold at 10× and at 0.1× usage, and who pays when they don't?
Core: the cost table in RESEARCH (scope-only: the S5 record's cost table). Owner Section: S5. Applies: always.
Cells (full): R RESEARCH, OVERVIEW, BP, ARCH, DECISIONS · o REQ, CAPS, HANDOVER, SCOPE, STATE
Cells (scope-only): R S2, S5, PROPOSAL · o S3, S4
Attack prompts: What does one user cost per month? What happens to the bill on the day a post goes viral? Which free tier ends first?

| Check | S7 | What must be true | Signals | Impact | Old |
|---|---|---|---|---|---|
| L08.0 | ✓ | A cost table exists | file and heading presence | I4 | |
| L08.1 | ✓ | A per-unit cost model exists for every usage-priced item (LLM tokens, API calls, messages, storage, egress, seats): unit, price and assumed volume | `review claims` money | I3 | |
| L08.2 | ✓ | At 10× the stated volume, the monthly cost, every free-tier cliff and every quota are computed, and the plan says who pays and what breaks | | I3 (I4 when the ceiling breaks with no cap) | |
| L08.3 | ✓ | At 0.1× the volume, fixed costs (minimum plans, annual commitments) still fit the budget | | I2 | |
| L08.4 | ✓ | The recurring total fits the S2 budget ceiling, and every one-time cost is shown | | I4 | R4.2 |
| L08.5 | ✓ | Every usage-based cost has a cap or an alert (a spending limit or a quota alarm). No bill is unbounded | | I4 | |
| L08.6 | | Totals agree: the `blueprint.json` costs, the RESEARCH.md table and the OVERVIEW.md totals | lint E1–E4; crosscheck X6; `blueprint emit --check` | I3 | R2.6 |
| L08.7 | ✓ | One realistic bad month (traffic spike, abuse, a retry loop) is priced with the uplift rules (scale.md U2, U3) | | I3 | |

## L09 Schedule and milestone sizing

Core question: are milestones small and honestly sized, with an outside view?
Core: MILE. Owner Section: S8. Applies: always.
Cells (full): R MILE, VERIF, SCOPE, OVERVIEW · o ARCH, REQ, DECISIONS, STATE, BP
Attack prompts: Which milestone hides two weeks of work? What did similar projects take? What is waiting on someone outside the project?

| Check | S7 | What must be true | Signals | Impact | Old |
|---|---|---|---|---|---|
| L09.0 | | MILESTONES.md exists | file presence | I4 | |
| L09.1 | | M0 is a walking skeleton: the real stack, the real data store, one real user task end to end, and one scripted check | | I4 | R4.6 |
| L09.2 | | Each milestone fits one focused builder session, and no milestone bundles unrelated features | | I3 | R4.6 |
| L09.3 | | Each estimate names a reference class (or says "none: novel") and shows the uplift-adjusted figure (scale.md U1) | | I2 | |
| L09.4 | | The order follows dependencies, the critical path is visible, and the riskiest assumption is tested early (L02.5) | | I3 | |
| L09.5 | | A failure is budgeted for every integration step that assumes it "works first try" (U4) | | I2 | |
| L09.6 | | External waits are scheduled: store review, domain and DNS, API key approval, legal review | | I3 | |

## L10 Dependencies, integrations and one-way doors

Core question: what external thing can break us, and what can't be undone?
Core: ARCH (scope-only: the S5 record). Owner Section: S5. Applies: always.
Cells (full): R ARCH, CAPS, RESEARCH, DECISIONS, SEC, HANDOVER · o API, DATA, STYLE, ASSUMP
Cells (scope-only): R S5, S2, S3 · o PROPOSAL, S4, STATE
Attack prompts: This vendor doubles its price tomorrow: then what? Which step can never be taken back? Who holds the key to the domain?

| Check | S7 | What must be true | Signals | Impact | Old |
|---|---|---|---|---|---|
| L10.0 | ✓ | SPEC/architecture.md (scope-only: the S5 record) exists | file presence | I4 | |
| L10.1 | ✓ | Every external dependency has a license, an install line, a pinned version and a fallback for when it is unavailable | | I3 | R4.5 |
| L10.2 | ✓ | Versions are current, and no dependency reaches end of life within a year (cited) | I6 (version) | I3 | |
| L10.3 | ✓ | The rate limits and quotas of each integration are cited at the lowest tier the plan uses (U5) | | I3 | |
| L10.4 | ✓ | The cost of moving away from each core vendor is written | | I2 | |
| L10.5 | ✓ | One-way doors: each irreversible step (domain, store listing, production data schema, public API, pricing promise, vendor contract, messages sent to users) has its undo cost and who holds the handle, traced rather than asserted | | I3 (`one_way_door: true`) | |
| L10.6 | ✓ | Every account, key and approval the build needs is listed with its owner and lead time | | I3 | R4.1 |

## L11 Internal coherence

Core question: do all files say the same thing?
Core: DECISIONS. Owner Section: S9. Applies: always.
Cells (full): R AGENTS, OVERVIEW, DECISIONS, PRD, REQ, ARCH, FLOWS, SCOPE, MILE, VERIF, ASSUMP, BP, STATE · o DATA, API, STYLE, SEC, RESEARCH, HANDOVER, CAPS, CLAUDE, GEMINI
Attack prompts: Does the stack in OVERVIEW match the stack in architecture? Is this number the same in every file? Which decision does this sentence quietly reverse?

| Check | S7 | What must be true | Signals | Impact | Old |
|---|---|---|---|---|---|
| L11.0 | | DECISIONS.md exists | file presence | I4 | |
| L11.1 | | Every `decisions[]` entry has an id, a section, a summary, a non-empty rationale and a valid status | `state validate` | I2 | R1.1 |
| L11.2 | | DECISIONS.md mirrors `decisions[]`: the same ids and statuses, nothing extra | crosscheck X2; lint C1–C3 | I3 | R1.2 |
| L11.3 | | ASSUMPTIONS.md lists every assumed and `designer_filled` decision with why and how to confirm it, and each one is still valid | X3; lint C4 C5 | I3 | R1.3 R1.4 |
| L11.4 | | No two decisions contradict each other, and no decision contradicts the locked scope | lint H4 (needs_model) | I4 | R1.5 |
| L11.5 | | The display name, feature names, stack and entity names are identical across files | X4; lint B21 | I2 | R3.4 |
| L11.6 | | Counts and numbers agree across files (feature count, milestone count, prices, limits) | `review ripple` | I3 | |
| L11.7 | | Every file is English GFM with ASCII diagrams only: no Mermaid and no unfilled placeholders | lint B19 | I1 (I2 for a placeholder) | R3.5 |
| L11.8 | | OVERVIEW.md Limitations lists every degraded booster (by tier), every failed delegation and every blocked-then-resolved Section | `state.boosters`, `agents_delegated` | I2 | R3.6 |
| L11.9 | | `blueprint.json` matches state and bundle | `blueprint emit --check` drift; lint H1–H3 | I2 | R3.9 |
| L11.10 | | State is consistent: `state.json` is valid, Section statuses match their records, milestone ids, goals and order match MILESTONES.md, `project.status` matches progress, and the journal is healthy | `state validate`; `replay`; `journal check` | I3 | R6.1 R6.3 R6.4 R6.5 |
| L11.11 | | Every accepted S6 risk points at a `user_confirmed` decision with the accepted cost written | | I4 | R1.6 |

## L12 Verification and testability

Core question: can "done" be proved by a command?
Core: VERIF. Owner Section: S8. Applies: always.
Cells (full): R VERIF, MILE, REQ · o FLOWS, API, DATA, STYLE, SEC
Attack prompts: Which criterion passes when the feature is broken? How would we know it silently broke? Could the builder run this check alone?

| Check | S7 | What must be true | Signals | Impact | Old |
|---|---|---|---|---|---|
| L12.0 | | VERIFICATION.md exists | file presence | I4 | |
| L12.1 | | Every acceptance criterion has a procedure with exact commands and expected outputs (or an observable visual fact and how to look) | crosscheck X5; lint D3–D5 | I4 | R3.3 |
| L12.2 | | Every critical path has at least one negative test (wrong password, empty cart, quota hit) | | I3 | |
| L12.3 | | Test data: where it comes from and how to reset it | | I2 | |
| L12.4 | | Every external integration has a check that fails loudly when it silently breaks | | I3 | |
| L12.5 | | The global smoke test is one real end-to-end pass, and "definition of verified" is stated | lint D6 | I3 | |
| L12.6 | | Every check can be run by the builder alone, with no judgement words such as "looks good" | | I3 | |

## L13 Operability and failure modes (FMEA)

Core question: what fails in production, and who notices?
Core: ARCH and HANDOVER. Owner Section: S9. Applies: always.
Cells (full): R ARCH, HANDOVER, SEC, VERIF · o DATA, API, MILE, CAPS
Attack prompts: The server dies at 2 am: who knows, and when? The deploy is bad: how do we go back? The certificate expires: who finds out first?

| Check | S7 | What must be true | Signals | Impact | Old |
|---|---|---|---|---|---|
| L13.0 | | SPEC/architecture.md and HANDOVER.md exist | file presence | I4 | |
| L13.1 | | FMEA table: each component × failure mode has severity, occurrence and detection, plus a mitigation or a verification step. Every failure point named in the architecture has one | | I3 | R4.7 |
| L13.2 | | Backup and restore are tested, not only described | | I4 | |
| L13.3 | | Monitoring and alerting say who notices an outage, and how fast | | I3 | |
| L13.4 | | Rollback: how to undo a bad deploy | | I3 | |
| L13.5 | | Rotation and expiry of secrets, certificates, API keys and tokens are planned | | I3 | |
| L13.6 | | HANDOVER.md covers run, deploy, update, backup, where secrets live, and who to ask | | I3 | R5.4 |
| L13.7 | | Single points of failure (one server, one maintainer, one key holder) are named with their recovery | | I3 | |

## L14 UX and flow completeness

Core question: does every path a real user takes exist in the spec?
Core: FLOWS. Owner Section: S4. Applies: unless `state.product.flags.has_ui` is `false` (na reason `has-ui-false`, with a quote). An unknown flag means the lens applies.
Cells (full): R FLOWS, REQ, PRD · o API, SEC, MILE, VERIF
Attack prompts: What does the first screen show to a brand-new user with no data? What happens when the network drops mid-payment? How does the user undo it?

| Check | S7 | What must be true | Signals | Impact | Old |
|---|---|---|---|---|---|
| L14.0 | | USER_FLOWS.md exists | file presence | I4 | |
| L14.1 | | Every in-MVP F-id has a flow with a numbered script, and every flow maps to an F-id | crosscheck X1 | I3 | |
| L14.2 | | Each screen or command in the flows has its empty, loading, error, offline and success states | | I3 | |
| L14.3 | | First run and onboarding, permission denied and session expired are covered | | I3 | |
| L14.4 | | Destructive actions ask for confirmation, and can be undone where possible | | I3 | |
| L14.5 | | Basic accessibility (contrast, keyboard, screen reader) and the market's language, currency and date formats are covered | | I2 | |
| L14.6 | | Each flow's failure path ends where the user can act | | I3 | |

## L15 Second- and third-order effects and adoption

Core question: what happens after it works?
Core: PRD (scope-only: the S1 record). Owner Section: S1. Applies: always.
Cells (full): R PRD, OVERVIEW, SCOPE, HANDOVER, RESEARCH · o BRIEF, DECISIONS, SEC
Cells (scope-only): R S1, PROPOSAL, S5 · o S0, S4
Attack prompts: It is month 6 and nobody uses it: why? It is month 6 and everybody uses it: what broke? Who is still maintaining it?

| Check | S7 | What must be true | Signals | Impact | Old |
|---|---|---|---|---|---|
| L15.0 | ✓ | SPEC/prd.md (scope-only: the S1 record) exists | file presence | I4 | |
| L15.1 | ✓ | The success metric is defined and measurable, and the plan says how it will be measured | | I3 | |
| L15.2 | ✓ | Every pre-mortem cause (protocol P2) is mapped. This lens owns the unmapped ones | | I3 | |
| L15.3 | ✓ | Who maintains it after launch is named, with time per week and cost | | I3 | |
| L15.4 | ✓ | Behaviour change: how users could game, abuse or work around it, and what happens at success (load, support, moderation) | | I3 | |
| L15.5 | ✓ | Platform dependency: what happens when the main platform changes its terms, price or API | | I3 | |
| L15.6 | ✓ | Adoption: how the first users find it and start using it, and what stops them | | I2 | |

---

## Old recheck ids → new checks

The old `/lvr-recheck-plan` checklist (R1.1–R6.6) is fully covered:

| Old | New | Old | New | Old | New |
|---|---|---|---|---|---|
| R1.1 | L11.1 | R3.3 | L12.1 | R4.8 | L04.4 |
| R1.2 | L11.2 | R3.4 | L11.5 | R5.1 | L05.2 |
| R1.3 | L11.3 | R3.5 | L11.7 | R5.2 | L05.3 |
| R1.4 | L11.3 | R3.6 | L11.8 | R5.3 | L05.6 |
| R1.5 | L11.4 | R3.7 | L05.2 | R5.4 | L13.6 |
| R1.6 | L11.11, L07.5 | R3.8 | L05.10 | R5.5 | L05.4 |
| R2.1 | L01.1 | R3.9 | L11.9 | R5.6 | L05.10 |
| R2.2 | L01.3 | R3.10 | L05.10 | R5.7 | L05.5 |
| R2.3 | L01.3 | R4.1 | L05.9, L10.6 | R6.1 | L11.10 |
| R2.4 | L01.3, L01.7 | R4.2 | L08.4 | R6.2 | L04.1 |
| R2.5 | L01.1, L01.2 | R4.3 | L06.6, L07.1, L07.3 | R6.3 | L11.10 |
| R2.6 | L08.6 | R4.4 | L07.5 | R6.4 | L11.10 |
| R3.1 | L05.1 | R4.5 | L10.1, L07.6 | R6.5 | L11.10 |
| R3.2 | L04.3 | R4.6 | L09.1, L09.2 | R6.6 | protocol §6 (ledger reconcile) |
| | | R4.7 | L13.1 | | |
