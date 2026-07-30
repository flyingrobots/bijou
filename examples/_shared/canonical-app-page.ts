import { createKeyMap, quit, type FramePage } from '@flyingrobots/bijou-tui';
import type {
  WorkbenchLayout,
  WorkbenchMsg,
  WorkbenchPageId,
  WorkbenchPageModel,
} from './canonical-app-contract.js';
import { RELEASES } from './canonical-app-fixtures.js';
import {
  clampIndex,
  INITIAL_PAGE_MODEL,
  nextAnchor,
  updateSelectionForPage,
} from './canonical-app-model.js';

export function buildPage(
  id: WorkbenchPageId,
  title: string,
  paneIds: readonly string[],
  layout: WorkbenchLayout,
): FramePage<WorkbenchPageModel, WorkbenchMsg> {
  return {
    id,
    title,
    init: () => [INITIAL_PAGE_MODEL, []],
    update(msg, model) {
      if (msg.type === 'mouse' || msg.type === 'pulse') return [model, []];
      if (msg.type === 'force-quit') return [model, [quit()]];

      if (model.quitConfirmOpen) {
        if (msg.type === 'confirm-quit') return [model, [quit()]];
        if (msg.type === 'escape') {
          return [{ ...model, quitConfirmOpen: false }, []];
        }
        return [model, []];
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
          return [
            { ...model, drawerAnchor: nextAnchor(model.drawerAnchor) },
            [],
          ];
        case 'cycle-drawer-target':
          return [
            {
              ...model,
              drawerTargetIndex:
                (model.drawerTargetIndex + 1) % (paneIds.length + 1),
            },
            [],
          ];
        case 'next-release':
          return [
            {
              ...model,
              releaseIndex: clampIndex(model.releaseIndex + 1, RELEASES.length),
            },
            [],
          ];
        case 'prev-release':
          return [
            {
              ...model,
              releaseIndex: clampIndex(model.releaseIndex - 1, RELEASES.length),
            },
            [],
          ];
        case 'next-incident':
          return [updateSelectionForPage(id, model, 1), []];
        case 'prev-incident':
          return [updateSelectionForPage(id, model, -1), []];
      }
    },
    keyMap: createKeyMap<WorkbenchMsg>().group('Workspace', (group) =>
      group
        .bind('.', 'Next incident/ticket', { type: 'next-incident' })
        .bind(',', 'Previous incident/ticket', { type: 'prev-incident' }),
    ),
    layout,
  };
}
