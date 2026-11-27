# API

The app has no public API. These are the HTTP routes of the Django app served on 127.0.0.1:8000 to the owner's own browser (D-002, D-021). Pages are server-rendered HTML forms; there is no JSON API for other programs.

## Conventions
- **Base URL:** `http://127.0.0.1:8000/` (also `http://localhost:8000/`). Any other Host header → 400 (D-021).
- **Auth:** none; the single owner on the laptop (D-007). Protection comes from the 127.0.0.1 bind, the Host check and the Origin check (D-021, D-028).
- **Data-changing requests:** POST only, with Django's CSRF token and a matching Origin header; otherwise 403 (D-028).
- **Versioning:** none; the backup file carries `schema_version` (data-model.md).
- **Errors:** shown next to the field or action in Indonesian, as an HTML page with the same layout (Error format below).
- **Language:** Indonesian screen text (D-009).

## Endpoints
| Method | Path | Purpose | Auth |
|---|---|---|---|
| GET | `/` | Redirect to `/impor/` (first run shows the three-step guide, D-047) | none, local only |
| GET | `/impor/` | Import CSV page | none, local only |
| POST | `/impor/pratinjau/` | Upload CSV, show the preview (F-01) | CSRF + Origin |
| POST | `/impor/simpan/` | Confirm the import (F-01) | CSRF + Origin |
| GET | `/daftar/` | Shortlist page with passing, incomplete and rejected groups (F-01, F-02) | none, local only |
| GET | `/daftar/unduh.csv` | Download the shortlist CSV (D-008) | none, local only |
| GET | `/profil/` | Profile & Criteria page with Default Figures (F-02, F-03) | none, local only |
| POST | `/profil/simpan/` | Save profile, banks and criteria (F-02) | CSRF + Origin |
| POST | `/profil/angka-bawaan/` | Save or mark-checked default figures (F-03) | CSRF + Origin |
| GET | `/data/` | Data & privasi page (D-029) | none, local only |
| POST | `/data/ekspor/` | Download `kpr-cadangan-YYYY-MM-DD.json` (F-04) | CSRF + Origin |
| POST | `/data/hapus/` | Delete all / per import / profile only; needs HAPUS (F-04) | CSRF + Origin |
| POST | `/data/pulihkan/` | Restore from a backup; needs PULIHKAN (F-05) | CSRF + Origin |

## Critical endpoints

### POST `/impor/pratinjau/`
Request (multipart form):
```text
csrfmiddlewaretoken=<token>
file=@listing-november.csv      (≤ 5 MB, ≤ 2.000 rows)
```
`200` response: the preview page, showing for example:
```text
Baris terbaca: 48 · Ditolak: 2 · Kolom agen dibuang: nama_agen, telepon_agen
Baris 7: harga "satu M" tidak terbaca
Baris 19: kolom luas_tanah kosong
[Impor]
```

### POST `/data/hapus/`
Request (form): `scope=all|batch|profile`, `batch_id=<id>` when scope=batch, `confirm=HAPUS`.
`200` response: the Data & privasi page with "Data dihapus".

### POST `/data/pulihkan/`
Request (multipart form): `file=@kpr-cadangan-2026-11-27.json`, `confirm=PULIHKAN`.
`200` response: the Data & privasi page with "Data dipulihkan. Cadangan otomatis tersimpan: kpr-cadangan-otomatis-2026-11-27T1530.json".

## Status codes
- 200 — page shown, or action done (the page shows the result message).
- 302 — redirect after a successful POST (POST-redirect-GET), and `/` → `/impor/`.
- 400 — Host header not localhost/127.0.0.1 (D-021), or a malformed form.
- 403 — CSRF token or Origin missing or wrong (D-028).
- 404 — unknown path or unknown batch id.
- 413 — upload over 5 MB (D-027).
- 500 — unexpected error; the page says "Terjadi kesalahan. Data Anda tidak berubah." and the log line has no finance fields (D-064).

## Error format
Every failure re-renders the same page with:
- a message box at the top: what happened and the next step, in Indonesian (ux-copy rules in UI_SPEC.md);
- per-field messages next to each invalid field, the first invalid field focused;
- the owner's valid input kept in the form.
Example: "Berkas lebih dari 5 MB. Pecah berkas menjadi beberapa bagian lalu impor lagi."
