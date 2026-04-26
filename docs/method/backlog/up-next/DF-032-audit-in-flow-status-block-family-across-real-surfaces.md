---
title: DF-032 Audit in-flow status block family across real surfaces
legend: DF
lane: up-next
priority: medium
keywords:
  - component-audit
  - dogfood
  - lowerings
  - alert
---

# DF-032 Audit in-flow status block family across real surfaces

Audit the in-flow status block family against real runtime behavior instead of trusting fixtures or docs alone.

Scope:
- `alert()`

Audit bar:
- run the family in a real interactive TUI
- run the family in a real static terminal snapshot
- read-test every documented variant and every lowering across `rich`, `static`, `pipe`, and `accessible`
- confirm DOGFOOD stories and `docs/design-system/component-families.md` still match runtime truth
- file follow-on backlog debt for any drift instead of hand-waving it away
