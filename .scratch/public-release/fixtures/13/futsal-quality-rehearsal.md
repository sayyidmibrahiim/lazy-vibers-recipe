# Futsal booking quality rehearsal

Use the four in-scope features in the fixed futsal recording. Preserve accountless players, the admin login and the 30% manual transfer with proof. Keep the automatic gateway parked. D-004, D-008, D-010, D-011, D-012 and D-020 come from the recorded project. QD-01 through QD-04 are proposed design decisions for this rehearsal and would be shown to the owner for correction before use.

## S2/S5 — Usage estimate and cost cases

S1.q6 records 20–30 bookings a week. At 52/12 weeks per month, plan for 109 bookings in a typical month (25 per week) and 130 in a busy month (30 per week), rounded up. A scenario assumes one proof per booking and proposes a maximum of 2 MiB per upload. Budget proof storage for up to 218 MiB/month typical and 260 MiB/month busy before retention, retries or downloads. Measure the latter quantities rather than assuming they are free. Admin password resets need a separate estimate and sourced unit rate. The v1 flow makes zero calls to a gateway or language model by scope (D-011, D-020).

| Service | Billing basis | Typical | Busy | Cost and evidence |
|---|---|---:|---:|---|
| Booking database and app host | requests, storage and transfer | 109 bookings | 130 bookings | Server calls per booking and provider rates still require verification. |
| Private proofs | upload operations, retained MiB and downloads | 109 uploads / 218 MiB added | 130 uploads / 260 MiB added | Source is the scenario above. Document retention and price before confirming. |
| Reset mail | delivered messages | Undetermined | Undetermined | D-012. Choose a sender and verify included usage, unit rate and paid fallback. |
| Gateway and LLM | calls and tokens | 0 | 0 | Outside the agreed v1 scope. |

Use the Rp 100,000/month cap from D-005. Keep busy total and per-active-player cost open until rates, fixed charges and distinct player counts are known. Per booking and per player are different measurements. Any unverifiable material price goes back to S6.

## S3 — Security and abuse

The public booking form collects name and phone without an account (S3.q1–q2). A player proof submission also crosses the public boundary (D-011). Admin routes for all bookings, payments, reports and schedules require the admin session (D-010). The player can read only their own booking and public schedule (S3.q9).

QD-01 proposes five booking creates per client per ten minutes and three proof attempts per booking per ten minutes, keyed with short-lived identifiers. Return 429 plus retry time after the limit without consuming a booking or losing the draft. Proposal: defer CAPTCHA, review if the limit causes more than 10 events in ten minutes in normal service for two windows. A human challenge would need a keyboard-friendly path and owner support without exposing the booking or turning off server protections.

| Check | Actor and protected asset | Scenario | Control and expected result | Owner / verification |
|---|---|---|---|---|
| A-01 | Anonymous player, court inventory | Repeat booking submits cross the rate limit. | The sixth create in ten minutes returns 429 and offers retry. A repeated request with the same operation ID does not take another slot. | Builder / V-A1 |
| A-02 | Public proof sender, protected upload and store | Proof reaches the wrong booking or carries an invalid file. | Require a scoped booking token, enforce type and size, keep the object private. A wrong-scope token yields no row or object. | Builder / V-A2 |
| A-03 | Public user vs admin, personal and money records | A public request tries to list or alter an admin booking. | Authorize at the server. Deny the request and make no payment change. | Builder / V-A3 |
| A-04 | Owner, abuse alerts and users needing assistance | Busy legitimate use exceeds the limit or a future challenge blocks access. | Record the rate signal without raw IPs, names or phone numbers. Owner reviews after threshold. Let the user save inputs locally until retry, or contact the owner for help. | Owner / V-O3 |

V-A1 runs six creates against a disposable accountless client and verifies one 429 with retry time. Repeat the first operation ID and verify only one booking for it. V-A2 sends a wrong-scope token and invalid proof in a disposable project, then checks that neither creates a private object. V-A3 requests the admin list and confirmation without a session and verifies access denied and an unchanged payment. These are builder acceptance steps.

## S4 — Feature unhappy paths

QD-02 proposes a 30-minute hold for a booking awaiting proof, measured on the server. Receipt of a valid proof moves the booking into manual review and stops automatic release. The owner sees it in the confirmation queue and gets a review reminder after two hours. Releasing a slot while a proof is under review requires an explicit owner decision. Late proofs retain no sensitive data and display a contact path for players who already paid. Late transfers and an administrative reversal require an explicit owner rule before public use.

| Feature | Abandon or interruption | Invalid input | Concurrency or retry | Expiry or hold |
|---|---|---|---|---|
| F-01 Booking | Close before submit. No hold is written. Reopen and see the slot still available. | Submit a malformed phone number. Highlight the field and save no row. | Race two clients for one slot. A transaction allows one success, shows the other new options and keeps exactly one active slot claim. | Move the server clock beyond 30 minutes and verify an unpaid, unproved hold releases once. A stale confirmation gives a clear expired message. |
| F-02 Manual deposit | Interrupt proof upload. The booking still needs proof and a retry can resume without a second object. | Upload an oversized image. Show size error, keep the booking state, and create no object. | Confirm twice or twice in parallel. One transition and one log entry. Both views show the confirmed status. | Attempt to upload after the hold expired. Reject the file and show how to contact the owner with transfer details offline. |
| F-03 Manage schedule | Navigate away from unsaved settings. Confirm discard and verify the old schedule remains visible. | Submit closing time before opening. Show both fields and keep the previous schedule. | Edit a slot already booked by F-01. A stale write returns conflict and refreshes without replacing the booking. | No pending hold on editing. A session can expire. Return to login, preserve previously saved settings and prompt again before committing edits. |
| F-04 Daily report | Cancel printing. No booking or report state changes. | Request an invalid date. Show a validation error and retain the last valid read-only result. | Add a confirmation while reading. Counts and rows come from the same snapshot and reconcile. A reload can show the newer version. | No report reservation or hold. An expired session prevents a new read and returns to login without exposing the prior report. |

## S6 — Regulated-domain screen

| Domain | Finding from the recorded scope | Evidence and revisit trigger |
|---|---|---|
| Finance | Manual deposit for a court rental is incidental to the booking. v1 has no gateway, lending, stored card data or balance management. Confirm applicable obligations if scope changes. | S3.q3, S3.q5, D-011, D-020. Revisit before integrating money movement. |
| Health | The recorded product offers booking and reporting. There is no medical function or health record. | S4 F-01–F-04 and S3.q2. Revisit if collecting medical data. |
| Legal | The product offers no legal advice or representation. Privacy and record-handling requirements still need primary sources for the target region. | S3.q2, S3.q10, D-020. Route unresolved privacy or legal obligations through S6 before launch. |
| Minors | The recorded target is adult players ages 20–35. No youth registration flows are specified. | S1.q2, D-020. Revisit if a youth group is brought into scope. |

## S9 — Data sources and integrations

Compile into the architecture section. V1 adds no automated external data imports.

| Source | Information and access | Permission / provenance | Cadence and failure |
|---|---|---|---|
| Player submission | Name, phone, booking selection and proof. Restricted booking or admin access. | First-party data submitted for the booking. Data categories from S3.q2 and D-011. Record the applicable privacy basis before launch. | On submit. Show a retry after a failed write. Confirm only after a settled save. |
| Owner schedules | Court availability, hourly rates, opening hours. Admin writes, public sees availability only. | First-party owner-entered data, F-03. Only an administrator can update it. | On save. Show last confirmed state with error after failed refresh. |
| Bank transfer and admin confirmation | Admin reads payment outside the app and sets DP status. | Manual transfer and no gateway per D-011. No external API or card data. | Manual on review. Leave pending when proof or deposit cannot be verified. |
| Password reset sender | Admin address and short-lived reset link. | D-012. Before choosing a provider, cite its actual usage terms, pricing, region and retention. | At reset request. On failure, display a generic result and send a redacted operational alert. |

## S8/S9 — Quality and operations

QD-03 and QD-04 propose the targets below. The baseline confirms the local market, phone booking, laptop admin and backup need. The rehearsal sets test thresholds for design review. It claims no live provider availability or compliance guarantee.

| Check | Acceptance target | Milestone / accountable role | Verification |
|---|---|---|---|
| Q-01 Time zone | Store times in UTC. Display and group by Asia/Jakarta. The daily report changes at 00:00 in that zone. | M0 booking, M3 report / builder | V-Q1 |
| Q-02 Support | Test the player booking task in current Android Chrome and iOS Safari. Test the admin task in current desktop Chrome and Edge. Record exact versions tested. | M0 player, M1 admin and M2 confirmation / builder | V-Q2 |
| Q-03 Accessibility | Booking works by keyboard, with visible focus and readable labels. Ordinary text contrast ≥4.5:1 and primary touch targets ≥44 CSS px. | M0 / builder | V-Q3 |
| O-01 Error tracking | Record operation, request ID, UTC time and outcome, with 14-day retention. Redact name, phone, IP, credentials and proof. | M0 / builder | V-O1 |
| O-02 Availability | Check health each minute. Proposed target is 99.5% per calendar month. Three consecutive failed checks open an incident. Three successes resolve it. | M0 / owner | V-O2 |
| O-03 Owner alerts | Alert the owner test inbox on incident open and recovery. Suppress repeat alerts for 30 minutes. During open hours the owner acknowledges in 30 minutes or calls the builder. | M0 / owner | V-O3 |
| O-04 Recovery | Encrypt daily backup and retain 14 days; aim for ≤24 hours of data loss and ≤2 hours to restore. Keep weekly owner export per D-008. | M0 / owner and builder | V-O4 |

## S9 — Verification and handover steps

| Verification | Reproducible procedure and expected observation |
|---|---|
| V-Q1 | Seed report rows at 16:59:59Z and 17:00:00Z in a test store. Confirm they fall on different local dates and occupy the expected rows. |
| V-Q2 | On each named browser run the relevant happy path and deliberately retry one form. Record browser version, task result and displayed state after retry. |
| V-Q3 | Finish one booking by keyboard and check that focus is visible after an error. Measure target boxes in CSS pixels and calculate contrast for each ordinary text and background pair. |
| V-O1 | Force a controlled booking write failure in staging. Read the matching request ID and error from the event log. Search the event for synthetic name, phone and proof strings and verify they are absent. |
| V-O2 | Fail three health checks at one-minute intervals. Verify a single incident. Restore the service for three successful checks. Verify recovery and recompute the monthly target using elapsed monitored minutes. |
| V-O3 | Observe the incident and recovery messages in the test inbox. Confirm two duplicate failures within 30 minutes cause no extra incident notice. Check that the owner can use the request ID to report the issue and can reach the builder if unacknowledged. |
| V-O4 | Seed a disposable database and proof store, run backup, add disposable newer data, and restore the saved snapshot to a new isolated environment. Compare row counts and proof checksum. Read bookings and run a new booking. Record snapshot age and elapsed restore time. |

Owner response: on alert, check the booking page and note the reference from the alert. Tell the builder which action and time failed, without forwarding customer details. Use the weekly export until service recovers. A restore drill uses a separate environment and the builder records the result. Ask the owner before any production restore.
