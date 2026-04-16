---
title: "LX-010 — Built-in i18n Catalog Loader"
legend: LX
lane: retro
---

# LX-010 — Built-in i18n Catalog Loader

Completed on `release/v5.0.0`. Bijou already ships the built-in runtime loader
seam through `createI18nRuntimeAsync()`, the `loader` option on
`createI18nRuntime()`, and the `preloadLocale()` / `setLocale()` activation
path in `@flyingrobots/bijou-i18n`. The Node file-backed adapter also already
ships as `createCatalogBundleFileLoader()` in
`@flyingrobots/bijou-i18n-tools-node`.

This closure pass makes that repo truth explicit: the canonical backlog no
longer pretends the loader is missing, the package docs now show both dynamic
import and file-backed loader paths, and `tests/cycles/LX-010/` now proves the
end-to-end locale-bundle activation path directly.

## Original Proposal

Legend: [LX — Localization and Bidirectionality](../legends/LX-localization-and-bidirectionality.md)

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
