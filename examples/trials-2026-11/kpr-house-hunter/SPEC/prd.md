# PRD — KPR House Hunter

## Problem
In the owner's words (S0.q1, Indonesian conversation, English summary): "I want a personal tool for my own house search in Indonesia. I give it a local listings file and it filters the listings into a shortlist that fits my KPR situation. Nothing about my income or savings leaves my machine."

Today the owner copies listings from Rumah123, 99.co and Lamudi into a spreadsheet by hand (S1.q2, D-003) and checks affordability one house at a time. Houses whose installment or upfront cash is out of reach still catch the owner's attention (S1.q3).

## Context
- Market: Indonesia; target areas South Jakarta and the parts of Depok that border it (S0.q4, S1.q5).
- Device: the owner's Linux laptop; budget Rp0 per month; no paid services (D-017).
- Listings arrive as a hand-made CSV of 20–50 rows; about 100–200 listings in a typical month and 400–600 in a busy month (D-003, D-018).
- Banks test affordability at about 30% of net income, and promo rates turn into a floating rate after 1–5 years (U-08, U-12, D-035).

## Target users
One person: the owner, an individual home buyer comparing listings for their own purchase (D-005). No other users, no login (D-007).

## Value proposition
One file in, one ranked shortlist out. Every house is tested against the owner's income at the floating rate, with the age-capped tenor and the full upfront cash (DP, BPHTB, bank fees, notary and insurance), and the financial profile never leaves the laptop (D-006, D-022, D-035, D-055). None of the compared products does this for a whole listings file (R-1).

## Goals
- G1: import a listings CSV and get a ranked shortlist saved as CSV (F-01, D-008).
- G2: drop every house whose installment at the floating rate exceeds the cap, or whose upfront cash exceeds cash available (D-035, D-040).
- G3: keep cost figures current with dates and sources, with a 30-day warning (F-03, D-020).
- G4: let the owner back up, delete and restore all data (F-04, F-05, D-026).

## Non-goals
- No scraping of listing sites (D-003, R-12).
- No hosting, login, sharing or second user (D-002, D-005, D-007).
- No loan application, bank comparison for others, or financial advice (D-053).
- No network calls of the app's own (D-022).
- Parking Lot: empty — nothing was parked at the scope lock (D-062).

## Success metrics
- A file of about 200 listings becomes a saved shortlist in under 10 minutes (D-060; measured once in M2 with a stopwatch).
- A hand check of 5 shortlisted houses against the 30% rule at the floating rate finds 0 over the cap (D-060, D-004).
- Kill criteria per feature are in SCOPE.md (D-061).
