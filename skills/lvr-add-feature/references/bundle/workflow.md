# Personal workflow planning files

Use this pack when the confirmed product includes an agent or skill/plugin. It extends that profile's frozen file list at S7. S9 compiles the Markdown plan from the Section Records, preserving the product's existing scope. Keep the core project outputs and use the following additions.

| File | Source sections | Required content |
|---|---|---|
| SKILL_DRAFT.md | S1, S4, S7 | Draft frontmatter with the intended name and description. List trigger examples, input, ordered steps, decision rules, visible result and the stop/approval points. This draft becomes SKILL.md when the builder implements the product. |
| PROFILE_SCHEMA.md | S3, S4 | Field name, type, reason, required status, retention, deletion and where the field is stored. Show only synthetic examples in the bundle. |
| TOOLS.md | S2, S3, S5 | Tool or site, purpose, exact input fields allowed to leave the machine, effects and approval, and the source and verification date for relevant terms. Include disabled or unverified destinations. |
| EVALS.md | S4, S8 | At least five scenarios with concrete input, expected result, and what to inspect. Include a normal run, missing information, no match, source failure, and a privacy boundary case. |
| INSTALL_MANIFESTS.md | S2, S8 | Target harnesses, project-local scope, file names, install and trigger verification, and how to remove the installed copy. List credential names without values. |

When continuing a legacy plan that froze TOOLS_LIST.md as its tools file, use it for the same content. Use the frozen file names throughout that run.

## Local profile and outbound data

Keep source profile data in a local store. Define the exact fields and derived values that each named destination may receive. Unlisted fields and destinations stay local. Keep salaries, contact details, precise addresses and family information out of queries, normal logs, and bundle examples. When a destination's terms or access are unverified, stop that call and document the missing evidence. Check the tool result against the original local filters before giving an answer.

S1 records trigger and desired result, S2 records harness and tool access, S3 records the local fields and outbound rules, S4 records the input → tool → decision → result for each step, and S8 checks the expected results. Show the owner a choice for any consequential action that requires approval. The plan supplies test evidence and install instructions for the builder.
