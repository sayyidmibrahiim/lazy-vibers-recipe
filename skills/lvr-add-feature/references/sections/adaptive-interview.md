# Interview coverage and pacing

Use the current section's exit criteria to decide what to ask. The question banks provide wording and ordering when an answer is needed. The user's detailed first message is evidence for later questions.

## Section checklist

1. Before the first question batch, write the section's required fact keys and labels under `## Coverage plan` in its Section Record. Derive them from its exit checks and confirmed profile requirements. Save the list for resumption. Use separate keys when requirements can be answered independently. For S4 use keys such as `feature.f-01.flow`, `feature.f-01.priority` and `feature.f-01.recovery`. Add a fact when a captured feature adds an obligation. Update the denominator visibly.
2. Scan the verbatim S0 answer, prior answered questions, choices, and current sourced findings. For each required fact, copy the matching evidence IDs and collect a short, faithful summary. Treat expectations, examples and ambiguous references as open unless their wording supports a specific choice. A source reference must establish the associated fact. A web-check, a failed research entry or a research lead alone does not establish it.
3. Keep already confirmed fact coverage. Group clearly supported but uncovered earlier answers into one confirmation batch in the user's language. Show what you understood and ask the user to confirm or correct it once. Use a single confirmation question even in T3. Do not repeat the bank's individual questions. Keep explicit consent and mandatory surfaces such as S1 product selection, S2 paid-account choice and S7 scope lock. A confirmation batch can include such a surface only when the actual choice is explicit in the question and answer.
4. Map confirmed facts to the earlier source and new confirmation evidence. On the answer's checkpoint pass `coverage` with the section ID and the updated keys. If the user confirms some facts or corrects others, update only the affected keys. Leave an unanswered, contradicted, or unclear item open or clear its old evidence using an empty array. A detailed answer given directly for a current fact can be linked on that answer's checkpoint without adding a second question.
5. Ask small batches about missing facts. Prefer questions that change scope, cost, feasibility or behavior. Use the original tier caps and skip/enough controls. Keep the difference between a skipped answer and a decision. A permitted design default or skipped choice needs its actual status, rationale and a way to confirm it. Link the decision ID as an explicit assumption. A missing requirement stays open if the exit criteria require confirmation or verification.

After each answer and before closing, show `S4: 6 of 9 facts known` (translate it into the user's language). Mention open confirmation and recorded assumptions when they affect what happens next. Assumptions are excluded from “known”. Move to the existing exit check when every mandatory fact has enough evidence. If enough is requested before then, follow the section's existing complete, defer or block behavior. Carry each assumed or designer-filled decision to ASSUMPTIONS.md at S9 with why it was made and a check that can replace it.

## Coverage shape

Use state and journal as evidence. For a reliably recorded S0 fact, the proposed mapping is:

```json
{
  "required": ["devices", "budget", "hosting"],
  "proposed": {"devices": ["S0.q1"], "budget": ["S0.q1"]}
}
```

Run `LVR interview progress --section S2 --in -` with that object. It is read-only and reports `known`, `confirm`, `assumption` or `missing` for each fact. It checks whether evidence IDs exist and are eligible. The Conductor checks whether the meaning matches and verifies source freshness through the normal citation workflow.

After the actual user confirmation (for example S2.q1), include this coverage update on `answer record`. Use the real next answer ID when linking the current answer.

```json
{
  "q": "<one confirmation question>",
  "a": "<verbatim answer>",
  "coverage": {
    "S2": {
      "devices": ["S0.q1", "S2.q1"],
      "budget": ["S0.q1", "S2.q1"]
    }
  }
}
```

Evidence may be a non-skipped answer, a recorded decision, a supported Domain Brief item `U-NN`, or a successful research entry `RQ-NNN`. Enforce a previous or current section bound for answers and decisions. Only count a written, sourced fact. Human-only confirmation applies to user choices. An assumed or designer-filled decision is visible as an assumption unless other evidence confirms the specific fact.

On resume, reload the saved required fact list and current coverage instead of rescanning the transcript. Rebuild a missing list from the section's exit checks and existing records. Preserve the last known keys and confirmation results. A missing or stale fact still takes the same follow-up.
