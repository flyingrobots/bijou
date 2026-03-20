# `alert()`

In-flow status block that stays with the surrounding content

![demo](demo.gif)

## Run

```sh
npx tsx examples/alert/main.ts
```

## Use this when

- the message should remain part of the page or document flow
- the user should still see the status while reading or editing nearby content

## Choose something else when

- choose `badge()` for compact inline status
- choose `toast()` for a single transient overlay
- choose `notifications` for stacking, actions, routing, or history

## Code

```typescript
import { ctx } from '../_shared/setup.js';
import { alert } from '@flyingrobots/bijou';

console.log(alert('Deployment completed successfully!', { variant: 'success', ctx }));
console.log();
console.log(alert('Build failed: 3 type errors in src/index.ts', { variant: 'error', ctx }));
console.log();
console.log(alert('chalk@4 is deprecated. Upgrade to chalk@5 for ESM support.', { variant: 'warning', ctx }));
console.log();
console.log(alert('A new version of bijou is available: 0.3.0', { variant: 'info', ctx }));
```

[← Examples](../README.md)
