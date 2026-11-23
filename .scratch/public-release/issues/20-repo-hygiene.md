# 20: Repo hygiene + de-personalization
Status: needs-info (2026-11-23) · Blocked by: 01 · Type: task · Agent: Haiku (grep/scan) + Sonnet
- [ ] Move the dogfood bundle to `examples/futsal-booking/`. Untrack `.scratch/` and add it to .gitignore.
- [x] Fix the UI hint in `open-folder-form.tsx`.
- [x] Remove the personal LLM defaults (`127.0.0.1:17070`, `deepseek-v4.1-flash-free`). Require the env vars or use a generic example.
- [ ] Run a history secret scan (gitleaks/trufflehog) and a personal-data grep. Confirm the author emails.

## Comments
- From ticket 03 (V-03): the shared Script-helper block in all 7 SKILL.md points to "INSTALL.md" and two bank texts cite "ADR-0004"; neither ships inside an installed skill. Inline the skill dirs; say "loud degraded mode". See `runs/03-verify.md`.

The sanitized Futsal example opened in the browser and remains in the original cloud workspace with `20-impl.md` and `20-verify.md`. Gitleaks reported zero findings in the recorded history scan. The owner approved publishing the author email in the existing Git history before the first push. The archive change and final public checkout check are pending. [Repository handoff](../../../docs/agents/continuation.md)
