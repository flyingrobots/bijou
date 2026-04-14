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
