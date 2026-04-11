# What's New in Bijou 4.4.0

## Data Visualization Toolkit

Bijou now ships a data-visualization component family in `@flyingrobots/bijou`:

### sparkline()

Compact inline trend graph using Unicode block characters (▁▂▃▄▅▆▇█).
Drop it next to a label or inside a table cell for instant trend context.

```ts
import { sparkline } from '@flyingrobots/bijou';

sparkline([1, 5, 3, 8, 2, 7]);
// → '▁▅▃█▂▆'

sparkline([10, 20, 30, 40], { width: 8 });
// → '▁▁▃▃▅▅▇▇'  (values interpolated to fit width)
```

### brailleChartSurface()

High-density filled area chart using Unicode Braille characters. Each
terminal cell is a 2x4 sub-pixel grid, giving smooth curves in very
tight space.

```ts
import { brailleChartSurface } from '@flyingrobots/bijou';

const chart = brailleChartSurface(frameTimeHistory, {
  width: 28,
  height: 6,
  ctx,
});
```

### statsPanelSurface()

Titled bordered panel with aligned key-value metric rows. Each row
can include an optional inline sparkline after the value.

```ts
import { statsPanelSurface } from '@flyingrobots/bijou';

const panel = statsPanelSurface([
  { label: 'FPS', value: '60', sparkline: fpsHistory },
  { label: 'heap', value: '42.1 MB' },
], { title: 'Runtime', width: 30, ctx });
```

### perfOverlaySurface()

Prebuilt FPS + memory dashboard composing statsPanelSurface and
brailleChartSurface. Drop-in performance overlay for any app.

```ts
import { perfOverlaySurface } from '@flyingrobots/bijou';

const overlay = perfOverlaySurface({
  fps: 60,
  frameTimeMs: 16.7,
  frameTimeHistory: samples,
  width: 120,
  height: 40,
  heapUsedMB: 42.1,
}, { ctx });
```

## Performance: Zero-Alloc Framed App Render Loop

The framed app render loop now uses zero-allocation header and footer
painting via `paintStyledTextSurfaceWithBCSS` repainting in-place.
The pane scratch surface pool is scoped to the `createFramedApp`
closure instead of module-level state, resolving RE-010.

## Bench: New Scenarios and Dynamic Sizing

The benchmark harness gains two new scenarios:

- **flame** — doom fire effect with full-screen palette interpolation
  (~2.6 ms/frame)
- **component-app** — realistic TUI using real bijou components
  (boxSurface, tableSurface, alertSurface, etc., ~564 us/frame)

All scenarios now support dynamic sizing via an optional `columns` /
`rows` argument to `setup()`. The soak runner has been rewritten on
`createFramedApp` with a perf overlay toggled by backtick.

## DOGFOOD: Data Visualization Stories

The DOGFOOD component gallery now covers the data-visualization family
with stories for all four new components, bringing the component-family
reference from 35 to 36 families at 100% documented coverage.

## Backlog Cleanup

- Resolved: RE-008, RE-007, RE-009, RE-010, RE-015
- Added: RE-021 (frame owns the pump — cool idea for next major)
- Removed: PLAN.md (redundant narrative wrapper)
