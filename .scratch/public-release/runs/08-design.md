# Ticket 08 profile contract

A profile is a JSON file with an ID, label, default product flags, sections, and extra bundle files. Each section can define questions with a stable ID, the question, why it matters, and the files it feeds. It can also name additional exit checks, booster IDs and planning roles. These records augment the base interview.

Merge confirmed profile IDs in sorted order. Deduplicate shared files, identical questions, and identical exit checks. Two different definitions of the same question ID in a section are a configuration error. Merge default flags with OR. A recorded project flag overrides a default for the planning view. Pending suggestions do not activate extra questions or files.

S1 asks for one or more types first, accepts uncertainty, gathers enough context to recommend, and records the user's confirmation. The profile planner can preview suggestions without changing state. A shipped web profile is the base-compatible starting point. Ticket 09 populates the full question packs.

The number of base bundle artifacts is a pending owner decision. Spec 04 lists 18 planning Markdown files, two harness stubs, and the derived blueprint index under the heading described as a 20-file list. The profile data validation, merge, and confirmation rules can be implemented independently.

The futsal verification established that the existing web output already uses 20 Markdown files and a derived, separately generated JSON index. The compatibility baseline retains both. The optional profile path list only appears in a derived index with frozen additions. Ticket 28 retains ownership of full manifest v2 and dynamic lint.
