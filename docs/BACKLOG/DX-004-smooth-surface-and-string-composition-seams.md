# DX-004 — Smooth Surface and String Composition Seams

Legend: [DX — Developer Experience](/Users/james/git/bijou/docs/legends/DX-developer-experience.md)

## Idea

Reduce confusion at the boundary between string-oriented composition and `Surface`/layout-oriented composition.

## Why

Bijou currently exposes a real conceptual seam here, but the ergonomics are easy to trip over:

- some helpers return `Surface`
- some stack/layout helpers still expect strings
- `view()` requires `Surface | LayoutNode`, not string
- migration from older string-first patterns is easy to misunderstand

The issue is not only documentation. Some composition helpers may need better bridging or clearer contracts.

## Captured feedback

From `warp-ttd` TUI development:

- `badge()` returning `Surface` made `vstack()` composition awkward
- `surfaceToString(...)` was required in some places but forbidden in `view()`
- the `view()` return constraint is understandable but still easy to trip over during migration

## Likely scope

- audit string-land vs surface-land composition boundaries
- decide where bridging helpers should exist and where they should not
- improve the composition story for small surface-returning primitives
- tighten docs or error guidance where the seam is intentionally strict
