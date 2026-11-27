# API

## Conventions

- **Base URL:** `https://<domain>` — the .biz.id domain bought at the start of M0 (D-014, D-060). Local: `http://localhost:5173` (`npm run dev`) or `http://localhost:8787` (`wrangler dev`).
- **Shape:** server-rendered SvelteKit pages with form actions (`+page.server.ts`). Pages work without JavaScript; with JavaScript, `use:enhance` posts the same action and gets JSON. There is no separate public REST API (D-046).
- **Public auth:** none for players (D-007). Booking and lookup actions require a valid Turnstile token checked on the server and pass the attempt limits (D-023, D-033, D-061).
- **Admin auth:** Supabase Auth email and password session in an HTTP-only cookie through `@supabase/ssr`; every `/admin` load and action checks the session server-side; sessions end after 30 days without use (D-022, D-032).
- **Database access:** public actions call Postgres functions (`public_schedule`, `book_slot`, `find_booking`, `cancel_booking`) with the anon key; they return no personal fields beyond what the caller proved (code, or code + last 4 digits). Admin actions use the admin's session under row-level security. Only the cleanup job uses the service-role key (SECURITY.md).
- **Versioning:** none; one deployed version. Database changes go through numbered migrations (SPEC/data-model.md).
- **Time:** request and response times are ISO 8601 in UTC; dates in paths and queries are WIB dates `YYYY-MM-DD` (D-027).
- **Error envelope:** see Error format; one envelope for every action and endpoint.

## Endpoints

| Method | Path | Purpose | Auth |
|---|---|---|---|
| GET | `/` | Schedule for a WIB date (`?tanggal=YYYY-MM-DD`, default today), date tabs today + 14 (F-01) | none |
| GET | `/pesan?lapangan=<1-3>&mulai=<ISO UTC>` | Booking form with summary, rules, consent, fresh `request_key` (F-01) | none |
| POST | `/pesan` (action `default`) | Create a booking through `book_slot` (F-01) | Turnstile + limits |
| GET | `/booking/<code>` | Confirmation and booking page, number masked (F-01, F-03) | the code |
| POST | `/booking/<code>?/batal` | Player cancel, 3-hour rule, needs the last 4 digits of the number (F-03, RV-L07-1e2cad4c) | the code + last 4 digits, 5 tries per 10 minutes |
| GET | `/cek` | "Cek booking saya" form (F-03) | none |
| POST | `/cek` (action `default`) | Find by code + last 4 digits, redirect to `/booking/<code>` (F-03) | Turnstile + limits |
| GET | `/kebijakan-privasi` | Privacy policy (D-017, D-051, D-056) | none |
| GET | `/syarat` | Terms and venue rules, 18+ rule (D-030, D-050) | none |
| GET | `/health` | `ok` when the Worker runs and the database answers | none |
| GET, POST | `/admin/login` | Login form and action (F-02) | none |
| GET, POST | `/admin/lupa-sandi` | Send a reset email (D-019) | none |
| POST | `/admin/logout` | End the session | admin |
| GET | `/admin?tanggal=YYYY-MM-DD` | Admin grid, names and tags, reminder and job warning bars (F-02, F-05) | admin |
| POST | `/admin/booking?/tambah` | Manual booking (F-02) | admin |
| GET | `/admin/booking/<id>` | Booking detail with full number (F-02) | admin |
| POST | `/admin/booking/<id>?/datang`, `?/tidakDatang`, `?/batal`, `?/blokir` | Attendance, cancel, block (F-02); a block lasts 180 days unless renewed (D-064) | admin |
| GET, POST | `/admin/tutup` | Close hours with a reason (F-02) | admin |
| GET, POST | `/admin/blokir` | Block list; `?/buka` unblocks (F-02) | admin |
| GET, POST | `/admin/pengaturan/harga` | Prices and holidays: `?/simpanHarga`, `?/tambahLibur`, `?/hapusLibur` (F-04) | admin |
| GET | `/admin/pengaturan/unduh` | Last download date and button (F-05) | admin |
| GET | `/admin/pengaturan/unduh/csv` | Stream `booking-<YYYY-MM-DD>.csv`, write an `export_runs` row (F-05) | admin |
| POST | `/api/jobs/cleanup` | Daily job: 90-day erasure, attempts cleanup, keep-alive, `job_runs` row (D-025, D-048) | `Authorization: Bearer <CRON_SECRET>` |

## Critical endpoints

**POST `/pesan`** — create a booking. Request (`application/x-www-form-urlencoded`; header `x-sveltekit-action: true` for JSON):

```text
court_id=2&slot_start=2026-12-04T12:00:00Z&name=Tim+Garuda&phone=081234567890
&consent=on&request_key=8f14e45f-ceea-4e7a-9b6f-5d1c2a7b9e01
&cf-turnstile-response=<token>&shown_price=250000
```

`200` response:

```json
{ "type": "redirect", "status": 303, "location": "/booking/K7M4Q2XP" }
```

Refusal (race lost):

```json
{ "type": "failure", "status": 409,
  "data": { "error": { "code": "slot_taken", "message": "Slot sudah diambil. Pilih jam lain, ya.",
            "fields": {}, "values": { "name": "Tim Garuda", "phone": "081234567890" } } } }
```

Price changed while the form was open (`shown_price` ≠ current): `409` with code `price_changed`, `data.error.price = 275000`; the form asks "Harga berubah menjadi Rp 275.000. Lanjut pesan?" and resubmits with `price_confirmed=275000` and the same `request_key`. The amount is an example.

**POST `/cek`** — lookup. Request: `code=K7M4Q2XP&last4=7890&cf-turnstile-response=<token>`. `200`: `{ "type": "redirect", "status": 303, "location": "/booking/K7M4Q2XP" }`. Any mismatch: `404` with code `not_found`, message "Booking tidak ditemukan".

**POST `/booking/<code>?/batal`** — player cancel. Request: `last4=7890`. A wrong `last4` returns `404` `not_found` and counts as a lookup attempt. `200`:

```json
{ "type": "success", "status": 200, "data": { "status": "cancelled", "court": "Lapangan 2", "slot_start": "2026-12-04T12:00:00Z" } }
```

**POST `/admin/booking?/tambah`** — manual booking. Request: `court_id=1&slot_start=2026-12-04T13:00:00Z&name=Pak+Budi&phone=&note=Walk-in&request_key=<uuid>`. `200`: `{ "type": "success", "status": 200, "data": { "id": 1843, "code": "R4T8W2KC", "source": "manual" } }`. Race lost: `409` `slot_taken_online`, message "Slot sudah diambil (online)".

**GET `/health`** — `200`, body `ok`, `content-type: text/plain`. Database unreachable: `503`, body `db`.

**POST `/api/jobs/cleanup`** — `200`:

```json
{ "status": "ok", "erased": 12, "attempts_deleted": 340, "ran_at": "2026-12-05T20:00:00Z" }
```

## Status codes

| Code | When |
|---|---|
| 200 | Page or action succeeded |
| 303 | Redirect after a successful booking, lookup, login or logout |
| 400 | Invalid input (`invalid_input`), missing consent (`consent_required`), missing or invalid Turnstile token (`captcha_failed`) |
| 401 | Admin action or export without a valid session; cleanup without the bearer secret |
| 403 | Number blocked (`number_blocked`) |
| 404 | Booking not found by code, or code + last 4 digits mismatch (`not_found`) |
| 409 | Slot taken (`slot_taken`, `slot_taken_online`), already cancelled (`already_cancelled`), price changed (`price_changed`), hours hold bookings (`closure_has_bookings`) |
| 410 | Slot start passed (`slot_past`), cancel window passed (`cancel_window_passed`), attendance window passed (`attendance_window_passed`) |
| 422 | Limit of 2 upcoming bookings reached (`booking_limit`); closed hours (`slot_closed`) |
| 429 | More than 5 submits or lookups in 10 minutes (`rate_limited`), or the Cloudflare rate-limiting rule (D-055) |
| 500 | Unexpected server error (`server_error`), logged with a request id |
| 503 | Turnstile verification unreachable (`captcha_unavailable` → WhatsApp fallback text) or database unreachable |

## Error format

Every failure returns this envelope. Form actions wrap it in SvelteKit's `fail(status, { error })`; JSON endpoints return it as the body.

```json
{
  "error": {
    "code": "slot_taken",
    "message": "Slot sudah diambil. Pilih jam lain, ya.",
    "fields": { "phone": "Nomor WhatsApp harus diawali 08 atau +62, 10–13 angka." },
    "values": { "name": "Tim Garuda", "phone": "0812" },
    "request_id": "b2f1c0de"
  }
}
```

- `code`: stable machine key from the status code table.
- `message`: Indonesian text from `UI_SPEC.md` (what happened + what to do).
- `fields`: per-field messages, shown under each field; empty when not a field error.
- `values`: the typed values sent back so the form keeps them (D-027). Never contains another person's data.
- `request_id`: the `cf-ray` value, also written to the error log (SECURITY.md).
