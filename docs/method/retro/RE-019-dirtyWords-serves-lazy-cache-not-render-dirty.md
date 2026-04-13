---
title: RE-019 — Surface `dirtyWords` Bitmap Serves The Wrong Master
lane: retro
---

# RE-019 — Surface `dirtyWords` Bitmap Serves The Wrong Master

## Disposition

Fixed earlier in the runtime engine: `PackedSurface` now carries distinct `dirtyWords` and `renderDirtyWords` responsibilities, and render dirtiness is tracked separately from lazy decode state in `packages/bijou/src/ports/surface.ts`. This is no longer an active bad-code item.

## Original Proposal

Legend: [RE — Runtime Engine](../legends/RE-runtime-engine.md)

## Problem

`packages/bijou/src/ports/surface.ts:456` declares a per-cell
dirty bitmap:

```ts
const dirtyWords = new Uint32Array(Math.ceil(size / 32));
```

It is set on every `set()` and `setRGB()` call (via `markDirty`)
and used by `ensureClean()` in `get()` to lazily re-decode the
`Cell` object from the packed buffer when the buffer has been
mutated since the last `get()`.

The name "dirty" strongly suggests this tracks "cells modified
since last render" — which is exactly what the renderer would
want for efficient diffing. But it does not. It tracks "cells
where the lazily-cached `Cell` object is stale relative to the
buffer". Two different meanings, one shared name, one shared data
structure.

## Why This Is Bad

1. **Misleading name.** Anyone reading `dirtyWords` will assume
   it's for render tracking, not lazy cache invalidation. The
   RE-017 audit caught exactly this confusion — the renderer does
   not use the bitmap, even though the data is exactly what it
   needs.

2. **Serves a vestigial cache.** The `cells: Cell[]` array that
   the bitmap protects is a holdover from the pre-RE-008 cell-based
   surface API. In the byte-packed world, the buffer is the source
   of truth; the `Cell[]` projection exists only to support legacy
   `surface.get()` callers and the legacy `renderDiffCells` path.
   Most hot-path code now uses `setRGB` and byte comparisons, which
   bypass the cache entirely. The bitmap is protecting a cache
   that is increasingly irrelevant.

3. **Blocks the render-dirty optimization.** Task II-1 in RE-017
   wants to reuse this exact bitmap as the render-dirty signal
   ("which cells were painted this frame, skip the rest on the
   diff scan"). Reusing the existing bitmap conflicts with its
   current lazy-cache purpose — we'd have to clear it at end of
   render, but `get()` would then re-decode unnecessarily on the
   next frame.

## Fix Direction

Two options, either works:

1. **Drop the Cell[] projection from the packed hot path.** Make
   `get()` decode on demand from the buffer every time, with no
   cache. Then the `dirtyWords` bitmap is freed up to mean
   "cells modified since last render". `renderDiffPacked` walks
   set bits. `markAllClean()` is called at end of render. Clean
   and consistent.

2. **Split into two bitmaps.** `cacheDirtyWords` for the lazy
   `Cell[]` invalidation (current behavior) and `renderDirtyWords`
   for the render-dirty tracking (new behavior). More memory, but
   preserves the `Cell[]` cache for any callers that still benefit
   from it.

Option 1 is simpler and matches the direction RE-017 is going.
Before picking, we should measure how often `get()` is actually
called in hot paths — if it's rare, the lazy cache is buying
nothing and should be removed. If it's common, we need Option 2
or a different solution.

## Evidence

- Current bitmap definition + usage:
  `packages/bijou/src/ports/surface.ts:456-491`, `514-540`.
- Render path does not consult it:
  `packages/bijou/src/core/render/differ.ts:401` (`renderDiffPacked`
  walks all cells every frame with byte comparison; no bitmap
  check).
- Task II-1 in `docs/perf/RE-017-byte-pipeline.md` proposes to
  repurpose it for render-dirty tracking.

## Tests To Add

- Once repurposed: `renderDiffPacked` should visit zero cells on
  a frame where `nextSurface.clear()` was called and no `set()` /
  `setRGB` followed.
- Once repurposed: after a `set()` at (5, 3), the next
  `renderDiffPacked` call should visit (5, 3) and skip all other
  cells (assuming no other mutations).
- Regression test: `get(x, y)` after a `set(x, y)` still returns
  the updated cell (decode path still works without the cache).
