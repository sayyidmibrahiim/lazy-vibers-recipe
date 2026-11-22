# Local profile schema

Keep the source profile in a local file outside the plan outputs. EVALS.md uses synthetic numbers.

| Field | Type | Required | Reason | Storage and deletion |
|---|---|---|---|---|
| monthly_income_idr | Positive integer | Yes | Local debt-share denominator | Local only. Delete with the profile. |
| existing_monthly_debt_idr | Nonnegative integer | Yes | Local debt-share numerator | Local only. Delete with the profile. |
| deposit_limit_idr | Nonnegative integer | Yes | Local maximum deposit | Local only. Delete with the profile. |
| max_debt_share | Decimal from 0 to 1 | Yes | User-confirmed filter | Local only. Delete with the profile. |
| max_commute_minutes | Positive integer | Yes | User-confirmed travel filter | Local only. Delete with the profile. |
| office_area | Broad area name | Yes | Route scenario | Local. A permitted router can receive the broad area after a terms check. |
| exact_home_address | String | No | Future private route draft | Local only. Clear whenever the user asks. |

Restrict the named local file to the user. Redact private fields in logs and keep example values synthetic.
