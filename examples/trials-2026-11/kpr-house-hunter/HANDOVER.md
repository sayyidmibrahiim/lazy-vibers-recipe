# Handover (owner guide)

## How to run it
1. Open the Terminal app.
2. Go to the project folder, for example: `cd ~/kpr-house-hunter`.
3. Type `./start.sh` and press Enter. Wait for the line `http://127.0.0.1:8000/`.
4. Open Firefox or Chromium and go to `http://127.0.0.1:8000/`. Save it as a bookmark.
5. To stop the app, go back to the Terminal and press Ctrl+C. Nothing keeps running after that (D-019).

First install (done once by the builder, or by you):
```sh
python3 -m venv .venv
.venv/bin/pip install "Django==6.1.3"
```
If this shows "externally-managed-environment", you typed `pip` without `.venv/bin/` in front (D-058).

If you ever want Python 3.15 instead of the installed 3.14: it is not needed, because 3.14 is supported until 2030-10 (D-050). If you still want it, install it from python.org or your Linux package manager, then create `.venv` again with `python3.15 -m venv .venv` and repeat the install line.

## How to deploy and update
- "Deploy" means: the project folder on your laptop. There is no server (D-002).
- Once a month (about 15 minutes, D-020): start the app, click the yellow bar if it shows, check each figure's source link, update or click **Tandai sudah dicek**, then **Simpan**.
- When a bank promo ends, update that bank's rates in Profil & Kriteria (R-5).
- Updates to the app itself: ask your builder agent to check for a Django 6.1.x security release, run `.venv/bin/python manage.py test`, and only then use the new version.

## How to back up
- When the yellow bar reminds you (together with the 30-day figure check, D-030), open **Data & privasi** → **Ekspor cadangan**. A file `kpr-cadangan-YYYY-MM-DD.json` is saved.
- Keep the file on your laptop or a private flash drive. Do not upload it to cloud storage or chat: it holds your income and savings and is not encrypted (D-031).
- To restore: **Data & privasi** → **Pulihkan dari cadangan** → choose the file → type PULIHKAN. The app saves a copy of your current data first.
- Test a restore once after M4 (VERIFICATION.md): export, restore, and check the same houses appear.

Check your disk encryption once (D-025):
```sh
lsblk -f
```
If you see `crypto_LUKS` on the main disk, your disk is encrypted. If not, your data is readable by anyone who takes the laptop. Turning on encryption usually means reinstalling Linux with the "encrypt disk" option, so back up first. Tick "Saya sudah cek enkripsi disk" on the Profile page when done.

## Where secrets and API keys live
- There are no accounts, API keys or passwords (D-014).
- The app's own random key is in `data/secret_key`. Do not share or upload the `data/` folder.
- Your money data lives in `data/kpr.sqlite3` on your laptop and in your backup files.

## Who to ask what
| Part | Who |
|---|---|
| Your income, cash, age and criteria | you |
| Bank rates, fees, maximum age and tenor | the bank (its KPR page or branch) |
| Notary/PPAT fee and insurance estimate | a notary/PPAT, or the bank |
| BPHTB and NPOPTKP (Depok, first-home relief) | Bapenda DKI Jakarta or Bapenda Depok, or a notary |
| The app breaks or needs a change | your builder agent, starting from AGENTS.md; new features go through /lvr-add-feature |

## Alerts and recovery
- **Yellow bar "angka bawaan lebih dari 30 hari"** — check the listed figures (above). Also the moment to make a backup.
- **"Belum lengkap" on many houses** — fill in notary and insurance estimates in Angka bawaan.
- **"Terjadi kesalahan. Data Anda tidak berubah."** — stop the app (Ctrl+C), start it again. If it repeats, restore your latest backup.
- **The page does not open** — check the Terminal still runs `./start.sh`; if it says the port is busy, close the other program or restart the laptop.
- **After a laptop loss or a broken disk** — on a new laptop, install as above, start the app, and restore your latest backup file.
