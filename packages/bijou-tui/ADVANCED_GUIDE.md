# Advanced Guide — @flyingrobots/bijou-tui

Use [GUIDE.md](./GUIDE.md) for the first app, common layout, and normal shell usage.

Use this guide when you are working on runtime engine internals, programmable pipeline behavior, or advanced input and view orchestration.

## Runtime Engine

The `@flyingrobots/bijou-tui` runtime engine provides low-level primitives for high-fidelity TUI ownership. These are used by `createFramedApp()` but are available for custom shell implementations.

### View Stacks
Manage a stack of views (root + overlays) with explicit push/pop/replace transitions:
```typescript
import { createRuntimeViewStack, pushRuntimeView, popRuntimeView } from '@flyingrobots/bijou-tui';
```

### Retained Layouts
Bijou caches layout trees and rect calculations to optimize input routing and rendering:
```typescript
import { createRuntimeRetainedLayouts, retainRuntimeLayout, invalidateRuntimeLayouts } from '@flyingrobots/bijou-tui';
```

Read [docs/strategy/layout-localization-pipeline.md](../../docs/strategy/layout-localization-pipeline.md)
alongside this section so retained-layout work does not get confused with the
runtime's separate localization handoff from author coordinates into a local
paint root.

### Input Routing
Deterministic event routing (keyboard and mouse) through the view stack and layout hierarchy:
```typescript
import { routeRuntimeInput, hitTestRuntimeLayout } from '@flyingrobots/bijou-tui';
```

## Programmable Pipeline

The render path is composed of five stages:
1. **Layout**: Resolve node dimensions and positions.
2. **Paint**: Rasterize components into surface buffers.
3. **Post-Process**: Apply global effects (e.g., shaders, grayscale).
4. **Diff**: Compute the minimal ANSI delta between front and back buffers.
5. **Output**: Write the diff buffer to the terminal.

For the specific `LayoutNode` handoff between localization and paint, use the
dedicated [layout localization pipeline note](../../docs/strategy/layout-localization-pipeline.md).

### Custom Middleware
Extend the pipeline via `options.configurePipeline` in `run()`:
```typescript
run(app, {
  configurePipeline: (p) => {
    p.use('PostProcess', grayscaleMiddleware());
  }
});
```

If you need frame breakdown data instead of another mutating middleware, hook
the built-in stage observer:

```typescript
import { getRenderStageTimings, run } from '@flyingrobots/bijou-tui';

run(app, {
  configurePipeline: (p) => {
    p.onStageComplete((stage, durationMs, state) => {
      console.log(stage, durationMs, getRenderStageTimings(state));
    });
  },
});
```

For the exact stage order, default runtime wiring, and `RenderState` contract,
use the dedicated [render pipeline guide](../../docs/guides/render-pipeline.md).

## Transition Shaders

Shaders provide per-cell control over page-to-page movement:
```typescript
import { createFramedApp, type TransitionShaderFn } from '@flyingrobots/bijou-tui';

const myShader: TransitionShaderFn = ({ progress, x, width, ctx }) => {
  // Return showNext, overrideCell, or overrideChar based on progress.
};
```

For canvas-style shader authoring, `@flyingrobots/bijou-tui` now re-exports the
core types that usually travel with the API:
```typescript
import { canvas, type ShaderFn, type Surface, type BijouContext } from '@flyingrobots/bijou-tui';

const wave: ShaderFn = ({ u, v, time }) => ({
  char: u + v + time > 1 ? 'X' : ' ',
});

function renderWave(_ctx: BijouContext): Surface {
  return canvas(24, 8, wave);
}
```

When `canvas()` runs in `quad`, `braille`, or `glyph` resolution, each terminal
cell samples multiple shader results for coverage. Non-space samples choose the
quadrant, Braille dots, or fitted cell glyph, while available foreground and
background RGB values are averaged across the sampled subpixels. That lets
shader code return the real material or image color per sample instead of
fixing collapsed cells with post-render color passes.

For tiny raytraced title screens or previews, use the raytrace shader kernel
for geometry and keep lighting local to the app:
```typescript
import { canvas, raytraceLookAtRay, raytraceNearestHit, type RaytraceShape } from '@flyingrobots/bijou-tui';

const shapes: readonly RaytraceShape[] = [
  { kind: 'sphere', center: [0, 0, 0], radius: 1 },
];

const preview = canvas(32, 12, ({ u, v }) => {
  const ray = raytraceLookAtRay({
    origin: [0, 0, 4],
    target: [0, 0, 0],
    screen: [(u * 2) - 1, (v * -2) + 1],
  });
  const hit = raytraceNearestHit(ray, shapes);
  return hit ? { char: '*', fg: '#ffffff' } : ' ';
});
```

When Braille is too textured for a logo or icon, fit sampled 2x4 coverage to a
regular glyph directly from `canvas()`:
```typescript
const logo = canvas(24, 6, shader, { resolution: 'glyph' });
const asciiLogo = canvas(24, 6, shader, { resolution: 'glyph', glyphFit: { mode: 'ascii' } });
```

The standalone helper remains available for custom reducers:
```typescript
import { fitCellGlyph } from '@flyingrobots/bijou-tui';

const glyph = fitCellGlyph([1, 1, 1, 1, 0, 0, 0, 0]); // "▀"
const asciiGlyph = fitCellGlyph([1, 1, 1, 1, 0, 0, 0, 0], { mode: 'ascii' });
```

## Advanced Logic

- **Event Bus Middleware**: Intercept or transform every message in the system.
- **Command Capabilities**: Access the system clock and pulse from within `Cmd`.
- **Worker Runtime Seams**: Map main-thread input to off-thread logic.

## Motion Keys

`motion({ key }, ...)` only works when `key` is stable across renders for the
same conceptual thing. Do not use shifting list indices or other ephemeral
values here.

The runtime now emits a development warning when one set of motion keys appears
on the same frame that a different set disappears. Treat that as a strong signal
that your component identity is unstable and the reconciler is being forced to
start new animations instead of continuing existing ones.

## Layout Inspector Overlay

`layoutInspectorOverlay()` composites development-only geometry over an existing
surface. It accepts either Bijou's native `{ row, col, width, height }` rects or
debug-friendly `{ x, y, width, height }` rects, clips borders to the target
surface, and prefixes focused region labels with `*`.

```typescript
import {
  layoutInspectorOverlay,
  layoutInspectorText,
} from '@flyingrobots/bijou-tui';

const overlay = layoutInspectorOverlay(frame, [
  {
    id: 'editor',
    role: 'pane',
    rect: { row: 1, col: 2, width: 40, height: 12 },
    clip: { row: 2, col: 2, width: 40, height: 10 },
    scroll: { x: 0, y: 12 },
    focused: true,
    layer: 3,
  },
]);

const report = layoutInspectorText([
  { id: 'editor', rect: { x: 2, y: 1, width: 40, height: 12 }, focused: true },
]);
```

Use the overlay when pane bounds, clipping, focus ownership, or z-layering need
visual inspection. Use the text report in tests and logs where screenshot
inspection would hide the actual geometry facts.

## Surface Budget Warnings

`evaluateSurfaceBudget()` checks a rendered `Surface` and optional pipeline
timings against explicit thresholds. It is pure and returns stable warning
objects, so tests can assert budget behavior without starting the runtime.

```typescript
import { evaluateSurfaceBudget, run } from '@flyingrobots/bijou-tui';

const warnings = evaluateSurfaceBudget({
  label: 'preview',
  surface,
  timings,
  thresholds: {
    maxArea: 4000,
    maxStyledCells: 1200,
    maxFrameDurationMs: 16,
    maxStageDurationMs: { Paint: 8, Diff: 4 },
  },
});
```

Interactive apps can also opt into runtime warnings:

```typescript
await run(app, {
  ctx,
  surfaceBudget: { maxArea: 4000, maxFrameDurationMs: 16 },
});
```

Runtime warnings are non-fatal and deduplicated by message. Apps that implement
`routeRuntimeIssue()` receive budget violations as `level: 'warning'` and
`source: 'runtime'`; apps that do not opt in stay silent.

## Surface Diff Viewer

`diffSurfaces()` compares two `Surface` objects cell by cell and keeps character
changes separate from style-only changes. That matters for terminal regressions
where text snapshots look correct but color, modifiers, or opacity changed.

```typescript
import { diffSurfaces, surfaceDiffSurface, surfaceDiffText } from '@flyingrobots/bijou-tui';

const diff = diffSurfaces(before, after);
const report = surfaceDiffText(before, after);
const overlay = surfaceDiffSurface(before, after, { mode: 'overlay' });
```

Use `surfaceDiffText()` in failing tests and logs. Use
`surfaceDiffSurface(..., { mode: 'side-by-side' })` when you want a compact
viewer surface, or `mode: 'overlay'` when you want changed cells marked on the
after frame.

## Crash Surfaces

Interactive `run(app, { ctx })` now keeps fatal `update()` and `view()` errors
on-screen inside the alt screen long enough to inspect them.

The runtime crash surface shows:

- the failing phase (`update`, `render`, or startup resize)
- the error and stack
- the last stable model snapshot when it can be serialized
- an explicit `Press Enter to exit.` prompt

This is a developer-facing post-mortem path, not a recovery system. The runtime
still rethrows the original failure after the user dismisses the surface.

## Framed Shell Layer Projection

`createFramedApp()` now has a stable seam for page-owned layer metadata and
agent-facing control introspection.

Use `FramePage.layers(model)` when a page needs to publish workspace or
page-modal metadata to the shell:

```typescript
import { createFramedApp, createKeyMap, type FramePage } from '@flyingrobots/bijou-tui';

const page: FramePage<Model, Msg> = {
  id: 'home',
  title: 'Home',
  init: () => [initialModel, []],
  update: (msg, model) => [model, []],
  layout: (model) => model.layout,
  layers: (model) => ({
    workspace: {
      hintSource: 'Workspace custom hint',
    },
    'page-modal': model.modalOpen
      ? {
          title: 'Inspector',
          hintSource: 'Modal custom hint',
          helpSource: createKeyMap<Msg>().bind('enter', 'Apply modal action', { type: 'apply' }),
        }
      : undefined,
  }),
};
```

Use `projectFrameControls()` when tooling or custom shell code needs the same
control ownership that footer/help surfaces use:

```typescript
import { projectFrameControls } from '@flyingrobots/bijou-tui';

const projection = projectFrameControls(frameModel, {
  pageModalOpen: true,
  layers: resolvedLayerMetadata,
});

projection.activeLayer;       // topmost visible layer object
projection.underlyingLayer;   // layer beneath help/search/etc when present
projection.footerHintSource;  // what the footer should promise right now
projection.helpSource;        // what the help overlay should explain right now
```

Keep this boundary narrow:
- pages own `workspace` and `page-modal` metadata
- pages may emit transient shell notifications via `notify(...)`, but the frame still owns notification state/history
- the frame still owns shell layers like settings, help, notifications, and quit confirm
- agents should inspect `projectFrameControls()` instead of reverse-engineering rendered chrome

---
**The runtime engine's primary goal is deterministic, high-fidelity TUI ownership with minimal allocation overhead.**
