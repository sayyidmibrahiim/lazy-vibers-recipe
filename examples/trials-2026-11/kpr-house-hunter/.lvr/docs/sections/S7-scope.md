# S7 — Scope lock

Answer source note: every S7 answer was given by the owner's delegated test agent, answering on the owner's behalf for this trial (owner's note at S1.q6).

## In-MVP
- **F-01** Import listings and build the shortlist — load a hand-made CSV ("," or ";", Indonesian price formats, D-057), apply criteria and KPR limits, rank, export the shortlist CSV (must, D-034, D-038)
- **F-02** Set profile and criteria — finance (with current age, stored locally), per-bank KPR settings with age-capped tenor (D-055), must-have and nice-to-have criteria; drops houses whose upfront cash exceeds cash available, "belum lengkap" while notary/insurance are empty (D-056) (must, D-040, D-042)
- **F-03** Update default figures — edit NPOPTKP, bank fees (BCA administration by loan size, D-059), notary and insurance estimates with dates and source links; 30-day banner (should, kept, D-043; S7.q1)
- **F-04** Export backup and delete data — backup file with warning; delete all, per import or profile only (must, D-044)
- **F-05** Restore from backup — restore with an automatic backup first (should, kept, D-044; S7.q1)

## Parking Lot (recorded, never deleted)
- (empty) — no feature parked; no named-but-not-captured item in S4.

## Size check
5 in-MVP features, below the ~8 threshold; no size warning. Cut candidate offered: F-05. Owner kept all five (S7.q1).

## Kill criteria (D-061)
- **F-01** reworked if a 200-row file cannot be shortlisted in under 10 minutes (D-060).
- **F-02** reworked if the owner still recomputes affordability by hand.
- **F-03** dropped if no default figure is edited in 3 months.
- **F-04** kept regardless: it is the privacy erasure path (D-026).
- **F-05** dropped if no restore is needed in 6 months.

## Scope review
- Run 1 · "fix before locking" · blocking 0, major 4, minor 4 · score 7/10 · report `.lvr/review/REVIEW-2026-11-27-1.md`
- User's call: fixed before the lock — RV-L02-b541707a → D-055 (S4) · RV-L01-f3dc2e5c → D-056 (S4) · RV-L02-47261332 → D-057 (S4) · RV-L10-31d97b4b → D-058 (S5) · RV-L01-be07777c → D-059 (S2) · RV-L01-c4a7d48b → BI press release 21 Oct 2026 cited for the 31 Dec 2027 date (RQ-016; the plan's date was right, its primary cite was the older rule) · RV-L15-2e67bd28 → D-060 (S1) · RV-L04-e7e37a89 → D-061. No risk accepted. The split itself did not change.

## Lock
- Confirmed: S7.q7 · decision D-062 · journaled `scope_locked` 2026-11-27T02:37:52.483Z
- Frozen from here: changes go through /lvr-add-feature.

## Answers
- **S7.q1 Apakah kelima fitur (F-01 sampai F-05) masuk versi pertama, atau F-05 ditunda?** — Kelima fitur F-01 sampai F-05 masuk versi pertama. · _EN: all five features in the first version._
- **S7.q2 Jalankan pemeriksaan kritis cakupan sebelum dikunci, atau lewati?** — Jalankan pemeriksaan kritis cakupan. · _EN: run the scope review._
- **S7.q3 Tenor dan umur** — Setuju (a): tenor dipotong otomatis sesuai usia, usia diketik pengguna sendiri secara lokal di aplikasi. · _EN: cap the tenor by age; the owner types the age locally._
- **S7.q4 Notaris dan asuransi** — Setuju (b): tanpa angka bawaan, tampil 'belum lengkap'. · _EN: no default; show "belum lengkap"._
- **S7.q5 Perbaikan teks** — Ya, terapkan perbaikan format CSV, venv, tanggal DP 0%, dan biaya administrasi BCA. · _EN: apply the four text fixes._
- **S7.q6 Batas buang dan ukuran sukses** — Setuju contoh batas buang dan ukuran sukses. · _EN: kill criteria and success measure approved._
- **S7.q7 Ini versi pertama? Setelah Anda jawab ya, daftar ini dibekukan.** — Ya, ini versi pertama, F-01 sampai F-05, kunci daftar. · _EN: explicit yes; lock._

## Decisions this Section
- **D-055** Tenor capped by age (recorded in S4) — S7.q3 · status: user_confirmed
- **D-056** No notary/insurance default; "belum lengkap" (recorded in S4) — S7.q4 · status: user_confirmed
- **D-057** CSV format rules (recorded in S4) — S7.q5 · status: user_confirmed
- **D-058** venv install and start line (recorded in S5) — S7.q5 · status: user_confirmed
- **D-059** BCA administration by loan size (recorded in S2) — S7.q5 · status: user_confirmed
- **D-060** Measurable success (recorded in S1) — S7.q6 · status: user_confirmed
- **D-061** Kill criteria per feature — S7.q6 · status: user_confirmed
- **D-062** Scope locked: F-01–F-05 in-MVP, Parking Lot empty — S7.q7 · status: user_confirmed

## Exit criteria
- [x] Every F-NN from S4 marked in-MVP or Parking Lot — none missing, none deleted — evidence: S7.q1, D-062
- [x] Each parked item carries a one-line reason — evidence: D-062 (nothing parked)
- [x] The user explicitly confirmed the final list; `scope_locked` is journaled — evidence: S7.q7, D-062
- [x] The MVP-size sanity check ran — evidence: S7.q1
- [x] The scope review ran and `## Scope review` says so — evidence: S7.q2, RQ-015, RQ-016

## Booster
define-prioritization-framework: not in the booster registry for this run; S4 must/should priorities used as the prioritization frame (degraded)
