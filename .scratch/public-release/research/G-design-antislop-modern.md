# G — Design / anti-slop / motion / a11y / UX-copy skills (curation, 2026-11-19)

Method: cloned `--depth 1` (never executed anything) pbakaus/impeccable, emilkowalski/skills, vercel-labs/{agent-skills,web-interface-guidelines}, anthropics/{skills,knowledge-work-plugins}, hardikpandya/stop-slop, adewale/anti-slop-writing, content-designer/ux-writing-skill, addyosmani/web-quality-skills, blader/humanizer, ehmo/platform-design-skills. Read SKILL.md (and key references). Stars/pushed_at/license from `gh api` on 2026-11-19. Scores = my reading of the files per RUBRIC (not executed). Search-engine snippets of third-party registries were used only for discovery, never for scores.

## Headline findings

1. The plan bundle needs a **design contract file**, not just a skill. Best-in-class pattern = Impeccable's two files: `PRODUCT.md` (platform, users, purpose, tone, constraints) and `DESIGN.md` (YAML-front-matter tokens: colors in oklch, type scale, components + prose rationale). Recommend S9 emits `UI_SPEC.md` (= PRODUCT-lite + DESIGN tokens + motion budget + copy voice + banned patterns) only for UI products. Adopt the schema idea (Apache-2.0, credit), do not require the Impeccable runtime.
2. Anti-slop for UI = a **named ban list with reasons** the builder reads before editing. Impeccable `craft-floor.md` and Anthropic `frontend-design` both provide one; they agree (no eyebrow labels, no 01/02/03 markers unless a real sequence, no identical icon-heading-text card grids, no gradient text, no glassmorphism by default, no cream+terracotta/near-black+acid-accent defaults).
3. Motion: Emil Kowalski's `review-animations/STANDARDS.md` gives a concrete budget (easing curves, duration table, never `ease-in`, never `scale(0)`, 0.97 press scale, < 300 ms). Vendor an excerpt into UI_SPEC template.
4. Writing anti-slop: all prose slop lists are **English-specific** (em-dash, "not X but Y", adverb bans). LVR output is in the user's language (this app: Bahasa Indonesia). Use them only as an optional English pass; the language-agnostic UX-copy rules (verb CTAs, error = what+why+fix, consistent vocabulary) are the portable part.
5. Mobile HIG/Material: no strong small skill found. Only option is ehmo/platform-design-skills (MIT, 36 KB per platform, stale since Mar 2026). Reference-only, conditional on native mobile.

## Scored candidates (/20)

Columns: 1 Action, 2 Output, 3 Verify, 4 NonTech, 5 Agnostic, 6 Tokens, 7 Helpers, 8 Evidence, 9 Maint, 10 Adopt.

| Skill (repo) | License | Last push | Stars | Size | 1 2 3 4 5 6 7 8 9 10 | Total |
|---|---|---|---|---|---|---|
| `impeccable` (pbakaus/impeccable) | Apache-2.0 (root LICENSE; `license:` in SKILL) | 2026-11-18 | 113k | SKILL.src 13.7 KB, 2.4 MB tree | 2 2 2 1 2 1 2 2 2 2 | **18** |
| `ux-copy` (anthropics/knowledge-work-plugins, design/) | Apache-2.0 root | 2026-11-19 | 36.5k | 3.4 KB | 2 2 1 2 2 2 0 0 2 2 | **15** |
| `stop-slop` (hardikpandya) | MIT | 2026-03-17 | 19k | 2.6 KB + 9.9 KB refs | 2 1 2 2 2 2 0 1 1 2 | **15** |
| `review-animations` (+STANDARDS.md) (emilkowalski/skills) | MIT | 2026-11-15 | 58k | 8.3 + 10.3 KB | 2 2 2 1 2 1 0 0 2 2 | **14** |
| `frontend-design` (anthropics/skills) | Apache-2.0 (LICENSE.txt) | 2026-11-16 | 197k (repo) | 9.4 KB | 2 2 2 1 2 1 0 0 2 2 | **14** |
| `accessibility` (addyosmani/web-quality-skills) | MIT | 2026-08-24 | 3.1k | 14.4 KB | 2 1 2 1 2 1 0 0 2 2 | **13** (+1 WCAG 2.2/re-audit loop = 14 used for overlap) |
| `ux-writing` (content-designer) | MIT | 2026-05-26 | 265 | 15.3 KB + refs/templates | 2 2 2 2 2 1 0 1 1 1 | **14** |
| `anti-slop-writing` (adewale) | MIT | 2026-11-15 | 23 | 15.2 KB + evals | 2 1 2 1 2 1 1 2 2 0 | **14** |
| `humanizer` (blader) | MIT | 2026-11-09 | 71k | 32.4 KB | 2 1 1 1 2 0 0 1 2 2 | **12** (matches owner's 12; rubric size penalty) |
| `web-interface-guidelines` command.md (vercel-labs) | MIT (repo LICENSE) | 2026-10-05 | 1.2k | 8.1 KB | 2 1 1 0 2 1 0 0 2 2 | **12** |
| `emil-design-eng` | MIT | 2026-11-15 | 58k | 28 KB | 2 1 2 1 2 0 0 0 2 2 | **12** |
| `apple-design` / `mobile-native` (emilkowalski) | MIT | 2026-11-15 | 58k | 23 / 17 KB | ~2 1 1 1 2 0 0 0 2 2 | **11** |
| `accessibility-review` (kwp design/) | Apache-2.0 | 2026-11-19 | 36.5k | 4.3 KB, WCAG **2.1** | 1 1 1 1 2 2 0 0 2 2 | **12** |
| `design-system` (kwp design/) | Apache-2.0 | 2026-11-19 | 36.5k | 5.6 KB | 1 1 1 1 2 2 0 0 2 2 | **12** (generic token list) |
| ehmo/platform-design-skills (ios/android) | MIT | 2026-03-19 | 646 | 36-39 KB each | 2 1 1 1 2 0 0 0 1 1 | **9** |
| `learn-taste` (emilkowalski) | MIT | 2026-11-15 | 58k | 9.3 KB | 2 2 2 1 2 1 0 0 2 2 | **14** (post-build, session-corrections to DESIGN.md; out of planner scope) |
| vercel `web-design-guidelines` SKILL.md wrapper | root LICENSE missing in vercel-labs/agent-skills (API license null; README says MIT) | 2026-10-27 | 34.5k | 1.2 KB | fetches rules at runtime from the other repo | n/a: **use the guidelines repo directly** (has MIT LICENSE) |

Gate notes: no NC/copyleft hits. vercel-labs/agent-skills and anthropics/skills show no root SPDX license; anthropics per-skill `LICENSE.txt` is Apache-2.0 (verified, file head), vercel agent-skills only "MIT" in README, so vendor from web-interface-guidelines (MIT) instead. Impeccable's `SKILL.src.md` is a template (`{{scripts_path}}`); its launcher downloads a binary on first run (supply-chain flag, see below).

## Evidence quotes (re-verification of top picks)

- Impeccable frontmatter: `license: Apache 2.0`; README: "A slop detector. 62 deterministic rules flag the tells above ... No LLM, no API key." (`npx impeccable detect src/`).
- Impeccable craft-floor: "A kicker or eyebrow above a heading. This one is a ban, not a default: no brief earns it back." and "Same-size cards of icon plus heading plus text as the page structure."
- Impeccable setup: "The launcher runs a self-contained binary that ships next to it or is downloaded once on first run" (flag: untrusted download, builder-side opt-in only).
- Anthropic frontend-design: "Many generic designs use numbered markers (01 / 02 / 03), but that's only appropriate if the content actually is a sequence"; "Errors don't apologize, and they are never vague about what happened"; "first, brainstorm a short design plan ... color: 4–6 named hex values ... ASCII wireframes" (planning-shaped, ideal for S9).
- Emil STANDARDS.md: "Never `ease-in` on UI"; `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`; "Never `scale(0)`. Start from `scale(0.9–0.97)` + `opacity: 0`"; "UI animations stay under 300ms."
- Vercel guidelines: "Never `transition: all`—list properties explicitly"; "Never `outline-none` without focus replacement"; "Honor `prefers-reduced-motion`"; "Destructive actions need confirmation modal or undo window".
- ux-copy: "Error Messages Structure: What happened + Why + How to fix"; "Label buttons with the action: 'Delete files' / 'Keep files' not 'OK' / 'Cancel'".
- stop-slop: "Below 35/50: revise." (five-dimension self-score); "No em dashes." (English-centric).
- web-quality accessibility: "Fix the source, then re-run the same audit and manual interaction." (WCAG 2.2, Lighthouse/axe loop).

## Overlap decisions (rule applied)

| Job | Winner | Losers (score) | Reason |
|---|---|---|---|
| UI design direction + ban list for builder | **impeccable** 18 | frontend-design 14, emil-design-eng 12 | Highest score; frontend-design is Impeccable's ancestor. Keep frontend-design as **fallback excerpt** where the binary/hook cannot run (it is 9 KB, pure prose, no helper). |
| Motion rules | **review-animations STANDARDS.md** 14 | impeccable animate.md (8.7 KB, similar but world-specific), emil-design-eng 12 (28 KB) | Concrete numeric budget; smallest numeric source. |
| Web UI pass/fail checklist | **web-interface-guidelines command.md** 12 | web-design-guidelines wrapper (runtime fetch, license gap) | Vendor file; wrapper adds network dependency. |
| Accessibility | **web-quality accessibility** 14 | accessibility-review 12 (WCAG 2.1, stale), ehmo web/ios 9 | WCAG 2.2 + verification loop. |
| UX copy / microcopy | **ux-copy (kwp)** 15 | ux-writing content-designer 14, impeccable clarify.md | Smaller, Apache; take content-designer `voice-chart-template.md` as optional reference. |
| Prose de-slop | **stop-slop** 15 | anti-slop-writing 14, humanizer 12 | 2.6 KB vs 32 KB. Recommend replacing humanizer (12) with stop-slop, or keep humanizer only as owner already decided; ask owner. Both English-only. |
| Design tokens | impeccable DESIGN.md schema | kwp design-system 12 | Real schema vs generic list. |
| Mobile native | none strong; ehmo 9 reference only | | |

## Mapping to sections

| Skill | Where | Tier | How |
|---|---|---|---|
| impeccable (PRODUCT.md/DESIGN.md schema + `shape` interview questions + craft-floor ban list) | **S4** capture UI expectations (use `shape.md` Round 1/2 questions, plain-language: feel, who, states, "what would feel wrong even if polished"); **S9** `UI_SPEC.md` template adopts DESIGN.md schema; **S10** builder boosters line: install `impeccable` + design hook | conditional (UI products only); builder-side install | Planner vendors the schema + ban list excerpt (Apache, credited). Runtime install is the builder's choice. |
| frontend-design | S9 (design plan: 4–6 named colors, type roles, ASCII wireframe, principles; "review plan against brief") | reference (vendored excerpt, fallback) | Gives non-tech user a reviewable plan before code. |
| review-animations STANDARDS | S9 UI_SPEC "Motion" section; S10 build rule | reference excerpt | Duration/easing table + frequency rule (no animation on 100+/day actions). |
| web-interface-guidelines command.md | S9 UI_SPEC "Hard rules" (a11y, focus, forms, touch, dark mode); S10 verify gate (`file:line` review) | reference excerpt | Mostly React/Next-ish but 90% generic web. |
| web-quality accessibility | S4 (record a11y target: WCAG 2.2 AA, keyboard, reduced motion); S10 verify | conditional (UI) | Re-audit loop requires Lighthouse/axe/Chrome DevTools MCP, pairs with playwright-mcp. |
| ux-copy (+ content-designer voice chart) | S4 (voice & tone questions), S9 `UI_SPEC` "Copy" section (CTA verbs, error/empty/confirm patterns, one vocabulary per action, language = user's) | reference | Language-agnostic patterns; examples must be written in user's language. |
| stop-slop (or humanizer) | S9 optional final pass on English prose files only | reference/optional | Do not apply to Indonesian output; slop lists are English. |
| emilkowalski `learn-taste` | post-handoff idea: builder writes corrections to DESIGN.md | out of scope | Mention in HANDOFF. |
| ehmo platform-design-skills | S9 only when product is native iOS/Android | reference, conditional | 36 KB, link not vendor. |

Core tier impact: none. All design skills are **conditional** (installed when S1 says "has UI") or **reference**. Core list stays ≤5.

## Recommended UI_SPEC.md skeleton (S9, UI products only)

1. Product feel (3 adjectives + 1 sentence "must NOT feel like": user words from S4)
2. Tokens: 4–6 named colors (+ contrast notes), type roles/scale, spacing/radius/elevation (declare elevation once)
3. Layout concept: ASCII wireframe per primary screen + states (empty, loading, error, success)
4. Motion budget: table (press 100–160 ms, tooltip 125–200, dropdown 150–250, modal 200–500), easing tokens, reduced-motion rule, "no `transition: all`"
5. Copy voice: tone per context, CTA verb rule, error = what + why + fix, empty-state = invitation, one name per action, language rule
6. Banned patterns (the slop list above, with reason each) and allowed exceptions ("brief wins")
7. Accessibility: WCAG 2.2 AA, focus-visible, labels, 44 px targets, contrast 4.5:1
8. Verification: screenshots at breakpoints, `impeccable detect` if installed, web-interface review

## Risks / caveats

- Impeccable launcher downloads a binary on first run and installs hooks that scan edited files; treat as untrusted, make it an explicit builder opt-in, never auto-run from LVR.
- Impeccable is huge (2.4 MB, 24 commands); do not vendor wholesale, only schema + ban list.
- Several stars figures come from `gh api` (reliable); registry mirrors disagreed (unreliable) so ignored.
- Rubric adoption signal is noisy: 197k stars for anthropics/skills monorepo says nothing about one skill.
- Scores are reading-based; none executed.
- Not covered: Figma-token tooling, Material 3 per se (only via ehmo), `skills.sh` trending page returned empty to fetch (JS-rendered), so leaderboard install counts not checked.

Clones: /tmp/claude-1000/-home-ibrahim-projects-lazy-vibers-planner/ee201c87-bd98-5c51-a2d1-4022b81f176a/scratchpad/curate-g/

## antislop suite (miqdadbadjuber) evaluation

Gate: MIT (verified via gh), 9.5k stars, last commit 2026-11-18 (commit 1969b45), SKILL.md files read. Scores /20 (reading-based, nothing executed). Common shape: every entry is Tell / Why / Fix keyed to core rule R-XX, plus a per-skill checklist; the core adds a Delivery Gate. Skills are not standalone: each says "load with the core" (53.8 KB), so true load cost is core + skill.

| Skill | Size | Score | Key evidence |
|---|---|---|---|
| antislop (core) | 53.8 KB | 14 | "Part 2: Mandatory Rules (R-01 to R-40)", Hard Gate / Delivery Gate; 0 on tokens (>20 KB, no references); installers in cli/ |
| antislop-ui | 30.5 KB + 2 refs | 15 | Tell/Why/Fix for gradients, glass, radius, bento, "3 steps", Lucide; refs/CORE-WEB-VITALS.md (LCP <=2.5s, INP <=200ms); no ms motion table (0 hits for "ms" in SKILL.md); 4-image before/after in assets/compare/ui |
| antislop-layoutmobile | 16.4 KB | 14 | "interactive targets ... 44 x 44 px with spacing"; `clamp()` fluid type; `dvh`; safe-area insets; "zero horizontal scroll at the narrowest target (R-35)" |
| antislop-human | 15.9 KB + 2 refs + 2 py | 18 | contrast-check.py (4.5 / 3.0, exit code, `--selftest` parses SKILL.md table, run in CI); refs/WCAG.md, A11Y-PATTERNS.md |
| antislop-copywriting | 28.0 KB | 13 | Before/After pairs for AI-prose tells (em dashes, rule of three, chatbot closers); English-only slop lists; marketing-biased |
| antislop-code | 8.9 KB | 14 | comment hygiene, "Not a Ban (preserve these)", scope guardrail "only modifies comments" |

Tooling (cli/, scripts/): `cli/` is only an installer (picker for ~10 agent harnesses, `--update`, conflict/duplicate-read detection) plus a `dsh` plugin; `scripts/check-repo.mjs` lints the repo itself. The only reusable deterministic check is `skills/antislop-human/contrast-check.py` (stdlib Python, WCAG ratio). There is no slop detector comparable to `impeccable detect`; "antislop" enforcement is entirely model-judged. CI runs the contrast selftest and the installer smoke test (3 OS), but no evals of rule effectiveness; evidence is screenshots.

### Head-to-head by function (rule quality, not size)

| Function | G winner | antislop | Verdict |
|---|---|---|---|
| Anti-slop UI / visual | impeccable 18 (schema + ban list + detect engine) | ui 15: good named-pattern coverage, qualitative fixes, few numbers | Lose to impeccable; complement only as a cheap ban-list cross-check |
| Motion | emilkowalski 14 (duration/easing table, frequency rule) | ui motion is qualitative, no ms thresholds | Lose |
| Copy / UX writing | ux-copy 15 (CTA, error, empty-state patterns) | copywriting 13: strong on AI-prose tells, weak on UI microcopy patterns, English-only | Lose for UI copy; complement (stop-slop role) for English marketing prose |
| Accessibility | web-quality a11y 14 | human 18: measurable (4.5/3.0 contrast, 44 px, focus, reduced motion, WCAG 2.2 depth) plus a runnable checker | Replace/complement: human beats it on score and has a deterministic helper; web-quality's Lighthouse loop still covers runtime audits |
| Web interface rules | vercel web-interface-guidelines 12 | partial overlap in human + ui | Complement |
| Mobile (gap) | none (ehmo 9 reference only) | layoutmobile 14 | See below |
| Code comments | none in G | code 14 | Optional new, tiny; low value for LVR |

### Does antislop-layoutmobile fill the mobile gap?

Partly. It is responsive web layout (breakpoints by content not device list, fluid `clamp()` type, 44 px targets with spacing, no horizontal overflow, bottom-nav/safe-area, hover-only interactions). Rules are specific and verifiable, but only 44 px is numeric; it has nothing on iOS HIG / Material 3 (48 dp, navigation patterns, gestures, platform conventions). So: fills "mobile web responsive" (adopt as reference excerpt for UI_SPEC Layout + Verification), does NOT fill native mobile HIG/Material; keep ehmo platform-design-skills for that.

### Verdict

- antislop-human: adopt (complement/replace web-quality a11y for rule content; reuse contrast-check.py as a deterministic gate, MIT, stdlib).
- antislop-layoutmobile: adopt as reference excerpt (partial gap fill).
- antislop-ui, copywriting, core: lose to impeccable / emilkowalski / ux-copy; mine ban-list entries only.
- antislop-code: skip.
- Risk: core is 54 KB and is required by every sibling; vendor excerpts, do not require the whole suite.
