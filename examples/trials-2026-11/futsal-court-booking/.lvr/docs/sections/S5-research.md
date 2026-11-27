# S5 — Deep research

## Booster

discover-competitive-analysis: used (read from `~/.agents/skills/discover-competitive-analysis`). Search and fetch worked throughout (RQ-012, RQ-013, RQ-014).

## Competitor scan

RQ-012. Direct = solves the same problem; adjacent = the workaround people put up with today.

| Product | What it does | Pricing model | Lesson for this idea | Source |
|---|---|---|---|---|
| AYO (player app) + AVM (owner app) — direct | Marketplace for courts across sports, with live open slots and instant booking; partners with over 2,300 venues. The owner app manages schedules, availability, finances and staff access. | Free for players, but fees are collected from every player at checkout; owners pay a subscription for AVM, "no per-booking commissions". The subscription price is not published. | Players already expect a live grid and instant confirmation. The venue's own link avoids the player fees and the marketplace's control over the venue's customers. | [cite: market · https://apps.apple.com/id/app/ayo/id1539581877 · n.d. · acc 2026-11-27 · primary · live] [cite: market · https://apps.apple.com/id/app/id1607354989 · n.d. · acc 2026-11-27 · primary · live] |
| Gelora — direct | Player app for booking venues, with down payments, memberships, multi-court booking in one transaction and booking-queue notices. | Free app; no in-app purchases shown. | DP and membership are what these apps grow into next. They match this project's parking lot (D-038). | [cite: market · https://apps.apple.com/id/app/gelora/id6451196568 · n.d. · acc 2026-11-27 · primary · live] |
| Metro Futsal — direct (single venue) | One venue's own booking app: book courts, check availability, view order history without coming in person. | Free app, last updated 2023-05-14. | A single-venue booking tool works at small scale, and an app left without updates goes stale. A website that needs no install and has a weekly export (D-013) is easier to keep alive. | [cite: market · https://apps.apple.com/bb/app/metro-futsal/id1523205384 · upd 2023-05-14 · acc 2026-11-27 · primary · live] |
| WhatsApp chat + paper ledger — adjacent (today's workaround) | Bookings taken in private chats and written by hand. | Free, but costs the admin's time. | It causes double bookings, the owner's own example (S1.q2). The fix is a booking lock against simultaneous bookings, plus manual entry for chat bookings (F-02). | [cite: market · https://ejournal.unuja.ac.id/index.php/CODEX/article/download/15367/pdf · pub 2026 · acc 2026-11-27 · live] |

## Stack options and trade-offs

S5b framework discovery (RQ-014). Fixed by earlier answers:
- The data layer is Supabase, named in the idea (S0).
- Hosting must be free and must allow business use (D-011, D-012). That rules out Vercel Hobby (U-17).

**Hosting candidates (RQ-013)**

| Dimension | Cloudflare Workers Free | Netlify Free |
|---|---|---|
| Price | USD 0; 100,000 requests per day; 10 ms CPU per request [cite: price · https://developers.cloudflare.com/workers/platform/pricing/ · upd 2026-11-18 · acc 2026-11-27 · primary · live] | USD 0 with a 300-credit limit [cite: price · https://www.netlify.com/pricing/ · n.d. · acc 2026-11-27 · primary · live] |
| Business use on the free plan | No commercial-use limit in the terms; only reselling access is barred [cite: legal · https://www.cloudflare.com/terms/ · upd 2025-09-12 · acc 2026-11-27 · primary · live] | The official blog says commercial projects are allowed; it is not stated in the terms text read [cite: legal · https://www.netlify.com/blog/introducing-netlify-free-plan · n.d. · acc 2026-11-27 · primary · live] |
| What happens at the limit | Requests over the daily limit get Error 1027 until the reset at midnight UTC [cite: quota · https://developers.cloudflare.com/workers/platform/limits/ · upd 2026-11-25 · acc 2026-11-27 · primary · live] | The site is suspended for the rest of the calendar month [cite: quota · https://www.netlify.com/blog/introducing-netlify-free-plan · n.d. · acc 2026-11-27 · primary · live] |
| Scheduled jobs (keep-alive, cleanup) | 5 Cron Triggers per account on Free [cite: quota · https://developers.cloudflare.com/workers/platform/limits/ · upd 2026-11-25 · acc 2026-11-27 · primary · live] | Not checked; not needed if Workers is chosen |
| Captcha | Turnstile Free from the same provider [cite: price · https://developers.cloudflare.com/turnstile/plans/ · upd 2026-08-14 · acc 2026-11-26 · primary · live] | Turnstile works on any host |

Hosting choice: Cloudflare Workers Free. Its business-use terms are written into the agreement itself, while Netlify's appear only in a blog post. Going over the limit costs one day at most, against a month on Netlify. Cron jobs and Turnstile come from the same account (rows above).

**Data layer: Supabase Free (RQ-013)**
- Free plan: 500 MB database, 50,000 monthly active users, 5 GB egress, unlimited API requests. [cite: quota · https://supabase.com/pricing · n.d. · acc 2026-11-27 · primary · live]
- A Free project is paused after 7 days of low database activity, with a warning email a week ahead. It can be restored for up to 1 year. [cite: quota · https://supabase.com/docs/guides/platform/free-project-pausing · n.d. · acc 2026-11-27 · primary · live]
- The terms text read shows no non-commercial limit for the Free plan. The reading was partial, and the order and supplemental terms were not read. [cite: legal · https://supabase.com/terms · n.d. · acc 2026-11-27 · primary · live]
- No automatic backups on Free; covered by the weekly export (U-07, D-013).

**Framework shortlist (S5b)**
- Candidates: `LVR framework candidates --type web`, narrowed to frameworks with an official Cloudflare Workers guide.
- Hard checks: license, budget, hosting, capability.
- Persona: user_skill 0, builder agent, team 1, zero budget per D-011, no self-hosting. These are assumed from S0–S2: a non-technical owner and a coding agent building from the bundle.
- Weights after shifts: C1 25, C2 20, C3 20, C4 15, C5 15, C6 5, C7 0.
- Signals snapshot `.lvr/signals-2026-11-27.json` (sha256 prefix 74a639a1c790b353); rank output `.lvr/framework-rank-2026-11-27.json`; recheck by 2026-12-11.

| Dimension | SvelteKit 3.4.1 | React Router 8.5.3 (framework mode) | Next.js 16.4.6 |
|---|---|---|---|
| Version | [cite: version · https://registry.npmjs.org/@sveltejs/kit/latest · upd 2026-11-25 · acc 2026-11-27 · primary · live] | [cite: version · https://registry.npmjs.org/react-router/latest · upd 2026-11-24 · acc 2026-11-27 · primary · live] | [cite: version · https://registry.npmjs.org/next/latest · upd 2026-11-09 · acc 2026-11-27 · primary · live] |
| Rank score (0–100) | 96 | 86 | 90 |
| Runs on Cloudflare Workers | Official guide, `@sveltejs/adapter-cloudflare` [cite: general · https://developers.cloudflare.com/workers/framework-guides/web-apps/sveltekit/ · upd 2026-11-05 · acc 2026-11-27 · primary · live] | Official guide, Cloudflare Vite plugin, v8 [cite: general · https://developers.cloudflare.com/workers/framework-guides/web-apps/react-router/ · upd 2026-11-12 · acc 2026-11-27 · primary · live] | Through vinext, which Cloudflare marks as beta [cite: general · https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/ · upd 2026-11-05 · acc 2026-11-27 · primary · live] |
| Fits the S2 budget (D-011) | Yes, Workers Free | Yes, Workers Free | Yes, Workers Free |
| Covers S3 (admin login, server-side Turnstile, row rules) | Yes, server load/actions with Supabase | Yes, loaders/actions with Supabase | Yes, server actions with Supabase |
| Carries the S4 must-features F-01..F-04 | Directly (form actions) | Directly | Directly |
| Agent buildability (C3) | llms.txt + Context7 matched (5) | Context7 matched, no llms.txt (2.5) | llms.txt + Context7 matched (5) |
| Health (C4) | Release 2026-11-25 (5) | Release 2026-11-24 (5) | Release 2026-11-09 (5) |
| License | MIT | MIT | MIT |
| Biggest risk | Smaller ecosystem than React | Weaker agent documentation signals | Beta adapter on the chosen host |

Excluded: Astro 7.4.13 [cite: version · https://registry.npmjs.org/astro/latest · upd 2026-11-18 · acc 2026-11-27 · primary · live] scored 62. It is content-first, so the interactive schedule grid and admin screens would need a second UI library, and it had no llms.txt. Rank file above.

## Recommended stack

The recommendation rests on the rows above and on RQ-012 to RQ-014.

- **Recommended:** SvelteKit on Cloudflare Workers Free, with Supabase Free (Postgres, admin login through Supabase Auth, row rules) and Cloudflare Turnstile.
- **Reasons tied to earlier answers:**
  - Rp 0 per month on plans that allow business use (D-011, D-012). [cite: legal · https://www.cloudflare.com/terms/ · upd 2025-09-12 · acc 2026-11-27 · primary · live]
  - Server-side form actions carry the booking write, the Turnstile check and the one-winner database refusal (D-023, D-024, U-08).
  - Light server-rendered pages suit the small old Android phones in the support matrix (D-010, D-041).
  - The best agent-build documentation signals in the shortlist (rank score 96).
- **Strongest reason against:** a smaller ecosystem than React, so fewer ready-made components and examples. React Router is the alternative if the builder wants React.
- **Paid fallbacks:** Workers Paid from USD 5 per month [cite: price · https://developers.cloudflare.com/workers/platform/pricing/ · upd 2026-11-18 · acc 2026-11-27 · primary · live] and Supabase Pro from USD 25 per month [cite: price · https://supabase.com/pricing · n.d. · acc 2026-11-27 · primary · live]. Recorded as designer_filled decisions.

## Cost table and regional availability

Built on the S2 `## Prices quoted` rows. Usage from D-015: about 576 bookings in a normal month and about 1,000 in a busy month.

| Item | Price | Type | Source |
|---|---|---|---|
| Cloudflare Workers Free (hosting) | USD 0; 100,000 requests per day | monthly | [cite: price · https://developers.cloudflare.com/workers/platform/pricing/ · upd 2026-11-18 · acc 2026-11-27 · primary · live] |
| Cloudflare Turnstile Free | USD 0; unlimited challenges | monthly | [cite: price · https://developers.cloudflare.com/turnstile/plans/ · upd 2026-08-14 · acc 2026-11-26 · primary · live] |
| Supabase Free (database, admin login) | USD 0; 500 MB database; 5 GB egress | monthly | [cite: price · https://supabase.com/pricing · n.d. · acc 2026-11-27 · primary · live] |
| .biz.id domain (D-014) | Rp 9.900 first year; Rp 60.000 per year renewal | yearly | [cite: price · https://www.rumahweb.com/domain-murah/ · n.d. · acc 2026-11-26 · primary · live] |
| Fallback: Cloudflare Workers Paid | USD 5 per month minimum | monthly, only if needed | [cite: price · https://developers.cloudflare.com/workers/platform/pricing/ · upd 2026-11-18 · acc 2026-11-27 · primary · live] |
| Fallback: Supabase Pro | from USD 25 per month | monthly, only if needed | [cite: price · https://supabase.com/pricing · n.d. · acc 2026-11-27 · primary · live] |

Usage check (planning estimates from D-015, not measured):
- **Busy month:** 1,000 bookings is about 33 a day. Allowing generously 60 page or API requests per booking (schedule views, form, confirmation, admin use), that is about 2,000 requests a day, about 2% of the 100,000 daily free requests.
- **Database:** at an assumed 1 KB per booking row, one busy month adds about 1 MB, under 1% of the 500 MB database. The 90-day erasure (D-025) keeps names and numbers out of older rows.
- **Typical month:** about 576 bookings, so roughly half the figures above.
- **Total recurring cost:** Rp 0 per month in both months. The only fixed cost is the domain, Rp 60.000 per year from the second year (about Rp 5.000 a month) [cite: price · https://www.rumahweb.com/domain-murah/ · n.d. · acc 2026-11-26 · primary · live]. That is about Rp 5 per booking in a busy month and about Rp 9 in a typical month (D-015). Players pay nothing.
- **Pause risk:** daily bookings are database activity, so a Supabase pause is unlikely while the venue is open. A long closure (for example a renovation) could trigger one. That risk is handed to S6 (keep-alive through a Cloudflare Cron Trigger, 5 free per account).

### Regional availability

- **Payment gateways:** none in the first version (D-016). QRIS exists for a later online DP, with 0% merchant fee up to Rp 500.000 for micro merchants. [cite: price · https://www.bi.go.id/id/publikasi/ruang-media/news-release/Pages/sp_2815926.aspx · upd 2026-09-08 · acc 2026-11-26 · primary · live]
- **Store availability:** not applicable. This is an installable website, not a store app (D-003).
- **Data location:** no data-location rule recorded in S2 or S3. The Supabase region is picked at project creation; the nearest region to Jakarta is checked in S6. UU 27/2022 duties stay as decided in S3 (D-017, D-018, D-025).

<!-- lvr:english-summary -->

## Answers

Answered by the delegated test agent on the owner's behalf (`answered_by: delegated_test_agent`); asked in Indonesian.

- **S5.q1 Which framework for the builder agent?** — SvelteKit + Cloudflare Workers Free + Supabase Free + Turnstile, as recommended. → D-046
- **S5.q2 Who builds and maintains?** — Confirmed: an AI builder agent builds; the owner writes no code; budget Rp 0. → D-043

## Decisions this Section

- **D-043** Builder: AI builder agent from the bundle; owner writes no code; no programmer; Rp 0 per month — S5.q2 · status: user_confirmed (delegated)
- **D-044** Hosting paid fallback: Cloudflare Workers Paid (USD 5 per month minimum) only if the free daily limit is hit, owner asked first [cite: price · https://developers.cloudflare.com/workers/platform/pricing/ · upd 2026-11-18 · acc 2026-11-27 · primary · live] · status: designer_filled
- **D-045** Data paid fallback: Supabase Pro (from USD 25 per month) only if size, pause or backup needs demand it, owner asked first [cite: price · https://supabase.com/pricing · n.d. · acc 2026-11-27 · primary · live] · status: designer_filled
- **D-046** Stack: SvelteKit 3.4.1 on Cloudflare Workers Free, Supabase Free (Postgres, Supabase Auth for the admin, row rules), Cloudflare Turnstile Free; framework_selected with signals snapshot `.lvr/signals-2026-11-27.json`; recheck by 2026-12-11 — S5.q1 · status: user_confirmed (delegated)

## Exit criteria

- [x] Competitor scan covers ≥3 direct/adjacent products with what they do and a pricing model. — evidence: Competitor scan (4 rows), RQ-012
- [x] ≥2 eligible stack options with trade-offs and a recorded S5b choice, or a documented reason discovery was skipped. — evidence: Stack options table, RQ-014 S5b choice D-046
- [x] One recommended stack with reasons tied to the S1–S4 answers and S2 resources. — evidence: Recommended stack
- [x] Cost table present, built on the S2 fact-sheet, with regional payment-gateway availability, dated rates, typical and busy usage, and per-user cost when measurable. — evidence: Cost table, Regional availability
- [x] Every claim carries a cite group or a logged `[unverified: …]` marker; `LVR cite check --file .lvr/docs/sections/S5-research.md` is clean. — evidence: cite check clean 2026-11-27

## Context research

RQ-012, RQ-013, RQ-014 · brief items handled: U-06, U-07, U-13, U-14, U-15, U-17, U-18 · became: S5.q1 → D-046, S5.q2 → D-043, fallbacks D-044, D-045

## Risks (S6)

Freshness re-check: `LVR cite check --all` clean on 2026-11-27 after the Became cells for U-08, U-09, U-11 and U-13 were filled. Boosters: architecture-designer, database-schema-designer and supabase installed (seq 97–99); threat-modeling, cost-estimator and supabase-postgres-best-practices used as reference. Store confirmed: D-047 (`storage_supabase` set). Research: RQ-015.

**Regulated-domain screen**
- Finance — absent. Players pay at the venue and no money moves through the app (D-016). This is incidental payment collection, not a financial service.
- Health — absent. No health data or advice (D-020).
- Legal services — absent.
- Minors — resolved: not intended for minors; online booking 18+ or a parent/guardian (D-050), `regulated_domain` false. Futsal players may be under 18, and processing a child's personal data needs a parent's or guardian's consent (UU 27/2022 Art. 25) [cite: regulation · https://jdih.kemenkeu.go.id/download/46c17b53-4a45-411c-9b76-c6799e5769fc/UU_Nomor_27_Tahun_2022%20Perlindungan%20Data%20Pribadi.pdf · pub 2022-10-17 · acc 2026-11-27 · primary · live · amend-check 2026-11-27]. Owner call → L-01 (S3) → D-050.

**Findings**
- **R-1 (blocking)** — Minors may book through the public form; Art. 25 requires parental consent · evidence: D-020, the regulated-domain screen · outcome: resolved via L-01 (S3.q8 → D-050)
- **R-2 (blocking)** — Supabase has no Indonesian region. The nearest is Singapore, so stored names and numbers leave Indonesia (UU 27/2022 Art. 56). The Supabase DPA has standard contractual clauses, but the consent text does not mention storage abroad [cite: legal · https://supabase.com/docs/guides/platform/regions · n.d. · acc 2026-11-27 · primary · live] [cite: legal · https://supabase.com/legal/dpa · pub 2026-08-01 · acc 2026-11-27 · primary · live] · evidence: D-017, D-049 · outcome: resolved via L-01 (S3.q9 → D-051)
- **R-3 (blocking)** — The weekly export confirmed in S2 (D-013) has no screen or job in F-01..F-04. Supabase Free has no automatic backups (U-07), so the plan has no working backup · evidence: D-013, S4 feature list · outcome: resolved via L-02 (S4.q15 → D-052, F-05)
- **R-4 (note)** — A Supabase Free project pauses after 7 days of low database activity [cite: quota · https://supabase.com/docs/guides/platform/free-project-pausing · n.d. · acc 2026-11-27 · primary · live]. Daily bookings keep it active, and a daily Cron Trigger covers long closures · evidence: U-06, D-048 · outcome: note only
- **R-5 (note)** — Workers Free gives 10 ms CPU per request and 100,000 requests a day, reset at midnight UTC (07.00 WIB) [cite: quota · https://developers.cloudflare.com/workers/platform/limits/ · upd 2026-11-25 · acc 2026-11-27 · primary · live]. The busy-month estimate is about 2% of the daily limit. The CPU time per booking is measured in the first milestone · evidence: Cost table, D-015 · outcome: note only
- **R-6 (note)** — Supabase Terms limit use to the customer's internal business purposes. No free-plan non-commercial clause was found, though part of the reading was a summary [cite: legal · https://supabase.com/terms · n.d. · acc 2026-11-27 · primary · live] · evidence: RQ-013, RQ-015 · outcome: note only (recheck at S9)
- **R-7 (note)** — AYO charges players a fee at checkout and sells owners a subscription. The venue's own link has no such fees, which is a selling point for the WhatsApp/Instagram entry link · evidence: Competitor scan, D-006 · outcome: note only
- **R-8 (note)** — The one-winner rule rests on a database exclusion or unique constraint on court + slot for active bookings, not on a check-then-insert (U-08). It is proven by a parallel-submit test in the first milestone · evidence: D-027, U-08 · outcome: note only
- **R-9 (note)** — Framework evidence ages fast; recheck by 2026-12-11 · evidence: D-046 · outcome: note only

**S6 exit**
- [x] Every S5 finding classified `blocking` or `note` with one line of evidence. — evidence: R-1 to R-9
- [x] Regulated-domain screen recorded for finance, health, legal services and minors. Open requirements have an owning section or role. — evidence: Regulated-domain screen; PSE registration owned as a launch task (D-026)
- [x] Zero open blocking risks — each closed via a loop-back (`resolved_at` set) or accepted as a `user_confirmed` decision. — evidence: L-01 and L-02 closed (seq 111, 112)
- [x] The risks section is appended to `S5-research.md` with every outcome recorded. — evidence: this section
