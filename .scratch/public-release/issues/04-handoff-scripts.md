# 04: lvr.mjs handoff/compile helpers
Status: ready-for-agent · Blocked by: 02 · Type: task · Agent: Sonnet

- [ ] `lint` (gap lint A–H): all bundle files against their structure, ids, costs and scope. Output is a JSON report.
- [ ] `crosscheck`: the S9 cross-check list:
  - every F-NN appears in USER_FLOWS and requirements
  - decisions match `decisions[]`
  - ASSUMPTIONS are complete
  - names are identical across files
  - every acceptance criterion has a VERIFICATION entry
- [ ] `blueprint emit`: blueprint.json derived from state.
- [ ] `stubs`: CLAUDE.md / GEMINI.md.
- [ ] `handoff-prompt`: HANDOFF-PROMPT.md from a template.
- [ ] Skills call these scripts. The AI fixes only what the lint reports.
Verify:
- Lint passes on the fixed futsal bundle.
- Deliberately broken fixtures fail with exact messages.
