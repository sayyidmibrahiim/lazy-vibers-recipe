# Code style

## Language and framework conventions
- Python 3.14 and Django 6.1.3 only (D-050, D-051). No other package without a new decision.
- One Django project `kpr_site` and one app `kpr`. Function-based views; Django forms for every input.
- Names in English in code (`net_income_monthly`, `tenor_used_years`); screen text in Indonesian in templates (D-009). Keep the D-001 terms: KPR, DP (uang muka), tenor, cicilan, bunga fixed/floating.
- Money as `int` rupiah; rates as `int` basis points. Use `decimal.Decimal` inside `calc.py` and round to whole rupiah once, at the end (half-up).
- Time: `USE_TZ = True`, `TIME_ZONE = "Asia/Jakarta"`; store UTC.
- Settings: `ALLOWED_HOSTS = ["127.0.0.1", "localhost"]`, `CSRF_TRUSTED_ORIGINS = ["http://127.0.0.1:8000", "http://localhost:8000"]`, `DEBUG = False` in `start.sh`, `SECRET_KEY` generated once into `data/secret_key` (git-ignored).
- Templates auto-escape; never use `|safe` or `mark_safe` on listing data (D-027).
- No online fonts, CDNs, analytics or scripts (D-022). Static files served locally.

## Error handling
- Parsing errors are values, not exceptions: `importer.py` returns `(rows, rejected)` with row number and a reason key; the view maps reason keys to Indonesian messages.
- Saves that touch more than one table run inside `transaction.atomic()`; restore and delete always do (F-05 rollback).
- An unexpected exception shows "Terjadi kesalahan. Data Anda tidak berubah." and logs the exception class and view name only. Never log form data, income, savings, cash or age (D-064).
- Validate on the server even when the browser already checks a field.

## Testing expectations
- Django `TestCase` under `kpr/tests/`. Run: `.venv/bin/python manage.py test`.
- `calc.py` tests use the exact figures in MILESTONES.md (for example Rp10.321.884 for Rp1.000.000.000, 11%, 20 years).
- Every acceptance criterion in SPEC/requirements.md has a test named after it, except the stopwatch (M2) and keyboard walk (M4) checks, which are recorded in VERIFICATION.md.
- Freeze time with `unittest.mock.patch` on `django.utils.timezone.now` for 30-day and WIB tests.
- Security tests in `test_security.py`: Host 400, Origin 403, escaped listing text, formula-safe export.

## Simplicity rules
- Write the minimum that passes the milestone's criteria; no speculative settings, plugins or abstractions.
- No JavaScript framework. Plain HTML forms; at most a few lines of vanilla JS for the unsaved-changes warning and button locking.
- No class hierarchies for banks or fees: one `BankSetting` row per bank and plain functions in `calc.py`.
- No background jobs, schedulers or services (D-019).
- Delete code that no criterion needs.
