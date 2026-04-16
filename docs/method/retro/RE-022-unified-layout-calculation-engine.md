---
title: RE-022 — Unified Layout Calculation Engine
lane: retro
legend: RE
---

# RE-022 — Unified Layout Calculation Engine

## Disposition

Completed on `release/v4.5.0`. Pure split/grid geometry now lives in
`@flyingrobots/bijou` under `packages/bijou/src/core/layout/geometry.ts`,
with shared `solveGridRects()`, `solveSplitPaneRects()`, and
`solveSplitAxisSizes()` utilities plus foundation tests. The `bijou-tui`
`grid` and `split-pane` helpers now delegate to that shared engine instead of
maintaining their own duplicate geometry math, so the string and surface paths
resolve the same rectangles from the same source of truth.

## Original Proposal

Legend: [RE — Runtime Engine](../../legends/RE-runtime-engine.md)

## Idea

Currently, `@flyingrobots/bijou` provides string-first layout helpers like `splitPane()` and `grid()`, while `@flyingrobots/bijou-tui` provides surface-first companions like `splitPaneSurface()` and `gridSurface()`. The underlying geometry calculation (ratios, areas, gaps, and constraints) is often duplicated or implemented with slight variations across these packages.

Extract the "pure geometry" phase into a shared, zero-dependency engine in `@flyingrobots/bijou`. This engine should accept a layout definition and terminal dimensions, and return a set of resolved `LayoutRect`s. The string-first and surface-first renderers can then consume these rects, ensuring pixel-perfect parity between `rich`, `static`, `pipe`, and `accessible` modes.

## Why

1. **Parity**: A 0.4 split-pane ratio should resolve to the exact same column boundary regardless of whether we are rendering a string box or a TUI surface.
2. **Maintenance**: Bug fixes in the gap/constraint logic only need to happen in one place.
3. **Purity**: Geometry calculation is inherently pure and belongs in the foundation, not the interactive runtime.

## Effort

Medium — extract logic from existing helpers and move to a unified core utility with shared tests.
