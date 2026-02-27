# `dagSlice()` + `dag()`

DAG slicing with ghost nodes at boundaries

![demo](demo.gif)

## Run

```sh
npx tsx examples/dag-fragment/main.ts
```

## Code

```typescript
import { ctx } from '../_shared/setup.js';
import { dag, dagSlice, separator } from '@flyingrobots/bijou';
import type { DagNode } from '@flyingrobots/bijou';

const nodes: DagNode[] = [
  { id: 'init', label: 'Project init', edges: ['core', 'cli'] },
  { id: 'core', label: 'Core engine', edges: ['parser', 'resolver', 'cache'] },
  { id: 'cli', label: 'CLI scaffold', edges: ['commands', 'config'] },
  { id: 'parser', label: 'Parser', edges: ['transform'] },
  { id: 'resolver', label: 'Resolver', edges: ['transform', 'graph'] },
  { id: 'cache', label: 'Cache layer', edges: ['graph'] },
  { id: 'commands', label: 'Commands', edges: ['output'] },
  { id: 'config', label: 'Config loader', edges: ['commands'] },
  { id: 'transform', label: 'Transform', edges: ['output'] },
  { id: 'graph', label: 'Dep graph', edges: ['output'] },
  { id: 'output', label: 'Output engine', edges: ['release'] },
  { id: 'release', label: 'Release', edges: ['docs'] },
  { id: 'docs', label: 'Docs' },
];

console.log(separator({ label: 'Full DAG (13 nodes)', ctx }));
console.log();
console.log(dag(nodes, { ctx }));
console.log();

console.log(separator({ label: 'dagSlice — ancestors of "output"', ctx }));
console.log();
const ancestors = dagSlice(nodes, 'output', { direction: 'ancestors' });
console.log(dag(ancestors, { ctx }));
console.log();

console.log(separator({ label: 'dagSlice — descendants of "core"', ctx }));
console.log();
const descendants = dagSlice(nodes, 'core', { direction: 'descendants' });
console.log(dag(descendants, { ctx }));
console.log();

console.log(separator({ label: 'dagSlice — 2-hop neighborhood of "resolver"', ctx }));
console.log();
const neighborhood = dagSlice(nodes, 'resolver', { direction: 'both', depth: 2 });
console.log(dag(neighborhood, { ctx }));
console.log();
```
