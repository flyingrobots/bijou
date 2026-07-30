import type { DagNode } from '@flyingrobots/bijou';
import type {
  ReleaseSnapshot,
  ServiceHealth,
  WorkItem,
} from './canonical-app-contract.js';

export const RELEASES: readonly ReleaseSnapshot[] = [
  {
    id: 'v1.3.0',
    readiness: 78,
    failedChecks: 2,
    incidents: 1,
    eta: '2026-03-12 14:00 PST',
    window: 'DX shell + pane overlays',
  },
  {
    id: 'v1.3.1',
    readiness: 53,
    failedChecks: 5,
    incidents: 3,
    eta: '2026-03-19 11:00 PST',
    window: 'Command flow hardening',
  },
  {
    id: 'v1.4.0',
    readiness: 22,
    failedChecks: 9,
    incidents: 4,
    eta: '2026-04-09 10:00 PST',
    window: 'Transitions + docking experiments',
  },
];

export const SERVICE_HEALTH: readonly ServiceHealth[] = [
  { name: 'api-gateway', p95Ms: 148, errorRate: '0.2%', status: 'healthy' },
  { name: 'worker-sync', p95Ms: 212, errorRate: '0.8%', status: 'watch' },
  { name: 'scheduler', p95Ms: 331, errorRate: '1.7%', status: 'degraded' },
  { name: 'artifact-cdn', p95Ms: 119, errorRate: '0.1%', status: 'healthy' },
  { name: 'metrics-ingest', p95Ms: 266, errorRate: '0.9%', status: 'watch' },
];

export const INCIDENT_FEED: readonly string[] = [
  '13:04 build-queue backlog exceeded SLO by 21 percent (west-2)',
  '13:07 scheduler recovered after cache invalidation patch rollout',
  '13:10 flaky integration test in checkout flow retried successfully',
  '13:12 prod-eu canary paused: elevated 5xx in dependency edge',
  '13:15 release manager approved rollback guard policy update',
  '13:18 dag-pane smoke checks passed in static + interactive modes',
  '13:20 pipeline lock released for v1.3.0 candidate 4',
  '13:22 package index sync drift corrected on mirror-b',
  '13:26 cli docs lint failed: unresolved intra-doc anchor in GUIDE',
  '13:29 frame command palette merge test passed with 19 commands',
  '13:34 capture run complete: app shell overlays in all anchors',
  '13:37 preview rollout started in us-east and us-west rings',
  '13:40 smoke test failure triaged to stale env fixture in ci-runner',
  '13:44 release notes generated for app-frame canonical showcase',
  '13:48 approval gate moved to ready after flaky suite quarantine',
  '13:51 rollback plan validated against latest infra change window',
  '13:55 issue backlog burn-down projected to zero by end-of-day',
  '13:58 merge queue drained, entering release candidate freeze state',
];

export const BACKLOG: readonly WorkItem[] = [
  {
    id: 'SHELL-101',
    title: 'Stabilize splitPane min constraints',
    owner: 'Avery',
    status: 'done',
  },
  {
    id: 'SHELL-102',
    title: 'Panel drawer attachment for nested grids',
    owner: 'Parker',
    status: 'doing',
  },
  {
    id: 'SHELL-103',
    title: 'Frame-level command palette routing',
    owner: 'Morgan',
    status: 'doing',
  },
  {
    id: 'SHELL-104',
    title: 'Scrollable select viewport in long lists',
    owner: 'Casey',
    status: 'todo',
  },
  {
    id: 'SHELL-105',
    title: 'Driver resize and custom msg script support',
    owner: 'Jordan',
    status: 'done',
  },
  {
    id: 'SHELL-106',
    title: 'Overlay bleed guard in pane-clamped regions',
    owner: 'Riley',
    status: 'blocked',
  },
  {
    id: 'SHELL-107',
    title: 'Docs pass for app-frame canonical patterns',
    owner: 'Quinn',
    status: 'todo',
  },
  {
    id: 'SHELL-108',
    title: 'Examples index and changelog sync sweep',
    owner: 'Taylor',
    status: 'doing',
  },
];

export const RUNBOOK: readonly string[] = [
  'Gate 1: unit + integration green across all workspace packages',
  'Gate 2: scripted frame harness replay with resize + custom msg',
  'Gate 3: release note diff reviewed by package maintainers',
  'Gate 4: 10 percent canary for 20 minutes with error budget guard',
  'Gate 5: full rollout, then monitor for 30 minutes before closeout',
];

export const DEPLOY_GRAPH: readonly DagNode[] = [
  { id: 'plan', label: 'Plan', edges: ['split', 'grid'], badge: 'done' },
  { id: 'split', label: 'splitPane()', edges: ['frame'], badge: 'done' },
  { id: 'grid', label: 'grid()', edges: ['frame'], badge: 'done' },
  {
    id: 'frame',
    label: 'createFramedApp()',
    edges: ['overlays', 'driver'],
    badge: 'active',
  },
  {
    id: 'overlays',
    label: 'Drawer regions',
    edges: ['release'],
    badge: 'active',
  },
  {
    id: 'driver',
    label: 'runScript() upgrade',
    edges: ['release'],
    badge: 'active',
  },
  { id: 'release', label: 'v1.3.0', badge: 'target' },
];
