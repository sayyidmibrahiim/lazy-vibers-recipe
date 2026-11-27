# Assumptions

Every decision whose status is not `user_confirmed`. Several were approved aloud by the owner's delegated test agent, but their recorded status stays `designer_filled` because a recorded status is never rewritten.

## D-001 — The tool labels its inputs and results with the standard Indonesian KPR terms: KPR, DP (uang muka), tenor, cic (designer_filled)
- **Why:** proposed by the planner in S1, never picked by the owner from options: These are the words Indonesian banks and listing sites already use, so the owner can match the tool to a bank offer line by line. Sources: DECISIONS.md row D-001.
- **How to replace or confirm:** Ask the owner whether any label reads wrong on first use; replace the term in the locale file.

## D-010 — Minimum down payment is a per-bank setting the owner enters locally (designer_filled)
- **Why:** proposed by the planner in S2, never picked by the owner from options: Only banks meeting BI bad-loan criteria may lend 100% until 31 Dec 2027; under PADG 30/2025 other banks stay at 95% LTV for landed houses above 70 m², so 5% is the safe default. Sources: DECISIONS.md row D-010.
- **How to replace or confirm:** Check each bank's current minimum DP on its KPR page before applying; edit the per-bank setting.

## D-011 — The upfront-cash estimate per house = DP + BPHTB + bank fees + notary and insurance estimates (designer_filled)
- **Why:** proposed by the planner in S2, never picked by the owner from options: BPHTB and bank fees are cash due at or before the akad, and the owner asked for upfront cash per house (D-008). Sources: DECISIONS.md row D-011.
- **How to replace or confirm:** Compare the app's upfront-cash total with a bank's written cost estimate for one house.

## D-012 — The tool applies no first-home BPHTB relief automatically; the estimate is the conservative, full BPHTB (designer_filled)
- **Why:** proposed by the planner in S2, never picked by the owner from options: Sources disagree on the current DKI relief scheme, and eligibility depends on the owner's KTP, which stays off this conversation. Sources: DECISIONS.md row D-012.
- **How to replace or confirm:** If the owner qualifies for first-home BPHTB relief (KTP DKI), ask Bapenda or a notary and enter the reduced figure by hand.

## D-013 — The tool does not check credit history (designer_filled)
- **Why:** proposed by the planner in S2, never picked by the owner from options: Banks check SLIK; larger paylater or online-loan arrears can block a KPR even when the numbers fit. Sources: DECISIONS.md row D-013.
- **How to replace or confirm:** Read the shortlist note once; confirm it is visible on every house row.

## D-014 — No paid account, hosting or store fee is needed: the app runs on the owner's laptop (D-002) (designer_filled)
- **Why:** proposed by the planner in S2, never picked by the owner from options: S2 hard-rule check against the S1 platform shape: a local web app has no app-store or hosting account. Sources: DECISIONS.md row D-014.
- **How to replace or confirm:** Confirm no paid service is added when a milestone adds a dependency (CAPABILITIES.md, SECURITY.md).

## D-021 — The local server listens only on 127 (designer_filled)
- **Why:** proposed by the planner in S3, never picked by the owner from options: Binding to loopback alone does not stop DNS rebinding from a website open in the same browser. Sources: DECISIONS.md row D-021.
- **How to replace or confirm:** Run the M0 Host-header check (expect 400).

## D-022 — The app makes no network calls of its own: no analytics, no error reporting, no fonts or scripts from the inte (designer_filled)
- **Why:** proposed by the planner in S3, never picked by the owner from options: Hard constraint D-006: income and savings never leave the laptop; anything loaded from the internet could carry data out. Sources: DECISIONS.md row D-022.
- **How to replace or confirm:** Turn networking off and run the M4 smoke test; expect the same results.

## D-023 — No privacy policy, consent screen or data-protection officer is planned: the tool processes the owner’s own da (designer_filled)
- **Why:** proposed by the planner in S3, never picked by the owner from options: UU PDP Art. Sources: DECISIONS.md row D-023.
- **How to replace or confirm:** Reopen if the tool is ever shared with another person or used commercially.

## D-027 — Imported CSV is untrusted text: every cell is shown as plain text (never as HTML); only http/https listing lin (designer_filled)
- **Why:** proposed by the planner in S3, never picked by the owner from options: Threat-modeling pass (tampering): listing text is copied from public sites and may carry markup, javascript: links or spreadsheet formulas. Sources: DECISIONS.md row D-027.
- **How to replace or confirm:** Run the M2 import limit and formula-export tests.

## D-028 — Every request that changes data (import, save profile, delete) must come from the app's own page: the server c (designer_filled)
- **Why:** proposed by the planner in S3, never picked by the owner from options: Threat-modeling pass (tampering): a hidden form on any website can send a request to localhost with a valid Host header, so the Host check of D-021 alone does not stop it. Sources: DECISIONS.md row D-028.
- **How to replace or confirm:** Run the M0 Origin check (expect 403).

## D-029 — Instead of a legal privacy policy (not needed per D-023), the app has a short "Data & privasi" page in plain I (designer_filled)
- **Why:** proposed by the planner in S3, never picked by the owner from options: Privacy-policy rule: the product keeps personal data. Sources: DECISIONS.md row D-029.
- **How to replace or confirm:** Owner reads the Data & privasi page once and confirms it matches what the app stores.

## D-032 — A listing whose price per m² of land is below 60% of the median of listings in the same area within the loaded (designer_filled)
- **Why:** proposed by the planner in S4, never picked by the owner from options: Per U-14. Sources: DECISIONS.md row D-032.
- **How to replace or confirm:** After the first 3 imports, owner checks whether flagged houses really looked suspicious; adjust the 60% threshold if not.

## D-033 — The CSV may carry an optional certificate column (SHM, SHGB, AJB, PPJB/inden, unknown) (designer_filled)
- **Why:** proposed by the planner in S4, never picked by the owner from options: Per U-09. Sources: DECISIONS.md row D-033.
- **How to replace or confirm:** Confirm each certificate note with a notary before any purchase.

## D-037 — F-01 unhappy-path defaults (designer_filled)
- **Why:** proposed by the planner in S4, never picked by the owner from options: Routine recoveries taken as safe defaults (S4 guidance; deliver-edge-cases checklist via grilling). Sources: DECISIONS.md row D-037.
- **How to replace or confirm:** Run the M2 unhappy-path tests.

## D-041 — F-02 unhappy-path defaults (designer_filled)
- **Why:** proposed by the planner in S4, never picked by the owner from options: Routine recoveries taken as safe defaults; shown for correction. Sources: DECISIONS.md row D-041.
- **How to replace or confirm:** Run the M1 profile unhappy-path tests.

## D-045 — F-03 unhappy-path defaults (designer_filled)
- **Why:** proposed by the planner in S4, never picked by the owner from options: Routine recoveries taken as safe defaults (enough protocol, step 2); shown for correction. Sources: DECISIONS.md row D-045.
- **How to replace or confirm:** Run the M3 default-figure tests.

## D-046 — F-04 and F-05 unhappy-path defaults (designer_filled)
- **Why:** proposed by the planner in S4, never picked by the owner from options: Routine recoveries taken as safe defaults; shown for correction. Sources: DECISIONS.md row D-046.
- **How to replace or confirm:** Run the M4 backup/delete/restore tests.

## D-047 — First run and stopped app (designer_filled)
- **Why:** proposed by the planner in S4, never picked by the owner from options: S4 bank question 9 and web profile S4 (web-empty, web-retry, web-device), taken as safe defaults; shown for correction. Sources: DECISIONS.md row D-047.
- **How to replace or confirm:** Owner follows the three-step first-run guide with the sample CSV once and reports any confusing step.

## D-048 — Recommended stack: Python 3 (designer_filled)
- **Why:** proposed by the planner in S5, never picked by the owner from options: sqlite3 is part of the Python standard library, while node:sqlite is still "Stability: 1.2 - Release candidate". Sources: DECISIONS.md row D-048.
- **How to replace or confirm:** Superseded in detail by D-050/D-051 (Python 3.14.4 + Django 6.1.3); confirm at the M0 install.

## D-052 — Storage: one SQLite database file in the owner's home folder, managed by Django migrations (designer_filled)
- **Why:** proposed by the planner in S6, never picked by the owner from options: Data-module comparison in the S6 risks: one user, one device, offline (D-005, D-002, D-022), about 1,200–7,200 listings a year (D-018), atomic saves needed for D-047 and F-05. Sources: DECISIONS.md row D-052.
- **How to replace or confirm:** Run the M4 restore drill; row counts must match.

## D-063 — Milestone order: M0 walking skeleton (start, import, list) -> M1 calculations and profile (F-02) -> M2 full im (designer_filled)
- **Why:** proposed by the planner in S8, never picked by the owner from options: Calculations come before the ranked shortlist because F-01 ranks by upfront cash and installment; each milestone fits one builder session. Sources: DECISIONS.md row D-063.
- **How to replace or confirm:** Approved at S8.q1; change the order only if a milestone blocks on a later one.

## D-064 — Quality targets: current Firefox and Chromium on the owner Linux laptop; labels, keyboard path and visible foc (designer_filled)
- **Why:** proposed by the planner in S8, never picked by the owner from options: One user on one Linux laptop (S2.q3, D-047); no data leaves the laptop (D-022). Sources: DECISIONS.md row D-064.
- **How to replace or confirm:** Approved at S8.q2; run M0 and M4 checks in Firefox and Chromium.
