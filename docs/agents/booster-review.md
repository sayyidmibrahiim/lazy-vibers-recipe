# Review a booster proposal

## Entry checks

Open the source and read the entire skill and the references it uses. Record the repository, exact revision, source paths, and license. A permissive license is required for vendoring. Noncommercial tools can be evaluated for runtime use under the repository's license policy. [License policy](../adr/0001-permissive-first-license-policy.md)

## Score the candidates

Use 0 for absent, 1 for partial, and 2 for clear evidence in each row. Document the evidence for your scores.

| Criterion | Evidence to look for |
| --- | --- |
| Actionability | Concrete steps a user or agent can follow. |
| Output contract | An explicit result format suitable for the bundle. |
| Self-verification | Checks, acceptance criteria, or a validator. |
| Fit for the owner | Plain questions and language an owner can understand. |
| Portability | A procedure that works across supported coding agents. |
| Context cost | At most 8 KB of entry instructions scores 2. More than 8 KB through 20 KB scores 1. Larger entries score 0. Record required references separately. |
| Deterministic help | Scripts or validators that perform repetitive work reliably. |
| Observable evidence | Runnable tests, evaluations, and worked examples. |
| Maintenance | A source update within six months scores 2, within twelve months scores 1, and older scores 0. |
| Adoption | At least 1,000 stars or installs scores 2, at least 100 scores 1. Use this as a tiebreaker. |

Compare the ten scores out of 20 for overlapping tools. Prefer the strongest evidence. For ties, consider size and license. Record why the other candidates were set aside.

## Compare outputs blind

1. Prepare the same representative input and acceptance criteria for each candidate. Include an ordinary case, an ambiguous case, and a failure or recovery case.
2. Hold the model, input, time allowance, and available tools constant. Run each candidate in an isolated folder and label outputs with neutral identifiers.
3. Score each output against the prewritten criteria before revealing the labels. Record errors, the checks that passed, and any differences in context cost.
4. Keep the prompts, output, scorecard, and source revisions so the comparison can be reproduced. Use sanitized examples when sharing results.
