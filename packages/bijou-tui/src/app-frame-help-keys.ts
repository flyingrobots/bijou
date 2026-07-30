import type { I18nRuntime } from '@flyingrobots/bijou-i18n';
import type { BindingSource } from './help.js';
import type { FrameAction } from './app-frame-types.js';
import { frameMessage } from './app-frame-i18n.js';
import { createKeyMap } from './keybindings.js';

const translator = (i18n: I18nRuntime | undefined) =>
  (id: string, fallback: string) => frameMessage(i18n, id, fallback);

export function createQuitHelpKeys(i18n?: I18nRuntime): BindingSource {
  const t = translator(i18n);
  return createKeyMap<FrameAction>().group(t('help.group.quit', 'Quit'), (g) =>
    g
      .bind('q', t('help.key.quit', 'Quit'), { type: 'toggle-help' })
      .bind('escape', t('help.key.quit', 'Quit'), { type: 'toggle-help' })
      .bind('ctrl+c', t('help.key.quit', 'Quit'), { type: 'toggle-help' }),
  );
}

export function createHelpLayerHelpKeys(
  i18n?: I18nRuntime,
): BindingSource {
  const t = translator(i18n);
  return createKeyMap<{ type: 'noop' }>().group(
    t('help.group.help', 'Help'),
    (g) =>
      g
        .bind('escape', t('help.key.closeHelp', 'Close help'), { type: 'noop' })
        .bind('?', t('help.key.closeHelp', 'Close help'), { type: 'noop' })
        .bind('up', t('key.scrollUp', 'Scroll up'), { type: 'noop' })
        .bind('down', t('key.scrollDown', 'Scroll down'), { type: 'noop' })
        .bind('j', t('key.scrollDown', 'Scroll down'), { type: 'noop' })
        .bind('k', t('key.scrollUp', 'Scroll up'), { type: 'noop' })
        .bind('d', t('key.pageDown', 'Page down'), { type: 'noop' })
        .bind('u', t('key.pageUp', 'Page up'), { type: 'noop' })
        .bind('g', t('key.top', 'Top'), { type: 'noop' })
        .bind('shift+g', t('key.bottom', 'Bottom'), { type: 'noop' }),
  );
}

export function createSettingsHelpKeys(i18n?: I18nRuntime): BindingSource {
  const t = translator(i18n);
  return createKeyMap<FrameAction>().group(
    t('help.group.settings', 'Settings'),
    (g) =>
      g
        .bind('escape', t('help.key.closeSettings', 'Close settings'), { type: 'toggle-settings' })
        .bind('f2', t('help.key.closeSettings', 'Close settings'), { type: 'toggle-settings' })
        .bind('up', t('help.key.previousRow', 'Previous row'), { type: 'scroll-up' })
        .bind('down', t('help.key.nextRow', 'Next row'), { type: 'scroll-down' })
        .bind('enter', t('help.key.activateSetting', 'Activate setting'), { type: 'toggle-settings' })
        .bind('space', t('help.key.activateSetting', 'Activate setting'), { type: 'toggle-settings' })
        .bind('j', t('key.scrollDown', 'Scroll down'), { type: 'scroll-down' })
        .bind('k', t('key.scrollUp', 'Scroll up'), { type: 'scroll-up' })
        .bind('d', t('key.pageDown', 'Page down'), { type: 'page-down' })
        .bind('u', t('key.pageUp', 'Page up'), { type: 'page-up' })
        .bind('g', t('key.top', 'Top'), { type: 'top' })
        .bind('shift+g', t('key.bottom', 'Bottom'), { type: 'bottom' })
        .bind('/', t('key.search', 'Search'), { type: 'open-search' })
        .bind('ctrl+p', t('key.openPalette', 'Open command palette'), { type: 'open-palette' })
        .bind(':', t('key.openPalette', 'Open command palette'), { type: 'open-palette' })
        .bind('?', t('key.toggleHelp', 'Toggle help'), { type: 'toggle-help' }),
  );
}

export function createNotificationCenterHelpKeys(
  i18n?: I18nRuntime,
): BindingSource {
  const t = translator(i18n);
  return createKeyMap<{ type: 'noop' }>().group(
    t('help.group.notifications', 'Notifications'),
    (g) =>
      g
        .bind('shift+n', t('help.key.closeNotifications', 'Close notification center'), { type: 'noop' })
        .bind('up', t('key.scrollUp', 'Scroll up'), { type: 'noop' })
        .bind('down', t('key.scrollDown', 'Scroll down'), { type: 'noop' })
        .bind('j', t('key.scrollDown', 'Scroll down'), { type: 'noop' })
        .bind('k', t('key.scrollUp', 'Scroll up'), { type: 'noop' })
        .bind('d', t('key.pageDown', 'Page down'), { type: 'noop' })
        .bind('u', t('key.pageUp', 'Page up'), { type: 'noop' })
        .bind('g', t('key.top', 'Top'), { type: 'noop' })
        .bind('shift+g', t('key.bottom', 'Bottom'), { type: 'noop' })
        .bind('f', t('help.key.cycleFilter', 'Cycle filter'), { type: 'noop' })
        .bind('/', t('key.search', 'Search'), { type: 'noop' })
        .bind('ctrl+p', t('key.openPalette', 'Open command palette'), { type: 'noop' })
        .bind(':', t('key.openPalette', 'Open command palette'), { type: 'noop' })
        .bind('?', t('key.toggleHelp', 'Toggle help'), { type: 'noop' }),
  );
}

export function createQuitConfirmHelpKeys(
  i18n?: I18nRuntime,
): BindingSource {
  const t = translator(i18n);
  return createKeyMap<{ type: 'noop' }>().group(
    t('help.group.quit', 'Quit'),
    (g) =>
      g
        .bind('y', t('help.key.quit', 'Quit'), { type: 'noop' })
        .bind('enter', t('help.key.quit', 'Quit'), { type: 'noop' })
        .bind('n', t('help.key.stay', 'Stay'), { type: 'noop' })
        .bind('escape', t('help.key.stay', 'Stay'), { type: 'noop' })
        .bind('q', t('help.key.stay', 'Stay'), { type: 'noop' }),
  );
}
