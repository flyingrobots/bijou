import type { BijouContext } from '@flyingrobots/bijou';
import {
  createFramedApp,
  createKeyMap,
  type FramedApp,
} from '@flyingrobots/bijou-tui';
import type {
  WorkbenchMsg,
  WorkbenchPageModel,
} from './canonical-app-contract.js';
import { createWorkbenchPages } from './canonical-app-layouts.js';
import { createWorkbenchOverlays } from './canonical-app-overlays.js';

export function createCanonicalWorkbenchApp(
  ctx: BijouContext,
): FramedApp<WorkbenchPageModel, WorkbenchMsg> {
  return createFramedApp<WorkbenchPageModel, WorkbenchMsg>({
    title: 'Bijou Control Room',
    pages: createWorkbenchPages(ctx),
    defaultPageId: 'ops',
    enableCommandPalette: true,
    globalKeys: createKeyMap<WorkbenchMsg>().group('Global', (group) =>
      group
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
    overlayFactory: (frame) => createWorkbenchOverlays(ctx, frame),
  });
}
