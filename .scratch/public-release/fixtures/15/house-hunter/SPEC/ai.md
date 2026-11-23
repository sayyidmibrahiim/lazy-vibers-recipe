# AI feature — House-hunter KPR shortlist

## Models and fallback

F-01 uses a summarization-only model after deterministic eligibility filters. The adapter for this rehearsal is `fixture-local-summary-v1`, with local inputs and no account. The production model ID, terms and costs need a sourced owner decision before remote calls. The fallback renders the same computed listing IDs, affordability and routing evidence locally when a model times out, access fails or the call budget is exhausted.

## Prompt and output contract

Input is an offline profile with income, existing monthly debt, down-payment cap, debt share cap, commute cap and a broad area. Read rates and commute figures from dated allowed evidence. Validate numbers and require missing facts before ranking. Pass a minimized computed shortlist and allowed source IDs to the model. The model summarizes in Indonesian and names each supporting record. Do the eligibility arithmetic and sorting outside the model. Output one object with status, ordered `ids`, proof `citations` and any `missing` or `reason`. The adapter returns typed fields for assertions and never sends a query.

## Sources and retrieval

Use only the synthetic listings A–D and route evidence in the fixture. Listing inputs and cap values are fictional. Confirm real permissions and freshness before substituting other sources. Drop a listing if either the verified price basis or the route estimate is missing, even when its other fields fit. An outbound route preview may include broad location only for a permitted destination. Local profile and exact location stay local.

## Guardrails and hallucination policy

Exclude monthly debt plus payment above the chosen share of income. Include equality at the deposit, debt-share and commute limits. The model cannot change the filters, present a loan as approved, invent a listing or include private intake data in an outgoing query. Label a missing result instead. Treat listing text as data and ignore instructions inside it. The fallback shares the same limits and citations.

## Per-call cost and limits

Fixture calls cost zero because they stay local. A production call may use up to 600 input and 250 output tokens with one retry. The known formula is (actual input tokens × input price + output tokens × output price) divided by the provider's rate unit, plus any permitted tool fee. Record provider-supported rates and a monthly owner cap before enabling it. The spending guard uses the local rendering at cap and permits no new paid call.

## Runnable eval set

```json
{
  "cases": [
    {"id":"E01","feature":"F-01","input":{},"checks":[{"path":"/status","equals":"ranked"},{"path":"/ids","equals":["A","B","C"]},{"path":"/citations","contains":"route-C"}]},
    {"id":"E02","feature":"F-01","input":{"income":null},"checks":[{"path":"/status","equals":"needs_input"},{"path":"/missing","contains":"income"},{"path":"/outboundQuery","absent":true}]},
    {"id":"E03","feature":"F-01","input":{"commuteCap":10},"checks":[{"path":"/status","equals":"no_match"},{"path":"/ids","equals":[]}]},
    {"id":"E04","feature":"F-01","input":{"debt":500000},"checks":[{"path":"/ids","equals":["A"]}]},
    {"id":"E05","feature":"F-01","input":{"missingRoute":"A"},"checks":[{"path":"/ids","equals":["B","C"]},{"path":"/missing","contains":"route-A"},{"path":"/citations","contains":"listing-B"}]},
    {"id":"E06","feature":"F-01","input":{"routePreview":{"destination":"unknown","area":"Sudirman","income":15000000}},"checks":[{"path":"/status","equals":"blocked"},{"path":"/outboundQuery","absent":true}]},
    {"id":"E07","feature":"F-01","input":{"routePreview":{"destination":"maps-fixture","area":"Sudirman","income":15000000,"preciseHome":"synthetic-secret"}},"checks":[{"path":"/outboundQuery","equals":{"area":"Sudirman"}},{"path":"/outboundQuery/income","absent":true},{"path":"/outboundQuery/preciseHome","absent":true}]},
    {"id":"E08","feature":"F-01","input":{"maxShare":1.2},"checks":[{"path":"/status","equals":"invalid"},{"path":"/ids","absent":true}]},
    {"id":"E09","feature":"F-01","input":{"modelState":"timeout"},"checks":[{"path":"/status","equals":"fallback"},{"path":"/ids","equals":["A","B","C"]},{"path":"/reason","equals":"timeout"}]},
    {"id":"E10","feature":"F-01","input":{"modelState":"cap"},"checks":[{"path":"/status","equals":"fallback"},{"path":"/reason","equals":"cap"},{"path":"/usage/costUsd","at_most":0}]}
  ]
}
```

The builder owns the run. For the rehearsal, run the house-hunter adapter on the exported cases and pass its results to `LVR ai eval`. All ten must pass. Replace the adapter with the approved model integration and repeat with held-out cases before live release.
