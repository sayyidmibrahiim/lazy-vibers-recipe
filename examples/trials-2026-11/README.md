# Real-project planning trials (November 2026)

Ticket 24 ran two fresh Recipe planning sessions in Claude Code (Opus 5.5) in empty folders outside this repository. Each started from `/lvr-init-new-idea`, ran with live web search, and finished with `lvr-review-plan` and `lvr-handoff`. The owner set the trial scope to planning only: Recipe focuses on a thorough plan, so no builder run was made.

To view a trial, start the Recipe dashboard and open `examples/trials-2026-11/kpr-house-hunter` or `examples/trials-2026-11/futsal-court-booking`.

## How the answers were given

The owner answered the first intake questions in Indonesian. After that, the owner delegated the answers to a testing agent acting for the owner. Each later answer says so in the journal. Late in Section 9, the remaining choices were delegated to the planner's own recommendations, recorded in Indonesian as "recommendation accepted under owner delegation". The Futsal venue details (3 courts, Jakarta Selatan, opening hours, booking volumes) are trial assumptions, not a real venue. No income, savings, or other financial values were given to the KPR planner. Machine paths use example values. The interview, journal, and proposed Indonesian app labels keep their original language. [Answer log](answer-log.md)

## Results

| Project | Recorded answers | Review run 1 | Run 2 | Run 3 | Bundle |
| --- | --- | --- | --- | --- | --- |
| KPR House Hunter | 53 | Fix first, 7/10 (4 major, 4 minor) | Build-ready, 9/10 (3 minor) | Build-ready, 10/10, no open findings | `HANDOFF-PROMPT.md`, `VERIFICATION.md` present |
| Futsal Court Booking | 54 | Fix first, 7/10 (5 major, 6 minor) | Build-ready, 8/10 (2 major, 1 minor) | Build-ready, 10/10, no open findings | `HANDOFF-PROMPT.md`, `VERIFICATION.md` present |

The review ran in the same session that wrote each plan, so it is not independent. Raw per-run review transcripts are omitted. The reports and ledger are kept under `.lvr/review/`.

## What worked

- The KPR planner refused to ask for income or savings figures because the conversation leaves the laptop. Users type those numbers into the local app instead.
- Both planners cited dated sources for Indonesian rules and costs, and named the facts they could not verify (Depok NPOPTKP, the signed PP 33/2026 text).
- Review run 1 caught a false claim in the Futsal plan that a PSE procedure had been rechecked. The KPR planner rejected one incorrect review finding after checking the source.

## Defects found

1. The journal script has no per-answer source field, so "answered by the testing agent" lives only in answer text and section records. Fixed after the trials: `answer record --source` stores `owner`, `delegated_agent`, or `accepted_recommendation`, and the dashboard counts them per Section.
2. The Futsal planner replied once in English after Indonesian answers, then corrected itself and recorded the slip.
3. Four core boosters were read from the host `~/.agents/skills` instead of a project-local install.
4. Designer-filled decisions cannot change status after approval. The approval is recorded as a separate answer instead.
5. The KPR review ledger kept a wrong round count for run 2 because the ledger is append-only.
