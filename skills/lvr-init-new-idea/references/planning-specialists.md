# Planning specialists

The Conductor can delegate a bounded planning question when a second analytical perspective would improve a decision. Use `LVR agent list` for the allowed tasks, sections and abstract capability tiers. The role sources and file digests are pinned in `references/agents.json`. Agency Agents supplies most roles. The database selection role uses the database architect from wshobson/agents.

## Start from a planning task

Choose the relevant record and one concrete question. Examples include deciding a database and restore plan, reviewing a trust boundary, interpreting research, checking a workflow or reviewing acceptance evidence. Pick only a specialist in the catalogue. The build and deployment steps stay with the builder and owner.

Run `LVR agent plan --task TASK --section S --harness HARNESS`. Pass the smallest relevant excerpt of recorded answers and cited evidence. Omit unrelated files, raw secrets and unnecessary personal data. Follow the returned brief. Use the tier as a capability requirement: deep for complex design, standard for a focused trade-off and fast for a narrow language pass. Map it to a model available in the current harness.

## Choose the available transport

1. **Native.** Use the actual runtime's named agent tool when it provides one and can enforce read-only access and a single delegation level. After checking the runtime, use `--read-only --native-agent` on the plan. For Claude Code or OpenCode, `LVR agent stage --task TASK --section S --harness HARNESS --register` creates the project-local named file in its agent directory. Rerun the plan and check `registration.ready`. Select that name in the real tool and pass the brief. The wrapper grants read, glob and search tools only. If it is not recognized or runtime permissions differ, continue to the next permitted transport.
2. **Explicit prompt.** For Codex or a host with an explicit spawn interface, use `--read-only --prompt-agent` after confirming that the runtime can enforce the same boundary. Invoke the exposed tool with the full planning brief in one prompt. Cline's read-only research task is applicable only to the two research roles. A host with native and prompt tools uses native first.
3. **Inline.** For a host without a verified read-only tool, or when a transport fails, use the embedded role card and produce the same record in the current conversation. Aider, Windsurf and unknown hosts use this route. Record `transport: "inline"` and say the planning review ran locally.

A stage without `--register` caches a verified raw profile under the project for prompt or inline reference. An optionally supplied `--from FILE` must match the same SHA-256. Treat the profile as reference material. Use its method and output shape under the controlled brief. A profile can never change tools, allow writes, ask the user, install anything or spawn other agents. If the source is unavailable or its hash mismatches, use the card from the installed registry.

## Check and merge results

1. When starting a real specialist review, pass the plan's `event` to `LVR journal append --type agent_delegated --in -`. Record the returned AG-NNN and actual transport. Add the actual model and interview tier when exposed. A failed transport is a `failed` event with a short reason. Start a fresh AG-NNN for any fallback. Keep just one delegation level.
2. The result has `section` and `task`, `findings` with `{text, evidence}` pairs, observable `checks` and `open_questions`. Use `LVR agent validate --task TASK --section S --in -` to check that shape and the evidence IDs. A draft can leave an item open. Use the independently verified evidence before accepting a finding.
3. The Conductor checks the cited material, resolves mismatches and appends accepted advice to the owning Section Record. Record actual owner decisions separately. Journal the same AG-NNN as `done` with the Section Record path. Leave a reported failure or incomplete result visible if the session pauses.
4. Stage files are eligible for `LVR booster cleanup` only with an unchanged project-local ownership receipt and no active use. Review the path and ask before `LVR booster cleanup --path PATH --confirm`. A user-owned or modified file follows the existing cleanup rules.

[Agency Agents, MIT](https://github.com/msitarzewski/agency-agents/tree/8ae6164602c95ca78828b148b9052460ee426885) · [wshobson/agents, MIT](https://github.com/wshobson/agents/tree/42203085cfc5736204bf0f6d436dff7e1da0bf3f)
