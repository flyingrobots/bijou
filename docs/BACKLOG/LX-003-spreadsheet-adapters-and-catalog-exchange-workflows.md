# LX-003 — Spreadsheet Adapters and Catalog Exchange Workflows

Legend: [LX — Localization and Bidirectionality](/Users/james/git/bijou/docs/legends/LX-localization-and-bidirectionality.md)

## Idea

LX-002 established the pure tooling core for localization workflow data:

- authoring catalogs
- source hashing
- stale detection
- provider-neutral translation rows
- runtime catalog compilation
- pseudo-localization

The next likely slice is the real exchange layer:

- spreadsheet-friendly import/export adapters
- catalog exchange formats
- validation around references and stale rows at the adapter boundary
- maybe separate adapter packages if that keeps the core clean

## Why

Real localization workflows almost always end up moving through external tools:

- spreadsheets
- CSV/XLSX exports
- shared translation review workflows
- staged catalog bundles

Bijou should support those workflows honestly without polluting the runtime package or hardwiring one provider too early.

## Status

Backlog spawned by the retrospective for LX-002.
