# Security

## Auth model
No login (D-007). The app serves only the owner's browser on the same laptop: it binds to 127.0.0.1 and rejects any Host header other than localhost/127.0.0.1 with the app port (D-021). Data-changing requests are POST only and need Django's CSRF token and a matching Origin (D-028). No sessions, accounts or passwords exist, so there is no password reset.

## PII inventory and protection
| Data | Where it lives | Protection |
|---|---|---|
| Net income, other installments, cash available, current age (financial profile) | `Profile` table in `data/kpr.sqlite3` | local only (D-006, D-022); never logged (D-064); delete alone via "profil saja" + HAPUS (D-026); disk encryption (D-025) |
| Criteria and bank settings | `Criteria`, `BankSetting` tables | local only; deleted with "semua" |
| Default figures with dates | `DefaultFigure` table | local only |
| Listings and shortlist results | `Listing`, `ListingResult` tables | agent name/phone columns dropped at import (D-024); deleted per import or all (D-026) |
| Backup files | `kpr-cadangan-*.json` in the owner's Downloads; automatic backups in `data/backups/` | not encrypted in v1, warning at each export (D-031); disk encryption (D-025) |
| Log | `data/app.log` | no finance fields; kept 30 days (D-064) |

Retention: kept until the owner deletes it (D-054). Laptop loss is covered by Linux full-disk encryption (LUKS); the owner does not yet know whether it is on — HANDOVER.md gives the `lsblk -f` check and the Profile page reminds until ticked (D-025).

## Secrets handling
- No API keys or accounts exist (D-014).
- Django `SECRET_KEY` is generated on first start into `data/secret_key` with file mode 600; never committed.
- `.gitignore` holds `data/`, `.venv/`, `*.sqlite3`, `kpr-cadangan-*.json`.

## Dependencies policy
- One runtime dependency: Django 6.1.3, pinned in `requirements.txt` (D-051, D-058) [cite: version · https://docs.djangoproject.com/en/stable/ref/settings/ · n.d. · acc 2026-11-27 · primary · live].
- Install only into `.venv` (PEP 668, D-058).
- Check for a Django 6.1.x security release before each milestone and monthly with the 30-day figure check; upgrade within the 6.1 line only after `manage.py test` passes.
- Any new dependency needs a new decision in DECISIONS.md.

## Compliance notes
- Personal household use by one person is outside UU PDP; no privacy policy or consent screen (D-023). This is reopened if the tool is shared or used commercially.
- The in-app "Data & privasi" page explains in plain Indonesian what is stored, where, and how to delete it (D-029).
- Regulated-domain screen: finance, health, legal services and minors are all absent (D-053). The tool estimates costs for the owner's own purchase; it does not lend, advise others or hold money.
- Listings are copied by hand; the tool never scrapes listing sites (D-003, R-12).

## Abuse and access
No public form, upload route or account exists (`public_form` false); rate limits and CAPTCHA are not applicable while the app stays on 127.0.0.1.

| Threat (STRIDE) | Control | Decision | Verification |
|---|---|---|---|
| Information disclosure through DNS rebinding | 127.0.0.1 bind + Host check | D-021 | `curl -H 'Host: evil.example'` → 400 (M0) |
| Another device on the Wi-Fi opens the app | 127.0.0.1 bind | D-021 | `ss -ltnp` shows only 127.0.0.1:8000 (M0) |
| A website submits a hidden form | CSRF + Origin check | D-028 | POST with foreign Origin → 403, data unchanged (M0) |
| CSV carries markup, `javascript:` links or formulas | auto-escape, http/https links only, `'` prefix on export | D-027 | M2 criteria 6 and `test_security.py` |
| Oversized CSV freezes the app | 5 MB / 2.000-row limit | D-027 | M2 criterion 3 |
| Data leaks to an online service | no network calls of the app's own | D-022 | M4: smoke test with networking off gives the same results |
| Laptop lost or stolen | LUKS full-disk encryption | D-025 | `lsblk -f` shows `crypto_LUKS` (HANDOVER.md) |
| Backup copied to cloud or chat | warning at export; residual risk accepted | D-031 | export shows the warning (M4) |
| Repudiation / elevation | not applicable: one user, no roles | D-005, D-007 | — |

Operator signals: none leave the laptop; the owner sees in-app banners only (D-030).
