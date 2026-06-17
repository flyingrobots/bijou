import type { DagNode, TreeNode, TimelineEvent } from '@flyingrobots/bijou';

export const SAMPLE_TREE: TreeNode[] = [
  {
    label: 'src',
    children: [
      { label: 'index.ts' },
      {
        label: 'components',
        children: [
          { label: 'box.ts' },
          { label: 'badge.ts' },
        ],
      },
    ],
  },
  { label: 'package.json' },
  { label: 'tsconfig.json' },
];

export const SAMPLE_TIMELINE: TimelineEvent[] = [
  { label: 'Planning', status: 'success' },
  { label: 'Development', status: 'active' },
  { label: 'Review', status: 'warning' },
  { label: 'Release', status: 'muted' },
];

export const SAMPLE_DAG: DagNode[] = [
  { id: 'plan', label: 'Plan', edges: ['dev', 'design'], badge: 'done' },
  { id: 'design', label: 'Design', edges: ['dev'], badge: 'done' },
  { id: 'dev', label: 'Develop', edges: ['test'], badge: 'active' },
  { id: 'test', label: 'Test', edges: ['ship'], badge: 'pending' },
  { id: 'ship', label: 'Ship', badge: 'pending' },
];

// ---------------------------------------------------------------------------
// Display components
// ---------------------------------------------------------------------------
