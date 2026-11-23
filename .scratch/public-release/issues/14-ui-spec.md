# 14: UI_SPEC.md for UI products
Status: done (2026-11-23) · Blocked by: 07, 08 · Type: task · Agent: Sonnet
Source: research/G.

- [x] Trigger: the `has_ui` flag.
- [x] S4 asks about look/feel, voice and accessibility needs (ux-copy, antislop-human).
- [x] S9 emits UI_SPEC.md with:
  - design tokens and the PRODUCT/DESIGN schema (impeccable excerpt)
  - craft-floor ban list
  - motion budget (emilkowalski: ease-out, <300 ms, no scale(0))
  - copy voice chart
  - WCAG 2.2 (4.5:1 contrast, 44px targets)
  - mobile-web layout rules (antislop-layoutmobile)
  - vercel web-interface hard rules
- [x] `contrast-check.py` is used by the verification step when Python is present.
Verify: the futsal UI_SPEC has no unmeasurable rules.

## Comments

The UI-flag routing, frozen plan, ten observable futsal checks and five live Python contrast checks passed. All forty focused regressions and the shared suites passed. See [implementation](../runs/14-impl.md) and [same-context verification](../runs/14-verify.md).
