---
title: LX-007 — Service-Oriented Localization Adapters
lane: graveyard
legend: LX
---

# LX-007 — Service-Oriented Localization Adapters

## Disposition

Landed in `release/v4.5.0` as a provider-neutral async service seam in
`@flyingrobots/bijou-i18n-tools`. The package now exports revision-aware
service snapshots and adapter ports for translation workbooks and catalog
bundles, plus push/pull helpers that build directly on the existing workbook and
bundle exchange contracts. Concrete Google Sheets or other remote-service
clients still belong outside the pure tooling package, but the service-backed
workflow surface is no longer missing.

## Original Proposal

Legend: [LX — Localization and Bidirectionality](../legends/LX-localization-and-bidirectionality.md)

## Idea

LX-006 proved the provider seam with a richer spreadsheet format:

- XLSX workbook exchange

The next likely slice is service-backed exchange on top of the same workbook/bundle contracts:

- Google Sheets
- maybe later other localization services

## Why

Some real localization workflows need shared review surfaces, not just files on disk.

Those should still build on the existing Bijou workbook/bundle seam instead of introducing a second provider model.

## Status

Backlog spawned by the retrospective for LX-006.
