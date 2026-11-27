# S3 — Data and privacy

<!-- lvr:english-summary -->

Answer source note: every S3 answer was given by the owner's delegated test agent, answering on the owner's behalf for this trial (owner's note at S1.q6). The source is recorded here and in the decision rationales.

## Answers
- **S3.q1 Data inventory** — Keep everything proposed: financial profile, criteria, default figures with dates, imported listings, shortlist. CSVs sometimes hold agent names and phone numbers; drop those columns at import and keep only the listing link. (delegated test agent)
- **S3.q2 Loss and backup** — Option a: Linux full-disk encryption plus an "Ekspor cadangan" button. Disk-encryption status: the owner does not know. (delegated test agent)
- **S3.q3 Erasure** — Option c: delete all and delete per import; confirm by typing HAPUS; the financial profile can be deleted on its own. (delegated test agent)
- **S3.q4 Confirmation of D-021–D-023** — Approved. (delegated test agent)
- **S3.q5 Confirmation of D-027–D-029** — Approved. (delegated test agent)
- **S3.q6 Backup reminder** — Option a: together with the 30-day defaults warning. (delegated test agent)
- **S3.q7 Backup file protection** — Option a: no app encryption; warning at export. (delegated test agent)

## Decisions this Section
- **D-021** Server listens only on 127.0.0.1 and rejects any request whose Host header is not localhost/127.0.0.1 with the app port — U-18 [cite: general · https://dev.to/custodiaadmin/the-dns-rebinding-vulnerability-in-self-hosted-browser-mcps-and-why-hosted-matters-25g7 · pub 2026-02-24 · acc 2026-11-26] [cite: general · https://github.blog/security/application-security/dns-rebinding-attacks-explained-the-lookup-is-coming-from-inside-the-house/ · upd 2025-06-10 · acc 2026-11-26] · status: designer_filled (approved S3.q4). The journal rationale carries two undated tags from the first search; the dated tags above replace them.
- **D-022** No network calls of the app's own: no analytics, error reporting, online fonts or scripts, maps or AI services; works offline — D-006 · status: designer_filled (approved S3.q4)
- **D-023** No legal privacy policy or consent screen: personal household use is outside UU PDP; reopened if shared or used commercially — U-02 · status: designer_filled (approved S3.q4)
- **D-024** Stored data: financial profile, criteria, default figures with dates, listings, shortlist; agent name/phone columns dropped at import — S3.q1 · status: user_confirmed
- **D-025** Protection at rest via Linux disk encryption (LUKS); "Ekspor cadangan" and restore; handover includes the `lsblk -f` check and the Profile page reminds until ticked — S3.q2 · status: user_confirmed
- **D-026** Erasure: all, per import, or profile only; type HAPUS; data removed, not hidden — S3.q3 · status: user_confirmed
- **D-027** CSV is untrusted: plain-text rendering, only http/https links, 5 MB / 2,000-row limit, formula-safe export — threat-modeling pass · status: designer_filled (approved S3.q5)
- **D-028** Data-changing requests accepted only with the app's own Origin — threat-modeling pass · status: designer_filled (approved S3.q5)
- **D-029** In-app "Data & privasi" page in plain Indonesian — privacy-policy rule, D-023 · status: designer_filled (approved S3.q5)
- **D-030** Backup reminder with the 30-day defaults warning — S3.q6 · status: user_confirmed
- **D-031** Backup files unencrypted in v1, warning at each export; residual risk accepted — S3.q7 · status: user_confirmed

## Public inputs and abuse
No public submit or upload route exists: the app is reachable only from the owner's own browser on the laptop (D-021), there is no login (D-007) and `public_form` is false. Rate limit and CAPTCHA: not applicable for that reason; reconsider only if the app is ever exposed beyond 127.0.0.1. Trusted input surfaces checked: CSV upload (D-027), profile and criteria forms and delete actions (D-028), backup import (D-027 limits apply).

## Threat model (threat-modeling booster, STRIDE)
Assets: financial profile (high), listings and shortlist (low), backup file (high). Trust boundaries: browser ↔ local server; CSV file ↔ app; app ↔ backup file outside the app.

| Threat | Element | Response | Decision | Acceptance test |
|---|---|---|---|---|
| I: website reads profile via DNS rebinding | browser → server | mitigate | D-021 | request with `Host: evil.example` gets 400 |
| I: other device on the Wi-Fi opens the app | network | mitigate | D-021 | connecting from another machine's IP is refused |
| T: website submits a hidden form (delete/overwrite) | browser → server | mitigate | D-028 | POST with a foreign Origin gets 403; data unchanged |
| T: CSV carries markup, `javascript:` links or formulas | CSV → app → export | mitigate | D-027 | crafted CSV renders as text; exported cell starts with `'` |
| D: oversized CSV freezes the app | CSV → app | mitigate | D-027 | 6 MB file refused with a message |
| I: data leaks to an online service | app → internet | avoid | D-022 | app works with networking off; no outbound connection observed |
| I: laptop lost or stolen | storage file | transfer to OS | D-025 | `lsblk -f` check in handover |
| I: backup file copied to cloud or chat | backup file | accept | D-031 | export shows the warning text |
| R / E | — | not applicable: single user, no roles | D-005, D-007 | — |

Residual risks accepted by the owner: unencrypted backup file (D-031); disk-encryption status unknown until checked (D-025).

## Exit criteria
- [x] Login yes/no — evidence: D-007 (no login)
- [x] Personal data inventory — evidence: D-024
- [x] Payments yes/no — evidence: D-014 (none)
- [x] Web profile: what forms keep, who may see it, when to delete — evidence: D-024, D-005, D-026
- [x] Privacy-policy decision recorded — evidence: D-023, D-029

## Booster
grilling: installed, used at start · threat-modeling: installed this Section (pinned SHA b198754), used for the threat-model pass (D-027, D-028)

## Context research
RQ-011 · items shown: U-02, U-18 · became: D-023, D-021
