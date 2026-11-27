# PRD — Futsal Court Booking

## Problem

Players book courts by WhatsApp chat with the admin. The owner's own example (S1.q2, translated): "Two teams both got a confirmation for Friday 19:00 and clashed at the court." The admin also answers every booking chat one by one (S1.q3).

Original idea (S0.q1): "Players see open court slots and reserve one. Reservations are stored in Supabase. If two players try to reserve the same court, date, and time at once, exactly one request must win and the other must get a clear 'slot taken' answer."

## Context

- One futsal venue, 3 courts, one owner who is also the admin; South Jakarta and the bordering part of Depok. These are trial values (S1.q4, D-021).
- Open 08:00–24:00 in 1-hour slots: 48 slots a day; about 576 bookings in a normal month and about 1,000 in a busy month (D-015, trial assumption).
- Players arrive from one short link on WhatsApp Business, the Instagram bio and Google Maps (D-006).
- Players use Chrome on Android (including old small-screen phones) and Safari on iPhone. The admin uses one Android phone and one Windows laptop (D-010).
- Budget Rp 0 a month; an AI builder agent builds from this bundle and the owner writes no code (D-011, D-043).
- Players pay at the venue; no money moves through the app (D-016).

## Target users

- **Players** — the team captain, or whoever books for the team; aged 18 or over, or a parent or guardian booking for a child (D-004, D-050). No account.
- **Admin** — the venue owner, one account, on phone and laptop (D-004, D-022).

## Value proposition

Players see live open slots and get an instant, final confirmation from the venue's own link, with no app and no player fee (R-7). The venue gets one schedule for online, WhatsApp and walk-in bookings where a slot can never be held twice (D-005, D-034).

## Goals

- Zero double bookings: the database accepts one booking per court and hour (D-005, D-027).
- Players book, and cancel up to 3 hours before, without chatting with the admin (D-028, D-035).
- The owner changes prices and closes hours without a developer (D-036, D-031).
- The owner keeps a weekly copy of the data outside Supabase (D-013, D-052).
- Personal data handling meets UU 27/2022 and PP 33/2026 (D-017, D-025, D-050, D-051, D-056).
- Running cost Rp 0 a month on free plans (D-011, D-046).

## Non-goals

- Parking lot for later versions (SCOPE.md): online deposit (DP), automatic WhatsApp reminders, membership or subscriptions, revenue reports (D-038).
- No player accounts or logins (D-007).
- No store app (D-003).
- No more than one venue and one admin account (S1.q4, D-022).
- No automatic national holiday calendar; the admin adds holidays by hand (D-039).

## Success metrics

Measured from the weekly CSV (F-05), per D-053:

| Metric | Target | Kill criterion |
|---|---|---|
| Share of bookings made online | At least 70% by month 6 | F-01: under 30% after 2 months → rethink the booking flow |
| Schedule clashes | 0 a month by month 6 | F-02: more than 1 clash a month → fix the admin screen |
| Cancellations through the page | — | F-03: under 1 in 5 after 2 months → rethink the cancel flow |
| Price changes by the owner | — | F-04: no change in 6 months → simplify in the next version |
| Weekly downloads | One a week | F-05: no download 3 weeks running → move to an automatic export |

Baseline: count booking chats in the week before launch (D-053).
