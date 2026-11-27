# Handover (owner guide)

## How to run it

The website runs by itself on Cloudflare. You do not start anything.
1. Open `https://<domain>/` on any phone to see the schedule.
2. Open `https://<domain>/admin` and log in with the venue email and password to run the day.
3. If a page shows an error, open `https://<domain>/health`. "ok" means the site works. Anything else: see Alerts and recovery.

## How to deploy and update

- The AI builder agent deploys. You do not run code (D-043).
- Rhythm: one builder session a month for updates and checks (D-053). Before each update, download the CSV.
- After each update, the builder reruns the M0 checks in VERIFICATION.md and shows you the result.
- The domain (.biz.id) renews by itself every year. Keep auto-renew on and read the reminder emails (D-014).

## How to back up

- Every week, on the laptop: `/admin` → "Pengaturan" → "Unduh data" → "Unduh semua data (CSV)" (F-05).
- Keep the files in one folder on a laptop with a password. Delete files older than 90 days (D-025).
- Keep the data-request log spreadsheet in the same folder (SECURITY.md).
- Restore test: once at M4, then once every 3 months, the builder restores the latest file into a spare Supabase project. Target: under 30 minutes. Write the time here: ______

## Where secrets and API keys live

- One venue email with two-step login owns every account: Cloudflare, Supabase, the domain registrar (Rumahweb) (D-022).
- API keys live in the Cloudflare Worker settings (secrets) and the Supabase dashboard. Never paste them into chat or documents.
- Admin website password: in your password manager or a written note kept at home, not on the laptop desktop.

## Who to ask what

| Part | Who |
|---|---|
| Bookings, prices, closures, blocks | You (admin pages) |
| Code changes, updates, checks | The AI builder agent, using this bundle |
| Website hosting and Turnstile | Cloudflare dashboard (venue email) |
| Database and admin login | Supabase dashboard (venue email) |
| Domain | Rumahweb account (venue email) |
| NIB and PSE registration | You, through OSS (D-054) |
| Player data requests | You, via WhatsApp, within 3 × 24 hours (D-025, D-056) |

**Launch steps:** NIB in OSS in the week M0 starts; PSE registration once M1 is live; WhatsApp Business quick reply "Booking sekarang lewat {link}, langsung terkonfirmasi." in the first month (D-053, D-054).

## Alerts and recovery

| Warning | What you see | What to do |
|---|---|---|
| Daily job failed | Yellow bar with text on `/admin` | Same day: send the builder the bar text; check the Supabase dashboard |
| Data not downloaded | "Sudah {n} hari sejak data terakhir diunduh" | Download the CSV now |
| Supabase pause email | Email to the venue email | Open the Supabase dashboard → project → "Restore"; then check `/health` |
| Site shows Error 1027 | Error page instead of the schedule | Wait until 07.00 WIB; take bookings by WhatsApp and enter them next morning |
| Booking form says "Pemesanan online sedang gangguan" | Text with a WhatsApp link | Take bookings by WhatsApp; tell the builder if it lasts over 1 hour |
| Reset email not arriving | No email after 10 minutes | Supabase dashboard → Authentication → Users → the venue email → "Send password recovery", or ask the builder to set a new password there |
| Lost laptop or leaked password | — | Follow the incident policy in SECURITY.md within 3 × 24 hours |
