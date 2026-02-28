# `dagStats()`

Graph statistics with cycle and duplicate detection

![demo](demo.gif)

## Run

```sh
npx tsx examples/dag-stats/main.ts
```

## Code

```typescript
import { ctx } from '../_shared/setup.js';
import { dagStats, dag, separator, table, box } from '@flyingrobots/bijou';
import type { DagNode } from '@flyingrobots/bijou';

const nodes: DagNode[] = [
  { id: 'bridge', label: 'Theme bridge', edges: ['static', 'tea'] },
  { id: 'static', label: 'Static renderers', edges: ['roadmap', 'lineage'] },
  { id: 'tea', label: 'TEA app shell', edges: ['roadmap', 'lineage', 'input', 'watch'] },
  { id: 'roadmap', label: 'RoadmapView', edges: ['cleanup'] },
  { id: 'lineage', label: 'LineageView', edges: ['cleanup'] },
  { id: 'input', label: 'Input system', edges: ['cleanup'] },
  { id: 'watch', label: 'graph.watch()', edges: ['cleanup'] },
  { id: 'cleanup', label: 'Cleanup' },
];

console.log(dag(nodes, { ctx }));

const stats = dagStats(nodes);

console.log(table({
  columns: [
    { header: 'Metric', width: 12 },
    { header: 'Value', width: 10 },
  ],
  rows: [
    ['Nodes', String(stats.nodes)],
    ['Edges', String(stats.edges)],
    ['Depth', String(stats.depth)],
    ['Width', String(stats.width)],
    ['Roots', String(stats.roots)],
    ['Leaves', String(stats.leaves)],
  ],
  ctx,
}));
```

[← Examples](../README.md)
