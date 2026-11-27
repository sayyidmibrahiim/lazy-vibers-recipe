# S1 — Context

<!-- lvr:english-summary -->

## Coverage plan

| Key | Fact needed | Evidence so far |
|---|---|---|
| product-type | Product type confirmed (profile id) | S0.q1, S1.q1 — web |
| problem | The problem in the owner's own words: one concrete moment | S1.q2 |
| target-users | At least one named target-user group | S0.q1, S1.q1 (D-004) |
| platform | Platform shape | S0.q1, S1.q1 (D-003) |
| success | Success picture six months out | S1.q3 (D-005) |
| web-pages | Web profile: each primary page, its users, and its entry point | S1.q5, S1.q6, S1.q7 (D-006, D-007, D-008) |

Progress: S1: 6 of 6 facts known.

## Answers

- **S1.q1 Confirm product type, main users, D-001 and D-002** — Yes: an installable website; main users are players who reserve slots; the admin side stays. D-001 and D-002 approved.
- **S1.q2 How booking works today, and one real failure** — Players book by WhatsApp chat with the admin. Example: two teams both got a confirmation for Friday 19:00 and clashed at the court.
- **S1.q3 Success picture after six months** — No more schedule clashes, and the admin no longer answers booking chats one by one.
- **S1.q4 Unprompted addition (area and venue)** — Area: South Jakarta (Jakarta Selatan) and the part of Depok bordering it. Venue facts are a trial assumption, not real venue data: one venue, 3 courts, run by one owner/admin.

- **S1.q5 Where players get the link (asked as question 4)** — One short link on the venue's WhatsApp Business profile, Instagram bio and Google Maps listing; it opens today's slot schedule.
- **S1.q6 Pages visible without login (asked as question 5)** — Players view the schedule and book without an account; only admin pages need login.
- **S1.q7 Where the player lands after booking (asked as question 6)** — A confirmation page with court, date, time, booking code and a Share-to-WhatsApp button; if the slot was taken first, a clear "Slot sudah diambil" (slot already taken) message and a return to the schedule.

Answer source: from S1.q5 on, the owner delegated all answers to a test agent answering on the owner's behalf for this trial. Each journal event from S1.q5 carries `answered_by: delegated_test_agent`.

## Decisions this Section

- **D-001** Two sides: player booking page and venue-manager side — per U-14 · status: designer_filled (approved by the owner in S1.q1; confirmed as D-004)
- **D-002** Installable website, no store app — per S0.q1 and U-16 · status: designer_filled (approved by the owner in S1.q1; confirmed as D-003)
- **D-003** Platform: installable website opened from a link; no store app — S1.q1 · status: user_confirmed
- **D-004** Target users: players who reserve slots, plus the owner/admin on a separate admin side — S1.q1 · status: user_confirmed
- **D-005** Success: zero double bookings and no one-by-one booking chats for the admin — S1.q3 · status: user_confirmed
- **D-006** Entry point: one short link on WhatsApp Business, Instagram bio and Google Maps; opens today's schedule — S1.q5 (delegated answer) · status: user_confirmed
- **D-007** Schedule and booking need no account; only admin pages require login — S1.q6 (delegated answer); login method settled in S3 · status: user_confirmed
- **D-008** After booking: confirmation page with code and Share-to-WhatsApp; on a lost race, "Slot sudah diambil" and back to the schedule — S1.q7 (delegated answer) · status: user_confirmed

## Notes for later Sections

- Venue size (1 venue, 3 courts, 1 admin) is the owner's trial assumption (S1.q4). Plans may use it; it is labelled as a test value wherever it appears.
- The area spans two provinces (DKI Jakarta and West Java). The regional tax (U-04) depends on where the venue itself sits; S3 asks this.

## Exit criteria

- [x] Problem recorded in the user's own words — evidence: S1.q2
- [x] At least one named target-user group recorded — evidence: S1.q1, D-004
- [x] Platform shape chosen — evidence: S1.q1, D-003
- [x] Success picture recorded — evidence: S1.q3, D-005
- [x] Web profile: each primary page, its users, and its entry point — evidence: S1.q5, S1.q6, S1.q7

Primary pages: (1) Schedule page — players, public, entry via the short link (D-006); (2) Booking confirmation / "slot taken" page — players, public, reached after booking (D-008); (3) Admin pages — owner/admin, login required (D-007).

## Booster

grilling: installed (read from `~/.agents/skills/grilling`), used for batch design. pm-skills `define-problem-statement`: installed (read from `~/.agents/skills`), used to frame the problem questions.

## Context research

RQ-007 · items shown: U-10, U-14, U-15, U-16 · became: D-001 (U-14), D-002 (U-16), S1.q2 (U-10, U-15)
