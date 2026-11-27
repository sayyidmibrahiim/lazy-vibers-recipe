# Requirements

All times are judged in WIB (Asia/Jakarta) on the server and stored in UTC (D-027). Product text is Indonesian (id-ID); exact copy keys are in `UI_SPEC.md`. The four parking-lot ideas were never captured as features (SCOPE.md).

## F-01 — Book an open slot
- **User:** player (team captain or whoever books for the team) · **Priority:** must · **Status:** in-MVP
- **Behavior:** the short link opens today's schedule. Date tabs show today plus 14 days (D-029). The grid has one row per hour 08.00–23.00 and one column per court (Lapangan 1, 2, 3). A cell shows "Tersedia · Rp {price incl. tax}" or "Terisi" (D-021, D-024). Tapping a "Tersedia" cell opens the form: a summary (court, date, start–end, price including 10% PBJT, "bayar di venue"), the rules text (D-030), "Nama pemesan / nama tim", "Nomor WhatsApp", and the consent tick box with the D-050 wording, linked to the privacy policy, under the D-051 storage notice. Turnstile runs in the background (D-023). "Pesan slot ini" creates the booking and opens a confirmation page with court, date, time, price, booking code, "Bayar di venue saat datang" and "Bagikan ke WhatsApp" (D-008). The database allows one active booking per court and slot start (D-027). Each booking stores the consent time and consent version `v1` (D-056).
- **Acceptance criteria:**
  - **Given** an open slot **when** a player submits a valid form **then** a booking is stored, the confirmation page shows a booking code, and the public cell shows "Terisi" after reload.
  - **Given** one open slot **when** 20 submits for it arrive in parallel **then** exactly 1 booking exists and 19 requests get "Slot sudah diambil".
  - **Given** a player who lost the race **when** the refusal shows **then** the schedule is refreshed and the typed name and number are kept.
  - **Given** a submit retried with the same request key **when** it arrives **then** no second booking is stored and the same code is shown.
  - **Given** an empty name, a number outside 08… or +62… with 10–13 digits, or no consent tick **when** the player submits **then** an inline message shows under the field, typed values stay, and nothing is saved.
  - **Given** a WhatsApp number with 2 upcoming bookings **when** a third is submitted **then** it is refused with the limit message.
  - **Given** 5 submits from one device or connection in 10 minutes **when** a sixth arrives **then** it is refused.
  - **Given** a submit without a valid Turnstile token **when** it reaches the server **then** it is refused and nothing is stored; when the Turnstile check itself fails, the form shows "Pemesanan online sedang gangguan. Hubungi admin lewat WhatsApp" with the venue WhatsApp link (D-055).
  - **Given** the time is 19.01 WIB **when** a player submits the 19.00 slot **then** it is refused with "Jam ini sudah lewat".
  - **Given** every slot on a date is taken **when** the player opens that date **then** "Semua lapangan penuh di tanggal ini" and "Lihat besok" show (D-031).
  - **Given** hours closed by the admin **when** a player views them **then** the cells show "Venue tutup – {reason}" and cannot be booked.
  - **Given** a submit with an edited price **when** it is stored **then** the stored price is the database price (D-024).
  - **Given** a player closes the form before submitting **when** another device views the slot **then** it is still "Tersedia" (no hold).

## F-02 — Admin daily schedule
- **User:** admin (venue owner), phone first, laptop also · **Priority:** must · **Status:** in-MVP
- **Behavior:** `/admin` asks for "Email" and "Kata sandi" (Supabase Auth, D-022). The admin grid uses the same date tabs and hour × court grid as F-01; booked cells show the booker's name and an "Online" or "Manual" tag; empty cells show "Kosong"; closed cells show "Tutup". The admin adds manual bookings (name, optional number, note), which skip Turnstile and the 2-booking limit but obey the one-winner rule (D-032). A booked cell opens the detail: name, full number with "Chat WhatsApp", code, status, and "Datang", "Tidak datang", "Batalkan booking", "Blokir nomor". "Tutup jadwal" closes a date, one or all courts and an hour range with a reason. "Lupa kata sandi" sends a reset email (D-019). Sessions last 30 days without use (D-032). On a 1366 × 768 laptop all three courts show without sideways scrolling (D-041).
- **Acceptance criteria:**
  - **Given** no login **when** someone opens `/admin` or calls admin data **then** they are sent to the login page or get 401 or no rows.
  - **Given** a slot a player booked a second earlier **when** the admin saves a manual booking for it **then** "Slot sudah diambil (online)" shows and one active booking remains.
  - **Given** a double tap on "Simpan" **when** both requests arrive **then** one booking is stored (request key, D-027).
  - **Given** two devices cancel the same booking **when** the second request arrives **then** it shows "Booking ini sudah dibatalkan".
  - **Given** an empty name, a wrong number format, or an end hour before the start hour **when** the admin saves **then** a message names the problem and nothing is saved.
  - **Given** hours that hold bookings **when** the admin tries to close them **then** the message lists those bookings and asks to cancel them first.
  - **Given** a number with one "Tidak datang" **when** a second "Tidak datang" is marked **then** the number is blocked and its next online booking is refused; unblocking allows it again (D-030).
  - **Given** a slot start has passed **when** the admin opens the booking until the end of the next day (WIB) **then** "Datang" and "Tidak datang" are available; after that they are not.
  - **Given** the admin closes the form without saving **when** the grid reloads **then** the cell is unchanged.
  - **Given** "Lupa kata sandi" **when** the admin requests a reset **then** the email reaches the venue email within 10 minutes, or the dashboard recovery in HANDOVER.md is used (D-055).

## F-03 — Cancel my booking
- **User:** player · **Priority:** must · **Status:** in-MVP
- **Behavior:** from the confirmation link, or "Cek booking saya" with the booking code plus the last 4 digits of the number, the player sees the booking with a masked number and "Batalkan booking" with the note "Bisa dibatalkan sampai 3 jam sebelum main". A dialog asks for the last 4 digits of the WhatsApp number and to confirm ("Ya, batalkan" / "Tetap main"), so a shared confirmation link alone cannot cancel. After cancelling, the status is "Dibatalkan", the slot shows "Tersedia" at once, and the number has one fewer upcoming booking (D-033, D-035).
- **Acceptance criteria:**
  - **Given** a wrong code, or the right code with wrong last 4 digits **when** the player taps "Cari" **then** the same "Booking tidak ditemukan" message shows.
  - **Given** someone opens a shared confirmation link **when** they try to cancel without the right last 4 digits **then** "Booking tidak ditemukan" shows and the booking stays active.
  - **Given** 5 lookups from one device or connection in 10 minutes **when** a sixth arrives **then** it is refused.
  - **Given** a booking 3 hours 1 minute before start **when** the player confirms the cancel **then** the status is "Dibatalkan" and the public cell shows "Tersedia" after reload.
  - **Given** a booking 2 hours 59 minutes before start **when** the player asks to cancel **then** it is refused with "Batas pembatalan online sudah lewat. Hubungi venue lewat WhatsApp" and a WhatsApp link.
  - **Given** "Tetap main" or a closed page **when** the booking is checked **then** its status is still active.
  - **Given** a booking already cancelled by the player or the admin **when** a second cancel arrives **then** "Booking ini sudah dibatalkan" shows and one cancellation is recorded.

## F-04 — Set prices
- **User:** admin · **Priority:** must · **Status:** in-MVP
- **Behavior:** "Pengaturan → Harga" shows two final prices per hour including 10% PBJT (D-021): "Harga biasa (Senin–Jumat 08.00–16.00)" and "Harga jam ramai (Senin–Jumat 16.00–24.00, Sabtu, Minggu, hari libur)", plus the "Hari libur" list with "Tambah tanggal libur". Saving shows a dialog that new prices apply to new bookings only. A holiday date is charged at the peak price all day. Each booking keeps the price stored with it (D-036, D-039, D-040). The page shows "Terakhir diubah {tanggal jam}".
- **Acceptance criteria:**
  - **Given** a new peak price is saved **when** the public schedule reloads **then** open peak cells show the new price and existing bookings keep their stored price.
  - **Given** an empty value, 0, a negative number, text, or more than Rp 5.000.000 **when** the admin saves **then** a field message shows and nothing is saved; whole rupiah from Rp 1 to Rp 5.000.000 are accepted.
  - **Given** a holiday date in the past **when** the admin adds it **then** a message shows and nothing is saved.
  - **Given** a date added as a holiday **when** the schedule shows that date **then** every hour carries the peak price.
  - **Given** a player's form shows the old price **when** the admin saves a new price and the player submits **then** the player sees "Harga berubah menjadi Rp X. Lanjut pesan?" and the booking stores the new price only after confirming.
  - **Given** two admin devices save prices **when** both saves arrive **then** the last save wins and "Terakhir diubah" shows its time.
  - **Given** the admin taps "Batal" or leaves the page **when** prices are read again **then** they are unchanged.

## F-05 — Weekly data download
- **User:** admin, on the laptop · **Priority:** must · **Status:** in-MVP
- **Behavior:** when the last export is older than 7 days (WIB), the admin schedule shows "Sudah {n} hari sejak data terakhir diunduh. Unduh sekarang" (text, not colour alone, D-041). "Pengaturan → Unduh data" shows "Terakhir diunduh: {tanggal jam}" and "Unduh semua data (CSV)", which downloads `booking-<YYYY-MM-DD>.csv` with all bookings, prices, closures, holidays and the block list (D-052). Only a logged-in admin can reach it (D-024). The file can be restored into a fresh Supabase project (D-013).
- **Acceptance criteria:**
  - **Given** the last export was 8 days ago **when** the admin opens the schedule **then** "Sudah 8 hari sejak data terakhir diunduh" shows; right after a download it is gone.
  - **Given** a download **when** the file is opened **then** the bookings row count equals `select count(*) from bookings`.
  - **Given** a failed or cancelled download **when** the admin taps the button again **then** a complete file is produced and nothing in the data changes.
  - **Given** two devices download at once **when** both files are opened **then** both are complete and match.
  - **Given** no login **when** someone requests the export **then** it is refused.
  - **Given** a downloaded file **when** it is restored into a disposable Supabase project **then** the row counts per table match and a booking found by code shows the same court, date, time and price, within 30 minutes.
