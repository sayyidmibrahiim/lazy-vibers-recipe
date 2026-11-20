# Riset web wajib: tidak ada mode riset terdegradasi

Setiap klaim, rekomendasi, dan keputusan `designer_filled` di LVR bertumpu pada riset web langsung dengan sumber terbaru yang ditemukan (keputusan pemilik D12, `.scratch/public-release/spec.md`). Keputusan: (1) **riset web = alat pencarian web yang berfungsi dan alat ambil-halaman yang berfungsi**; satu pengecekan nyata dijalankan di awal tiap skill yang mewawancarai atau meriset, dan dicatat sebagai `research_logged` dengan `purpose: "web_check"`; (2) bila pengecekan gagal, pipeline menyebut penyebabnya, memberi langkah mengaktifkan alat di harness yang dipakai, lalu **berhenti** — tidak pernah lanjut dari ingatan model; (3) setiap fakta bertanggal punya batas kesegaran per kategori (`skills/lvr-freshness.json`), fakta kunci dicek silang dengan minimal dua sumber independen, dan fakta yang tidak bisa diriset ditandai `[unverified: kategori · RQ-NNN]` di belakang riset gagal yang tercatat; (4) aturannya dicek mesin oleh `cite check` (kelompok I, aturan X8) — kontrak lengkap di `docs/spec/07-research.md`.

## Menggantikan sebagian ADR-0004

ADR-0004 mengizinkan kegagalan install Booster diteruskan dengan "output ditandai terbatas". Untuk **riset** pilihan itu dicabut: Booster riset (Firecrawl MCP, competitor-analysis, dan sejenisnya) tetap dependensi seperti di ADR-0004, tetapi tidak ada jalur "lanjut tanpa riset". Bagian lain ADR-0004 (dua tier, bootstrap check, pilihan eksplisit untuk Booster non-riset, aturan lisensi NC) tidak berubah.

## Considered options

- Mode riset terdegradasi (lanjut dengan ingatan model, ditandai terbatas): ditolak pemilik — harga, regulasi, dan versi dari ingatan model basi tanpa ketahuan, dan user non-teknis tidak bisa menilainya.
- Wajib riset hanya untuk fakta tertentu: ditolak — user tidak bisa membedakan fakta mana yang diriset dan mana yang tidak; pengecualian jadi celah.
- Riset wajib dengan berhenti jujur, penanda `unverified` hanya di belakang riset gagal yang tercatat (dipilih): kualitas tidak pernah bohong, dan setiap klaim tanpa sumber bisa ditemukan mesin.

## Pengetatan (tiket 40)

Tujuh celah dari verifikasi tiket 26 ditutup tanpa mengubah keputusan: (1) **alat web yang error bukan riset yang gagal** — `failed` dan penanda `unverified` hanya sah bila pencarian dan pengambilan halaman berfungsi namun tidak ada yang bisa dipakai; error alat = berhenti dengan panduan mengaktifkan (satu situs yang menolak, mis. 403, tidak dihitung; coba sampai 3 hasil); (2) keputusan `designer_filled` yang bertumpu pada fakta tak terverifikasi ditelusuri lewat semua tautan (`Became`, id riset gagal, keputusan lain); (3) regulasi harus dibaca ulang dan dicek amandemennya dalam 60 hari (sumber dan amend-check sama-sama); (4) setiap pemindaian Section S1–S5 mulai dengan memeriksa kesegaran Domain Brief dan meriset ulang butir kedaluwarsa; (5) kategori harus cocok dengan faktanya (harga/tarif tidak boleh diberi kategori `market` atau `general`). Aturan lengkap: `docs/spec/07-research.md` §8.2.
