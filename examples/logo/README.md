# `loadRandomLogo()`

Random ASCII brand logos in 3 sizes

## Run

```sh
npx tsx examples/logo/main.ts
```

## Code

```typescript
import { initDefaultContext } from '@flyingrobots/bijou-node';
import { loadRandomLogo, separator, box, headerBox } from '@flyingrobots/bijou';

const ctx = initDefaultContext();

const logo = loadRandomLogo({ size: 'medium' });
console.log(box(logo.ascii, { padding: { top: 1, bottom: 1, left: 2, right: 2 }, ctx }));
```

[← Examples](../README.md)
