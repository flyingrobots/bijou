---
dogfood:
  localization:
    sourceLocale: en
    locales:
      - de
      - es
      - fr
    localized:
      de: ./release-story-current.de.md
      es: ./release-story-current.es.md
      fr: ./release-story-current.fr.md
---

# Current Release Story

DOGFOOD now keeps the v7.2 release story in the main reader flow. A presenter
can open Release and walk the current line without relying on hidden side
metadata.

## Reader Path

- `What's New` remains the long-form release document.
- `GraphQL proof walkthrough` shows the real NavigationListBlock proof chain.
- `CHANGELOG` history keeps version boundaries visible from the same Release
  section.

## Demo Integrity

The release story is intentionally narrow: explain the shipped V7 proof, make
the GraphQL chain inspectable, and preserve changelog history. First-run
persistence, version-memory ports, and broad V8 artifact work stay out of this
v7.2 slice.
