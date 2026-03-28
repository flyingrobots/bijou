# LX-006 — XLSX Localization Adapters

Legend: [LX — Localization and Bidirectionality](/Users/james/git/bijou/docs/legends/LX-localization-and-bidirectionality.md)

## Why this cycle exists

LX-005 made the exchange seam practical on disk through:

- CSV / TSV sheet files
- JSON bundle files
- workbook directories with a manifest

That still leaves a common real-world localization format uncovered:

- `.xlsx` workbook exchange

This cycle exists to add a true spreadsheet provider adapter on top of the existing workbook seam without dragging spreadsheet-library concerns into the pure runtime/tools packages.

## Scope of this cycle

This cycle intentionally covers:

- a dedicated XLSX adapter package
- serializing an `ExchangeWorkbook` to XLSX bytes
- parsing XLSX bytes back into an `ExchangeWorkbook`
- deterministic handling of workbook sheet order and required workbook columns

It does **not** include:

- Google Sheets
- remote services
- filesystem helpers for XLSX paths
- changing the pure `@flyingrobots/bijou-i18n-tools` workbook model
- changing bundle JSON exchange

The point is to prove the provider seam with one richer spreadsheet format first.

## Human users

### Primary human user

A localization maintainer who needs to:

- hand a workbook to translators in a true spreadsheet format
- import edited spreadsheets back into the existing Bijou exchange flow
- keep using the same workbook schema regardless of carrier format

### Human hill

A maintainer can export and import localization workbooks as `.xlsx` files without losing typed exchange values or inventing a second workbook model.

## Agent users

### Primary agent user

An agent automating localization exchange.

It needs to:

- export workbook bytes suitable for XLSX workflows
- parse returned XLSX workbook bytes deterministically
- stay on the same workbook seam as CSV / TSV / filesystem helpers

### Agent hill

An agent can automate true spreadsheet exchange without shelling out to ad hoc conversion scripts or bypassing the Bijou workbook model.

## Human playback

1. A maintainer exports a German translation workbook.
2. They serialize it to an XLSX blob.
3. A spreadsheet editor changes translated values.
4. The maintainer parses the XLSX blob back into an `ExchangeWorkbook`.
5. They import the rows and merge the translations back into authoring catalogs.
6. The resulting runtime catalogs resolve the edited translations correctly.

## Agent playback

1. An agent exports an `ExchangeWorkbook`.
2. It serializes that workbook to XLSX bytes for review or delivery.
3. It later parses returned XLSX bytes back into an `ExchangeWorkbook`.
4. It imports the workbook rows and compiles catalogs without losing typed values, refs, or sheet ordering.

## Linked invariants

- [Tests Are the Spec](/Users/james/git/bijou/docs/invariants/tests-are-the-spec.md)
- [Graceful Lowering Preserves Meaning](/Users/james/git/bijou/docs/invariants/graceful-lowering-preserves-meaning.md)
- [Docs Are the Demo](/Users/james/git/bijou/docs/invariants/docs-are-the-demo.md)

## Invariants for this cycle

- spreadsheet-provider logic must stay out of `@flyingrobots/bijou-i18n-tools`
- XLSX adapters must preserve the existing workbook schema instead of inventing a new one
- workbook sheet order must remain deterministic
- required translation workbook columns must remain explicit
- service-backed adapters remain out of scope for this cycle

## Deliverable

Introduce a new package:

- `packages/bijou-i18n-tools-xlsx`

With XLSX adapters for:

- `ExchangeWorkbook` -> XLSX bytes
- XLSX bytes -> `ExchangeWorkbook`

## Proposed API direction

The first slice should be close to:

```ts
function serializeExchangeWorkbookXlsx(workbook: ExchangeWorkbook): Uint8Array;
function parseExchangeWorkbookXlsx(input: Uint8Array | ArrayBuffer): ExchangeWorkbook;
```

Exact names can still move, but the responsibilities should not.

## Tests to write first

### Cycle-owned playback tests

Under `tests/cycles/LX-006/`:

- XLSX workbooks roundtrip through bytes and still import back into runtime-consumable catalogs
- the new package exports only the XLSX-focused workbook adapters
- typed values and refs survive the roundtrip when workbook rows are edited after parsing

### Package-local unit tests

Under `packages/bijou-i18n-tools-xlsx/src/`:

- workbook sheet order is preserved
- required columns survive serialization and parsing
- missing required headers fail clearly
- non-string cell values are normalized back into the exchange row shape correctly

## Risks

- leaking spreadsheet-library assumptions into the pure tools package
- accidentally loosening the workbook schema in order to fit XLSX convenience
- poor error messages for malformed workbook headers
- introducing too much provider-specific policy too early

## Out of scope

- Google Sheets
- remote localization services
- XLSX filesystem wrappers
- live sync
- changing the exchange row schema

## Retrospective

### What landed

- a new dedicated package:
  - `packages/bijou-i18n-tools-xlsx`
- new cycle-owned playback tests:
  - `tests/cycles/LX-006/bijou-i18n-xlsx.test.ts`
- new package-local tests:
  - `packages/bijou-i18n-tools-xlsx/src/xlsx.test.ts`
- XLSX workbook adapters for:
  - `ExchangeWorkbook` -> XLSX bytes
  - XLSX bytes -> `ExchangeWorkbook`
- explicit validation for:
  - missing header rows
  - missing required headers
  - duplicate headers
- preservation of:
  - workbook sheet order
  - translation workbook columns
  - typed row payloads after parse/import

### Drift from ideal

One deliberate scope narrowing happened:

- the backlog item originally mentioned service-oriented adapters too

That work did **not** land here, and that is correct. LX-006 proved the richer spreadsheet-provider seam with XLSX first and left remote/service adapters for a later cycle.

### Debt spawned

Spawned:

- [LX-007 — Service-Oriented Localization Adapters](/Users/james/git/bijou/docs/BACKLOG/LX-007-service-oriented-localization-adapters.md)
