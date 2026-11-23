# 17: Specialist agent auto-delegation
Status: needs-info (2026-11-23) · Blocked by: 02, 05 · Type: task · Agent: Opus (design) → Sonnet
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

Planning routes, project-local ownership checks, and native wrapper installation passed the scripted Linux checks. The implementation is saved in stash `af6d741` in the original cloud workspace. The next step is to run the actual database and threat-model delegations in Claude Code and OpenCode. The original workspace contains `17-impl.md` and `17-verify.md`. [Repository handoff](../../../docs/agents/continuation.md)
