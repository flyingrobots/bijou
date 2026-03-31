# DX-003 — Rationalize Table APIs and Public Table Types

Legend: [DX — Developer Experience](/Users/james/git/bijou/docs/legends/DX-developer-experience.md)

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
