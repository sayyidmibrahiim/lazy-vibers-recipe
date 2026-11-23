# Disk as memory and adaptive model profiles

This record uses the original LVP names. See the [current state contract](../spec/01-state.md) for `.lvr/` and legacy project migration.

LVP must complete the pipeline across model classes, including APIs with million-token context windows, open-weight models with 128–262k tokens, and local models with 32–128k tokens. Pipeline memory lives in `.lvp/`. The agent reloads what it needs from disk for each Section or batch. At startup, it declares model profile T1, T2, or T3. T2 and T3 run a capability check and stop with an explanation if the model cannot meet it. Each tier has rules for batch size, dividing research, compiling in chunks, and reloading context. Context guards and truncation recovery support continuing from the last completed point. The 2026-11-08 review found that some fast APIs already offered million-token context windows, making open-weight and local models the more useful boundaries.

## Considered options

- Requiring a million-token model would exclude affordable and local models and limit portability.
- Running the same pipeline settings on every model could cause silent failures or truncate output on smaller models.
- Adaptive tiers with upfront checks let compatible models finish and explain any limitation before work starts.
