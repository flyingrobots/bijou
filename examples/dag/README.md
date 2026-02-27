# `dag()`

Directed acyclic graph with status badges

![demo](demo.gif)

## Run

```sh
npx tsx examples/dag/main.ts
```

## Code

```typescript
import { ctx } from '../_shared/setup.js';
import { dag, separator } from '@flyingrobots/bijou';
import type { DagNode } from '@flyingrobots/bijou';

const nodes: DagNode[] = [
  { id: 'bridge', label: 'Theme bridge', edges: ['static', 'tea'], badge: 'DONE', token: { hex: '#a6e3a1' } },
  { id: 'static', label: 'Static renderers', edges: ['roadmap', 'lineage'], badge: 'DONE', token: { hex: '#a6e3a1' } },
  { id: 'tea', label: 'TEA app shell', edges: ['roadmap', 'lineage', 'input', 'watch'], badge: 'WIP', token: { hex: '#f9e2af' } },
  { id: 'roadmap', label: 'RoadmapView', edges: ['cleanup'], badge: '4h', token: { hex: '#89b4fa' } },
  { id: 'lineage', label: 'LineageView', edges: ['cleanup'], badge: '3h', token: { hex: '#89b4fa' } },
  { id: 'input', label: 'Input system', edges: ['cleanup'], badge: 'BLOCKED', token: { hex: '#f38ba8' } },
  { id: 'watch', label: 'graph.watch()', edges: ['cleanup'], badge: '2h', token: { hex: '#89b4fa' } },
  { id: 'cleanup', label: 'Cleanup', badge: '1h' },
];

console.log(separator({ label: 'dag — full graph', ctx }));
console.log();
console.log(dag(nodes, { ctx }));
console.log();

console.log(separator({ label: 'dag — critical path highlighted', ctx }));
console.log();
console.log(dag(nodes, {
  highlightPath: ['bridge', 'tea', 'input', 'cleanup'],
  highlightToken: { hex: '#f38ba8' },
  ctx,
}));
console.log();
```
