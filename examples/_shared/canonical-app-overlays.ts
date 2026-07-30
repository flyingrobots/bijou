import type { BijouContext } from '@flyingrobots/bijou';
import { kbd } from '@flyingrobots/bijou';
import {
  inspectorDrawer,
  modal,
  type FrameOverlayContext,
  type Overlay,
} from '@flyingrobots/bijou-tui';
import type { WorkbenchPageModel } from './canonical-app-contract.js';
import { RELEASES } from './canonical-app-fixtures.js';
import { clampIndex, paneIdsForPage } from './canonical-app-model.js';

function createInspector(
  ctx: BijouContext,
  frame: FrameOverlayContext<WorkbenchPageModel>,
): Overlay {
  const pageModel = frame.pageModel;
  const paneIds = paneIdsForPage(frame.activePageId);
  const targetIndex = pageModel.drawerTargetIndex % (paneIds.length + 1);
  const targetPaneId =
    targetIndex < paneIds.length ? paneIds[targetIndex] : undefined;
  const region =
    targetPaneId == null ? undefined : frame.paneRects.get(targetPaneId);
  const targetLabel =
    targetPaneId == null ? 'screen' : `${frame.activePageId}:${targetPaneId}`;
  const release =
    RELEASES[clampIndex(pageModel.releaseIndex, RELEASES.length)] ??
    RELEASES[0];
  const frameWidth = region?.width ?? frame.screenRect.width;
  const frameHeight = region?.height ?? frame.screenRect.height;
  const base = {
    region,
    title: 'Panel Inspector',
    screenWidth: frame.screenRect.width,
    screenHeight: frame.screenRect.height,
    borderToken: ctx.border('primary'),
    bgToken: ctx.surface('elevated'),
    ctx,
    inspector: {
      title: 'Focused context',
      currentValue: targetLabel,
      currentValueLabel: 'Current selection',
      sections: [
        { title: 'Page', content: frame.activePageId },
        { title: 'Release', content: release.id },
        {
          title: 'Anchor',
          content: pageModel.drawerAnchor,
          tone: 'muted' as const,
        },
        {
          title: 'Controls',
          content: `${kbd('o', { ctx })} toggle • ${kbd('a', { ctx })} anchor • ${kbd('y', { ctx })} target`,
          tone: 'muted' as const,
        },
      ],
    },
  };

  if (pageModel.drawerAnchor === 'left' || pageModel.drawerAnchor === 'right') {
    return inspectorDrawer({
      ...base,
      anchor: pageModel.drawerAnchor,
      width: Math.max(24, Math.floor(frameWidth * 0.46)),
    });
  }
  return inspectorDrawer({
    ...base,
    anchor: pageModel.drawerAnchor,
    height: Math.max(8, Math.floor(frameHeight * 0.4)),
  });
}

export function createWorkbenchOverlays(
  ctx: BijouContext,
  frame: FrameOverlayContext<WorkbenchPageModel>,
): readonly Overlay[] {
  const overlays: Overlay[] = [];
  if (frame.pageModel.drawerOpen) {
    overlays.push(createInspector(ctx, frame));
  }
  if (frame.pageModel.quitConfirmOpen) {
    overlays.push(
      modal({
        title: 'Quit Session?',
        body: 'Exit the control room now?\n\nEnter = Yes\nEsc = No',
        hint: 'q request • enter confirm • esc cancel',
        width: 44,
        screenWidth: frame.screenRect.width,
        screenHeight: frame.screenRect.height,
        borderToken: ctx.border('primary'),
        bgToken: ctx.surface('elevated'),
        ctx,
      }),
    );
  }
  return overlays;
}
