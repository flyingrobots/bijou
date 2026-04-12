# @flyingrobots/bijou-tui

The high-fidelity TEA runtime for Bijou.

`@flyingrobots/bijou-tui` provides the application loop, layout primitives, and physics-powered orchestration needed to build complex interactive terminal apps.

## Role

- **The Elm Architecture (TEA)**: A deterministic state-update-view loop for industrial-strength terminal software.
- **Fractal TEA**: Compose nested sub-apps with `initSubApp()`, `updateSubApp()`, and `mount()`.
- **Declarative Motion**: Interpolate layout changes smoothly with physics-based springs and tween animations.
- **Surface-First Pipeline**: Programmable rendering middleware for fragments, diffing, and shader-based transitions.

## Install

```bash
npm install @flyingrobots/bijou @flyingrobots/bijou-node @flyingrobots/bijou-tui
```

## Quick Start (Sub-App Composition)

```typescript
import { initDefaultContext } from '@flyingrobots/bijou-node';
import { run, mount, type App } from '@flyingrobots/bijou-tui';
import { createSurface } from '@flyingrobots/bijou';

initDefaultContext();

const childApp: App<{ count: number }, any> = {
  init: () => [{ count: 0 }, []],
  update: (msg, model) => [model, []],
  view: (model) => {
    const s = createSurface(20, 5);
    s.fill({ char: '.' });
    return s;
  }
};

const app: App<any, any> = {
  init: () => [{ left: { count: 0 }, right: { count: 0 } }, []],
  update: (msg, model) => [model, []],
  view: (model) => {
    const [left] = mount(childApp, { model: model.left, onMsg: m => m });
    const [right] = mount(childApp, { model: model.right, onMsg: m => m });
    
    const screen = createSurface(80, 24);
    screen.blit(left, 0, 0);
    screen.blit(right, 40, 0);
    return screen;
  }
};

run(app);
```

## Strategy: Choosing Component Families

Select the family based on the interaction semantic.

### Overlays and Interruption
- **`drawer()`**: Supplemental detail while maintaining main context.
- **`modal()`**: Required decision that blocks background activity.
- **`toast()`**: Transient notification for a single event.
- **`tooltip()`**: Micro-explanation for a local target.

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

## Documentation

- **[GUIDE.md](./GUIDE.md)**: Productive-fast path for building apps.
- **[ADVANCED_GUIDE.md](./ADVANCED_GUIDE.md)**: Shell doctrine, shaders, and motion internals.
- **[Design System](../../docs/design-system/README.md)**: Semantic guidance and patterns.

---
Built with 💎 by [FLYING ROBOTS](https://github.com/flyingrobots)
