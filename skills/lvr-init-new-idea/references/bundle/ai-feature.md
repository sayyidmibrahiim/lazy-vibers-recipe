# AI feature specification

Use this branch for a product that calls a language model, including a model-powered skill, chatbot or feature inside another product. The confirmed profile plan adds `SPEC/ai.md` when `has_llm: true`. For a resumed project use its frozen plan. If an approved later feature adds model use, record the decision and use the existing add-feature file rule.

## S4 capture

Identify each F-NN that uses a model. Reuse known inputs and constraints. Collect only the missing answers in the usual batch limit.

- **Input and sources.** What does the person supply? Which sources, documents, or tools may be consulted? Who may access them, which fields may leave the device, and what should be kept?
- **Output.** What should the person receive and do next? Set a format, language and acceptance expectation. Give one representative input and visible result.
- **Critical errors.** What must never be wrong, exposed or done without approval? Specify what the feature should say or do when it cannot tell, retrieval fails, a dependency is offline or the budget is exhausted.

Set `product.flags.has_llm` on the evidence-bearing answer. Reuse the S3 data and permission choices. Use `prompt-engineer` to outline the contract, with this guide as fallback. When the feature pulls passages from a knowledge store, carry `product.flags.has_rag` on its evidence-bearing answer and apply `evaluate-rag` at S8 and S9. The flag can enable the aid for an existing profile that now includes a retrieval feature. RAG means finding relevant passages before answering.

## S9 SPEC/ai.md

For each AI feature, record the following sections and link the user decisions that define them.

1. **Models and fallback.** State provider, exact model ID and verified access, region, input and output limits and tool support. Include the source and date for facts used to choose it. Give alternatives considered. Define explicit triggers for a fallback model, an equivalent deterministic flow, a human review or an unavailable response. A fallback must keep the same data permissions and acceptance rules. Never send the same private request to a new provider without authority.
2. **Prompt and output contract.** Include task, input fields and validation, trusted instructions, how references are cited, structured output shape, language, one example and the stop/ask rules. Mark external passages and tool output as data. Define allowed tools, effects, permissions, output validation, retries, timeout and token limits. Put money math, entitlements and other hard constraints in deterministic code or a responsible human check.
3. **Sources and retrieval.** List sources, origin, permission/terms, date or version, allowed fields, access rules and refresh/deletion policy. For retrieval state query strategy, access filtering before retrieval, ranking/linkage, no-match behavior, and checks for stale or contradictory evidence. Describe how the selected passages and precise citations stay connected. For a feature with no retrieval, state the allowed runtime facts and the no-source behavior.
4. **Guardrails and hallucination policy.** Refuse or ask when required evidence is missing. Return a verifiable source, a clear unknown, or a bounded recommendation. Never invent upstream facts, citations, capabilities, amounts, successful actions or records. Validate structured outputs and suppress unsupported claims. Define privacy, minimization and redaction, prompt-injection handling, human approval for consequential actions, and limits on autonomous retries. Record behavior in both success and failure paths.
5. **Per-call and monthly cost.** Use S2/S5's usage model. For each candidate and fallback, record separate input/output token rates and date, typical and capped token counts, any retrieval or tool fees and the expected number of calls. Compute `(input tokens × input rate + output tokens × output rate) / rate unit + tool charges`. Include retry and fallback costs, monthly estimates, currency and the confirmed cap. State what happens at the cap. If price is unverified, keep the total unresolved and route a material gap through S6.
6. **Runnable eval set.** Include at least 10 independently authored cases, covering intended use, field boundaries, exact facts and citations, missing or contradictory evidence, untrusted instructions or tool errors, permissions and private data, fallback and budget. Exercise every AI feature and hard requirement. Add human rubrics when a structured check cannot establish quality, or retrieval recall and grounding measures when applicable. Use synthetic or approved data. Name an owner, model/version or adapter, dataset/version, expected replay procedure and required pass thresholds. A failed safety or critical fact case blocks a release.

## Runnable eval format

Put one JSON fence immediately under `## Runnable eval set`. It contains an object with `cases`. Each entry has a unique `id` such as `E01`, a `feature` such as `F-01`, an `input` object, and one or more `checks`. A check has a JSON Pointer `path` and exactly one operation.

| Check | Meaning |
|---|---|
| `{"path":"/status","equals":"unknown"}` | The value is exactly the given JSON value. |
| `{"path":"/citations","contains":"policy-v2"}` | An array contains the given item, or a string contains the given text. |
| `{"path":"/privateField","absent":true}` | The field is missing. An explicit null is different. |
| `{"path":"/usage/costUsd","at_most":0.002}` | The present value is numerical and at or below the limit. |

From the project folder use the skill helper.

```text
LVR ai cases
LVR ai eval --in .lvr/verification/ai-responses.json
```

The first command exports only case IDs, feature IDs and inputs. Run each input through the documented application entry point or test adapter without access to the checks. Save responses separately under `{"results": {"E01": {…}, "E02": {…}}}`. The second command returns `clean`, totals, missing cases and failed field paths. Check that `clean` is true. Use `--file PATH` to check a different specification. Both commands are local and read-only. The report avoids echoing response values. They check recorded outputs and do not call a model provider.

For a dry-run plan, a local adapter is enough to verify the test data and outcome protocol. During build verification, use the actual approved model, credentials and retrieval path with synthetic fixtures. Log model/prompt/retrieval versions, measured results and human-rubric observations. Re-run the full suite after any prompt, model or source change. Put procedures and pass thresholds in VERIFICATION.md.
