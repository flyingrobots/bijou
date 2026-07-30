import type { DrawerAnchor } from '@flyingrobots/bijou-tui';
import {
  GRAPH_SELECTION_IDS,
  PANE_IDS_BY_PAGE,
  type WorkbenchPageId,
  type WorkbenchPageModel,
} from './canonical-app-contract.js';
import { BACKLOG, INCIDENT_FEED } from './canonical-app-fixtures.js';

const DRAWER_ANCHORS: readonly DrawerAnchor[] = [
  'right',
  'left',
  'bottom',
  'top',
];

export const INITIAL_PAGE_MODEL: WorkbenchPageModel = {
  releaseIndex: 0,
  incidentIndex: 0,
  backlogIndex: 0,
  graphSelectionIndex: 0,
  drawerOpen: false,
  drawerAnchor: 'right',
  drawerTargetIndex: 0,
  quitConfirmOpen: false,
};

export function clampIndex(index: number, total: number): number {
  if (total <= 0) return 0;
  const normalized = index % total;
  return normalized < 0 ? normalized + total : normalized;
}

export function nextAnchor(anchor: DrawerAnchor): DrawerAnchor {
  const index = DRAWER_ANCHORS.indexOf(anchor);
  return (
    DRAWER_ANCHORS[clampIndex(index + 1, DRAWER_ANCHORS.length)] ?? 'right'
  );
}

export function updateSelectionForPage(
  pageId: WorkbenchPageId,
  model: WorkbenchPageModel,
  delta: number,
): WorkbenchPageModel {
  switch (pageId) {
    case 'ops':
      return {
        ...model,
        incidentIndex: clampIndex(
          model.incidentIndex + delta,
          INCIDENT_FEED.length,
        ),
      };
    case 'board':
      return {
        ...model,
        backlogIndex: clampIndex(model.backlogIndex + delta, BACKLOG.length),
      };
    case 'graph':
      return {
        ...model,
        graphSelectionIndex: clampIndex(
          model.graphSelectionIndex + delta,
          GRAPH_SELECTION_IDS.length,
        ),
      };
  }
}

export function paneIdsForPage(pageId: string): readonly string[] {
  if (pageId === 'ops' || pageId === 'board' || pageId === 'graph') {
    return PANE_IDS_BY_PAGE[pageId];
  }
  return [];
}
