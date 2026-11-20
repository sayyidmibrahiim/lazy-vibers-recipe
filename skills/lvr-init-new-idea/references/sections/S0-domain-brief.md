# Domain Brief and Section scans — research guide

Work guide for principle 14 ("Research what the user doesn't know"). The English text is the source; research runs on English sources plus the primary local sources of the user's market, and findings are stored in English (conventions §4). The cite syntax, freshness limits, and research-log events are in conventions §10; follow them exactly.

Two jobs live here:

1. **The Domain Brief** — built once, right after S0 closes and before S1's first batch.
2. **The per-Section scan** — before the first batch of every Section S1–S8.

Both write to `PROJECT_DIR/.lvr/docs/research/domain-brief.md`. The file on disk is the memory (principle 13): append each research step before the next one starts.

## 1. The Domain Brief

Input: the S0 record — the idea (English summary), the User Language, and the confirmed market (`S0` answer). Goal: 8–15 items a person in the user's position usually does not know, and would regret not knowing.

### Research steps (one per heading; T3: one step per turn)

Log each step with `LVR research log --context --in -` (`scope: "brief"`, `section: "S0"`, `findings`: the U-ids it added), then append its rows.

1. **Rules and regulations** — laws, licences, and permits for this kind of product in the market; the regulator for this domain (central bank, financial authority, health, education, transport, food…); data-protection law; consumer rules (refunds, receipts, cancellation, age limits); tax on what the product sells. Search the regulator's own site first (`primary`). Every regulation row carries `amend-check` with the day you searched for newer amendments.
2. **Typical costs and hidden fees** — what this kind of product or service usually costs the user and their customers in the market, and the fees people discover late: payment-gateway fees, taxes, admin and provisioning fees, penalties, renewals, store fees, insurance. Current price pages only (`price`, 30 days).
3. **Common failure modes and pitfalls** — why products like this fail or hurt their users: complaints in reviews and forums, regulator warnings, well-known disputes.
4. **Key terms** — the 3–6 words the user will meet (in the market's language and in English), each defined in one line.
5. **What similar users usually expect** — features and behaviors that comparable products have made normal in this market (and what users there complain is missing).

Search queries name the market and the current year. Prefer, in order: the official source (regulator, law text, vendor's own page) → an established local outlet → anything else. Key facts (`price`, `quota`, `version`, `legal`, `regulation`) need one primary source or two independent sites (conventions §10).

### Template

```markdown
# Domain Brief

- Idea (EN): <one line from the S0 summary>
- Market: <country> (<S0 answer id>)
- Built: <YYYY-MM-DD> · Research log: <first RQ>…<last RQ>
- Status: in progress | complete

## Rules and regulations (<country>)

| ID | Finding (EN) | Why it matters | Source | Section | Became |
|---|---|---|---|---|---|
| U-01 | <one plain sentence> | <one line: what goes wrong if the user does not know> | [cite: regulation · <url> · pub <date> · acc <date> · primary · amend-check <date>] | S3 | |

## Typical costs and hidden fees

<same table>

## Common failure modes and pitfalls

<same table>

## Key terms

<same table; the Finding cell is "<term> (<local term>) — <one-line definition>">

## What similar users usually expect

<same table>

## Per-section scans

<same table, rows added by each Section scan>

- <S> scan (<RQ id>): <n> new items (<U-ids>) | no new unknowns — <reason>
```

Column rules:

- `ID` — `U-01`, `U-02`, … one id space for the whole file, scans included.
- `Source` — one cite group (conventions §10), or `[unverified: <category> · RQ-NNN]` after logged research failed.
- `Section` — the Section where the item matters most: `S1` context, `S2` costs and accounts, `S3` data, money and law, `S4` features, `S5` stack and vendors, `S6`–`S8` rarely. Exactly one.
- `Became` — empty until the item is handled; then the answer id (`S3.q4`) or decision id (`D-012`) it turned into. `cite check` (I13) flags an item whose Section is done while `Became` is still empty.
- A heading with nothing found keeps one line: `None found — <queries tried, RQ id>`.

Set `Status: complete` when all five headings are filled. Then run `LVR cite check --file .lvr/docs/research/domain-brief.md` and fix every finding before S1 starts.

## 2. The per-Section scan

Run once per Section, after `section_start` and before the first batch (engine step 1b). A loop-back into a Section does not re-scan it.

| Section | What to search (in the user's market) |
|---|---|
| S1 Context | who else solves this problem; what users of similar tools complain about |
| S2 Conditions | real current prices for the accounts, hosting and devices this platform needs; hidden fees and renewals; whether local cards are accepted |
| S3 Data & privacy | data-protection duties for the data this idea keeps; rules for taking money; consumer and age rules; vendor terms that restrict this use |
| S4 Features | features similar products made normal; legal must-haves that become features (consent, receipts, cancellation, deletion) |
| S5 Deep research | the S5 research itself is the scan; start with the brief items targeted at S5 |
| S6 Feasibility | `LVR cite check --all`; research every expired fact again; new price or rule changes since S5 |
| S7 Scope lock | `LVR cite check --all`; legal must-haves that cannot be parked |
| S8 Milestones | `LVR cite check --all`; platform limits, review times, and quotas that affect deploy and verification |

- S1–S4: at least one targeted search. S6–S8: the freshness re-check first, then searches as needed.
- Log the scan with `LVR research log --context --in -` (`scope: "scan"`, `section: "<S>"`, `findings`: new U-ids, or `[]` plus `note`).
- Append new items to `## Per-section scans` and add the summary line.

## 3. "Things you may not know"

Before the Section's first batch, show the open items targeted at this Section (brief and scan rows whose `Became` is empty), in User Language, at most 5 per message (T3: 2). English source:

"Before we go on, here are things people in your situation often don't know. I checked each one today:
1. <finding in plain words> — <why it matters, one line> (source: <site name>, <date>)
2. …"

Then turn each item into exactly one of:

- **A question** — when the answer depends on the user (does this rule apply to you? can you afford this fee?). It counts toward the tier's batch size; record it like any answer. `Became` = the answer id.
- **A `designer_filled` decision** — when the user could not decide it and the source settles it (the law requires a privacy policy, so the plan has one). Its rationale cites the item and its tag: `per U-03 [cite: …]`. `Became` = the decision id. Never for an item whose source is `[unverified: …]`: that one is always a question (principle 1).

Update the `Became` cell at the checkpoint where the answer or decision is recorded. Write one line into the Section Record under `## Context research`: `<scan RQ id> · items shown: <U-ids> · became: <answer ids, decision ids>`.

## 4. Resume

- Brief missing after S0 is done (an older project, or a session that died) → build it now, before the next batch of any Section.
- Brief `Status: in progress` → continue at the first heading with no rows and no `None found` line; never redo a logged step.
- A Section in progress without a `context_research` scan event for it → run the scan before the next batch. Items already shown keep their `Became` cells.
