# Ticket 16 implementation

The interview engine now saves a fact checklist per section, connects it to prior evidence, consolidates confirmations and asks targeted follow-ups on gaps. Section records preserve the required keys on resume. Each answer carries coverage using the existing journal event. `interview progress` reports known facts, pending confirmations, declared assumptions and missing evidence. The helper verifies evidence IDs and the section boundary. The Conductor checks the meaning and freshness of sources.

The README describes this pacing. A scripted rich and thin intake for the same local booking app feeds a small compiler and the real bundle index and assumption checks.
