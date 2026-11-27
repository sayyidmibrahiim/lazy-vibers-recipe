# Changelog

## 1.0.0 - 2026-11-27

### Added

- Seven planning and build skills with portable state, resumable checkpoints, and structured review evidence.
- Ten product profiles with tailored planning files and release checks.
- Project-local specialist routing with read-only native and inline transports.
- A read-only dashboard with plan files, diagrams, progress, sessions, and review history.
- A sample plan and screenshots for the dashboard, legacy generator, and CLI.
- Repository language and skill packaging checks, plus a portable test matrix for Linux, macOS, and Windows.
- Two real-project planning trials with reviewed handoff bundles in `examples/trials-2026-11/`.

### Changed

- Renamed the review skill to `/lvr-review-plan`.
- The interface and generated documents use English. Agent conversation follows the user's language.
- The dashboard opens existing `.lvr` and legacy `.lvp` projects. The older generator remains available through the opt-in legacy route.

### Security

- Mermaid diagrams are sanitized into SVG nodes before insertion into the dashboard.
- Upgraded the affected `minimatch` dependency to `11.0.9` through its upstream consumer.
