# `alert()`

Boxed alerts with icons

![demo](demo.gif)

## Run

```sh
npx tsx examples/alert/main.ts
```

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
