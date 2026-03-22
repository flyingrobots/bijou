# `table()`

Passive row/column comparison grid

![demo](demo.gif)

## Run

```sh
npx tsx examples/table/main.ts
```

## Use this when

- the main job is comparing the same attributes across many rows
- the output should still work cleanly as core string rendering

## Choose something else when

- choose `tableSurface()` when the same comparison should stay on the V3 `Surface` path
- choose `navigableTable()` when the user must actively traverse rows or cells
- choose `tree()` or `dag()` when hierarchy or dependency is the real structure

## Code

```typescript
import { ctx } from '../_shared/setup.js';
import { table, separator } from '@flyingrobots/bijou';

console.log(separator({ label: 'package dependencies', ctx }));
console.log();

console.log(table({
  columns: [
    { header: 'Package', width: 24 },
    { header: 'Version', width: 10 },
    { header: 'Size', width: 10 },
    { header: 'License', width: 10 },
  ],
  rows: [
    ['typescript', '5.9.3', '42.1 MB', 'Apache-2.0'],
    ['vitest', '4.0.18', '12.3 MB', 'MIT'],
    ['chalk', '5.6.2', '41 KB', 'MIT'],
    ['@types/node', '22.0.0', '3.8 MB', 'MIT'],
    ['tsx', '4.19.0', '8.2 MB', 'MIT'],
  ],
  ctx,
}));

console.log();
console.log(separator({ label: 'server status', ctx }));
console.log();

console.log(table({
  columns: [
    { header: 'Host' },
    { header: 'Region' },
    { header: 'Status' },
    { header: 'Uptime' },
    { header: 'Load' },
  ],
  rows: [
    ['us-east-1a', 'Virginia', 'healthy', '99.97%', '0.42'],
    ['eu-west-1b', 'Ireland', 'healthy', '99.99%', '0.31'],
    ['ap-south-1a', 'Mumbai', 'degraded', '98.21%', '0.87'],
  ],
  ctx,
}));
```

[← Examples](../README.md)
