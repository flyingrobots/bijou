# `timeline()`

Event timelines with status

![demo](demo.gif)

## Run

```sh
npx tsx examples/timeline/main.ts
```

## Code

```typescript
import { ctx } from '../_shared/setup.js';
import { timeline, separator } from '@flyingrobots/bijou';

console.log(separator({ label: 'release history', ctx }));
console.log();

console.log(timeline([
  { label: 'Project created', description: 'Initial commit', status: 'success' },
  { label: 'v0.1.0 released', description: 'Core components, forms, theme engine', status: 'success' },
  { label: 'Hexagonal refactor', description: 'Ports & adapters, zero-dep core', status: 'success' },
  { label: 'v0.2.0 released', description: 'TEA runtime, animations, layouts, keybindings', status: 'success' },
  { label: 'Examples catalog', description: '43 demos with VHS recordings', status: 'info' },
  { label: 'v0.3.0', description: 'DAG renderer, browsable list, textarea', status: 'warning' },
  { label: 'v1.0.0', description: 'Stable API, full test coverage', status: 'muted' },
], { ctx }));
```

[← Examples](../README.md)
