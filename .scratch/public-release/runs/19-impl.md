# Ticket 19 implementation

Added a GitHub Actions matrix for Linux, macOS and Windows with Node 22 and 24. The dependency-free fixture checks Unicode and spaced paths, CRLF and BOM handling, concurrent answer IDs, atomic checkpoints and replay parity. It runs the checked-in CLI on each runner.

A disposable Linux project used the real Skills CLI to install the Codex skill. Its installed helper recorded a scripted intake through S2 with a real pinned project-local booster install and checked cleanup.

## Publish the platform matrix

The recovery-branch run showed the Node tests passed everywhere and skill byte-sync failed only on Windows. Git already forces LF on installed copies and `.mjs` files. Define LF on canonical spec Markdown, shared skill Markdown and JSON, and product profile JSON too, so checkout cannot give source and mirror different line endings.
