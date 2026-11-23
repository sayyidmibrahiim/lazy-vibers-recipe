# Web research is required

LVR grounds every claim, recommendation, and `designer_filled` decision in current web research, following owner decision D12. Each interviewing or research skill checks that both web search and page retrieval work and records a `research_logged` event with `purpose: "web_check"`. If this fails, the skill explains the cause, gives the harness-specific steps to enable those tools, and stops. Dated facts follow the category limits in `skills/lvr-freshness.json`. Key facts require two independent sources. When working tools return no usable source, LVR records the failed research and marks the fact `[unverified: category · RQ-NNN]`. The `cite check` command enforces group I and rule X8. [Research contract](../spec/07-research.md)

## Scope of the change to ADR-0004

Web research requires working tools before the pipeline proceeds. Research Boosters such as Firecrawl MCP or competitor-analysis remain dependencies. The two dependency tiers, startup checks, explicit choices for failures of other Boosters, and non-commercial license rules continue under [ADR-0004](0004-booster-dependency-model.md).

## Considered options

- Continuing from model memory with a limited-result label would give non-technical users little way to identify stale prices, laws, or versions.
- Requiring research for selected facts would leave users unsure which other claims had evidence.
- Requiring functioning search and retrieval lets users see which individual facts remain unverified and trace them to an actual attempt.

## Enforcement updates from ticket 40

A failed tool check stops the skill with setup guidance. An unavailable page is handled by trying up to three results. A failed research event requires working tools and no usable source. LVR traces `designer_filled` decisions to the original evidence through `Became` entries, failed research IDs, and related decisions. Regulations require a fresh source and amendment check within 60 days. Each S1–S5 Section scan starts with a Domain Brief freshness check and rechecks expired entries. Categories match the type of fact, so pricing uses the price category. [Research contract, section 8.2](../spec/07-research.md#82-hardening-ticket-40-advisories-a1a19-of-the-ticket-26-verification)
