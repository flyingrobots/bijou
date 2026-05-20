---
title: "LX-017 — Multilingual DOGFOOD Translation Workbench"
legend: LX
lane: cool-ideas
---

# LX-017 — Multilingual DOGFOOD Translation Workbench

The DOGFOOD app could eventually become the place where translation maintainers
inspect catalogs, preview copy, and validate layout stress before shipping.

Cool idea:

- add a translation workbench inside DOGFOOD for catalog-backed surfaces
- preview a page in several locales side by side
- include pseudo-locale, long-string, and RTL stress modes
- show missing keys, stale entries, and fallback behavior as first-class facts
- link catalog entries back to the UI surfaces that consume them

Why this feels promising:

- it would make DOGFOOD a real proving ground for localization, not just a docs
  shell with translated labels
- it would support translators, maintainers, and agents from the same interface
- it would help catch layout and lowering problems before they become release
  defects

This belongs after the catalog coverage and debt inventory work establish enough
real localized surface area to inspect.
