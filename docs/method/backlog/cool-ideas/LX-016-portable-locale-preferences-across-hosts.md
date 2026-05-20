---
title: "LX-016 — Portable Locale Preferences Across Hosts"
legend: LX
lane: cool-ideas
---

# LX-016 — Portable Locale Preferences Across Hosts

DOGFOOD is the first visible host for locale preference, but the preference model
will eventually need to work across more than one runtime shape.

Cool idea:

- define a portable preference contract that can be adapted for:
  - Node DOGFOOD
  - browser-like preview hosts
  - Storybook-style workstations
  - MCP or capture runners
  - deterministic test fixtures
- make import/export of locale preferences explicit so captures and demos can
  reproduce the same locale without depending on a user's machine
- keep each host adapter responsible for its own storage details

Why this feels promising:

- it would prevent DOGFOOD settings from becoming a Node-only pattern
- it would make localized captures and previews reproducible
- it would align locale preference with Bijou's ports-and-adapters architecture

This should not start before the simpler DOGFOOD persistence port proves the
basic behavior.
