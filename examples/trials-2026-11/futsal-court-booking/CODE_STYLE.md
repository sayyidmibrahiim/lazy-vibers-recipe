# Code style

## Language and framework conventions

- TypeScript in strict mode everywhere; Svelte 5 components with runes; SvelteKit 3.4.1 file routing (D-046).
- Server-only code lives in `src/lib/server/`; secrets are read only there, from `$env/static/private` or the Worker environment.
- Reads go in `+page.server.ts` `load`; writes are form actions. Use `use:enhance` for progressive enhancement; every page must also work without JavaScript.
- File names in kebab-case; variables and functions in camelCase; SQL in snake_case. Route folders use the Indonesian paths in ROUTES_SITEMAP.md.
- All user-facing text comes from `src/lib/copy.id.ts` keys listed in UI_SPEC.md; no inline Indonesian strings in components.
- All UTC↔WIB conversion goes through `src/lib/time.ts` (D-027). Never use the runtime's local time zone.
- Money is an integer of whole rupiah. Format with `Intl.NumberFormat('id-ID')`.

## Error handling

- Expected refusals (slot taken, limits, validation) return `fail(status, { error })` with the envelope in SPEC/api.md; never throw for them.
- Postgres error `23505` on `bookings_one_winner` maps to `slot_taken`; on `bookings_request_key` it returns the existing booking.
- Unexpected errors: let SvelteKit's `handleError` log `{ request_id, route, message }` and show the generic page. Never log names, phone numbers, tokens or keys.
- Turnstile or database outages map to `captcha_unavailable` / 503 with the WhatsApp fallback text (D-055).

## Testing expectations

- Vitest unit tests for `time.ts`, `phone.ts`, `price.ts`, the attempt counter and the error mapping: `npm test`.
- Scripts against a real Supabase project: `npm run race-test`, `npm run abuse-test`, `npm run admin-test`, `npm run restore` (VERIFICATION.md).
- Fixed clocks for every time rule (3-hour cancel, past slot, attendance window, 7-day reminder).
- A milestone is done only when its VERIFICATION.md steps pass on the live address.

## Simplicity rules

- Write the least code that meets the acceptance criteria. No extra layers, no generic repository classes, no state library.
- Let Postgres enforce rules it can enforce (unique index, checks, `book_slot`). Do not duplicate them in a check-then-insert.
- No client-side data fetching library; server loads are enough.
- No new dependency unless a criterion needs it; prefer platform APIs (`fetch`, `crypto.subtle`, `Intl`).
- No feature outside SCOPE.md. No speculative settings or options.
