# `breadcrumb()`

Navigation breadcrumb trails

![demo](demo.gif)

## Run

```sh
npx tsx examples/breadcrumb/main.ts
```

## Code

```typescript
import { ctx } from '../_shared/setup.js';
import { breadcrumb, separator } from '@flyingrobots/bijou';

console.log(separator({ label: 'navigation', ctx }));
console.log();

console.log(breadcrumb(['Home', 'Settings'], { ctx }));
console.log();

console.log(breadcrumb(['Home', 'Projects', 'bijou', 'src', 'components'], { ctx }));
console.log();

console.log(separator({ label: 'custom separator', ctx }));
console.log();

console.log(breadcrumb(['Workspace', 'Documents', 'Reports', '2026'], { separator: ' → ', ctx }));
console.log();

console.log(breadcrumb(['root', 'usr', 'local', 'bin'], { separator: '/', ctx }));
```

[← Examples](../README.md)
