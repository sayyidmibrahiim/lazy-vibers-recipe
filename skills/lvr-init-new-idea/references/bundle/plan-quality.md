# Plan quality checks

Run each check in its owning interview section. Reuse the user's answers wherever possible. Show and record design defaults with their decision status. Every material assumption has a way to confirm it.

## S2 and S5 — Costs at different usage levels

S2 records the user's budget and a usage estimate, with a period and source. Ask how many people or transactions they expect when the existing answers give no useful range. Record typical and busy-month counts, one-time costs and recurring fixed costs. Derive other usage from the feature flow, such as proof uploads per booking or model calls per active user. Mark a volume supplied by the team as an assumption and show the impact of a higher volume. If actual counts are unavailable, state a supported range or keep the affected total open.

S5 writes a cost row per service with the billing unit, included allowance, unit price and currency, expected usage, typical and busy-month costs, paid fallback and dated source. Cover calls, database reads and storage, outbound email, file transfers and money movement when the service charges for them. For usage billed linearly, apply `max(0, usage - allowance) × price per unit`. Use the provider's actual rules for tiered prices, minimum charges and separate fees. For a model, calculate input and output tokens independently. Show the monthly total and per-active-user cost when the denominator is known and nonzero. Keep usage assumptions and sourced rates visible. Send a material unknown or a total beyond the confirmed ceiling to S6. Write a warning or spending cap with the owner's choice when one is needed.

## S3 — Abuse and access

Record whether users without an account can submit data. On the evidence-bearing answer, set `product.flags.public_form` to true or false when known. A true value enables `threat-modeling` in S3 even if the form stores nothing. Rerun the section's booster plan when new evidence activates it. Use the internal checklist during a degraded run.

For each public submit or upload route, spell out who can call it, what it can change, what a repeated or malicious submit can do and how the system responds. Record two explicit decisions with rationale or combine them in one logged decision.

1. Rate limit. Name the scope, time window and threshold or cite a confirmed provider-controlled limit. Describe what users see when they hit it, how retry works, and how valid drafts survive. Include an observable verification and an owner-facing signal for sustained spikes.
2. CAPTCHA or other human verification. State apply, defer or decline. Give the reason, accessibility and privacy implications, and the fallback if it denies legitimate users. For a deferred guard, name the condition that triggers reconsideration.

Also check authorization on every protected route, data leaks on list/lookup endpoints, duplicate operations, upload validation and secrets in logs when applicable. Identify assets and trust boundaries, abuse outcome, mitigation, residual risk, accountable role and acceptance test. Make each high-risk case trace to a feature, answer or decision. When there are no public inputs, record that outcome and check remaining trusted input surfaces.

## S4 — Unhappy paths

Review four failure types for every captured feature using `deliver-edge-cases` or this checklist when it is unavailable. Cover abandon/interruption, invalid input, simultaneous or repeated actions, and expiry/hold. For each type give a trigger, the user's visible recovery or message, what is saved or released, and a testable result. Give a concrete reason when a type is inapplicable. A read-only report can still be interrupted, receive a bad date, or race with a new update. A hold or time-limited action always names its deadline source, time zone and stale action outcome. Give special attention to retries that could charge, book, store or send twice.

Ask only about an unresolved choice that affects data, money or another person's result. Take safe defaults for routine messages or recoveries, surface them for correction, and record them as design decisions. When the user says enough, stop collecting features and check each captured feature for its script, priority and all four failure types. Use the existing complete-or-drop batch for unresolved user decisions. Carry the applicable failure cases to requirements, flows and milestone checks.

## S6 — Regulated domain

Always record a `Regulated-domain screen` finding. Check finance, health, legal services and minors against the planned features, actors, data and target places. Record each domain as applicable, absent or unclear, with the answer or research that supports it. Distinguish incidental payment collection from a financial service, storing a field from offering medical advice, and a general audience from a service intended for minors. Confirm unclear facts with the user and record `product.flags.regulated_domain` when decided.

If any domain applies or remains unclear, log jurisdiction-specific research using relevant primary authorities. Record what the product would have to do, what remains unverified, and who owns the follow-up. Route unresolved legal requirements through a blocking S6 loop-back. A user can change scope or accept a residual product risk after hearing it. They cannot waive a known legal obligation. Put the supported conclusion in SECURITY.md and the dated sources in RESEARCH.md.

## S8 and S9 — Measurable quality and operations

For each row record scope, target or behavior, responsible role, milestone, observable verification and the supporting decision. Where applicable, include all of these rows.

| Area | What to decide | What the milestone proves |
|---|---|---|
| Time zones | Stored time, display zone, business day and boundary behavior | Fixed instants straddling midnight map to the expected local day. |
| Browsers and devices | Supported browsers, platform versions or devices from S2 | A named task passes on the named support matrix. |
| Accessibility | Keyboard path, visible focus, labels, touch and contrast targets for the actual UI | A keyboard and touch inspection has numerical or observable pass conditions. |
| Error tracking | Operations and fields captured, redaction, correlation, alert threshold/window and retention | A controlled failure is traceable without personal data. |
| Availability | Health/readiness signal, check interval, success target, time window and failure policy | A failing service transitions through the specified states and recovery. |
| Owner alerts | Responsible role, delivery channel, repeat policy, response time and fallback | A test failure reaches a test inbox and the owner can follow the response steps. |
| Restore | Backup interval, data-loss and recovery targets, restore test and retention | Recover a known disposable snapshot, check counts and behavior, and measure restore time. |

Only mark an area inapplicable with a reason tied to the product. Plan tasks such as checking storage health without inventing a hosted uptime promise for a local-only product. Include health/alert verification and restoration in the milestone that first exposes the dependency to users. Put the criteria in MILESTONES.md and exact steps in VERIFICATION.md. Put operating steps, responsibilities, backup and restore in HANDOVER.md, and architecture constraints in SPEC/architecture.md.

## S9 — Data sources and integrations

Add a `Data sources and integrations` section to SPEC/architecture.md. Include first-party data, imported sets, APIs, model services and external tools where they are part of the build. Each entry names origin and responsible role, fields or event, access boundary, permission or license/terms and its evidence, refresh or delivery cadence, expected delay, and behavior when stale or unavailable. For first-party data, record who supplied or owns it and the basis for processing. For a third party, cite the current official source and terms with dates. Carry restrictions and any paid usage into SECURITY.md and RESEARCH.md. Never treat a draft integration as permission to ingest or send personal data. If there are no sources or integration dependencies, record that and its scope.
