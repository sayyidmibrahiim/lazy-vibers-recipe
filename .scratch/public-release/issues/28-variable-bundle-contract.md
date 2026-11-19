# 28: Variable bundle contract + blueprint.json v2
Status: ready-for-agent · Blocked by: 08 · Type: task · Agent: Sonnet
- [ ] The bundle is the 20 base files plus profile files (UI_SPEC, SPEC/ai.md, data module, workflow-mode files…).
  - blueprint.json v2 lists every file.
  - Lint and crosscheck read the list instead of a hard-coded 20.
- [ ] The Mermaid ERD is the single exception to "ASCII only" (D7), stated in spec 04 and the lint.
- [ ] A rule for when a file may be added later (decision A6).
Verify: lint passes for a web+data bundle and for a skill/plugin bundle.
