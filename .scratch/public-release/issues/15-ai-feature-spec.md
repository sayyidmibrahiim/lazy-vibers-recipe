# 15: AI/LLM feature spec branch
Status: ready-for-agent · Blocked by: 08 · Type: task · Agent: Sonnet

- [ ] Trigger: the `has_llm` flag.
- [ ] S4 asks per AI feature: input, output, data source, what must never be wrong.
- [ ] S9 emits SPEC/ai.md:
  - model choice + fallback
  - prompt contract
  - RAG/data sources
  - guardrails
  - eval set (≥10 cases)
  - per-call cost
  - hallucination policy
- [ ] Boosters: prompt-engineer, plus evaluate-rag for RAG.
Verify: the house-hunter and a chatbot dry run each produce an ai.md with runnable eval cases.
