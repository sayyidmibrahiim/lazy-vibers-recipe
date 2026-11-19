# 14: UI_SPEC.md for UI products
Status: ready-for-agent · Blocked by: 07, 08 · Type: task · Agent: Sonnet
Source: research/G.

- [ ] Trigger: the `has_ui` flag.
- [ ] S4 asks about look/feel, voice and accessibility needs (ux-copy, antislop-human).
- [ ] S9 emits UI_SPEC.md with:
  - design tokens and the PRODUCT/DESIGN schema (impeccable excerpt)
  - craft-floor ban list
  - motion budget (emilkowalski: ease-out, <300 ms, no scale(0))
  - copy voice chart
  - WCAG 2.2 (4.5:1 contrast, 44px targets)
  - mobile-web layout rules (antislop-layoutmobile)
  - vercel web-interface hard rules
- [ ] `contrast-check.py` is used by the verification step when Python is present.
Verify: the futsal UI_SPEC has no unmeasurable rules.
