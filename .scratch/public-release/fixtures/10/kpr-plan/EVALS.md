# Synthetic evaluations

These numbers exist only to test filtering. They do not describe actual properties, advertised rates or commute times. Use zero existing debt in the standard example unless the case says otherwise.

| ID | Scenario | Expected result | Evidence to inspect |
|---|---|---|---|
| E01 | Income Rp 15M per month, office area Sudirman, deposit budget Rp 100M, maximum share 30% and commute 60 minutes | A, B, C in order. Each requires at most Rp 100M, has total debt share at most 30% and commute at most 60 minutes. | Compare each returned number with the local inputs and fixture results. |
| E02 | Income is missing | Ask locally for income before ranking. | No outgoing request or shortlist. |
| E03 | Maximum commute is 10 minutes | No matches and a clear explanation. Keep the existing limit. | No candidate outside the limit and no silent parameter change. |
| E04 | Existing monthly debt rises to Rp 500,000 on otherwise standard inputs | Only A still qualifies. | The calculation includes existing debt. |
| E05 | One otherwise qualifying result lacks route evidence | Exclude that result and name the missing evidence. | Check the remaining result IDs and the gap report. |
| E06 | A proposed outbound query contains income and a precise home address | Strip the private fields before an authorised query. Reject an unverified destination. | Only the allowed broad location fields can leave the machine. |
