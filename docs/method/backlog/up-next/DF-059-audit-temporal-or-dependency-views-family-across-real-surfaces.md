---
title: DF-059 Audit temporal or dependency views family across real surfaces
legend: DF
lane: up-next
priority: medium
keywords:
  - component-audit
  - dogfood
  - lowerings
  - dag
---

# DF-059 Audit temporal or dependency views family across real surfaces

Audit the temporal or dependency views family against real runtime behavior instead of trusting fixtures or docs alone.

Scope:
- `timeline()`
- `dag()`
- `dagSlice()`
- `dagStats()`
- `dagPane()`

Audit bar:
- run the family in a real interactive TUI
- run the family in a real static terminal snapshot
- read-test every documented variant and every lowering across `rich`, `static`, `pipe`, and `accessible`
- confirm DOGFOOD stories and `docs/design-system/component-families.md` still match runtime truth
- file follow-on backlog debt for any drift instead of hand-waving it away
