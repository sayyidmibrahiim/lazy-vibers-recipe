# Futsal Court Booking — plain-language overview

## What this is

Futsal Court Booking is a website for your futsal venue. Players open one link. They see which courts are free today and in the next 14 days. They book one hour in a few taps. They need no account and no app install.

Today, players book by WhatsApp chat. Two teams once got the same Friday 19:00 slot and clashed at the court (S1.q2). This website stops that. When two players book the same court and hour at the same moment, only one gets it. The other sees "Slot sudah diambil" and picks another hour.

You also get an admin page. You put WhatsApp and walk-in bookings there too, so there is one schedule for everything.

The venue details in this plan are test values: one venue, 3 courts, one admin, in South Jakarta (S1.q4).

## What was decided

- **A website, not a store app.** Players open it from a link. Nothing to install (D-003).
- **Players book without an account.** Only you log in, with the venue email and a password (D-007, D-022).
- **One winner per slot.** The database itself refuses a second booking for the same court and hour (D-027).
- **No online payment yet.** Players pay at the venue. A deposit by QRIS is parked for later (D-016).
- **Five features in the first version:** book a slot, admin daily schedule, cancel my booking, set prices, weekly data download (D-057).
- **Free services only.** Cloudflare runs the website. Supabase stores the bookings in Singapore. Cloudflare Turnstile checks that a visitor is a person (D-046, D-049).
- **Your own web address** ending in .biz.id. You buy it when building starts (D-014, D-060).
- **Personal data is kept short.** Names and WhatsApp numbers are erased 90 days after the game (D-025).
- **Bookers must be 18 or older,** or a parent booking for a child (D-050).
- **Built in five steps,** M0 to M4. Each step is checked before the next one starts (D-058).

## What it costs

| Item | Price | When | Source |
|---|---|---|---|
| Website hosting (Cloudflare Workers Free) | USD 0; up to 100,000 visits and actions a day | every month | [cite: price · https://developers.cloudflare.com/workers/platform/pricing/ · upd 2026-11-18 · acc 2026-11-27 · primary · live] |
| Person check (Cloudflare Turnstile Free) | USD 0 | every month | [cite: price · https://developers.cloudflare.com/turnstile/plans/ · upd 2026-08-14 · acc 2026-11-26 · primary · live] |
| Booking database and admin login (Supabase Free) | USD 0; 500 MB database | every month | [cite: price · https://supabase.com/pricing · n.d. · acc 2026-11-27 · primary · live] |
| Web address .biz.id (Rumahweb) | Rp 9.900 the first year | once, when building starts | [cite: price · https://www.rumahweb.com/domain-murah/ · n.d. · acc 2026-11-26 · primary · live] |
| Web address renewal | Rp 60.000 a year | every year from year 2 | [cite: price · https://www.rumahweb.com/domain-murah/ · n.d. · acc 2026-11-26 · primary · live] |
| **Total every month** | **Rp 0** | | |
| **Total one-time (first year)** | **Rp 9.900** | | |

A busy month of about 1,000 bookings uses about 2% of the free daily limit (RESEARCH.md, cost table).

If a free limit is ever reached, a paid plan is the fix. You are always asked first:
- Cloudflare Workers Paid costs USD 5 a month [cite: price · https://developers.cloudflare.com/workers/platform/pricing/ · upd 2026-11-18 · acc 2026-11-27 · primary · live] (D-044).
- Supabase Pro costs from USD 25 a month [cite: price · https://supabase.com/pricing · n.d. · acc 2026-11-27 · primary · live] (D-045).

Your time: about 15 minutes a week for the data download and service emails. One AI builder session a month for updates (D-053).

## How you will use it

**Before opening (your tasks):**
1. Get an NIB (business number) through OSS. Start in the week building starts (D-054).
2. Register the website as a private electronic system (PSE) in OSS before public opening (D-054).
3. Make one venue email with two-step login. Every service account uses it (D-022).

**A normal day:**
1. A player taps your link on WhatsApp, Instagram or Google Maps. Today's schedule opens.
2. The player taps a free hour, types a name and WhatsApp number, ticks the age box and taps "Pesan slot ini".
3. The player sees a booking code at once and can share it on WhatsApp.
4. You open the admin page on your phone. You see every booking for the day, online and manual.
5. A team books by chat? Tap the empty hour and add it by hand. The hour closes for everyone.
6. After the game, tap "Datang" or "Tidak datang". Two no-shows block that number from online booking.

**Every week:** tap "Unduh semua data (CSV)" on the laptop. Keep the file in one folder. Delete files older than 90 days.

**First month:** answer booking chats with a WhatsApp quick reply: "Booking sekarang lewat {link}, langsung terkonfirmasi." (D-053).

**How you know it works (by month 6):** at least 70% of bookings are made online, and there are zero clashes (D-053).

## What is parked

- Online deposit (DP) by QRIS — the first version takes no money.
- Automatic WhatsApp reminders — would add a paid sending service.
- Membership or subscriptions — later version.
- Revenue reports — the weekly download covers manual checks for now.

## Limitations

- The venue facts (3 courts, South Jakarta, 08:00–24:00, about 576 bookings a month) are test values, not real venue data (S1.q4, D-015).
- From S1.q5 on, a test agent answered the questions on the owner's behalf. A real owner should read DECISIONS.md and confirm.
- The signed text of PP 33/2026 (the data-protection rules in force from 16 January 2027) could not be opened on an official site. The plan rests on two independent legal summaries. Re-read the signed text before 16 January 2027 (D-056, RQ-018).
- No official processing time was found for the NIB or the PSE registration. Start early (D-054).
- The Supabase terms show no ban on business use of the free plan, but part of the reading was a summary (R-6, RQ-018). You can ask Supabase support to confirm in writing.
- On a very bad day with over 100,000 visits, the website shows an error until 07.00 WIB the next morning. Players then use WhatsApp (R-5, D-055).
- Supabase Free makes no automatic backups. Your weekly download is the only backup (D-013, D-052).
- The framework check is dated 2026-11-27. Re-check it if building starts after 2026-12-11 (D-046).
- Colour contrast was checked on paper. Font size, tap size and screen checks run on the built website in M1 (UI_SPEC.md).
