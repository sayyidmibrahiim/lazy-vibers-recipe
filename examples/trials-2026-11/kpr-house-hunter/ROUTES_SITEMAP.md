# Routes and sitemap

Entry point: a browser bookmark to `http://127.0.0.1:8000/` on the owner's laptop (D-007, S1.q6). No public pages, no sign-in (D-007). All pages are private to the laptop (D-021).

| Path | Page | Who | Entry | After the main task |
|---|---|---|---|---|
| `/` | redirect | owner | bookmark | → `/impor/` |
| `/impor/` | Impor CSV | owner | bookmark, nav | → `/daftar/` after Impor |
| `/daftar/` | Daftar (shortlist) | owner | nav, after import | Simpan CSV downloads the file; stays on page |
| `/daftar/unduh.csv` | shortlist download | owner | Simpan CSV | file saved |
| `/profil/` | Profil & Kriteria (+ Angka bawaan) | owner | nav, banner, "Isi profil keuangan dulu" link | → stays with "Tersimpan"; Daftar recalculated |
| `/data/` | Data & privasi | owner | footer link | stays with result message |

```text
            bookmark
               │
               v
   ┌────────  /impor/  ────────┐
   │             │ Impor        │
   │             v              │
 nav ──>      /daftar/  ──> unduh.csv
   │             ^ recalculated │
   └────────  /profil/ <── banner
                 │
   footer ──>  /data/  (ekspor · hapus · pulihkan)
```
Every page carries the same top navigation (Impor CSV · Daftar · Profil & Kriteria) and the footer link Data & privasi.
