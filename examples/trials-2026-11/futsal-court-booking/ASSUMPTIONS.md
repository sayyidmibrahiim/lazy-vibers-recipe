# Assumptions

Every decision not confirmed by the owner. Note: all owner answers from S1.q5 on came from a delegated test agent; a real owner should also re-read DECISIONS.md.

## D-001 — The product has two sides: a player booking page and a separate venue-manager side for the schedule and reservations (designer_filled)
- **Why:** Designer default shown to the owner for correction; never explicitly confirmed as its own answer. Basis: Players reserve slots (S0.q1), and someone at the venue must see and manage those reservations; comparable owner tools offer schedule management, availability settings and reports per U-14 
- **How to replace or confirm:** Ask the owner: "Do you accept D-001 as written in DECISIONS.md?" A yes becomes a user_confirmed decision; a no reopens it through /lvr-add-feature or a plan review.

## D-002 — Ship as a website players open from a link, built so it can also be installed to the phone home screen (installable web app); no Play Store (designer_filled)
- **Why:** Designer default shown to the owner for correction; never explicitly confirmed as its own answer. Basis: The owner asked for a web app (S0.q1). Per U-16 an installable web app gets a home-screen icon without an app store 
- **How to replace or confirm:** Ask the owner: "Do you accept D-002 as written in DECISIONS.md?" A yes becomes a user_confirmed decision; a no reopens it through /lvr-add-feature or a plan review.

## D-009 — Backups are a planned duty: while the database runs on Supabase Free, the plan includes a scheduled automatic export of all reservations at (designer_filled)
- **Why:** Designer default shown to the owner for correction; never explicitly confirmed as its own answer. Basis: Per U-07, Supabase Free has no automatic backups and Supabase tells free projects to export their own data 
- **How to replace or confirm:** Ask the owner: "Do you accept D-009 as written in DECISIONS.md?" A yes becomes a user_confirmed decision; a no reopens it through /lvr-add-feature or a plan review.

## D-017 — Privacy at launch: a privacy-policy page, plus a short notice on the booking form stating why the name and WhatsApp number are kept, with an (designer_filled)
- **Why:** Designer default shown to the owner for correction; never explicitly confirmed as its own answer. Basis: Per U-01, UU 27/2022 Article 20 requires a lawful basis such as explicit consent for a stated purpose 
- **How to replace or confirm:** Ask the owner: "Do you accept D-017 as written in DECISIONS.md?" A yes becomes a user_confirmed decision; a no reopens it through /lvr-add-feature or a plan review.

## D-018 — Data-breach procedure: a written step-by-step plan in the handover documents to notify affected players (via their stored WhatsApp numbers) (designer_filled)
- **Why:** Designer default shown to the owner for correction; never explicitly confirmed as its own answer. Basis: Per U-02, UU 27/2022 Article 46(1) sets this 3 x 24-hour written notice duty 
- **How to replace or confirm:** Ask the owner: "Do you accept D-018 as written in DECISIONS.md?" A yes becomes a user_confirmed decision; a no reopens it through /lvr-add-feature or a plan review.

## D-019 — Admin password reset: a "forgot password" link sends a reset email to the admin email address; no other recovery path (designer_filled)
- **Why:** Designer default shown to the owner for correction; never explicitly confirmed as its own answer. Basis: The admin pages require login (D-007); without a reset path, a forgotten password locks the owner out of the schedule. Designer-surfaced because owners rarely ask what happens after "forgot password".
- **How to replace or confirm:** Ask the owner: "Do you accept D-019 as written in DECISIONS.md?" A yes becomes a user_confirmed decision; a no reopens it through /lvr-add-feature or a plan review.

## D-027 — F-01 routine recovery defaults: no slot hold while the form is open (a slot is taken only at submit); each form carries a one-time request k (designer_filled)
- **Why:** Designer default shown to the owner for correction; never explicitly confirmed as its own answer. Basis: deliver-edge-cases on F-01 (abandon, retry, expiry); the one-winner rule itself is the database refusal per U-08. Shown to the owner for correction.
- **How to replace or confirm:** Ask the owner: "Do you accept D-027 as written in DECISIONS.md?" A yes becomes a user_confirmed decision; a no reopens it through /lvr-add-feature or a plan review.

## D-032 — F-02 routine defaults: manual bookings by the admin skip Turnstile and the 2-upcoming limit, WhatsApp number optional; the same database rul (designer_filled)
- **Why:** Designer default shown to the owner for correction; never explicitly confirmed as its own answer. Basis: deliver-edge-cases on F-02. Shown to the owner for correction.
- **How to replace or confirm:** Ask the owner: "Do you accept D-032 as written in DECISIONS.md?" A yes becomes a user_confirmed decision; a no reopens it through /lvr-add-feature or a plan review.

## D-033 — F-03 routine defaults: a booking is found by its code plus the last 4 digits of the WhatsApp number, with one message "Booking tidak ditemuk (designer_filled)
- **Why:** Designer default shown to the owner for correction; never explicitly confirmed as its own answer. Basis: deliver-edge-cases on F-03, aligned with D-023 and D-024. Shown to the owner for correction.
- **How to replace or confirm:** Ask the owner: "Do you accept D-033 as written in DECISIONS.md?" A yes becomes a user_confirmed decision; a no reopens it through /lvr-add-feature or a plan review.

## D-039 — F-04 routine defaults: prices are whole rupiah per hour between Rp 1 and Rp 5.000.000; the admin adds holiday dates by hand (no automatic na (designer_filled)
- **Why:** Designer default shown to the owner for correction; never explicitly confirmed as its own answer. Basis: deliver-edge-cases on F-04; follows D-024 (price read from the database). Shown to the owner for correction.
- **How to replace or confirm:** Ask the owner: "Do you accept D-039 as written in DECISIONS.md?" A yes becomes a user_confirmed decision; a no reopens it through /lvr-add-feature or a plan review.

## D-044 — Paid fallback for hosting: if the 100,000 requests/day Workers Free limit is ever hit, move to Cloudflare Workers Paid (USD 5 per month mini (designer_filled)
- **Why:** Designer default shown to the owner for correction; never explicitly confirmed as its own answer. Basis: Free tiers have cliffs; price per RQ-013 .
- **How to replace or confirm:** Ask the owner: "Do you accept D-044 as written in DECISIONS.md?" A yes becomes a user_confirmed decision; a no reopens it through /lvr-add-feature or a plan review.

## D-045 — Paid fallback for data: if the 500 MB database, the pause rule or the lack of automatic backups becomes a real problem, move to Supabase Pro (designer_filled)
- **Why:** Designer default shown to the owner for correction; never explicitly confirmed as its own answer. Basis: Free tiers have cliffs; price per RQ-013 .
- **How to replace or confirm:** Ask the owner: "Do you accept D-045 as written in DECISIONS.md?" A yes becomes a user_confirmed decision; a no reopens it through /lvr-add-feature or a plan review.

## D-048 — One daily Cloudflare Cron Trigger (free, 1 of 5 per account) calls a protected cleanup endpoint that erases names and numbers 90 days after (designer_filled)
- **Why:** Designer default shown to the owner for correction; never explicitly confirmed as its own answer. Basis: S6 risk R-2/R-3: Supabase pauses Free projects after 7 days of low database activity 
- **How to replace or confirm:** Ask the owner: "Do you accept D-048 as written in DECISIONS.md?" A yes becomes a user_confirmed decision; a no reopens it through /lvr-add-feature or a plan review.

## D-049 — Supabase project region: Southeast Asia (Singapore) ap-southeast-1, the nearest to Jakarta; there is no Indonesian region; Supabase DPA with (designer_filled)
- **Why:** Designer default shown to the owner for correction; never explicitly confirmed as its own answer. Basis: S6 R-5  
- **How to replace or confirm:** Ask the owner: "Do you accept D-049 as written in DECISIONS.md?" A yes becomes a user_confirmed decision; a no reopens it through /lvr-add-feature or a plan review.

## D-056 — PP 33/2026 applied (in force 16 January 2027): (a) data requests sent to the venue WhatsApp — access, correction, consent withdrawal (handle (designer_filled)
- **Why:** Designer default shown to the owner for correction; never explicitly confirmed as its own answer. Basis: S3.q10 (delegated answer: update S3 where needed); drafted from the regulation, shown for correction. PP 33/2026 Pasal 71, 74, 77, 92, 99, 114-117, 120, 142, 160-165, 225 
- **How to replace or confirm:** Ask the owner: "Do you accept D-056 as written in DECISIONS.md?" A yes becomes a user_confirmed decision; a no reopens it through /lvr-add-feature or a plan review.

## D-061 — Submit and lookup limits (5 per 10 minutes per device/connection) are counted in an attempts table keyed by an HMAC-SHA-256 of the connectio (assumed)
- **Why:** Never surfaced as a question: a compile gap the records could not fill. Basis: Compile gap: D-023 and D-033 set the limits but no record says where the count lives; a salted hash keeps the count without storing the IP
- **How to replace or confirm:** Ask the owner whether counting attempts by a hashed IP is acceptable; test: `select key_hash from attempts` shows no raw IP.

## D-062 — Seed prices in the first migration are placeholders (regular 150000, peak 250000 rupiah) used only until the owner sets real prices in F-04 (assumed)
- **Why:** Never surfaced as a question: a compile gap the records could not fill. Basis: Compile gap: M0 needs a price to show and store (S8 M0 seeds fixed prices), but no record gives the venue prices
- **How to replace or confirm:** The owner enters real prices in F-04 at M3; test: `select amount from prices` matches the owner's price list.

## D-063 — UI palette, font, motion and four proposed copy keys (assumed)
- **Why:** Never surfaced as a question: S4 set feel and accessibility but no palette.
- **How to replace or confirm:** Show the owner the M1 screens; a yes confirms, new colours must pass `contrast-check.py` again.

