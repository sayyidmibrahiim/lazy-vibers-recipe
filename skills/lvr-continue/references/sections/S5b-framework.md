# S5b — Framework discovery

Run this inside S5 after the competitor scan. Work in the user's language when explaining options. Keep technical names, version numbers and source URLs exact.

1. Read the confirmed product profiles and reuse S1–S4 for required platforms, skills, builder/team, devices, accounts, budget, hosting, location and features. For an established stack, preserve the recorded choice and research compatible additions if needed. Record why discovery is skipped if there is no framework decision, such as a portable prompt-only skill.
2. List leads with `LVR framework candidates --type PROFILE`. Run it for each confirmed profile and combine the lists. Use `--slot TYPE` to compare peers within a layer. Shortlist the candidates that can meet the same need. Include the user's named choices and add researched leads if the catalogue is thin. Record a dated source for each new candidate. The catalogue contains upstream identifiers for investigation, without current health, compatibility or price claims.
3. Check the must-haves before scoring. Gather primary evidence for license terms, devices and platforms, monthly and store costs, accounts and runtimes, skill floor and required features. Record each applicable rule under `required_hard` and each candidate's outcome under `hard`. A verified incompatibility removes the option and keeps its reason visible. An unknown result needs research before the option can be presented as eligible. Collect the live signals next to finish the health checks. If fewer than two options pass, open a S6 loop-back and ask which flexible constraint the user wants to revisit. Never relax a must-have yourself.
4. Collect and archive the signals, then rank with the matrix below. Record the shortlist, hard checks, dates, weights, scores, exclusions, unresolved evidence and risks in the S5 Section Record. Log findings via `LVR research log` with purpose `s5`. A per-source failure is an incomplete observation. Follow the S5 outage procedure when the required search or fetch capability itself is unavailable.
5. Explain up to three eligible options in rank order. For each, give what the user gets, monthly cost and limits, the biggest risk, how the builder would work with it, and when to choose it. Recommend one and state the strongest reason against it. Say which details still need evidence. Keep at least two eligible choices on the recommendation surface.
6. Ask one question with the options and the usual “ask me more”, skip and enough controls. The user may choose another candidate that passes the hard checks. Clarify a new must-have or a rejected option with S6. An explicit skip uses the recommendation with `defaulted: true`; a pause keeps the decision open.
7. Record the choice in the S5 record and Decisions. Use `LVR decision record --event framework_selected --in -` with the next reserved `decision_id` in the event payload and the corresponding decision in `decisions`. In `payload`, set `section: "S5"`, `slot: "stack"`, `chosen: {id, name, version}` (version only when verified), scored `alternatives`, actual `confidence`, `user_override`, `defaulted`, `signals_ref` from the collector, and the ranker's `recheck_by`. Set decision status to `user_confirmed` for a user choice or `assumed` for a skip. A library-only follow-up uses its own slot after a stack choice exists. Preserve the confirmed choice if refreshed evidence changes the recommendation. Open a question for the user if the change affects feasibility.

## Collecting evidence

```text
LVR framework candidates --type web --slot web
LVR signals next,astro,sveltekit --out .lvr/signals-YYYY-MM-DD.json
LVR signals next,astro,sveltekit --offline
LVR framework rank --in .lvr/framework-assessment.json
```

Pass up to 20 candidate IDs per signal run. You can also pass `--in FILE` or `--in -` with an object containing `ids`, `additions` and an optional `versions` map of selected IDs to exact package pins. An addition needs a new `id`, peer `type`, and at least one official `gh` repository or package identifier (`npm`, `pypi`, `crate`, `pub`). It can include an `eol` product and a Context7 query (`c7`). Verify added projects' docs through research and cite those sources in the record.

- The collector uses GitHub, npm, deps.dev, PyPI, crates.io, pub.dev, OSV, OpenSSF Scorecard, endoflife.date, Context7 and official `llms.txt` files as applicable. These sources return different fields for different ecosystems. OSV delimits advisories to the exact package and version. An empty response from an unreachable source means advisory coverage is unknown. Review returned advisory IDs and license restrictions when their terms affect the proposed use. Never publish source credentials or raw upstream responses.
- Every observed value has `source` and `fetched` (UTC date). Missing fields and unreachable sources have a reason. A request that never returned evidence uses `fetched: null`. Keep the original date and mark stale observations when falling back to older cache entries. Record competing observed values side by side if they disagree.
- A registry owns its package's version. A clean GitHub tag can provide a release for a repository without a package registry. A monorepo adapter or prerelease tag stays in the record as a warning. A GitHub–registry major mismatch needs a human or primary-source check before pinning. Flutter's source for stable SDK releases is its official manifest. Riverpod has its own package version.
- Count Context7 only for a result whose library ID matches the official GitHub repository. Treat any other result as unmatched. Validate independently if a website library has replaced a repository entry. An HTML success page is insufficient proof of `llms.txt`.
- Cache API observations for 14 days in the project. `--offline` reads only cached evidence. `--refresh` attempts new requests, respecting rate limits. GitHub's public limit is normally 60 requests per hour. The user may set `LVR_GITHUB_TOKEN` in their local environment to raise it. The token goes to GitHub's API only. Redirects are treated as unavailable evidence. Node versions with built-in environment proxy support can use the configured proxy.
- Write the snapshot to its own path under `.lvr/`. Keep the snapshot and returned checksum with the decision. If the final proposed pin differs from the collected version, verify the exact pin and rerank before recording. Recheck evidence at S9 and at handoff if its recheck date is due. Include approved pins, dated citations, license and verified documentation IDs/URLs in the stack section of `SPEC/architecture.md`.

## Ranking inputs and matrix

The rank input contains `signals` (the saved snapshot), `persona` (S2's `user_skill` 0–2, `builder` `agent|user+agent|team`, `team_size`, `budget_monthly_usd_max`, `must_self_host`), `required_hard` (applicable names from `license|platform|budget|hosting|skill|capability`), and `assessment` keyed by candidate ID.

Each `assessment` entry has `hard` checks keyed by rule with `{pass, reason, evidence}`. Pass is true, false or null. An optional `margin` for a passing check is normalized to 0–1, with 0 at the limit and 1 for ample room. Use comparable margins across the shortlist. Provide `scores` for C1, C2, C5 and C7 as `{score, reason, evidence}` per criterion. Evidence entries are `{source, fetched}` or `{ref}` pointing to an actual answer, decision or research ID. Supply `cost_usd_monthly` and `cost_evidence` when comparable costs are verified.

| Criterion | Base weight | 0–5 scale |
|---|---:|---|
| C1 Feature fit | 25 | 5 all needs supported directly, 3 must-haves supported with planned additions, 1 major workaround |
| C2 Skill and team fit | 15 | 5 the builder and maintainer can work today, 3 achievable learning, 1 substantial support needed |
| C3 Buildability with an agent | 15 | Collector evidence gives 2.5 each for working `llms.txt` and matched Context7 with benchmark ≥70 and ≥1,000 snippets |
| C4 Health | 15 | Release or repository activity at ≤90/180/365/730 days scores 5/4/3/1. Older scores 0. An available Scorecard ≥7 adds 0.5, with a ceiling of 5. A lone Scorecard is scaled to 0–5. |
| C5 Cost and hosting | 10 | 5 verified headroom, 3 at or near the ceiling, 1 recurring pressure. Reject proven budget failures before scoring. |
| C6 Longevity and risk | 10 | Average verified version lifecycle and license indicators. Supported or permissive evidence scores 5. Known restrictive licenses score 2.5 pending review. An unsupported version is removed. |
| C7 Reach and performance | 10 | 5 the target audience can use it under expected conditions, 3 plausible with a test, 1 material limitations |

Each weight is a share of 100. Novice with agent alone moves five points each to C2 and C3 from C6 and C7. Team of three or more moves five from C2 to C6. Zero budget moves five from C7 to C5. Mandatory self-hosting moves five from C4 to C6. Apply all relevant shifts and preserve the resulting weights.

Scores are weighted on the 0–100 scale. Unknown scores contribute a neutral midpoint to provisional ordering and are listed as missing. Partial derived scores disclose which evidence was available. The normal health filters remove archived or deprecated versions, an unsupported version, a confirmed critical advisory on the pin, and projects inactive both by release (>365 days) and by push (>180 days). Review missing health or license coverage before confirmation. Keep confidence low when such evidence remains incomplete.

When totals are within five points of the highest score in a group, compare comparable hard-constraint margin, C3, lower comparable monthly cost, C4, the curated conservative default and finally the stable ID. Persist the matrix and reasons. The rank result lists up to three eligible candidates and signals when S6 needs to reopen a constraint.
