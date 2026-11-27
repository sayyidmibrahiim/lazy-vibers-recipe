# Research

Compiled from the S2 and S5 Section Records and the S6 risk appendix on 2026-11-27. Cite tags are copied verbatim. Stack names: Python 3.14 (installed 3.14.4, S5.q3), Django 6.1.3 (D-051) [cite: version · https://docs.djangoproject.com/en/stable/ref/settings/ · n.d. · acc 2026-11-27 · primary · live], SQLite (D-052).

## Competitor scan

| Product | What it does | Pricing model | Lesson for this idea | Source |
|---|---|---|---|---|
| Rumah123 Simulasi KPR | Installment from price, DP, fixed rate and fixed period, tenor and a bank program; shows first payment and remaining loan after the fixed period; income-ratio rating behind an "Akses Fitur" gate | No price stated; Login / Register link on the page; bank programs listed | Shows the loan left after the fixed period, so the owner sees the rate jump; works on one house at a time, not a file of listings | [cite: general · https://www.rumah123.com/kpr/simulasi-kpr/ · n.d. · acc 2026-11-27 · primary · live] |
| Rumah123 Cek Kemampuan KPR | From net income and optional installments, DP, tenor and rate, lists homes the user can afford (U-13) | No price stated; works on the site's own listings | The pattern buyers know; here it runs on the owner's file and the income stays on the laptop | [cite: market · https://www.rumah123.com/kemampuan-kpr/ · n.d. · acc 2026-11-26 · live] |
| detikProperti Kalkulator KPR | Price, DP, fixed rate and fixed period, floating rate, tenor | No price stated; applications go "dengan partner detikProperti" | Asks for the floating rate explicitly, like D-035 | [cite: general · https://www.detik.com/properti/kalkulator-kpr · n.d. · acc 2026-11-27 · primary · live] |
| Excel template (Rumah123 guide) | Loan, tenor, rate → fixed installment and amortization table (adjacent workaround) | Template download | The owner's current spreadsheet habit; the tool must export CSV that opens cleanly in a spreadsheet (D-008, D-027) | [cite: general · https://www.rumah123.com/panduan-properti/cara-menghitung-cicilan-kpr-dengan-excel/ · upd 2026-07-01 · acc 2026-11-27 · primary] |

Gap no product fills: none of them takes the owner's own multi-site listings file, applies upfront cash (BPHTB per area, bank fees) and the floating-rate test to every house at once, and keeps income off the internet.

## Comparable products

The four rows above are the comparable products: Rumah123 Simulasi KPR, Rumah123 Cek Kemampuan KPR, detikProperti Kalkulator KPR and the Excel template. Lesson carried into the plan: buyers already know the "net income × 30% minus other installments" test (U-12, D-035, S4.q2) and the fixed-then-floating rate pattern (U-08); none of them checks a whole listings file against upfront cash, so that is this tool's gap (R-1).

## Stack comparison and trade-offs

| Dimension | Option A — Python 3.15 + built-in sqlite3 | Option B — Node.js 26 LTS + built-in node:sqlite |
|---|---|---|
| Current version | Python 3.15.2, bugfix status, support to 2031-10 (scheduled) [cite: version · https://devguide.python.org/versions/ · n.d. · acc 2026-11-27 · primary · live] [cite: version · https://www.python.org/downloads/ · upd 2026-10-25 · acc 2026-11-27 · primary · live] | v26.13.1 "Latest LTS" [cite: version · https://nodejs.org/en/about/previous-releases · upd 2026-11-10 · acc 2026-11-27 · primary · live] |
| Local data store | sqlite3 module in the standard library | node:sqlite is "Stability: 1.2 - Release candidate" [cite: version · https://nodejs.org/api/sqlite.html · n.d. · acc 2026-11-27 · primary · live] |
| Fits the S2 budget (Rp0, S2.q3) | yes — no account, no hosting | yes — no account, no hosting |
| Fits upkeep (15 min/month, one command, D-019, D-020) | yes | yes |
| Covers S3 (no login, no payments, localhost only, D-021, D-028) | yes — Host and Origin checks in the app | yes — same |
| Carries the S4 must-features (CSV import, calculations, export, delete) | yes | yes |
| Regional availability | not relevant: runs offline on the laptop (D-022) | same |
| Maintenance burden | storage module stable; one runtime update per year at most | storage module still a release candidate; its interface may change |

### Recommended stack
Option A: Python 3.15 with the built-in sqlite3 store, served on 127.0.0.1 only, started by one command (D-019). It rests on the stability rows above (sqlite3 stable vs node:sqlite release candidate, [cite: version · https://nodejs.org/api/sqlite.html · n.d. · acc 2026-11-27 · primary · live]) and on the owner's 15-minute monthly upkeep (D-020). Recorded as D-048, designer_filled, shown for correction.

Later refinements: the laptop's Python 3.14.4 is used instead of 3.15 (S5.q3), and Django 6.1.3 [cite: version · https://docs.djangoproject.com/en/stable/ref/settings/ · n.d. · acc 2026-11-27 · primary · live] is the web framework (D-051). Install happens inside a virtual environment (D-058).

### Framework discovery (S5b)
Python is fixed by D-048 and the laptop runs Python 3.14.4 (S5.q3), supported to 2030-10 [cite: version · https://devguide.python.org/versions/ · n.d. · acc 2026-11-27 · primary · live]. Shortlist from `framework candidates --type web`, Python backends: Django, FastAPI. Flask was added as a lead but the collector returned no observation for it; it stays unresolved and is not presented.

Hard checks (`required_hard`: license, platform, budget, hosting, capability) — both pass. Persona: novice owner, agent builder, zero budget (S2.q3), local-only (weights C1 25, C2 20, C3 20, C4 10, C5 15, C6 10, C7 0). Snapshot `.lvr/signals-2026-11-27.json` (sha256 b59418a9b8657a49c17f03019cdbcc17a09a05bb5839352b04ef7c5a2dc68963); matrix `.lvr/framework-rank-2026-11-27.json`; recheck by 2026-12-11.

| Rank | Option | Score | Version | Key evidence |
|---|---|---|---|---|
| 1 | Django | 86 | 6.1.3, published 2026-11-03, needs Python >=3.12, BSD-3-Clause | ALLOWED_HOSTS rejects a non-matching Host header [cite: version · https://docs.djangoproject.com/en/stable/ref/settings/ · n.d. · acc 2026-11-27 · primary · live]; CSRF middleware verifies the Origin header [cite: version · https://docs.djangoproject.com/en/stable/ref/csrf/ · n.d. · acc 2026-11-27 · primary · live] |
| 2 | FastAPI | 66 | 0.165.0, published 2026-11-18, needs Python >=3.11, MIT | forms need the extra python-multipart package [cite: version · https://fastapi.tiangolo.com/tutorial/request-forms/ · n.d. · acc 2026-11-27 · primary · live]; no llms.txt and no matched Context7 entry |

Recommendation: Django 6.1 — its built-in Host check and Origin check carry D-021 and D-028 without custom code, and its forms, templates and SQLite support cover F-01–F-05. Strongest reason against: it is larger than this five-page app needs, so the project carries files it does not use. FastAPI fits a team that wants a JSON API first; this app does not. Chosen: Django 6.1.3 (S5.q4, delegated test agent, following the recommendation) → D-051, recorded with the `framework_selected` event (signals_ref above, recheck by 2026-12-11).

## Cost table

| Item | Price | Type | Source |
|---|---|---|---|
| Python runtime (3.14.4 already installed, S5.q3) | Rp0 | one-time download | [cite: price · https://www.python.org/downloads/ · upd 2026-10-25 · acc 2026-11-27 · primary · live] |
| Hosting, domain, accounts | Rp0 — none needed | — | S2.q3 (answered 2026-11-26) |
| BCA provisi / administration / appraisal (per purchase, not the tool) | 1% / Rp500.000 up to Rp500 juta, 0,10% up to Rp3 miliar, Rp3.000.000 above / Rp1.100.000–Rp1.500.000 | one-time, at akad | [cite: price · https://www.bca.co.id/id/individu/produk/pinjaman/kpr/kpr-first · n.d. · acc 2026-11-27 · primary · live] |
| Typical and busy month (D-018) | Rp0 at 100–200 and at 400–600 listings | recurring | S2.q5 (answered 2026-11-26) |

### Bank cost figures used by the tool (S2 prices quoted)

- BCA KPR provisi: 1% of the loan (one-time, at akad) [cite: price · https://www.bca.co.id/id/individu/produk/pinjaman/kpr/kpr-first · n.d. · acc 2026-11-26 · primary · live]
- BCA KPR administration: Rp500.000 (loans up to Rp500 juta) (one-time, at akad) [cite: price · https://www.bca.co.id/id/individu/produk/pinjaman/kpr/kpr-first · n.d. · acc 2026-11-27 · primary · live]
- BCA KPR administration: 0,10% of the loan (above Rp500 juta up to Rp3 miliar) (one-time, at akad) [cite: price · https://www.bca.co.id/id/individu/produk/pinjaman/kpr/kpr-first · n.d. · acc 2026-11-27 · primary · live]
- BCA KPR administration: Rp3.000.000 (loans above Rp3 miliar) (one-time, at akad) [cite: price · https://www.bca.co.id/id/individu/produk/pinjaman/kpr/kpr-first · n.d. · acc 2026-11-27 · primary · live]
- BCA KPR appraisal: Rp1.100.000–Rp1.500.000 (one-time, before akad) [cite: price · https://www.bca.co.id/id/individu/produk/pinjaman/kpr/kpr-first · n.d. · acc 2026-11-26 · primary · live]
- BCA late-payment penalty: 0,2% per day (variable) [cite: price · https://www.bca.co.id/id/individu/produk/pinjaman/kpr/kpr-first · n.d. · acc 2026-11-26 · primary · live]
- BPHTB rate: up to 5% of (value − NPOPTKP) (one-time tax, at transfer) [cite: regulation · https://ortax.org/ketentuan-bphtb-dan-cara-menghitung · pub 2023-04-28 · acc 2026-11-26 · amend-check 2026-11-26] [cite: regulation · https://news.ddtc.co.id/berita/nasional/35545/uu-hkpd-revisi-aturan-npoptkp-tanah-danatau-bangunan-ini-rinciannya · pub 2021-12-24 · acc 2026-11-26 · amend-check 2026-11-26]
- NPOPTKP national minimum: Rp80 juta (tax-free amount) [cite: regulation · https://news.ddtc.co.id/berita/nasional/35545/uu-hkpd-revisi-aturan-npoptkp-tanah-danatau-bangunan-ini-rinciannya · pub 2021-12-24 · acc 2026-11-26 · amend-check 2026-11-26] [cite: regulation · https://ortax.org/ketentuan-bphtb-dan-cara-menghitung · pub 2023-04-28 · acc 2026-11-26 · amend-check 2026-11-26]
- NPOPTKP DKI Jakarta: Rp250 juta (tax-free amount) [cite: regulation · https://news.ddtc.co.id/berita/daerah/1823579/beli-atau-dapat-warisan-properti-di-jakarta-pahami-kewajiban-pajaknya · pub 2026-10-26 · acc 2026-11-26 · amend-check 2026-11-26] [cite: regulation · https://www.hukumonline.com/klinik/a/cara-mengurus-bphtb-gratis-di-jakarta-lt5b4eaf1c40dc1/ · pub 2025-05-14 · acc 2026-11-26 · amend-check 2026-11-26]
- NPOPTKP Kota Depok: not found (tax-free amount) [unverified: regulation · RQ-009]
- Hosting / app tool running cost: Rp0 per month (recurring) S2.q3 (answered 2026-11-26)

### Regional availability
Payment gateways: not needed (no payments, D-014). Store: none (local web app, D-002). Data location: the owner's laptop only (D-006, D-022); no in-country hosting rule applies to household use (U-02, D-023).

## Risks (from S6)

Freshness re-check: `cite check --all` clean on 2026-11-27. Boosters: threat-modeling (used again on the stack: Django's Host and Origin checks carry D-021, D-028), architecture-designer and database-schema-designer installed this Section and used for the storage comparison; cost-estimator has no install method in the registry, so its checklist was applied inline (degraded).

### Regulated-domain screen
- **Finance — absent (confirmed S6.q1 → D-053).** The tool computes estimates for the owner's own purchase only; it does not lend, collect money, hold funds, compare products for others or give advice to anyone else (D-005, D-014, D-023). Evidence: S1.q4, D-005, D-014.
- **Health — absent.** No health data or advice (D-024).
- **Legal services — absent.** Certificate notes (D-033) tell the owner to check with a notary; the tool gives no legal opinion. Evidence: D-033.
- **Minors — absent.** Single adult owner (D-005).

### Storage comparison (data module)
Eight questions answered from records: one user (D-005); one device, offline (D-002, D-022); no shared access (D-005); first-year volume about 1,200–7,200 listings at 100–600 per month (D-018); main queries: filter by must-have criteria and area, sort by nice-to-haves then upfront cash (D-036), find by link for duplicates (D-039); no vector search; export and restore needed (D-025, F-04, F-05).

| Candidate | Fit | Why |
|---|---|---|
| SQLite (one file) | chosen → D-052 (approved S6.q2) | atomic saves for D-047 and F-05 rollback, unique link index for D-039, queries for D-036; Django supports it [cite: version · https://docs.djangoproject.com/en/stable/ref/csrf/ · n.d. · acc 2026-11-27 · primary · live] |
| JSON files | rejected | no atomic multi-record update; duplicate and sort logic in app code |
| Postgres / Supabase | rejected | needs a server or an online account; breaks D-006, D-022 and the Rp0 budget (S2.q3) |

Migration path: Django migrations; a later move to Postgres is possible with the same models if the app is ever shared (which would also reopen D-023).

### Risks
- **R-1 (note)** — Competitors calculate one house at a time; the file-wide upfront-cash and floating-rate test is the gap this tool fills · evidence: Competitor scan · outcome: note only
- **R-2 (note)** — Framework evidence must be rechecked by 2026-12-11 before the build · evidence: D-051 · outcome: note only (S9 and handoff recheck)
- **R-3 (note)** — Depok NPOPTKP [unverified: regulation · RQ-009]; the Rp80 juta default was confirmed aloud by the owner · evidence: U-16, S2.q2 · outcome: accepted → D-016
- **R-4 (note)** — Mandiri's floating rate is not published on its page; the owner enters each bank's floating rate · evidence: U-19, RQ-012 · outcome: note only (D-035)
- **R-5 (note)** — Promo rates end with the disbursement deadline (Mandiri 30 Nov 2026), so entered rates go stale quickly · evidence: U-19 · outcome: note only (D-020 30-day warning)
- **R-6 (note)** — DKI first-home BPHTB relief sources conflict; the tool applies none, so the estimate is conservative · evidence: U-17, RQ-010 · outcome: note only (D-012)
- **R-7 (note)** — PPN DTP not computed; listed price treated as final · evidence: U-07, S2.q1 · outcome: note only (D-015)
- **R-8 (note)** — Disk-encryption status unknown; backups unencrypted · evidence: S3.q2, S3.q7 · outcome: accepted → D-025, D-031
- **R-9 (note)** — 100% LTV relief ends 31 Dec 2027 (BI press release 21 Oct 2026, RQ-016) [cite: regulation · https://www.bi.go.id/id/publikasi/ruang-media/news-release/Pages/sp_2823326.aspx · upd 2026-10-23 · acc 2026-11-27 · primary · live · amend-check 2026-11-27] and only for some banks; default minimum DP stays 5% [cite: regulation · https://www.bi.go.id/id/publikasi/peraturan/Pages/PADG_302025.aspx · upd 2025-12-24 · acc 2026-11-26 · primary · live · amend-check 2026-11-26] · evidence: U-01 · outcome: note only (D-010)
- **R-10 (note)** — Running cost Rp0 at typical and busy usage; no new cost from Django or SQLite · evidence: Cost table, S2.q3 · outcome: note only
- **R-11 (note)** — Django is larger than a five-page app needs · evidence: D-051 · outcome: note only (accepted in S5.q4)
- **R-12 (note)** — Listings data comes from sites whose terms ban scraping; the owner copies by hand · evidence: U-03, D-003 · outcome: note only

- **R-13 (note)** — Data kept until the owner deletes it; no automatic expiry · evidence: S6.q3 · outcome: note only (D-054)

No blocking risk found; no loop-back opened. Answers: S6.q1 screen confirmed (D-053, `regulated_domain` false); S6.q2 D-052 approved; S6.q3 retention a (D-054). All answers by the owner's delegated test agent.

### S6 exit criteria
- [x] Every S5 finding classified with evidence — R-1…R-13
- [x] Regulated-domain screen recorded — D-053
- [x] Zero open blocking risks — none found
- [x] Risks appended to this record
