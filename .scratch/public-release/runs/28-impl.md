# Ticket 28 implementation

New blueprint indexes declare all twenty base Markdown paths, the frozen profile paths and blueprint.json itself. Existing v1 indexes remain readable and stable without a v2 plan. Lint, crosscheck and citation scanning use applicable bundle content paths. Invalid and escaping entries are refused. Diagram checks retain Mermaid erDiagram only for the data model.

The frozen profile snapshot records the scope-time flags. `profile add-file` appends one eligible path after a post-lock feature event records the flag change, exact approved file and confirmed decision. Repeating the request keeps the same file list and proof.
