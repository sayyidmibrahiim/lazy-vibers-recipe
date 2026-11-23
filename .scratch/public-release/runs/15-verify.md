# Ticket 15 — same-context verify

- PASS — House-hunter and retrieval chatbot each plan and record SPEC/ai.md in a disposable project. Each extracts ten inputs and gets ten passing verdicts from the local adapter and read-only grader. House-hunter covers deterministic affordability, missing evidence, equal thresholds, minimized route preview and fallback/cap. Chatbot covers active evidence, permissions, conflicts, untrusted data, service failure and fallback.
- PASS — Replacing one answer and withholding another gives one failed and one missing grade. The report does not echo private response values. A duplicate case and invalid JSON Pointer are refused. Non-AI profiles keep their current outputs.
- PASS — Packaged prompt engineering is available at S4, and retrieval evaluation is available at S8/S9 for a RAG profile or evidence-based retrieval flag. The fakes verify the spec and runner contract. Published prices, provider choice and real model quality remain deployment evidence to collect.
- PASS — Focused fixtures 05–15 (43/43), skill sync (127 files), guide byte comparison, lint with the existing research warning, TypeScript and diff checks.
- PASS — Shared fixture suites 03, 04 (104 checks), 26, 27 (191 cases and replay fuzz), 38 and 40.
