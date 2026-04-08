# LX-010 — Built-in i18n Catalog Loader

Legend: [LX — Localization and Bidirectionality](../../legends/LX-localization-and-bidirectionality.md)

## Problem

`@flyingrobots/bijou-i18n` requires users to manually load and pass in
`I18nCatalog` objects. The `loadCatalog(catalog)` method on the runtime
accepts pre-constructed catalog data, but there is no built-in way to
give bijou a path, URL, or dynamic import spec and have it resolve,
load, and register catalogs automatically.

The filesystem loading utilities (`readCatalogBundleFile`,
`readExchangeWorkbookDirectory`, etc.) exist in
`@flyingrobots/bijou-i18n-tools-node`, but they are opt-in tool-tier
helpers, not a runtime-integrated loading seam. Users must orchestrate
the entire load-parse-register pipeline themselves.

## Why this matters

- New users expect `createI18nRuntime({ locale: 'fr', catalogPath: '...' })`
  or equivalent to just work
- The current design forces boilerplate that every localized app repeats
- Without a built-in loader, lazy/dynamic catalog loading (load on
  locale switch) requires users to invent their own async orchestration
- The gap is more visible now that the i18n tools packages ship
  production-grade exchange adapters

## Desired outcome

A user can create an i18n runtime with a loader strategy that handles
catalog resolution, loading, and registration without manually wiring
the tools pipeline. The loader should support:

- synchronous pre-loaded catalogs (current behavior, still supported)
- asynchronous file-based loading (Node.js)
- asynchronous dynamic import loading (bundler-friendly)
- lazy per-locale loading on locale switch

## Non-goals

- Replacing the tools-tier adapters — those remain for batch
  processing, exchange workflows, and CLI tooling
- HTTP/fetch-based loading in core — that belongs in a platform adapter
- Automatic locale detection — that stays in the runtime adapter layer

## Risks

- The loader abstraction must not pull Node.js APIs into the core
  `bijou-i18n` package — the loader contract should be a port, with
  platform-specific adapters in `bijou-i18n-tools-node` or similar
- Lazy loading introduces async state into a currently synchronous
  runtime — needs clear fallback/pending semantics
