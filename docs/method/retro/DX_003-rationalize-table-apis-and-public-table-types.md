---
title: DX-003 — Rationalize Table APIs and Public Table Types
lane: retro
legend: DX
---

# DX-003 — Rationalize Table APIs and Public Table Types

## Disposition

Implemented on release/v4.5.0 by adding common table shorthands for table() and tableSurface(), introducing clearer public row types for plain and surface tables, and broadening navigable-table inputs so lightweight snapshots no longer require a separate state mental model for simple rendering. Focused table, surface, and navigable-table tests now prove the family feels consistent across plain and interactive use.

## Original Proposal

Legend: [DX — Developer Experience](../legends/DX-developer-experience.md)

## Idea

Make the table family feel like one coherent surface instead of a cluster of near-related APIs with mismatched conventions.

## Why

The current table APIs create avoidable friction:

- `navigableTableSurface(...)` and `tableSurface(...)` use different calling conventions
- the rows types are confusing between plain strings and `TableSurfaceCell`
- the common case for "just show me a table" is more verbose than it should be

This is exactly the kind of thing users discover by compiler error instead of by intention.

## Captured feedback

From `warp-ttd` TUI development:

- `tableSurface` vs `navigableTableSurface` calling conventions are inconsistent
- `rows` typing is confusing around `string[][]` vs `TableSurfaceCell[][]`
- `TableSurfaceCell` is not obvious from the public surface
- a simple `table(columns, rows, ctx?)` style shorthand would help the common case

## Likely scope

- decide on consistent table-family calling conventions
- make public table row/cell typing obvious and documented
- consider a simpler high-frequency table helper for the 80% case
- add tests proving the table family feels consistent across plain and navigable flows
