import { ctx } from '../_shared/setup.js';
import { dagStats, dag, separator, table, box } from '@flyingrobots/bijou';
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

console.log(separator({ label: 'project planning dag', ctx }));
console.log();
console.log(dag(nodes, { ctx }));
console.log();

const stats = dagStats(nodes);

console.log(separator({ label: 'dagStats()', ctx }));
console.log();
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
console.log();

console.log(box(
  `Graph has ${stats.nodes} nodes across ${stats.depth} layers, widest layer has ${stats.width} nodes.`,
  { ctx },
));
