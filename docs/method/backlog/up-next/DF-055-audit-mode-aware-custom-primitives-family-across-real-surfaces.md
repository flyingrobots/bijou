---
title: DF-055 Audit mode-aware custom primitives family across real surfaces
legend: DF
lane: up-next
priority: medium
keywords:
  - component-audit
  - dogfood
  - lowerings
  - renderByMode
---

# DF-055 Audit mode-aware custom primitives family across real surfaces

Audit the mode-aware custom primitives family against real runtime behavior instead of trusting fixtures or docs alone.

Scope:
- `renderByMode()`

Audit bar:
- run the family in a real interactive TUI
- run the family in a real static terminal snapshot
- read-test every documented variant and every lowering across `rich`, `static`, `pipe`, and `accessible`
- confirm DOGFOOD stories and `docs/design-system/component-families.md` still match runtime truth
- file follow-on backlog debt for any drift instead of hand-waving it away
