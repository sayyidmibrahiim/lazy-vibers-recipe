# Tool access and outbound fields

This fixture uses synthetic listing and route results. It performs no external calls. A production destination stays disabled until its exact URL, terms, allowed purpose and verification date are recorded.

| Tool | Purpose | Exact fields allowed outbound | Effects and approval | Terms evidence |
|---|---|---|---|---|
| Public listing search | Gather listings | Broad district, property type | Read only | Provider unselected. Verify search terms and permitted reuse before enabling. |
| Route lookup | Check travel time | Broad office area, public listing area, travel mode | Read only | Provider unselected. Verify rate limits, retained data and terms before enabling. |
| Local filter | Apply deposit, debt-share and time thresholds | None | Local calculation | Uses supplied test values. |
| Contact or application | Potential follow-up | None | Disabled in this plan | A separate user approval and destination rule would be needed. |

Salary, existing debt, precise home address, family information and exact affordability filters stay local. Check that no unlisted field appears in outbound logs.
