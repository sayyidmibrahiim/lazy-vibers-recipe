# 11: Data module (storage choice + schema)
Status: done (2026-11-23) · Blocked by: 08 · Type: task · Agent: Sonnet; delegate to database-architect (ticket 17)

- [x] Trigger: the `stores_data` flag, for any product type.
- [x] Storage-choice decision table, 8 questions (authored by us). Outputs: files/JSON, SQLite, Postgres/Supabase, Firestore or vector DB, with reasons tied to the S2/S3 answers.
- [x] Schema via database-schema-designer:
  - entities, fields, types and constraints
  - relations + cardinality
  - indexes mapped from queries
  - migrations up/down
  - a **Mermaid ERD**
- [x] Supabase: RLS policies from supabase-postgres-best-practices. Firestore/Supabase vendor skills load only when that store is chosen.
- [x] Output goes to SPEC/data-model.md, plus SECURITY.md for PII/RLS.
Verify: futsal (Supabase) and house-hunter (local SQLite/JSON) both get a complete data-model.md with an ERD and indexes.

## Comments

- 2026-11-23: Both data models rendered valid ERD and index sections. The local SQLite fixture proved indexing, constraints and deletion, and vendor routing and shared checks passed. See [verification](../runs/11-verify.md).
