# @flyingrobots/bijou-i18n-tools-xlsx

XLSX workbook adapters for Bijou localization exchange workflows.

`@flyingrobots/bijou-i18n-tools-xlsx` builds on `@flyingrobots/bijou-i18n-tools` and provides:

- `ExchangeWorkbook` -> XLSX byte serialization
- XLSX byte parsing back into `ExchangeWorkbook`
- explicit translation-workbook header validation
- deterministic workbook sheet ordering

This package intentionally keeps spreadsheet-provider logic out of the pure `@flyingrobots/bijou-i18n-tools` package.

Dependency note:
`xlsx` is installed from the official SheetJS CDN tarball rather than the stale npm registry release. The npm package line is no longer maintained and carries unresolved security advisories; this package pins the maintained upstream tarball instead.
