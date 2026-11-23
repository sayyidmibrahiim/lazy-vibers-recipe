---
name: lvr-personal-brand
description: Builds a separate personal-brand kit (positioning, LinkedIn profile, content plan) after every milestone and the release check for each product type pass. Use when the user wants to market themselves or the product, write a LinkedIn profile, or plan content after the product ships. Never posts, never invents traction, and never touches the Blueprint Bundle.
---

# lvr-personal-brand

The post-build branding skill of the LVR pipeline. It turns a verified, deployed product into an honest personal-brand kit: what the owner built, who it helps, what proof exists, and what to say next. It is a separate output — deliberately outside the product pipeline and outside the Blueprint Bundle.

The gate requires verified milestones and current evidence that people can use the released product.

## Load first

Before any check or file write:

1. Read `references/principles.md` (the Constitution). Principles 1, 2, 6, 7, and 11 bind this skill hardest.
2. Read `references/conventions.md` (the operational manual): state schema, journal events, bundle list.
3. Read `references/brand-templates.md`: the three output templates and the evidence table rules.
4. Follow the conversation language and the before-write English document check in conventions §4.
5. **Script helper (preferred when Node is available).** This skill ships `scripts/lvr.mjs` (Node ≥22, nothing to install). `<skill-dir>` = the folder holding this SKILL.md (use the base directory the harness reports; otherwise look for `lvr-<this-skill>/scripts/lvr.mjs` in the skills directories listed in INSTALL.md). Once per session run `node "<skill-dir>/scripts/lvr.mjs" version`. If it prints JSON with `"lvr_schema":2`, run the `Script:` command given at each step below (`LVR` = `node "<skill-dir>/scripts/lvr.mjs" --dir "<PROJECT_DIR>"`) and act on its JSON. **Preflight (every skill except /lvr-init-new-idea):** run `LVR state migrate --check`. If `needed` and `blocked` is null, run `LVR state migrate` and tell the user in one plain line (English source): "This project was made with an older LVR version. I updated its bookkeeping files to the new format; the old files are kept in `.lvr/migrations/`." (If `copied_from` is `.lvp`, ask once whether to remove the old `.lvp/` folder, default keep; on yes run `LVR state migrate --remove-legacy`.) If `blocked` is set, /lvr-continue follows its recovery for `blocked.code`; every other skill stops and recommends /lvr-continue. If any command answers `SCHEMA_TOO_NEW` (exit 1), the project was made by a newer LVR: change nothing and tell the user to update all LVR skills together. **Session:** after the preflight (init: in its Step 1) append `session_start` with `{"skill":"<this skill>","harness":"<harness id>","session_id":"<id the harness exposes>" or null with "session_id_reason":"<why>","model":"<model id>","cwd":"<cwd>"}` — use the confirmed ID source in `references/harnesses.json` and never invent an id — and at every exit append `session_end` with `{"reason":"done|paused|context_guard|error|cancelled","note":"<why>"}` (`note` is required for `cancelled`, which is how a refusal is recorded; `error` is journaled only after an unrecoverable failure left work half-done, never for a refusal). If `node` is missing, the command cannot start, or `lvr_schema` differs, say once (English source): "Node.js is not available here, so I'll do the bookkeeping by hand." Then follow each step's prose — the prose is the fallback and stays authoritative for behavior. Never hand-edit `.lvr/` files to work around a script error (`"ok":false`): report its `code` plainly and stop that step. On any non-zero exit (`"ok":false`) stop the step, show the error and follow `error.details.hint`; exit code 3 means the event was journaled (`journaled_seq`) or blocked but `state.json` was NOT updated (`STATE_LAGS`, `STATE_MISSING`, `STATE_INVALID`, `STATE_SEQ_UNKNOWN`, `JOURNAL_BEHIND_STATE`): do not continue the interview, run `/lvr-continue` (its Step 2 maps each code to the exact command). Pass long text through `--in -` with a quoted heredoc (`<<'EOF'`) or a PowerShell here-string (`@'…'@ |`), never inline in double quotes.

## Flow at a glance

1. **Gate** — every milestone verified and every confirmed type's release proof checked in this run. A failure stops drafting and names the missing evidence.
2. **Open** — journal `brand_started`; load product evidence.
3. **Owner facts** — ask only what the bundle cannot answer.
4. **Evidence table** — every claim `verified`, owner-approved `(claimed)`, or forbidden.
5. **Draft** — `brand/BRAND.md`, `brand/LINKEDIN-PROFILE.md`, `brand/CONTENT-PLAN.md`, one file per turn.
6. **Self-check + close** — evidence rule, link check, journal `brand_done`; nothing posted.

## Step 1 — Gate

`TARGET` = cwd (or the folder the user named). Run in order. The first failure stops with plain guidance before any kit files are written.

Script: `LVR release plan` before writing the kit.

1. **Project exists** — `TARGET/.lvr/state.json` exists and parses. Missing/unreadable → `/lvr-init-new-idea` or `/lvr-continue`.
2. **Milestones verified** — `state.milestones[]` is non-empty and every entry has `verified: true`. Any unverified → name the first one and say: "The product is not finished yet. Run `/lvr-build` to execute and verify milestone `<M>` first."
3. **Release evidence** — get the check for every confirmed type from `LVR release plan`. Without Node, read `release_check` in the corresponding `references/profiles/<type>.json`. Web requires a recorded live deployment URL. An installable product requires a passing recorded check with the exact artifact or version and evidence. Older web bundles with a recorded deployment URL use the web profile. When evidence is missing, name the type and direct the owner to `/lvr-build`.
4. **Check the release now** — use a clean client for web and require a 2xx response with one expected product fact from `OVERVIEW.md` or `VERIFICATION.md`. For each other type, repeat its profile procedure on the recorded artifact from a clean environment. Capture what ran and the observed output. A record from a previous run is only a pointer. If a check fails or the necessary tool, release or access is unavailable, stop and name the missing proof. No brand kit is ready without every check passing.
5. **Bundle present** — `AGENTS.md`, `OVERVIEW.md`, `DECISIONS.md`, `VERIFICATION.md` exist. Missing → "The bundle is incomplete (`<file>` is missing). Run `/lvr-continue` to finish S9, then re-run." (`/lvr-handoff` only lints; it does not write these files.)

No handoff requirement: the brand kit needs the product evidence, not the builder prompt.

## Step 2 — Open and load evidence

Script: `LVR journal append --type brand_started --in -` with the checked targets, product types and observed results.

1. Journal `brand_started` with each checked target and the observed proof. Include the live URL for web or the artifact identity for an installable product. One checkpoint.
2. Load, in this order: `OVERVIEW.md` (owner-visible truth), `DECISIONS.md` (why it is shaped this way), `SCOPE.md` (what is in and parked), `VERIFICATION.md` (what is proven), `RESEARCH.md` (market context with sources), `HANDOVER.md` (how it runs), `state.json` (milestones, deployment, user language). `SCOPE.md`, `RESEARCH.md`, and `HANDOVER.md` are not gated: a missing one is skipped, and the kit names it under `Open questions for the owner` (the claims it would have backed stay `unverified`).
3. Extract a one-screen product brief with name, one line, audience, problem, in-MVP features, verified milestones, release targets, parked items and stack. Use recorded product evidence (principle 13).
4. For workflow products, read the public purpose, permissions and output contracts. Leave personal profile values, raw evaluation inputs and tool configuration out of the brand kit. Cite approved aggregate evidence or synthetic examples instead.

## Step 3 — Owner facts

Ask only what the bundle cannot answer, in one micro-batch per tier:

- owner display name and current role/title;
- goal of the brand: job, consulting, product users, community;
- audience priority when the product serves several groups;
- tone preference for the profile copy;
- links to include (repo, portfolio, product, none);
- anything the owner refuses to mention.

Skip and enough controls stay visible. A skipped fact becomes a visible `Open questions for the owner` line in the output, never a silent guess.

## Step 4 — Evidence table

Build the table from `references/brand-templates.md` before drafting. Walk every claim the kit might make:

- Product capability uses a recorded `VERIFICATION.md` result or a visible fact from the release check. Name the procedure and date. A model/workflow evaluation or a UI compliance claim needs captured results, scope and denominator for a pass rate. A planned test is an open question.
- Owner experience uses recorded answers or dated project evidence for the specific claim. Confirm a title or individual contribution when the record cannot establish it.
- Market and platform facts need current live sources. Reuse the citations in `RESEARCH.md` within their `freshness.json` limit, then check the key facts on the actual source pages. Verify LinkedIn limits and formats on current first-party guidance when they affect the draft. Cite the sources and dates in the private evidence notes. Stop external research when search/fetch is unavailable and use the enable steps in conventions §10.
- An unproven owner-supplied claim needs explicit approval and the `(claimed)` marker. Invented users, revenue, awards, endorsements or results stay out of the kit.

If a writer or marketing specialist will help, use a verified planning-only route when available. Send only the approved public-facing evidence and give any suggestion the same fact check. Journal the actual transport using `agent_delegated`. The inline route uses the same boundaries.

## Step 5 — Draft the three files

Script: `LVR journal append --type brand_file_generated --payload '{"path":"brand/BRAND.md","claims":0,"unverified":0}'` per file.

Create `brand/` in the project folder (beside the bundle, never inside it). One file per turn (T3: one top-level section per turn, append-chunks):

1. `brand/BRAND.md` — one line, audience, problem, positioning, three message pillars with proof, voice, boilerplate bio, links.
2. `brand/LINKEDIN-PROFILE.md` — headline options, About, experience entry, featured links, skills, open questions.
3. `brand/CONTENT-PLAN.md` — 10–15 post ideas tied to pillars and real evidence, cadence, posting rules, repurpose ideas.

Rules:

- Use the templates verbatim in structure; content comes from the evidence table.
- Same product name, one line, and audience names as `OVERVIEW.md` and `blueprint.json`.
- Check the English prose before saving each file. Explain the draft in the owner's conversation language when asked.
- Keep the evidence and citation tags in the relevant draft. Preserve them during the prose edit so the owner can trace market facts, platform limits and observed verification.
- No Mermaid; ASCII diagrams only if one helps.
- After each file: journal `brand_file_generated` (payload: path, claims count, unverified count) + state write. One checkpoint per file.

## Step 6 — Self-check and close

Script: `LVR cite check --file brand/BRAND.md --file brand/LINKEDIN-PROFILE.md --file brand/CONTENT-PLAN.md`. After the checks, use `LVR journal append --type brand_done --payload '{…}'`.

Use `LVR booster plan --section S9 --harness NAME` and the [project-local lifecycle](references/booster-lifecycle.md) to load `anti-slop` from its verified pin. Load `ux-copy` when it fits the approved product and owner voice. Run the prose pass after the first draft. Remove filler and repetitive phrasing while preserving facts, sources, structure and the owner's voice. If an aid cannot load, record the degradation and carry out the same edit inline.

Run the checklist in `references/brand-templates.md`:

- every product claim `verified` or approved `(claimed)`;
- no invented traction;
- names consistent with the bundle;
- links resolve and the release evidence from Step 1 still applies;
- cite check reports zero findings for the generated files and no prose edit changed an approved claim or citation;
- files under `brand/`, not in the bundle;
- nothing posted, scheduled, or sent anywhere.

Then journal `brand_done` (payload: files, verified claims, claimed claims, open questions) + state write. One checkpoint. Scope the cleanup list from `brand_started` through `brand_done` and ask before removing eligible copies.

Close in plain language: what exists, what each file is for, what the owner must fill or approve, and the one next action (review `BRAND.md` first, then the profile copy). Never offer to post on the owner's behalf.

## Journal events added by this skill

`brand_started`, `brand_file_generated`, `brand_done`. Payloads are named above.

## Idempotency

- Re-running checks the gate from disk and repeats the release procedures on the recorded artifacts.
- Existing brand files are never overwritten wholesale: show the drift, then regenerate one file on explicit request.
- Files already generated and unchanged are skipped, not duplicated.

## Never list

- Never run before every milestone is verified and the live check passes. (Principles 1, 9)
- Never write a metric, user count, revenue, award, or endorsement without evidence.
- Never post, schedule, message, or create an account on any platform.
- Never put brand files inside the Blueprint Bundle or modify bundle files.
- Keep the saved brand kit in English.
- Never guess a skipped owner fact; list it as an open question. (Principle 12)
