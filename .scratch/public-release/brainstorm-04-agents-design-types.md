# Brainstorm 04 — Agents, design, product types, DB (2026-11-19)
Sources: research/F, G, H. Scores = agents' reading (/20), nothing executed.

## Delegation (F)
- Profiles: msitarzewski/agency-agents (MIT, 16, 330 profiles, pin 8ae6164) primary; wshobson/agents (15) secondary (best `database-architect`); VoltAgent (12) fallback. Rejected: 0xfurai (stubs), contains-studio (no license).
- Native subagents: Claude Code, Codex (explicit spawn), Gemini CLI (no nesting), opencode, Cursor, Copilot, Kilo, Qwen, Kimi. None: Aider, Windsurf (Cline read-only). Roo shut down 2026-05-15. Re-verify Kimi/Antigravity/Qwen/Cursor.
- Design: routing-table data file (task → profile → abstract model tier → per-harness model); pinned raw fetch + SHA-256 → `.lvr/cache`, deleted after section; one level, read-only tools; 3 transports: native spawn / explicit-prompt spawn / inline role-play with vendored role cards.
- MUST wrap profiles with a planning-only brief (they are builder profiles that emit code).

## Design & anti-slop (G)
- impeccable (pbakaus, 18, Apache): vendor PRODUCT.md/DESIGN.md schema + craft-floor ban list for S9; full skill opt-in at S10 (downloads binary, installs hooks).
- emilkowalski review-animations STANDARDS (14, MIT): motion budget into spec.
- ux-copy (anthropics knowledge-work-plugins, 15, Apache): S4 voice questions + S9 copy.
- addyosmani web-quality accessibility (14, WCAG 2.2): conditional S4/S10.
- vercel web-interface-guidelines (12, MIT): S9 hard rules + S10 verify.
- stop-slop (hardikpandya, 15, 2.6 KB) vs humanizer (12, 32 KB): swap candidate.
- frontend-design (anthropics, 14): fallback excerpt.
- NEW bundle file for UI products: UI_SPEC.md.
- Gaps: no strong mobile HIG/Material skill; slop lists English-only.

## Product types + DB (H)
- DB: database-schema-designer (onewave-ai, MIT, 15) winner; supabase-postgres-best-practices (official, 15) reference; firebase-firestore / supabase vendor skills conditional on chosen store. Storage-choice: no skill → we author an 8-question decision table. `stores_data` flag on every type triggers the data module.
- Types: RAG → rag-architect (14) + evaluate-rag (hamelsmu, 15); MCP → mcp-builder (anthropics, 14); n8n → n8n-io official (~12); CLI → create-cli (steipete, 14); chatbot/agent → agent-designer (15); mobile → mobile-design/mobile-release (~13, ref); game + browser extension → thin, we author.
- Draft profile table (10 types: extra S1–S8 questions, extra bundle files, conditional skills) lives in research/H.
- Open: ERD format (skill emits Mermaid; bundle rule says ASCII).

## De-slop bake-off result (research/I-bakeoff-key.md + scratchpad JUDGE.md)
Blind, Opus judge, 3 inputs, fact preservation ×3, max 105:
1. anti-slop (elithrar/dotfiles, MIT, 1.3 KB) 92 — no facts lost, structure intact; minor leftover slop
2. anti-slop-writing (adewale, MIT) 84 — best slop removal, but invented a claim on input 3
3. antislop (dhanji4u/skills, MIT, humanizer-v3 derivative) 78
4. humanizer (blader, MIT) 77 — stripped bold labels
4. anti-ai-slop-writing (jalaalrd) 77 — no LICENSE file → excluded
6. stop-slop (hardikpandya, MIT) 64 — DAMAGED facts in all 3 inputs → rejected (earlier size-based pick was wrong)
Decision candidate: anti-slop (elithrar) replaces humanizer; it lives in personal dotfiles → vendor with credit (MIT) and pin SHA.
Limits: one generator agent, n=3 inputs, one judge.

## De-slop bake-off round 2 (7 contenders, fresh blind Opus judge, JUDGE-2.md)
1. anti-slop (elithrar) 94 (round 1: 92) — consistent winner; lightest edits, no invented claims
2. antislop core+copywriting (miqdadbadjuber) 78 — facts kept on real docs, but strips bold lead-ins and invented features on input 3
3. anti-slop-writing (adewale) 75 · 4. humanizer 73 · 4. anti-ai-slop-writing 73 (no LICENSE) · 6. antislop (dhanji4u) 72 · 7. stop-slop 66
Decision candidate: prose pass = anti-slop (elithrar, vendored, SHA eb4f994). miqdadbadjuber suite used for design instead: antislop-human (a11y, 18/20) + antislop-layoutmobile (mobile web, 14/20) + contrast-check.py.
