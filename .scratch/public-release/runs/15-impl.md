# Ticket 15 implementation

Products with the confirmed `has_llm` flag include SPEC/ai.md in the frozen plan. S4 captures the allowed inputs and sources, expected result and critical failures for each AI feature. The prompt aid is available at S4 and S9. A retrieval profile or explicit retrieval flag enables the evaluation aid at S8 and S9.

The S9 guide covers explicit model and fallback selection, prompt, retrieval, privacy and hallucination rules, per-call budget and at least ten structured evals. The read-only `ai cases` and `ai eval` commands export only the inputs and grade provided outputs without echoing response content. Two synthetic project specs exercise housing shortlist filters and chatbot retrieval boundaries.
