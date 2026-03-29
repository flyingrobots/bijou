import type {
  I18nCatalog,
  I18nCatalogKey,
  I18nDirection,
  I18nRuntime,
} from '@flyingrobots/bijou-i18n';
import type { NotificationHistoryFilter } from './notification.js';

const FRAME_I18N_NAMESPACE = 'bijou.shell';

export const FRAME_I18N_CATALOG: I18nCatalog = {
  namespace: FRAME_I18N_NAMESPACE,
  entries: [
    message('palette.title', 'Command Palette'),
    message('palette.hint', 'Enter select • Esc close'),
    message('search.title', 'Search'),
    message('settings.title', 'Settings'),
    message('settings.footer', 'F2/Esc close • ↑/↓ rows • Enter toggle • / search • q quit'),
    message('notifications.title', 'Notifications'),
    message('notifications.footer', 'Shift+N close • f filter • j/k scroll • q quit'),
    message('notifications.cue.liveArchived', 'notices:{liveCount}+{archivedCount}'),
    message('notifications.cue.liveOnly', 'notices:{liveCount}'),
    message('notifications.cue.archivedOnly', 'notices:{archivedCount}'),
    message('notifications.filter.all', 'All'),
    message('notifications.filter.actionable', 'Actionable'),
    message('help.title', 'Keyboard Help'),
    message('help.hint', 'j/k scroll • d/u page • g/G top/bottom • mouse wheel • ? close'),
    message('quit.title', 'Quit?'),
    message('quit.body', 'Quit this app?\n\nY quit • N stay'),
    message('quit.footer', 'Y quit • N stay'),
    message('mode.normal', 'NORMAL'),
    message('mode.palette', 'PALETTE'),
    message('mode.help', 'HELP'),
    message('mode.quit', 'QUIT'),
    message('mode.settings', 'SETTINGS'),
    message('mode.notices', 'NOTICES'),
  ],
};

function message(id: string, value: string) {
  return {
    key: { namespace: FRAME_I18N_NAMESPACE, id },
    kind: 'message' as const,
    sourceLocale: 'en',
    values: { en: value },
  };
}

function interpolate(template: string, values: Readonly<Record<string, unknown>>): string {
  return template.replace(/\{([^}]+)\}/g, (_match, rawKey: string) => {
    const value = values[rawKey];
    return value === undefined ? `{${rawKey}}` : String(value);
  });
}

export function frameMessage(
  i18n: I18nRuntime | undefined,
  id: string,
  fallback: string,
  values: Readonly<Record<string, unknown>> = {},
): string {
  if (i18n == null) {
    return interpolate(fallback, values);
  }

  try {
    return i18n.t(frameKey(id), values);
  } catch {
    return interpolate(fallback, values);
  }
}

export function frameKey(id: string): I18nCatalogKey {
  return { namespace: FRAME_I18N_NAMESPACE, id };
}

export function frameDirection(i18n: I18nRuntime | undefined): I18nDirection {
  return i18n?.direction ?? 'ltr';
}

export function frameStartAnchor(i18n: I18nRuntime | undefined): 'left' | 'right' {
  return frameDirection(i18n) === 'rtl' ? 'right' : 'left';
}

export function frameEndAnchor(i18n: I18nRuntime | undefined): 'left' | 'right' {
  return frameDirection(i18n) === 'rtl' ? 'left' : 'right';
}

export function frameModeLabel(
  i18n: I18nRuntime | undefined,
  mode: 'NORMAL' | 'PALETTE' | 'HELP' | 'QUIT' | 'SETTINGS' | 'NOTICES',
): string {
  return frameMessage(i18n, `mode.${mode.toLowerCase()}`, mode);
}

export function frameNotificationFilterLabel(
  i18n: I18nRuntime | undefined,
  filter: NotificationHistoryFilter,
): string {
  if (filter === 'ALL') {
    return frameMessage(i18n, 'notifications.filter.all', 'All');
  }
  if (filter === 'ACTIONABLE') {
    return frameMessage(i18n, 'notifications.filter.actionable', 'Actionable');
  }
  return filter;
}

export function frameNotificationCue(
  i18n: I18nRuntime | undefined,
  liveCount: number,
  archivedCount: number,
): string | undefined {
  if (liveCount > 0 && archivedCount > 0) {
    return frameMessage(
      i18n,
      'notifications.cue.liveArchived',
      'notices:{liveCount}+{archivedCount}',
      { liveCount, archivedCount },
    );
  }
  if (liveCount > 0) {
    return frameMessage(i18n, 'notifications.cue.liveOnly', 'notices:{liveCount}', { liveCount });
  }
  if (archivedCount > 0) {
    return frameMessage(i18n, 'notifications.cue.archivedOnly', 'notices:{archivedCount}', { archivedCount });
  }
  return undefined;
}
