import type { I18nRuntime } from '@flyingrobots/bijou-i18n';
import type { FrameAction } from './app-frame-types.js';
import { frameMessage } from './app-frame-i18n.js';
import { createKeyMap, type KeyMap } from './keybindings.js';

export interface FrameKeyMapOptions {
  readonly enableSettings?: boolean;
  readonly enableShellThemeModeToggle?: boolean;
  readonly enableNotifications?: boolean;
  readonly i18n?: I18nRuntime;
}

/** Build the default key map for frame-level actions. */
export function createFrameKeyMap(
  options: FrameKeyMapOptions = {},
): KeyMap<FrameAction> {
  const t = (id: string, fallback: string) =>
    frameMessage(options.i18n, id, fallback);
  const group = (id: string, fallback: string) =>
    frameMessage(options.i18n, id, fallback);
  const keyMap = createKeyMap<FrameAction>()
    .group(group('key.group.frame', 'Frame'), (g) =>
      g
        .bind('?', t('key.toggleHelp', 'Toggle help'), { type: 'toggle-help' })
        .bind('`', t('key.togglePerfHud', 'Toggle perf HUD'), {
          type: 'toggle-perf-hud',
        })
        .bind('[', t('key.prevTab', 'Previous tab'), { type: 'prev-tab' })
        .bind(']', t('key.nextTab', 'Next tab'), { type: 'next-tab' })
        .bind('tab', t('key.nextPane', 'Next pane'), { type: 'next-pane' })
        .bind('shift+tab', t('key.prevPane', 'Previous pane'), {
          type: 'prev-pane',
        })
        .bind('/', t('key.search', 'Search'), { type: 'open-search' })
        .bind('ctrl+p', t('key.openPalette', 'Open command palette'), {
          type: 'open-palette',
        })
        .bind(':', t('key.openPalette', 'Open command palette'), {
          type: 'open-palette',
        })
        .bind('ctrl+m', t('key.toggleMinimize', 'Fold/unfold pane'), {
          type: 'toggle-minimize',
        })
        .bind('ctrl+f', t('key.toggleMaximize', 'Full-screen pane'), {
          type: 'toggle-maximize',
        }),
    )
    .group(group('key.group.dock', 'Dock'), (g) =>
      g
        .bind('ctrl+shift+up', t('key.dockUp', 'Move pane up'), {
          type: 'dock-up',
        })
        .bind('ctrl+shift+down', t('key.dockDown', 'Move pane down'), {
          type: 'dock-down',
        })
        .bind('ctrl+shift+left', t('key.dockLeft', 'Move pane left'), {
          type: 'dock-left',
        })
        .bind('ctrl+shift+right', t('key.dockRight', 'Move pane right'), {
          type: 'dock-right',
        }),
    )
    .group(group('key.group.scroll', 'Scroll'), (g) =>
      g
        .bind('j', t('key.scrollDown', 'Scroll down'), { type: 'scroll-down' })
        .bind('k', t('key.scrollUp', 'Scroll up'), { type: 'scroll-up' })
        .bind('d', t('key.pageDown', 'Page down'), { type: 'page-down' })
        .bind('u', t('key.pageUp', 'Page up'), { type: 'page-up' })
        .bind('g', t('key.top', 'Top'), { type: 'top' })
        .bind('shift+g', t('key.bottom', 'Bottom'), { type: 'bottom' })
        .bind('h', t('key.scrollLeft', 'Scroll left'), { type: 'scroll-left' })
        .bind('l', t('key.scrollRight', 'Scroll right'), {
          type: 'scroll-right',
        }),
    );

  if (options.enableSettings) {
    keyMap.group(group('key.group.shell', 'Shell'), (g) =>
      g
        .bind('ctrl+,', t('key.settings', 'Settings'), {
          type: 'toggle-settings',
        })
        .bind('f2', t('key.settings', 'Settings'), {
          type: 'toggle-settings',
        }),
    );
  }

  if (options.enableShellThemeModeToggle) {
    keyMap.group(group('key.group.shell', 'Shell'), (g) =>
      g.bind('ctrl+t', t('key.toggleThemeMode', 'Toggle theme mode'), {
        type: 'toggle-shell-theme-mode',
      }),
    );
  }

  if (options.enableNotifications) {
    keyMap.group(group('key.group.shell', 'Shell'), (g) =>
      g.bind('shift+n', t('key.notifications', 'Notifications'), {
        type: 'toggle-notifications',
      }),
    );
  }

  return keyMap;
}
