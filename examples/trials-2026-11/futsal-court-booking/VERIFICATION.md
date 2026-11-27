# Verification

Run every step on the deploy target (`https://<domain>`) unless the step says local. Record the real output under a `## Build log — <ts>` section. One numbered step per acceptance criterion in MILESTONES.md.

## M0 — Walking skeleton: one real booking, one winner

1. Run `curl -si https://<domain>/health`. Expect `HTTP/2 200`, a `cf-ray:` header, and body `ok`.
2. On Chrome Android, open `https://<domain>/`, tap a "Tersedia" cell, fill name and number, submit. Expect a confirmation page showing court, date, time, price and an 8-character code. Reload `/`; expect that cell to read "Terisi".
3. Run `npm run race-test -- --slot 1,<ISO start> --parallel 20`. Expect the output `confirmed: 1, slot_taken: 19, errors: 0`. Then in the Supabase SQL editor run `select count(*) from bookings where court_id=1 and slot_start='<ISO start>' and status='active';` and expect `1`.
4. Run `curl -s "$PUBLIC_SUPABASE_URL/rest/v1/bookings?select=name,phone" -H "apikey: $PUBLIC_SUPABASE_ANON_KEY"`. Expect `[]` or a permission error, never a name or number.
5. Post the booking form with `curl` and an edited `shown_price=1`. Then run `select price from bookings order by id desc limit 1;` and expect the database price from `prices`, not `1`.
6. Run `npx wrangler tail --format pretty` while making 20 bookings. Read the CPU time per request; expect the 95th percentile under 10 ms. If it is over, record the numbers and ask the owner about D-044 before M1.

## M1 — F-01 complete: safe public booking

1. Run `npm run abuse-test -- --case no-token`. Expect HTTP 400 with code `captcha_failed`, and an unchanged `select count(*) from bookings`.
2. Run `npm run abuse-test -- --case limits`. Expect the third upcoming booking for one number refused with `booking_limit`, and the sixth submit in 10 minutes refused with `rate_limited` (429).
3. Run `npm run abuse-test -- --case same-key`. Expect two submits with one `request_key` to return the same code and leave one row.
4. Run `npm test -- time`. Expect passes for: 16:59Z and 17:01Z map to two different WIB dates; at 23:30 WIB the 23:00 slot is "Jam ini sudah lewat"; date tabs start on the WIB date.
5. Book once, then run `select consent_at, consent_version from bookings order by id desc limit 1;`. Expect a timestamp and `v1`. Submit without the tick box; expect the inline message and no new row.
6. Run `curl -s https://<domain>/kebijakan-privasi | grep -c Singapura` and expect ≥ 1. Run `curl -s https://<domain>/syarat | grep -c "18 tahun"` and expect ≥ 1. Both pages return 200.
7. Deploy a preview with `TURNSTILE_FORCE_FAIL=1`, open the form, submit. Expect the text "Pemesanan online sedang gangguan. Hubungi admin lewat WhatsApp" and a `wa.me` link.
8. In Chrome DevTools at 360 px width and on a real iPhone in Safari, inspect the schedule and form. Expect body text ≥ 16 px, every button and cell ≥ 44 × 44 px, and a word in every status cell. Run the contrast commands in UI_SPEC.md; expect exit code 0 for each text pair.

## M2 — F-02 admin daily schedule

1. Run `npm run admin-test -- --case no-login`. Expect `/admin` to answer 303 to `/admin/login`, and admin actions to return 401.
2. Run `npm run admin-test -- --case race-manual`. Expect the manual save to fail with `slot_taken_online` and one active row for that slot.
3. Run `npm run admin-test -- --case no-show`. Expect the number in `blocked_numbers` after the second "Tidak datang", the next online booking refused with `number_blocked`, and accepted again after `?/buka`.
4. Close 18.00–20.00 on Lapangan 2 with reason "Perbaikan". Open `/` for that date; expect "Venue tutup – Perbaikan" on those cells, and a booking attempt there refused with `slot_closed`.
5. Tap "Lupa kata sandi" on `/admin/login`. Expect the reset email in the venue inbox within 10 minutes. If it does not arrive, follow HANDOVER.md → Alerts and recovery and record that.
6. Open `/admin` in a 1366 × 768 browser window on the laptop. Expect all three court columns visible with no horizontal scrollbar.

## M3 — F-03 cancel and F-04 prices

1. On `/cek`, enter the right code with wrong last 4 digits, then a wrong code. Expect the same "Booking tidak ditemukan" message both times. Then open `/booking/<code>`, tap "Batalkan booking" with wrong last 4 digits; expect "Booking tidak ditemukan" and the status still active.
2. Run `npm test -- cancel`. Expect a cancel at 3 h 1 min before start to succeed and at 2 h 59 min to fail with `cancel_window_passed`. On the live site, cancel a booking more than 3 hours ahead; reload `/` and expect "Tersedia".
3. Run `select price from bookings where id=<existing>;`, save a new peak price, reload `/` and expect open peak cells to show it, then rerun the query and expect the old price unchanged.
4. Enter 0, -1, `abc` and 5000001 in the price field. Expect a field message each time and `select amount, updated_at from prices;` unchanged.
5. Add a holiday date. Open `/` on that date; expect every hour to show the peak price.

## M4 — F-05 data download and operations, then launch check

1. Run `update export_runs set created_at = now() - interval '8 days';` on a test project, open `/admin`. Expect "Sudah 8 hari sejak data terakhir diunduh". Click "Unduh semua data (CSV)"; expect `booking-<YYYY-MM-DD>.csv` and the bar gone after reload.
2. Run `grep -c '^booking,' booking-<date>.csv` and `select count(*) from bookings;`. Expect equal numbers.
3. Run `time npm run restore -- --file booking-<date>.csv --project <disposable ref>`. Expect equal row counts per table and the same court, date, time and price for one code. Expect under 30 minutes; write the time in HANDOVER.md.
4. Locally run `npx wrangler dev --test-scheduled`, then `curl "http://localhost:8787/__scheduled"`. Expect the 91-day-old test booking with null name and phone, the 89-day-old one unchanged, and a `job_runs` row with `ok`.
5. Set `CLEANUP_FORCE_FAIL=1`, trigger the job again, open `/admin`. Expect the job warning bar.
6. Call `/api/test/error` on a preview build while `npx wrangler tail` runs. Expect a log line with a request id and no name or WhatsApp number.
7. Repeat M0 steps 1 and 3 on the live address. Expect the same results. Also run `curl -s -o /dev/null -w "%{http_code}" https://<domain>/api/test/error`; expect `404`.

## Global smoke test

On the live address with a phone and the admin laptop:

1. Open `https://<domain>/` on the phone; expect today's schedule with date tabs.
2. Book a "Tersedia" slot more than 3 hours ahead; expect the confirmation page with a code.
3. Tap "Bagikan ke WhatsApp"; expect WhatsApp to open with the booking text.
4. On `/cek`, enter the code and last 4 digits; expect the same booking page.
5. On the laptop, open `/admin`; expect the booking with the tag "Online".
6. Add a manual booking on another hour; expect the tag "Manual" and "Terisi" on the public schedule.
7. On the phone, cancel the first booking with the last 4 digits; expect "Dibatalkan" and the cell back to "Tersedia".
8. On the laptop, click "Unduh semua data (CSV)"; expect `booking-<YYYY-MM-DD>.csv` to download.
9. Run `curl -s https://<domain>/health`; expect `ok`.

## Definition of verified

A milestone is verified when every step above for it ran on the deploy target (local only where the step says so) and produced the expected result, with the output recorded in a build log. A failed step stops the milestone; the plan is never changed to make a step pass.
