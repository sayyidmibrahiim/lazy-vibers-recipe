# S1 — Context

<!-- lvr:english-summary -->

Answer source note: S1.q1–S1.q5 were answered by the owner. From S1.q6 on, the owner delegated all answers to a test agent that answers on the owner's behalf for this trial (owner's note, verbatim in the conversation: "mulai jawaban ini, pemilik mendelegasikan semua jawaban kepada agen penguji yang menjawab atas nama pemilik untuk uji coba ini"). The answer script does not store a per-answer source field, so the source is recorded here and in the decision rationales.

## Answers
- **S1.q1 Product shape** — A local web app that runs only on the owner's laptop (option a).
- **S1.q2 Listings source and format** — The owner copies listings by hand into a CSV from Rumah123, 99.co or Lamudi; about 20–50 listings per file.
- **S1.q3 Success picture** — Filtering listings is much faster, and the owner is no longer drawn to houses whose installment is out of reach.
- **S1.q4 Confirmation of known facts** — Confirmed: the problem (filter many listings into a shortlist that fits KPR limits and criteria), the only user is the owner, financial data stays local, and D-001 is correct.
- **S1.q5 Target area (late part of S0.q4)** — South Jakarta (Jakarta Selatan) and the parts of Depok that border South Jakarta.
- **S1.q6 Pages and entry point** — Accepted: bookmarked localhost address, no login, three pages: Import CSV, Profile & Criteria, Shortlist. (delegated test agent)
- **S1.q7 After the shortlist** — Save the shortlist as CSV with the estimated installment and upfront cash per house. (delegated test agent)
- **S1.q8 Screen language** — Indonesian with the standard KPR terms of D-001. (delegated test agent)

## Decisions this Section
- **D-001** The tool labels inputs and results with the standard Indonesian KPR terms — banks and listing sites use them, per U-11 · status: designer_filled
- **D-002** Platform: a local web app that runs only on the owner's laptop; no public hosting — S1.q1 · status: user_confirmed
- **D-003** Input: a hand-filled CSV from Rumah123, 99.co or Lamudi, 20–50 listings; the tool never scrapes — S1.q2, U-03 · status: user_confirmed
- **D-004** Success: faster filtering, and no unaffordable house in the shortlist — S1.q3 · status: user_confirmed
- **D-060** Success measure (refines D-004): a file of about 200 listings becomes a saved shortlist in under 10 minutes, and a hand check of 5 shortlisted houses against the 30% rule at the floating rate finds 0 over the cap — S7.q6, scope review RV-L15-2e67bd28 · status: user_confirmed
- **D-005** Target user: the owner alone — S1.q4 · status: user_confirmed
- **D-006** Hard constraint: profile, income and savings never leave the laptop — S0.q1, S1.q4 · status: user_confirmed
- **D-007** Pages: Import CSV, Profile & Criteria, Shortlist; entry via a localhost bookmark; no login — S1.q6 · status: user_confirmed
- **D-008** Output: shortlist CSV with estimated installment and upfront cash per house — S1.q7 · status: user_confirmed
- **D-009** Screen language: Indonesian with D-001 terms — S1.q8 · status: user_confirmed

## Exit criteria
- [x] Problem recorded in the user's own words — evidence: S0.q1, S1.q4
- [x] At least one named target-user group — evidence: D-005
- [x] Platform shape chosen — evidence: D-002 (web, local only)
- [x] Success picture recorded — evidence: D-004
- [x] Web profile: each primary page, its user and its entry point named — evidence: D-007

## Booster
grilling: installed, used at start · define-problem-statement: installed, used to frame the problem confirmation (S1.q4)

## Context research
RQ-008 · items shown: U-03, U-11 · became: S1.q2, D-003, D-001
