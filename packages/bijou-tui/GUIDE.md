# Guide — @flyingrobots/bijou-tui

This guide covers the normal path for building and shipping a Bijou TUI app.

For shell doctrine, bytes-only runtime expectations, programmable pipeline internals, motion choreography, shaders, advanced inspectors, and proving surfaces like DOGFOOD and PTY smoke, use [ADVANCED_GUIDE.md](./ADVANCED_GUIDE.md).

## Building a TEA App

Every bijou-tui app defines three functions:

```typescript
interface App<Model, M> {
  init(): [Model, Cmd<M>[]];                            // initial state + startup commands
  update(msg: KeyMsg | ResizeMsg | MouseMsg | PulseMsg | M, model: Model): [Model, Cmd<M>[]];  // state transition
  view(model: Model): Surface | LayoutNode;             // render to structured output
}
```

The runtime calls `init()` once, then loops: render → wait for event → `update()` → render.

## Minimal Example

```typescript
import { run, quit, type App } from '@flyingrobots/bijou-tui';
import { stringToSurface } from '@flyingrobots/bijou';
import { initDefaultContext } from '@flyingrobots/bijou-node';

initDefaultContext();

const app: App<{ text: string }, never> = {
  init: () => [{ text: 'Hello!' }, []],
  update: (msg, model) => {
    if (msg.type === 'key' && msg.key === 'q') return [model, [quit()]];
    return [model, []];
  },
  view: (model) => stringToSurface(model.text, model.text.length, 1),
};

run(app);
```

### Command Contract

`Cmd<M>` may return:
- a final message
- `QUIT`
- a cleanup handle or cleanup function for a long-lived effect
- `void`

## Fractal TEA (Sub-Apps)

Compose complex UIs by nesting smaller apps using `mount()`, `initSubApp()`, and `updateSubApp()`.

```typescript
import { mount, initSubApp, updateSubApp, type App } from '@flyingrobots/bijou-tui';

// 1. Parent update
const [nextChildModel, childCmds] = updateSubApp(childApp, childMsg, model.child, {
  onMsg: (m) => ({ type: 'childMsg', m }),
});

// 2. Parent view
const [childView, childCmds] = mount(childApp, {
  model: model.child,
  onMsg: (m) => ({ type: 'childMsg', m }),
});
```

## Layout Primitives

Bijou-TUI uses declarative layout. Components return either a `Surface` (fixed-size) or a `LayoutNode` (flexible).

### Flexbox
- **`flex()`**: The primary layout engine. Use `basis` for fixed sizes and `flex` for proportional scaling.
- **`vstackSurface()` / `hstackSurface()`**: Quick vertical/horizontal stacking for surfaces.

### Viewport & Scrolling
Use `viewportSurface()` to mask and scroll content:
```typescript
viewportSurface({ width: 60, height: 20, content: largeSurface, scrollY: 10 });
```

### Overlays
- **`modal()`**: Centered dialog that blocks background interactions.
- **`toast()`**: Transient notification anchored to a screen edge.
- **`drawer()`**: Supplemental side-panel (left, right, top, bottom).
- **`compositeSurface()`**: Painters-algorithm compositor for background and overlays.

## Animation

### Spring Physics
Natural, responsive motion without fixed durations.
```typescript
animate({ from: 0, to: 100, spring: 'wobbly', onFrame: (v) => ({ type: 'move', x: v }) });
```

### Tween
Predictable, duration-based transitions.
```typescript
animate({ type: 'tween', from: 0, to: 1, duration: 500, onFrame: (v) => ({ type: 'fade', opacity: v }) });
```

### Timeline
Coordinated sequences and parallel choreography.
```typescript
timeline()
  .add('slide', { from: -100, to: 0, duration: 300 })
  .add('fade', { from: 0, to: 1, duration: 200 }, '<') // parallel with slide
  .build();
```

## Shell: App Frame

`createFramedApp()` provides a batteries-included shell:
- Tab and page switching.
- Pane focus and scroll isolation.
- Built-in help (`?`) and command-palette (`Ctrl+P`).
- Notification review and shell-owned settings.

## Interaction

- **`KeyMap`**: Declarative keyboard bindings with group-aware help generation.
- **`InputStack`**: Layered input routing for modals and overlays.
- **`MouseMsg`**: Support for SGR mouse reporting (click, drag, scroll).

---
**The runtime view contract requires either a `Surface` or a `LayoutNode`. Raw strings must be converted explicitly.**
