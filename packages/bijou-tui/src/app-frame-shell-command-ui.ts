import type { Cmd } from './types.js';
import type {
  FramedAppMsg,
  InternalFrameModel,
} from './app-frame-types.js';
import {
  cycleNotificationCenterFilter,
  moveSettingsFocus,
  resolveNotificationCenterLayout,
  resolveSettingsLayout,
  scrollNotificationCenterBy,
  scrollSettingsBy,
} from './app-frame-overlays.js';
import { shouldUseShellQuitConfirm } from './shell-quit.js';
import type {
  FrameShellCommandDependencies,
  FrameShellUiCommand,
} from './app-frame-shell-command-contract.js';

const closeCommandPalette = <PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
): InternalFrameModel<PageModel, Msg> => ({
  ...model,
  commandPalette: undefined,
  commandPaletteEntries: undefined,
  commandPaletteTitle: undefined,
  commandPaletteKind: undefined,
});

export function applyFrameShellUiCommand<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  command: FrameShellUiCommand<Msg>,
  teaCmds: Cmd<FramedAppMsg<Msg>>[],
  dependencies: FrameShellCommandDependencies<PageModel, Msg>,
): InternalFrameModel<PageModel, Msg> {
  const {
    notificationState,
    options,
    pagesById,
    resolveFrameThemeCtx,
    resolveShellThemes,
    themeMode,
  } = dependencies;
  switch (command.type) {
    case 'close-help':
      return { ...model, helpOpen: false, helpScrollY: 0 };
    case 'close-settings':
      return { ...model, settingsOpen: false };
    case 'close-notification-center':
      return {
        ...model,
        notificationCenterOpen: false,
        notificationCenterScrollY: 0,
      };
    case 'close-palette':
      return closeCommandPalette(model);
    case 'close-quit-confirm':
      return { ...model, quitConfirmOpen: false };
    case 'open-help':
      return { ...model, helpOpen: true };
    case 'open-quit-confirm':
      if (!shouldUseShellQuitConfirm() || model.quitConfirmOpen) return model;
      return {
        ...closeCommandPalette(model),
        quitConfirmOpen: true,
        helpOpen: false,
        helpScrollY: 0,
        settingsOpen: false,
        notificationCenterOpen: false,
      };
    case 'settings-focus-move':
    case 'settings-scroll':
    case 'settings-scroll-to':
    case 'activate-settings-row': {
      const layout = resolveSettingsLayout(
        model,
        options,
        pagesById,
        resolveShellThemes(),
      );
      if (layout == null) return model;
      if (command.type === 'settings-focus-move') {
        return moveSettingsFocus(model, layout, command.delta);
      }
      if (command.type === 'settings-scroll') {
        return scrollSettingsBy(model, layout, command.delta);
      }
      if (command.type === 'settings-scroll-to') {
        return {
          ...model,
          settingsScrollY:
            command.position === 'top' ? 0 : layout.maxScrollY,
        };
      }
      const hitRow = layout.rows.find((row) => row.index === command.rowIndex);
      if (hitRow == null) return model;
      const focused = { ...model, settingsFocusIndex: hitRow.index };
      if (hitRow.behavior === 'cycle-shell-theme') {
        const [next, cmds] = themeMode.cycleSetting(focused, hitRow.row);
        teaCmds.push(...cmds);
        return next;
      }
      if (
        hitRow.row.action === undefined ||
        hitRow.row.enabled === false ||
        hitRow.row.kind === 'info'
      ) {
        return focused;
      }
      const [next, cmds] = notificationState.activateSettingsRow(
        focused,
        hitRow.row,
      );
      teaCmds.push(...cmds);
      return next;
    }
    case 'toggle-shell-theme-mode': {
      const [next, cmds] = themeMode.toggle(model);
      teaCmds.push(...cmds);
      return next;
    }
    case 'notification-center-scroll':
    case 'notification-center-scroll-to':
    case 'cycle-notification-filter': {
      const layout = resolveNotificationCenterLayout(
        model,
        options,
        pagesById,
        resolveFrameThemeCtx(model.activeShellThemeId),
      );
      if (layout == null) return model;
      if (command.type === 'notification-center-scroll') {
        return scrollNotificationCenterBy(model, layout, command.delta);
      }
      if (command.type === 'notification-center-scroll-to') {
        return {
          ...model,
          notificationCenterScrollY:
            command.position === 'top' ? 0 : layout.maxScrollY,
        };
      }
      const [next, cmds] = cycleNotificationCenterFilter(model, layout);
      teaCmds.push(...cmds);
      return next;
    }
  }
}
