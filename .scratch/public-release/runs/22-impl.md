# Ticket 22 implementation

Added archive-independent Node tests for the folder gate, state replay, bundle lint and cached signals. The release verifier checks synchronized copies, skill frontmatter, active command names, local links, eight JSON manifests and the installed registry schemas. The verifier runs its schema probes in a temporary project.

The Linux CI job installs dependencies, checks the skills, lints, generates Next.js route types, typechecks, runs tests and builds. The manifest job installs pinned tools inside a disposable job container, validates the Claude manifest, adds and lists the Codex marketplace, and checks the Skills CLI's discovered names. The platform matrix has its own workflow from task 19.
