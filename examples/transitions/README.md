# Transitions

Demonstrates dynamic tab transition animations.

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
