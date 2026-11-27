# Scope

Locked by D-062 (S7.q7, 2026-11-27). Changes go through /lvr-add-feature.

## In MVP
- **F-01** Import listings and build the shortlist — load a hand-made CSV ("," or ";", Indonesian price formats), apply criteria and KPR limits, rank, export the shortlist CSV (must) · kill: reworked if a 200-row file cannot be shortlisted in under 10 minutes (D-061)
- **F-02** Set profile and criteria — finance with current age (stored locally), per-bank KPR settings with age-capped tenor, must-have and nice-to-have criteria; drops houses whose upfront cash exceeds cash available; "belum lengkap" while notary/insurance are empty (must) · kill: reworked if the owner still recomputes affordability by hand (D-061)
- **F-03** Update default figures — edit NPOPTKP, bank fees (BCA administration by loan size), notary and insurance estimates with dates and source links; 30-day banner (should) · kill: dropped if no default figure is edited in 3 months (D-061)
- **F-04** Export backup and delete data — backup file with warning; delete all, per import or profile only (must) · kill: kept regardless, it is the privacy erasure path (D-061)
- **F-05** Restore from backup — restore with an automatic backup first (should) · kill: dropped if no restore is needed in 6 months (D-061)

## Parking Lot (recorded, never deleted)
- (empty) — no feature parked; no named-but-not-captured item in S4.
