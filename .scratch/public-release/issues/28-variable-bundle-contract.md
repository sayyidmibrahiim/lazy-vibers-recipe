# 28: Variable bundle contract + blueprint.json v2
Status: done (2026-11-23) · Blocked by: 08 · Type: task · Agent: Sonnet
- [x] The bundle is the 20 base files plus profile files (UI_SPEC, SPEC/ai.md, data module, workflow-mode files…).
  - blueprint.json v2 lists every file.
  - Lint and crosscheck read the list instead of a hard-coded 20.
- [x] The Mermaid ERD is the single exception to "ASCII only" (D7), stated in spec 04 and the lint.
- [x] A rule for when a file may be added later (decision A6).
Verify: lint passes for a web+data bundle and for a skill/plugin bundle.

## Comments

Both profile bundles pass full lint and crosscheck. The v2 file list, Mermaid exception, post-lock approval and retained v1 output were each verified. Shared and public tests passed. [Implementation](../runs/28-impl.md) · [same-context verification](../runs/28-verify.md).
