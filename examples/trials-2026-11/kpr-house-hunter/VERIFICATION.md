# Verification

Every acceptance criterion in MILESTONES.md has a procedure here. Results are written under a `## Build log — <ts>` section by the builder.

## M0 — Walking skeleton: start, import, see the list
Run on the deploy target (the owner's Linux laptop) from the project folder. Unless a step starts it, `./start.sh` runs in another terminal. One numbered step per acceptance criterion in MILESTONES.md.

1. Run `./start.sh`. Expected: a line containing `http://127.0.0.1:8000/`; then `curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8000/impor/` prints `200`.
2. Run `ss -ltnp | grep 8000`. Expected: only `127.0.0.1:8000`, no `0.0.0.0` or LAN address.
3. Run `curl -s -o /dev/null -w '%{http_code}\n' -H 'Host: evil.example' http://127.0.0.1:8000/`. Expected: `400`.
4. Run `curl -s -o /dev/null -w '%{http_code}\n' -X POST -H 'Origin: http://evil.example' http://127.0.0.1:8000/impor/pratinjau/`. Expected: `403`.
5. In the browser import `sample/contoh-listing.csv`, then run `sqlite3 data/kpr.sqlite3 'select count(*) from kpr_listing;'`. Expected: `5`; after reload the Daftar page shows 5 titles.
6. Run `.venv/bin/python manage.py test`. Expected: last line `OK`. Then `grep -Ei 'income|penghasilan|tabungan|usia' data/app.log` prints nothing.

## M1 — Profile, criteria and the money calculations (F-02)
Run on the deploy target (the owner's Linux laptop) from the project folder. Unless a step starts it, `./start.sh` runs in another terminal. One numbered step per acceptance criterion in MILESTONES.md.

1. Run `.venv/bin/python manage.py test kpr.tests.test_calc.InstallmentTests.test_20y_11pct`. Expected: `OK` (Rp10.321.884 ±Rp1).
2. Run `.venv/bin/python manage.py test kpr.tests.test_calc.InstallmentTests.test_age_caps_tenor`. Expected: `OK` (15 years, Rp11.365.969 ±Rp1).
3. Run `.venv/bin/python manage.py test kpr.tests.test_calc.InstallmentTests.test_promo_then_floating`. Expected: `OK` (Rp5.397.002 then Rp10.074.142).
4. Run `.venv/bin/python manage.py test kpr.tests.test_calc.FeeTests.test_admin_tiers`. Expected: `OK` (Rp500.000 / Rp1.200.000 / Rp3.000.000).
5. Run `.venv/bin/python manage.py test kpr.tests.test_calc.FeeTests.test_bphtb`. Expected: `OK` (Rp62.500.000 Jaksel, Rp71.000.000 Depok).
6. Run `.venv/bin/python manage.py test kpr.tests.test_profile.IncompleteTests`. Expected: `OK`; in the browser, with notary empty, every house shows "belum lengkap" and none is in Lolos.
7. Run `.venv/bin/python manage.py test kpr.tests.test_profile.ValidationTests`. Expected: `OK`; in the browser an age of 200 shows a field message and Simpan stays disabled; a save from an old tab shows "Data sudah diubah di tab lain — muat ulang".

## M2 — Full import and the ranked shortlist (F-01)
Run on the deploy target (the owner's Linux laptop) from the project folder. Unless a step starts it, `./start.sh` runs in another terminal. One numbered step per acceptance criterion in MILESTONES.md.

1. Run `.venv/bin/python manage.py test kpr.tests.test_import.SeparatorTests`. Expected: `OK` (comma and semicolon files give identical rows).
2. Run `.venv/bin/python manage.py test kpr.tests.test_import.PriceFormatTests`. Expected: `OK` (three formats read as 1500000000; "satu M" rejected with reason).
3. Run `.venv/bin/python manage.py test kpr.tests.test_import.LimitTests`. Expected: `OK` (2.001 rows and 6 MB refused; 0 rows stored).
4. Run `.venv/bin/python manage.py test kpr.tests.test_import.DuplicateTests`. Expected: `OK` (same link stored once).
5. Run `sqlite3 data/kpr.sqlite3 'pragma table_info(kpr_listing);' | grep -Ei 'agen|agent|phone|telepon'`. Expected: no output.
6. Run `.venv/bin/python manage.py test kpr.tests.test_security.ExportTests`. Expected: `OK` (cells starting = + - @ exported with a leading ').
7. Run `.venv/bin/python manage.py test kpr.tests.test_shortlist.OrderTests`. Expected: `OK` (6-house fixture in the expected order).
8. Run `.venv/bin/python manage.py test kpr.tests.test_shortlist.ScamFlagTests`. Expected: `OK`.
9. With a stopwatch, import a 200-row CSV and click Simpan CSV. Expected: under 10 minutes; write the time in the build log (D-060).

## M3 — Default figures and reminders (F-03)
Run on the deploy target (the owner's Linux laptop) from the project folder. Unless a step starts it, `./start.sh` runs in another terminal. One numbered step per acceptance criterion in MILESTONES.md.

1. Run `.venv/bin/python manage.py test kpr.tests.test_defaults.BannerTests`. Expected: `OK` (banner at 31 days, not at 30).
2. Run `.venv/bin/python manage.py test kpr.tests.test_defaults.WibTests`. Expected: `OK` (16:30Z → 27 Nov 23:30 WIB; 17:30Z → 28 Nov).
3. Run `.venv/bin/python manage.py test kpr.tests.test_defaults.MarkCheckedTests`. Expected: `OK` (twice only refreshes the date).
4. Run `.venv/bin/python manage.py test kpr.tests.test_defaults.ClockBackTests`. Expected: `OK` (no banner, no error).
5. Run `.venv/bin/python manage.py test kpr.tests.test_defaults.RecalcTests`. Expected: `OK`; in the browser, raising a fee changes one house's upfront cash on Daftar.

## M4 — Backup, delete, restore, privacy page and final check (F-04, F-05)
Run on the deploy target (the owner's Linux laptop) from the project folder. Unless a step starts it, `./start.sh` runs in another terminal. One numbered step per acceptance criterion in MILESTONES.md.

1. Run `.venv/bin/python manage.py test kpr.tests.test_backup.RoundTripTests`. Expected: `OK` (counts per table equal after export → delete all → restore).
2. Run `.venv/bin/python manage.py test kpr.tests.test_backup.SafetyTests`. Expected: `OK` (automatic backup exists before restore; broken file refused, nothing changed).
3. Run `.venv/bin/python manage.py test kpr.tests.test_delete.HapusTests`. Expected: `OK`; then after delete-all in the browser, `sqlite3 data/kpr.sqlite3 "select count(*) from kpr_listing;"` prints `0`.
4. Run `.venv/bin/python manage.py test kpr.tests.test_delete.ProfileOnlyTests`. Expected: `OK` (listings kept; income, savings, cash, age gone).
5. Keyboard walk: press Tab through Impor, Daftar, Profil & Kriteria and Data & privasi. Expected: every input has a visible label, every control is reached in order with a visible focus ring; record the walk in the build log.
6. Run `.venv/bin/python manage.py test kpr.tests.test_backup.SpeedTests`. Expected: `OK` (2.000-row restore under 10 seconds).
7. Re-run every M0 step 1–6. Expected: the same results as in M0.

### Contrast checks (UI_SPEC.md)
The helper and its MIT license are copied to `.lvr/verification/` (SHA-256 `393e6433d120632aa11184792a16cd7b325924dbc9993477825d9aa67fdbfe6e`). Each command must exit 0 (normal text 4.5:1) unless marked large/control (3:1).
```sh
python3 .lvr/verification/contrast-check.py "#1F2937" "#FFFFFF"   # body text on surface
python3 .lvr/verification/contrast-check.py "#1F2937" "#F3F4F6"   # body text on muted surface
python3 .lvr/verification/contrast-check.py "#FFFFFF" "#1D4ED8"   # primary button label
python3 .lvr/verification/contrast-check.py "#1D4ED8" "#FFFFFF"   # link and focus ring on surface
python3 .lvr/verification/contrast-check.py "#78350F" "#FEF3C7"   # warning banner text
python3 .lvr/verification/contrast-check.py "#991B1B" "#FEE2E2"   # error message text
python3 .lvr/verification/contrast-check.py "#14532D" "#DCFCE7"   # success / lolos badge
python3 .lvr/verification/contrast-check.py "#4B5563" "#FFFFFF"   # secondary text
```
Plan-time results are in UI_SPEC.md → Verification. Re-run them after any colour change.

### Keyboard and reduced-motion checks (M4)
1. With the mouse unplugged or unused, press Tab from the top of each page (Impor, Daftar, Profil & Kriteria, Data & privasi). Expected: every control is reached in visual order, each shows a visible focus ring, and Enter/Space activates it.
2. Submit Profil & Kriteria with one invalid field. Expected: the first invalid field gets focus and its message is read by the screen reader (Orca) via `aria-live`.
3. In Firefox set `ui.prefersReducedMotion` = 1 (about:config). Expected: no transition is visible; all actions still work.
4. Zoom to 200% and set the window to 320 CSS px wide. Expected: Impor and Profil & Kriteria need no horizontal scroll; the shortlist table scrolls inside its own box.

## Global smoke test
On the laptop, networking turned off (D-022). Record each step's output in the Build log.
1. Fresh copy: `rm -rf /tmp/kpr-smoke && cp -r . /tmp/kpr-smoke && cd /tmp/kpr-smoke && rm -f data/kpr.sqlite3` → expected: exit code 0.
2. Start: `./start.sh &` → expected: a line containing `http://127.0.0.1:8000/`.
3. Page answers: `curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8000/impor/` → expected: `200`.
4. Foreign Host refused: `curl -s -o /dev/null -w '%{http_code}\n' -H 'Host: evil.example' http://127.0.0.1:8000/` → expected: `400`.
5. Tests: `.venv/bin/python manage.py test` → expected: last line `OK`.
6. Browser, Impor CSV: choose `sample/contoh-listing.csv` and confirm → expected: the preview says 5 rows read, 0 rejected.
7. Browser, Profil & Kriteria: fill every field including notary and insurance, click Simpan → expected: the Shortlist shows at least one "lolos" house with both installments, the tenor used and upfront cash.
8. Browser, Shortlist: click Simpan CSV and open the file in LibreOffice → expected: one row per shortlisted house with installment and upfront cash columns.
9. Browser, Data & privasi: Ekspor cadangan → Hapus semua (type HAPUS) → Pulihkan (type PULIHKAN) with that backup → expected: the Shortlist shows the same houses as in step 7.

## Definition of verified
A milestone is verified when every acceptance criterion's procedure above was run on the owner's Linux laptop (the deploy target), each produced the expected result, and the commands and outputs were recorded in a `## Build log — <ts>` section of this file. Manual checks (stopwatch, keyboard walk) record who ran them, when and the observed result. A milestone with any failing or skipped procedure is not verified.
