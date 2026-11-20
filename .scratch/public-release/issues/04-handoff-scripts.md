# 04: lvr.mjs handoff/compile helpers
Status: done (2026-11-20) · Blocked by: 02 · Type: task · Agent: Sonnet

- [x] `lint` (gap lint A–H): all bundle files against their structure, ids, costs and scope. Output is a JSON report.
- [x] `crosscheck`: the S9 cross-check list:
  - every F-NN appears in USER_FLOWS and requirements
  - decisions match `decisions[]`
  - ASSUMPTIONS are complete
  - names are identical across files
  - every acceptance criterion has a VERIFICATION entry
- [x] `blueprint emit`: blueprint.json derived from state.
- [x] `stubs`: CLAUDE.md / GEMINI.md.
- [x] `handoff-prompt`: HANDOFF-PROMPT.md from a template.
- [x] Skills call these scripts. The AI fixes only what the lint reports.
Verify:
- Lint passes on the fixed futsal bundle.
- Deliberately broken fixtures fail with exact messages.

## Comments
- 2026-11-20: done. Implementer Sonnet high (`runs/04-impl.md`, rounds 1–2 + R-3 patch), verifier Opus high (`runs/04-verify.md`: verify + re-verify after rounds 1 and 2).
- Commands: `lint run [--group] [--journal]`, `crosscheck`, `blueprint emit [--check]`, `handoff stubs` (backs up a customised CLAUDE.md/GEMINI.md), `handoff prompt`, `handoff install-lines`. Handoff and init S9 call them, prose fallback kept.
- Round 2 re-verify closed R-1/R-2 and found one regression (R-3, NFD project name) from an optional advisory change; the verifier's one-line fix was applied with a new fixture that fails without it (negative control done).
- Evidence: `bash .scratch/public-release/fixtures/04/run.sh` 104/104 PASS (futsal-fixed clean; each broken case pins exact messages); `fixtures/03/run.sh` 9/9; `npm run lint` 0; `npx tsc --noEmit` 0; `npm run check:skills` drift []; all copies `cmp` equal.
- Futsal-fixed changes vs the dogfood bundle: blueprint.json `designer_filled`, HANDOFF-PROMPT rule 9 (both genuine gaps). Deviations accepted by the verifier: `table_ref` → `RESEARCH.md#cost-table`, lint ids A0/B21, scope evidence as `precondition`, separate `needs_model` list (12 ids).
- Advisories left open (see verify file): source placeholders like `see above` / non-ISO dates left to the model check; bare two-letter sources flagged.
