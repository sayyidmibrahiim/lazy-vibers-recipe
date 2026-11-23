# The Conductor loads Boosters per Section

The original `/lvp-init-new-idea` served as the Conductor. It loaded a Booster when the Section that needed it started and released it when that Section finished. Each Section boundary produced a Section Record under `.lvp/docs/sections/` and a State Checkpoint. Loading every external skill early would use the agent's limited context before the interview began. The F1 pipeline specification maps Sections to Boosters and to each Section's output.
