# AGENTS.md

Lazy Vibers Recipe is a set of seven agent skills that turn an idea into a build-ready Blueprint Bundle. The local Next.js 16 dashboard reads project files, including older `.lvp/` projects. The optional legacy generator uses SQLite and an OpenAI-compatible model to interview the user and write five documents. Start with the [current handoff](docs/agents/continuation.md) when resuming work on this repository.

## Commands

- Node.js 24 or later for the app and CI. Use `npm ci` followed by `npm run dev -- --hostname 127.0.0.1`. Open the `examples/meeting-room-demo` folder from the dashboard for a smoke check.
- `npm test` runs the Node test runner. The [LVR checks workflow](.github/workflows/lvr-checks.yml) runs tests, language and skill checks, lint, typecheck, build, and manifest validation.
- `npm run lint` runs ESLint. For standalone typecheck after a clean install, run `npm exec -- next typegen` followed by `npm exec -- tsc --noEmit`.
- `npm run check:language` checks active copy in a Git checkout. `npm run audit:language` also reports archived and verbatim text. Run `npm run sync:skills` after editing a canonical source, then `npm run check:skills` to verify the shipped copies.
- `npm run build` then `npm start -- --hostname 127.0.0.1` runs production locally. The build runs TypeScript itself.
- The dashboard opens without model credentials. For the legacy generator, set `ENABLE_LEGACY_GENERATOR=1`, `LLM_BASE_URL`, and `LLM_MODEL` in `.env.local`. A failed connection surfaces as a 502.

## Hard constraints

- Any page or route touching SQLite needs `export const runtime = "nodejs"`; data pages/routes also need `export const dynamic = "force-dynamic"`. Missing either breaks the build (`node:sqlite` unavailable, or DB read during prerender).
- Tailwind v4 is wired as a Turbopack loader rule in `next.config.ts` (`@tailwindcss/turbopack`); there is no postcss or tailwind config. Keep Turbopack (default in Next 16) and do not add a PostCSS setup.
- Use theme tokens from `@theme inline` in `src/app/globals.css` (`paper`, `card`, `ink`, `line`, `blueprint`, `rust`) via classes like `text-ink/65`, `border-line`. No raw hex or default gray palette.
- `src/lib/llm.ts` reads `LLM_BASE_URL`, `LLM_MODEL`, `LLM_API_KEY` at module load: restart the dev server after changing `.env.local`. `DATABASE_PATH` is read on first DB access.
- `src/lib/db.ts` is a `globalThis.__lvrDb` singleton, WAL mode, schema created inline with `CREATE TABLE IF NOT EXISTS`. No migration system: a schema change does not reach an existing `data/planner.db` (gitignored, holds real local projects). Add an idempotent migration rather than telling users to delete it.
- DB columns are snake_case, JSON is camelCase; timestamps are epoch ms. Row converters in `db.ts` own that mapping.

## Legacy generator invariants

- A doc kind lives in three files: `src/lib/kinds.ts` (union type), `src/lib/doc-list.ts` (array order becomes `position`), `src/lib/blueprint.ts` (`BRIEFS` is an exhaustive `Record<DocKind, string>`). Add all three or TypeScript fails.
- `POST /api/projects/[id]/blueprint` streams NDJSON events (`doc_start`, `doc_done`, `done`, `error`); the only consumer is `src/app/p/[id]/project-client.tsx`. Change both sides together.
- Generation is resumable and idempotent per kind: existing docs are skipped, `upsertDoc` overwrites by `(project_id, kind)`. Do not "regenerate all" to retry a partial run.
- Generation and revision share `writeEnglishDocument` in `src/lib/blueprint.ts`. It retries a truncated draft once, normalizes Markdown and the title, and independently checks the language. A failed language check gets one correction. Save only verified English output.
- `chatDetailed` retries 3x with backoff on any failure including 4xx; `chatJson` retries once by re-prompting after invalid JSON. Requests set `stream: false` but the proxy may still answer with SSE, which `readSse` handles.

## Conventions

- The web interface, CLI messages, and prompt instructions use English. In conversation and model-generated interview questions, follow an explicit language preference, then the latest clear user language, then the saved project language, with English as the default.
- Draft and revise documents in English, including headings, table text and diagram labels. Check the language before saving. Keep original wording in the journal or raw evidence and display historical documents as saved. See [the language decision](docs/adr/0002-global-first-english-source-of-truth.md).
- Route error mapping: 400 validation, 404 missing record, 502 LLM or parse failure. Error bodies are `{ error: string }` in English.
- No auth by design; this is a local tool. Do not add auth or multi-user state unless asked. README documents loopback binding for exposure.
- Route handler `params` are Promises in Next 16 (`await params`); layouts use the generated global `LayoutProps<"/">` type.

## Agent skills

### Issue tracker

Issues live as local markdown files under `.scratch/<feature-slug>/` (spec + one file per ticket). See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role vocabulary used as-is: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` at the repo root + `docs/adr/`. See `docs/agents/domain.md`.

### LVR pipeline

The [spec overview](docs/spec/00-overview.md) maps the current pipeline contracts. The [skill catalog](skills/README.md) lists the seven skills and [INSTALL.md](INSTALL.md) covers setup. Edit canonical sources for shared references and use `npm run sync:skills` to update their packaged copies.
