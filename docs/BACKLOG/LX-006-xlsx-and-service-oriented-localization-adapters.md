# LX-006 — XLSX and Service-Oriented Localization Adapters

Legend: [LX — Localization and Bidirectionality](/Users/james/git/bijou/docs/legends/LX-localization-and-bidirectionality.md)

## Idea

LX-005 made the current exchange seam practical in Node:

- CSV/TSV sheet files
- JSON bundle files
- workbook directories with a manifest

The next likely slice is richer provider integration on top of that seam:

- XLSX adapters
- maybe later Google Sheets or other service-oriented adapters

## Why

LX-005 solved plain text and filesystem workflows, but some real localization teams still need:

- true spreadsheet files
- richer tabular tooling than delimited text
- service-backed review workflows

Those should still build on the LX-003/LX-004/LX-005 exchange contracts instead of changing the core model again.

## Status

Backlog spawned by the retrospective for LX-005.
