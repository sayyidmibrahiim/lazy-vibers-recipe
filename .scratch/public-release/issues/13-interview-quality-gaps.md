# 13: Close the plan-quality gaps (futsal audit)
Status: done (2026-11-23) · Blocked by: 07 · Type: task · Agent: Sonnet (Opus review)
Source: brainstorm-01 gaps 1–7.

- [x] S4: mandatory unhappy paths per feature (abandon, bad input, concurrency, expiry/hold) via deliver-edge-cases.
- [x] S3: abuse/threat model. A public form leads to rate-limit/captcha decisions (threat-modeling).
- [x] S6: regulated-domain detection (finance, health, legal, minors) becomes a mandatory finding.
- [x] S2/S5: usage-based cost (per user/month, LLM tokens), not just fixed costs.
- [x] S9: a data sources & integrations section (origin, license/ToS, refresh cadence).
- [x] S8/S9: an NFR + ops block (timezone, browsers, a11y, error tracking, uptime, owner alerts, restore test).
Verify: a futsal re-run audit scores ≥4 on NFR, threat model and observability (previously 1–2.5).

## Comments

Futsal plan rerun scored 4/5 for nonfunctional requirements, 5/5 for threat modeling and 5/5 for observability. Thirty-seven focused checks and the shared regressions passed. See [implementation](../runs/13-impl.md) and [same-context verification](../runs/13-verify.md).
