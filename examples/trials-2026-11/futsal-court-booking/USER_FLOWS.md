# User flows

Scripts from the S4 record. Every step names the real Indonesian label.

## F-01 — Book an open slot (in-MVP)

```text
Link -> Schedule (today) -> tap 'Tersedia' -> Form -> 'Pesan slot ini' -> Confirmation + code
                                                    \-> 'Slot sudah diambil' -> Schedule
```

1. Open the short link from the venue's WhatsApp Business profile, Instagram bio or Google Maps (D-006). The schedule page opens on today's date.
2. See a row of date tabs (today plus the next 14 days, D-029) and a grid: one row per hour 08.00–23.00, one column per court (Lapangan 1, 2, 3). Each cell shows "Tersedia · Rp {price incl. tax}" or "Terisi" (D-021, D-024).
3. Tap a date tab to change day, then tap a "Tersedia" cell.
4. The booking form opens with a summary (court, date, start–end time, price incl. 10% PBJT, "bayar di venue"), the venue rules text (D-030), two fields — "Nama pemesan / nama tim" and "Nomor WhatsApp" — and a consent tick box linked to the privacy policy (D-017) reading "Saya berusia 18 tahun ke atas, atau saya orang tua/wali yang memesan untuk anak saya." (D-050); the notice says booking data is stored with the provider in Singapore (D-051). Turnstile runs in the background (D-023).
5. Tap "Pesan slot ini".
6. Done: the confirmation page shows court, date, time, price, booking code, "Bayar di venue saat datang", and a "Bagikan ke WhatsApp" button (D-008). The schedule now shows that cell as "Terisi" for everyone.
- **Alternatives:**
  - Abandon/interruption: player closes the form before tapping "Pesan slot ini": nothing is saved, the slot stays "Tersedia" (no hold). Check: after closing, the cell is still "Tersedia" for another device.
  - Invalid input: empty name, or a WhatsApp number not in Indonesian mobile format (08… or +62…, 10–13 digits), or consent not ticked: inline message under the field, typed values kept, button stays usable. Also D-023 refusals (3rd upcoming booking, 6th submit in 10 minutes, failed Turnstile) with their own plain message. Check: each invalid case shows its message and saves nothing.
  - Concurrency/retry: two players submit the same slot at once: the database refuses the second row (U-08); the loser sees "Slot sudah diambil" and returns to a refreshed schedule with typed name and number kept. Double tap or retry after a dropped connection reuses the form's one-time request key and returns the same booking (D-027). Check: two parallel submits → exactly one booking row, one "Slot sudah diambil"; a repeated submit with the same key → one row.
  - Expiry/hold: no hold while the form is open; time is Asia/Jakarta (WIB) from the server; a slot whose start time has passed cannot be booked ("Jam ini sudah lewat"); booking opens for today plus 14 days (D-029); dates beyond that have no tab. A fully booked date shows "Semua lapangan penuh di tanggal ini" with "Lihat besok"; closed hours show "Venue tutup – {reason}" (D-031). Check: a submit at 19.01 for the 19.00 slot is refused.

## F-02 — Admin daily schedule (in-MVP)

```text
/admin -> Login -> Admin grid -> tap cell -> Manual booking | Booking detail | 'Tutup jadwal' -> saved
```

1. Open the admin address (the site link plus /admin). The login page shows "Email" and "Kata sandi".
2. Enter the venue email and password, tap "Masuk". The admin schedule opens on today's date with the same date tabs and the hour × court grid as F-01.
3. Each booked cell shows the booker's name and a tag "Online" or "Manual". Empty cells show "Kosong"; closed cells show "Tutup".
4. Manual booking: tap an empty cell → form "Tambah booking manual" with "Nama pemesan / nama tim", "Nomor WhatsApp (boleh kosong)" and "Catatan" → tap "Simpan" → the cell turns booked with the tag "Manual" and the public schedule shows "Terisi".
5. Booking detail: tap a booked cell → see name, full WhatsApp number with a "Chat WhatsApp" button, booking code, status, and four buttons: "Datang", "Tidak datang", "Batalkan booking", "Blokir nomor".
6. Close hours: tap "Tutup jadwal" → choose date, court (one or all), start and end hour, type the reason → tap "Simpan" → those cells show "Tutup" for the admin and "Venue tutup – {reason}" for players.
7. Done: the day's schedule is the single source of truth for online and WhatsApp/walk-in bookings, and no slot can be held twice.
- **Alternatives:**
  - Abandon/interruption: closing the manual-booking or close-hours form saves nothing; an expired login (30 days without use) returns to the login page. Check: after closing the form the cell is unchanged.
  - Invalid input: empty name, a number in the wrong format, end hour before start hour, or closing hours that already hold bookings: a message names the problem; for held hours the message lists those bookings and asks the admin to cancel them first. Check: each case saves nothing.
  - Concurrency/retry: a player books online the same slot the admin is filling manually: the database rule accepts one; the admin sees "Slot sudah diambil (online)". Two devices cancelling the same booking: the second sees "Booking ini sudah dibatalkan". Double tap on "Simpan" stores one booking (one-time request key, D-027). Check: parallel manual and online submits → one row.
  - Expiry/hold: "Datang"/"Tidak datang" are available from the slot start until the end of the next day (WIB); the second "Tidak datang" on one number blocks it automatically and the admin can unblock (D-030, D-032). Check: a second no-show mark puts the number on the block list; a third upcoming booking attempt from it is refused online.

## F-03 — Cancel my booking (in-MVP)

```text
Confirmation link or 'Cek booking saya' (code + 4 digits) -> Booking -> 'Batalkan booking' -> 'Ya, batalkan' -> 'Dibatalkan'
```

1. Open the confirmation page from the saved link or the WhatsApp share message, or tap "Cek booking saya" on the schedule and type the booking code plus the last 4 digits of the WhatsApp number, then tap "Cari".
2. See the booking (court, date, time, price, masked number per D-024) and a "Batalkan booking" button with the note "Bisa dibatalkan sampai 3 jam sebelum main".
3. Tap "Batalkan booking". A dialog asks "Batalkan booking Lapangan {n}, {hari} {jam}? Slot akan dibuka untuk orang lain." with buttons "Ya, batalkan" and "Tetap main".
4. Type the last 4 digits of the WhatsApp number in the dialog, then tap "Ya, batalkan" (a shared link alone cannot cancel).
5. Done: the page shows status "Dibatalkan"; the slot returns to "Tersedia" on the public schedule at once, and the number has one fewer upcoming booking (D-023).
- **Alternatives:**
  - Abandon/interruption: tapping "Tetap main" or closing the page: nothing changes. Check: booking status stays active.
  - Invalid input: wrong code or wrong last 4 digits: one message "Booking tidak ditemukan" for both, at most 5 lookups per 10 minutes per device/connection. Check: the 6th lookup in 10 minutes is refused.
  - Concurrency/retry: cancelling twice, or the player and admin cancelling at once: the second sees "Booking ini sudah dibatalkan". Check: one cancellation recorded.
  - Expiry/hold: less than 3 hours before play (server time, WIB) the button is replaced by "Batas pembatalan online sudah lewat. Hubungi venue lewat WhatsApp" with a WhatsApp link. Check: a cancel request at 16.01 for the 19.00 slot is refused.

## F-04 — Set prices (in-MVP)

```text
Admin -> 'Pengaturan' -> 'Harga' -> change price -> 'Simpan harga' -> dialog 'Simpan' -> new price on schedule
```

1. Log in (F-02 steps 1–2). On the admin schedule tap "Pengaturan", then "Harga".
2. See two fields in rupiah per hour, both final prices including 10% PBJT (D-021): "Harga biasa (Senin–Jumat 08.00–16.00)" and "Harga jam ramai (Senin–Jumat 16.00–24.00, Sabtu, Minggu, hari libur)". Below them, the list "Hari libur" with a button "Tambah tanggal libur".
3. Change a number and tap "Simpan harga". A dialog says "Harga baru berlaku untuk booking baru mulai sekarang. Booking yang sudah ada tetap memakai harga lama." with buttons "Simpan" and "Batal".
4. Tap "Simpan".
5. Holiday: tap "Tambah tanggal libur", choose the date, tap "Simpan"; that date is charged at the peak price all day.
6. Done: every open cell on the public schedule shows the new price; existing bookings keep the price stored with them (D-036).
- **Alternatives:**
  - Abandon/interruption: leaving the page or tapping "Batal" changes nothing. Check: prices unchanged after leaving.
  - Invalid input: empty, zero, negative, non-number or above Rp 5.000.000; a holiday date in the past: message under the field, nothing saved. Check: each case saves nothing.
  - Concurrency/retry: a player has the form open at the old price when the admin saves a new one: at submit the server uses the current price and the player confirms "Harga berubah menjadi Rp X. Lanjut pesan?". Two admin devices saving: the last save wins, the page shows "Terakhir diubah {tanggal jam}". Check: a booking submitted after the change stores the new price only after confirmation.
  - Expiry/hold: the new price applies from the moment of saving (WIB) to new bookings only; holidays are added by hand, no automatic national calendar (D-039). Check: a booking made before the change still shows the old price.

## F-05 — Weekly data download (in-MVP)

```text
Admin -> reminder bar or 'Pengaturan' -> 'Unduh data' -> 'Unduh semua data (CSV)' -> file + new date
```

1. Log in (F-02 steps 1–2). If the last export is older than 7 days, a bar on the schedule says "Sudah {n} hari sejak data terakhir diunduh. Unduh sekarang" (text, not colour alone, D-041).
2. Tap the bar, or tap "Pengaturan", then "Unduh data". The page shows "Terakhir diunduh: {tanggal jam}" and the button "Unduh semua data (CSV)".
3. Tap "Unduh semua data (CSV)". The file `booking-<YYYY-MM-DD>.csv` downloads with all bookings, prices, closures, holidays and the block list.
4. Done: "Terakhir diunduh" shows the new date and time, and the reminder bar disappears.
- **Alternatives:**
  - Abandon/interruption: the download fails or is cancelled: tap the button again; a fresh file is produced and nothing is changed. Check: a second download after a failed one gives a complete file.
  - Invalid input: not applicable: the screen has no input fields; only a logged-in admin can reach it, and a visitor is sent to the login page (D-024). Check: an anonymous request to the export is refused.
  - Concurrency/retry: two devices download at once: two identical files, harmless; bookings made while the file is produced appear in the next export. Check: two parallel exports both open and match.
  - Expiry/hold: the reminder appears once the last export is older than 7 days (WIB). Files hold personal data: the handover requires a laptop password, one folder, and deleting files older than 90 days (D-025). Restore from a file is tested in a milestone. Check: with the last export 8 days ago the bar shows; right after an export it is gone.

