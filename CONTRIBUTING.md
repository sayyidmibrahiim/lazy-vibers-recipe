# Contributing to Lazy Vibers Recipe

Use Node.js 24 or newer. Start with `npm ci`, then open the Meeting Room Booker example to check the viewer. [Dashboard quickstart](README.md#try-the-dashboard)

## Make a change

1. Read the relevant [pipeline contract](docs/spec/00-overview.md) and the [repository rules](AGENTS.md).
2. Edit the canonical source. Shared contracts live in `docs/spec/` and `skills/lvr-*.md`, the helper lives in `scripts/lvr.mjs`, and product profiles live in `skills/lvr-profiles/`.
3. Run `npm run sync:skills` when a shared source changes. Commit the generated copies together with their source.
4. Run the checks below. Include the observed result and any setup needed to reproduce it in your pull request.

```bash
npm run check:skills
npm run check:language
npm test
npm run lint
npm exec -- next typegen
npm exec -- tsc --noEmit
npm run build
```

New UI text and documents use English. Agents follow the user's language in conversation. Keep original answers and evidence in the journal when a test exercises language adaptation. [Language policy](docs/adr/0002-global-first-english-source-of-truth.md)

## Propose a booster or profile

For a booster, provide its source revision, license, exact skill paths, one example of improved output, and a comparison with similar tools. Follow the [booster review method](docs/agents/booster-review.md).

For a product profile, identify what the base bundle cannot express. Define its selection conditions, additional planning questions and files, release checks, and a runnable example. Check how it merges with an existing profile and how older projects resume. [Bundle contract](docs/spec/04-bundle.md)
