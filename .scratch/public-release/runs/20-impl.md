# Ticket 20 implementation

The home form now points to the project folder that contains .lvr/state.json. The optional legacy generator requires LLM_BASE_URL and LLM_MODEL when called. The app can start without those settings. Example configuration and docs no longer specify the personal endpoint or model.

The recorded futsal plan was copied into examples/futsal-booking with example contacts, addresses and machine paths. The copy was migrated and its snapshot and blueprint regenerated from the sanitized journal. The original archive stays available for the handoff protocol. The OS runner test now lives under tests/lvr so the workflow is independent of the private archive.
