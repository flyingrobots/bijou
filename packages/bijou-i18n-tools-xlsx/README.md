# @flyingrobots/bijou-i18n-tools-xlsx

XLSX workbook adapters for Bijou localization exchange workflows.

`@flyingrobots/bijou-i18n-tools-xlsx` builds on `@flyingrobots/bijou-i18n-tools` and provides:

- `ExchangeWorkbook` -> XLSX byte serialization
- XLSX byte parsing back into `ExchangeWorkbook`
- explicit translation-workbook header validation
- deterministic workbook sheet ordering

This package intentionally keeps spreadsheet-provider logic out of the pure `@flyingrobots/bijou-i18n-tools` package.

Dependency note:
As of 2026-04-02, `xlsx` is installed from the official SheetJS CDN tarball rather than the npm registry release, which is stale and carries known security advisories. See https://docs.sheetjs.com/docs/getting-started/installation/nodejs/ for the current upstream installation guidance.
