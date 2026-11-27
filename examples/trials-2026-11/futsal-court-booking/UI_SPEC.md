# UI specification

Product locale: id-ID. Voice: "kamu" for players, plain for admin (D-037). The palette and type below are designer defaults (D-063, assumed); accessibility targets are confirmed (D-041).

## Product

- **Platform:** responsive website, phone first; admin also on a Windows laptop (D-003, D-010).
- **Users and jobs:** players book or cancel one hour; the admin runs the day's schedule (D-004).
- **Purpose and positioning:** the venue's own booking link, instant confirmation, no app and no player fee (R-7).
- **Operating context:** old small Android phones, outdoor light, slow mobile data (D-010).
- **Constraints:** free plans, no ads, banners, pop-ups or ungrouped slot lists; schedule first (D-042).
- **Principles:** the schedule is the first screen; every state is a word, not only a colour; one action per screen.
- **Accessibility:** text ≥ 16 px, targets ≥ 44 × 44 px, WCAG 2.2 AA contrast (D-041).

## Design

```yaml
name: futsal-court-booking
description: Book one futsal court hour at the venue, instantly confirmed
colors:
  ink: "#1C1917"
  muted: "#57534E"
  surface: "#FAFAF9"
  action: "#15803D"
  on-action: "#FFFFFF"
  free-bg: "#DCFCE7"
  taken-bg: "#E7E5E4"
  error-text: "#991B1B"
  error-bg: "#FEE2E2"
  warn-text: "#92400E"
  warn-bg: "#FEF3C7"
  danger: "#B91C1C"
typography:
  body:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0"
  heading:
    fontSize: "20px"
    fontWeight: 700
rounded:
  control: "8px"
spacing:
  gutter: "16px"
  cell-gap: "4px"
components:
  primary-button: { backgroundColor: "{colors.action}", textColor: "{colors.on-action}", minHeight: "48px" }
  danger-button: { backgroundColor: "{colors.danger}", textColor: "{colors.on-action}" }
  cell-free: { backgroundColor: "{colors.free-bg}", textColor: "{colors.ink}", label: "Tersedia · Rp <harga>" }
  cell-taken: { backgroundColor: "{colors.taken-bg}", textColor: "{colors.ink}", label: "Terisi" }
  field-error: { textColor: "{colors.error-text}", backgroundColor: "{colors.error-bg}" }
  warning-bar: { textColor: "{colors.warn-text}", backgroundColor: "{colors.warn-bg}" }
```

Do: one primary green button per screen; focus ring 3 px `#1C1917` offset 2 px. Do not: colour-only status, gradients, card grids, icons without text.

## Screens and states

**Schedule `/` (F-01)**

```text
+--------------------------------------+
| Futsal Court Booking   Cek booking saya |
| [Hari ini][Sab 5][Min 6] ... (14) ->   |
| Jam  | Lap 1      | Lap 2   | Lap 3   |
| 08.00| Tersedia   | Terisi  | Tersedia|
|      | Rp 150.000 |         | Rp ...  |
| ...  (hour column fixed, scroll ->)   |
+--------------------------------------+
```
States: loading = server-rendered, no spinner; empty date = "Semua lapangan penuh di tanggal ini" + "Lihat besok"; closed = "Venue tutup – {alasan}"; past = "Jam ini sudah lewat"; failure = site-down text with WhatsApp link.

**Form `/pesan`** — summary, rules, "Nama pemesan / nama tim" (`autocomplete=name`), "Nomor WhatsApp" (`type=tel inputmode=tel autocomplete=tel`), consent tick box (D-050), storage notice (D-051), "Pesan slot ini". Invalid: message under the field, focus moves to the first invalid field, values kept. Conflict: "Slot sudah diambil. Pilih jam lain, ya." then the refreshed schedule. Price changed: dialog "Harga berubah menjadi Rp X. Lanjut pesan?". Turnstile failure: "Pemesanan online sedang gangguan. Hubungi admin lewat WhatsApp".

**Confirmation `/booking/<code>`** — court, date, time, price, code (large), "Bayar di venue saat datang", "Bagikan ke WhatsApp", "Batalkan booking" with "Bisa dibatalkan sampai 3 jam sebelum main"; cancel dialog "Ya, batalkan" / "Tetap main"; cancelled = "Dibatalkan"; window passed = WhatsApp text.

**Admin grid `/admin`** — same grid with names and "Online"/"Manual" tags, "Kosong", "Tutup"; bars for the 7-day download reminder and job failure; at 1366 × 768 all three courts visible. Detail, close-hours, prices and download screens follow USER_FLOWS.md.

## Craft rules

| Rule | Evidence |
|---|---|
| Each screen starts with its heading or the schedule itself; no eyebrow text | Inspect `/`, `/pesan`, `/booking/<code>`, `/admin` |
| The primary task has one named button ("Pesan slot ini", "Simpan", "Unduh semua data (CSV)") | Each task starts without reading cards |
| One token per role; status always has a word | Contrast results below; screenshots per state |

## Motion budget

| Interaction | Normal | Reduced motion |
|---|---|---|
| Button press | 120 ms `transform: scale(0.97)`, `cubic-bezier(0.23, 1, 0.32, 1)` | immediate |
| Dialog | 200 ms opacity + scale from 0.97 | immediate |
| Cell state change after booking | 150 ms background-color | immediate |

No `ease-in`, no `scale(0)`, no `transition: all`; every transition under 300 ms.

## Copy voice and states

Values in braces, such as `{n}` or `{reason}`, are filled in at runtime from the data.

| Key | Text (id-ID) | Context |
|---|---|---|
| `book.cta` | Pesan slot ini | primary |
| `book.success` | Booking kamu sudah terkonfirmasi | success |
| `book.taken` | Slot sudah diambil. Pilih jam lain, ya. | conflict |
| `book.past` | Jam ini sudah lewat | expiry |
| `book.limit` | Nomor ini sudah punya 2 booking aktif. Batalkan salah satu dulu, ya. | limit |
| `book.rate` | Terlalu banyak percobaan. Coba lagi 10 menit lagi, ya. | limit |
| `book.captcha_down` | Pemesanan online sedang gangguan. Hubungi admin lewat WhatsApp | failure |
| `field.phone` | Nomor WhatsApp harus diawali 08 atau +62, 10–13 angka. | validation |
| `field.consent` | Centang persetujuan dulu untuk lanjut. | validation |
| `day.full` | Semua lapangan penuh di tanggal ini | empty |
| `lookup.notfound` | Booking tidak ditemukan | not found |
| `cancel.late` | Batas pembatalan online sudah lewat. Hubungi venue lewat WhatsApp | expiry |
| `admin.taken_online` | Slot sudah diambil (online) | conflict |
| `admin.export_due` | Sudah {n} hari sejak data terakhir diunduh. Unduh sekarang | warning |

Keys `book.limit`, `book.rate`, `field.consent` and `book.success` are proposed (D-063).

## Accessibility and mobile layout

- WCAG 2.2 AA; 44 × 44 px targets; 16 px body text; visible focus; errors in an `aria-live="polite"` region and next to the field.
- Phone: grid scrolls sideways inside its own container with the hour column fixed; the page itself has no horizontal scroll at 320 px. 200% text zoom keeps all actions reachable.
- Laptop ≥ 1024 px: three court columns without scrolling.

## Verification

Helper: `.lvr/verification/contrast-check.py` (SHA-256 `393e6433d120632aa11184792a16cd7b325924dbc9993477825d9aa67fdbfe6e`, MIT, `LICENSE.txt` alongside). Plan-time results (2026-11-27), all exit 0:

| Foreground | Background | Role | Ratio |
|---|---|---|---|
| #1C1917 | #FAFAF9 | body text | 16.74:1 |
| #FFFFFF | #15803D | primary button | 5.02:1 |
| #1C1917 | #DCFCE7 | free cell | 15.92:1 |
| #57534E | #FAFAF9 | muted text | 7.30:1 |
| #991B1B | #FEE2E2 | field error | 6.80:1 |
| #1C1917 | #E7E5E4 | taken cell | 13.93:1 |
| #92400E | #FEF3C7 | warning bar | 6.37:1 |
| #FFFFFF | #B91C1C | danger button | 6.47:1 |

Re-run: `python3 .lvr/verification/contrast-check.py "#FFFFFF" "#15803D"` (repeat per pair). Builder checks on the built UI (M1 step 8): screenshots at 320, 360, 1366 px; keyboard tab through form and dialog; reduced-motion emulation; 200% zoom.
