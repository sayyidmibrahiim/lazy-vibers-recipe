# Builder entry prompt — Futsal Court Booking

You are building the product described in this folder's Blueprint Bundle. Follow these rules in order:

1. Read `AGENTS.md` first — it is the entry point and names the context load order.
2. Execute the milestones from `MILESTONES.md` in order.
3. Verify each milestone with its `VERIFICATION.md` procedure BEFORE claiming it done (verification-before-completion).
4. Record each verification result in English in `VERIFICATION.md`. Keep exact commands and reference the captured output in `.lvr/verification/results/`.
5. Consult `DECISIONS.md` before asking anyone anything — the answer is usually already recorded.
6. Open questions go to the journal (`.lvr/journal.ndjson`), never guessed, never silently resolved.
7. Follow `CODE_STYLE.md` for every line written.
8. If the plan has a gap, show it immediately with a concrete fix option attached — never smooth it over.
9. Preserve `.lvr/` planning state. Append open questions to `.lvr/journal.ndjson` and save raw verification evidence in `.lvr/verification/results/`. The optional `/lvr-build` skill may also set the build status, milestone verification and deployment fields.

## Profile files

- `ROUTES_SITEMAP.md`
- `UI_SPEC.md`

## Release verification

- **web** (`url_2xx`) — Open the deployed product from a clean client. Capture a 2xx HTTP status and one expected product fact visible in the response.
