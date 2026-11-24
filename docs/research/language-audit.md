# Repository language audit

English is the default for product text, tool messages, and new or revised documents. The agent uses the user's language in conversation. Existing project documents and verbatim inputs remain readable in their original language.

## Run the audit

| Command | What it checks |
| --- | --- |
| `npm run audit:language` | Lists path, line, and category for candidates in tracked and unignored working-tree files, including the project archive and test data. Lists images for visual inspection. |
| `npm run check:language` | The CI gate for active text. Exits with a failure when it finds an Indonesian candidate, an Indonesian interface locale, or a conflicting artifact-language instruction. |

The audit works from a Git checkout and prints locations without reproducing stored text. Its indicators catch common Indonesian terms and explicit conflicting instructions. Review the reported image paths visually and verify generated language with the runtime checks. An empty CI scan alone cannot establish that prose is English.

## Findings and dispositions

| Surface | Finding | Treatment |
| --- | --- | --- |
| Web and legacy generator | The layout, dashboard, errors, prompts, and dates used Indonesian defaults. The legacy document prompts also followed the idea language. | Use English product text and document rules. Preserve localized conversation and original project content. |
| Skills and maintained docs | Language rules for rendering and generation conflicted. The Glossary, architecture records, and catalog also contained Indonesian prose. | Align English output and adaptive conversation rules. Translate maintained prose and preserve source titles and quotations. |
| Screenshot assets | The initial dashboard and data model images showed Indonesian UI labels. | Verify the English labels in the replacement browser and terminal captures. |
| Historical artifacts | The Futsal example and fixtures contain original text used for comparison, replay, or language tests. | Report their locations and leave original records intact. The local working archive is ignored. Use its named Git snapshot for a historical audit. |
| Verbatim source data | Research queries, journal events, original ideas, and compatibility dictionaries must retain exact strings. | Preserve the strings and report them separately. A Markdown line can mark a quoted original source with `<!-- language-audit: verbatim -->`. The surrounding authored prose still goes through the check. |
