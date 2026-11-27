# S2 — Conditions

<!-- lvr:english-summary -->

## Coverage plan

| Key | Fact needed | Evidence so far |
|---|---|---|
| devices | Devices the admin and players use | S2.q1 (D-010) |
| existing-payments | Services already paid for | S2.q2 — none |
| budget | Monthly budget ceiling (a number or "nothing") | S2.q3 (D-011) |
| deploy-target | Deployment surface | S1.q1, D-003, S2.q3 (D-012): free hosting that allows business use; exact host in S5 |
| usage | Typical and busy-month activity with units | S1.q4, S2.q5 (D-015): 48 slots/day; ~576 bookings/normal month, ~1,000/busy month (trial assumption) |
| paid-accounts | Every paid account the platform needs, with verified price and proceed/defer | No store account (D-003). Hosting: free tier only (D-011, D-012). Domain .biz.id: proceed (S2.q4, D-014). No payment provider (S2.q6, D-016). |

Progress: S2: 6 of 6 facts known.

## Answers

Answer source: every S2 answer was given by the test agent answering on the owner's behalf (`answered_by: delegated_test_agent` in the journal).

- **S2.q1 Devices** — Admin: one Android phone and one Windows laptop. Players: mostly Android, some iPhone. Must work in Chrome on Android, including old small-screen phones, and in Safari on iPhone.
- **S2.q2 Existing paid services** — None; only WhatsApp Business, Instagram and Google Maps.
- **S2.q3 Monthly budget ceiling** — Rp 0 per month during the trial: free services that allow business use, plus the weekly export (D-009). Review only if a free limit is reached. D-009 approved.
- **S2.q4 Own domain or free address** — Buy a .biz.id address now, auto-renew on, reminders to the admin email.
- **S2.q5 Opening hours and volume** — Open 08:00–24:00, 1-hour slots, 3 courts. Normal month about 40% full (about 576 bookings); busy month about 70% (about 1,000 bookings). Trial assumption.
- **S2.q6 Payment inside the app** — None in the first version; bookings confirm at once and players pay at the venue. Online DP is deferred.

Language note: S2.q4–S2.q6 were asked in English by mistake; the owner asked to keep the conversation in Indonesian, and later questions follow that.

## Decisions this Section

- **D-009** Weekly automatic export of reservations stored outside Supabase, with a tested restore, while on Supabase Free — per U-07 · status: designer_filled (approved in S2.q3; confirmed as D-013)
- **D-010** Support matrix: Chrome on Android (incl. old small-screen phones) and Safari on iPhone; admin on one Android phone and one Windows laptop — S2.q1 · status: user_confirmed
- **D-011** Budget ceiling Rp 0 per month during the trial; rules out Vercel Hobby (personal or non-commercial use only) [cite: legal · https://vercel.com/legal/terms · upd 2026-10-19 · acc 2026-11-26 · primary · live] and paid plans such as Supabase Pro [cite: price · https://supabase.com/pricing · n.d. · acc 2026-11-26 · primary · live] — S2.q3 · status: user_confirmed
- **D-012** Deploy target: free-tier hosting whose terms allow business use; database on Supabase Free; host picked in S5 — S2.q3, U-17, U-18 · status: user_confirmed
- **D-013** Weekly export with tested restore (confirms D-009) — S2.q3 · status: user_confirmed
- **D-014** Own domain: .biz.id bought now, Rp 9.900 first year and Rp 60.000 per year renewal [cite: price · https://www.rumahweb.com/domain-murah/ · n.d. · acc 2026-11-26 · primary · live], auto-renew on, reminders to the admin email — S2.q4, U-19 · status: user_confirmed
- **D-015** Usage baseline (trial assumption): 48 slots per day; about 576 bookings in a normal month and about 1,000 in a busy month — S2.q5 · status: user_confirmed
- **D-016** No in-app payment in the first version; pay at the venue; online DP parked — S2.q6, U-05, U-12 [cite: price · https://www.bi.go.id/id/publikasi/ruang-media/news-release/Pages/sp_2815926.aspx · upd 2026-09-08 · acc 2026-11-26 · primary · live] · status: user_confirmed

## Prices quoted

| Item | Price quoted | Type | Source |
|---|---|---|---|
| Supabase Pro | USD 25 per month (from) | monthly | [cite: price · https://supabase.com/pricing · n.d. · acc 2026-11-26 · primary · live] |
| Vercel Pro | USD 20 per month per developer seat | monthly | [cite: price · https://vercel.com/pricing · n.d. · acc 2026-11-26 · primary · live] |
| Cloudflare Workers Paid | USD 5 per month minimum | monthly | [cite: price · https://developers.cloudflare.com/workers/platform/pricing/ · upd 2026-11-18 · acc 2026-11-26 · primary · live] |
| .biz.id domain (Rumahweb) | Rp 9.900 first year; Rp 60.000 per year renewal | yearly | [cite: price · https://www.rumahweb.com/domain-murah/ · n.d. · acc 2026-11-26 · primary · live] |
| .com domain (Rumahweb) | Rp 137.000 first year (promo); Rp 219.000 per year renewal | yearly | [cite: price · https://www.rumahweb.com/domain-murah/ · n.d. · acc 2026-11-26 · primary · live] |
| .my.id domain (Rumahweb) | Rp 9.900 first year; Rp 25.000 per year renewal | yearly | [cite: price · https://www.rumahweb.com/domain-murah/ · n.d. · acc 2026-11-26 · primary · live] |
| QRIS merchant fee (MDR) | 0% up to Rp 500.000 for micro merchants; 0% up to Rp 100.000 for all merchants; fee above those amounts not stated | per payment | [cite: price · https://www.bi.go.id/id/publikasi/ruang-media/news-release/Pages/sp_2815926.aspx · upd 2026-09-08 · acc 2026-11-26 · primary · live] |

## Open for later

- Admin email address for bills, domain reminders and password resets: asked in S3 together with admin login.
- S5 must check Supabase Free (500 MB database) and the chosen host against the busy month in D-015.

## Exit criteria

- [x] Budget ceiling recorded — evidence: S2.q3, D-011
- [x] Deployment surface and devices/accounts list recorded — evidence: S2.q1, S2.q2, D-010, D-012
- [x] Typical and busy-month activity recorded with units — evidence: S2.q5, D-015 (trial assumption; S5 checks it against free-tier limits)
- [x] Every paid account surfaced with a verified price and proceed/defer — evidence: D-003 (no store), D-011/D-012 (free hosting), S2.q4/D-014 (domain, proceed), S2.q6/D-016 (no payment provider)

## Booster

grilling: installed (read from `~/.agents/skills/grilling`). S2 uses the internal cost lead list, with every price checked live.

## Context research

RQ-008 · items shown: U-06, U-07, U-17, U-18 (batch 1); U-05, U-12, U-19 (batch 2) · became: D-009 (U-07), S2.q3 (U-06, U-17, U-18), S2.q4 (U-19), S2.q6 (U-05, U-12)
