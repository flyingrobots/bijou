import type { LayoutNode as SurfaceLayoutNode } from '@flyingrobots/bijou';
import type { KeyMsg } from './types.js';
import type {
  FrameShellCommand,
  InternalFrameModel,
} from './app-frame-types.js';
import {
  describeFrameRuntimeViewStack,
  type FrameLayerDescriptor,
} from './app-frame-layers.js';
import { resolveFrameLayerContext } from './app-frame-layer-context.js';
import {
  createRuntimeRetainedLayouts,
  routeRuntimeInput,
  type RuntimeInputRouteResult,
} from './runtime-engine.js';
import type { FrameKeyRouteDependencies } from './app-frame-key-route-contract.js';
import { createFrameKeyRouteShared } from './app-frame-key-route-shared.js';
import {
  routeHelpKey,
  routePaletteKey,
} from './app-frame-key-route-palette-help.js';
import { routeSettingsKey } from './app-frame-key-route-settings.js';
import { routeNotificationCenterKey } from './app-frame-key-route-notifications.js';
import { routeWorkspaceKey } from './app-frame-key-route-workspace.js';
import {
  routePageModalKey,
  routeQuitConfirmKey,
} from './app-frame-key-route-layers.js';

export type { FrameKeyRouteDependencies } from './app-frame-key-route-contract.js';

const EMPTY_RUNTIME_LAYOUTS = createRuntimeRetainedLayouts();

export function createFrameKeyRouteServices<PageModel, Msg>(
  dependencies: FrameKeyRouteDependencies<PageModel, Msg>,
) {
  const shared = createFrameKeyRouteShared<Msg>(
    dependencies.options.enableCommandPalette,
  );
  const resolveRoutedKeyLayer = (
    msg: KeyMsg,
    model: InternalFrameModel<PageModel, Msg>,
  ): RuntimeInputRouteResult<FrameShellCommand<Msg>> => {
    const context = resolveFrameLayerContext(model, dependencies.pagesById);
    const runtimeStack = describeFrameRuntimeViewStack(model, {
      pageModalOpen: context.pageModalOpen,
    });
    return routeRuntimeInput<
      SurfaceLayoutNode,
      FrameLayerDescriptor,
      FrameShellCommand<Msg>
    >(
      runtimeStack,
      EMPTY_RUNTIME_LAYOUTS,
      { kind: 'key', key: msg.key },
      ({ layer }) => {
        const frameLayer = layer.model;
        if (frameLayer == null) return undefined;
        if (
          frameLayer.kind === 'search' ||
          frameLayer.kind === 'command-palette'
        ) {
          return {
            handled: true,
            commands: routePaletteKey(
              msg,
              frameLayer.kind,
              dependencies,
              shared,
            ),
          };
        }
        if (frameLayer.kind === 'help') {
          return {
            handled: true,
            commands: routeHelpKey(msg, dependencies, shared),
          };
        }
        if (frameLayer.kind === 'settings') {
          const commands = routeSettingsKey(
            msg,
            model,
            dependencies,
            shared,
          );
          return commands == null
            ? { bubble: true }
            : { handled: true, commands };
        }
        if (frameLayer.kind === 'notification-center') {
          const commands = routeNotificationCenterKey(
            msg,
            model,
            dependencies,
            shared,
          );
          return commands == null
            ? { bubble: true }
            : { handled: true, commands };
        }
        if (frameLayer.kind === 'quit-confirm') {
          return {
            handled: true,
            commands: routeQuitConfirmKey(msg, dependencies),
          };
        }
        if (frameLayer.kind === 'page-modal') {
          return {
            handled: true,
            commands: routePageModalKey(
              msg,
              model,
              context,
              dependencies,
            ),
          };
        }
        return {
          handled: true,
          commands: routeWorkspaceKey(msg, model, dependencies, shared),
        };
      },
    );
  };
  return { resolveRoutedKeyLayer };
}
