import type { Cmd } from './types.js';
import type {
  FrameShellCommand,
  FramedAppMsg,
  InternalFrameModel,
} from './app-frame-types.js';
import {
  applyRuntimeCommandBuffer,
  bufferRuntimeRouteResult,
  createRuntimeBuffers,
  type RuntimeInputRouteResult,
} from './runtime-engine.js';
import type { FrameShellCommandDependencies } from './app-frame-shell-command-contract.js';
import { applyFrameShellUiCommand } from './app-frame-shell-command-ui.js';
import { applyFrameShellInteractionCommand } from './app-frame-shell-command-interaction.js';

export type { FrameShellCommandDependencies } from './app-frame-shell-command-contract.js';

export function createFrameShellCommandServices<PageModel, Msg>(
  dependencies: FrameShellCommandDependencies<PageModel, Msg>,
) {
  const applyShellCommand = (
    model: InternalFrameModel<PageModel, Msg>,
    command: FrameShellCommand<Msg>,
    teaCmds: Cmd<FramedAppMsg<Msg>>[],
  ): InternalFrameModel<PageModel, Msg> => {
    switch (command.type) {
      case 'close-help':
      case 'close-settings':
      case 'close-notification-center':
      case 'close-palette':
      case 'close-quit-confirm':
      case 'open-help':
      case 'open-quit-confirm':
      case 'settings-focus-move':
      case 'settings-scroll':
      case 'settings-scroll-to':
      case 'activate-settings-row':
      case 'toggle-shell-theme-mode':
      case 'notification-center-scroll':
      case 'notification-center-scroll-to':
      case 'cycle-notification-filter':
        return applyFrameShellUiCommand(
          model,
          command,
          teaCmds,
          dependencies,
        );
      case 'emit-page-msg':
      case 'emit-global-msg':
      case 'open-search-palette':
      case 'open-command-palette':
      case 'warn-frame-key-collision':
      case 'help-scroll':
      case 'focus-pane':
      case 'scroll-focused-pane':
      case 'switch-tab':
      case 'apply-frame-action':
      case 'palette-key':
      case 'quit':
      case 'dismiss-notification':
      case 'observed-key':
        return applyFrameShellInteractionCommand(
          model,
          command,
          teaCmds,
          dependencies,
        );
    }
  };
  const drainShellCommandBuffer = (
    model: InternalFrameModel<PageModel, Msg>,
    routeResult: RuntimeInputRouteResult<FrameShellCommand<Msg>>,
  ): [InternalFrameModel<PageModel, Msg>, Cmd<FramedAppMsg<Msg>>[]] => {
    const buffers = bufferRuntimeRouteResult(
      createRuntimeBuffers<FrameShellCommand<Msg>>(),
      routeResult,
    );
    const teaCmds: Cmd<FramedAppMsg<Msg>>[] = [];
    const { state } = applyRuntimeCommandBuffer(
      model,
      buffers.commands,
      (current, command) =>
        applyShellCommand(current, command, teaCmds),
    );
    return [state, teaCmds];
  };
  return { drainShellCommandBuffer };
}
