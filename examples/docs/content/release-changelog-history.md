---
dogfood:
  localization:
    sourceLocale: en
    locales:
      - de
      - es
      - fr
    localized:
      de: ./release-changelog-history.de.md
      es: ./release-changelog-history.es.md
      fr: ./release-changelog-history.fr.md
---

# CHANGELOG History

Source: `docs/CHANGELOG.md`

The changelog remains the release-history ledger. DOGFOOD exposes its version
boundaries in the Release section instead of inventing another release-history
format.

## Version Boundaries

- [Unreleased]
- [7.1.0] - 2026-06-14
- [7.0.0] - 2026-06-03
- [6.0.0] - skipped public package release

## Reader Contract

The in-app path preserves the changelog heading shape, keeps the current
unreleased section visible, and gives historical version boundaries a
reader-first route inside DOGFOOD.
