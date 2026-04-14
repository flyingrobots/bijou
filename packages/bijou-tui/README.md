# @flyingrobots/bijou-tui

The high-fidelity TEA runtime for Bijou.

`@flyingrobots/bijou-tui` provides the application loop, layout primitives, and physics-powered orchestration needed to build complex interactive terminal apps.

## Role

- **The Elm Architecture (TEA)**: A deterministic state-update-view loop for industrial-strength terminal software.
- **Fractal TEA**: Compose nested sub-apps with `createSubAppAdapter()`, `initSubApp()`, `updateSubApp()`, and `mount()`.
- **Declarative Motion**: Interpolate layout changes smoothly with physics-based springs and tween animations.
- **Surface-First Pipeline**: Programmable rendering middleware for fragments, diffing, and shader-based transitions.

## Install

```bash
npm install @flyingrobots/bijou @flyingrobots/bijou-node @flyingrobots/bijou-tui
```

## Quick Start (Sub-App Composition)

```typescript
import { startApp } from '@flyingrobots/bijou-node';
import { createSubAppAdapter, mount, type App } from '@flyingrobots/bijou-tui';
import { createSurface } from '@flyingrobots/bijou';

type ChildMsg = { type: 'tick' };
type ParentModel = {
  left: { count: number };
  right: { count: number };
};
type ParentMsg = { type: 'left'; msg: ChildMsg } | { type: 'right'; msg: ChildMsg };

const childApp: App<{ count: number }, ChildMsg> = {
  init: () => [{ count: 0 }, []],
  update: (msg, model) => [model, []],
  view: (model) => {
    const s = createSurface(20, 5);
    s.fill({ char: '.' });
    return s;
  }
};

const mapLeft = createSubAppAdapter<ParentMsg, ChildMsg>({
  tick: (msg) => ({ type: 'left', msg }),
});

const mapRight = createSubAppAdapter<ParentMsg, ChildMsg>({
  tick: (msg) => ({ type: 'right', msg }),
});

const app: App<ParentModel, ParentMsg> = {
  init: () => [{ left: { count: 0 }, right: { count: 0 } }, []],
  update: (msg, model) => [model, []],
  view: (model) => {
    const [left] = mount(childApp, { model: model.left, onMsg: mapLeft });
    const [right] = mount(childApp, { model: model.right, onMsg: mapRight });
    
    const screen = createSurface(80, 24);
    screen.blit(left, 0, 0);
    screen.blit(right, 40, 0);
    return screen;
  }
};

await startApp(app);
```

For Node hosts, prefer `startApp()` for the first-app path. Reach for
`run(app, { ctx })` when the host owns context creation explicitly.

When you need to mix small string fragments with surface-returning primitives,
keep composition on the surface side: use `contentSurface()` directly or pass
strings into `vstackSurface()` / `hstackSurface()`. Raw strings are still not a
valid `view()` return type.

## Strategy: Choosing Component Families

Select the family based on the interaction semantic.

### Overlays and Interruption
- **`drawer()`**: Supplemental detail while maintaining main context.
- **`modal()`**: Required decision that blocks background activity.
- **`toast()`**: Transient notification for a single event.
- **`tooltip()`**: Micro-explanation for a local target.
- **`debugOverlay()`**: Development-only perf HUD composited onto any app surface.

### Collection Interaction
- **`navigableTable()`**: Keyboard-driven traversal and cell inspection.
- **`browsableList()`**: Description-led traversal in one dimension.
- **`commandPalette()`**: Action discovery and navigation.

### Shell and Workspace Layout
- **`createFramedApp()`**: Batteries-included workspace with tabs, panes, and help.
- **`splitPane()`**: Dynamic primary/secondary context comparison.
- **`grid()`**: Stable regions with simultaneous visibility.
- **`viewport()`**: The canonical scroll mask for rich composition.

## Animation

### Spring Physics
```typescript
import { animate, SPRING_PRESETS } from '@flyingrobots/bijou-tui';

const cmd = animate({
  from: 0,
  to: 100,
  spring: 'wobbly',
  onFrame: (v) => ({ type: 'scroll', y: v }),
});
```

### Timeline Orchestration
```typescript
import { timeline } from '@flyingrobots/bijou-tui';

const tl = timeline()
  .add('slideIn', { type: 'tween', from: -100, to: 0, duration: 300 })
  .label('settled')
  .add('bounce', { from: 0, to: 10, spring: 'wobbly' }, 'settled')
  .build();
```

## Post-Process Shaders

```typescript
import { run, surfaceShaderFilter, scanlines, vignette } from '@flyingrobots/bijou-tui';

await run(app, {
  configurePipeline(pipeline) {
    pipeline.use('PostProcess', surfaceShaderFilter(
      scanlines({ dimFactor: 0.82 }),
      vignette({ edgeFactor: 0.78 }),
    ));
  },
});
```

Use `surfaceShaderFilter(...)` to compose built-in post-process passes like
`scanlines()`, `flicker()`, `noise()`, and `vignette()` over the packed target
surface before diff/output.

## Testing

Use `testRuntime()` when you want an inspectable harness instead of a
one-shot script result:

```typescript
import { testRuntime } from '@flyingrobots/bijou-tui';

const harness = await testRuntime(app, { ctx });
await harness.press('q');

expect(harness.frame).toBeDefined();
expect(harness.messages).toHaveLength(1);
expect(harness.commands.every((record) => record.settled)).toBe(true);

await harness.teardown();
```

Keep `runScript()` for fixture-style interaction playback and GIF/demo
capture, and use `testRuntime()` when you need direct assertions on
snapshots, emitted messages, command outcomes, or cleanup disposal.

## Documentation

- **[GUIDE.md](./GUIDE.md)**: Productive-fast path for building apps.
- **[ADVANCED_GUIDE.md](./ADVANCED_GUIDE.md)**: Shell doctrine, shaders, and motion internals.
- **[Render Pipeline Guide](../../docs/guides/render-pipeline.md)**: Stage order, `RenderState`, and `configurePipeline()` truth.
- **[Design System](../../docs/design-system/README.md)**: Semantic guidance and patterns.

---
Built with 💎 by [FLYING ROBOTS](https://github.com/flyingrobots)
