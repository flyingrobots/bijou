---
title: "LX-014 — Expand DOGFOOD Catalog Coverage"
legend: LX
lane: asap
---

# LX-014 — Expand DOGFOOD Catalog Coverage

LX-011 localized the language settings surface first. The next visible DOGFOOD
surfaces still need catalog coverage before localization becomes more than a
settings demo.

Problem:

- Top-level navigation, Blocks documentation, and component preview prose still
  carry English-first assumptions.
- The language setting can switch locale while many nearby UI surfaces remain
  unchanged.
- Without a focused expansion cycle, catalog coverage will grow only when a
  reviewer happens to notice a hard-coded string.

Desired outcome:

- Move the next DOGFOOD surfaces through the localization catalog:
  - top-level navigation labels
  - Blocks section labels and preview chrome
  - component preview headings and short helper copy
- Keep examples, code literals, component names, and API identifiers distinct
  from translatable UI strings.
- Add behavior tests that prove locale changes alter the intended UI model data,
  not tests that merely match rendered text dumps.

Why ASAP:

- Blocks are becoming a visible DOGFOOD product surface.
- Component and Block previews are where users will notice localization quality.
- Catalog coverage should grow while the Settings selector is still fresh in the
  architecture.

Hill:

A user can switch DOGFOOD language and see navigation, Blocks preview chrome,
and component preview labels change through catalog-backed UI data.

Non-goals:

- Do not translate every long-form documentation page.
- Do not add machine translation.
- Do not make component API names or code examples localizable.
