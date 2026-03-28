# LX — Localization and Bidirectionality

_Legend for making Bijou locale-aware, direction-aware, and ready for real translation workflows_

## Goal

Make localization a first-class Bijou capability rather than a late string-replacement exercise.

This legend covers work like:

- localizable shell chrome
- locale-aware formatting
- direction metadata
- RTL/LTR-safe layout behavior
- catalogs
- translation workflows
- localization tooling

## Human users

- builders shipping Bijou apps in multiple locales
- translators and localization maintainers
- end users reading localized shells and docs

## Agent users

- agents generating shell copy
- agents validating layout under long-string or RTL stress
- agents maintaining catalogs and workflow tooling

## Human hill

A builder can localize Bijou shell/app content without fighting English-only assumptions or inventing their own ad hoc localization substrate.

## Agent hill

An agent can reason about locale, direction, catalogs, and translation workflow data through explicit framework contracts instead of undocumented conventions.

## Core invariants

- [Graceful Lowering Preserves Meaning](/Users/james/git/bijou/docs/invariants/graceful-lowering-preserves-meaning.md)
- [Docs Are the Demo](/Users/james/git/bijou/docs/invariants/docs-are-the-demo.md)

## Related doctrine

- [Localization and Bidirectionality](/Users/james/git/bijou/docs/strategy/localization-and-bidirectionality.md)
- [Content Guide](/Users/james/git/bijou/docs/strategy/content-guide.md)

## Current cycle and backlog

- latest completed cycle: [LX-003 — Spreadsheet Adapters and Catalog Exchange Workflows](/Users/james/git/bijou/docs/design/LX-003-spreadsheet-adapters-and-catalog-exchange-workflows.md)
- backlog: [LX-004 — Provider Adapters for Workbook and Bundle Exchange](/Users/james/git/bijou/docs/BACKLOG/LX-004-provider-adapters-for-workbook-and-bundle-exchange.md)
