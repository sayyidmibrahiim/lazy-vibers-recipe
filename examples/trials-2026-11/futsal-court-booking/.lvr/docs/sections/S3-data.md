# S3 — Data & privacy

<!-- lvr:english-summary -->

## Coverage plan

| Key | Fact needed | Evidence so far |
|---|---|---|
| login | Login yes/no | D-007, S3.q1 — players book without an account; only admin pages need login |
| auth-method | Admin login method and admin email | S3.q3, D-022 |
| data-inventory | What personal data is kept (or explicitly empty) | S3.q1, D-020 |
| payments | Money inside the app yes/no | S2.q6, D-016 — none in the first version |
| privacy-policy | Privacy-policy decision (triggered by personal data) | D-017 (designer_filled) |
| public-form | Web profile: what the public booking form keeps, who sees it, when it is deleted | S3.q1, S3.q5, S3.q6 — D-020, D-024, D-025 |
| abuse-controls | Abuse outcomes, rate-limit and CAPTCHA decisions with verification | S3.q4, D-023 |
| tax-location | Where the venue sits, for the regional tax (U-04, U-20) | S3.q2, D-021 |
| pse | Whether to register as a private electronic system operator (U-03) | S3.q7, D-026; route and NIB prerequisite D-054 (S7) |
| pdp-regulation | Duties added by the implementing regulation PP 33/2026 (loop-back L-03) | S3.q10, D-056 |

Progress: S3: 10 of 10 facts known (pdp-regulation added by loop-back L-03).

## Answers

Answered by the delegated test agent on the owner's behalf (`answered_by: delegated_test_agent`); asked in Indonesian.

- **S3.q1** Data per booking: booker or team name and WhatsApp number, plus court, date, time and booking code. Nothing else. Confirms D-007 (public booking form without an account). → D-020; product flags `stores_data`, `public_form` set true.
- **S3.q2** Venue treated as South Jakarta for the trial; schedule prices are final prices including 10% PBJT. → D-021
- **S3.q3** One admin account, email and password login, dedicated venue email with two-step verification. → D-022
- **S3.q4** Abuse controls agreed as recommended. → D-023
- **S3.q5** Visibility agreed as recommended. → D-024
- **S3.q6** Retention and deletion agreed as recommended. → D-025
- **S3.q7** PSE registration before public opening, as a launch task. → D-026
- **S3.q8** (loop-back L-01 from S6) Online booking only for bookers aged 18+, or a parent/guardian booking for their child; new consent tick box text. → D-050
- **S3.q9** (loop-back L-01 from S6) Form notice and privacy policy state that booking data is stored with the provider in Singapore under a data-protection agreement. → D-051
- **S3.q10** (loop-back L-03 from S7, asked as S7.q4) Read PP 33/2026 and update the privacy decisions where needed. → D-056 (drafted from the regulation, shown for correction)

## Decisions this Section

- **D-017** Privacy-policy page plus a purpose notice and explicit consent tick box on the booking form (tick box wording per D-050; notice includes the storage-abroad sentence per D-051) — per U-01 [cite: regulation · https://peraturan.bpk.go.id/Details/229798/uu-no-27-tahun-2022 · pub 2022-10-17 · acc 2026-11-26 · primary · live · amend-check 2026-11-26] · status: designer_filled
- **D-018** Written breach procedure: notify affected players and the authority within 3 x 24 hours — per U-02 [cite: regulation · https://peraturan.bpk.go.id/Details/229798/uu-no-27-tahun-2022 · pub 2022-10-17 · acc 2026-11-26 · primary · live · amend-check 2026-11-26] · status: designer_filled
- **D-019** Admin "forgot password" sends a reset email to the admin email — follows D-007 · status: designer_filled (approved by the delegated agent with batch 1)
- **D-020** Data inventory: name or team name and WhatsApp number, plus court, date, time and booking code; no sensitive data — S3.q1 · status: user_confirmed (delegated)
- **D-021** Venue treated as South Jakarta; schedule shows final prices including 10% PBJT — S3.q2, per U-04 · status: user_confirmed (delegated)
- **D-022** One admin account, email and password, dedicated venue email with two-step verification owning every service account — S3.q3 · status: user_confirmed (delegated)
- **D-023** Abuse controls: max 2 upcoming bookings per WhatsApp number; Cloudflare Turnstile checked on the server; max 5 submits per 10 minutes per device/connection; admin cancels and blocks numbers — S3.q4 [cite: price · https://developers.cloudflare.com/turnstile/plans/ · upd 2026-08-14 · acc 2026-11-26 · primary · live] · status: user_confirmed (delegated)
- **D-024** Visibility: public schedule shows only Available/Taken; full data admin-only via database row rules; confirmation page by random code with masked number; price read from the database — S3.q5 · status: user_confirmed (delegated)
- **D-025** Retention: name and number erased 90 days after play date; exports older than 90 days deleted; deletion or withdrawal requests via venue WhatsApp handled within 3 x 24 hours and the player told — S3.q6, UU 27/2022 Art. 40, 43, 45 [cite: regulation · https://jdih.kemenkeu.go.id/download/46c17b53-4a45-411c-9b76-c6799e5769fc/UU_Nomor_27_Tahun_2022%20Perlindungan%20Data%20Pribadi.pdf · pub 2022-10-17 · acc 2026-11-26 · primary · live · amend-check 2026-11-26] · status: user_confirmed (delegated)
- **D-026** PSE Lingkup Privat registration with Komdigi before public opening; launch task; procedure re-verified in S5 — S3.q7, per U-03 · status: user_confirmed (delegated). Correction (L-03): S5 did not re-verify it; the route was checked in RQ-017 and recorded as D-054 (S7): registration through OSS after an NIB [cite: legal · https://pse.komdigi.go.id/ · n.d. · acc 2026-11-27 · primary · live]

- **D-050** Age rule: online booking for 18+ or a parent/guardian; tick box "Saya berusia 18 tahun ke atas, atau saya orang tua/wali yang memesan untuk anak saya." — S3.q8, UU 27/2022 Art. 25 [cite: regulation · https://jdih.kemenkeu.go.id/download/46c17b53-4a45-411c-9b76-c6799e5769fc/UU_Nomor_27_Tahun_2022%20Perlindungan%20Data%20Pribadi.pdf · pub 2022-10-17 · acc 2026-11-27 · primary · live · amend-check 2026-11-27] · status: user_confirmed (delegated)
- **D-051** Storage abroad disclosed on the form and in the privacy policy (Supabase, Singapore, DPA with standard contractual clauses) — S3.q9, UU 27/2022 Art. 56 [cite: legal · https://supabase.com/legal/dpa · pub 2026-08-01 · acc 2026-11-27 · primary · live] · status: user_confirmed (delegated)
- **D-056** PP 33/2026, in force 16 January 2027, applied: (a) data requests via the venue WhatsApp (access, correction, consent withdrawal handled as erasure, restriction, deletion) handled by the admin within 3x24 hours of receipt, each logged with received and done dates in a request log kept with the weekly exports; (b) every online booking stores the consent time and consent-text version; (c) record of processing activities, written incident policy and incident record template in SECURITY.md at S9; breach notice within 3x24 hours (D-018); (d) no data protection officer and no impact assessment required (no public service, no large-scale monitoring, no specific data, no high-risk case); (e) transfer to Singapore rests on the Supabase DPA clauses plus the form notice (D-051), with the transfer map in SECURITY.md; (f) signed text re-read at S9 — S3.q10, Pasal 71, 74, 77, 92, 99, 114-117, 120, 142, 160-165, 225 [cite: regulation · https://www.matthewswong.com/en/blog/gr-33-2026-pdp-implementing-regulation-developers/ · pub 2026-10 · acc 2026-11-27 · live · amend-check 2026-11-27] [cite: regulation · https://pro.hukumonline.com/a/lt6a97c3fe4527c/pemerintah-akhirnya-terbitkan-kerangka-implementasi-pelindungan-data-pribadi--berlaku-mulai-16-januari-2027 · pub 2026 · acc 2026-11-27 · live · amend-check 2026-11-27] · status: designer_filled (approved in principle in S7.q4; shown for correction)

## Loop-backs

- **L-01** (from S6, R-1 and R-2): minors and storage abroad → S3.q8, S3.q9; D-050, D-051. The consent tick box of D-017 now carries the D-050 wording and the notice carries the D-051 sentence.
- **L-03** (from S7, scope review RV-L01-4ebd3f1e): PP 33/2026 → S3.q10; D-056. No feature changes; F-01 stores the consent time and text version, and request handling is an admin routine.

## Abuse and access

The public booking form is an accountless submit route that stores personal data (D-020). Threat-modeling (abuse cases and STRIDE on the form), confirmed in batch 2:

- Abuse case: someone books many free slots under fake names to block the schedule (no payment, no account) — denial of service against the venue's income.
- Abuse case: someone scripts the form to send bookings in bulk — denial of service, and it fills the free database.
- Information disclosure: names and WhatsApp numbers of other players shown on the public schedule or reachable by guessing booking codes.
- Tampering: a request changes the court, time or price sent from the page — the server must take the price from the database, never from the page.
- Elevation of privilege: a visitor reaches admin pages or admin data — database row rules must deny public reads of personal data.
- The one-winner rule (two players, same slot) is a data-integrity control decided in S4/S5 (U-08).

| Threat | Response | Control | Verification |
|---|---|---|---|
| Slot squatting with fake names | Mitigate | D-023: max 2 upcoming bookings per number; admin cancel and block | 3rd upcoming booking from one number is rejected |
| Scripted bulk submits | Mitigate | D-023: Turnstile checked on the server; 5 submits per 10 min per device/connection | Submit without a valid token rejected; 6th submit in 10 min rejected |
| Harvesting names and numbers | Mitigate | D-024: schedule shows only Available/Taken; row rules deny public reads | Anonymous read of booking rows returns no personal fields |
| Guessing booking codes | Mitigate | D-024: random hard-to-guess code; number masked on the confirmation page | Wrong code shows "not found"; page never shows the full number |
| Price tampering from the page | Mitigate | D-024: price read from the database | A submit with an altered price stores the database price |
| Visitor reaching admin data | Mitigate | D-007, D-022: admin login with two-step on the email; row rules | Anonymous request to admin data is refused |
| Data kept too long | Mitigate | D-025: 90-day erasure, export cleanup | Booking older than 90 days after play date has no name or number |
| Consent not provable | Mitigate | D-056: consent time and text version stored per booking | A new online booking row has a consent time and a version value |

## Exit criteria

- [x] Data inventory recorded (or explicitly empty). — evidence: S3.q1, D-020
- [x] Auth yes/no recorded (and method when yes). — evidence: D-007, S3.q1, S3.q3, D-022
- [x] Payments yes/no recorded — evidence: S2.q6, D-016
- [x] The privacy-policy decision recorded — evidence: D-017
- [x] Abuse outcomes, controls and verification recorded; public forms include rate-limit and CAPTCHA decisions. — evidence: S3.q4, D-023, Abuse and access table
- [x] Web profile: what public forms keep, who may see it, and when to delete it. — evidence: S3.q1, S3.q5, S3.q6 (D-020, D-024, D-025)

## Booster

grilling: installed (read from `~/.agents/skills/grilling`). threat-modeling: installed at seq 56 (pinned SHA b1987542…) after S3.q1 set `public_form` and `stores_data`; loaded for the Abuse and access draft.

## Context research

RQ-009 · items shown: U-01, U-02, U-04, U-20 · became: D-017 (U-01), D-018 (U-02); U-04 and U-20 asked in batch 1; U-03 held for batch 2

RQ-017 · loop-back L-03 (PP 33/2026, PSE route) · new item U-21 · became: U-21 → D-056; U-03 route → D-054

RQ-010 · batch 2 preparation (Turnstile free plan, UU 27/2022 Art. 40, 41, 43, 45) · no new items · became: U-04 → D-021; U-20 not applied (South Jakarta)
