# `badge()`

Inline status badges in 7 variants

![demo](demo.gif)

## Run

```sh
npx tsx examples/badge/main.ts
```

## Code

```typescript
import { ctx } from '../_shared/setup.js';
import { separatorSurface } from '@flyingrobots/bijou';
import {
  badgeSurface,
  column,
  renderSurface,
  row,
  spacer,
} from '../_shared/example-surfaces.ts';

const output = column([
  separatorSurface({ label: 'badge variants', ctx }),
  spacer(1, 1),
  row([
    badgeSurface('SUCCESS', 'success', ctx),
    ' ',
    badgeSurface('ERROR', 'error', ctx),
    ' ',
    badgeSurface('WARNING', 'warning', ctx),
  ]),
  spacer(1, 1),
  row([
    'Server is ',
    badgeSurface('RUNNING', 'success', ctx),
    ' on port ',
    badgeSurface('3000', 'primary', ctx),
  ]),
]);

console.log(renderSurface(output, ctx));
```

[← Examples](../README.md)
