import type { BijouContext, DagNode } from '@flyingrobots/bijou';
import {
  badge,
  box,
  dag,
  kbd,
  progressBar,
  separator,
  table,
  timeline,
} from '@flyingrobots/bijou';
import {
  createFramedApp,
  createKeyMap,
  createSplitPaneState,
  drawer,
  modal,
  quit,
  statusBar,
  type App,
  type DrawerAnchor,
  type Overlay,
  type FrameLayoutNode,
  type FrameModel,
  type FramePage,
} from '@flyingrobots/bijou-tui';

const DRAWER_ANCHORS: readonly DrawerAnchor[] = ['right', 'left', 'bottom', 'top'];

interface ReleaseSnapshot {
  readonly id: string;
  readonly readiness: number;
  readonly failedChecks: number;
  readonly incidents: number;
  readonly eta: string;
  readonly window: string;
}

const RELEASES: readonly ReleaseSnapshot[] = [
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

interface ServiceHealth {
  readonly name: string;
  readonly p95Ms: number;
  readonly errorRate: string;
  readonly status: 'healthy' | 'watch' | 'degraded';
}

const SERVICE_HEALTH: readonly ServiceHealth[] = [
  { name: 'api-gateway', p95Ms: 148, errorRate: '0.2%', status: 'healthy' },
  { name: 'worker-sync', p95Ms: 212, errorRate: '0.8%', status: 'watch' },
  { name: 'scheduler', p95Ms: 331, errorRate: '1.7%', status: 'degraded' },
  { name: 'artifact-cdn', p95Ms: 119, errorRate: '0.1%', status: 'healthy' },
  { name: 'metrics-ingest', p95Ms: 266, errorRate: '0.9%', status: 'watch' },
];

const INCIDENT_FEED: readonly string[] = [
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

interface WorkItem {
  readonly id: string;
  readonly title: string;
  readonly owner: string;
  readonly status: 'todo' | 'doing' | 'blocked' | 'done';
}

const BACKLOG: readonly WorkItem[] = [
  { id: 'SHELL-101', title: 'Stabilize splitPane min constraints', owner: 'Avery', status: 'done' },
  { id: 'SHELL-102', title: 'Panel drawer attachment for nested grids', owner: 'Parker', status: 'doing' },
  { id: 'SHELL-103', title: 'Frame-level command palette routing', owner: 'Morgan', status: 'doing' },
  { id: 'SHELL-104', title: 'Scrollable select viewport in long lists', owner: 'Casey', status: 'todo' },
  { id: 'SHELL-105', title: 'Driver resize and custom msg script support', owner: 'Jordan', status: 'done' },
  { id: 'SHELL-106', title: 'Overlay bleed guard in pane-clamped regions', owner: 'Riley', status: 'blocked' },
  { id: 'SHELL-107', title: 'Docs pass for app-frame canonical patterns', owner: 'Quinn', status: 'todo' },
  { id: 'SHELL-108', title: 'Examples index and changelog sync sweep', owner: 'Taylor', status: 'doing' },
];

const RUNBOOK: readonly string[] = [
  'Gate 1: unit + integration green across all workspace packages',
  'Gate 2: scripted frame harness replay with resize + custom msg',
  'Gate 3: release note diff reviewed by package maintainers',
  'Gate 4: 10 percent canary for 20 minutes with error budget guard',
  'Gate 5: full rollout, then monitor for 30 minutes before closeout',
];

const DEPLOY_GRAPH: readonly DagNode[] = [
  { id: 'plan', label: 'Plan', edges: ['split', 'grid'], badge: 'done' },
  { id: 'split', label: 'splitPane()', edges: ['frame'], badge: 'done' },
  { id: 'grid', label: 'grid()', edges: ['frame'], badge: 'done' },
  { id: 'frame', label: 'createFramedApp()', edges: ['overlays', 'driver'], badge: 'active' },
  { id: 'overlays', label: 'Drawer regions', edges: ['release'], badge: 'active' },
  { id: 'driver', label: 'runScript() upgrade', edges: ['release'], badge: 'active' },
  { id: 'release', label: 'v1.3.0', badge: 'target' },
];

interface WorkbenchPageModel {
  readonly releaseIndex: number;
  readonly incidentIndex: number;
  readonly drawerOpen: boolean;
  readonly drawerAnchor: DrawerAnchor;
  readonly drawerTargetIndex: number;
  readonly quitConfirmOpen: boolean;
}

const INITIAL_PAGE_MODEL: WorkbenchPageModel = {
  releaseIndex: 0,
  incidentIndex: 0,
  drawerOpen: false,
  drawerAnchor: 'right',
  drawerTargetIndex: 0,
  quitConfirmOpen: false,
};

type WorkbenchMsg =
  | { type: 'request-quit' }
  | { type: 'confirm-quit' }
  | { type: 'escape' }
  | { type: 'force-quit' }
  | { type: 'toggle-drawer' }
  | { type: 'cycle-drawer-anchor' }
  | { type: 'cycle-drawer-target' }
  | { type: 'next-release' }
  | { type: 'prev-release' }
  | { type: 'next-incident' }
  | { type: 'prev-incident' };

const OPS_PANES = ['ops-summary', 'ops-health', 'ops-events'] as const;
const BOARD_PANES = ['board-lanes', 'board-ticket', 'board-runbook'] as const;
const GRAPH_PANES = ['graph-dag', 'graph-timeline', 'graph-notes'] as const;

const PANE_IDS_BY_PAGE: Readonly<Record<string, readonly string[]>> = {
  ops: OPS_PANES,
  board: BOARD_PANES,
  graph: GRAPH_PANES,
};

function clampIndex(index: number, total: number): number {
  if (total <= 0) return 0;
  const normalized = index % total;
  return normalized < 0 ? normalized + total : normalized;
}

function nextAnchor(anchor: DrawerAnchor): DrawerAnchor {
  const idx = DRAWER_ANCHORS.indexOf(anchor);
  return DRAWER_ANCHORS[(idx + 1) % DRAWER_ANCHORS.length]!;
}

function statusBadge(status: WorkItem['status'], ctx: BijouContext): string {
  if (status === 'done') return badge('done', { variant: 'success', ctx });
  if (status === 'doing') return badge('doing', { variant: 'info', ctx });
  if (status === 'blocked') return badge('blocked', { variant: 'error', ctx });
  return badge('todo', { variant: 'warning', ctx });
}

function serviceBadge(status: ServiceHealth['status'], ctx: BijouContext): string {
  if (status === 'healthy') return badge('healthy', { variant: 'success', ctx });
  if (status === 'watch') return badge('watch', { variant: 'warning', ctx });
  return badge('degraded', { variant: 'error', ctx });
}

function toFixedHeight(lines: readonly string[], maxInnerHeight: number): string[] {
  if (maxInnerHeight <= 0) return [];
  const out = [...lines].slice(0, maxInnerHeight);
  while (out.length < maxInnerHeight) out.push('');
  return out;
}

function renderOpsSummary(width: number, height: number, model: WorkbenchPageModel, ctx: BijouContext): string {
  const release = RELEASES[clampIndex(model.releaseIndex, RELEASES.length)]!;
  const trackWidth = Math.max(8, Math.min(34, width - 12));
  const healthVariant = release.readiness >= 75 ? 'success' : release.readiness >= 45 ? 'warning' : 'error';
  const drawerState = model.drawerOpen ? 'open' : 'closed';

  const lines = [
    `Active train ${badge(release.id, { variant: 'primary', ctx })}`,
    `Window: ${release.window}`,
    `ETA: ${release.eta}`,
    `${badge(`${release.readiness}% ready`, { variant: healthVariant, ctx })} checks:${release.failedChecks} incidents:${release.incidents}`,
    progressBar(release.readiness, { width: trackWidth, ctx }),
    `Inspector drawer: ${drawerState} (${model.drawerAnchor})`,
    `o toggle drawer, a cycle anchor, y cycle target`,
    `ctrl+p or : palette, ? help`,
    `q or esc request quit, enter confirm`,
    statusBar({
      left: 'n/b release',
      center: 'drawer = panel inspector',
      right: `target #${model.drawerTargetIndex + 1}`,
      width: Math.max(10, width - 4),
      fillChar: ' ',
    }),
  ];
  const fixedLines = toFixedHeight(lines, Math.max(0, height - 2));

  return box(fixedLines.join('\n'), {
    width,
    bgToken: ctx.theme.theme.surface.secondary,
    borderToken: ctx.theme.theme.border.primary,
    ctx,
  });
}

function renderOpsHealth(width: number, ctx: BijouContext): string {
  const rows = SERVICE_HEALTH.map((service) => [
    service.name,
    `${service.p95Ms}ms`,
    service.errorRate,
    serviceBadge(service.status, ctx),
  ]);

  return box([
    separator({ label: 'Service Health', width: Math.max(8, width - 4), ctx }),
    table({
      columns: [
        { header: 'service', width: 14 },
        { header: 'p95', width: 8 },
        { header: 'error', width: 8 },
        { header: 'status', width: 10 },
      ],
      rows,
      ctx,
    }),
    '',
    'Use frame scroll keys (j/k/d/u/g/G) per focused pane.',
  ].join('\n'), {
    width,
    ctx,
  });
}

function renderIncidentFeed(width: number, model: WorkbenchPageModel, ctx: BijouContext): string {
  const selected = clampIndex(model.incidentIndex, INCIDENT_FEED.length);
  const lines = INCIDENT_FEED.map((line, idx) => {
    if (idx === selected) {
      return `${badge('focus', { variant: 'accent', ctx })} ${line}`;
    }
    return `        ${line}`;
  });

  const legend = statusBar({
    left: '., incident',
    center: 'tab/shift+tab pane focus',
    right: `${selected + 1}/${INCIDENT_FEED.length}`,
    width: Math.max(10, width - 4),
  });

  return box([
    separator({ label: 'Incident Feed', width: Math.max(8, width - 4), ctx }),
    ...lines,
    '',
    legend,
  ].join('\n'), {
    width,
    borderToken: ctx.theme.theme.border.muted,
    ctx,
  });
}

function renderBoardLanes(width: number, ctx: BijouContext): string {
  const todo = BACKLOG.filter((item) => item.status === 'todo');
  const doing = BACKLOG.filter((item) => item.status === 'doing');
  const blocked = BACKLOG.filter((item) => item.status === 'blocked');
  const done = BACKLOG.filter((item) => item.status === 'done');

  const laneLines = [
    `Todo    ${todo.length}`,
    ...todo.map((item) => `  ${item.id} ${item.title}`),
    '',
    `Doing   ${doing.length}`,
    ...doing.map((item) => `  ${item.id} ${item.title}`),
    '',
    `Blocked ${blocked.length}`,
    ...blocked.map((item) => `  ${item.id} ${item.title}`),
    '',
    `Done    ${done.length}`,
    ...done.map((item) => `  ${item.id} ${item.title}`),
  ];

  return box([
    separator({ label: 'Backlog Lanes', width: Math.max(8, width - 4), ctx }),
    ...laneLines,
  ].join('\n'), {
    width,
    ctx,
  });
}

function renderBoardTicket(width: number, model: WorkbenchPageModel, ctx: BijouContext): string {
  const selected = BACKLOG[clampIndex(model.incidentIndex, BACKLOG.length)]!;

  return box([
    separator({ label: `Ticket ${selected.id}`, width: Math.max(8, width - 4), ctx }),
    `${statusBadge(selected.status, ctx)} ${selected.title}`,
    `Owner: ${selected.owner}`,
    '',
    'Acceptance:',
    '- no overlay bleed outside panel bounds',
    '- pane-scoped drawers honor top/bottom anchors',
    '- command palette merges frame/global/page actions',
    '',
    'Debug command:',
    'pnpm test -- packages/bijou-tui/src/app-frame.test.ts',
    '',
    `Hints: ${kbd('tab', { ctx })} pane focus • ${kbd('h/l', { ctx })} horizontal scroll`,
  ].join('\n'), {
    width,
    borderToken: ctx.theme.theme.border.primary,
    ctx,
  });
}

function renderBoardRunbook(width: number, ctx: BijouContext): string {
  const events = RUNBOOK.map((step, idx) => ({
    label: step,
    status: idx < 2 ? 'success' : idx === 2 ? 'active' : 'muted',
  })) as Array<{ label: string; status: 'success' | 'active' | 'muted' }>;

  return box([
    separator({ label: 'Release Runbook', width: Math.max(8, width - 4), ctx }),
    timeline(events, { ctx }),
  ].join('\n'), {
    width,
    bgToken: ctx.theme.theme.surface.secondary,
    ctx,
  });
}

function renderGraphDag(width: number, model: WorkbenchPageModel, ctx: BijouContext): string {
  const release = RELEASES[clampIndex(model.releaseIndex, RELEASES.length)]!;
  const selectedId = model.incidentIndex % 2 === 0 ? 'frame' : 'overlays';

  const graph = dag(DEPLOY_GRAPH as DagNode[], {
    selectedId,
    highlightPath: ['plan', 'split', 'frame', 'overlays', 'release'],
    maxWidth: Math.max(50, width * 2),
    ctx,
  });

  return box([
    separator({ label: `Dependency Graph ${release.id}`, width: Math.max(8, width - 4), ctx }),
    graph,
    '',
    'Tip: focus this pane then use h/l to inspect long graph rows.',
  ].join('\n'), {
    width,
    ctx,
  });
}

function renderGraphTimeline(width: number, model: WorkbenchPageModel, ctx: BijouContext): string {
  const release = RELEASES[clampIndex(model.releaseIndex, RELEASES.length)]!;
  const events = [
    { label: 'API freeze', description: `${release.id} candidate locked`, status: 'success' as const },
    { label: 'Canary rollout', description: '10 percent ring active', status: 'active' as const },
    { label: 'Perf soak', description: 'Watch p95 + error budgets', status: 'warning' as const },
    { label: 'Global rollout', description: 'Awaiting gate approval', status: 'muted' as const },
  ];

  return box([
    separator({ label: 'Timeline', width: Math.max(8, width - 4), ctx }),
    timeline(events, { ctx }),
  ].join('\n'), {
    width,
    ctx,
  });
}

function renderGraphNotes(width: number, model: WorkbenchPageModel, ctx: BijouContext): string {
  const release = RELEASES[clampIndex(model.releaseIndex, RELEASES.length)]!;

  return box([
    separator({ label: 'Operator Notes', width: Math.max(8, width - 4), ctx }),
    `Release: ${release.id}`,
    `Window: ${release.window}`,
    '',
    'This canonical demo intentionally exercises:',
    '- appFrame tab chrome + help + command palette',
    '- grid and nested split layouts',
    '- panel-scoped drawers with all anchors',
    '- per-pane scroll isolation and horizontal overflow',
  ].join('\n'), {
    width,
    bgToken: ctx.theme.theme.surface.muted,
    ctx,
  });
}

function buildPage(
  id: string,
  title: string,
  paneIds: readonly string[],
  layout: (model: WorkbenchPageModel) => FrameLayoutNode,
): FramePage<WorkbenchPageModel, WorkbenchMsg> {
  return {
    id,
    title,
    init: () => [INITIAL_PAGE_MODEL, []],
    update(msg, model) {
      if (msg.type === 'force-quit') {
        return [model, [quit()]];
      }

      if (model.quitConfirmOpen) {
        switch (msg.type) {
          case 'confirm-quit':
            return [model, [quit()]];
          case 'escape':
            return [{ ...model, quitConfirmOpen: false }, []];
          case 'request-quit':
            return [model, []];
          default:
            return [model, []];
        }
      }

      switch (msg.type) {
        case 'request-quit':
        case 'escape':
          return [{ ...model, quitConfirmOpen: true }, []];
        case 'confirm-quit':
          return [model, []];
        case 'toggle-drawer':
          return [{ ...model, drawerOpen: !model.drawerOpen }, []];
        case 'cycle-drawer-anchor':
          return [{ ...model, drawerAnchor: nextAnchor(model.drawerAnchor) }, []];
        case 'cycle-drawer-target':
          return [{
            ...model,
            drawerTargetIndex: (model.drawerTargetIndex + 1) % (paneIds.length + 1),
          }, []];
        case 'next-release':
          return [{
            ...model,
            releaseIndex: clampIndex(model.releaseIndex + 1, RELEASES.length),
          }, []];
        case 'prev-release':
          return [{
            ...model,
            releaseIndex: clampIndex(model.releaseIndex - 1, RELEASES.length),
          }, []];
        case 'next-incident':
          return [{ ...model, incidentIndex: model.incidentIndex + 1 }, []];
        case 'prev-incident':
          return [{ ...model, incidentIndex: model.incidentIndex - 1 }, []];
      }
    },
    keyMap: createKeyMap<WorkbenchMsg>()
      .group('Workspace', (group) => group
        .bind('.', 'Next incident/ticket', { type: 'next-incident' })
        .bind(',', 'Previous incident/ticket', { type: 'prev-incident' }),
      ),
    layout,
  };
}

export function createCanonicalWorkbenchApp(
  ctx: BijouContext,
): App<FrameModel<WorkbenchPageModel>, WorkbenchMsg> {
  const pages: FramePage<WorkbenchPageModel, WorkbenchMsg>[] = [
    buildPage('ops', 'Ops', OPS_PANES, (model) => ({
      kind: 'grid',
      gridId: 'ops-grid',
      columns: [32, '1fr'],
      rows: [12, '1fr'],
      areas: [
        'ops-summary ops-summary',
        'ops-health ops-events',
      ],
      gap: 1,
      cells: {
        'ops-summary': {
          kind: 'pane',
          paneId: 'ops-summary',
          render: (width, height) => renderOpsSummary(width, height, model, ctx),
        },
        'ops-health': {
          kind: 'pane',
          paneId: 'ops-health',
          render: (width) => renderOpsHealth(width, ctx),
        },
        'ops-events': {
          kind: 'pane',
          paneId: 'ops-events',
          overflowX: 'scroll',
          render: (width) => renderIncidentFeed(width, model, ctx),
        },
      },
    })),
    buildPage('board', 'Board', BOARD_PANES, (model) => ({
      kind: 'split',
      splitId: 'board-root',
      direction: 'row',
      state: createSplitPaneState({ ratio: 0.34 }),
      minA: 24,
      minB: 32,
      paneA: {
        kind: 'pane',
        paneId: 'board-lanes',
        render: (width) => renderBoardLanes(width, ctx),
      },
      paneB: {
        kind: 'split',
        splitId: 'board-right',
        direction: 'column',
        state: createSplitPaneState({ ratio: 0.62 }),
        minA: 10,
        minB: 8,
        paneA: {
          kind: 'pane',
          paneId: 'board-ticket',
          overflowX: 'scroll',
          render: (width) => renderBoardTicket(width, model, ctx),
        },
        paneB: {
          kind: 'pane',
          paneId: 'board-runbook',
          render: (width) => renderBoardRunbook(width, ctx),
        },
      },
    })),
    buildPage('graph', 'Graph', GRAPH_PANES, (model) => ({
      kind: 'grid',
      gridId: 'graph-grid',
      columns: ['2fr', '1fr'],
      rows: ['1fr', 12],
      areas: [
        'graph-dag graph-timeline',
        'graph-dag graph-notes',
      ],
      gap: 1,
      cells: {
        'graph-dag': {
          kind: 'pane',
          paneId: 'graph-dag',
          overflowX: 'scroll',
          render: (width) => renderGraphDag(width, model, ctx),
        },
        'graph-timeline': {
          kind: 'pane',
          paneId: 'graph-timeline',
          render: (width) => renderGraphTimeline(width, model, ctx),
        },
        'graph-notes': {
          kind: 'pane',
          paneId: 'graph-notes',
          render: (width) => renderGraphNotes(width, model, ctx),
        },
      },
    })),
  ];

  return createFramedApp<WorkbenchPageModel, WorkbenchMsg>({
    title: 'Bijou Control Room',
    pages,
    defaultPageId: 'ops',
    enableCommandPalette: true,
    globalKeys: createKeyMap<WorkbenchMsg>()
      .group('Global', (group) => group
        .bind('q', 'Quit (confirm)', { type: 'request-quit' })
        .bind('escape', 'Cancel quit / Quit (confirm)', { type: 'escape' })
        .bind('enter', 'Confirm quit', { type: 'confirm-quit' })
        .bind('ctrl+c', 'Force quit', { type: 'force-quit' })
        .bind('o', 'Toggle drawer', { type: 'toggle-drawer' })
        .bind('a', 'Cycle drawer anchor', { type: 'cycle-drawer-anchor' })
        .bind('y', 'Cycle drawer target', { type: 'cycle-drawer-target' })
        .bind('n', 'Next release train', { type: 'next-release' })
        .bind('b', 'Previous release train', { type: 'prev-release' }),
      ),
    overlayFactory(frame) {
      const pageModel = frame.pageModel;
      const overlays: Overlay[] = [];

      if (pageModel.drawerOpen) {
        const paneIds = PANE_IDS_BY_PAGE[frame.activePageId] ?? [];
        const targetIndex = pageModel.drawerTargetIndex % (paneIds.length + 1);
        const targetPaneId = targetIndex < paneIds.length ? paneIds[targetIndex] : undefined;
        const region = targetPaneId != null ? frame.paneRects.get(targetPaneId) : undefined;

        const targetLabel = targetPaneId == null
          ? 'screen'
          : `${frame.activePageId}:${targetPaneId}`;

        const content = [
          `Target: ${targetLabel}`,
          `Anchor: ${pageModel.drawerAnchor}`,
          '',
          `Page: ${frame.activePageId}`,
          `Release: ${RELEASES[clampIndex(pageModel.releaseIndex, RELEASES.length)]!.id}`,
          '',
          `${kbd('o', { ctx })} toggle`,
          `${kbd('a', { ctx })} anchor`,
          `${kbd('y', { ctx })} target`,
        ].join('\n');

        const frameWidth = region?.width ?? frame.screenRect.width;
        const frameHeight = region?.height ?? frame.screenRect.height;
        const anchor = pageModel.drawerAnchor;

        if (anchor === 'left' || anchor === 'right') {
          overlays.push(drawer({
            anchor,
            width: Math.max(24, Math.floor(frameWidth * 0.46)),
            region,
            title: 'Panel Inspector',
            content,
            screenWidth: frame.screenRect.width,
            screenHeight: frame.screenRect.height,
            borderToken: ctx.theme.theme.border.primary,
            bgToken: ctx.theme.theme.surface.elevated,
            ctx,
          }));
        } else {
          overlays.push(drawer({
            anchor,
            height: Math.max(8, Math.floor(frameHeight * 0.4)),
            region,
            title: 'Panel Inspector',
            content,
            screenWidth: frame.screenRect.width,
            screenHeight: frame.screenRect.height,
            borderToken: ctx.theme.theme.border.primary,
            bgToken: ctx.theme.theme.surface.elevated,
            ctx,
          }));
        }
      }

      if (pageModel.quitConfirmOpen) {
        overlays.push(modal({
          title: 'Quit Session?',
          body: 'Exit the control room now?\n\nEnter = Yes\nEsc = No',
          hint: 'q request • enter confirm • esc cancel',
          width: 44,
          screenWidth: frame.screenRect.width,
          screenHeight: frame.screenRect.height,
          borderToken: ctx.theme.theme.border.primary,
          bgToken: ctx.theme.theme.surface.elevated,
          ctx,
        }));
      }

      return overlays;
    },
  });
}
