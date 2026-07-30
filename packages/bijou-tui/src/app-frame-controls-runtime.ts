import { commandPaletteKeyMap } from './command-palette.js';
import { createFrameKeyMap } from './app-frame-utils.js';
import type { PaletteAction } from './app-frame-types.js';
import type { FramePageRegistry } from './app-frame-page-registry.js';
import type { CreateFramedAppOptions } from './app-frame-options.js';
import {
  createHelpLayerHelpKeys,
  createNotificationCenterHelpKeys,
  createQuitConfirmHelpKeys,
  createQuitHelpKeys,
  createSettingsHelpKeys,
} from './app-frame-help-keys.js';
import { resolveFrameNotificationOptions } from './app-frame-notification-runtime.js';
import { createFrameNotificationStateServices } from './app-frame-notification-state.js';
import { createFrameThemeModeServices } from './app-frame-theme-mode.js';
import { createFrameShellCommandServices } from './app-frame-shell-command.js';
import { createFrameKeyRouteServices } from './app-frame-key-route.js';
import type { FrameThemeRuntime } from './app-frame-theme-runtime.js';

export function createFrameControlsRuntime<PageModel, Msg>(
  options: CreateFramedAppOptions<PageModel, Msg>,
  registry: FramePageRegistry<PageModel, Msg>,
  themeRuntime: FrameThemeRuntime<PageModel, Msg>,
) {
  const { pagesById } = registry;
  const frameKeys = createFrameKeyMap({
    enableSettings: options.settings != null || themeRuntime.enableSettings,
    enableShellThemeModeToggle: themeRuntime.specs.some(
      (theme) => (theme.modes?.length ?? 0) > 1,
    ),
    enableNotifications:
      options.notificationCenter != null ||
      options.runtimeNotifications !== false,
    i18n: options.i18n,
  });
  const paletteKeys = commandPaletteKeyMap<PaletteAction>({
    focusNext: { type: 'cp-next' },
    focusPrev: { type: 'cp-prev' },
    pageDown: { type: 'cp-page-down' },
    pageUp: { type: 'cp-page-up' },
    select: { type: 'cp-select' },
    close: { type: 'cp-close' },
  });
  const notificationOptions = resolveFrameNotificationOptions(options);
  const resolveContext = () => themeRuntime.resolveContext();
  const resolveThemeContext = (themeId: string | undefined) =>
    themeRuntime.resolveThemeContext(themeId);
  const notificationState = createFrameNotificationStateServices<
    PageModel,
    Msg
  >(notificationOptions, resolveContext);
  const themeMode = createFrameThemeModeServices({
    options,
    notificationOptions,
    notifications: notificationState,
    resolveContext,
    resolveThemes: () => themeRuntime.resolvedThemes,
    ensureThemes: (context) => {
      themeRuntime.ensure(context);
    },
    publishTheme: (theme) => themeRuntime.publish(theme),
  });
  const presentation = {
    options,
    pagesById,
    resolvedShellThemes: () => themeRuntime.resolvedThemes,
    frameKeys,
    quitHelpKeys: createQuitHelpKeys(options.i18n),
    helpLayerHelpKeys: createHelpLayerHelpKeys(options.i18n),
    settingsHelpKeys: createSettingsHelpKeys(options.i18n),
    notificationCenterHelpKeys: createNotificationCenterHelpKeys(options.i18n),
    quitConfirmHelpKeys: createQuitConfirmHelpKeys(options.i18n),
    paletteKeys,
  };
  const shellCommands = createFrameShellCommandServices({
    options,
    pagesById,
    frameKeys,
    paletteKeys,
    frameNotificationOptions: notificationOptions,
    notificationState,
    themeMode,
    presentationDependencies: presentation,
    resolveFrameCtx: resolveContext,
    resolveFrameThemeCtx: resolveThemeContext,
    resolveShellThemes: () => themeRuntime.resolvedThemes,
  });
  const keyRoutes = createFrameKeyRouteServices({
    options,
    pagesById,
    frameKeys,
    resolveShellThemes: () => themeRuntime.resolvedThemes,
    resolveFrameThemeCtx: resolveThemeContext,
  });
  return {
    frameKeys,
    keyRoutes,
    notificationOptions,
    notificationState,
    paletteKeys,
    presentation,
    resolveContext,
    resolveThemeContext,
    shellCommands,
    themeMode,
  };
}
