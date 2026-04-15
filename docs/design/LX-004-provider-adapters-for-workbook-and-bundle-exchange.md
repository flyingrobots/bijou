# LX-004 — Provider Adapters for Workbook and Bundle Exchange

Legend: [LX — Localization and Bidirectionality](../legends/LX-localization-and-bidirectionality.md)

## Why this cycle exists

LX-003 established the provider-neutral exchange seam in `@flyingrobots/bijou-i18n-tools`:

- spreadsheet-friendly workbooks
- serializable catalog bundles
- typed value encoding/decoding

That seam is useful, but still abstract. Real workflows need concrete adapters that can move those formats through common external media.

This cycle exists to prove the seam with the smallest honest adapter layer:

- delimited text for sheets (`csv` / `tsv`)
- JSON for catalog bundles

## Scope of this cycle

This cycle intentionally covers:

- serializing an `ExchangeSheet` to TSV
- parsing an `ExchangeSheet` from TSV
- serializing an `ExchangeSheet` to CSV
- parsing an `ExchangeSheet` from CSV
- serializing a `CatalogBundle` to JSON
- parsing a `CatalogBundle` from JSON

It does **not** include:

- filesystem helpers
- XLSX
- Google Sheets
- remote services
- multi-file workbook orchestration

The point is to prove the adapter surface without bringing in provider/platform coupling yet.

## Human users

### Primary human user

A localization maintainer who needs to:

- hand off one exchange sheet to external tooling in a real delimited text format
- bring edited rows back from that format
- move full catalog bundles through a serializable JSON representation

### Human hill

A builder can export a sheet to a real CSV/TSV string, import it back, and move full authoring bundles through JSON without inventing one-off parsing logic.

## Agent users

### Primary agent user

An agent maintaining localization workflows.

It needs to:

- emit delimited review sheets that non-Bijou tooling can consume
- parse those sheets back safely
- serialize and deserialize full catalog bundles for transport or review

### Agent hill

An agent can move localization exchange data through explicit adapter APIs instead of hand-rolling CSV escaping or JSON bundle parsing in each workflow.

## Human playback

1. A builder exports a translation workbook for `de`.
2. They take the sheet and serialize it to TSV or CSV.
3. Another tool edits the serialized rows.
4. The builder parses the edited sheet back into an `ExchangeSheet`.
5. They import the workbook rows and merge them into authoring catalogs.
6. They serialize a full catalog bundle to JSON and later restore it back into authoring catalogs.

## Agent playback

1. An agent exports a workbook.
2. It serializes the sheet to TSV or CSV for an external review tool.
3. It parses the edited sheet back.
4. It serializes full catalog bundles to JSON for handoff or snapshotting.
5. It restores bundles from JSON and feeds them back into the tooling core.

## Linked invariants

- [Tests Are the Spec](../invariants/tests-are-the-spec.md)
- [Graceful Lowering Preserves Meaning](../invariants/graceful-lowering-preserves-meaning.md)
- [Docs Are the Demo](../invariants/docs-are-the-demo.md)

## Invariants for this cycle

- adapter logic must build on the LX-003 exchange seam instead of replacing it
- CSV/TSV parsing must preserve exact cell strings
- delimiter/quote/newline edge cases must be tested, not hand-waved
- JSON bundle adapters must stay explicit and version-safe
- filesystem and service concerns remain out of scope

## Deliverable

Extend `packages/bijou-i18n-tools` with adapter APIs for:

- `ExchangeSheet` <-> `csv`
- `ExchangeSheet` <-> `tsv`
- `CatalogBundle` <-> `json`

## Proposed API direction

The first slice should be close to:

```ts
type DelimitedFormat = 'csv' | 'tsv';

function serializeExchangeSheet(
  sheet: ExchangeSheet,
  format: DelimitedFormat,
): string;

function parseExchangeSheet(
  name: string,
  input: string,
  format: DelimitedFormat,
): ExchangeSheet;

function serializeCatalogBundleJson(bundle: CatalogBundle): string;
function parseCatalogBundleJson(input: string): CatalogBundle;
```

Higher-level helpers can be added later if needed, but this cycle should prove the core adapter surface.

## Tests to write first

### Cycle-owned playback tests

Under `tests/cycles/LX-004/`:

- exported workbook sheets roundtrip through TSV and still import into runtime-consumable catalogs
- exported workbook sheets roundtrip through CSV even with commas, quotes, and newlines in cells
- catalog bundles roundtrip through JSON and still restore full authoring catalogs
- malformed CSV/TSV/JSON payloads fail clearly

### Package-local unit tests

Under `packages/bijou-i18n-tools/src/`:

- CSV quoting/escaping is correct
- TSV preserves tabs/newlines through quoting rules
- parsers reject ragged rows
- JSON bundle parser rejects malformed versioned payloads

## Risks

- under-testing delimiter edge cases
- accidentally normalizing away exact cell payloads
- letting adapter helpers grow into file I/O abstractions
- making JSON bundle parsing too permissive

## Out of scope

- file reads/writes
- XLSX
- Google Sheets
- multi-sheet ZIP/manifest packaging
- service adapters of any kind

## Retrospective

### What landed

- new adapter surface in `@flyingrobots/bijou-i18n-tools` for:
  - `ExchangeSheet` <-> CSV
  - `ExchangeSheet` <-> TSV
  - `CatalogBundle` <-> JSON
- new cycle-owned playback tests:
  - `tests/cycles/LX-004/bijou-i18n-adapters.test.ts`
- new package-local adapter tests:
  - `packages/bijou-i18n-tools/src/adapters.test.ts`
- adapter coverage for:
  - CSV quoting and escaping
  - TSV cell preservation
  - ragged-row rejection
  - malformed JSON bundle rejection
- explicit adapter exports layered on top of the LX-003 workbook/bundle seam instead of bypassing it

### Drift from ideal

No material drift in scope.

One deliberate boundary held:

- there are still no filesystem helpers, XLSX adapters, or Google Sheets/service integrations

That is correct for this cycle. LX-004 proved the adapter surface with plain text and JSON formats first.

### Debt spawned

Spawned:

- [LX-005 — Rich Spreadsheet and Filesystem Adapters](../method/graveyard/legacy-backlog/LX-005-rich-spreadsheet-and-filesystem-adapters.md)
