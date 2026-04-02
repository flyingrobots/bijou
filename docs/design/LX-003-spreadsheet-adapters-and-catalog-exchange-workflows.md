# LX-003 — Spreadsheet Adapters and Catalog Exchange Workflows

Legend: [LX — Localization and Bidirectionality](../legends/LX-localization-and-bidirectionality.md)

## Why this cycle exists

LX-002 gave Bijou a real localization tooling core:

- authoring catalogs
- source hashing
- stale detection
- provider-neutral translation rows
- runtime catalog compilation
- pseudo-localization

That solved in-memory workflow logic, but not the exchange problem. Real localization work still has to move through:

- spreadsheet-shaped review workflows
- structured handoff bundles
- typed values and references that survive export/import without turning into mush

This cycle exists to add a provider-neutral exchange layer to `@flyingrobots/bijou-i18n-tools`.

## Scope of this cycle

This cycle intentionally covers:

- a spreadsheet-friendly workbook model
- typed export/import for translation rows
- a serializable catalog-bundle format for authoring catalogs
- reference-safe encoding/decoding for message/resource/data values
- validation at the exchange boundary

It does **not** include:

- CSV parsing
- XLSX parsing
- Google Sheets integration
- filesystem adapters
- remote services
- runtime i18n changes

The goal is to define the exchange seam that those adapters can target later.

## Human users

### Primary human user

A localization maintainer who needs to:

- export translatable work into a spreadsheet-like shape
- import reviewed translations safely
- move full authoring catalogs across tools or repos
- preserve typed values and references without inventing a bespoke format

### Human hill

A builder can move localization workflow data through spreadsheet-like and bundle-like formats without losing type/reference fidelity or writing their own ad hoc serialization rules.

## Agent users

### Primary agent user

An agent helping with localization maintenance and exchange.

It needs to:

- generate workbook-shaped review payloads
- read imported workbook data back into typed translation rows
- exchange full authoring catalogs in a stable serializable form
- validate malformed exchange data before it reaches runtime compilation

### Agent hill

An agent can reason about localization exchange through explicit workbook/bundle contracts instead of reverse-engineering spreadsheet columns or raw JSON blobs.

## Human playback

1. A builder has authoring catalogs in memory.
2. They export stale or missing work for `de` into a workbook-shaped review payload.
3. A translator or tool edits the workbook rows.
4. The builder imports the workbook back into translation rows and merges it into the authoring catalogs.
5. They export the full catalogs as a serializable bundle for storage, transport, or staged review.
6. They import the bundle back and compile it into runtime catalogs.

## Agent playback

1. An agent reads authoring catalogs.
2. It exports a workbook for a target locale.
3. It can inspect typed cells and references explicitly instead of guessing.
4. It imports workbook rows back into translation rows.
5. It exports/imports full catalog bundles for handoff or normalization.
6. It validates malformed references or invalid encoded values before compilation.

## Linked invariants

- [Tests Are the Spec](../invariants/tests-are-the-spec.md)
- [Graceful Lowering Preserves Meaning](../invariants/graceful-lowering-preserves-meaning.md)
- [Docs Are the Demo](../invariants/docs-are-the-demo.md)

## Invariants for this cycle

- exchange formats must stay provider-neutral
- typed values and references must survive roundtrips explicitly
- workbook exchange must be string-cell-safe
- malformed exchange data must fail clearly before runtime compilation
- adapter concerns must remain outside this cycle

## Deliverable

Extend `packages/bijou-i18n-tools` with exchange APIs for:

- workbook export/import
- typed cell encoding/decoding
- serializable catalog bundles
- bundle export/import

## Proposed API direction

The first slice should be close to:

```ts
interface ExchangeWorkbook { ... }
interface ExchangeSheet { ... }
interface ExchangeRow { ... }
interface CatalogBundle { ... }

function exportTranslationWorkbook(
  catalogs: readonly AuthoringCatalog[],
  locale: string,
): ExchangeWorkbook;

function importTranslationWorkbook(
  workbook: ExchangeWorkbook,
): readonly TranslationRow[];

function exportCatalogBundle(
  catalogs: readonly AuthoringCatalog[],
): CatalogBundle;

function importCatalogBundle(
  bundle: CatalogBundle,
): readonly AuthoringCatalog[];
```

Exact names can still move, but the responsibilities should not.

## Tests to write first

### Cycle-owned playback tests

Under `tests/cycles/LX-003/`:

- workbook export produces spreadsheet-friendly rows for stale/missing translation work
- edited workbook data imports back into translation rows and merges into authoring catalogs
- catalog bundles roundtrip full authoring catalogs without losing references or typed values
- malformed workbook/bundle payloads fail clearly

### Package-local unit tests

Under `packages/bijou-i18n-tools/src/`:

- typed value encoding/decoding preserves strings, objects, arrays, booleans, null, and refs
- workbook import rejects malformed headers or invalid encoded values
- bundle import rejects malformed catalog payloads
- workbook rows remain string-cell-safe

## Risks

- overfitting the workbook shape to one spreadsheet vendor
- inventing a bundle format that loses reference fidelity
- making the exchange format too magical to validate clearly
- leaking filesystem/provider concerns into the pure tooling package

## Out of scope

- CSV readers/writers
- XLSX readers/writers
- Google Sheets integration
- storage or persistence adapters
- runtime integration beyond proving the roundtripped catalogs still compile cleanly

## Retrospective

### What landed

- `@flyingrobots/bijou-i18n-tools` now ships a provider-neutral exchange layer for:
  - spreadsheet-friendly translation workbooks
  - typed value encoding/decoding
  - serializable catalog bundles
- new cycle-owned playback tests:
  - `tests/cycles/LX-003/bijou-i18n-exchange.test.ts`
- new package-local exchange tests:
  - `packages/bijou-i18n-tools/src/exchange.test.ts`
- workbook exchange now roundtrips stale/missing localization work back into runtime-consumable catalogs
- catalog bundles now roundtrip full authoring catalogs without losing typed values or runtime-safe refs

### Drift from ideal

No material drift in scope.

One boundary held intentionally:

- there are still no CSV/XLSX/Google Sheets/file adapters in this package

That is correct for this cycle. LX-003 defined the exchange seam those adapters can target without polluting the pure tooling core.

### Debt spawned

Spawned:

- [LX-004 — Provider Adapters for Workbook and Bundle Exchange](../BACKLOG/LX-004-provider-adapters-for-workbook-and-bundle-exchange.md)
