import type { BijouContext } from '@flyingrobots/bijou';
import type { MouseMsg } from './types.js';
import type {
  FrameShellCommand,
  InternalFrameModel,
} from './app-frame-types.js';
import type { FrameLayerContext } from './app-frame-layer-context.js';
import { findInputAreaByPaneId } from './app-frame-overlays.js';
import type { WorkspaceLayoutServices } from './app-frame-workspace-layout.js';
import type { ResolvedFrameNotificationOptions } from './app-frame-notification-runtime.js';
import { hitTestNotificationStack } from './notification.js';
import type {
  RuntimeInputRouteOutcome,
  RuntimeLayoutHit,
} from './runtime-engine.js';
import { nodeIdSuffix } from './app-frame-mouse-layout.js';

export interface FrameMouseWorkspaceDependencies<PageModel, Msg> {
  readonly notificationOptions: ResolvedFrameNotificationOptions;
  readonly workspace: WorkspaceLayoutServices<PageModel, Msg>;
  readonly resolveThemeContext: (
    shellThemeId: string | undefined,
  ) => BijouContext | undefined;
}

export function routeFrameWorkspaceMouse<PageModel, Msg>(
  msg: MouseMsg,
  model: InternalFrameModel<PageModel, Msg>,
  context: FrameLayerContext<PageModel, Msg>,
  hit: RuntimeLayoutHit | undefined,
  dependencies: FrameMouseWorkspaceDependencies<PageModel, Msg>,
): RuntimeInputRouteOutcome<FrameShellCommand<Msg>> {
  const cmds: FrameShellCommand<Msg>[] = [];
  if (msg.action === 'press' && msg.button === 'left') {
    const target = dependencies.notificationOptions.enabled
      ? hitTestNotificationStack(
          model.runtimeNotifications,
          {
            screenWidth: model.columns,
            screenHeight: model.rows,
            margin: dependencies.notificationOptions.margin,
            gap: dependencies.notificationOptions.gap,
            ctx:
              dependencies.resolveThemeContext(model.activeShellThemeId) ??
              undefined,
          },
          msg.col,
          msg.row,
        )
      : undefined;
    if (target?.kind === 'dismiss') {
      cmds.push({
        type: 'dismiss-notification',
        notificationId: target.item.id,
      });
      return { handled: true, commands: cmds };
    }
    if (target != null) return { handled: true };
    const tabNode = hit?.path.find((node) => node.id?.startsWith('tab:'));
    const pageId = tabNode == null ? undefined : nodeIdSuffix(tabNode, 'tab:');
    if (pageId !== undefined) {
      const currentIndex = model.pageOrder.indexOf(model.activePageId);
      const nextIndex = model.pageOrder.indexOf(pageId);
      if (currentIndex >= 0 && nextIndex >= 0 && nextIndex !== currentIndex) {
        cmds.push({ type: 'switch-tab', delta: nextIndex - currentIndex });
      }
      return { handled: true, commands: cmds };
    }
    if (msg.row === 0) return { handled: true };
  }
  const pointerKind =
    msg.action === 'press' && msg.button === 'left'
      ? 'focus'
      : msg.action === 'scroll-up' || msg.action === 'scroll-down'
        ? 'scroll'
        : undefined;
  if (pointerKind == null) return { handled: false };
  const paneNode = hit?.path.find((node) => node.id?.startsWith('pane:'));
  const paneId =
    paneNode == null ? undefined : nodeIdSuffix(paneNode, 'pane:');
  const paneRect =
    paneId == null ? undefined : dependencies.workspace.paneRects(model).get(paneId);
  if (paneId == null || paneRect == null) return { handled: false };
  cmds.push({ type: 'focus-pane', paneId });
  const inputArea = findInputAreaByPaneId(context.inputAreas, paneId);
  const areaMsg = inputArea?.mouse?.({
    msg,
    model: context.activePageModel,
    rect: paneRect,
  });
  if (areaMsg !== undefined || pointerKind === 'focus') {
    cmds.push({
      type: 'emit-page-msg',
      pageId: model.activePageId,
      msg: areaMsg ?? msg,
    });
  } else {
    cmds.push({
      type: 'scroll-focused-pane',
      direction: msg.action === 'scroll-down' ? 'down' : 'up',
    });
  }
  return { handled: true, commands: cmds };
}
