---
title: DF-053 Audit motion and shader effects family across real surfaces
legend: DF
lane: up-next
priority: medium
keywords:
  - component-audit
  - dogfood
  - lowerings
  - motion
---

# DF-053 Audit motion and shader effects family across real surfaces

Audit the motion and shader effects family against real runtime behavior instead of trusting fixtures or docs alone.

Scope:
- `canvas()`
- transition shaders
- `animate()`
- `timeline()` in its motion-orchestration role

Audit bar:
- run the family in a real interactive TUI
- run the family in a real static terminal snapshot
- read-test every documented variant and every lowering across `rich`, `static`, `pipe`, and `accessible`
- confirm DOGFOOD stories and `docs/design-system/component-families.md` still match runtime truth
- file follow-on backlog debt for any drift instead of hand-waving it away
