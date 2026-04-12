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

### Custom Middleware
Extend the pipeline via `options.configurePipeline` in `run()`:
```typescript
run(app, {
  configurePipeline: (p) => {
    p.use('Post-Process', grayscaleMiddleware());
  }
});
```

## Transition Shaders

Shaders provide per-cell control over page-to-page movement:
```typescript
import { createFramedApp, type TransitionShaderFn } from '@flyingrobots/bijou-tui';

const myShader: TransitionShaderFn = ({ progress, x, width, ctx }) => {
  // Return showNext, overrideCell, or overrideChar based on progress.
};
```

## Advanced Logic

- **Event Bus Middleware**: Intercept or transform every message in the system.
- **Command Capabilities**: Access the system clock and pulse from within `Cmd`.
- **Worker Runtime Seams**: Map main-thread input to off-thread logic.

---
**The runtime engine's primary goal is deterministic, high-fidelity TUI ownership with minimal allocation overhead.**
