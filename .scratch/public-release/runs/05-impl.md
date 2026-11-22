# Ticket 05 implementation

Added one canonical registry at `skills/lvr-boosters.json` and synced it into seven skills. It contains six core entries, fourteen conditional entries, and seven references. Installable entries select named skills from a checkout of the exact GitHub commit and report the Skills CLI arguments for the chosen harness. Reference entries record the source files and license without selecting a skill to install.

`booster check` keeps the original all-core and named checks. Its section mode selects applicable installs from project state. `booster plan` reports the current or requested section, checks on-disk presence, and keeps unknown product conditions pending. The legacy minimal registry shape still works for the original check.

The init skill explains the intended project-local command and keeps its existing degraded-mode decision. The checker verifies every exact upstream file, license text, and skill selector. It ran successfully for all 27 entries. The catalog assigns UI design entries to UI work and assigns threat modeling to projects that store data or operate in a regulated domain.
