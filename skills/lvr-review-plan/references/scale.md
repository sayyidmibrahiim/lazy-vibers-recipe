# Review scale: severity, lens score, verdict

Severity is a lookup and the score is a pure function of the findings, so the same plan always gets the same score. `lvr.mjs review score` computes everything on this page (`references/contract.md` §7). By hand, apply the tables in order and show the arithmetic in the report.

## 1. Inputs every finding records

| Field | Values | Meaning |
|---|---|---|
| `impact` | `I4` stop | The builder cannot go on; or there is legal, security or financial harm, data loss, or the product contradicts itself |
| | `I3` rework | The builder will guess; a milestone is redone; the wrong product ships |
| | `I2` friction | It works, but costs time or quality; a quick fix |
| | `I1` polish | No effect on the build |
| `likelihood` | `L3` | It will happen unless fixed, or it is already true in the text |
| | `L2` | Plausible for this user and stack (the reference class says at least 1 in 5) |
| | `L1` | It needs unlikely conditions |
| `one_way_door` | `true` / `false` | The harm cannot be undone after launch (L10.5) |
| `detect` | `caught` | A verification step, lint, test or monitor in the plan would catch it before users are harmed. Quote it in `detect_quote` |
| | `weak` | Something notices late (a user complaint, a manual look) |
| | `none` | Nothing in the plan would notice |
| `load_bearing` | `true` / `false` | A decision, cost line, MVP constraint or milestone rests on the claim |
| `evidence_level` | `0` none · `1` model memory (invalid) · `2` one non-primary source · `3` a primary source, or two independent fresh sources | For claim findings. Expired sources do not count |

Start `impact` from the check's impact hint (lenses.md). A different value needs `impact_reason`. "When this fails" wording, not "if": assume worse.

## 2. Severity lookup

Apply the steps in order:

1. Base severity:

   | | L3 | L2 | L1 |
   |---|---|---|---|
   | I4 | blocking | blocking | major |
   | I3 | major (blocking when `one_way_door`) | major | minor |
   | I2 | minor | minor | minor |
   | I1 | note | note | note |

2. `detect` = `none` raises the severity one level: minor → major, and major → blocking. A note stays a note.
3. A `load_bearing` claim with `evidence_level` of 1 or lower is at least major.

Severity changes only when these inputs change, and each input change needs a written reason. It never moves to be agreeable or to improve a score.

## 3. Lens score (0–10)

Counted findings: status `open`, `partial`, `regressed` and `accepted`. Findings that are `fixed` or `withdrawn` are not counted, and notes are listed but not counted. B = blocking, M = major, m = minor.

| Condition (first match wins) | Score | Anchor |
|---|---|---|
| The lens's core artifact is absent (an `Lxx.0` finding) | 1 | The lens cannot be assessed; the report lists what is missing |
| B ≥ 3 | 2 | |
| B = 2 | 3 | |
| B = 1 and M ≥ 3 | 3 | |
| B = 1 | 4 | The build would fail or cause harm here |
| M ≥ 6 | 5 | Systemic gaps |
| M = 4–5 | 6 | The plan is half-specified for this lens |
| M = 2–3 | 7 | The builder will improvise in places |
| M = 1 | 8 | One real gap |
| m ≥ 6 | 8 | Sound but sloppy |
| m = 1–5 | 9 | Sound, with cosmetic issues |
| nothing counted, and the clean evidence is complete | 10 | Nothing findable with these checks. It does not guarantee success; the residual-risk list is still printed |
| nothing counted, but the clean evidence is incomplete | 9 | |

"Clean evidence complete" means every R cell is clean with a verified quote and `tried` (or na with a reason, or holds only notes plus a verified quote), no cell is blocked, and every load-bearing claim assigned to the lens has a logged attack.

0 is never given. A lens whose R cells are all blocked is `unscored`, with the reason. A lens that does not apply is `na`, with the reason. Neither enters the overall score.

na never hides a gap. Only L06 (when `state.product.flags.stores_data` is false) and L14 (when `has_ui` is false) can be na as a whole. Every other lens applies always, and "it is not relevant for us" is not a reason. A lens with a counted finding is always scored. A cell whose file holds a finding of that lens cannot be na. A lens that applies but whose R cells are all na is `unscored`, which keeps the plan off BUILD-READY.

## 4. Caps

- A lens with a blocked cell scores at most 8.
- A load-bearing claim still `[unverified: …]` after this run's research caps L01 at 6 and the verdict at FIX-THEN-BUILD. (No web at all is not a cap: the skill stops, conventions §10.)
- An `unscored` lens caps the verdict at FIX-THEN-BUILD.

## 5. Overall and verdict

Overall = floor((mean of the applicable lens scores + the minimum lens score) / 2). With integers: `floor((sum + n × min) / (2 × n))`.

| Verdict | When (first match wins) |
|---|---|
| `INCOMPLETE` | Fewer than 2 sweep passes, or the last pass still found something new. Rerun now; never deliver it as final |
| `BUILD-READY` | 0 counted blocking findings, min ≥ 8, overall ≥ 8, and no cap applies |
| `FIX-THEN-BUILD` | 0 counted blocking findings and min ≥ 5 |
| `NOT-READY` | Anything else |

Accepted risks (a `user_confirmed` decision with the cost written) keep status `accepted` and keep their severity. They count toward the score and the verdict, but they are listed apart from the must-fix list ("N accepted blocking risks"). An accepted blocking risk still scores its lens 4 or less, so the verdict stays NOT-READY. `/lvr-build` reads only open blocking findings, so the user may still build at their own risk.

Scope-only runs (protocol §10) use the same function, but the verdict is phrased as a scope verdict: BUILD-READY → "scope sound: lock it", FIX-THEN-BUILD → "fix before locking", NOT-READY → "do not lock yet". It is never a build verdict.

## 6. Run-N fairness numbers

- `score_now`: this run's overall score.
- `score_if_caught_in_run1`: the first full run's overall score, recomputed as if every `missed-earlier` and `checklist-gap` finding of later runs had been found in that run (each one counts in every earlier run from `should_since`, the first run whose locator content equals today's). Trends use the corrected history, so the user is not penalised for the review's misses.

## 7. Worked examples

- A lens with B=1, M=0 scores 4. The same lens with B=1, M=3 scores 3.
- A store that keeps data but has no `SPEC/data-model.md` gives an `L06.0` finding and L06 scores 1.
- A lens with every R cell clean, quoted and attacked, and nothing counted, scores 10.
- Lens scores 9, 8, 8, 4 (n=4, sum 29, min 4): overall = floor((29 + 16) / 8) = 5. One blocking finding makes the verdict NOT-READY.
- Lens scores 9, 9, 8 (sum 26, min 8): overall = floor((26 + 24) / 6) = 8. With no blocking finding and no cap, the verdict is BUILD-READY.

## 8. Optimism correction (heuristic)

The report shows "realistic" numbers next to the plan's own numbers. The plan files are not edited. These rules are LVR heuristics, not research results: every realistic number is labelled "heuristic" and names its reference class (or "none: novel project"). Do not quote outside study figures for them unless this run fetched and cited the study.

| Rule | Applies to | Realistic value |
|---|---|---|
| U1 | Schedule estimates | × 1.5; × 2 for a stack new to this builder or an integration with an undocumented API |
| U2 | Usage-priced cost at the stated volume | × 2 |
| U3 | Usage-priced cost where the volume is a guess (no source, no answer id) | × 3 |
| U4 | An integration step that assumes it "works first try" | Budget one failed attempt (one extra session) |
| U5 | Third-party limits and quotas | The lowest documented tier, unless the plan buys a higher one |
| U6 | Free-tier claims | Priced at the first paid tier at 10× volume (L08.2) |

`runs/run-N/realistic.json` rows: `{item, file, plan_value, unit, rule, factor, realistic, reference_class}`. The script prints the rows as written and does not check them: show the multiplication in the row, and keep `realistic = plan_value × factor` for U1–U3.
