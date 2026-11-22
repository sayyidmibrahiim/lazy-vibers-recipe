# Ticket 06 implementation

The native Skills CLI installed the pinned Codex copy and left a project lockfile and empty skill roots after its own removal. The lifecycle therefore stages each native install in a disposable Git directory inside the project. `booster deploy` copies only a selected new project skill directory, keeps existing directories and links, and journals its exact catalog SHA, harness, scope and path. It records a hash and directories it created. `booster cleanup` previews those receipts and requires confirmation for an exact path. It refuses edited, linked, global, and untracked copies.

The section loop checks applicable additions before starting each section. Bootstrap uses the same staging path. Handoff asks about cleanup after completion. The shared lifecycle keeps MCP setup consent separate and preserves the existing failure choices. The tests exercise real journal/state transitions and cleanup safety.
