# Routes and sitemap

Entry: one short link on WhatsApp Business, the Instagram bio and Google Maps, opening `/` (D-006). Only `/admin` pages need login (D-007).

| Route | Page | Users | Arrives from | Next step | Feature |
|---|---|---|---|---|---|
| `/` | Schedule (date tabs, hour × court grid) | players | short link | tap "Tersedia" → `/pesan` | F-01 |
| `/pesan` | Booking form | players | schedule cell | `/booking/<code>` or back to `/` with "Slot sudah diambil" | F-01 |
| `/booking/<code>` | Confirmation / my booking | players | after booking, shared WhatsApp link, `/cek` | share, cancel, back to `/` | F-01, F-03 |
| `/cek` | Find my booking | players | "Cek booking saya" on `/` | `/booking/<code>` | F-03 |
| `/kebijakan-privasi` | Privacy policy | players | form link, footer | back | D-017 |
| `/syarat` | Terms and rules | players | form link, footer | back | D-030, D-050 |
| `/health` | Health text | builder, owner | direct | — | M0 |
| `/admin/login`, `/admin/lupa-sandi` | Login, reset | admin | `/admin` | `/admin` | F-02 |
| `/admin` | Admin grid | admin | login | detail, manual booking, close hours | F-02, F-05 bar |
| `/admin/booking/<id>` | Booking detail | admin | grid cell | back to grid | F-02 |
| `/admin/tutup`, `/admin/blokir` | Close hours, block list | admin | grid buttons | grid | F-02 |
| `/admin/pengaturan/harga` | Prices and holidays | admin | "Pengaturan" | grid | F-04 |
| `/admin/pengaturan/unduh` | Data download | admin | "Pengaturan", reminder bar | grid | F-05 |

```text
/ ──> /pesan ──> /booking/<code> ──> (cancel) ──> /
│                    ^
└──> /cek ───────────┘
/admin/login ──> /admin ──> booking/<id> | tutup | blokir | pengaturan/harga | pengaturan/unduh
```
