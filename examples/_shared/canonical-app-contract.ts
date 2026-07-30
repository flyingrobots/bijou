import type { DrawerAnchor, FrameLayoutNode } from '@flyingrobots/bijou-tui';

export interface ReleaseSnapshot {
  readonly id: string;
  readonly readiness: number;
  readonly failedChecks: number;
  readonly incidents: number;
  readonly eta: string;
  readonly window: string;
}

export interface ServiceHealth {
  readonly name: string;
  readonly p95Ms: number;
  readonly errorRate: string;
  readonly status: 'healthy' | 'watch' | 'degraded';
}

export interface WorkItem {
  readonly id: string;
  readonly title: string;
  readonly owner: string;
  readonly status: 'todo' | 'doing' | 'blocked' | 'done';
}

export interface WorkbenchPageModel {
  readonly releaseIndex: number;
  readonly incidentIndex: number;
  readonly backlogIndex: number;
  readonly graphSelectionIndex: number;
  readonly drawerOpen: boolean;
  readonly drawerAnchor: DrawerAnchor;
  readonly drawerTargetIndex: number;
  readonly quitConfirmOpen: boolean;
}

export type WorkbenchMsg =
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

export type WorkbenchPageId = 'ops' | 'board' | 'graph';

export const OPS_PANES = ['ops-summary', 'ops-health', 'ops-events'] as const;
export const BOARD_PANES = [
  'board-lanes',
  'board-ticket',
  'board-runbook',
] as const;
export const GRAPH_PANES = [
  'graph-dag',
  'graph-timeline',
  'graph-notes',
] as const;
export const GRAPH_SELECTION_IDS = ['frame', 'overlays'] as const;

export const PANE_IDS_BY_PAGE: Readonly<
  Record<WorkbenchPageId, readonly string[]>
> = {
  ops: OPS_PANES,
  board: BOARD_PANES,
  graph: GRAPH_PANES,
};

export type WorkbenchLayout = (model: WorkbenchPageModel) => FrameLayoutNode;
