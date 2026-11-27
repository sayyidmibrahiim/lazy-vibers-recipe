# S7 — Scope lock

## Prioritization pass (define-prioritization-framework)

Only MoSCoW applies here. This is a binary commitment decision, and there is no reach or impact data for RICE or ICE. All five features are must (S4).

Dependencies set the build order:
- F-04 (prices) feeds the price shown in F-01.
- F-02 (admin login and schedule) is needed for manual bookings, closures and the admin side of F-03 and F-05.
- F-01 is the core: the one-winner booking (S4.q1).

| Feature | MoSCoW | Depends on | Why it cannot wait |
|---|---|---|---|
| F-01 Book an open slot | Must | F-04 | The core promise: no double bookings (D-005) |
| F-02 Admin daily schedule | Must | — | WhatsApp and walk-in bookings must close slots too, or clashes return (S4.q7) |
| F-03 Cancel my booking | Must | F-01 | No one-by-one cancellation chats (D-005) |
| F-04 Set prices | Must | F-02 login | The schedule shows prices; the owner must change them without a developer |
| F-05 Weekly data download | Must | F-02 login | The only backup on Supabase Free (U-07, D-013) |

## In-MVP
- **F-01** Book an open slot — players see the live grid and book one slot with instant confirmation; one winner per slot.
- **F-02** Admin daily schedule — admin login, daily grid, manual bookings, attendance marks, cancel, block numbers, close hours.
- **F-03** Cancel my booking — players cancel with code plus last 4 digits, up to 3 hours before.
- **F-04** Set prices — regular and peak prices, holidays; changes apply to new bookings only.
- **F-05** Weekly data download — CSV export with a reminder after 7 days.

## Parking Lot (recorded, never deleted)
- **Online DP (deposit, e.g. QRIS)** — never captured as F-NN (S4); parked because: the first version takes no money (D-016, D-038).
- **Automatic WhatsApp reminders** — never captured (S4); parked because: not needed for the first version and a WhatsApp sending service would add cost (D-038).
- **Membership or subscriptions** — never captured (S4); parked because: later version (D-038).
- **Revenue reports** — never captured (S4); parked because: later version; the weekly CSV (F-05) covers manual checks (D-038).

## Size check

5 in-MVP features, under the ~8 limit. No warning needed.

## Scope review

- Run 1 (`/lvr-review-plan --scope-only`, same-session, script procedure), 2026-11-27. Verdict: **fix before locking**, overall 7/10. Lens scores: L01 8, L02 10, L04 8, L08 9, L10 8, L15 7.
- Open: 0 blocking, 5 major, 6 minor. Report: `.lvr/review/REVIEW-2026-11-27-1.md`. Research: RQ-016 (recheck).
- Major: RV-L01-4ebd3f1e (PP 33/2026 missing, in force 16 January 2027), RV-L04-789d07ea (no kill criteria), RV-L10-a74e1201 (PSE needs an NIB through OSS; no accounts/lead-time list), RV-L15-44011fb1 (success has no measure), RV-L15-e34a95af (no maintainer time).
- Minor: RV-L08-e4d46940 (daily-limit outage, no bad month), RV-L10-03e2438a (no Turnstile fallback), RV-L10-dd0b5e69 (move-away cost), RV-L10-4a47bac9 (one-way doors), RV-L10-ed22d6f6 (default SMTP limits), RV-L15-bba5f9c0 (WhatsApp habit).
- No finding changes the In-MVP split. User's call: fixed — the four S7 fixes adopted (S7.q3, D-053); PP 33/2026 handled by loop-back L-03 to S3 (S3.q10, D-056); PSE route and NIB as the owner's first task (S7.q4, D-054); six minor findings routed to S8 and S9 (S7.q5, D-055). No risk accepted.

## Kill criteria, success measure and upkeep (D-053)

| Feature | User job | Kill criterion |
|---|---|---|
| F-01 | A player books a slot without chatting with the admin | Under 30% of bookings online after 2 months → rethink the booking flow |
| F-02 | The admin keeps one schedule for online, WhatsApp and walk-in bookings | More than 1 clash a month → fix the admin screen |
| F-03 | A player cancels without messaging the admin | Under 1 in 5 cancellations through the page after 2 months → rethink the cancel flow |
| F-04 | The owner changes prices without a developer | No price change in 6 months → simplify in the next version |
| F-05 | The owner keeps a copy of the data outside Supabase | No download 3 weeks running → move to an automatic export |

- **Success measure:** count booking chats in the week before launch as the baseline; each month read online versus admin-entered bookings from the weekly CSV (F-05). Target at month 6: at least 70% of bookings online and zero clashes (D-005).
- **Maintenance:** the owner about 15 minutes a week (weekly download, service emails); one AI builder-agent session a month for updates; Rp 0.
- **Launch step:** a WhatsApp Business quick reply "Booking sekarang lewat <link>, langsung terkonfirmasi." for every booking chat in the first month.
- **Owner's first task (D-054):** get an NIB through OSS; then register the PSE Lingkup Privat in OSS before public opening.

## Lock

- Confirmed: S7.q6 · decision D-057 · journaled `scope_locked` 2026-11-27T13:41:11Z (seq 129)
- Frozen from here: changes go through /lvr-add-feature.

<!-- lvr:english-summary -->

## Answers

Answered by the delegated test agent on the owner's behalf (`answered_by: delegated_test_agent`); asked in Indonesian.

- **S7.q1 Run the scope review before the lock?** — Yes, run it.
- **S7.q2 Move any feature in or out?** — No change.
- **S7.q3 Add the four drafted fixes?** — Yes, all four. → D-053
- **S7.q4 Read PP 33/2026 and the PSE guide; NIB?** — Yes, update S3 where needed; the venue has no NIB (trial assumption), make it the owner's first task. → D-054; loop-back L-03 → S3.q10, D-056
- **S7.q5 Route the six minor findings to S8 and S9?** — Yes. → D-055
- **S7.q6 Is this the first version?** — Yes: F-01 to F-05, four ideas parked. Lock it. → D-057

## Decisions this Section

- **D-053** Scope-review fixes: kill criteria per feature, success measure, maintenance time, WhatsApp quick reply — S7.q3 · status: user_confirmed (delegated)
- **D-054** Accounts and approvals: NIB through OSS as the owner's first task, then PSE registration in OSS before public opening; all service accounts on the venue email; no published lead time, so the NIB starts in the week of M0 [cite: legal · https://pse.komdigi.go.id/ · n.d. · acc 2026-11-27 · primary · live] — S7.q4 · status: user_confirmed (delegated)
- **D-055** Six minor review findings routed to S8 (rate-limit rule, site-down and Turnstile fallbacks, password-recovery check) and S9 (bad month, move-away costs, one-way doors, default-SMTP limits and recovery) — S7.q5 · status: user_confirmed (delegated)
- **D-057** Scope lock: F-01 to F-05 in the MVP; four ideas parked — S7.q6 · status: user_confirmed (delegated)

## Exit criteria

- [x] Every F-NN from S4 marked `in-MVP` or Parking Lot — none missing, none deleted. — evidence: In-MVP list (F-01..F-05), Parking Lot
- [x] Each parked item carries a one-line reason. — evidence: Parking Lot
- [x] The user explicitly confirmed the final list; `scope_locked` is journaled. — evidence: S7.q6, D-057, seq 129
- [x] The MVP-size sanity check ran; when > ~8 features, the warning and the user's call are recorded. — evidence: Size check (5 features)
- [x] The scope review ran, was skipped by the user, or is not installed, and the record's `## Scope review` says which. — evidence: Scope review (run 1), S7.q1

## Context research

RQ-016 (scope review recheck) · RQ-017 (PP 33/2026, PSE route) · brief item U-21 → D-056
