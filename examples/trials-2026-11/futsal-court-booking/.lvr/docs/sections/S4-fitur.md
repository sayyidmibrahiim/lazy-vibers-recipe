# S4 — Features

<!-- lvr:english-summary -->

## Coverage plan

S4 is a capture loop: features are captured one by one (F-01…) until the owner says enough. Web profile questions to cover along the way: web-device (phone or computer first), web-empty (first visitor with no records), web-retry (connection drops during a submit). Interface interview (has_ui): feel, voice, accessibility.

Already known from earlier Sections (not re-asked):
- Players book without an account; only admin pages need login (D-007).
- Entry link opens today's schedule (D-006); confirmation page with code and Share to WhatsApp; "Slot sudah diambil" back to the schedule (D-008).
- Support matrix: Chrome Android incl. small old phones, Safari iPhone; admin on Android phone and Windows laptop (D-010) — phone first.
- No payment in the app; pay at the venue (D-016).
- Abuse, visibility and retention controls (D-023, D-024, D-025).

## Answers

Answered by the delegated test agent on the owner's behalf (`answered_by: delegated_test_agent`); asked in Indonesian.

- **S4.q1** The one thing on day one: players see open slots and book one with instant confirmation; two players at once on the same slot → exactly one wins, the other sees "Slot sudah diambil". → F-01 seed. The agent asked for the drafted walk-through and the next-feature question in one reply.
- **S4.q2** F-01 script and D-027 approved; priority must. → D-028
- **S4.q3** Booking window: today plus 14 days, until the slot starts. → D-029
- **S4.q4** Rules text: cancel at least 3 hours before; two no-shows without notice block the number from online booking. → D-030
- **S4.q5** Next features: F-02 admin daily schedule incl. manual bookings; F-03 player self-cancel. Scripts drafted for confirmation.
- **S4.q6** Empty and closed states agreed (web-empty). → D-031
- **S4.q7** F-02 and D-032 approved; must. → D-034
- **S4.q8** F-03 and D-033 approved; must. → D-035
- **S4.q9** Two prices (regular, peak) as F-04, must; changes only for new bookings. → D-036
- **S4.q10** Voice: "kamu" for players, plain for admin. → D-037
- **S4.q11** Enough after F-04; other ideas parked. → D-038 (the "enough" control)
- **S4.q12** F-04 and D-039 approved as drafted (final complete-or-drop batch). → D-040
- **S4.q13** Accessibility and layout as recommended. → D-041
- **S4.q14** Avoid ads, banners, pop-ups and ungrouped slot lists. → D-042
- **S4.q15** (loop-back L-02 from S6) Add F-05 Weekly data download, must, with its unhappy paths. → D-052

## Features

### F-01 — Book an open slot
- **English name:** Book an open slot
- **Who uses it:** player (team captain or whoever books for the team)
- **Happy path (click-by-click script):** confirmed S4.q2
  1. Open the short link from the venue's WhatsApp Business profile, Instagram bio or Google Maps (D-006). The schedule page opens on today's date.
  2. See a row of date tabs (today plus the next 14 days, D-029) and a grid: one row per hour 08.00–23.00, one column per court (Lapangan 1, 2, 3). Each cell shows "Tersedia · Rp <price incl. tax>" or "Terisi" (D-021, D-024).
  3. Tap a date tab to change day, then tap a "Tersedia" cell.
  4. The booking form opens with a summary (court, date, start–end time, price incl. 10% PBJT, "bayar di venue"), the venue rules text (D-030), two fields — "Nama pemesan / nama tim" and "Nomor WhatsApp" — and a consent tick box linked to the privacy policy (D-017) reading "Saya berusia 18 tahun ke atas, atau saya orang tua/wali yang memesan untuk anak saya." (D-050); the notice says booking data is stored with the provider in Singapore (D-051). Turnstile runs in the background (D-023).
  5. Tap "Pesan slot ini".
  6. Done: the confirmation page shows court, date, time, price, booking code, "Bayar di venue saat datang", and a "Bagikan ke WhatsApp" button (D-008). The schedule now shows that cell as "Terisi" for everyone.
- **Priority:** must (S4.q2, D-028)
- **Unhappy paths** (deliver-edge-cases; routine defaults D-027, approved S4.q2)
  - Abandon/interruption — player closes the form before tapping "Pesan slot ini": nothing is saved, the slot stays "Tersedia" (no hold). Check: after closing, the cell is still "Tersedia" for another device.
  - Invalid input — empty name, or a WhatsApp number not in Indonesian mobile format (08… or +62…, 10–13 digits), or consent not ticked: inline message under the field, typed values kept, button stays usable. Also D-023 refusals (3rd upcoming booking, 6th submit in 10 minutes, failed Turnstile) with their own plain message. Check: each invalid case shows its message and saves nothing.
  - Concurrency/retry — two players submit the same slot at once: the database refuses the second row (U-08); the loser sees "Slot sudah diambil" and returns to a refreshed schedule with typed name and number kept. Double tap or retry after a dropped connection reuses the form's one-time request key and returns the same booking (D-027). Check: two parallel submits → exactly one booking row, one "Slot sudah diambil"; a repeated submit with the same key → one row.
  - Expiry/hold — no hold while the form is open; time is Asia/Jakarta (WIB) from the server; a slot whose start time has passed cannot be booked ("Jam ini sudah lewat"); booking opens for today plus 14 days (D-029); dates beyond that have no tab. A fully booked date shows "Semua lapangan penuh di tanggal ini" with "Lihat besok"; closed hours show "Venue tutup – <reason>" (D-031). Check: a submit at 19.01 for the 19.00 slot is refused.

### F-02 — Admin daily schedule
- **English name:** Admin daily schedule
- **Who uses it:** admin (venue owner), phone first, laptop also
- **Happy path (click-by-click script):** confirmed S4.q7
  1. Open the admin address (the site link plus /admin). The login page shows "Email" and "Kata sandi".
  2. Enter the venue email and password, tap "Masuk". The admin schedule opens on today's date with the same date tabs and the hour × court grid as F-01.
  3. Each booked cell shows the booker's name and a tag "Online" or "Manual". Empty cells show "Kosong"; closed cells show "Tutup".
  4. Manual booking: tap an empty cell → form "Tambah booking manual" with "Nama pemesan / nama tim", "Nomor WhatsApp (boleh kosong)" and "Catatan" → tap "Simpan" → the cell turns booked with the tag "Manual" and the public schedule shows "Terisi".
  5. Booking detail: tap a booked cell → see name, full WhatsApp number with a "Chat WhatsApp" button, booking code, status, and four buttons: "Datang", "Tidak datang", "Batalkan booking", "Blokir nomor".
  6. Close hours: tap "Tutup jadwal" → choose date, court (one or all), start and end hour, type the reason → tap "Simpan" → those cells show "Tutup" for the admin and "Venue tutup – <reason>" for players.
  7. Done: the day's schedule is the single source of truth for online and WhatsApp/walk-in bookings, and no slot can be held twice.
- **Priority:** must (S4.q7, D-034)
- **Unhappy paths** (deliver-edge-cases; routine defaults D-032, approved S4.q7)
  - Abandon/interruption — closing the manual-booking or close-hours form saves nothing; an expired login (30 days without use) returns to the login page. Check: after closing the form the cell is unchanged.
  - Invalid input — empty name, a number in the wrong format, end hour before start hour, or closing hours that already hold bookings: a message names the problem; for held hours the message lists those bookings and asks the admin to cancel them first. Check: each case saves nothing.
  - Concurrency/retry — a player books online the same slot the admin is filling manually: the database rule accepts one; the admin sees "Slot sudah diambil (online)". Two devices cancelling the same booking: the second sees "Booking ini sudah dibatalkan". Double tap on "Simpan" stores one booking (one-time request key, D-027). Check: parallel manual and online submits → one row.
  - Expiry/hold — "Datang"/"Tidak datang" are available from the slot start until the end of the next day (WIB); the second "Tidak datang" on one number blocks it automatically and the admin can unblock (D-030, D-032). Check: a second no-show mark puts the number on the block list; a third upcoming booking attempt from it is refused online.

### F-03 — Cancel my booking
- **English name:** Cancel my booking
- **Who uses it:** player
- **Happy path (click-by-click script):** confirmed S4.q8
  1. Open the confirmation page from the saved link or the WhatsApp share message, or tap "Cek booking saya" on the schedule and type the booking code plus the last 4 digits of the WhatsApp number, then tap "Cari".
  2. See the booking (court, date, time, price, masked number per D-024) and a "Batalkan booking" button with the note "Bisa dibatalkan sampai 3 jam sebelum main".
  3. Tap "Batalkan booking". A dialog asks "Batalkan booking Lapangan <n>, <hari> <jam>? Slot akan dibuka untuk orang lain." with buttons "Ya, batalkan" and "Tetap main".
  4. Tap "Ya, batalkan".
  5. Done: the page shows status "Dibatalkan"; the slot returns to "Tersedia" on the public schedule at once, and the number has one fewer upcoming booking (D-023).
- **Priority:** must (S4.q8, D-035)
- **Unhappy paths** (deliver-edge-cases; routine defaults D-033, approved S4.q8)
  - Abandon/interruption — tapping "Tetap main" or closing the page: nothing changes. Check: booking status stays active.
  - Invalid input — wrong code or wrong last 4 digits: one message "Booking tidak ditemukan" for both, at most 5 lookups per 10 minutes per device/connection. Check: the 6th lookup in 10 minutes is refused.
  - Concurrency/retry — cancelling twice, or the player and admin cancelling at once: the second sees "Booking ini sudah dibatalkan". Check: one cancellation recorded.
  - Expiry/hold — less than 3 hours before play (server time, WIB) the button is replaced by "Batas pembatalan online sudah lewat. Hubungi venue lewat WhatsApp" with a WhatsApp link. Check: a cancel request at 16.01 for the 19.00 slot is refused.

### F-04 — Set prices
- **English name:** Set prices
- **Who uses it:** admin
- **Happy path (click-by-click script):** confirmed S4.q12
  1. Log in (F-02 steps 1–2). On the admin schedule tap "Pengaturan", then "Harga".
  2. See two fields in rupiah per hour, both final prices including 10% PBJT (D-021): "Harga biasa (Senin–Jumat 08.00–16.00)" and "Harga jam ramai (Senin–Jumat 16.00–24.00, Sabtu, Minggu, hari libur)". Below them, the list "Hari libur" with a button "Tambah tanggal libur".
  3. Change a number and tap "Simpan harga". A dialog says "Harga baru berlaku untuk booking baru mulai sekarang. Booking yang sudah ada tetap memakai harga lama." with buttons "Simpan" and "Batal".
  4. Tap "Simpan".
  5. Holiday: tap "Tambah tanggal libur", choose the date, tap "Simpan"; that date is charged at the peak price all day.
  6. Done: every open cell on the public schedule shows the new price; existing bookings keep the price stored with them (D-036).
- **Priority:** must (S4.q9, D-036)
- **Unhappy paths** (deliver-edge-cases; routine defaults D-039, approved S4.q12)
  - Abandon/interruption — leaving the page or tapping "Batal" changes nothing. Check: prices unchanged after leaving.
  - Invalid input — empty, zero, negative, non-number or above Rp 5.000.000; a holiday date in the past: message under the field, nothing saved. Check: each case saves nothing.
  - Concurrency/retry — a player has the form open at the old price when the admin saves a new one: at submit the server uses the current price and the player confirms "Harga berubah menjadi Rp X. Lanjut pesan?". Two admin devices saving: the last save wins, the page shows "Terakhir diubah <tanggal jam>". Check: a booking submitted after the change stores the new price only after confirmation.
  - Expiry/hold — the new price applies from the moment of saving (WIB) to new bookings only; holidays are added by hand, no automatic national calendar (D-039). Check: a booking made before the change still shows the old price.

### F-05 — Weekly data download
- **English name:** Weekly data download
- **Who uses it:** admin, on the laptop
- **Happy path (click-by-click script):** confirmed S4.q15 (loop-back L-02)
  1. Log in (F-02 steps 1–2). If the last export is older than 7 days, a bar on the schedule says "Sudah <n> hari sejak data terakhir diunduh. Unduh sekarang" (text, not colour alone, D-041).
  2. Tap the bar, or tap "Pengaturan", then "Unduh data". The page shows "Terakhir diunduh: <tanggal jam>" and the button "Unduh semua data (CSV)".
  3. Tap "Unduh semua data (CSV)". The file `booking-<YYYY-MM-DD>.csv` downloads with all bookings, prices, closures, holidays and the block list.
  4. Done: "Terakhir diunduh" shows the new date and time, and the reminder bar disappears.
- **Priority:** must (S4.q15, D-052)
- **Unhappy paths** (deliver-edge-cases)
  - Abandon/interruption — the download fails or is cancelled: tap the button again; a fresh file is produced and nothing is changed. Check: a second download after a failed one gives a complete file.
  - Invalid input — not applicable: the screen has no input fields; only a logged-in admin can reach it, and a visitor is sent to the login page (D-024). Check: an anonymous request to the export is refused.
  - Concurrency/retry — two devices download at once: two identical files, harmless; bookings made while the file is produced appear in the next export. Check: two parallel exports both open and match.
  - Expiry/hold — the reminder appears once the last export is older than 7 days (WIB). Files hold personal data: the handover requires a laptop password, one folder, and deleting files older than 90 days (D-025). Restore from a file is tested in a milestone. Check: with the last export 8 days ago the bar shows; right after an export it is gone.
- **Loop-back L-02:** added from S6 R-3; implements D-013.

## Parking lot (named, not built in this version)

- Online DP (deposit) — D-016, D-038
- Automatic WhatsApp reminders — D-038
- Membership or subscriptions — D-038
- Revenue reports — D-038

## Decisions this Section

- **D-027** F-01 routine recovery defaults (no hold, one-time request key, WIB server time, past slots closed, typed values kept on refusal) — deliver-edge-cases · status: designer_filled (approved S4.q2)
- **D-028** F-01 script approved, priority must — S4.q2 · status: user_confirmed (delegated)
- **D-029** Booking window: today plus 14 days, until the slot starts — S4.q3 · status: user_confirmed (delegated)
- **D-030** Rules on the form: cancel at least 3 hours before; two no-shows without notice block the number — S4.q4, U-09 · status: user_confirmed (delegated)
- **D-031** Empty and closed states: "Semua lapangan penuh di tanggal ini" + "Lihat besok"; admin closes dates/hours with a reason — S4.q6 · status: user_confirmed (delegated)
- **D-032** F-02 routine defaults (manual bookings skip Turnstile and the limit, number optional; held hours must be cancelled before closing; attendance marks until end of next day; auto-block on 2nd no-show, admin unblocks; 30-day login session) · status: designer_filled (approved S4.q7)
- **D-033** F-03 routine defaults (code + last 4 digits lookup, one "not found" message, 5 lookups per 10 minutes; server-side 3-hour check in WIB; freed slot and limit at once) · status: designer_filled (approved S4.q8)
- **D-034** F-02 approved, must — S4.q7 · status: user_confirmed (delegated)
- **D-035** F-03 approved, must — S4.q8 · status: user_confirmed (delegated)
- **D-036** Two tax-inclusive prices (regular, peak incl. weekends and holidays) set in F-04, must; changes only for new bookings — S4.q9 · status: user_confirmed (delegated)
- **D-037** Voice: id-ID, "kamu" for players, plain admin screens — S4.q10 · status: user_confirmed (delegated)
- **D-038** Capture ends after F-04; parked: online DP, WhatsApp reminders, membership, revenue reports — S4.q11 · status: user_confirmed (delegated)
- **D-039** F-04 routine defaults (price bounds, manual holidays, price-changed confirmation, last save wins) · status: designer_filled (approved S4.q12)
- **D-040** F-04 approved — S4.q12 · status: user_confirmed (delegated)
- **D-041** Accessibility and layout: 16 px text, 44 × 44 px targets, high contrast, text status, phone-first sideways grid with fixed hour column, laptop shows all courts — S4.q13 · status: user_confirmed (delegated)
- **D-042** Avoid ads, banners, pop-ups and ungrouped slot lists; schedule first — S4.q14 · status: user_confirmed (delegated)

- **D-052** F-05 Weekly data download added, must — S4.q15, L-02, implements D-013 · status: user_confirmed (delegated)

## Interface notes (feed UI_SPEC.md)

- Product locale: id-ID (separate from the conversation language). Voice D-037; accessibility and layout D-041; avoid list D-042; empty and closed states D-031; error copy follows ux-copy (what happened + how to fix), e.g. "Slot sudah diambil. Pilih jam lain, ya."
- Web flows: phone first for players and admin; admin laptop shows the full grid (D-041). Broken connection on submit: one-time request key, same booking on retry (D-027). Empty states: D-031.

## Exit criteria

- [x] The user explicitly said enough (the control, or the natural end of the capture loop). — evidence: S4.q11, D-038
- [x] Every captured F-NN has a complete click-by-click happy path and a priority. — evidence: F-01 S4.q2/D-028, F-02 S4.q7/D-034, F-03 S4.q8/D-035, F-04 S4.q12/D-036, F-05 S4.q15/D-052
- [x] Every F-NN covers abandonment, invalid input, concurrency/retry, and expiry/hold. Each path has observable recovery or a reason it is inapplicable. — evidence: D-027, D-032, D-033, D-039 and each F block
- [x] No "and whatever else"/"etc." placeholders in the F-NN feature blocks (name, who, priority, happy path); original answer wording stays in the journal. — evidence: scan of F-01..F-04 blocks
- [x] Web profile: mobile and desktop flows, empty states, and recovery from a broken connection. — evidence: D-041, D-031, D-027

## Booster

grilling (loaded, `~/.agents/skills/grilling`); deliver-edge-cases, deliver-user-stories, deliver-acceptance-criteria (pm-skills, `~/.agents/skills`); mom-test, user-stories, ux-copy installed at seq 63–65; impeccable, emil-design-eng, antislop-human, antislop-layoutmobile present in the user's own skills.

## Context research

RQ-011 · S4 scan · 0 new items · items shown: U-08, U-09, U-11, U-13
