# 20: Repo hygiene + de-personalization
Status: ready-for-agent · Blocked by: 01 · Type: task · Agent: Haiku (grep/scan) + Sonnet
- [ ] Move the dogfood bundle to `examples/futsal-booking/`. Untrack `.scratch/` and add it to .gitignore.
- [ ] Fix the UI hint in `open-folder-form.tsx`.
- [ ] Remove the personal LLM defaults (`127.0.0.1:17070`, `deepseek-v4.1-flash-free`). Require the env vars or use a generic example.
- [ ] Run a history secret scan (gitleaks/trufflehog) and a personal-data grep. Confirm the author emails.
