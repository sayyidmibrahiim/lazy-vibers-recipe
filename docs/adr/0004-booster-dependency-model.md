# Boosters as external dependencies

LVP uses verified external skills called Boosters. **Core** Boosters are required for full output quality. **Enhancers** add quality where needed. LVP checks the applicable Boosters and stages missing copies. If installation fails because the harness disallows it, the network is unavailable, or an API key is missing, LVP tells the user. It offers help installing the dependency, a clearly marked limited result, or a stop. The runtime-only policy for non-commercial content is described in [ADR-0001](0001-permissive-first-license-policy.md).

The initial Core candidates were PM Skills interview patterns (Apache 2.0), OpenSpec patterns, Humanizer, the SimpleEnglish document-rule subset, Karpathy Guidelines, Ponytail, Browserbase competitor analysis or Firecrawl MCP, Playwright MCP, and the AGENTS.md specification.

## Considered options

- Making all external skills optional would have weakened the promised output quality and readability.
- Stopping for every installation failure would block offline users entirely. An explicit user choice handles ordinary dependency failures.

[ADR-0007](0007-web-research-is-required.md) superseded this decision for web research on 2026-11-20. The pipeline stops when it cannot research and explains how to enable its tools.
