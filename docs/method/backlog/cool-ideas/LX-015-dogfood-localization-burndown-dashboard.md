---
title: "LX-015 — DOGFOOD Localization Burndown Dashboard"
legend: LX
lane: cool-ideas
---

# LX-015 — DOGFOOD Localization Burndown Dashboard

Once DOGFOOD has an i18n debt inventory, the count could become a visible
dashboard instead of a hidden test report.

Cool idea:

- add a DOGFOOD localization burndown page that shows remaining localizable
  strings by surface, locale, and status
- show which strings are cataloged, intentionally exempt, stale, or missing
- let maintainers compare the current branch against the mainline debt baseline
- surface long-string and direction-risk notes without requiring a separate
  spreadsheet

Why this feels promising:

- it would make localization debt tangible during everyday DOGFOOD use
- it would give translators and maintainers the same source of truth
- it could turn the LX ratchet into a product-quality feedback surface rather
  than only a CI guardrail

This should stay exploratory until the deterministic inventory exists.
