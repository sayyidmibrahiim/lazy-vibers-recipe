# S8 — Milestone plan

Answer source note: answers in this Section come from the owner's delegated test agent (owner's note at S1.q6). Deploy target (S2): the owner's own Linux laptop, started with one terminal command (D-019), served only on 127.0.0.1 (D-021). Running cost for every milestone: Rp0 (S2.q3, S5 cost table). Effort basis: one focused builder session each (planning-and-task-breakdown sizing: ≤3 features, one subsystem).

Test figures used below are computed results, not vendor prices (annuity formula of D-035, S4.q2; monthly rate = yearly rate / 12): a loan of Rp1.000.000.000 at 11% for 20 years gives Rp10.321.884 per month; for 15 years, Rp11.365.969 per month. With a 2,70% promo for 1 year on a 20-year loan: Rp5.397.002 per month in the promo year, then Rp10.074.142 per month on the remaining Rp961.765.128 over 19 years at 11%.

## M0 — Walking skeleton: start, import, see the list
- **Goal:** one command starts the app on the laptop, and a CSV imported on the Import page shows up on the Shortlist page from the real SQLite file.
- **Deliverables:** `.venv` + Django 6.1.3 install (D-058); `start.sh` (one command, D-019) that runs `.venv/bin/python manage.py runserver 127.0.0.1:8000`; SQLite file `data/kpr.sqlite3` (D-052); `ALLOWED_HOSTS` localhost/127.0.0.1 and CSRF Origin check (D-021, D-028, D-051); three pages Import CSV, Profile & Criteria (empty stub that says "Belum tersedia"), Shortlist (S1.q6); minimal import of the required columns into a `listing` table and a plain list on Shortlist; `sample/contoh-listing.csv` with 5 rows; README section "Cara menjalankan"; local log file `data/app.log` with no income, savings or age fields.
- **Acceptance criteria:**
  1. `./start.sh` prints a line containing `http://127.0.0.1:8000/` and the page answers HTTP 200.
  2. The server listens only on 127.0.0.1 (no `0.0.0.0` or LAN address).
  3. A request with a foreign Host header gets HTTP 400 (D-021).
  4. A POST without a matching Origin is refused with HTTP 403 (D-028).
  5. Importing `sample/contoh-listing.csv` stores 5 rows in `data/kpr.sqlite3`; after a browser reload the Shortlist page shows 5 titles.
  6. `.venv/bin/python manage.py test` passes.
- **Verification:**
  - `./start.sh &` then `curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8000/` → `200`.
  - `ss -ltnp | grep 8000` → only `127.0.0.1:8000`.
  - `curl -s -o /dev/null -w '%{http_code}\n' -H 'Host: evil.example' http://127.0.0.1:8000/` → `400`.
  - `curl -s -o /dev/null -w '%{http_code}\n' -X POST -H 'Origin: http://evil.example' http://127.0.0.1:8000/import/` → `403`.
  - `sqlite3 data/kpr.sqlite3 'select count(*) from listing;'` → `5` after the import.
  - `grep -Ei 'income|penghasilan|tabungan|usia' data/app.log` → no output.
- **Rough cost/effort:** Rp0; ~1 builder session.

## M1 — Profile, criteria and the money calculations (F-02)
- **Goal:** the owner saves finance, per-bank KPR settings and criteria, and every listing gets an installment during and after promo, the tenor actually used and its upfront cash.
- **Deliverables:** F-02 complete with its unhappy paths (D-040, D-041); calculation module with: annuity installment during promo and after promo at the floating rate (D-035); 30% cap of net income minus other installments, editable; tenor used = min(entered tenor, maximum tenor 25, age limit 65 − current age) (D-055); upfront cash = DP + BPHTB 5% × (price − NPOPTKP) + provisi 1% + administration by loan size (D-059) + appraisal + notary/insurance (D-011, D-016); "belum lengkap" when notary/PPAT or insurance is empty, never a pass (D-056); drop rule upfront cash > cash available (D-040).
- **Acceptance criteria:**
  1. Loan Rp1.000.000.000, 11%, 20 years → installment Rp10.321.884 (±Rp1).
  2. Same loan, current age 50, age limit 65 → tenor used 15 years and installment Rp11.365.969 (±Rp1).
  3. Promo 2,70% for 1 year on a 20-year Rp1.000.000.000 loan → Rp5.397.002 in the promo year and Rp10.074.142 after (±Rp1).
  4. Administration: loan Rp400.000.000 → Rp500.000; Rp1.200.000.000 → Rp1.200.000; Rp3.500.000.000 → Rp3.000.000.
  5. BPHTB: price Rp1.500.000.000 in South Jakarta (NPOPTKP Rp250.000.000) → Rp62.500.000; in Depok with Rp80.000.000 → Rp71.000.000.
  6. With notary/insurance empty, no house is marked passing on cash and each shows "belum lengkap".
  7. Saving an out-of-range field shows its message and Simpan stays disabled; a save from an outdated tab shows "Data sudah diubah di tab lain — muat ulang".
- **Verification:** `.venv/bin/python manage.py test kpr.tests.test_calc kpr.tests.test_profile` → all pass; the test names map 1:1 to criteria 1–7. Visual: after Simpan, the page shows "Tersimpan" with today's date.
- **Rough cost/effort:** Rp0; ~1 builder session.

## M2 — Full import and the ranked shortlist (F-01)
- **Goal:** a real CSV from Rumah123, 99.co or Lamudi becomes a ranked shortlist that the owner saves as CSV.
- **Deliverables:** F-01 complete (D-034, D-037, D-038): separator "," or ";", UTF-8 with or without BOM, price formats (D-057); 5 MB / 2.000-row limit and formula-safe export (D-027); same link = same house (D-039); agent name/phone columns dropped (D-024); scam flag below 60% of the area median per m² (D-032); certificate notes (D-033); order by nice-to-haves, then smallest upfront cash (D-036); rejected houses with reasons; "Simpan CSV" with installment and upfront cash per house (D-008).
- **Acceptance criteria:**
  1. The same 10 listings saved with "," and with ";" import to identical rows.
  2. Prices "1500000000", "Rp1.500.000.000" and "1,5 M" all read as 1.500.000.000; "satu M" is a rejected row with its reason.
  3. A 2.001-row file and a 6 MB file are refused with a plain message; nothing is stored.
  4. Two rows with the same link store one house.
  5. A CSV with agent name and phone columns stores neither (no such column in the database).
  6. A cell starting with `=`, `+`, `-` or `@` is written to the exported CSV with a leading `'`.
  7. In a fixture of 6 houses, the shortlist order equals the expected order in the test.
  8. A house priced below 60% of its area's median per m² carries the scam note.
  9. A 200-row file goes from Pilih file to a saved shortlist CSV in under 10 minutes by hand (D-060, timed once).
- **Verification:** `.venv/bin/python manage.py test kpr.tests.test_import kpr.tests.test_shortlist` → all pass (criteria 1–8); `sqlite3 data/kpr.sqlite3 'pragma table_info(listing);' | grep -Ei 'agen|agent|phone|telepon'` → no output; criterion 9: stopwatch, result written in VERIFICATION.md.
- **Rough cost/effort:** Rp0; ~1 builder session.

## M3 — Default figures and reminders (F-03)
- **Goal:** the owner can see, check and update every default figure, and is warned when one is older than 30 days.
- **Deliverables:** F-03 complete (D-043, D-045); seeded defaults with date and source link (NPOPTKP Jakarta Selatan Rp250 juta [cite: regulation · https://news.ddtc.co.id/berita/daerah/1823579/beli-atau-dapat-warisan-properti-di-jakarta-pahami-kewajiban-pajaknya · pub 2026-10-26 · acc 2026-11-27 · amend-check 2026-11-27] [cite: regulation · https://www.hukumonline.com/klinik/a/cara-mengurus-bphtb-gratis-di-jakarta-lt5b4eaf1c40dc1/ · pub 2025-05-14 · acc 2026-11-26 · amend-check 2026-11-26], Depok Rp80 juta per S2.q2, BCA fees by loan size per S7.q5); notary/insurance empty (D-056); yellow banner after 30 days by the laptop date in WIB, Asia/Jakarta (D-020); backup reminder with the same banner (D-030); LUKS reminder on the Profile page until ticked (D-025).
- **Acceptance criteria:**
  1. With the clock set 31 days after a figure's date, the banner shows "1 angka bawaan lebih dari 30 hari — perbarui"; at 30 days it does not.
  2. A date saved at 23:30 WIB counts as that WIB day (a test with a fixed instant 2026-11-27T16:30:00Z gives 2026-11-27 23:30 WIB, and 17:30Z gives 2026-11-28).
  3. "Tandai sudah dicek" twice only refreshes the date.
  4. A laptop date earlier than a saved date shows no banner and no error.
  5. Editing a fee recalculates the shortlist (one house changes upfront cash in the test).
- **Verification:** `.venv/bin/python manage.py test kpr.tests.test_defaults` → all pass (criteria 1–5, clock frozen in the tests).
- **Rough cost/effort:** Rp0; ~1 builder session.

## M4 — Backup, delete, restore, privacy page and final check (F-04, F-05)
- **Goal:** the owner can export a backup, delete data by typing HAPUS, restore safely, and the whole app still passes the M0 checks.
- **Deliverables:** F-04 (D-044, D-046): "Ekspor cadangan" with the unencrypted-file warning (D-031); delete all / per import / profile only after typing HAPUS, rows removed, not hidden (D-026); F-05 (D-044): restore with an automatic backup first; Data & privasi page (D-029); keyboard path and labels on all three pages; final re-run of the M0 checks.
- **Acceptance criteria:**
  1. Export then delete-all then restore gives the same row counts per table as before (restore drill on a disposable copy).
  2. Restore creates an automatic backup file before it changes anything; a broken backup file is refused and nothing changes.
  3. Delete without typing exactly HAPUS does nothing; after delete-all, `select count(*)` on every data table is 0.
  4. "Hapus profil keuangan saja" leaves listings and removes income, savings and age.
  5. Every input has a visible label; Tab reaches every button in page order with a visible focus ring.
  6. Restore of a 2.000-row backup finishes in under 10 seconds on the laptop.
  7. All M0 verification commands still give the same results.
- **Verification:** `.venv/bin/python manage.py test kpr.tests.test_backup kpr.tests.test_delete` → all pass (criteria 1–4, 6); criterion 5: keyboard-only walk through the three pages, each step noted in VERIFICATION.md; criterion 7: re-run the M0 commands.
- **Rough cost/effort:** Rp0; ~1 builder session.

## Quality and operations targets
| Area | Target | Owner role | Milestone | Proof | Decision |
|---|---|---|---|---|---|
| Time zones | Store UTC, show and count days in WIB (Asia/Jakarta) | builder | M3 | M3 criterion 2 | D-020, D-063 |
| Browsers and devices | Current Firefox and Chromium on the owner's Linux laptop, laptop-first layout | builder | M4 | M0 + M4 checks run in both | D-047, D-064 |
| Accessibility | Labels on every input, keyboard path, visible focus | builder | M4 | M4 criterion 5 | D-064 |
| Error tracking | Local `data/app.log` only, no personal finance fields, kept 30 days | builder | M0 | M0 log grep | D-022, D-064 |
| Availability | Not applicable as a hosted target: local app started on demand (D-019); health = M0 HTTP 200 check | owner | M0 | M0 criterion 1 | D-019 |
| Owner alerts | In-app banners only (30-day defaults, backup reminder); no messages leave the laptop | builder | M3 | M3 criterion 1 | D-022, D-030 |
| Restore | Owner-triggered backup; restore drill with counts and time | owner | M4 | M4 criteria 1, 6 | D-025, D-044 |

<!-- lvr:english-summary -->

## Answers
- **S8.q1 Order M0 → M4 (D-063)** — Setuju urutan M0 sampai M4 (D-063). · _EN: order approved._ (delegated test agent)
- **S8.q2 Quality targets (D-064)** — Setuju target mutu (D-064). · _EN: quality targets approved._ (delegated test agent)
- **S8.q3 Display name** — Nama tetap 'KPR House Hunter'. · _EN: name stays._ (delegated test agent)

## Decisions this Section
- **D-063** Milestone order M0 skeleton → M1 calculations (F-02) → M2 import and shortlist (F-01) → M3 defaults (F-03) → M4 backup, delete, restore (F-04, F-05) · designer_filled (approved S8.q1)
- **D-064** Quality targets: Firefox and Chromium on the laptop; labels, keyboard path and focus; local log without finance fields, 30 days · designer_filled (approved S8.q2)

## Exit criteria
- [x] M0 exists and satisfies the walking-skeleton definition — evidence: M0
- [x] Milestones cover 100% of in-MVP features (F-01 M2, F-02 M1, F-03 M3, F-04 M4, F-05 M4) plus deploy to the laptop (M0, re-checked in M4)
- [x] Every milestone has goal, deliverables, acceptance criteria, verification and effort — evidence: M0–M4
- [x] Every acceptance criterion is machine-checkable — evidence: M0–M4
- [x] Every milestone is sized for one focused builder session — evidence: M0–M4

## Booster
planning-and-task-breakdown: installed, used at start (vertical slices, dependency order, one-session sizing)

## Context research
RQ-017 · no brief item targets S8; facts re-fetched in RQ-015/RQ-016 · became: none
