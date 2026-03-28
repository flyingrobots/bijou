# LX-004 — Provider Adapters for Workbook and Bundle Exchange

Legend: [LX — Localization and Bidirectionality](/Users/james/git/bijou/docs/legends/LX-localization-and-bidirectionality.md)

## Idea

LX-003 established the provider-neutral exchange seam in `@flyingrobots/bijou-i18n-tools`:

- spreadsheet-friendly workbooks
- serializable catalog bundles
- typed value encoding/decoding

The next likely slice is to add real adapters that target those exchange formats without changing the core tooling contracts.

Possible directions:

- CSV adapters
- XLSX adapters
- Google Sheets adapters
- file-based import/export helpers

## Why

The current exchange layer is the right core, but real localization workflows still need concrete ways to move data between Bijou and external tools.

Those adapters should be built on top of the LX-003 workbook/bundle contracts rather than inventing new ad hoc representations.

## Status

Backlog spawned by the retrospective for LX-003.
