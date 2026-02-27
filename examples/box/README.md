# `box()`, `headerBox()`

Bordered containers and header boxes

![demo](demo.gif)

## Run

```sh
npx tsx examples/box/main.ts
```

## Code

```typescript
import { ctx } from '../_shared/setup.js';
import { box, headerBox, separator } from '@flyingrobots/bijou';

console.log(separator({ label: 'box', ctx }));
console.log();

console.log(box('A simple bordered box.', { ctx }));
console.log();

console.log(box('Custom padding adds breathing room.', {
  padding: { top: 1, bottom: 1, left: 3, right: 3 },
  ctx,
}));
console.log();

console.log(separator({ label: 'headerBox', ctx }));
console.log();

console.log(headerBox('Deploy', { detail: 'v1.2.3 → production', ctx }));
console.log();

console.log(headerBox('Database', { detail: 'postgresql://localhost:5432', ctx }));
console.log();

console.log(separator({ label: 'nested boxes', ctx }));
console.log();

const inner1 = box('Port: 3000', { ctx });
const inner2 = box('Port: 5432', { ctx });
console.log(box(inner1 + '\n' + inner2, { ctx }));
```

[← Examples](../README.md)
