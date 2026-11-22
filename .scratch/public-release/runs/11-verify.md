# Ticket 11 verification

Same-context verify (Codex, 2026-11-23). Verdict PASS.

- The futsal Supabase and synthetic KPR SQLite/JSON plans each contain a storage rationale, typed entities, cardinality, an ERD, query-to-index map, reversible migration plan and access checks. The Supabase example states the expected cross-owner denial. Verification used a planning fixture, with no live tenant connection.
- The local SQLite fixture rejected invalid income, a missing parent and an invalid debt-share value. The query plan used the history index. Deleting the synthetic profile removed its dependent searches.
- The route checks covered non-data, local, Supabase and Firestore cases. Exactly the chosen vendor guidance appeared. Lint accepted the two data-model ERDs and rejected a Mermaid flowchart and a Mermaid diagram outside the data model.
- The exact error text for non-ERD Mermaid remains compatible with fixture 04. After correcting a regression in that text, its full 104-check run passed. Fixtures 03, 26, 27, 38 and 40 also passed.
- All 27 focused tests passed. The source checker verified 40 entries. All 116 copies matched. Lint and TypeScript passed with the existing research-probe lint warning.
