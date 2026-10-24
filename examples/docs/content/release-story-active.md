---
dogfood:
  localization:
    sourceLocale: en
    locales:
      - de
      - es
      - fr
    localized:
      de: ./release-story-active.de.md
      es: ./release-story-active.es.md
      fr: ./release-story-active.fr.md
---

# Current Release Story

This reader follows v{{RELEASE_LINE}}. The running package version is
{{RELEASE_VERSION}}.

## Reader Path

- `What's New` explains the changes for this release line.
- `Migration Guide` explains how to update an existing application.
- `GraphQL proof walkthrough` traces the real NavigationListBlock fixture.
- `CHANGELOG` history keeps earlier version boundaries visible.
- `Guides → Latest Features` covers local preview additions made after the preserved release notes.

## Evidence and Release Status

An `alpha`, `beta`, or `rc` version is a preview. Opening a guide does not prove
that a stable release has shipped or that every product witness has been replayed
on this build. Consult the release packet and tracker for those decisions.
The GraphQL walkthrough demonstrates one proof chain; historical release and
design documents retain the scope and claims of their original versions.
