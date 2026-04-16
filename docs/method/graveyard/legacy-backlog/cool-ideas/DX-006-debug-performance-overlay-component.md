# DX-006 — Debug Performance Overlay Component

Legend: [DX — Developer Experience](../../legends/DX-developer-experience.md)

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

## Related

- RE-008 byte-packed surface representation (affects rendering perf)
- The perf gradient demo (`examples/perf-gradient`) as proof of concept
