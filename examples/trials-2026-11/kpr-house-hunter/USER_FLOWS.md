# User flows

Laptop-first layout (D-047). Screen text is Indonesian (D-009). First run: the Import page shows a three-step guide and a link to `sample/contoh-listing.csv` (D-047).

## F-01 — Import listings and build the shortlist (in-MVP)
```text
./start.sh ─> bookmark 127.0.0.1:8000 ─> [Impor CSV] ─> Pilih file ─> Preview
   ─> [Impor] ─> Shortlist (lolos / dana tunai belum lengkap / ditolak) ─> [Simpan CSV] ─> file saved
```
1. Run `./start.sh` and open the bookmark; the Import CSV page appears.
2. Click **Pilih file** and choose the CSV ("," or ";", Indonesian price formats, D-057).
3. Read the preview: rows read, rejected rows with row number and reason, dropped agent columns.
4. Click **Impor**. The Shortlist page opens.
5. Passing houses appear in order: most nice-to-haves met, then smallest upfront cash (D-036). Each row shows installment during promo and after promo, tenor used, upfront cash and notes (SLIK OJK note D-013, scam-price flag D-032, certificate note D-033).
6. Click **Simpan CSV**. Done: the shortlist CSV is downloaded (D-008).
- **Alternatives:** file too big or bad header → refused with a message, nothing stored · same link again → "X listing diperbarui" · tab closed in preview → nothing imported · no profile yet → "Isi profil keuangan dulu", must-haves only · house older than 30 days → "cek apakah masih dijual".

## F-02 — Set profile and criteria (in-MVP)
```text
[Profil & Kriteria] ─> Keuangan ─> KPR per bank ─> Wajib ─> Diinginkan ─> [Simpan] ─> "Tersimpan <tanggal>" ─> Shortlist recalculated
```
1. Open **Profil & Kriteria**.
2. Fill Keuangan: net monthly income, other installments, cash available, current age.
3. Fill KPR per bank: minimum DP, promo rate and length, floating rate, tenor, maximum tenor, maximum age at loan end, cap.
4. Fill must-have criteria: max price, area, min bedrooms, min land area, new/resale/both.
5. Tick nice-to-haves: larger building, more bedrooms, SHM, new house.
6. Click **Simpan**. Done: "Tersimpan" with the date; the shortlist recalculates.
- **Alternatives:** invalid field → message, Simpan disabled · leaving with unsaved changes → warning · outdated tab → "Data sudah diubah di tab lain — muat ulang" · notary/insurance empty → houses go to "Dana tunai belum lengkap".

## F-03 — Update default figures (in-MVP)
```text
yellow banner ─> Angka bawaan (Profil & Kriteria) ─> open source link ─> edit or [Tandai sudah dicek] ─> [Simpan] ─> banner gone
```
1. Click the yellow banner "N angka bawaan lebih dari 30 hari — perbarui".
2. The Angka bawaan part lists NPOPTKP per area, bank fees per bank, notary and insurance estimates, each with its date and source link.
3. Open the source; edit the value, or click **Tandai sudah dicek**.
4. Click **Simpan**. Done: dates become today, the banner disappears, the shortlist recalculates.
- **Alternatives:** invalid amount → field message · clicked twice → only the date refreshes · laptop date earlier than saved → no banner, no error.

## F-04 — Export backup and delete data (in-MVP)
```text
footer "Data & privasi" ─> [Ekspor cadangan] ─> warning ─> [Lanjut] ─> kpr-cadangan-YYYY-MM-DD.json
                         └> Hapus: semua | per impor | profil saja ─> type HAPUS ─> [Hapus] ─> "Data dihapus"
```
1. Open **Data & privasi** from the footer link.
2. Click **Ekspor cadangan**, read the warning that the file is not encrypted, click **Lanjut**. The file downloads.
3. To delete: choose all data, one import file, or the financial profile only; type HAPUS; click **Hapus**. Done: "Data dihapus".
- **Alternatives:** download cancelled → nothing changes, backup reminder stays · word other than HAPUS → button stays disabled · double click → locked after the first.

## F-05 — Restore from backup (in-MVP)
```text
"Data & privasi" ─> [Pulihkan dari cadangan] ─> choose file ─> summary + warning ─> type PULIHKAN
   ─> automatic backup of current data ─> restore ─> "Data dipulihkan"
```
1. On **Data & privasi** click **Pulihkan dari cadangan**.
2. Choose the backup file.
3. Read the listing count and profile date, and the warning that current data will be replaced.
4. Type PULIHKAN and confirm. Done: the app saves an automatic backup of current data, then restores.
- **Alternatives:** not a backup file or a newer version → refused before any change · failure midway → previous data back, page says so · double click → locked.
