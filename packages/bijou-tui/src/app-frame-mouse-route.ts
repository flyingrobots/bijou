import type { BijouContext, LayoutNode as SurfaceLayoutNode } from '@flyingrobots/bijou';
import type { FramePage } from './app-frame-page-contract.js';
import type { FrameShellCommand, InternalFrameModel } from './app-frame-types.js';
import type { MouseMsg } from './types.js';
import type { FrameLayerDescriptor } from './app-frame-layers.js';
import { describeFrameRuntimeViewStack } from './app-frame-layers.js';
import { resolveFrameLayerContext } from './app-frame-layer-context.js';
import { nodeIdSuffix, resolveFrameMouseRuntimeLayouts, type MouseLayoutDependencies } from './app-frame-mouse-layout.js';
import type { WorkspaceLayoutServices } from './app-frame-workspace-layout.js';
import type { ResolvedFrameNotificationOptions } from './app-frame-notification-runtime.js';
import { routeRuntimeInput, type RuntimeInputRouteResult } from './runtime-engine.js';
import { routeFrameWorkspaceMouse } from './app-frame-mouse-workspace.js';

export interface FrameMouseRouteDependencies<PageModel, Msg> {
  readonly pagesById: Map<string, FramePage<PageModel, Msg>>;
  readonly frameNotificationOptions: ResolvedFrameNotificationOptions;
  readonly mouseLayoutDependencies: MouseLayoutDependencies<PageModel, Msg>;
  readonly workspaceLayout: WorkspaceLayoutServices<PageModel, Msg>;
  readonly resolveFrameThemeCtx: (shellThemeId: string | undefined) => BijouContext | undefined;
}

export function resolveRoutedMouseLayer<PageModel, Msg>(
  msg: MouseMsg,
  model: InternalFrameModel<PageModel, Msg>,
  dependencies: FrameMouseRouteDependencies<PageModel, Msg>,
): RuntimeInputRouteResult<FrameShellCommand<Msg>> {
  const {
    frameNotificationOptions,
    mouseLayoutDependencies,
    pagesById,
    resolveFrameThemeCtx,
    workspaceLayout,
  } = dependencies;
  const context = resolveFrameLayerContext(model, pagesById);
  const runtimeStack = describeFrameRuntimeViewStack(model, {
    pageModalOpen: context.pageModalOpen,
  });

  return routeRuntimeInput<
    SurfaceLayoutNode, FrameLayerDescriptor, FrameShellCommand<Msg>
  >(
    runtimeStack,
    resolveFrameMouseRuntimeLayouts(model, mouseLayoutDependencies),
    {
      kind: 'pointer',
      action: msg.action,
      x: msg.col,
      y: msg.row,
      button: msg.button === 'none' ? undefined : msg.button,
    },
    ({ layer, hit }) => {
      const frameLayer = layer.model;
      if (frameLayer == null) return undefined;

      const cmds: FrameShellCommand<Msg>[] = [];

      if (frameLayer.kind === 'help') {
        if (msg.action === 'scroll-up' || msg.action === 'scroll-down') {
          cmds.push({ type: 'help-scroll', action: msg.action === 'scroll-down' ? 'down' : 'up' });
        }
        return { handled: true, commands: cmds };
      }

      if (frameLayer.kind === 'search' || frameLayer.kind === 'command-palette'
        || frameLayer.kind === 'quit-confirm' || frameLayer.kind === 'page-modal') {
        return { handled: true };
      }

      if (frameLayer.kind === 'settings') {
        if (hit == null) return { handled: true };
        if (msg.action === 'scroll-up' || msg.action === 'scroll-down') {
          cmds.push({ type: 'settings-scroll', delta: msg.action === 'scroll-down' ? 3 : -3 });
          return { handled: true, commands: cmds };
        }
        if (msg.action === 'press' && msg.button === 'left') {
          const rowNode = hit.path.find((n) => n.id?.startsWith('settings-row:'));
          if (rowNode != null) {
            const rowId = nodeIdSuffix(rowNode, 'settings-row:');
            if (rowId !== undefined) cmds.push({ type: 'activate-settings-row', rowIndex: Number.parseInt(rowId, 10) });
          }
          return { handled: true, commands: cmds };
        }
        return { handled: true };
      }

      if (frameLayer.kind === 'notification-center') {
        if (hit == null) return { handled: true };
        if (msg.action === 'scroll-up' || msg.action === 'scroll-down') {
          cmds.push({ type: 'notification-center-scroll', delta: msg.action === 'scroll-down' ? 3 : -3 });
          return { handled: true, commands: cmds };
        }
        return { handled: true };
      }

      return routeFrameWorkspaceMouse(msg, model, context, hit, {
        notificationOptions: frameNotificationOptions,
        workspace: workspaceLayout,
        resolveThemeContext: resolveFrameThemeCtx,
      });
    },
  );
}
