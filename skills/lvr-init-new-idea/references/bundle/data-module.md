# Storage and data modeling

Use this module for any confirmed product that stores data. In S3, record the storage answer with the `stores_data` flag and its evidence. Treat an unanswered flag as an open question. In S6, compare options using the S2 budget and deployment decisions, the S3 inventory, and actual read and write operations from S4.

## Eight questions

Ask within the normal interview batch limit and reuse answers already recorded.

| Question | What it changes |
|---|---|
| Who saves and uses the information, just you, a team or many people? | Concurrent use and ownership. |
| Where does it have to run, on one device or online? | Local files or a shared store. |
| Can each person see only their own records? | Authentication and record-level access rules. |
| How much information will you keep after the first year? | Retention, read patterns and storage estimates. |
| What are the most common ways you will search, sort or join the information? | Queries, constraints and indexes. |
| What must still work when the device has no connection? | Offline storage, synchronization and conflicts. |
| Do you need to find similar content by meaning? | Vector search and how it integrates with the source records. |
| Do you need to export or edit your own copy by hand? | Format, portability and restore. |

## Compare the choices

| Candidate | Choose when | Check first |
|---|---|---|
| Local files or JSON | One person keeps small, simple configuration or structured records | Validate the schema, define single-writer behavior and design export and restore. |
| SQLite | One device needs queries, indexes, relationships or atomic local updates | Check concurrency and cross-device needs. Plan where the database and backups live. |
| Postgres or Supabase | Multiple online users need relationships, concurrent writes or record-level access | Clarify tenancy, access policies, migration, backups and the actual price. |
| Firestore | Its document access patterns and offline synchronization match the confirmed workflow | List document paths and rule checks. Model reads, writes and indexes before quoting costs. |
| Vector search, such as Postgres with pgvector or a separate vector store | Searching by meaning is a confirmed need | Start with the storage and retrieval evidence; explain whether one store suffices, and how entries are refreshed and removed. |

Record the chosen store in the decision log with relevant answer IDs, an alternative and why it lost, and a migration path. Get the owner's confirmation. Set `storage_supabase` or `storage_firestore` only for the corresponding confirmed vendor. These are product flags. Other stores leave both false.

## Shape and prove the model

Run the database-schema-designer planning method after storage choice. Use its relationships, query and migration checks. If specialist delegation is unavailable, do the same planning review inline. Load Supabase's Postgres and policy guidance only after Supabase is chosen. Load the Firestore guidance only after Firestore is chosen. Check current rules and prices through their sources.

Write these sections to SPEC/data-model.md.

1. Storage decision with evidence, rejected alternative and migration path.
2. Entities with keys, fields, types, defaults, nullability and constraints.
3. Relationships with cardinality and delete behavior. Use a Mermaid `erDiagram` for the ERD.
4. Query-to-index map. Give each query an index or document why a scan is acceptable on its known workload.
5. Migrations up and down, including data preservation, backup, restore and verification. Describe rollback limits for irreversible changes.
6. Verification with representative queries and data, failure cases and results expected.

In SECURITY.md, record personal fields, their retention and deletion, the owning identity, and what each role can read or change. Supabase needs testable row-level rules for each user-owned table, including an authorised case and a cross-owner denial. Firestore needs equivalent document rules and tests. Local storage needs file access and export rules. Keep all other diagrams in ASCII.
