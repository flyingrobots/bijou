---
title: DX-037 tableSurface responsive width parity
legend: DX
lane: up-next
priority: medium
keywords:
  - table
  - surface
  - responsive
  - layout
  - developer-experience
---

# DX-037 tableSurface Responsive Width Parity

`DX-036` gives string `table()` a fitted table model, responsive human-mode
layout, visual variants, and explicit pipe formats. `tableSurface()` still uses
its older intrinsic surface sizing path.

This is acceptable for the first string-table cycle because a `Surface` does
not automatically know its parent width. The follow-on is to bring
`tableSurface()` to the same width-negotiation semantics once the surface path
has a clean way to receive or derive an available width.

## Scope

- add explicit `width` / `maxWidth` support to `tableSurface()`
- reuse or mirror the fitted column-width solver from `table()`
- wrap surface cells when fitted widths shrink below preferred widths
- preserve current intrinsic behavior when no width constraint is provided
- keep `tableSurface()` focused on surface-first boxed table output unless a
  broader surface variant model is deliberately designed

## Acceptance Bar

- `tableSurface({ width })` renders a surface no wider than the requested width
  when fitting is possible
- `tableSurface({ maxWidth })` caps intrinsic tables without requiring callers
  to set every column width manually
- existing shorthand calls keep their current intrinsic behavior
- wrapped surface rows preserve row height and cell alignment
- tests prove fixed, minimum, maximum, and weighted widths on the surface path
