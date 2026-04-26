---
title: DF-056 Audit dense comparison family across real surfaces
legend: DF
lane: up-next
priority: medium
keywords:
  - component-audit
  - dogfood
  - lowerings
  - table
---

# DF-056 Audit dense comparison family across real surfaces

Audit the dense comparison family against real runtime behavior instead of trusting fixtures or docs alone.

Scope:
- `table()`
- `tableSurface()`
- `navigableTable()`
- `navigableTableSurface()`

Audit bar:
- run the family in a real interactive TUI
- run the family in a real static terminal snapshot
- read-test every documented variant and every lowering across `rich`, `static`, `pipe`, and `accessible`
- confirm DOGFOOD stories and `docs/design-system/component-families.md` still match runtime truth
- file follow-on backlog debt for any drift instead of hand-waving it away
