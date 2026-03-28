# LX-002 — bijou-i18n Tools Package

Legend: [LX — Localization and Bidirectionality](/Users/james/git/bijou/docs/legends/LX-localization-and-bidirectionality.md)

## Why this cycle exists

LX-001 deliberately shipped only the runtime half of localization:

- in-memory catalogs
- locale and direction
- message/resource lookup
- runtime-safe references

That was the right first move, but a real localization system also needs workflow tooling.

This cycle exists to build the first real `@flyingrobots/bijou-i18n-tools` package.

It should give Bijou a provider-neutral authoring and translation workflow surface without dragging spreadsheets or files into the runtime package.

## Scope of this cycle

This first tooling slice intentionally narrows scope to:

- authoring catalog types
- source hashing
- stale translation detection
- provider-neutral tabular export/import rows
- reference validation and normalization
- compilation into runtime catalogs
- pseudo-localization helper

It does **not** include:

- Google Sheets integration
- Excel integration
- CSV file parsing
- filesystem adapters
- remote catalog publishing

Those can come later if justified.

## Human users

### Primary human user

A builder or localization maintainer who needs to:

- track changed source strings
- export only missing/stale work
- import translated rows cleanly
- validate references before runtime
- compile authoring catalogs into runtime catalogs

### Human hill

A builder can manage localization workflow data entirely in memory through one clean tooling package, without having to invent stale detection or spreadsheet row formats from scratch.

## Agent users

### Primary agent user

An agent helping maintain localization catalogs and workflow data.

They need to:

- detect stale translations
- understand which rows need work
- import reviewed rows safely
- validate references before shipping
- generate pseudo-localized stress content for layout review

### Agent hill

An agent can reason about localization workflow state explicitly through authoring catalogs and tabular rows, instead of diffing arbitrary JSON blobs or hidden spreadsheets.

## Human playback

1. A builder has authoring catalogs in memory.
2. They change an English source string.
3. The tooling marks affected translations stale automatically.
4. They export only missing/stale rows into a generic tabular shape.
5. They import completed rows back in.
6. They compile the result into runtime catalogs.
7. They load those runtime catalogs into `bijou-i18n`.

## Agent playback

1. An agent reads authoring catalogs.
2. It identifies stale or missing translations by source hash.
3. It exports review rows for a target locale.
4. It imports updated rows.
5. It validates references and catches broken/cyclic ones before runtime.
6. It generates pseudo-localized output to stress UI copy.

## Linked invariants

- [Tests Are the Spec](/Users/james/git/bijou/docs/invariants/tests-are-the-spec.md)
- [Graceful Lowering Preserves Meaning](/Users/james/git/bijou/docs/invariants/graceful-lowering-preserves-meaning.md)
- [Docs Are the Demo](/Users/james/git/bijou/docs/invariants/docs-are-the-demo.md)

## Invariants for this cycle

- tooling must stay separate from the runtime package
- tabular workflow support must be provider-neutral
- stale detection must be automatic, not manual bookkeeping
- reference-heavy catalogs must fail clearly before runtime
- pseudo-localization is a tooling concern, not a runtime concern

## Deliverable

Introduce a new package:

- `packages/bijou-i18n-tools`

With the first workflow surface for:

- authoring catalogs
- translation rows
- stale detection
- import/export
- compilation
- pseudo-localization

## Proposed API direction

The first slice should be close to:

```ts
interface AuthoringCatalog { ... }
interface AuthoringCatalogEntry { ... }
interface TranslationRow { ... }

function hashSourceValue(value: unknown): string;
function markStaleTranslations(catalogs: readonly AuthoringCatalog[]): readonly AuthoringCatalog[];
function exportTranslationRows(catalogs: readonly AuthoringCatalog[], locale: string): readonly TranslationRow[];
function importTranslationRows(catalogs: readonly AuthoringCatalog[], rows: readonly TranslationRow[]): readonly AuthoringCatalog[];
function compileCatalogs(catalogs: readonly AuthoringCatalog[]): readonly I18nCatalog[];
function pseudoLocalize(value: string): string;
```

Exact names can still move, but the responsibilities should not.

## Tests to write first

### Cycle-owned playback tests

Under `tests/cycles/LX-002/`:

- package exists and can be imported
- changed source strings mark existing translations stale
- export returns only missing/stale rows for a locale
- imported rows merge back and compile into runtime catalogs consumable by `bijou-i18n`
- pseudolocalization visibly lengthens text for layout stress

### Package-local unit tests

Under `packages/bijou-i18n-tools/src/`:

- stable source hashing
- broken references fail clearly
- cyclic references fail clearly
- compilation emits runtime catalogs with runtime-safe reference shapes

## Risks

- overcommitting to a spreadsheet provider too early
- making the tabular format too weak to support real workflows
- leaking UI/layout policy into tooling
- treating references as optional even though real localization workflows need them

## Out of scope

- actual file readers/writers
- actual CSV/XLSX parsers
- Google Sheets or Excel adapters
- shell integration beyond proving compiled catalogs load into the runtime package

## Retrospective

### What landed

- new package:
  - `packages/bijou-i18n-tools`
- new cycle-owned playback tests:
  - `tests/cycles/LX-002/bijou-i18n-tools.test.ts`
- new package-local unit tests:
  - `packages/bijou-i18n-tools/src/tools.test.ts`
- first tooling surface for:
  - authoring catalogs
  - stable source hashing
  - automatic stale-translation detection
  - provider-neutral translation rows
  - import/export of translated rows
  - reference validation during compilation
  - compilation into `@flyingrobots/bijou-i18n` runtime catalogs
  - pseudo-localization for layout stress

### Drift from ideal

No material drift in scope.

One intentional boundary held:

- spreadsheet, CSV, XLSX, Google Sheets, and filesystem adapters remain out of scope

That is a feature, not a miss. The cycle stayed focused on the pure tooling core instead of smuggling provider assumptions into the first package.

### Debt spawned

Spawned:

- [LX-003 — Spreadsheet Adapters and Catalog Exchange Workflows](/Users/james/git/bijou/docs/BACKLOG/LX-003-spreadsheet-adapters-and-catalog-exchange-workflows.md)
