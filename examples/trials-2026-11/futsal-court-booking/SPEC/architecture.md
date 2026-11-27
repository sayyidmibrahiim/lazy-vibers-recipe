# Architecture

## Stack

| Part | Choice | Why |
|---|---|---|
| Web framework | SvelteKit 3.4.1, TypeScript, `@sveltejs/adapter-cloudflare` | Server form actions carry the booking write, the Turnstile check and the database refusal; light server-rendered pages for old Android phones; best agent-build signals (rank 96) — DECISIONS.md D-046 [cite: version · https://registry.npmjs.org/@sveltejs/kit/latest · upd 2026-11-25 · acc 2026-11-27 · primary · live] |
| Hosting | Cloudflare Workers Free | Rp 0, business use allowed in the terms, over-limit outage lasts at most until midnight UTC — D-046, D-012 [cite: price · https://developers.cloudflare.com/workers/platform/pricing/ · upd 2026-11-18 · acc 2026-11-27 · primary · live] |
| Database | Supabase Free, Postgres, ap-southeast-1 (Singapore) | Shared online store with a database-level one-winner constraint and row-level security — D-047, D-049 |
| Admin login | Supabase Auth, email and password, `@supabase/ssr` cookies | One admin account on the venue email — D-022 |
| Human check | Cloudflare Turnstile Free, verified on the server | Blocks scripted submits; free — D-023 |
| Scheduled job | One Cloudflare Cron Trigger (1 of 5 free) | 90-day erasure and database keep-alive — D-048 |
| Tests | Vitest (unit), Node scripts (`race-test`, `abuse-test`, `admin-test`) | One-winner and limits proven by scripts — S8 |

Version evidence: [cite: version · https://registry.npmjs.org/@sveltejs/kit/latest · upd 2026-11-25 · acc 2026-11-27 · primary · live]. Re-check versions if the build starts after 2026-12-11 (D-046, R-9).

## Components

- **Public pages** — schedule `/`, booking form `/pesan`, confirmation `/booking/<code>`, lookup `/cek`, privacy and terms pages (F-01, F-03).
- **Admin pages** — `/admin` grid, booking detail, manual booking, close hours, block list, prices and holidays, data download (F-02, F-04, F-05).
- **Server actions** — validate input, verify Turnstile, count attempts, call Postgres functions, map errors to the envelope in SPEC/api.md.
- **Postgres functions** — `public_schedule(date)` (taken/closed per cell, no personal fields), `book_slot(...)`, `find_booking(code, last4)`, `cancel_booking(code)`; `security definer`, fixed `search_path`.
- **Unique index `bookings_one_winner`** — the one-winner rule (D-027, R-8).
- **Cleanup endpoint and Cron Trigger** — `/api/jobs/cleanup`, called daily at 20:00 UTC (03.00 WIB).
- **Time helper** — `src/lib/time.ts`, the only place that converts UTC to WIB (D-027).

## Data flow

```text
Player phone (Chrome Android / Safari iPhone)
   |  HTTPS, short link from WhatsApp / Instagram / Google Maps
   v
Cloudflare Workers Free  -- SvelteKit server (load + form actions)
   |  1. verify Turnstile token ---------------> Cloudflare Turnstile siteverify
   |  2. count attempts, validate input
   |  3. rpc book_slot() with anon key
   v
Supabase Free (Postgres, Singapore)
   |  unique index bookings_one_winner -> one row wins, the other gets 23505
   v
Worker maps result -> 303 to /booking/<code>  or  409 "Slot sudah diambil"

Admin phone / laptop --> /admin (Supabase Auth session cookie) --> row-level security --> tables
Cloudflare Cron Trigger (daily 20:00 UTC) --> POST /api/jobs/cleanup (bearer secret)
   --> erase names and numbers 90 days after play, delete old attempts, write job_runs
Admin laptop --> /admin/pengaturan/unduh/csv --> CSV file on the laptop (weekly backup)
```

## Folder structure

```text
futsal-court-booking/
├── src/
│   ├── lib/
│   │   ├── server/
│   │   │   ├── supabase.ts        # anon, session and service clients
│   │   │   ├── turnstile.ts       # siteverify call
│   │   │   ├── attempts.ts        # 5 per 10 minutes, HMAC of the IP (D-061)
│   │   │   ├── errors.ts          # error envelope and code -> message map
│   │   │   └── log.ts             # redacted error log
│   │   ├── time.ts                # UTC <-> WIB, slot helpers
│   │   ├── phone.ts               # normalise +62, last 4 digits
│   │   ├── price.ts               # regular / peak / holiday rule
│   │   └── copy.id.ts             # Indonesian UI copy keys (UI_SPEC.md)
│   ├── routes/
│   │   ├── +page.svelte, +page.server.ts          # schedule
│   │   ├── pesan/, booking/[code]/, cek/
│   │   ├── kebijakan-privasi/, syarat/, health/
│   │   ├── admin/ (login, lupa-sandi, booking/, tutup/, blokir/, pengaturan/)
│   │   └── api/jobs/cleanup/+server.ts
│   └── hooks.server.ts            # session, request id, security headers
├── supabase/migrations/0001_init.sql
├── scripts/race-test.ts, abuse-test.ts, admin-test.ts, restore.ts
├── tests/                         # Vitest unit tests
├── wrangler.jsonc                 # Worker, cron trigger, vars
├── .dev.vars.example              # names of secrets, no values
└── package.json
```

## Local run

```sh
npm create svelte@latest futsal-court-booking   # once, TypeScript, then add the adapter
npm install
npm install -D @sveltejs/adapter-cloudflare wrangler vitest
npm install @supabase/supabase-js @supabase/ssr
cp .dev.vars.example .dev.vars    # fill PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY,
                                  # PUBLIC_TURNSTILE_SITE_KEY, TURNSTILE_SECRET_KEY, CRON_SECRET, ATTEMPT_HMAC_SECRET
npx supabase link --project-ref <ref> && npx supabase db push   # apply migrations
npm run dev                       # http://localhost:5173
npm run build && npx wrangler dev # Worker runtime at http://localhost:8787
npm test                          # unit tests
npx wrangler deploy               # deploy to Workers
```

Use the Turnstile test keys from the Cloudflare docs for local runs and automated tests.

## Failure points

| What breaks | What it looks like | Response |
|---|---|---|
| Workers Free daily limit (100,000 requests) | Error 1027 page until midnight UTC (07.00 WIB) [cite: quota · https://developers.cloudflare.com/workers/platform/limits/ · upd 2026-11-25 · acc 2026-11-27 · primary · live] | Players book by WhatsApp; admin enters them by hand next morning; if it happens twice in a month, ask the owner about Workers Paid (D-044) |
| CPU time over 10 ms per request | Requests fail with an exceeded-resources error | Measured in M0 (criterion 6); keep work in Postgres functions; else raise D-044 (R-5) |
| Supabase project paused (7 days of low activity) | `/health` returns `503 db`; pages show the site-down text | Daily job keeps it active; restore from the dashboard within 1 year (R-4, D-048) |
| Supabase unreachable | `503`; booking form shows "Pemesanan online sedang gangguan. Hubungi admin lewat WhatsApp" | WhatsApp fallback (D-055) |
| Turnstile unreachable or failing | `captcha_unavailable` | Same WhatsApp fallback text and link (D-055) |
| Default Supabase email (2 per hour, team addresses only) | Reset email late or missing | Reset the password from the Supabase dashboard (HANDOVER.md) [cite: quota · https://supabase.com/docs/guides/auth/auth-smtp · n.d. · acc 2026-11-27 · primary · live] |
| Cron job failure | `job_runs` shows `failed` or no row for 2 days | Admin warning bar; open the Supabase dashboard the same day (M4) |
| Domain not renewed | The link stops working everywhere | Auto-renew on, reminders to the venue email (D-014) |
| WIB/UTC mistakes | Wrong day's tabs near midnight | Only `time.ts` converts; unit test 16:59Z vs 17:01Z (M1) |

**Bad month (D-055):** the worst realistic case is a viral link or a bot spike that passes 100,000 requests in a day. The site is down for the rest of that UTC day, at most about 17 hours if it starts at 07.00 WIB. Bookings fall back to WhatsApp for that day; no data is lost. The cost to avoid it is Workers Paid, USD 5 a month [cite: price · https://developers.cloudflare.com/workers/platform/pricing/ · upd 2026-11-18 · acc 2026-11-27 · primary · live].

**One-way doors (D-055):**
- Supabase region: fixed when the project is created (Singapore, D-049). Changing it means a new project plus a CSV restore.
- Domain name: printed on Instagram, Google Maps and shared WhatsApp messages; changing it breaks every shared link (D-014).
- Booking code format and `/booking/<code>` URL: players keep these links; keep them working for at least 90 days after any change.
- Consent text version: stored per booking (`v1`); a new text needs a new version, never an edit of `v1` (D-056).

## Data sources and integrations

| Source | Origin and owner | Fields or events | Access boundary | Terms and evidence | Refresh | When stale or down |
|---|---|---|---|---|---|---|
| Player bookings | First-party; typed by players; the venue (owner) is the data controller | name, WhatsApp number, court, slot, consent time and version | Public functions return taken/closed only; admin reads under row-level security | Consent per D-017, D-050; UU 27/2022 and PP 33/2026 duties in SECURITY.md (D-056) | Live, per submit (S3.q1) | Database down → WhatsApp fallback text |
| Admin entries | First-party; the admin | manual bookings, attendance, closures, prices, holidays, blocks | Admin session only | D-022, D-032 | Live (S4.q7) | Same as above |
| Supabase (Postgres, Auth, email) | Third party, Supabase Inc.; data in Singapore | all tables; reset emails | Anon key for public functions; admin session; service-role key only in the cleanup job | DPA with standard contractual clauses [cite: legal · https://supabase.com/legal/dpa · pub 2026-08-01 · acc 2026-11-27 · primary · live]; terms show no free-plan non-commercial clause (R-6, RQ-018) [cite: legal · https://supabase.com/terms · n.d. · acc 2026-11-27 · primary · live] | Live | Pause after 7 days idle; daily keep-alive (D-048) |
| Cloudflare Workers and Cron | Third party, Cloudflare | requests, daily cron event | Worker secrets for keys | Terms allow business use; reselling barred [cite: legal · https://www.cloudflare.com/terms/ · upd 2025-09-12 · acc 2026-11-27 · primary · live] | Daily cron at 20:00 UTC | Error 1027 until midnight UTC; failed cron → warning bar |
| Cloudflare Turnstile | Third party, Cloudflare | token per submit; sees the visitor's browser signals | Secret key in Worker secrets | Free plan [cite: price · https://developers.cloudflare.com/turnstile/plans/ · upd 2026-08-14 · acc 2026-11-26 · primary · live] | Per submit | Fallback text with the venue WhatsApp link (D-055) |
| WhatsApp share and chat links | Third party; opened by the player or admin | `wa.me` link with prefilled text; no API call | No data sent by the server | Plain links, no account or API needed (S1.q7, D-008) | n/a | n/a |
| Weekly CSV | First-party export to the admin laptop | all tables | Admin session; file on a password-protected laptop | D-013, D-025, D-052 | Weekly by hand (S4.q15) | Reminder bar after 7 days |

No imported data sets, no payment provider (D-016), no AI model services.

## Quality targets

| Area | Target | Owner | Milestone | Proof | Decision |
|---|---|---|---|---|---|
| One winner per slot | 20 parallel submits → 1 confirmed, 19 slot taken | builder | M0, M4 | M0 criterion 3 | D-027 |
| Time zones | Stored in UTC, shown and judged in WIB; the booking day is the WIB day | builder | M1 | M1 criterion 4 | D-027 |
| Browsers and devices | Chrome Android incl. 360 px, Safari iPhone; admin on Android phone and Windows laptop | builder | M1, M2 | M1 criterion 8, M2 criterion 6 | D-010 |
| Accessibility | Text ≥ 16 px, targets ≥ 44 × 44 px, status as words, WCAG AA contrast | builder | M1 | M1 criterion 8, UI_SPEC.md | D-041 |
| Performance | CPU under 10 ms per request at p95 | builder | M0 | M0 criterion 6 | D-046 |
| Error tracking | Server errors in the Workers log with a request id, no names or numbers | builder | M4 | M4 criterion 6 | D-056 |
| Availability | `/health` returns `ok`; checked at every milestone and before opening; no uptime promise on free plans | builder | M0, M4 | M0 criterion 1, M4 criterion 7 | D-046 |
| Owner alerts | Admin warning bar when the daily job fails; Supabase emails to the venue email; response the same day | owner | M4 | M4 criterion 5 | D-048, D-022 |
| Restore | Weekly CSV; restore into a disposable project within 30 minutes; files older than 90 days deleted | owner | M4 | M4 criterion 3 | D-013, D-052 |
| Abuse and load | Turnstile, number and connection limits, rate-limiting rule, fallback texts | builder | M1 | M1 criteria 1, 2, 7 | D-023, D-055 |
