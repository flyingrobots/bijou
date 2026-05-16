---
title: DF-058 Audit lists for exploration family across real surfaces
legend: DF
lane: up-next
priority: medium
keywords:
  - component-audit
  - dogfood
  - lowerings
  - lists
---

# DF-058 Audit lists for exploration family across real surfaces

Audit the lists for exploration family against real runtime behavior instead of trusting fixtures or docs alone.

Scope:
- `enumeratedList()`
- `browsableList()`
- `browsableListSurface()`

Audit bar:
- run the family in a real interactive TUI
- run the family in a real static terminal snapshot
- read-test every documented variant and every lowering across `rich`, `static`, `pipe`, and `accessible`
- confirm DOGFOOD stories and `docs/design-system/component-families.md` still match runtime truth
- file follow-on backlog debt for any drift instead of hand-waving it away
