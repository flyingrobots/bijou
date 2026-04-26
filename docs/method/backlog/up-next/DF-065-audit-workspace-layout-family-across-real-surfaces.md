---
title: DF-065 Audit workspace layout family across real surfaces
legend: DF
lane: up-next
priority: medium
keywords:
  - component-audit
  - dogfood
  - lowerings
  - layout
---

# DF-065 Audit workspace layout family across real surfaces

Audit the workspace layout family against real runtime behavior instead of trusting fixtures or docs alone.

Scope:
- `splitPane()`
- `splitPaneSurface()`
- `grid()`
- `gridSurface()`
- `flex()`
- `vstack()`
- `hstack()`
- `place()`

Audit bar:
- run the family in a real interactive TUI
- run the family in a real static terminal snapshot
- read-test every documented variant and every lowering across `rich`, `static`, `pipe`, and `accessible`
- confirm DOGFOOD stories and `docs/design-system/component-families.md` still match runtime truth
- file follow-on backlog debt for any drift instead of hand-waving it away
