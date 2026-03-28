# LX-001 — bijou-i18n Runtime Package

Legend: [LX — Localization and Bidirectionality](/Users/james/git/bijou/docs/legends/LX-localization-and-bidirectionality.md)

## Why this cycle exists

Bijou now has doctrine for localization and bidirectionality, but no runtime package boundary that applications or shell surfaces can actually consume.

If we want `bijou-i18n` to be a real localization tool, the first step is not spreadsheets.

The first step is a clean, in-memory runtime package.

This cycle intentionally narrows scope to:

- `@flyingrobots/bijou-i18n`
- runtime catalogs
- locale and direction
- runtime-safe lookup and references
- formatting seams

It does **not** try to ship spreadsheet workflows yet.

## Human users

### Primary human user

A builder who wants to localize Bijou shell or app content without inventing their own ad hoc runtime i18n substrate.

They are asking:

- where does locale live?
- where does direction live?
- how do I register catalogs?
- how do I look up a message or resource?
- how do I do this without filesystem or service assumptions?

### Human hill

A builder can install and use a real `bijou-i18n` runtime package entirely in memory, with a clean catalog model and no spreadsheet baggage.

## Agent users

### Primary agent user

An agent that needs to inspect or generate localized UI against explicit runtime contracts instead of hidden string tables.

They are asking:

- what is the active locale?
- what is the active direction?
- what keys and namespaces exist?
- how do references resolve?
- what happens when a translation is missing?

### Agent hill

An agent can reason about localized runtime content through explicit catalog, locale, direction, and lookup APIs instead of implicit English defaults.

## Human playback

1. A builder installs `@flyingrobots/bijou-i18n`.
2. They create an in-memory catalog with namespaced keys.
3. They load the catalog into a runtime.
4. They resolve messages and resources by key.
5. They switch locale and observe fallback behavior.
6. They read direction from the same runtime without inventing a second seam.

## Agent playback

1. An agent inspects the runtime package API.
2. It can enumerate or at least reason about namespaces, ids, locale, and direction.
3. It resolves a message key with interpolation values.
4. It resolves a resource/data key.
5. It observes missing-translation fallback and explicit missing-key behavior.

## Linked invariants

- [Tests Are the Spec](/Users/james/git/bijou/docs/invariants/tests-are-the-spec.md)
- [Graceful Lowering Preserves Meaning](/Users/james/git/bijou/docs/invariants/graceful-lowering-preserves-meaning.md)
- [Docs Are the Demo](/Users/james/git/bijou/docs/invariants/docs-are-the-demo.md)

## Invariants for this cycle

- runtime package must work entirely in memory
- runtime package must not assume spreadsheets, files, services, or persistence
- runtime package must expose direction as first-class metadata
- runtime package must be string-first but not string-only
- runtime package must support runtime-safe references without becoming a spreadsheet interpreter

## Deliverable

Introduce a new package:

- `packages/bijou-i18n`

With a minimal but real runtime surface:

- catalog types
- key types
- locale direction types
- in-memory runtime / adapter
- message lookup
- generic resource lookup
- fallback behavior
- formatter hooks or default formatters

## Proposed API direction

The exact names can still evolve, but the first slice should be close to:

```ts
type LocaleDirection = 'ltr' | 'rtl' | 'auto';

interface CatalogKey {
  readonly namespace: string;
  readonly id: string;
}

type CatalogEntryKind = 'message' | 'resource' | 'data';

interface I18nCatalogEntry<T = unknown> {
  readonly key: CatalogKey;
  readonly kind: CatalogEntryKind;
  readonly sourceLocale: string;
  readonly values: Readonly<Record<string, T>>;
  readonly fallbackValue?: T;
}

interface I18nRuntime {
  readonly locale: string;
  readonly direction: LocaleDirection;
  loadCatalog(catalog: I18nCatalog): void;
  unloadCatalog(namespace: string): void;
  t(key: CatalogKey, values?: Record<string, unknown>): string;
  resource<T = unknown>(key: CatalogKey): T | undefined;
}
```

The first slice does not need every possible authoring feature. It does need a clean runtime shape.

## Tests to write first

### Cycle-owned playback tests

Under `tests/cycles/LX-001/`:

- package exists and can be imported
- in-memory catalogs can be loaded and unloaded
- messages resolve by namespaced key
- missing locale values fall back to source locale
- runtime exposes locale and direction together
- resource lookup supports non-string values

### Package-local unit tests

Under `packages/bijou-i18n/src/`:

- missing-key behavior is explicit
- namespace unload removes lookups cleanly
- interpolation works for simple scalar values
- runtime-safe references resolve or fail clearly

## Risks

- over-designing the runtime around tooling concerns too early
- under-designing the runtime into string-only helpers
- leaking layout or UI overflow policy into the i18n package
- trying to implement tooling and runtime together in one cycle

## Out of scope

- `@flyingrobots/bijou-i18n-tools`
- spreadsheet import/export
- stale detection
- pseudo-localization
- RTL shell mirroring implementation
- shell integration beyond light proving imports

## Retrospective

### What landed

- new package: `packages/bijou-i18n`
- runtime types and exports for:
  - catalogs
  - namespaced keys
  - locale direction
  - references
  - runtime creation
- in-memory runtime with:
  - catalog load/unload
  - message lookup
  - non-string resource lookup
  - source-locale fallback
  - runtime-safe reference resolution
  - default Intl-based formatter seams
- cycle-owned playback tests under `tests/cycles/LX-001/`
- package-local unit tests in `packages/bijou-i18n/src/runtime.test.ts`
- workspace/build integration via root `tsconfig.json`

### Drift from ideal

- the first slice does not yet integrate shell copy or DOGFOOD with message descriptors
- `@flyingrobots/bijou-i18n-tools` remains intentionally unstarted
- message interpolation is currently simple scalar replacement only; richer reference-aware authoring remains a tooling concern for later

### Debt spawned

- [LX-002 — bijou-i18n Tools Package](/Users/james/git/bijou/docs/BACKLOG/LX-002-bijou-i18n-tools-package.md)
