---
title: DF-064 Audit keybinding help and shell hints family across real surfaces
legend: DF
lane: v6.0.0
priority: medium
keywords:
  - component-audit
  - dogfood
  - lowerings
  - help
---

# DF-064 Audit keybinding help and shell hints family across real surfaces

Audit the keybinding help and shell hints family against real runtime behavior instead of trusting fixtures or docs alone.

Scope:
- `createKeyMap()`
- `helpView()`
- `helpViewSurface()`
- `helpShort()`
- `helpShortSurface()`
- `helpFor()`
- `helpForSurface()`

Audit bar:
- run the family in a real interactive TUI
- run the family in a real static terminal snapshot
- read-test every documented variant and every lowering across `rich`, `static`, `pipe`, and `accessible`
- confirm DOGFOOD stories and `docs/design-system/component-families.md` still match runtime truth
- file follow-on backlog debt for any drift instead of hand-waving it away
