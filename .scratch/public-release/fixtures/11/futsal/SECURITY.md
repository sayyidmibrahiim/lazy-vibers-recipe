# Access and privacy

- Keep player names and phone numbers in private booking rows. Keep proof images in a private bucket. Confirm retention with the owner and remove stored images when the corresponding booking passes the approved retention limit.
- Supabase policies restrict bookings and proofs to an authenticated admin whose identity matches the court's venue owner. Check both the current row for a change and the proposed row's ownership afterward. Public users see only slot availability through the limited view.
- Verification uses two venues. A venue admin reads and confirms a payment for their own court. The same request for the second venue returns no row and leaves the booking unchanged. Anonymous availability requests expose neither names nor phone numbers. Repeat the policy checks directly against the store as well as through the application.
