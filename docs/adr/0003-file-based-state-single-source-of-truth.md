# File-based state as the single source of truth

The original LVP pipeline stored session state in files in the user's project folder. The snapshot was `.lvp/state.json`, the append-only log was `.lvp/journal.ndjson`, and the per-Section records were under `.lvp/docs/sections/`. Sharing a file format across the CLI and web viewer lets users checkpoint and resume across sessions and harnesses. The existing SQLite web app became a client, with SQLite available for caching or indexing.

## Considered options

- SQLite as the source of truth would require other harnesses to read State through the web app and would limit portability.
- Chat memory alone would lose State when the context window filled, which conflicts with the owner's checkpoint requirement.
