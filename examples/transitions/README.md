# Transitions

Demonstrates dynamic tab transition animations.

Custom shaders in this example family should return surface-native override data:

- `showNext` to choose the base page cell
- `overrideChar` for a simple glyph override that keeps the base cell styling
- `overrideCell` for a fully styled replacement cell
- `overrideRole` as `'marker'` or `'decoration'` so combinators can preserve or discard the override correctly

## Run

```sh
npx tsx examples/transitions/main.ts
```

## Code

```typescript
import { createFramedApp } from '@flyingrobots/bijou-tui';

const app = createFramedApp({
  title: 'Bijou Transitions Demo',
  pages: [pageA, pageB],
  transitionDuration: 600,
  // Select the transition dynamically from the page model
  transitionOverride: (model) => model.selectedTransition,
});
```

[← Examples](../README.md)
