# L — Critical plan-review skill: research + design (lvr-review-plan)

Date: 2026-11-19. Scope: replace `skills/lvp-recheck-plan` with a skeptical, exhaustive, run-to-run-consistent reviewer. Direction: spec.md D1–D12 (prefix `lvr`, `.lvr/`, D8 zero-dep `lvr.mjs`, D11/D12 research-grounded).

Honesty notes: web results were partly aggregator pages; items marked (recalled) come from model memory and were NOT re-fetched. The Flyvbjerg 27%/one-in-six/200% figures could not be confirmed by search; do not hard-code them.

---

## 1. Method research -> concrete procedures

| Method | Source | Procedure we extract | Where it lands |
|---|---|---|---|
| Pre-mortem | Klein, HBR Sept 2007; built on Mitchell, Russo, Pennington 1989 (prospective hindsight: imagining the event as certain raised the number of generated reasons ~30%; study counted reasons, not quality; Veinott et al. 2010 is the main support for pre-mortem beating other methods, student sample) | Assume failure already happened at fixed horizons; each person writes causes independently; merge; rank; mitigate top ones | Pass P2: three horizons (first builder session, launch, month 6). Every cause must map to a matrix cell or become a finding. Do not cite "30%" as a project-risk result |
| Red team / steelman-then-attack | phuryn/pm-skills strategy-red-team (MIT) | Extract claims, mark load-bearing, state strongest version, attack that, write "Fails if ___", rank impact x likelihood x cheapness-to-test, self-refute: never invent a weakness | P1 attack protocol; "Fails if" phrasing becomes the mandatory `claim` field |
| Devil's advocate / anti-sycophancy | pm-claude-skills sycophancy-challenger (MIT); Sharma et al. 2023 | Open with strongest case against; hold position under pushback; concede only on new evidence, never on displeasure; say plainly when nothing is found, do not invent flaws or praise | Section 8 rules |
| Construct-the-failure | boshu2/agentops premortem (Apache-2.0) | Every risk needs a concrete defeat (input, sequence, cited fact); un-constructible risk is reported "attempted-and-blocked" (counts as evidence FOR the plan); a finding with neither construction nor blocking fact is deleted. Also "who verifies each costly unit" and "reversibility asserted, not traced" (one-way doors) | `evidence` field rule; L10 one-way-door check; independence statement |
| Second-order thinking | Howard Marks "The Most Important Thing" (recalled); general | For each key decision/fix ask "and then what?" three times; list consequence at depth 2 and 3 | P3 consequence chain; mandatory on every major/blocking finding and on every proposed fix |
| Reference-class forecasting | Kahneman and Lovallo 1993; Flyvbjerg 2008 "Curbing optimism bias and strategic misrepresentation in planning" (European Planning Studies) | Pick reference class of similar projects, take its outcome distribution, place this project in it, adjust only with explicit evidence. Limit: truly novel projects have no valid class (state that) | L09 schedule/cost: every estimate must name a reference class (or say "none") and apply the uplift table in 5.4. Flyvbjerg and Budzier HBR 2011 (IT cost-risk fat tail; exact numbers unverified here) |
| Planning fallacy | Kahneman and Tversky 1979 | Inside view = scenario of how it will go; outside view = how similar ones went | Default assumption: things go worse; "optimistic until shown otherwise" is banned |
| FMEA | AIAG/IEC 60812 (recalled) | List failure modes per component; score Severity, Occurrence, Detectability; RPN = S x O x D; act on high RPN and on any S=max | L13 table; our severity lookup (5.3) uses S x O, detectability raises one level when "no check would notice" |
| Assumption mapping | Bland and Osterwalder "Testing Business Ideas" (recalled); Strategy red-team | Plot assumptions on importance x evidence; test important+unevidenced first | Claim register tags `load_bearing` and `evidence_level` (0 none, 1 model memory = invalid under D12, 2 one source, 3 >=2 sources fresh) |
| Inversion | Munger (recalled) | "What guarantees failure?" then check the plan avoids each | P2 prompt list; seeds the product-type lens "guaranteed-failure" checks |
| Socratic questioning | Paul and Elder (recalled) | Clarify, probe assumptions, probe evidence, probe implications, probe viewpoints, question the question | Query templates inside each lens file; mattpocock `grilling` (MIT) is the interview variant for user decisions, not for reviewing a document |

---

## 2. LLM-judge consistency research

| Finding | Source (date) | Design consequence |
|---|---|---|
| Judges show position, verbosity, self-enhancement bias; strong judges reach >80% agreement with humans | Zheng et al., "Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena", NeurIPS 2023, arXiv 2306.05685 (fetched via search) | Fixed order of lens x file sweep (deterministic), no length reward, score from counts not impression |
| Reliable rubric judging needs executable rubrics, evidence-anchored scores, calibrated scales; instability under prompt variation is the failure mode | RULERS, arXiv 2601.08654, Jan 2026 (search summary; full text not read) | Lock rubric in a versioned file, score = pure function of ledger, evidence quote mandatory |
| Rubric-conditioned graders are inconsistent under harmless rewording; agreement across several runs is a usable confidence proxy | arXiv 2601.08843, Jan 2026 (search summary) | Optional second independent pass; ids that appear in both are "confirmed", singletons flagged "low-confidence, verify" |
| Showing a judge a prior score shifts later scores (anchoring) | arXiv 2608.25869 (search summary only; verify before citing publicly) | Blind-first protocol: run the full sweep BEFORE reading prior scores/ledger scores; reconcile after |
| Sycophancy: models favour agreeable answers; preference data rewards it | Sharma et al., Anthropic, arXiv 2310.13548, Oct 2023 (v4 May 2025) (fetched via search) | Section 8 anti-sycophancy rules; user pushback never changes a score without new evidence |
| Prompted-in-the-same-context self-review is weak without external signal | Huang et al. 2023, arXiv 2310.01798 (recalled) | Evidence must be an artifact quote or tool output, not a re-think; fresh-context pass where harness allows |
| Self-consistency: sample several reasoning paths, majority vote | Wang et al. 2022, arXiv 2203.11171 (recalled) | Sweep twice in different order; union findings, intersect for confidence |
| Checklist / criteria decomposition beats holistic scores | G-Eval, Liu et al. 2023, arXiv 2303.16634; Prometheus, Kim et al. 2023, arXiv 2310.08491 (both recalled) | Per-lens checklist with ids; anchored descriptors per level |
| Verify claims with independent questions | Chain-of-Verification, Dhuliawala et al. 2023, arXiv 2309.11495 (recalled) | Fix `verify` command per finding, executed by run 2 |

Inference (ours, not from a paper): consistency across runs is mostly a property of the protocol, not the model. Remove degrees of freedom: fixed checks, fixed cell list, deterministic ids, severity by lookup, score by formula, and compare against the file hashes.

---

## 3. Existing GitHub skills, scored (RUBRIC.md, /20)

Gate: all MIT or Apache-2.0, reachable, SKILL.md read (first ~2.5 KB of each plus targeted greps; scores provisional). Clone date 2026-11-19, last-commit as of clone.

| Skill | Repo / path | License | Last commit | Stars (repo) | Size | Score | Evidence quote |
|---|---|---|---|---|---|---|---|
| sycophancy-challenger | mohitagw15856/pm-claude-skills `skills/sycophancy-challenger` | MIT | 2026-11-16 | 1.6k | 9.2 KB | 15 | "only concedes when you give it new evidence. Not when you express displeasure." and "Do not invent praise. Do not invent flaws either." |
| agentops premortem | boshu2/agentops `skills/premortem` (+schemas, scripts/validate*.sh, evals/tier2-premortem) | Apache-2.0 | 2026-11-16 | 457 | 7.7 KB | 16 (nt=0: ecosystem jargon, links sibling skills) | "A finding with neither a construction nor a blocking fact is deleted, not softened." / "reversibility asserted, not traced" |
| strategy-red-team | phuryn/pm-skills `pm-execution/skills/strategy-red-team` | MIT | 2026-11-08 | 28.2k | 4.5 KB | 13 | "Steelman, then attack" ... "Never invent a weakness the plan doesn't have." |
| challenge (pre-mortem) | alirezarezvani/claude-skills `c-level-advisor/executive-mentor/skills/challenge` | MIT | 2026-11-17 | 30.1k | 6.7 KB | 13 | "imagine it's 12 months from now and this plan failed ... work backwards" |
| red-team-my-plan | mohitagw15856/pm-claude-skills | MIT | 2026-11-16 | 1.6k | 3.8 KB | 12 | "Hunt single points of failure" |
| grilling / grill-me | mattpocock/skills `skills/productivity/grilling` | MIT | 2026-11-12 | 327k | 2.1 KB | 12 (interviews the user, not a document reviewer) | "The session is done when the frontier is empty ... nothing left silently assumed." |
| pre-mortem (Tigers/Paper Tigers/Elephants) | phuryn/pm-skills | MIT | 2026-11-08 | 28.2k | 4.4 KB | ~12 | Tiger / Paper Tiger / Elephant triage |
| obra/superpowers | cloned; no plan-red-team skill by name found | MIT | 2026-11-03 | n/a | n/a | not scored | n/a |

Overlap verdict: none of them has a ledger, stable ids, a coverage matrix, a scoring function or a second-run protocol. They are one-shot critics. We reuse ideas with credit (MIT/Apache notice kept in a CREDITS line): anti-capitulation (challenger), construct-or-delete + one-way doors (agentops), steelman-then-attack and "Fails if" (red-team). Do not vendor text; rewrite.

---

## 4. Gap check: current lvp-recheck-plan

| # | Gap | Evidence in current skill | Effect |
|---|---|---|---|
| G1 | Structural lint, not adversarial | R1-R6 are mostly "exists / mirrors / matches". No pre-mortem, assumption map, second-order, builder dry-run | Finds drift, misses "this plan is wrong" |
| G2 | No score | Only blocking/major/minor | No cross-run comparability |
| G3 | Ids not stable | `RC-NN` sequential; only prior *blocking* findings carried (R6.6); reports never edited | Run 2 cannot tell fixed vs missed vs new; non-blocking regressions invisible |
| G4 | Exhaustiveness is an instruction only | "Do not sample" with self-reported "R1 passed 6/6" | Nothing detects a skipped check |
| G5 | Re-audit is partial | Step 7 re-runs R3, R6 + touched groups | New gaps in untouched groups appear silently in a later run |
| G6 | No missed-earlier protocol or apology | absent | Owner's honesty requirement unmet |
| G7 | Severity subjective | "Raise it when the evidence is worse" | Drift |
| G8 | Anti-sycophancy absent; no independence statement; prior state read first | Step 2 loads full journal/records before auditing | Anchoring on prior judgements |
| G9 | Skill both reviews and mutates | Step 6 auto-applies mechanical fixes | Hides second failure in same file; owner now wants user-applied fixes; fix side-effects never reviewed |
| G10 | Freshness is price-centric, static thresholds | R2: 90/180 days; one source | D12 needs freshest source + >=2 sources + no model-memory; D11 unknown-unknowns absent |
| G11 | No product-type lenses, no data lens depth, no cost-realism, no schedule uplift | R4 only 8 checks | Misses game/RAG/MCP/n8n-specific failures |
| G12 | No optimism correction | absent | Plans scored as written |
| G13 | Heavy: 11 KB SKILL.md + 29 KB references, 5 journal events, zero scripts | measured | Poor for T3 models; all deterministic work done by LLM (violates D8) |
| G14 | Old namespace (`.lvp`, `/lvp-*`) and prerequisites tied to S9 | Step 1 | Rename to `.lvr`; allow review earlier too (after S7 lock for a scope review?) - decide below |

What to keep: precondition refusal with plain guidance, evidence-quote rule, never-fake-a-date rule, no Parking Lot deletion, user-decision vs mechanical split (now: fix *classes* labelled, user applies), the Never list.

---

## 5. Design proposal

### 5.1 Shape
- Name `lvr-review-plan` (alias `/lvr-recheck-plan`). Reads the bundle; **writes only** `.lvr/review/**`. It never edits the bundle. The user (or `/lvr-continue`, `/lvr-add-feature`) applies fixes; the next run verifies them.
- SKILL.md <= 8 KB (flow, rules, never-list). `references/lenses/L01..L15.md` (loaded one at a time), `references/scale.md`, `references/severity.md`, `references/uplift.md`, `references/apology.md`, `references/learned-checks.md` (project-local appended, see 5.7).
- Time-boxing is by structure (cells), not by minutes.

### 5.2 Lenses (15)

Each lens file has: purpose, `core question`, numbered checks `Lxx.n` (stable ids; never renumber, only append; retire with `retired: true`), per-check "attack prompts" (Socratic), required evidence, and which bundle files are `R`equired / `o`ptional / `-` n/a.

| Lens | Core question | Seed checks (examples) |
|---|---|---|
| L01 Claim truth and freshness (D11/D12) | Is every factual claim true today, from a source? | Each price/limit/ToS/API/version/competitor claim has URL + access date + >=2 independent sources for key facts; freshness limit per claim class (see 5.5); evidence_level >= 3 for load-bearing; no "model memory" provenance; contradictions between sources resolved in text; re-fetch now and compare |
| L02 Unknown-unknowns (D11) | What does the domain know that the plan does not say? | Research brief exists and was turned into questions/`designer_filled`; list 5 things comparable products had to handle (regulation, abuse, moderation, offline, localization, accessibility, store policy) and verify each is addressed or consciously parked; "what would an expert in this domain ask first?" |
| L03 Product-type fit | Does the plan satisfy the failure modes specific to its type? | Pack per profile (D2): app, game (loop, balance, save, platform cert), RAG (corpus rights, chunking, eval set, hallucination guard, refresh), MCP server (tool schema, auth, transport, rate limits, prompt injection via tool output), n8n workflow (credentials, retries, idempotency, execution quota, error branch), skill/plugin (trigger accuracy, harness compat, install path), web service, CLI, extension, data pipeline |
| L04 Scope and MVP discipline | Is the MVP the smallest thing that proves the idea, and is scope locked and traceable? | Each in-MVP feature has a user job and a kill criterion; parked rows intact; no feature without milestone; creep hidden in "non-functional" lines; "what can we cut and still prove the idea?" |
| L05 Buildability by agent | Can a builder agent execute from the bundle alone without guessing? | **Builder dry-run**: walk M0 as the builder with only bundle files; list every point where a decision, value, command, path, credential or acceptance result is missing = finding. Load order, run instructions, env vars, no `.lvr/` dependency, pointer resolution, ambiguous words ("appropriate", "etc.", "similar", "TBD") |
| L06 Data and state | Is every entity, owner, lifecycle, migration, retention, backup and PII path defined? | ERD vs requirements; each entity has create/read/update/delete owner; ids/keys; migration story; what happens to existing data on schema change (see this repo's own DB rule); import/export; deletion/retention; concurrency/duplicate writes; idempotency |
| L07 Security, privacy, legal/ToS | What is the worst thing an attacker, a user or a regulator can do? | AuthN/Z per route/tool; secrets location; PII inventory vs privacy decision; scraping/automation ToS; licenses of deps; prompt injection/untrusted content; abuse/rate limiting; store policies; age/region rules |
| L08 Cost and capacity | Does money/quota hold at 10x and at 0.1x usage, and who pays when it doesn't? | Per-unit cost model (LLM tokens, API calls, storage, egress); free-tier cliffs; usage-based exposure with no cap; worst-month scenario; ceiling vs S2 budget; totals consistent across files; one-time costs listed |
| L09 Schedule and milestone sizing | Are milestones small and honestly sized, with outside-view uplift? | Each milestone fits one builder session; M0 walking skeleton; estimate names a reference class; apply uplift table; critical path and dependency order; buffers |
| L10 Dependencies, integrations, one-way doors | What external thing can break us and what can't be undone? | License, install line, pinned version, fallback, deprecation/EOL date, rate limit, vendor lock-in; each one-way step has undo cost and who holds the handle ("reversibility asserted, not traced") |
| L11 Internal coherence | Do all files say the same thing? | Decision integrity; DECISIONS vs state; names identical; counts/totals; no decision contradicts scope; assumed decisions listed and still valid |
| L12 Verification and testability | Can "done" be proved by a command? | Every acceptance criterion has exact command + expected output; negative tests; test data; "how would we know it silently broke?" |
| L13 Operability and failure modes (FMEA) | What fails in production and who notices? | Table component x failure x S/O/D; backup/restore tested; monitoring; rollback; secrets rotation; update path; single points of failure; handover content |
| L14 UX and flow completeness | Does every path a real user takes exist in the spec? | Empty/error/loading/offline states, first-run, permissions denied, destructive-action confirm, a11y, locale, mobile; flows reach every F-id; "what does the user do when it fails?" |
| L15 Second/third-order and adoption | What happens after it works? | Pre-mortem narratives at 3 horizons; who maintains it; behaviour changes (users game it); platform dependency risk; success metric defined and measurable; what happens at success (scale, abuse, support load) |

Lenses 01-02 implement D11/D12; L03 loads the profile pack for the project's `product_type`; L06 is skipped as `na` only if `stores_data=false` AND the cell reason is recorded.

### 5.3 Anchored 0-10 scale (per lens) and severity

Severity is a lookup, not a feeling. Each finding records `impact` (I) and `likelihood` (L) from enumerations in `severity.md`:

| I class | Definition |
|---|---|
| I4 stop | Builder cannot proceed, or legal/security/financial harm, or data loss, or product contradicts itself |
| I3 rework | Builder will guess; a milestone redone; wrong product shipped |
| I2 friction | Works, but costs time or quality; quick fix |
| I1 polish | No build effect |

| L class | Definition |
|---|---|
| L3 | Will happen unless fixed, or already true in the text |
| L2 | Plausible for the target user/stack (reference class says >=1 in 5) |
| L1 | Needs unlikely conditions |

Severity: blocking = I4 with L>=2, or I3 with L3 and a one-way door; major = I3 with L>=2, or I4 with L1; minor = everything else with I>=2; note = I1 (not scored, listed). If `detectability` = "nothing in the plan would notice" raise one level (FMEA D). Un-evidenced load-bearing claim (evidence_level <=1) counts as major at minimum (assume worse).

Lens score is a pure function of the lens's open + accepted findings (counted by severity); `scale.md` fixed:

| Open findings in lens | Score | Anchor meaning |
|---|---|---|
| B=0, M=0, m=0, all cells filled with quoted clean evidence, >=1 attack attempt per load-bearing claim logged | 10 | Nothing findable with these checks. Not a guarantee of success; residual-risk list still printed |
| B=0, M=0, m in 1-5 | 9 | Sound, cosmetic issues |
| B=0, M=0, m>=6 | 8 | Sound, sloppy |
| B=0, M=1 | 8 | One real gap |
| B=0, M 2-3 | 7 | Builder will improvise in places |
| B=0, M 4-5 | 6 | Plan is half-specified for this lens |
| B=0, M>=6 | 5 | Systemic gaps |
| B=1 | 4 (3 if M>=3) | Build would fail or harm here |
| B=2 | 3 | |
| B>=3 | 2 | |
| lens core artifact absent (e.g. no data model while data stored) | 1 | Lens cannot be assessed because the plan lacks the thing; list what is missing |
| 0 | never emitted (use `unscored` with reason) | |

Overall = floor((mean of applicable lens scores + min lens score) / 2). Gate verdicts: `BUILD-READY` only if B=0 everywhere and min >= 8 and overall >= 8; `FIX-THEN-BUILD` if B=0 and min >= 5; `NOT-READY` otherwise. Accepted risks (user decision `D-NNN` with cost written) stay in the count as status `accepted`, severity unchanged, but are excluded from the "must fix" list - this keeps scores honest, the verdict not blocked by informed choices (verdict shows "N accepted blocking risks").
Caps: any L01 claim that could not be verified (no web) caps L01 at 6 and the overall verdict at FIX-THEN-BUILD (D12: web research is a hard requirement; say so loudly).

This reproduces the owner's example: lens X B=1 -> 4/10; lens A (core artifact absent) 1/10; lens B clean with evidence -> 10/10; after fixes run 2 recomputes the same function.

### 5.4 Optimism correction (assume worse)
`uplift.md` table applied to the plan's own numbers when computing "realistic" columns in the report (the plan file is not edited): schedule x1.5 default, x2 for first-time stack or integration with undocumented API; cost: usage-based x2 on stated volume, x3 where volume is a guess; "works on first try" integration steps count as one failure budgeted; any third-party limit assumed at the lowest documented tier. Numbers are heuristics, labelled as such; the report must name the reference class. Findings use "when this fails" wording, not "if".

### 5.5 Freshness limits (L01, D12)
Config table in `lvr.mjs`/`freshness.json` (single source): price/quota/limits 30 days; ToS/legal/regional 60; API/SDK version and deprecations 30; library versions/framework status 30; competitor and market claims 90; statistics 365 or "state the year". The skill re-fetches key facts at review time regardless, and records `fetched_on`. Any claim whose newest source is older than its limit and was not re-fetched = finding. Thresholds are defaults (ours, tunable).

### 5.6 Exhaustive single-pass protocol

```
P0 Inventory      lvr.mjs review snapshot  -> file/section hashes; claims register (numbers, prices, dates, URLs, F/M/D ids, absolutes "always/never/all", hedges "should/probably/TBD")
P1 Sweep          lens x file matrix, fixed order L01..L15 x file 01..20. Every R cell must end as:
                    finding ids | clean + >=1 verbatim quote (+ what was tried) | na + enum reason
                  `lvr.mjs review coverage` rejects empty/unquoted cells. Steelman then attack each load-bearing claim ("Fails if ...").
P2 Pre-mortem     3 horizons (first builder session / launch / month 6) + inversion list. Each cause -> existing finding id, or a cell re-open, or new finding. Unmapped cause = incomplete.
P3 Consequences   second/third-order chain on every blocking/major finding and on every proposed fix.
P4 Fix closure    each finding: fix text, fix_class (mechanical | decision | research), `verify` (command/grep/row condition),
                    `ripple` (script lists every file containing the claim key), side-effect check, fix-vs-fix conflict check, fix ordering.
                    Then "apply-all simulation": reread the plan as if all fixes were applied; anything new found here is added NOW (this is how run 2 is pre-empted).
P5 Saturation     second sweep with reversed order and the question "what would a hostile reviewer find that I did not?". Repeat until a pass adds 0 findings; min 2 passes. Optional: fresh-context pass (subagent) - label independence honestly.
P6 Score+report   lvr.mjs review score -> ledger -> render report.
```
Pass count and "new findings per pass" are written in the report (saturation curve); a run that ends with the last pass still finding items is marked `INCOMPLETE - rerun now`, not delivered as final.

### 5.7 Coverage matrix
Static `lens x bundle-file` applicability table in `lvr.mjs` (20 columns from conventions section 8 plus `state.json`/`DECISIONS`). Cell status enum: `clean(quote)`, `findings[ids]`, `na(reason in {not-applicable-type, stores_data=false, file-absent-by-profile})`, `blocked(reason)` (e.g. no web). Output `COVERAGE.md` + counts "R cells 187/187". `blocked` cells cap the lens at 8 and are listed in Limitations. Per-project learned checks (5.9) add rows.

### 5.8 Findings ledger (`.lvr/review/LEDGER.jsonl`, append-only; `REVIEW-<date>-<n>.md` is a render)

```
{ "id":"RV-L08-3fa9c1",         // lens + first 6 hex of sha1(check | locator-normalised | claim-key)
  "check":"L08.3", "lens":"L08",
  "locator":"SPEC/requirements.md#F-07", "claim_key":"F-07:llm-cost",
  "claim":"Fails if ...", "evidence":"> exact quote" , "evidence_level":1,
  "impact":"I3","likelihood":"L3","severity":"major","detect":"none",
  "chain":["then ...","and then ..."],
  "fix":"...", "fix_class":"decision", "verify":"grep ...", "ripple":["OVERVIEW.md","blueprint.json"],
  "status":"open|fixed|partial|regressed|accepted|withdrawn|missed-earlier|new-due-to-change|world-changed",
  "first_run":1,"last_run":2,"history":[{"run":1,"status":"open"},{"run":2,"status":"fixed"}],
  "anchor_hash_run1":"..." }
```
Id stability: derived only from check id + normalised locator + claim key, never from wording, so the same gap yields the same id in any run. Never reuse ids. Withdrawn findings keep their row with a reason (honest self-correction when the review itself was wrong).

### 5.9 Run-N protocol (blind first, then reconcile)

1. **R1 Blind sweep**: do P0-P5 completely. Do NOT read previous scores or findings text yet (anchoring guard). Compute ids.
2. **R2 Reconcile** (`lvr.mjs review ledger-diff`): join fresh findings with the ledger by id.
   - id in ledger, not in fresh, `verify` passes -> `fixed`.
   - id in ledger, not in fresh, `verify` fails or not run -> reviewer must justify; default `partial` (never silently fixed).
   - id was `fixed`, now fresh -> `regressed` (name the change that caused it).
   - id open and still fresh -> `open` (carried; severity may change only with a stated reason).
   - id not in ledger -> classify (R3).
3. **R3 Classify each new id** with a script-computed hint, then reviewer confirmation:
   - `new-due-to-change`: locator's section hash differs from `snapshot` of previous run (the user's edit created or exposed it; includes a fix's ripple). Fine, report neutrally.
   - `world-changed`: no local hash change, but the finding's evidence is an external fact whose source date postdates run N-1 or crossed the freshness limit. Cite the source.
   - `missed-earlier`: locator content unchanged since previous run AND the check existed in previous run's matrix (or was applicable). This is a review failure.
   - `checklist-gap`: check id did not exist in previous skill/checklist version (version stored in ledger header). Disclose; still counts toward "review quality" stat.
4. **R4 Apology + root cause** (mandatory when any `missed-earlier`/`checklist-gap` exists), template in `apology.md`:
   - Plain statement: "Run <n-1> should have caught <id> (<file#loc>). That text had not changed. This is on the review, not on your fixes."
   - Root cause enum: `cell-skipped`, `shallow-read` (quote not looked at), `claim-not-extracted`, `severity-miscalibrated`, `check-missing`, `no-web-blocked`, `fix-ripple-unmodelled`.
   - Repair: append a check to `.lvr/review/learned-checks.md` (id `LC-nnn`, phrased as a general check, linked to the lens) so the sweep covers it from now on; add the lens/cell if a gap; suggest upstream issue text for the skill maintainers (printed, not sent).
   - Scoring fairness: show both `score_now` and `score_if_caught_in_run1`; trend charts use the latter so users are not penalised for reviewer misses.
5. **R5 Score and stability check** (`lvr.mjs review stability`):
   - If every file hash is unchanged since the prior run, fresh scores must equal prior scores; any delta is a `SCORE-DRIFT` error to explain or fix (reviewer re-sweeps the differing lens).
   - Otherwise every lens delta must be explained by listed finding status changes ("-1 major fixed +1 new-due-to-change"); an unexplained delta blocks the report.
   - Report prints the delta table per lens.
6. **R6 Honest verdict**:
   - Nothing open: "No gaps found by L01-L15 (n cells, k passes, 0 new in last pass). Score 10/10 means no findable gaps with these checks, not a guarantee." Plus the "checked and sound" list with quotes, the residual-risk register (top 3 accepted/unknowable risks), and limits (what could not be verified).
   - Never pad: if clean, do not manufacture minors; if gaps remain, do not soften.
   - New genuine changes: say so without apology.

Total outcome the owner wants: run 2 either confirms fixes, reports world/changes neutrally, or admits misses with an apology and a durable repair. The apology count is a visible quality metric (`review_quality: missed_earlier=<n>`).

### 5.10 Deterministic parts for lvr.mjs (D8, zero-dep Node, prose fallback each)

| Command | Does |
|---|---|
| `lvr review snapshot` | Per-file and per-heading/row SHA1 -> `.lvr/review/snapshots/run-N.json` |
| `lvr review claims` | Regex extract: money/number+unit, dates, URLs, versions, `F-/M/D-` ids, absolutes, hedges, TBD; flags missing source/date; output claim register |
| `lvr review coverage` | Validates matrix: required cells filled; clean cells have a quote that exists verbatim in the file (substring check); rejects fabricated quotes |
| `lvr review ids` | Computes stable finding ids from check+locator+claim_key; detects duplicates |
| `lvr review ripple <claim_key|string>` | Lists every file/line containing the claim (for fix closure) |
| `lvr review verify <id>` | Runs the finding's mechanical `verify` (grep/jq-like predicates only; no shell eval of untrusted text) |
| `lvr review ledger-diff` | Join fresh vs ledger; status transitions; classification hints (hash diff, date logic, check-existed) |
| `lvr review score` | Applies severity lookup + scale table; outputs lens scores, overall, verdict, caps |
| `lvr review stability` | Hash-unchanged => scores must match; delta explanation table; SCORE-DRIFT error |
| `lvr review render` | `REVIEW-<date>-<n>.md` from ledger; sorted deterministically (lens, severity, id) |
| `lvr review freshness` | Applies freshness table to source dates, lists expired |
Quote-existence check and the snapshot hash are the two highest-value anti-hallucination controls.

### 5.11 Anti-sycophancy and honesty rules (in SKILL.md)
1. Lead the report with the worst finding. No opening praise, no "great plan".
2. Default stance: it is wrong somewhere; the job is to find where. A clean result requires the evidence list in 5.9 R6.
3. Every finding: verbatim evidence quote + a construction ("Fails if ..." with a concrete case) or a cited fact. No construction and no fact = delete (agentops rule). Do not pad to look diligent.
4. Do not invent weaknesses; do not invent praise. State "attempted and blocked" when an attack failed.
5. User pushback ("it's fine", "I know") changes nothing unless it supplies new evidence; record as `accepted` decision only via explicit user choice with cost written; never by silence.
6. Never lower severity to be agreeable or to improve the score; severity only moves through the lookup inputs.
7. Never present model memory as a source. No web = say so, cap L01, mark `unverified`.
8. State independence: "same context as the author" vs "fresh context". Do not call a same-context review independent.
9. Never score before the coverage check passes; never edit the bundle; never mark milestones verified.
10. Language: conversation in user's language; findings/ledger English.
11. Self-review is allowed to withdraw findings it later proves wrong; the withdrawal is logged.

### 5.12 Preconditions and placement
Keep refusal guidance but decouple from S9 where useful: full review after S9 (bundle present). A lighter `--scope-only` review (lenses L01, L02, L04, L08, L10, L15 on the S7 scope record) can run at S7 lock so gaps are caught before the 20 files are generated; same ledger, same ids, cells for absent files marked `na(file-not-yet-built)` and re-opened at full review (not a "missed earlier").

### 5.13 Open decisions for the owner
1. Overall formula and 8-point gate: confirm (ours, tunable in `scale.md`).
2. Freshness limits table: confirm numbers.
3. Whether the review may auto-apply nothing at all (design assumes yes) or offer `--apply-mechanical` later.
4. Fresh-context second pass: use a subagent where the harness has one, else same-context with reversed order (labelled).
5. Rename to `lvr-review-plan` vs keep `recheck-plan` (docs/spec/03-skills.md needs update: step list at lines 47-57, journal events collapse to `review_started`, `review_done` since the ledger carries finding detail).

### 5.14 Acceptance tests (M1/M4 style)
- Fixture run twice on an unchanged bundle: identical ids, identical scores (byte-equal render).
- Mutate one price row: only L01/L08 and ripple files change; `new-due-to-change` classification only.
- Seed a known gap that the checklist should catch, remove its check from lens file, run 1 misses, restore, run 2 reports `checklist-gap` + apology.
- Break a verbatim quote: `coverage` rejects.
- Futsal fixture: every one of the 7 prior audit gaps must surface in run 1.
