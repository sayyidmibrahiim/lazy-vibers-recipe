# 40: Research-check hardening (ticket 26 advisories)
Status: done (2026-11-20) · Blocked by: 26 · Type: task · Agent: Opus (contract + text) → Sonnet (script)
Source: `runs/26-verify.md` advisories A1–A19 (each has a proposed rule). Created by the orchestrator 2026-11-20 because four of them touch the core of D12 ("never from memory").

Must (D12 core):
- [x] A1/A2/A3: `designer_filled` resting on an unverified fact through any link (brief `Became`, RQ id of a failed research event, a decision that is itself I11) → I11. `Became` ids must exist.
- [x] A12: a regulation's own source date is held to its freshness limit, not only the amend-check (matches orchestrator ruling 2 on ticket 26).
- [x] A13: every S1–S5 scan re-checks the Domain Brief's freshness first and re-researches expired items.
- [x] A14/A15: a tool outage is not "failed research": outage → stop with enable guidance; `failed` only when search + fetch worked and found nothing usable. One site's 403 does not count as an outage (try up to 3 results).
Should (detector/contract holes):
- [x] A4 category mislabel, A5 detection zones, A6 detector evasions, A7 URL validity, A8 amend-check order, A9 memory phrases (EN + ID).
- [x] A10/A11 `research log` validation + failed-brief event shape; A16 gate/web-check order; A17 status normalisation; A18 duplicate RQ ids; A19 zone headings case-insensitive.
Verify:
- One fixture per advisory in `fixtures/40/` with exact messages; fixtures 03/04/26 still pass.
- Re-run the ticket-26 adversarial table: every "out of contract" row is now caught or explicitly documented as allowed.

## Comments
- 2026-11-20: done after 1 fix round. Implementer Sonnet high (`runs/40-impl.md`), verifier Opus high (`runs/40-verify.md`).
- Round 1 closed B1 (an outage `web_check` no longer backs an `[unverified]` marker; new I9 message) and B2 (vendor price + billing word without a source is I1 in every scanned file; the 7 untagged futsal vendor lines are caught; `$0`/`Rp 0`/`per jam` are not). Also `Rp. 50.000` detection.
- Deviations accepted: A5 whole-file zones limited to OVERVIEW/architecture/SECURITY/CAPABILITIES plus the B2 rule everywhere; A12 regulation 60 days applies to the read date + amend-check, not the enactment date.
- Changed expectations (stricter, verified): fixtures/26 futsal 101→107→114 findings, I1 19→32; fixtures/40 A19 line reworded (B2 cases cover it).
- Evidence: fixtures 03, 04, 26, 40 all PASS; negative controls fail on the HEAD script; CLI fuzz replays []; lint/tsc/check:skills 0; all copies cmp-equal.
- Open advisory N13: test data such as "booking fee Rp 10.000" has no natural answer id; it is flagged until cited.
