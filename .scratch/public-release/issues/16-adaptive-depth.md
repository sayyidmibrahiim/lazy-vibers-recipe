# 16: Adaptive interview depth
Status: done (2026-11-23) · Blocked by: 07 · Type: task · Agent: Opus

- [x] Per section, keep a coverage map: which exit-criteria facts are already known from S0 and earlier answers.
- [x] Detailed answers mean known facts are confirmed in one batch, not re-asked, so the section advances fast.
- [x] Thin answers mean more targeted follow-ups until each criterion has evidence. Never fill a gap by guessing.
- [x] Show progress: "S4: 6 of 9 facts known".
- [x] The README positioning paragraph matches this behaviour.
Verify:
- Two scripted S0 inputs (rich vs thin) for the same idea.
- The rich input asks fewer questions.
- Both produce bundles with zero unstated assumptions.

## Comments

The rich opening took 9 follow-ups and the thin opening took 17. Both produced identical bundle files and the assumptions audit caught a deliberately omitted decision. All 45 focused checks and shared regressions passed. See [implementation](../runs/16-impl.md) and [same-context verification](../runs/16-verify.md).
