# S4 — Features

<!-- lvr:english-summary -->

Answer source note: every S4 answer was given by the owner's delegated test agent, answering on the owner's behalf for this trial (owner's note at S1.q6). At S4.q10 the owner said the feature list is enough for version 1 ("cukup untuk fitur versi pertama"); the enough protocol ran: every feature below has a script, a priority and four unhappy paths. Unhappy-path defaults D-037, D-041, D-045, D-046 and D-047 are designer_filled; D-037 and D-041 were approved (S4.q5, S4.q8); D-045–D-047 are shown for correction in the S5 opening reply.

## Answers
- **S4.q1** F-01 script approved as written. · **S4.q2** Affordability: 30% (editable), tested at the floating rate (default 11%), both installments shown. · **S4.q3** Order: most nice-to-haves met, then smallest upfront cash. · **S4.q4** D-032, D-033 approved.
- **S4.q5** F-01 must; D-037 approved. · **S4.q6** Same link = same house; newest import replaces. · **S4.q7** F-02 approved, plus the drop rule when upfront cash exceeds cash available.
- **S4.q8** F-02 must; D-041 approved. · **S4.q9** F-03 approved, should. · **S4.q10** F-04 approved: export and delete must, restore should, automatic backup before restore; feature list enough for v1.

## Features

### F-01 — Import listings and build the shortlist
- **English name:** Import listings and build the shortlist
- **Who uses it:** the owner (D-005)
- **Happy path:** 1. Run the start command and open the bookmark; the Import CSV page appears. 2. Click Pilih file and choose the CSV (title, link, price, land area, building area, bedrooms, area Jaksel/Depok, new/resale; optional certificate). The separator may be "," or ";" (semicolon, auto-detected from the header row); UTF-8 with or without BOM; prices as plain digits, "Rp1.500.000.000" or "1,5 M" / "850 jt" (D-057). 3. The preview shows rows read, rejected rows with reasons, and dropped agent columns. 4. Click Impor; the Shortlist page opens. 5. Passing houses appear in order (D-036) with installment during and after promo (D-035), upfront cash (D-011, D-016) and notes (D-013, D-032, D-033); rejected houses are viewable with reasons. 6. Click Simpan CSV. Done: a shortlist CSV file (D-008). — D-034
- **Priority:** must (S4.q5)
- **Unhappy paths** (D-037, D-039, D-027)
  - Abandon/interruption — tab closed during preview: nothing imported; check: no new rows after reopening.
  - Invalid input — unreadable price/area or missing column: row rejected with row number and reason, others import; missing header: file refused with the expected column list; oversized file refused (D-027).
  - Concurrency/retry — Impor locks after one click; re-import of the same link replaces the old data and reports "X listing diperbarui" (D-039); check: row count unchanged after importing the same file twice.
  - Expiry/hold — listings imported more than 30 days ago (laptop clock, WIB) are marked "cek apakah masih dijual".

### F-02 — Set profile and criteria
- **English name:** Set profile and criteria
- **Who uses it:** the owner
- **Happy path:** 1. Open Profile & Criteria. 2. Finance: net monthly income, other installments, cash available, current age (typed by the owner, stored only locally). 3. KPR per bank: minimum DP (5%), promo rate and length, floating rate (11%), tenor (20 years), maximum tenor (25 years), maximum age at loan end (65), cap 30%; the tenor used is the smallest of tenor, maximum tenor and (age limit − current age), shown per house (D-055). 4. Must-have criteria: max price, area, min bedrooms, min land area, new/resale/both. 5. Nice-to-have: larger building area, more bedrooms, SHM, new house. 6. Click Simpan. Done: "Tersimpan" with the date; the shortlist recalculates; houses whose upfront cash exceeds cash available are dropped; while notary/PPAT or insurance estimates are empty, upfront cash shows "belum lengkap" and those houses sit in a "Dana tunai belum lengkap" group, never marked as passing (D-056). — D-040
- **Priority:** must (S4.q8)
- **Unhappy paths** (D-041)
  - Abandon/interruption — unsaved-changes warning; nothing saved without Simpan.
  - Invalid input — range checks per field with messages; Simpan disabled until fixed; empty profile → Shortlist shows "Isi profil keuangan dulu" and applies must-haves only.
  - Concurrency/retry — save from an outdated tab refused with "Data sudah diubah di tab lain — muat ulang".
  - Expiry/hold — every rate and default shows its last-updated date; warning after 30 days (D-020).

### F-03 — Update default figures
- **English name:** Update default figures
- **Who uses it:** the owner
- **Happy path:** 1. Click the yellow banner "N angka bawaan lebih dari 30 hari — perbarui". 2. The Default Figures part of Profile & Criteria lists NPOPTKP per area, bank fees per bank (BCA administration by loan size, D-059), notary and insurance estimates (empty until the owner fills them, D-056), each with date and source link. 3. Check the source; edit, or click Tandai sudah dicek. 4. Click Simpan. Done: dates become today, the banner disappears, the shortlist recalculates. — D-043
- **Priority:** should (S4.q9)
- **Unhappy paths** (D-045)
  - Abandon/interruption — unsaved-changes warning, as F-02.
  - Invalid input — amounts ≥ 0, percentages 0–100, field messages.
  - Concurrency/retry — Tandai sudah dicek twice only refreshes the date.
  - Expiry/hold — 30-day clock per figure on the laptop date (WIB); a laptop date earlier than a saved date shows no warning and no error.

### F-04 — Export backup and delete data
- **English name:** Export backup and delete data
- **Who uses it:** the owner
- **Happy path:** 1. Open Data & privasi from the footer link (D-029). 2. Ekspor cadangan → warning (D-031) → Lanjut → kpr-cadangan-YYYY-MM-DD.json downloads. 3. Delete: choose all data, one import file, or the financial profile only; type HAPUS. Done: "Data dihapus" (D-026). — D-044
- **Priority:** must (S4.q10)
- **Unhappy paths** (D-046)
  - Abandon/interruption — cancelled download changes nothing; the backup reminder stays (D-030).
  - Invalid input — anything but HAPUS keeps the delete button disabled.
  - Concurrency/retry — delete locks after one click.
  - Expiry/hold — not applicable: no hold or deadline; the backup reminder timing is covered by D-030.

### F-05 — Restore from backup
- **English name:** Restore from backup
- **Who uses it:** the owner
- **Happy path:** 1. On Data & privasi click Pulihkan dari cadangan. 2. Choose the file. 3. The app shows listing count and profile date, and warns that current data will be replaced. 4. Type PULIHKAN. Done: the app writes an automatic backup of current data, then restores. — D-044
- **Priority:** should (S4.q10)
- **Unhappy paths** (D-046)
  - Abandon/interruption — a restore that fails midway returns to the previous state and says so.
  - Invalid input — a non-backup file or one from a newer app version is refused before anything changes.
  - Concurrency/retry — restore locks after one click.
  - Expiry/hold — not applicable: backups have no expiry; the file's own date is shown.

## Other decisions this Section
- **D-032** Far-below-market price flag — U-14 · designer_filled (approved S4.q4)
- **D-033** Certificate notes — U-09 · designer_filled (approved S4.q4)
- **D-035** Affordability rule — S4.q2 · user_confirmed
- **D-036** Shortlist order — S4.q3 · user_confirmed
- **D-038, D-042** Priorities of F-01, F-02 · user_confirmed
- **D-039** Duplicate rule — S4.q6 · user_confirmed
- **D-047** First run (three-step guide and sample CSV), app stopped mid-use, laptop-first layout · designer_filled (shown for correction)

- **D-055** Tenor capped by age (owner types age locally; max tenor 25 years; max age at loan end 65) — S7.q3, scope review RV-L02-b541707a · user_confirmed
- **D-056** No default for notary/PPAT and insurance; upfront cash "belum lengkap" until filled — S7.q4, RV-L01-f3dc2e5c · user_confirmed
- **D-057** CSV separator "," or ";", UTF-8 with/without BOM, Indonesian price formats — S7.q5, RV-L02-47261332 · user_confirmed

## Exit criteria
- [x] The user has said enough — evidence: S4.q10
- [x] No placeholders; every feature has a happy-path script — evidence: F-01–F-05
- [x] Every feature has a priority — evidence: D-038, D-042, D-043, D-044
- [x] Four unhappy-path types per feature — evidence: D-037, D-041, D-045, D-046
- [x] Web profile: device, empty state, connection loss — evidence: D-047

## Booster
grilling: used at start and per pass · user-stories: installed this Section, used for the feature format · ux-copy: installed, used for message wording (Indonesian microcopy) · mom-test: installed, used to keep confirmation questions about past behavior, not opinions

## Context research
RQ-012 · items shown: U-08, U-19, U-12, U-14, U-09, U-13 · became: S4.q2/D-035, D-032, D-033, D-034
