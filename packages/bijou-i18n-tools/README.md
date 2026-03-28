# @flyingrobots/bijou-i18n-tools

Workflow and authoring tooling for Bijou localization.

`@flyingrobots/bijou-i18n-tools` provides:

- authoring catalog types
- source-hash stale detection
- provider-neutral tabular export/import rows
- spreadsheet-friendly workbook export/import
- CSV/TSV sheet serialization and parsing
- serializable catalog-bundle export/import
- JSON bundle serialization and parsing
- typed value encoding/decoding for strings, data, and refs
- reference validation and normalization
- compilation into `@flyingrobots/bijou-i18n` runtime catalogs
- pseudo-localization helpers

This package is intentionally provider-neutral. Filesystem, CSV/XLSX, or Google Sheets adapters can be added later without polluting the core tooling API.
