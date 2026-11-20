# 40: Research-check hardening (ticket 26 advisories)
Status: ready-for-agent · Blocked by: 26 · Type: task · Agent: Opus (contract + text) → Sonnet (script)
Source: `runs/26-verify.md` advisories A1–A19 (each has a proposed rule). Created by the orchestrator 2026-11-20 because four of them touch the core of D12 ("never from memory").

Must (D12 core):
- [ ] A1/A2/A3: `designer_filled` resting on an unverified fact through any link (brief `Became`, RQ id of a failed research event, a decision that is itself I11) → I11. `Became` ids must exist.
- [ ] A12: a regulation's own source date is held to its freshness limit, not only the amend-check (matches orchestrator ruling 2 on ticket 26).
- [ ] A13: every S1–S5 scan re-checks the Domain Brief's freshness first and re-researches expired items.
- [ ] A14/A15: a tool outage is not "failed research": outage → stop with enable guidance; `failed` only when search + fetch worked and found nothing usable. One site's 403 does not count as an outage (try up to 3 results).
Should (detector/contract holes):
- [ ] A4 category mislabel, A5 detection zones, A6 detector evasions, A7 URL validity, A8 amend-check order, A9 memory phrases (EN + ID).
- [ ] A10/A11 `research log` validation + failed-brief event shape; A16 gate/web-check order; A17 status normalisation; A18 duplicate RQ ids; A19 zone headings case-insensitive.
Verify:
- One fixture per advisory in `fixtures/40/` with exact messages; fixtures 03/04/26 still pass.
- Re-run the ticket-26 adversarial table: every "out of contract" row is now caught or explicitly documented as allowed.
