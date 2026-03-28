# LX-001 — bijou-i18n Runtime and Tooling Packages

Legend: [LX — Localization and Bidirectionality](/Users/james/git/bijou/docs/legends/LX-localization-and-bidirectionality.md)

## Idea

Split localization into two real packages:

- `@flyingrobots/bijou-i18n`
- `@flyingrobots/bijou-i18n-tools`

## Why

Localization runtime concerns and localization workflow concerns are different.

Runtime needs:

- in-memory catalogs
- locale
- direction
- formatting seams
- runtime-safe references

Tooling needs:

- source-hash stale detection
- spreadsheet import/export
- pseudo-localization
- reference validation and normalization
- compilation into runtime catalogs

## Notes

- catalogs should be first-class
- entries should support more than plain strings
- references matter
- spreadsheets are real and should be treated as part of the workflow, not an embarrassment
- runtime should stay filesystem/service agnostic

## Related invariants

- [Tests Are the Spec](/Users/james/git/bijou/docs/invariants/tests-are-the-spec.md)
- [Graceful Lowering Preserves Meaning](/Users/james/git/bijou/docs/invariants/graceful-lowering-preserves-meaning.md)

## Status

Backlog only. Not yet enriched into an implementation cycle.
