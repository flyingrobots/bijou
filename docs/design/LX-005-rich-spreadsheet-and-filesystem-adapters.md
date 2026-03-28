# LX-005 — Rich Spreadsheet and Filesystem Adapters

Legend: [LX — Localization and Bidirectionality](/Users/james/git/bijou/docs/legends/LX-localization-and-bidirectionality.md)

## Why this cycle exists

LX-004 proved the first concrete adapter seam in `@flyingrobots/bijou-i18n-tools`:

- CSV sheet adapters
- TSV sheet adapters
- JSON bundle adapters

That still leaves a practical gap for real automation and tooling:

- reading and writing those formats from the filesystem
- handling whole workbooks instead of one sheet string at a time

This cycle exists to add the Node-specific filesystem layer on top of the existing exchange seam.

## Scope of this cycle

This cycle intentionally covers:

- a new Node-specific package for filesystem helpers
- reading/writing one `ExchangeSheet` file in CSV or TSV
- reading/writing one `CatalogBundle` JSON file
- reading/writing a workbook directory made of:
  - a manifest file
  - one sheet file per sheet

It does **not** include:

- XLSX
- Google Sheets
- remote services
- zip packaging
- changing the pure `@flyingrobots/bijou-i18n-tools` exchange model

The point is to make the current exchange seam practical in Node without dragging platform concerns into the core tooling package.

## Human users

### Primary human user

A builder or localization maintainer who needs to:

- save exchange sheets to disk
- read edited sheets back from disk
- store and reload full catalog bundles
- hand off or restore complete workbooks as a directory artifact

### Human hill

A builder can persist workbook and bundle exchange artifacts through one small Node helper package, without hand-writing file I/O or inventing an ad hoc workbook directory format.

## Agent users

### Primary agent user

An agent automating localization workflows.

It needs to:

- write sheets and bundles to disk
- read them back deterministically
- stage workbook directories for review workflows
- reason about paths and formats explicitly instead of shelling out to one-off scripts

### Agent hill

An agent can automate localization exchange through explicit Node adapters instead of rebuilding CSV/TSV/JSON file orchestration in every workflow.

## Human playback

1. A builder exports a workbook in memory.
2. They write it to a directory on disk in TSV or CSV form.
3. A tool or person edits the sheet files.
4. The builder reads the workbook directory back into memory.
5. They import the workbook rows and merge the updates.
6. They also save and restore full catalog bundles as JSON files.

## Agent playback

1. An agent exports a workbook.
2. It writes the workbook to a directory for review.
3. It later reads the workbook directory back.
4. It writes and reads catalog bundle files as deterministic JSON artifacts.

## Linked invariants

- [Tests Are the Spec](/Users/james/git/bijou/docs/invariants/tests-are-the-spec.md)
- [Graceful Lowering Preserves Meaning](/Users/james/git/bijou/docs/invariants/graceful-lowering-preserves-meaning.md)
- [Docs Are the Demo](/Users/james/git/bijou/docs/invariants/docs-are-the-demo.md)

## Invariants for this cycle

- filesystem concerns must stay out of the pure `@flyingrobots/bijou-i18n-tools` package
- Node helpers must build on the existing workbook/bundle seam instead of replacing it
- directory formats must be explicit and versioned
- file helpers must be deterministic about sheet ordering and file names
- richer spreadsheet providers remain out of scope

## Deliverable

Introduce a new package:

- `packages/bijou-i18n-tools-node`

With Node filesystem helpers for:

- `ExchangeSheet` files (`csv` / `tsv`)
- `CatalogBundle` files (`json`)
- workbook directories (`manifest + sheet files`)

## Proposed API direction

The first slice should be close to:

```ts
function writeExchangeSheetFile(path: string, sheet: ExchangeSheet, format?: DelimitedFormat): Promise<void>;
function readExchangeSheetFile(path: string, format?: DelimitedFormat): Promise<ExchangeSheet>;

function writeCatalogBundleFile(path: string, bundle: CatalogBundle): Promise<void>;
function readCatalogBundleFile(path: string): Promise<CatalogBundle>;

function writeExchangeWorkbookDirectory(
  path: string,
  workbook: ExchangeWorkbook,
  format: DelimitedFormat,
): Promise<void>;

function readExchangeWorkbookDirectory(path: string): Promise<ExchangeWorkbook>;
```

Exact names can still move, but the responsibilities should not.

## Tests to write first

### Cycle-owned playback tests

Under `tests/cycles/LX-005/`:

- workbook directories roundtrip through disk and still import back into runtime-consumable catalogs
- bundle files roundtrip through disk and restore full authoring catalogs
- file helpers infer format from extension where appropriate
- malformed manifests or missing sheet files fail clearly

### Package-local unit tests

Under `packages/bijou-i18n-tools-node/src/`:

- sheet files preserve CSV/TSV content exactly
- workbook directory manifest is versioned and deterministic
- unsupported extensions fail clearly
- missing files fail clearly

## Risks

- leaking too much platform logic back into the pure tools package
- inventing a workbook directory shape that is not explicit enough
- poor format inference or path handling
- accidentally making the helpers non-deterministic

## Out of scope

- XLSX
- Google Sheets
- remote storage/services
- watching/sync features
- shell integration

## Retrospective

### What landed

- new Node-specific package:
  - `packages/bijou-i18n-tools-node`
- new cycle-owned playback tests:
  - `tests/cycles/LX-005/bijou-i18n-tools-node.test.ts`
- new package-local tests:
  - `packages/bijou-i18n-tools-node/src/filesystem.test.ts`
- Node filesystem helpers for:
  - reading/writing one `ExchangeSheet` file as CSV or TSV
  - reading/writing one `CatalogBundle` file as JSON
  - reading/writing workbook directories with a versioned manifest
- extension-based format inference for `.csv`, `.tsv`, and `.json`
- explicit missing-manifest, missing-sheet, and unsupported-extension failures

### Drift from ideal

No material drift in scope.

One boundary held intentionally:

- XLSX and Google Sheets stayed out of this cycle

That is correct. LX-005 made the current exchange seam practical in Node without adding a richer spreadsheet provider yet.

### Debt spawned

Spawned:

- [LX-006 — XLSX Localization Adapters](/Users/james/git/bijou/docs/design/LX-006-xlsx-localization-adapters.md)
