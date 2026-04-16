# RE-013 — Memoize Workspace Layout Tree

Legend: [RE — Runtime Engine](../../legends/RE-runtime-engine.md)

## Idea

`buildWorkspaceLayoutTree()` creates new `SurfaceLayoutNode` objects
on every mouse event, even when the terminal size, page layout, and
tab count haven't changed. The tree structure only changes on resize,
tab switch, or pane layout change.

Memoize the tree against the inputs that determine its shape (cols,
rows, active page, pane layout hash). Return the cached tree when
inputs match. This eliminates ~20 object allocations per mouse event
for a typical 2-tab, 2-pane layout.

## Why

The perf-gradient demo showed that view() time is only ~2ms, but
every mouse event also runs `resolveFrameMouseRuntimeLayouts()` which
calls `buildWorkspaceLayoutTree()`. In a typical app with 60fps
rendering and mouse tracking, this is 60+ unnecessary tree builds
per second.

## Effort

Small — hash the inputs, compare, return cached tree.
