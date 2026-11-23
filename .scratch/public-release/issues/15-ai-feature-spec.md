# 15: AI/LLM feature spec branch
Status: done (2026-11-23) · Blocked by: 08 · Type: task · Agent: Sonnet

- [x] Trigger: the `has_llm` flag.
- [x] S4 asks per AI feature: input, output, data source, what must never be wrong.
- [x] S9 emits SPEC/ai.md:
  - model choice + fallback
  - prompt contract
  - RAG/data sources
  - guardrails
  - eval set (≥10 cases)
  - per-call cost
  - hallucination policy
- [x] Boosters: prompt-engineer, plus evaluate-rag for RAG.
Verify: the house-hunter and a chatbot dry run each produce an ai.md with runnable eval cases.

## Comments

The two dry-run projects each generated SPEC/ai.md and passed ten runnable checks, with deliberately broken and missing results detected. All 43 focused checks and shared regressions passed. See [implementation](../runs/15-impl.md) and [same-context verification](../runs/15-verify.md).
