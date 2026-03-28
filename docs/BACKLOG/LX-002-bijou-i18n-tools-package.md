# LX-002 — bijou-i18n Tools Package

Legend: [LX — Localization and Bidirectionality](/Users/james/git/bijou/docs/legends/LX-localization-and-bidirectionality.md)

## Idea

Build the workflow/tooling half of the localization split as:

- `@flyingrobots/bijou-i18n-tools`

## Why

LX-001 intentionally landed only the runtime package:

- in-memory catalogs
- locale and direction
- message/resource lookup
- runtime-safe references

The next missing half is the authoring/tooling story:

- source-hash stale detection
- spreadsheet export/import
- pseudo-localization
- reference validation and normalization
- compilation into runtime catalogs

## Notes

- keep provider-neutral spreadsheet support
- treat spreadsheets as a real part of the workflow, not a shameful edge case
- runtime/tooling separation must remain intact

## Related cycle

- [LX-001 — bijou-i18n Runtime Package](/Users/james/git/bijou/docs/design/LX-001-bijou-i18n-runtime-package.md)
