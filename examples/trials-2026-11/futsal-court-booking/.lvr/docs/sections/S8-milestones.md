# S8 — Milestone plan

Booster: planning-and-task-breakdown (loaded at seq 132). The plan slices vertically: each milestone delivers one working path end to end. Dependencies: the schema and the one-winner rule come first; prices (F-04) feed the shown price, so M0 seeds fixed prices that M3 makes editable. Admin login (F-02) comes before cancel and price screens that need it. Order and grouping were drafted by the designer and confirmed by the owner (S8.q1, D-058).

Time and money basis: each milestone is sized for one focused builder-agent session. Running cost is Rp 0 on Cloudflare Workers Free and Supabase Free (D-046) [cite: price · https://developers.cloudflare.com/workers/platform/pricing/ · upd 2026-11-18 · acc 2026-11-27 · primary · live] [cite: price · https://supabase.com/pricing · n.d. · acc 2026-11-27 · primary · live]. The only purchase is the .biz.id domain, bought when M0 starts (D-060), Rp 9.900 for the first year (D-014) [cite: price · https://www.rumahweb.com/domain-murah/ · n.d. · acc 2026-11-26 · primary · live].

Owner tasks run alongside the build: start the NIB in OSS in the week of M0 (D-054); file the PSE registration once M1 is live with the privacy and terms pages (D-026, D-054); set the WhatsApp Business quick reply at launch (D-053).

## M0 — Walking skeleton: one real booking, one winner
- **Goal:** a player opens the real address, sees today's grid and books one open slot. The booking is stored in the real Supabase database (Singapore), and two simultaneous submits for the same slot produce exactly one booking.
- **Deliverables:** SvelteKit 3.4.1 project with `@sveltejs/adapter-cloudflare`, deployed to Cloudflare Workers Free on the .biz.id domain bought at the start of M0 (D-014, D-060, D-046); Supabase Free project in ap-southeast-1 (Singapore, D-049); first migration with tables `courts` (3 rows), `prices` (seeded regular and peak price), `bookings` (court, slot start, status, name, WhatsApp number, booking code, price, consent time, consent version, request key, created at) and the one-winner rule as a partial unique index or exclusion constraint on court + slot start for active bookings (U-08, D-027); row rules denying anonymous reads of personal fields (D-024); public schedule page for today; booking form (name, number) with a server action; confirmation page by random code; "Slot sudah diambil" on a refused insert; `/health` route; `scripts/race-test` that fires parallel submits.
- **Features:** none closed here. M0 is the skeleton of the F-01 happy path; F-01 is completed and closed in M1.
- **Acceptance criteria:**
  1. `curl -s https://<domain>/health` prints `ok`, and the response is served by the Worker (header `cf-ray` present).
  2. Booking an open slot on a phone shows a confirmation page with court, date, time, price and a booking code; after reload the public schedule shows that cell as "Terisi".
  3. `npm run race-test -- --slot <court>,<start> --parallel 20` reports `confirmed: 1, slot_taken: 19, errors: 0`, and `select count(*) from bookings where court_id=<court> and slot_start=<start> and status='active'` returns 1.
  4. An anonymous request with the public key to `bookings` returns no name or WhatsApp number (`select name from bookings` as `anon` returns 0 rows or a permission error).
  5. A submit whose form price was edited stores the database price.
  6. CPU time per booking request in `wrangler tail` (or the Workers metrics) stays under 10 ms at the 95th percentile over 20 bookings; if not, the result is written down and D-044 is raised with the owner before M1 (R-5).
- **Verification:** `curl -si https://<domain>/health` → `200` and body `ok`; `npm run race-test` with the output above; Supabase SQL editor queries above; a phone check on Chrome Android: book, read the code, reload the schedule; `wrangler tail --format pretty` while booking 20 times, read CPU time.
- **Rough cost/effort:** Rp 9.900 domain (first year) plus Rp 0 hosting; 1 builder session, plus about 30 minutes of the owner's time to create the Cloudflare, Supabase and registrar accounts on the venue email (D-022).

## M1 — F-01 complete: safe public booking
- **Goal:** the public booking flow is finished, protected and legally ready: 14-day schedule, every F-01 unhappy path, abuse controls, consent and privacy pages.
- **Deliverables:** F-01 in full per S4: date tabs today + 14 days (D-029), hour × court grid with fixed hour column and sideways scroll (D-041), venue rules text (D-030), consent tick box with the D-050 wording and the D-051 storage notice, consent time and version stored (D-056), privacy policy page and a terms page (D-017, needed for the PSE filing, D-054), Cloudflare Turnstile verified on the server (D-023), max 2 upcoming bookings per number and 5 submits per 10 minutes per device/connection (D-023), one-time request key on retry (D-027), "Jam ini sudah lewat" for past slots in WIB, full-day and closed states (D-031), Turnstile-error fallback "Pemesanan online sedang gangguan. Hubungi admin lewat WhatsApp" with the venue WhatsApp link (D-055), a Cloudflare rate-limiting rule on the schedule route (D-055), Share-to-WhatsApp button (D-008).
- **Features:** F-01.
- **Acceptance criteria:**
  1. A submit without a valid Turnstile token is refused with a message and stores no row (scripted POST without token → HTTP 400 or the form error, row count unchanged).
  2. A third upcoming booking from one WhatsApp number is refused with the limit message; the sixth submit in 10 minutes from one connection is refused.
  3. Two submits with the same request key create one booking and both show the same code.
  4. At 23:30 WIB a test with a fixed clock shows today's 23:00 slot as "Jam ini sudah lewat" and the date tabs start on the WIB date, not the UTC date (unit test with instants 16:59Z and 17:01Z mapping to two different WIB days).
  5. A new booking row has a consent time and the consent version `v1`; submitting without the tick box shows the inline message and stores nothing.
  6. `/kebijakan-privasi` and `/syarat` return 200 and contain the Singapore storage sentence and the 18+ rule.
  7. When the Turnstile check is forced to fail (test flag), the form shows the WhatsApp fallback text and link.
  8. Page check on Chrome Android at 360 px width and Safari iPhone: body text 16 px or larger and tap targets at least 44 × 44 px in the browser inspector; every status cell has a word, not only a colour (D-041).
- **Verification:** `npm test` (unit tests for WIB dates, limits, request key); `scripts/abuse-test` for criteria 1–2 with expected refusals; Supabase query on the newest row for consent fields; `curl -s https://<domain>/kebijakan-privasi | grep -c Singapura` ≥ 1; Chrome DevTools device mode 360 px and a real iPhone check for criterion 8.
- **Rough cost/effort:** Rp 0 (Turnstile Free) [cite: price · https://developers.cloudflare.com/turnstile/plans/ · upd 2026-08-14 · acc 2026-11-26 · primary · live]; 1 builder session.

## M2 — F-02 admin daily schedule
- **Goal:** the admin logs in and runs the day from one screen: manual bookings, attendance, cancel, block and close hours.
- **Deliverables:** F-02 per S4: Supabase Auth email and password login for the single admin (D-022), "forgot password" email (D-019) plus the documented dashboard recovery route (D-055), admin grid for a chosen date with names and numbers, manual booking (skips Turnstile and the 2-upcoming limit, same one-winner rule; D-032), "Datang"/"Tidak datang" marks with auto-block on the second no-show (D-030), cancel, block and unblock numbers, close hours with a reason shown publicly as "Venue tutup – <reason>" (D-031); laptop view shows all three courts without scrolling (D-041).
- **Features:** F-02.
- **Acceptance criteria:**
  1. Without login, `/admin` redirects to the login page and admin data requests return 401 or no rows.
  2. A manual booking on a slot that a player booked a second earlier shows "Slot sudah diambil (online)" and the table still holds one active booking for that slot.
  3. A second "Tidak datang" on one number blocks it; a new online booking from that number is refused; unblocking allows it again.
  4. Closing 18.00–20.00 on Lapangan 2 with reason "Perbaikan" shows "Venue tutup – Perbaikan" on those public cells and refuses bookings there.
  5. "Lupa kata sandi" sends a reset email that arrives at the venue email within 10 minutes; the recovery note in HANDOVER covers resetting from the Supabase dashboard if it does not (default email limit 2 per hour) [cite: quota · https://supabase.com/docs/guides/auth/auth-smtp · n.d. · acc 2026-11-27 · primary · live].
  6. At 1366 × 768 on the admin laptop, all three court columns of the day are visible without horizontal scrolling.
- **Verification:** scripted requests for criteria 1–4 (`npm run admin-test`) with the expected outputs above; mailbox check for criterion 5; browser window at 1366 × 768 for criterion 6.
- **Rough cost/effort:** Rp 0; 1 builder session.

## M3 — F-03 cancel and F-04 prices
- **Goal:** players cancel their own bookings, and the owner changes prices and holidays without a developer.
- **Deliverables:** F-03 per S4: find a booking by code plus last 4 digits, one "Booking tidak ditemukan" message for any mismatch, cancel up to 3 hours before play, slot back to "Tersedia" at once (D-033). F-04 per S4: "Pengaturan → Harga" with regular and peak prices including 10% PBJT (D-021, D-036), validation Rp 1–5.000.000 whole rupiah (D-039), holiday dates at the peak price, new prices for new bookings only, "Harga berubah menjadi Rp X. Lanjut pesan?" when the price changed under an open form.
- **Features:** F-03, F-04.
- **Acceptance criteria:**
  1. The right code with wrong last 4 digits and a wrong code both show the same "Booking tidak ditemukan" message.
  2. Cancelling 3 hours 1 minute before start succeeds and the public cell shows "Tersedia" after reload; cancelling 2 hours 59 minutes before is refused with the 3-hour note (fixed-clock test).
  3. Saving a new peak price changes the price shown on open peak cells after reload; an existing booking keeps its stored price (query before and after).
  4. Entering 0, a negative number, text or 5.000.001 shows the field message and saves nothing.
  5. A date added as a holiday shows the peak price for every hour of that date.
- **Verification:** `npm test` (cancel window and price rules with a fixed clock); scripted cancel and price requests with the expected outputs; SQL check of `bookings.price` before and after the price change.
- **Rough cost/effort:** Rp 0; 1 builder session.

## M4 — F-05 data download and operations, then launch check
- **Goal:** the owner can back up and restore the data, routine upkeep runs by itself, and the whole app is re-checked on the live address before public opening.
- **Deliverables:** F-05 per S4: reminder bar after 7 days, "Unduh semua data (CSV)" with bookings, prices, closures, holidays and the block list, last-download date (D-052). One daily Cloudflare Cron Trigger that erases names and numbers 90 days after play and keeps the database active (D-025, D-048) [cite: quota · https://developers.cloudflare.com/workers/platform/limits/ · upd 2026-11-25 · acc 2026-11-27 · primary · live], writing its result to a `job_runs` row. An admin warning bar when the last cleanup run failed or is older than 2 days (owner alert inside the app, no paid service). Error log: server errors written to the Workers log without names or numbers. Restore drill into a second, disposable Supabase Free project (Free allows 2 active projects) [cite: quota · https://supabase.com/pricing · n.d. · acc 2026-11-27 · primary · live]. Data-request log template and handover notes (D-056). Final re-run of the M0 checks on the live address.
- **Features:** F-05.
- **Acceptance criteria:**
  1. With the last download set 8 days ago, the admin page shows "Sudah 8 hari sejak data terakhir diunduh"; after "Unduh semua data (CSV)" the file `booking-<YYYY-MM-DD>.csv` downloads and the bar disappears.
  2. The CSV row count for bookings equals `select count(*) from bookings`.
  3. Restoring the CSV into the disposable project gives the same row counts per table and a booking found by code shows the same court, date, time and price; the restore time is written in HANDOVER (target: under 30 minutes).
  4. Running the cleanup job by hand on test data erases name and number from a booking whose play date is 91 days ago and leaves one 89 days ago untouched; a `job_runs` row says `ok`.
  5. Forcing the cleanup job to fail makes the admin warning bar appear on the next admin page load.
  6. A forced server error appears in `wrangler tail` with a request id and no name or WhatsApp number.
  7. All M0 criteria pass again on the live address (`npm run race-test`, `/health`).
- **Verification:** admin page checks with a set clock for criterion 1; `wc -l` on the CSV against the SQL count; restore script and timed run for criterion 3; `wrangler dev --test-scheduled` and `curl "http://localhost:8787/__scheduled"` for criteria 4–5; `wrangler tail` for criterion 6; rerun of the M0 verification.
- **Rough cost/effort:** Rp 0; 1 builder session, plus about 30 minutes of the owner's time for the first restore drill.

## Quality and operations targets

| Area | Target | Owner | Milestone | Proof | Decision |
|---|---|---|---|---|---|
| Time zones | Stored in UTC, shown and judged in WIB (Asia/Jakarta); the booking day is the WIB day | builder | M1 | M1 criterion 4 | D-027 |
| Browsers and devices | Chrome Android incl. a 360 px screen, Safari iPhone; admin on Android phone and Windows laptop | builder | M1, M2 | M1 criterion 8, M2 criterion 6 | D-010 |
| Accessibility | Text ≥ 16 px, tap targets ≥ 44 × 44 px, status as words, high contrast | builder | M1 | M1 criterion 8 | D-041 |
| Error tracking | Server errors in the Workers log with a request id, no names or numbers; read with `wrangler tail` | builder | M4 | M4 criterion 6 | D-056 |
| Availability | `/health` returns `ok`; checked at every milestone and before opening; no uptime promise on free plans | builder | M0, M4 | M0 criterion 1, M4 criterion 7 | D-046 |
| Owner alerts | Admin warning bar when the daily job fails; Supabase pause emails go to the venue email; response: open the admin page or the Supabase dashboard the same day | owner | M4 | M4 criterion 5 | D-048, D-022 |
| Restore | Weekly CSV download; restore into a disposable project within 30 minutes; files older than 90 days deleted | owner | M4 | M4 criterion 3 | D-013, D-052 |
| Abuse and load | Turnstile, number and connection limits, rate-limiting rule on the schedule route, fallback texts | builder | M1 | M1 criteria 1, 2, 7 | D-023, D-055 |

<!-- lvr:english-summary -->

## Answers

Answered by the delegated test agent on the owner's behalf (`answered_by: delegated_test_agent`); asked in Indonesian.

- **S8.q1 Approve M0 to M4 as drafted?** — Yes, as is. → D-058
- **S8.q2 Approve D-056 (PP 33/2026 duties)?** — Yes. → D-059
- **S8.q3 When to buy the domain?** — When M0 starts. → D-060

## Decisions this Section

- **D-058** Milestone order and grouping: M0 walking skeleton with the one-winner test, M1 F-01, M2 F-02, M3 F-03 + F-04, M4 F-05 + operations and the launch re-check — S8.q1 · status: user_confirmed (delegated)
- **D-059** Owner approves D-056 as written: PP 33/2026 duties carried into M1 consent v1, M4 erasure job and SECURITY.md — S8.q2 · status: user_confirmed (delegated)
- **D-060** Domain timing: the .biz.id domain is bought when M0 starts (refines D-014), auto-renew on, venue email — S8.q3 · status: user_confirmed (delegated)

## Exit criteria

- [x] M0 exists and satisfies the walking-skeleton definition. — evidence: M0 (deployed on the real address, real Supabase, one booking task, race-test command)
- [x] Milestones cover 100% of in-MVP features — each F-NN in exactly one — plus deploy to the S2 target. — evidence: F-01 M1, F-02 M2, F-03 and F-04 M3, F-05 M4; deploy in M0, re-checked in M4
- [x] Every milestone has goal, deliverables, acceptance criteria, verification procedure, rough cost/effort. — evidence: M0–M4
- [x] Every acceptance criterion is machine-checkable (command or scripted step — never "looks good"). — evidence: M0–M4 criteria
- [x] Every milestone is sized for one focused builder session. — evidence: M0–M4 effort lines
- [x] The owner reviewed the plan. — evidence: S8.q1–q3, D-058 to D-060

## Context research

No new research: S8 reuses RQ-013, RQ-016 and RQ-017; `LVR cite check --all` clean on 2026-11-27.
