import { resolveClock } from '@flyingrobots/bijou';
import type { Cmd } from './types.js';
import { quit } from './commands.js';
import { dismissNotification } from './notification.js';
import type {
  FramedAppMsg,
  InternalFrameModel,
} from './app-frame-types.js';
import { emitMsg, emitMsgForPage } from './app-frame-types.js';
import {
  applyFrameAction,
  scrollFocusedPane,
  switchTab,
} from './app-frame-actions.js';
import {
  handlePaletteKey,
  openCommandPalette,
  openSearchPalette,
} from './app-frame-palette.js';
import { focusPane } from './app-frame-model-helpers.js';
import type {
  FrameShellCommandDependencies,
  FrameShellInteractionCommand,
} from './app-frame-shell-command-contract.js';
import { queueFrameKeyCollisionWarning } from './app-frame-key-collision.js';
import { applyFrameHelpScroll } from './app-frame-help-scroll.js';

export function applyFrameShellInteractionCommand<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  command: FrameShellInteractionCommand<Msg>,
  teaCmds: Cmd<FramedAppMsg<Msg>>[],
  dependencies: FrameShellCommandDependencies<PageModel, Msg>,
): InternalFrameModel<PageModel, Msg> {
  const { options, pagesById } = dependencies;
  switch (command.type) {
    case 'open-search-palette':
      return openSearchPalette(
        model,
        dependencies.frameKeys,
        options,
        pagesById,
      );
    case 'open-command-palette':
      return openCommandPalette(
        model,
        dependencies.frameKeys,
        options,
        pagesById,
      );
    case 'warn-frame-key-collision':
      return queueFrameKeyCollisionWarning(
        model,
        command.msg,
        teaCmds,
        dependencies,
      );
    case 'help-scroll':
      return applyFrameHelpScroll(model, command, dependencies);
    case 'focus-pane':
      return focusPane(model, command.paneId);
    case 'scroll-focused-pane':
      return scrollFocusedPane(
        model,
        {
          type:
            command.direction === 'down' ? 'scroll-down' : 'scroll-up',
        },
        pagesById,
        options,
      );
    case 'switch-tab': {
      const [next, cmds] = switchTab(
        model,
        command.delta,
        pagesById,
        options,
      );
      teaCmds.push(...cmds);
      return next;
    }
    case 'apply-frame-action': {
      const [next, cmds] = applyFrameAction(
        command.action,
        model,
        options,
        pagesById,
      );
      teaCmds.push(...cmds);
      return next;
    }
    case 'palette-key': {
      const [next, cmds] = handlePaletteKey(
        command.msg,
        model,
        dependencies.paletteKeys,
        options,
        pagesById,
        (action, closed) =>
          action.type === 'toggle-shell-theme-mode'
            ? dependencies.themeMode.toggle(closed)
            : undefined,
      );
      teaCmds.push(...cmds);
      return next;
    }
    case 'emit-page-msg':
      teaCmds.push(emitMsgForPage(command.pageId, command.msg));
      return model;
    case 'emit-global-msg':
      teaCmds.push(emitMsg(command.msg));
      return model;
    case 'quit':
      teaCmds.push(quit());
      return model;
    case 'dismiss-notification': {
      if (!dependencies.frameNotificationOptions.enabled) return model;
      const nowMs = resolveClock(dependencies.resolveFrameCtx()).now();
      const [next, cmds] = dependencies.notificationState.apply(
        model,
        dismissNotification(
          model.runtimeNotifications,
          command.notificationId,
          nowMs,
        ),
        nowMs,
      );
      teaCmds.push(...cmds);
      return next;
    }
    case 'observed-key': {
      const observed = options.observeKey?.(command.msg, command.route);
      if (observed !== undefined) {
        teaCmds.push(emitMsgForPage(model.activePageId, observed));
      }
      return model;
    }
  }
}
