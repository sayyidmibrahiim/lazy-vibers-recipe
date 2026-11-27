# Requirements

All five features are in the MVP (D-062). User for every feature: the owner (D-005). Screen text is Indonesian (D-009); messages below are quoted as the app shows them.

## F-01 — Import listings and build the shortlist
- **User:** the owner · **Priority:** must · **Status:** in-MVP
- **Behavior:** the owner picks a hand-made CSV (title, link, price, land area, building area, bedrooms, area Jaksel/Depok, new/resale; optional certificate). The app previews rows read, rejected rows with reasons and dropped agent columns. After Impor, the Shortlist page lists passing houses in order (most nice-to-haves met, then smallest upfront cash, D-036) with installment during and after promo (D-035), the tenor used (D-055), upfront cash (D-011, D-016, D-056, D-059) and notes (D-013, D-032, D-033). Simpan CSV saves the shortlist (D-008). Source: D-034.
- **Acceptance criteria:**
  - **Given** a CSV with "," or ";" separators, UTF-8 with or without BOM **when** it is imported **then** both give identical rows (D-057).
  - **Given** prices "1500000000", "Rp1.500.000.000" and "1,5 M" **when** imported **then** each reads as 1.500.000.000; any other format is a rejected row with its row number and reason (D-057, D-037).
  - **Given** a file over 5 MB or over 2.000 rows **when** imported **then** it is refused with a plain message and nothing is stored (D-027).
  - **Given** a file without the required header **when** imported **then** it is refused with the expected column list (D-037).
  - **Given** two rows with the same link **when** imported **then** one house is stored and the newest import replaces the old data, reported as "X listing diperbarui" (D-039).
  - **Given** agent name or phone columns **when** imported **then** they are not stored (D-024).
  - **Given** a cell starting with `=`, `+`, `-` or `@` **when** the shortlist is exported **then** the cell starts with `'` (D-027).
  - **Given** a link that is not http or https **when** imported **then** it is shown as plain text, not as a link (D-027).
  - **Given** a house priced below 60% of its area's median price per m² **when** the shortlist shows **then** it carries the scam-warning note (D-032).
  - **Given** the tab is closed during the preview **when** the app is reopened **then** no new rows exist (D-037).
  - **Given** a house imported more than 30 days ago (WIB) **when** the shortlist shows **then** it is marked "cek apakah masih dijual" (D-037).

## F-02 — Set profile and criteria
- **User:** the owner · **Priority:** must · **Status:** in-MVP
- **Behavior:** the owner enters net monthly income, other installments, cash available and current age (stored only locally), then per-bank KPR settings: minimum DP (default 5%, D-010), promo rate and length, floating rate (default 11%), tenor (default 20 years), maximum tenor (default 25), maximum age at loan end (default 65), cap (default 30%). Must-have criteria: max price, area, min bedrooms, min land area, new/resale/both. Nice-to-have: larger building area, more bedrooms, SHM, new house. Simpan recalculates the shortlist. Source: D-040, D-055, D-056.
- **Acceptance criteria:**
  - **Given** a loan of Rp1.000.000.000 at 11% for 20 years **when** calculated **then** the installment is Rp10.321.884 (±Rp1).
  - **Given** current age 50 and age limit 65 **when** calculated **then** the tenor used is 15 years and the installment Rp11.365.969 (±Rp1) (D-055).
  - **Given** a 2,70% promo for 1 year on a 20-year Rp1.000.000.000 loan **when** calculated **then** the promo installment is Rp5.397.002 and the later one Rp10.074.142 (±Rp1) (D-035).
  - **Given** the installment at the floating rate exceeds cap × net income − other installments **when** the shortlist recalculates **then** the house is not in the passing list (D-035).
  - **Given** upfront cash exceeds cash available **when** the shortlist recalculates **then** the house is dropped (D-040).
  - **Given** notary/PPAT or insurance estimates are empty **when** the shortlist shows **then** upfront cash reads "belum lengkap" and the house is in the "Dana tunai belum lengkap" group, never passing (D-056).
  - **Given** an out-of-range field **when** the owner edits it **then** a field message shows and Simpan stays disabled (D-041).
  - **Given** an empty financial profile **when** the Shortlist opens **then** it shows "Isi profil keuangan dulu" and applies must-haves only (D-041).
  - **Given** a save from an outdated tab **when** Simpan is clicked **then** it is refused with "Data sudah diubah di tab lain — muat ulang" (D-041).
  - **Given** unsaved changes **when** the owner leaves the page **then** a warning shows and nothing is saved (D-041).

## F-03 — Update default figures
- **User:** the owner · **Priority:** should · **Status:** in-MVP
- **Behavior:** the Default Figures part of Profile & Criteria lists NPOPTKP per area (South Jakarta Rp250 juta [cite: regulation · https://news.ddtc.co.id/berita/daerah/1823579/beli-atau-dapat-warisan-properti-di-jakarta-pahami-kewajiban-pajaknya · pub 2026-10-26 · acc 2026-11-27 · amend-check 2026-11-27] [cite: regulation · https://www.hukumonline.com/klinik/a/cara-mengurus-bphtb-gratis-di-jakarta-lt5b4eaf1c40dc1/ · pub 2025-05-14 · acc 2026-11-26 · amend-check 2026-11-26], Depok Rp80 juta per S2.q2), bank fees per bank (BCA provisi 1% [cite: price · https://www.bca.co.id/id/individu/produk/pinjaman/kpr/kpr-first · n.d. · acc 2026-11-27 · primary · live], administration by loan size, appraisal), and notary and insurance estimates (empty until filled), each with a date and source link. A yellow banner "N angka bawaan lebih dari 30 hari — perbarui" appears after 30 days. Source: D-043, D-016, D-020, D-056, D-059.
- **Acceptance criteria:**
  - **Given** a figure dated 31 days ago **when** any page opens **then** the banner counts it; at 30 days it does not (D-020).
  - **Given** a fixed instant 2026-11-27T16:30:00Z **when** shown **then** it reads 27 Nov 2026 23:30 WIB; 17:30Z reads 28 Nov 2026 (D-064).
  - **Given** Tandai sudah dicek is clicked twice **when** saved **then** only the date is refreshed (D-045).
  - **Given** a laptop date earlier than a saved date **when** the page opens **then** no banner and no error show (D-045).
  - **Given** a negative amount or a percentage above 100 **when** entered **then** a field message shows (D-045).
  - **Given** a loan of Rp400.000.000 / Rp1.200.000.000 / Rp3.500.000.000 **when** administration is computed **then** it is Rp500.000 / Rp1.200.000 / Rp3.000.000 (D-059).

## F-04 — Export backup and delete data
- **User:** the owner · **Priority:** must · **Status:** in-MVP
- **Behavior:** Data & privasi (footer link, D-029) offers Ekspor cadangan with the unencrypted-file warning (D-031), downloading `kpr-cadangan-YYYY-MM-DD.json`, and delete of all data, one import file or the financial profile only after typing HAPUS (D-026). Source: D-044.
- **Acceptance criteria:**
  - **Given** Ekspor cadangan **when** clicked **then** the warning shows before the download (D-031).
  - **Given** a typed word other than HAPUS **when** shown **then** the delete button stays disabled (D-046).
  - **Given** delete all **when** confirmed **then** every data table has 0 rows (D-026).
  - **Given** delete profile only **when** confirmed **then** listings remain and income, savings, cash and age are gone (D-026).
  - **Given** delete per import **when** confirmed **then** only that import's listings are removed (D-026).
  - **Given** a cancelled download **when** checked **then** nothing changed and the backup reminder stays (D-030, D-046).

## F-05 — Restore from backup
- **User:** the owner · **Priority:** should · **Status:** in-MVP
- **Behavior:** Pulihkan dari cadangan shows the file's listing count and profile date, warns that current data will be replaced, and needs the typed word PULIHKAN. The app writes an automatic backup of current data first, then restores. Source: D-044.
- **Acceptance criteria:**
  - **Given** export, delete all, restore **when** done **then** row counts per table equal those before (D-052).
  - **Given** a restore **when** it starts **then** an automatic backup file exists before any change (D-044).
  - **Given** a non-backup file or one from a newer app version **when** chosen **then** it is refused before anything changes (D-046).
  - **Given** a restore that fails midway **when** it stops **then** the previous data is back and the page says so (D-046).
  - **Given** a 2.000-row backup **when** restored **then** it finishes in under 10 seconds (S8 M4).
