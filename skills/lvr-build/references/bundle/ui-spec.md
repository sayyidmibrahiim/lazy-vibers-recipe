# UI specification for products with an interface

When the confirmed profile plan has `has_ui: true`, S4 captures the interface choices and the new frozen plan includes `UI_SPEC.md`. Use the existing bundle plan for resumed projects. Adding a file to an already locked or compiled bundle follows its recorded add-feature decision.

## S4 interview

Use the profile plan's feel, voice and access questions, within the usual batch limit. Reuse a recorded accessibility or device constraint. Ask users what should happen on their first screen, which phrase they would use at a successful or failed action, and which devices, input methods, disabilities or conditions matter. Ask for one concrete example of a result to avoid. Treat sample products as references for a user need or trait, with independent layout and identity.

Apply `impeccable` for product direction, `ux-copy` for messages and `antislop-human` for accessibility. Use `antislop-layoutmobile` for web screens. When an aid is unavailable, use this guide with the recorded inputs and mark the aid degraded. Keep the user's language for interface copy and preserve its meaning in the English spec. Record decisions for behavior or constraints that materially affect usability.

## S9 UI_SPEC.md structure

### Product and design direction

Use the PRODUCT and DESIGN structure excerpt below, adapted from Impeccable. These are sections in `UI_SPEC.md`. Include any existing source files as inputs.

- **Product** — platform, users and jobs, product purpose, positioning, operating context, capabilities and constraints, brand commitments, evidence on hand, product principles, and accessibility and inclusion. Record only claims the interview or research supports.
- **Design** — overview, colors, typography, layout, elevation and depth, shapes, components, and do/do not rules. Provide actual token values. Include role names and usage, the allowed foreground/background pairs, and which components use each token.

Use the small DESIGN token excerpt where applicable. Keep values traceable to the project palette and chosen typography. Give one usable scale and one set of component states.

```yaml
name: <project>
description: <one-line product purpose>
colors:
  ink: "<text hex>"
  surface: "<background hex>"
  action: "<primary action hex>"
typography:
  body:
    fontFamily: "<selected font and fallbacks>"
    fontSize: "<size and unit>"
    fontWeight: <numeric weight>
    lineHeight: <numeric ratio>
    letterSpacing: "<length>"
rounded:
  control: "<radius and unit>"
spacing:
  gutter: "<spacing and unit>"
components:
  primary-button:
    backgroundColor: "{colors.action}"
    textColor: "{colors.surface}"
```

[PRODUCT reference at the pinned Impeccable commit](https://github.com/pbakaus/impeccable/blob/b49177d32788f2dc585c42831d845dacf1ebed2c/.agents/skills/impeccable/reference/init.md) · [DESIGN reference and token schema](https://github.com/pbakaus/impeccable/blob/b49177d32788f2dc585c42831d845dacf1ebed2c/.agents/skills/impeccable/reference/document.md) · [Apache-2.0](https://github.com/pbakaus/impeccable/blob/b49177d32788f2dc585c42831d845dacf1ebed2c/LICENSE)

### Screens and states

Name all main tasks and their screen contracts. Use an ASCII wireframe per main screen with real labels and reduced views where the layout changes. For each list or action, specify loading, empty, invalid, conflict, failure and success states where applicable. Link to the existing user flow and milestone checks. Show what happens to focus and input across failure and retry.

### Craft rules

| Rule | Evidence |
|---|---|
| Start each primary screen with its actual action or page heading. Omit an eyebrow above that heading and decorative numbering unless an actual sequence needs numbers. | Inspect every named primary screen. |
| Give the primary task a visible control with a specific action name. Avoid rebuilding a whole page as a grid of equal cards with one icon, heading and sentence each. | Verify each main task can start without first reading a card catalog. |
| Use one consistent token per repeated role. Use status words or icons with accessible text when color distinguishes states. | Inspect tokens and run the screenshot and contrast checks for every state. |
| Preserve a layout or decorative element when it serves a stated user task. Use actual content and earned visuals. | Match the UI element to its requirement and check the result with the recorded screens. |

### Motion budget

Use ease-out on entry and results. Default easing is `cubic-bezier(0.23, 1, 0.32, 1)`. Set a duration and named properties for every motion. Use these ceilings and tune frequent actions downward.

| Interaction | Normal motion | Reduced motion |
|---|---|---|
| Press | 100–160 ms, optional scale 0.97 | No scale, immediate state |
| Tooltip or menu | 120–200 ms opacity or small transform | Immediate state |
| Dialog | 180–240 ms opacity or scale from 0.97 | Immediate state |
| Repeated actions | Immediate feedback, at most 100 ms | Immediate state |

Enforce under 300 ms per UI transition. Disallow `ease-in`, `scale(0)` and `transition: all`. Use explicit transform/opacity only for moving UI. Test rapid repeated inputs and emulate `prefers-reduced-motion`. Preserve the action, its outcome and focus when motion is reduced. Use the reviewed motion ideas with the source pinned in credits. [Emil Kowalski skill, MIT](https://github.com/emilkowalski/skill/tree/64eb3deb9a5fbfa041faf783e0bc3fd635872e9c)

### Copy voice and states

Give final user-language text for the main action, loading, success, empty, validation, conflict and failure. Use a consistent verb for each action. A failure names what happened and a next step. Explain cause when it helps recovery. Labels are stable across screens. Mark a proposed label as proposed until the owner confirms it.

| Context | Voice | Action and message checks |
|---|---|---|
| Primary and success | Direct and specific | A button starts with a verb and the success text names the result. |
| Empty and loading | Plain and helpful | A real wait has a visible progress/status label. An empty state gives the next action when one exists. |
| Warning, error and conflict | Calm and without blame | Put the message by the failed action or field, announce it to assistive tech, and preserve valid input. |

### Accessibility and mobile layout

- Check relevant WCAG 2.2 AA success criteria with a keyboard, assistive technology and an automated scan. Minimum ordinary text contrast is 4.5:1. Large text may use 3:1 when it meets WCAG size and weight. Visible control boundaries and focus indicators use at least 3:1 against their adjacent colors. Define 44 × 44 CSS px as the project's minimum target for touch, including icon controls. WCAG AA 2.5.8 defines its separate 24 CSS px criterion with exceptions.
- Use semantic action buttons and navigation links. Give controls accessible names and visible labels for inputs. Keep a visible focus indicator and logical tab order. Provide a skip link where repeated navigation exists. No sticky element may obscure focused controls. Announce asynchronous changes and errors with an appropriate live region. Pair visual status colors with text.
- Use meaningful native field types, input modes and autocomplete scopes. Enable paste. Keep errors near the fields and focus the first invalid control after a failed submit. Confirm a destructive action or offer a usable undo.
- Choose responsive breakpoints where actual content would break. Set the tested viewport widths and main tasks. Test wrapping, 200% text size, and a narrow 320 CSS px viewport without horizontal scrolling for the main page. Provide a controlled viewport for a table that needs two-dimensional scrolling. Keep navigation, touch targets and keyboard focus within safe areas. Do not hide necessary actions behind hover. Reserve image space and keep the main action visible within the natural flow.
- Use mobile web rules for responsive web interfaces. On native interfaces, map the same ergonomics and accessibility requirements to the OS's units, font scaling, controls and keyboard behavior. State the applicable platform standards.

Sources [WCAG 2.2](https://www.w3.org/TR/WCAG22/) · [antislop-layoutmobile](https://github.com/miqdadbadjuber/anti-slop/blob/7f6a03df2931c12cb244dc4ab14ee4866b0ac2ba/skills/antislop-layoutmobile/SKILL.md) · [Vercel Web Interface Guidelines, MIT](https://github.com/vercel-labs/web-interface-guidelines/blob/434b7f91364665f2f733b310ec54809bf8f37937/command.md)

### Verification

Include the checked color pairs with actual foreground and background hex values and their text role. Check every pair for ordinary text and every state that changes text or background. Run the bundled licensed `contrast-check.py` for each ordinary pair when Python is present. The script exits 0 for normal-text 4.5:1 and uses unrounded ratios for the verdict. A printed 4.50 after rounding can still fail. For large text or control-only pairs use the displayed large-text result (3:1) and verify they meet the stated role. With no Python, use a browser contrast inspector or an available WCAG checker and record the method and results.

Use an installed local copy of the helper for S9. For builder verification, copy the helper and its MIT license to `.lvr/verification/` and write exact invocations per pair in VERIFICATION.md. Keep the helper outside the bundle list. Use `python3`, `python` or `py -3` according to the installed interpreter.

```sh
python3 .lvr/verification/contrast-check.py "#27272A" "#FAFAF9"
```

Record the vendored `contrast-check.py` SHA-256 `393e6433d120632aa11184792a16cd7b325924dbc9993477825d9aa67fdbfe6e` if the builder must recover the file. Never run a downloaded replacement until its pin and digest are checked. [Pinned contrast checker](https://github.com/miqdadbadjuber/anti-slop/blob/7f6a03df2931c12cb244dc4ab14ee4866b0ac2ba/skills/antislop-human/contrast-check.py) · [MIT license](https://github.com/miqdadbadjuber/anti-slop/blob/7f6a03df2931c12cb244dc4ab14ee4866b0ac2ba/LICENSE)

Record the visual screenshot matrix, keyboard and visible-focus checks, target and contrast results, exact copy and state checks, and the reduced-motion test. Use the Web Interface Guidelines rules above to audit the coded UI. Mark which results are verified at plan time and which require the built interface. A missing rule, unclear check, or failed contrast pair blocks closing the affected UI artifact.
