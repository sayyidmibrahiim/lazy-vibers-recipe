# Architecture

## Stack
- **Python 3.14** — the laptop's installed 3.14.4, supported to 2030-10 (D-050, D-048) [cite: version · https://devguide.python.org/versions/ · n.d. · acc 2026-11-27 · primary · live].
- **Django 6.1.3** — web framework; ALLOWED_HOSTS gives the Host check and CSRF middleware the Origin check (D-051, D-021, D-028) [cite: version · https://docs.djangoproject.com/en/stable/ref/settings/ · n.d. · acc 2026-11-27 · primary · live].
- **SQLite** — one file through Django's built-in backend (D-052).
- **Virtual environment** `.venv` — PEP 668 makes the distro Python refuse global installs (D-058) [cite: version · https://peps.python.org/pep-0668/ · n.d. · acc 2026-11-27 · primary · live].
- No other runtime dependency; standard library `csv`, `decimal`, `zoneinfo`, `json`.
- Framework re-check due 2026-12-11 (S5b `recheck_by`): check for a Django 6.1.x security release before M0 starts.

## Components
- `start.sh` — one command: runs `.venv/bin/python manage.py migrate --noinput` then `runserver 127.0.0.1:8000` (D-019).
- `kpr/importer.py` — CSV reading, separator and price parsing, limits, dedupe (F-01, D-027, D-039, D-057).
- `kpr/calc.py` — pure functions: installment, tenor used, BPHTB, bank fees, upfront cash, pass/fail (F-02, D-011, D-035, D-055, D-056, D-059). No database access.
- `kpr/shortlist.py` — recalculation, ordering, flags (D-032, D-033, D-036).
- `kpr/backup.py` — export, delete, restore with automatic backup first (F-04, F-05).
- `kpr/views.py`, `kpr/forms.py`, `kpr/templates/` — the three pages plus Data & privasi (D-007, D-029).
- `kpr/models.py` — the entities in SPEC/data-model.md.

## Data flow
```text
 owner's browser (Firefox / Chromium on the laptop)
        |  http://127.0.0.1:8000  (Host + Origin checked)
        v
 Django views/forms ──> importer.py ──> models (SQLite: data/kpr.sqlite3)
        |                                   ^
        └──> calc.py / shortlist.py ────────┘
        |
        └──> shortlist CSV / backup JSON downloaded to the laptop's disk
 (no network call leaves the laptop — D-022)
```

## Folder structure
```text
kpr-house-hunter/
├── start.sh
├── manage.py
├── requirements.txt          # Django==6.1.3
├── kpr_site/                 # settings.py, urls.py
├── kpr/
│   ├── models.py  views.py  forms.py  urls.py
│   ├── importer.py  calc.py  shortlist.py  backup.py
│   ├── templates/kpr/        # impor.html daftar.html profil.html data.html base.html
│   ├── static/kpr/           # app.css (no online fonts or scripts, D-022)
│   └── tests/                # test_calc.py test_profile.py test_import.py test_shortlist.py
│                             # test_defaults.py test_backup.py test_delete.py test_security.py
├── sample/contoh-listing.csv
├── data/                     # kpr.sqlite3, app.log, backups/ (git-ignored)
└── .venv/                    # git-ignored
```

## Local run
```sh
python3 -m venv .venv
.venv/bin/pip install "Django==6.1.3"
./start.sh                      # prints http://127.0.0.1:8000/
.venv/bin/python manage.py test # all tests
```
Offline fallback: keep the Django wheel in `vendor/` and install with `.venv/bin/pip install --no-index --find-links vendor Django==6.1.3` (D-058) [cite: version · https://docs.djangoproject.com/en/stable/ref/settings/ · n.d. · acc 2026-11-27 · primary · live].

## Failure points
- **Install refused** (`externally-managed-environment`) — pip was run outside `.venv`; rerun with `.venv/bin/pip` (D-058).
- **Port 8000 busy** — `start.sh` prints "Port 8000 dipakai program lain" and exits 1.
- **SQLite file locked or corrupt** — the page shows "Terjadi kesalahan. Data Anda tidak berubah."; recover with Pulihkan dari cadangan (F-05).
- **Wrong CSV format** — rows rejected with reasons in the preview (D-037, D-057).
- **Laptop clock wrong** — 30-day warnings shift; an earlier date shows no warning and no error (D-045).
- **Stale figures** — bank rates and fees change; the 30-day banner asks for a check (D-020).

## Data sources and integrations
| Source | Origin and owner | Fields | Access boundary | Terms / evidence | Refresh | When stale or missing |
|---|---|---|---|---|---|---|
| Listings CSV | Copied by hand by the owner from Rumah123, 99.co or Lamudi (D-003) | title, link, price, areas, bedrooms, area, condition, certificate | read once at import; agent name/phone dropped (D-024) | no scraping; sites' terms ban it (R-12, U-03, S1.q2) | each new file, 2–4 per month (D-018) | listings older than 30 days marked "cek apakah masih dijual" |
| Default cost figures | Seeded from S2 Prices quoted; owner updates (F-03) | NPOPTKP, BCA fees, notary, insurance | local table only | sources in RESEARCH.md with dates (S2 Prices quoted, S2.q2) | owner check every 30 days (D-020) | yellow banner; notary/insurance empty → "belum lengkap" (D-056) |
| Bank rates | Typed by the owner per bank (D-035) | promo, floating, tenor, limits | local table only | bank pages (RESEARCH.md); owner-entered (S4.q2) | when a promo ends (R-5) | 30-day banner |
| Financial profile | Typed by the owner (D-006) | income, installments, cash, age | never leaves the laptop (D-022) | first-party; household use (D-023, S0.q1) | when it changes | "Isi profil keuangan dulu" |

No API, model service or online integration exists (D-022).

## Quality targets
| Area | Target | Owner role | Milestone | Proof | Decision |
|---|---|---|---|---|---|
| Time zones | Store UTC, show and count days in WIB (Asia/Jakarta) | builder | M3 | M3 criterion 2 | D-020, D-064 |
| Browsers and devices | Current Firefox and Chromium on the owner's Linux laptop, laptop-first layout | builder | M4 | M0 + M4 checks run in both | D-047, D-064 |
| Accessibility | Labels on every input, keyboard path, visible focus | builder | M4 | M4 criterion 5 | D-064 |
| Error tracking | Local `data/app.log` only, no personal finance fields, kept 30 days | builder | M0 | M0 log grep | D-022, D-064 |
| Availability | Not a hosted target: local app started on demand; health = M0 HTTP 200 check | owner | M0 | M0 criterion 1 | D-019 |
| Owner alerts | In-app banners only (30-day defaults, backup reminder) | builder | M3 | M3 criterion 1 | D-022, D-030 |
| Restore | Owner-triggered backup; restore drill with counts and time | owner | M4 | M4 criteria 1, 6 | D-025, D-044 |
