import type { BijouContext } from '@flyingrobots/bijou';
import { createSplitPaneState, type FramePage } from '@flyingrobots/bijou-tui';
import {
  BOARD_PANES,
  GRAPH_PANES,
  OPS_PANES,
  type WorkbenchMsg,
  type WorkbenchPageModel,
} from './canonical-app-contract.js';
import {
  renderBoardLanes,
  renderBoardRunbook,
  renderBoardTicket,
} from './canonical-app-board.js';
import {
  renderGraphDag,
  renderGraphNotes,
  renderGraphTimeline,
} from './canonical-app-graph.js';
import {
  renderIncidentFeed,
  renderOpsHealth,
  renderOpsSummary,
} from './canonical-app-ops.js';
import { buildPage } from './canonical-app-page.js';
import { contentSurface } from './example-surfaces.js';

export function createWorkbenchPages(
  ctx: BijouContext,
): readonly FramePage<WorkbenchPageModel, WorkbenchMsg>[] {
  return [
    buildPage('ops', 'Ops', OPS_PANES, (model) => ({
      kind: 'grid',
      gridId: 'ops-grid',
      columns: [32, '1fr'],
      rows: [12, '1fr'],
      areas: ['ops-summary ops-summary', 'ops-health ops-events'],
      gap: 1,
      cells: {
        'ops-summary': {
          kind: 'pane',
          paneId: 'ops-summary',
          render: (width, height) =>
            contentSurface(renderOpsSummary(width, height, model, ctx)),
        },
        'ops-health': {
          kind: 'pane',
          paneId: 'ops-health',
          render: (width) => contentSurface(renderOpsHealth(width, ctx)),
        },
        'ops-events': {
          kind: 'pane',
          paneId: 'ops-events',
          overflowX: 'scroll',
          render: (width) =>
            contentSurface(renderIncidentFeed(width, model, ctx)),
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
        render: (width) => contentSurface(renderBoardLanes(width, ctx)),
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
          render: (width) =>
            contentSurface(renderBoardTicket(width, model, ctx)),
        },
        paneB: {
          kind: 'pane',
          paneId: 'board-runbook',
          render: (width) => contentSurface(renderBoardRunbook(width, ctx)),
        },
      },
    })),
    buildPage('graph', 'Graph', GRAPH_PANES, (model) => ({
      kind: 'grid',
      gridId: 'graph-grid',
      columns: ['2fr', '1fr'],
      rows: ['1fr', 12],
      areas: ['graph-dag graph-timeline', 'graph-dag graph-notes'],
      gap: 1,
      cells: {
        'graph-dag': {
          kind: 'pane',
          paneId: 'graph-dag',
          overflowX: 'scroll',
          render: (width) => contentSurface(renderGraphDag(width, model, ctx)),
        },
        'graph-timeline': {
          kind: 'pane',
          paneId: 'graph-timeline',
          render: (width) =>
            contentSurface(renderGraphTimeline(width, model, ctx)),
        },
        'graph-notes': {
          kind: 'pane',
          paneId: 'graph-notes',
          render: (width) =>
            contentSurface(renderGraphNotes(width, model, ctx)),
        },
      },
    })),
  ];
}
