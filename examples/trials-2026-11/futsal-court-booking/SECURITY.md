# Security

## Auth model

- Players have no account (D-007). A booking page is reached by its random 8-character code; lookups need the code plus the last 4 digits of the number (D-024, D-033).
- One admin account in Supabase Auth, email and password, owned by a dedicated venue email with two-step verification (D-022). Session in an HTTP-only, Secure, SameSite=Lax cookie through `@supabase/ssr`; expires after 30 days without use (D-032).
- Password reset by email (D-019). The default Supabase email sends 2 messages per hour, only to team addresses, best-effort [cite: quota · https://supabase.com/docs/guides/auth/auth-smtp · n.d. · acc 2026-11-27 · primary · live]. Add the venue email as a team member. Fallback: reset from the Supabase dashboard (HANDOVER.md) (D-055).
- Public sign-up is disabled in Supabase Auth settings. Row-level security policies allow table access only to the admin user id.

## PII inventory and protection

| Data | Where it lives | Protection |
|---|---|---|
| Booker or team name | `bookings.name`, Supabase Singapore; weekly CSV on the admin laptop | Row-level security (admin only); not on the public schedule; erased 90 days after play (D-024, D-025) |
| WhatsApp number | `bookings.phone`, `phone_last4`, `blocked_numbers.phone`; CSV | Same; masked on the booking page (`08••••••7890`); erased after 90 days; block list entries are deleted 180 days after the block unless the admin renews it (D-064) |
| Consent time and version | `bookings.consent_at`, `consent_version` | Proof of consent (D-056); kept with the booking row |
| Connection key | `attempts.key_hash` (HMAC of the IP) | Raw IP never stored; deleted after 24 hours (D-061) |
| Admin email | Supabase Auth | Supabase-managed; two-step on the mailbox (D-022) |

No sensitive (specific) data, no payment data (D-016, D-020).

## Secrets handling

- Worker secrets (`npx wrangler secret put`): `SUPABASE_SERVICE_ROLE_KEY`, `TURNSTILE_SECRET_KEY`, `CRON_SECRET`, `ATTEMPT_HMAC_SECRET`. Public vars: `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, `PUBLIC_TURNSTILE_SITE_KEY`.
- `.dev.vars` is in `.gitignore`; only `.dev.vars.example` with names is committed.
- Test hooks (`/api/test/error`, `TURNSTILE_FORCE_FAIL`, `CLEANUP_FORCE_FAIL`) exist only when `TEST_HOOKS=1`, set on preview deploys and never on production; the M4 launch check confirms `/api/test/error` returns 404 on the live address.
- The service-role key is used only by `/api/jobs/cleanup`. Never in a page, a log or the browser.
- Account logins live with the owner (HANDOVER.md), never in the repo.

## Dependencies policy

- Only: `@sveltejs/kit`, `svelte`, `@sveltejs/adapter-cloudflare`, `@supabase/supabase-js`, `@supabase/ssr`, `wrangler`, `vitest`, `typescript`. A new package needs a reason tied to an acceptance criterion.
- Pin exact versions in `package-lock.json`. Monthly builder session: `npm outdated` and `npm audit`; update, rerun `npm test` and the M0 checks (D-053).

## Compliance notes

- **UU 27/2022 (PDP law):** purpose notice and explicit consent tick box (D-017); 18+ or parent/guardian (D-050, Art. 25); storage abroad disclosed (D-051, Art. 56); breach notice within 3 × 24 hours (D-018); requests handled within 3 × 24 hours (D-025) [cite: regulation · https://jdih.kemenkeu.go.id/download/46c17b53-4a45-411c-9b76-c6799e5769fc/UU_Nomor_27_Tahun_2022%20Perlindungan%20Data%20Pribadi.pdf · pub 2022-10-17 · acc 2026-11-27 · primary · live · amend-check 2026-11-27].
- **PP 33/2026 (in force 16 January 2027, D-056, D-059)** [cite: regulation · https://www.matthewswong.com/en/blog/gr-33-2026-pdp-implementing-regulation-developers/ · pub 2026-10 · acc 2026-11-27 · live · amend-check 2026-11-27] [cite: regulation · https://pro.hukumonline.com/a/lt6a97c3fe4527c/pemerintah-akhirnya-terbitkan-kerangka-implementasi-pelindungan-data-pribadi--berlaku-mulai-16-januari-2027 · pub 2026 · acc 2026-11-27 · live · amend-check 2026-11-27]:
  - **Record of processing activities:** purpose = court booking and venue operations; data = name, WhatsApp number, booking details, consent time and version; subjects = players and guardians; recipients = Supabase (processor, Singapore), Cloudflare (hosting, Turnstile); retention = 90 days after play, CSV files 90 days; security = row-level security, TLS, two-step on the venue email.
  - **Request log:** a spreadsheet next to the weekly CSV files with columns: received date, channel (WhatsApp), type (access, correction, withdrawal = erasure, restriction, deletion), done date, note. Target: done within 3 × 24 hours.
  - **Incident policy:** on a suspected leak (wrong person sees data, lost laptop, leaked key): (1) rotate keys and change the admin password; (2) note what, when and who in the incident record; (3) within 3 × 24 hours tell affected players by WhatsApp and notify the authority; (4) keep the record.
  - **Incident record template:** date found · what happened · data and number of people affected · actions taken · players told (date) · authority told (date) · follow-up.
  - **Transfer map:** player browser (Indonesia) → Cloudflare edge → Supabase ap-southeast-1 (Singapore) under the Supabase DPA with standard contractual clauses [cite: legal · https://supabase.com/legal/dpa · pub 2026-08-01 · acc 2026-11-27 · primary · live]; CSV → admin laptop (Indonesia).
  - No data protection officer and no impact assessment needed (no large-scale monitoring, no specific data).
  - Re-read the signed text before 16 January 2027 (RQ-018; OVERVIEW.md Limitations).
- **PSE Lingkup Privat:** register through OSS after the NIB, before public opening (D-026, D-054); PM Kominfo 5/2020 still governs registration (RQ-018) [cite: legal · https://pse.komdigi.go.id/ · n.d. · acc 2026-11-27 · primary · live].
- **Regulated-domain screen (S6):** finance, health, legal absent; minors resolved by D-050; `regulated_domain` false.

## Abuse and access

| Threat | Control | Signal for the owner | Verification |
|---|---|---|---|
| Slot squatting with fake names | Max 2 upcoming per number; admin cancel and block (D-023) | Many bookings from new numbers on the admin grid | M1 step 2 |
| Scripted bulk submits | Turnstile on the server; 5 submits per 10 min per connection (D-023, D-061); Cloudflare rate-limiting rule on `/` and `/pesan` (D-055) | 429s in `wrangler tail` | M1 steps 1–2 |
| Harvesting names and numbers | Public functions return taken/closed only; row-level security (D-024) | — | M0 step 4 |
| Guessing booking codes | 8 random characters (about 31^8 combinations); 5 lookups per 10 min; one "not found" message (D-033) | 429s on `/cek` | M3 step 1 |
| Price tampering | Price read from the database (D-024) | — | M0 step 5 |
| Reaching admin data | Session check on every `/admin` load and action; row-level security (D-022) | Supabase Auth login emails | M2 step 1 |
| Data kept too long | Daily 90-day erasure (D-025, D-048) | Job warning bar | M4 steps 4–5 |
| Consent not provable | Consent time and version per booking (D-056) | — | M1 step 5 |
| Secrets in logs | Redacted logger; no names or numbers | — | M4 step 6 |

Turnstile accessibility and privacy: it runs mostly invisibly; if it blocks a real player, the WhatsApp fallback text gives a way to book (D-055).
