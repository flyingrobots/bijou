---
title: DX-005 — Polish Small Component and Import Ergonomics
lane: graveyard
legend: DX
---

# DX-005 — Polish Small Component and Import Ergonomics

## Disposition

Closed the remaining live DX-005 import seam by re-exporting BijouContext, Cell, and Surface from @flyingrobots/bijou-tui so canvas/shader authoring can stay on a single package-root import, added a type-level regression proving the single-import path works, and refreshed advanced docs accordingly. The older boxSurface title-padding subfinding is already satisfied by current repo truth: box() and boxSurface() both inject calm default title spacing internally rather than requiring manual spaces.

## Original Proposal

Legend: [DX — Developer Experience](../legends/DX-developer-experience.md)

## Idea

Sweep up the recurring small API papercuts that make Bijou feel fussier than it needs to.

## Why

None of these issues are individually existential, but together they create friction:

- box titles needing manual padding
- imports for one conceptual feature split across too many packages
- minor public-API rough edges that make common authoring flows feel less polished than the runtime really is

These are good backlog items precisely because users keep encountering them in real app work.

## Captured feedback

From `warp-ttd` TUI development:

- `boxSurface` title padding required manual spaces
- `canvas` / `ShaderFn` / `Surface` / `BijouContext` required three imports across package boundaries for one shader function

## Likely scope

- make boxed-title padding calmer by default or easier to opt into
- review re-export strategy for frequently paired shader/canvas types
- capture any other low-risk public API polish work that falls out while fixing the above
