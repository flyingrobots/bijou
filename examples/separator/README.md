# `separator()`

Horizontal dividers with labels

![demo](demo.gif)

## Run

```sh
npx tsx examples/separator/main.ts
```

## Code

```typescript
import { ctx } from '../_shared/setup.js';
import { separator, box } from '@flyingrobots/bijou';

console.log(separator({ ctx }));
console.log();

console.log(separator({ label: 'Configuration', ctx }));
console.log();

console.log(separator({ label: 'Left aligned', width: 40, ctx }));
console.log();

console.log(separator({ label: 'Full width', ctx }));
console.log();

// Separators as section dividers
console.log(box('Section one content', { ctx }));
console.log(separator({ label: 'Next', ctx }));
console.log(box('Section two content', { ctx }));
```
