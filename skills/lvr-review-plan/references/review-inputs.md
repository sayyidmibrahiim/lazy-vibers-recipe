# Review inputs

Use these checks in every applicable review, before scoring. Keep the lens checks, quotes and ledger workflow in the protocol.

## Project and profile evidence

- Run `LVR journal check` and `LVR replay --compare` before the blind sweep. Send a damaged or inconsistent project to `/lvr-continue`. A normal review reads these checkpoints and leaves plan files intact.
- In a full review run `LVR profile plan`, `LVR lint run`, `LVR crosscheck` and `LVR cite check --all`. Check the approved profiles and their exit criteria. Use the `blueprint.json` v2 list and the profile columns in `review snapshot`. A v1 bundle uses its base list. For scope-only, use its Section Records and the offered scope, as described in the protocol.
- Compare UI interactions and accessibility checks with `UI_SPEC.md` and `VERIFICATION.md`. For model features check the approved input and output rules, the runnable evaluation set of at least ten cases, and the required thresholds. If data is stored, compare the permitted Mermaid ERD with the entities, relationships and migration/restore checks in `SPEC/data-model.md`. For workflows, compare triggers, permissions, evals and install manifests with the exact release target. Use the corresponding existing lens and quote the actual evidence.

## Current sources

- Start with the cited facts and the Domain Brief. Use current primary sources or independent sources as required in conventions §10. Apply the category limits in `freshness.json`. Read newer rules, fees and rates affecting the Domain Brief and every load-bearing fact. Record source dates and any conflict resolution. Treat impacted decisions as findings or owner choices. Use `research_logged` with `purpose: "recheck"`. Preserve the closed brief during a read-only run.
- Use `LVR verify freshness` to spot expired stack and library choices. Rerun `signals --refresh` on the approved pins when `recheck_by` is due, then check the official docs and use the [S5b procedure](sections/S5b-framework.md) to compare the result. Keep the approved choice unless the owner accepts a change in `--apply` or the owning planning Section.
- No usable search/fetch tool means stop with the enable steps. A search that ran and found no usable source is logged as such and may carry an unverified marker. Keep those situations distinct.

## Review aids

- Before taking the snapshot, use `LVR booster plan --section S6 --harness NAME` for threat, cost and storage aids and S9 for affected UI/model/workflow artifacts. Use the [project-local booster lifecycle](booster-lifecycle.md) to stage missing applicable installable entries. Read pinned reference entries when their method applies. For a failed install or unloadable aid, record its result and the degraded review method. Keep the catalog tier visible in Limitations.
- If the bounded data, threat or cost review needs a specialist, use verified planning-only routing if the installed helper supports it. Otherwise perform that check inline. Journal the actual transport with `agent_delegated`, give it only the files and cited evidence in scope, and validate its result yourself. Specialist advice cannot set a score, mark a milestone or change the bundle. Failed attempts belong in Limitations.
- At the end of a review run, use its `review_started` and `review_done` sequence bounds for the lifecycle cleanup. Existing user skills, links and configurations stay in place. When the review pauses, retain tracked paths and restart from the first unfinished checkpoint.
