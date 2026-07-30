import type { FramePage } from './app-frame-page-contract.js';
import type { CreateFramedAppOptions } from './app-frame-options.js';
import type {
  FramedAppMsg,
  InternalFrameModel,
} from './app-frame-types.js';
import {
  isFrameScopedMsg,
  isPageScopedMsg,
} from './app-frame-types.js';
import type {
  Cmd,
  KeyMsg,
  MouseMsg,
  PulseMsg,
  ResizeMsg,
} from './types.js';
import { isKeyMsg, isMouseMsg, isResizeMsg } from './types.js';
import { resolveRoutedMouseLayer } from './app-frame-mouse-route.js';
import type { FrameMouseRouteDependencies } from './app-frame-mouse-route.js';
import { updateTargetPage } from './app-frame-page-update.js';
import type { FrameNotificationStateServices } from './app-frame-notification-state.js';
import type { ResolvedFrameNotificationOptions } from './app-frame-notification-runtime.js';
import type { FrameThemeModeServices } from './app-frame-theme-mode.js';
import type { FrameThemeRuntime } from './app-frame-theme-runtime.js';
import type { createFrameShellCommandServices } from './app-frame-shell-command.js';
import type { createFrameKeyRouteServices } from './app-frame-key-route.js';
import { updateFrameScopedAction } from './app-frame-frame-action-update.js';

export interface FrameAppUpdateDependencies<PageModel, Msg> {
  readonly options: CreateFramedAppOptions<PageModel, Msg>;
  readonly pagesById: Map<string, FramePage<PageModel, Msg>>;
  readonly notificationOptions: ResolvedFrameNotificationOptions;
  readonly notificationState: FrameNotificationStateServices<PageModel, Msg>;
  readonly themeMode: FrameThemeModeServices<PageModel, Msg>;
  readonly themeRuntime: FrameThemeRuntime<PageModel, Msg>;
  readonly shellCommands: ReturnType<
    typeof createFrameShellCommandServices<PageModel, Msg>
  >;
  readonly keyRoutes: ReturnType<
    typeof createFrameKeyRouteServices<PageModel, Msg>
  >;
  readonly mouseRoute: FrameMouseRouteDependencies<PageModel, Msg>;
}

type FrameAppInput<Msg> =
  | KeyMsg
  | ResizeMsg
  | MouseMsg
  | PulseMsg
  | FramedAppMsg<Msg>;

export function updateFrameApp<PageModel, Msg>(
  msg: FrameAppInput<Msg>,
  model: InternalFrameModel<PageModel, Msg>,
  dependencies: FrameAppUpdateDependencies<PageModel, Msg>,
): [
  InternalFrameModel<PageModel, Msg>,
  Cmd<FramedAppMsg<Msg>>[],
] {
  const { pagesById } = dependencies;
  if (isFrameScopedMsg(msg)) {
    return updateFrameScopedAction(msg.action, model, dependencies);
  }
  if (isResizeMsg(msg)) {
    return [{ ...model, columns: msg.columns, rows: msg.rows }, []];
  }
  if (isKeyMsg(msg)) {
    return dependencies.shellCommands.drainShellCommandBuffer(
      model,
      dependencies.keyRoutes.resolveRoutedKeyLayer(msg, model),
    );
  }
  if (isMouseMsg(msg)) {
    const routed = resolveRoutedMouseLayer(
      msg,
      model,
      dependencies.mouseRoute,
    );
    if (routed.handled) {
      return dependencies.shellCommands.drainShellCommandBuffer(
        model,
        routed,
      );
    }
    return updateTargetPage(model, model.activePageId, msg, pagesById);
  }
  return isPageScopedMsg<Msg>(msg)
    ? updateTargetPage(model, msg.pageId, msg.msg, pagesById)
    : updateTargetPage(model, model.activePageId, msg, pagesById);
}
