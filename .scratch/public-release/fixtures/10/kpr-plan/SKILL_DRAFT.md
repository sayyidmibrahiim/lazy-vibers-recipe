---
name: kpr-house-hunter
description: Make a private shortlist of sample houses within confirmed deposit, monthly debt and commute limits.
---

# Draft skill for a KPR shortlist

Start when the user asks for a mortgage shortlist. Confirm the maximum cash deposit, maximum monthly debt share and commute time. Read the private profile from local storage and ask locally for any required missing value.

1. Obtain public listing and route estimates only from destinations allowed by TOOLS.md. Block a destination whose terms or access are unverified.
2. Keep income, current debt, exact address and household information local. Send only the documented non-identifying search fields.
3. Compare each listing's required deposit with the available deposit. Divide total monthly debt, including the prospective payment, by monthly net income.
4. Exclude results above either the confirmed debt share or commute limit. Exclude results with missing price or route evidence and explain the gap.
5. Sort remaining results by commute and then monthly payment. Return up to three with evidence, assumptions and the reason each qualifies.
6. When no result qualifies, explain which limits excluded the options. Ask before changing a filter. Stop before a booking, application or message to a seller.
