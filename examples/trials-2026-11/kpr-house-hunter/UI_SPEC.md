# UI specification — KPR House Hunter

Locale of the product: Indonesian (id-ID), rupiah written `Rp1.500.000.000`, dates `27 Nov 2026`, time zone WIB (D-009, D-064). Conversation language and this document: English. Aids: ux-copy installed and used for message wording; impeccable, antislop-human, antislop-layoutmobile and emil-design-eng guidance applied from this guide's excerpts (see OVERVIEW.md → Limitations).

## Product
- **Platform:** local web app in Firefox or Chromium on the owner's Linux laptop, laptop-first (D-002, D-047, D-064).
- **Users and jobs:** one owner (D-005) who wants to turn a listings file into a shortlist they can actually afford (S1.q3).
- **Purpose and positioning:** the whole file tested against income at the floating rate, the age-capped tenor and full upfront cash, offline (R-1, D-022).
- **Operating context:** used 2–4 times a month, about 15 minutes of upkeep a month (D-018, D-020); often next to a spreadsheet.
- **Constraints:** no online fonts, scripts or images (D-022); three pages plus Data & privasi (D-007, D-029).
- **Principles:** numbers first; every "no" has a reason; nothing looks affordable when data is missing (D-056); destructive actions need a typed word (D-026).
- **Accessibility and inclusion:** WCAG 2.2 AA targets below; keyboard path and labels (D-064).

## Design
Calm, plain, data-dense. System fonts only. One blue action colour; status colours always paired with a word.

```yaml
name: KPR House Hunter
description: Ranked house shortlist that fits the owner's KPR limits, offline.
colors:
  ink: "#1F2937"
  ink-secondary: "#4B5563"
  surface: "#FFFFFF"
  surface-muted: "#F3F4F6"
  action: "#1D4ED8"
  border: "#6B7280"
  warning-ink: "#78350F"
  warning-bg: "#FEF3C7"
  warning-edge: "#B45309"
  error-ink: "#991B1B"
  error-bg: "#FEE2E2"
  success-ink: "#14532D"
  success-bg: "#DCFCE7"
typography:
  body:
    fontFamily: "system-ui, 'Noto Sans', 'DejaVu Sans', sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0"
  heading:
    fontFamily: "system-ui, 'Noto Sans', 'DejaVu Sans', sans-serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0"
  number:
    fontFamily: "system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "0"
    fontVariantNumeric: "tabular-nums"
rounded:
  control: "6px"
spacing:
  unit: "8px"
  gutter: "24px"
  max-width: "1200px"
components:
  primary-button:
    backgroundColor: "{colors.action}"
    textColor: "{colors.surface}"
  secondary-button:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.action}"
    borderColor: "{colors.action}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    borderColor: "{colors.border}"
  banner-warning:
    backgroundColor: "{colors.warning-bg}"
    textColor: "{colors.warning-ink}"
    borderColor: "{colors.warning-edge}"
  message-error:
    backgroundColor: "{colors.error-bg}"
    textColor: "{colors.error-ink}"
  badge-lolos:
    backgroundColor: "{colors.success-bg}"
    textColor: "{colors.success-ink}"
  focus-ring:
    outline: "3px solid {colors.action}"
    outlineOffset: "2px"
```

Allowed pairs: ink/surface, ink/surface-muted, ink-secondary/surface, surface/action (button), action/surface and action/surface-muted (links, focus), warning-ink/warning-bg, error-ink/error-bg, success-ink/success-bg; border and warning-edge as control boundaries on surface. Not allowed: grey `#9CA3AF` for any text (2.54:1, fails).

Do: right-align money columns with tabular numbers; write status as a word ("Lolos", "Belum lengkap", "Ditolak"). Do not: colour-only status, card grids, decorative images, hover-only actions.

## Screens and states

### Impor CSV (`/impor/`)
```text
┌ KPR House Hunter   Impor CSV | Daftar | Profil & Kriteria ──────────┐
│ [!] 2 angka bawaan lebih dari 30 hari — perbarui                    │
│ Impor daftar rumah                                                  │
│ Pertama kali? 1) Isi profil  2) Impor CSV  3) Lihat daftar          │
│   Contoh berkas: contoh-listing.csv                                 │
│ Berkas CSV  [Pilih file]  listing-november.csv                      │
│ Baris terbaca: 48 · Ditolak: 2 · Kolom agen dibuang: 2              │
│  Baris 7: harga "satu M" tidak terbaca                              │
│ [Impor]                                                             │
└ Data & privasi ─────────────────────────────────────────────────────┘
```
States: empty (guide + sample link) · loading ("Membaca berkas…") · invalid (file refused, message by the file field, focus on it) · partial (rejected rows listed) · success (redirect to Daftar with "48 listing diimpor, 3 diperbarui") · failure ("Terjadi kesalahan. Data Anda tidak berubah.").

### Daftar (`/daftar/`)
```text
Daftar rumah  (urut: kriteria tambahan terbanyak, lalu dana tunai terkecil)
[Simpan CSV]
Lolos (12)
 Judul                 Harga          Cicilan promo  Cicilan setelah promo  Tenor  Dana tunai awal  Catatan
 Rumah 2 lt Lb Bulus   Rp1.500.000.000  Rp7.690.727    Rp14.355.653          20 th  Rp…              SHM
Dana tunai belum lengkap (5)   — isi perkiraan notaris dan asuransi di Profil & Kriteria
Ditolak (31)  [tampilkan]      — alasan per rumah
Catatan: persetujuan bank juga bergantung pada SLIK OJK.
```
States: no profile ("Isi profil keuangan dulu", must-haves only) · no listings ("Belum ada listing. Impor CSV dulu." + link) · stale house ("cek apakah masih dijual") · scam flag ("Harga jauh di bawah sekitar — cek keaslian iklan") · wide table scrolls inside its own region.

### Profil & Kriteria (`/profil/`)
```text
Profil & Kriteria
Keuangan: Penghasilan bersih/bulan [   ] Cicilan lain [   ] Dana tunai [   ] Usia saat ini [  ]
KPR per bank: BCA  DP min [5]% Bunga promo [ ]% selama [ ] th  Bunga floating [11]%
              Tenor [20] th  Tenor maks [25] th  Usia maks saat lunas [65]  Batas cicilan [30]%
Kriteria wajib: Harga maks [ ] Area [x] Jaksel [x] Depok  KT min [ ] LT min [ ] Baru/Bekas [Keduanya]
Kriteria tambahan: [ ] LB lebih besar [ ] KT lebih banyak [ ] SHM [ ] Rumah baru
Angka bawaan: NPOPTKP Jaksel Rp250.000.000 (dicek 27 Nov 2026, sumber) [Tandai sudah dicek] …
              Notaris/PPAT [ belum diisi ]  Asuransi [ belum diisi ]
[ ] Saya sudah cek enkripsi disk (lsblk -f)
[Simpan]                                    Tersimpan 27 Nov 2026 15.30 WIB
```
States: unsaved changes (leave warning) · invalid (field message, Simpan disabled, focus first invalid) · conflict ("Data sudah diubah di tab lain — muat ulang") · success ("Tersimpan" + date).

### Data & privasi (`/data/`)
```text
Data & privasi — semua data hanya tersimpan di laptop ini.
Yang disimpan: profil keuangan, kriteria, angka bawaan, listing, hasil hitung.
[Ekspor cadangan]   (berkas tidak dienkripsi — jangan unggah ke cloud/chat)
Hapus: ( ) Semua data ( ) Satu impor [listing-november.csv v] ( ) Profil keuangan saja
Ketik HAPUS: [      ]  [Hapus]  (nonaktif sampai tepat HAPUS)
[Pulihkan dari cadangan] → ringkasan berkas → Ketik PULIHKAN: [      ] [Pulihkan]
```
States: export warning dialog · delete disabled until HAPUS · restore summary (listing count, profile date) · refused file · rollback message · success.

## Craft rules
| Rule | Evidence |
|---|---|
| Each page starts with its action or page heading; no eyebrow text or decorative numbering (the first-run guide is a real sequence). | Inspect the four screens above. |
| The primary task has one visible verb button: Impor, Simpan, Simpan CSV, Hapus, Pulihkan. No card catalogue. | Each task starts without reading cards. |
| One token per role; status words pair every colour. | Token list + contrast table. |
| No decorative images or illustrations; tables use real listing data. | Inspect pages. |

## Motion budget
Only three motions exist: button press (120 ms background-colour change, no scale), banner appear (150 ms opacity, `cubic-bezier(0.23, 1, 0.32, 1)`), dialog (200 ms opacity). All under 300 ms; no `ease-in`, `scale(0)` or `transition: all`. With `prefers-reduced-motion: reduce` every transition is 0 ms and focus and outcome stay the same.

## Copy voice and states
| Key | Context | Indonesian text (as shown) | English summary |
|---|---|---|---|
| import.button | primary | Impor | Import |
| import.done | success | {n} listing diimpor, {m} diperbarui | n imported, m updated |
| import.too_big | error | Berkas lebih dari 5 MB. Pecah berkas menjadi beberapa bagian lalu impor lagi. | File too big; split it |
| import.bad_header | error | Kolom wajib tidak ditemukan. Kolom yang dibutuhkan: judul, link, harga, luas_tanah, luas_bangunan, kamar_tidur, area, kondisi. | Missing columns |
| import.row_price | validation | Baris {n}: harga "{v}" tidak terbaca | Row price unreadable |
| list.empty | empty | Belum ada listing. Impor CSV dulu. | No listings yet |
| list.no_profile | empty | Isi profil keuangan dulu | Fill in your profile first |
| list.incomplete | warning | Belum lengkap — isi perkiraan notaris dan asuransi | Incomplete upfront cash |
| list.slik | note | Persetujuan bank juga bergantung pada SLIK OJK. | Bank approval also depends on SLIK OJK |
| profile.saved | success | Tersimpan {tanggal} | Saved |
| profile.conflict | conflict | Data sudah diubah di tab lain — muat ulang | Changed in another tab |
| defaults.banner | warning | {n} angka bawaan lebih dari 30 hari — perbarui | n figures older than 30 days |
| data.export_warn | warning | Berkas cadangan tidak dienkripsi. Simpan di laptop ini atau flashdisk pribadi, jangan unggah ke cloud atau chat. | Backup is unencrypted |
| data.deleted | success | Data dihapus | Data deleted |
| data.restored | success | Data dipulihkan. Cadangan otomatis tersimpan: {berkas} | Restored, auto-backup saved |
| data.restore_bad | error | Berkas ini bukan cadangan KPR House Hunter atau dari versi lebih baru. Tidak ada yang diubah. | Not a valid backup |
| error.generic | failure | Terjadi kesalahan. Data Anda tidak berubah. | Error; nothing changed |

Labels proposed, to be confirmed by the owner at M0 (D-047 first-run check).

## Accessibility and mobile layout
- WCAG 2.2 AA: text 4.5:1, controls and focus 3:1, all checked below.
- Every input has a visible `<label>`; buttons are `<button>`, navigation is `<a>`; skip link "Lewati ke isi" on every page.
- Messages use `role="alert"` (errors) or `aria-live="polite"` (status); the first invalid field gets focus after a failed submit.
- Money fields `inputmode="numeric"`; paste allowed; file input accepts `.csv`.
- Delete and restore need a typed word (HAPUS, PULIHKAN) — no accidental destructive action.
- Targets at least 44 × 44 CSS px for buttons.
- Laptop-first; tested at 1366 px and 1920 px wide, 200% zoom, and 320 px wide without horizontal scroll except the shortlist table, which scrolls inside its own labelled region.

## Verification
Plan-time contrast results (helper `.lvr/verification/contrast-check.py`, SHA-256 `393e6433d120632aa11184792a16cd7b325924dbc9993477825d9aa67fdbfe6e`, run 2026-11-27):

| Foreground | Background | Role | Ratio | Result |
|---|---|---|---|---|
| #1F2937 | #FFFFFF | body text | 14.68:1 | PASS normal |
| #1F2937 | #F3F4F6 | body text on muted | 13.34:1 | PASS normal |
| #FFFFFF | #1D4ED8 | primary button label | 6.70:1 | PASS normal |
| #1D4ED8 | #FFFFFF | links, focus ring | 6.70:1 | PASS normal |
| #1D4ED8 | #F3F4F6 | links on muted | 6.09:1 | PASS normal |
| #4B5563 | #FFFFFF | secondary text | 7.56:1 | PASS normal |
| #78350F | #FEF3C7 | warning banner text | 8.15:1 | PASS normal |
| #991B1B | #FEE2E2 | error text | 6.80:1 | PASS normal |
| #14532D | #DCFCE7 | "Lolos" badge | 8.30:1 | PASS normal |
| #6B7280 | #FFFFFF | input border (control) | 4.83:1 | PASS 3:1 |
| #B45309 | #FFFFFF | banner edge (control) | 5.02:1 | PASS 3:1 |
| #9CA3AF | #FFFFFF | rejected — not used | 2.54:1 | FAIL |

Needs the built UI (M4, VERIFICATION.md): screenshot matrix (4 pages × Firefox/Chromium × 1366 px/320 px), keyboard walk and visible focus, 200% zoom, reduced-motion emulation, copy keys above appear exactly as written.
