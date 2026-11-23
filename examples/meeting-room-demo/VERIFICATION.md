# Verification

| Milestone | How to check | Expected result |
| --- | --- | --- |
| M0 | Pick a date with a seeded booking. | Both rooms appear, with the reserved slot marked unavailable only in the booked room. |
| M1 | Ask two test users to reserve the same slot simultaneously. Then cancel the winning booking. | Exactly one reservation succeeds. Cancellation makes the slot available again. |
