# `progressBar()`

Static progress bars at various states

![demo](demo.gif)

## Run

```sh
npx tsx examples/progress-static/main.ts
```

## Code

```typescript
import { ctx } from '../_shared/setup.js';
import { progressBar, separator } from '@flyingrobots/bijou';

console.log(separator({ label: 'progress bars', ctx }));
console.log();

for (const pct of [0, 25, 50, 75, 100]) {
  console.log(progressBar(pct, { width: 40, showPercent: true, ctx }));
}

console.log();
console.log(separator({ label: 'custom width', ctx }));
console.log();

console.log('Short: ', progressBar(60, { width: 20, ctx }));
console.log('Medium:', progressBar(60, { width: 40, ctx }));
console.log('Wide:  ', progressBar(60, { width: 60, ctx }));
```
