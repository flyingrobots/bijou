---
title: DX-006 — Debug Performance Overlay Component
lane: retro
legend: DX
---

# DX-006 — Debug Performance Overlay Component

## Disposition

Shipped a first-class `debugOverlay()` wrapper in `@flyingrobots/bijou-tui`. It composes the existing `perfOverlaySurface()` into any app surface with corner anchoring, optional background dimming, package exports, docs, and focused regression coverage, so the original perf-overlay component idea is now real repo truth rather than backlog intent.

## Original Proposal

Legend: [DX — Developer Experience](../legends/DX-developer-experience.md)

## Idea

Ship a first-class `debugOverlay()` component in `@flyingrobots/bijou-tui`
that any app can composite over its view to see real-time performance
instrumentation:

- FPS counter
- Frame time (with rolling graph)
- Update and view phase timing
- Heap used/total, RSS, external memory
- GC event count per sample window
- Terminal size and cell count
- Configurable position (corner anchoring)

## Why

The `examples/perf-gradient` stress test proved the concept: a
self-rendering stats overlay that tracks frame timing, memory, and GC
pressure is immediately useful for diagnosing performance issues. But
it's hardcoded into the demo. Every app that wants performance
visibility has to rebuild this from scratch.

## Shape

A composable surface component, not a shell/app-frame feature:

```typescript
import { debugOverlay } from '@flyingrobots/bijou-tui';

view(model) {
  const main = renderMyApp(model);
  return debugOverlay(main, { anchor: 'top-left' });
}
```

The overlay composites onto the app's surface. It reads performance
data from a shared timing context (similar to the mutable
`phaseTiming` object in the perf demo). Apps opt in by wrapping their
view — no framework integration required.

## Open questions

- Should the render pipeline expose phase timing natively (layout,
  paint, diff, output) so the overlay can show the full breakdown?
  Currently the pipeline isn't observable from the app side.
- Should the overlay be tree-shakeable (dev-only) or always available?
- Should it support custom metrics (app-defined counters/gauges)?

## Progress (2026-04-10)

The generic toolkit components are now shipped in `@flyingrobots/bijou`:
`sparkline`, `brailleChartSurface`, `statsPanelSurface`, `perfOverlaySurface`.
The soak runner uses `perfOverlaySurface` as a composited overlay with
backtick toggle. This proves the composable-surface approach works.

The remaining open question — "should the pipeline expose phase timing
natively?" — is addressed by [RE-021 Frame Owns the Pump](RE-021-frame-owns-the-pump.md).
If the frame owns the render loop, it naturally measures update/view/diff
phase timing and can feed it to a built-in perf overlay without any
special capability injection.

## Related

- [RE-021 Frame Owns the Pump](RE-021-frame-owns-the-pump.md) — enables native phase timing
- RE-008 byte-packed surface representation (affects rendering perf)
- The perf gradient demo (`examples/perf-gradient`) as proof of concept
- The soak runner perf overlay (this session) as integration proof
