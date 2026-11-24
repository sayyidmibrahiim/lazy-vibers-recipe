# 17: Specialist agent auto-delegation
Status: done (2026-11-24) · Blocked by: 02, 05 · Type: task · Agent: Opus (design) → Sonnet
Source: research/F.

- [x] `references/agents.json` routing table:
  - maps a task type (DB design, threat model, research, architecture, API, UX, PM interview, QA, writer, cost, game design, RAG, MCP, n8n) to a profile (agency-agents primary, wshobson secondary) at a pinned SHA
  - holds an abstract model tier per task
- [x] Transports in order:
  1. native subagent (Claude Code, Codex explicit, Gemini, opencode, Cursor, Copilot, Kilo, Qwen, Kimi)
  2. explicit-prompt spawn
  3. inline role-play with vendored role cards (Aider, Windsurf, unknown harnesses)
- [x] Every profile is wrapped in a planning-only brief: no code, output into the section record format.
- [x] One delegation level only; read-only tools; results merged by the conductor; journal `agent_delegated`.
- [x] Profiles are installed and uninstalled under the same rules as boosters (D4).
Verify: the DB and threat-model tasks delegate on Claude Code, opencode and one no-subagent harness, with an identical record format.

Owner decision B11 (2026-11-19): the routing table holds ONLY specialists that truly fit thinking, planning, research and brainstorm/interview work. Candidates:
- PM/interviewer
- researcher
- domain/context researcher
- architect
- DB/data architect
- security/threat modeler
- cost/FinOps
- UX researcher/designer
- game designer
- AI/RAG designer
- automation designer
- critic/reviewer

Each one is picked by rubric score. No coding/builder agents in 1.0.

## Comments

Planning routes, project-local ownership checks, and native wrapper installation passed the scripted Linux checks. Commit `da9b0d0` on `handoff/ticket-17` preserves the complete draft and both run notes. Reapply it to the current helper before running the actual database and threat-model delegations in Claude Code and OpenCode. [Repository handoff](../../../docs/agents/continuation.md)

The draft landed in `10d4bd9`. The real Claude Code and OpenCode binaries invoked each native subagent against a deterministic local model fixture. In all four invocations the child received only Read, Glob, and Grep, and the parent received its record. The inline Codex route produced the same record shape for both roles. Six validations and replay passed. [Verification](../runs/17-verify.md)
