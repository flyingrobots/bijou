# LX-005 — Rich Spreadsheet and Filesystem Adapters

Legend: [LX — Localization and Bidirectionality](/Users/james/git/bijou/docs/legends/LX-localization-and-bidirectionality.md)

## Idea

LX-004 proved the provider-adapter seam with:

- CSV sheet adapters
- TSV sheet adapters
- JSON bundle adapters

The next likely slice is richer external tooling on top of that seam:

- XLSX adapters
- filesystem helpers for workbook/bundle import/export
- maybe later Google Sheets or service adapters

## Why

LX-004 proved the core adapter design cleanly, but many real localization workflows still need:

- spreadsheet files instead of raw strings
- more than plain delimited text
- repeatable import/export helpers for automation and tooling

Those should still build on the LX-003/LX-004 exchange contracts instead of inventing a new data model.

## Status

Backlog spawned by the retrospective for LX-004.
