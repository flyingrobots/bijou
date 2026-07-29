import type {
  I18nCatalogKey,
  I18nDirection,
  I18nRuntime,
} from '@flyingrobots/bijou-i18n';
import type { NotificationHistoryFilter } from './notification.js';
import { FRAME_I18N_NAMESPACE } from './app-frame-i18n-catalog.js';

function interpolate(
  template: string,
  values: Readonly<Record<string, unknown>>,
): string {
  return template.replace(/\{([^}]+)\}/g, (_match, rawKey: string) => {
    const value = values[rawKey];
    switch (typeof value) {
      case 'undefined':
      case 'function':
        return `{${rawKey}}`;
      case 'object':
        return value === null ? 'null' : JSON.stringify(value);
      case 'string':
        return value;
      case 'boolean':
        return value ? 'true' : 'false';
      case 'symbol':
        return value.description ?? 'Symbol()';
      case 'number':
      case 'bigint':
        return value.toString();
    }
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

export function frameStartAnchor(
  i18n: I18nRuntime | undefined,
): 'left' | 'right' {
  return frameDirection(i18n) === 'rtl' ? 'right' : 'left';
}

export function frameEndAnchor(
  i18n: I18nRuntime | undefined,
): 'left' | 'right' {
  return frameDirection(i18n) === 'rtl' ? 'left' : 'right';
}

export function frameModeLabel(
  i18n: I18nRuntime | undefined,
  mode:
    'NORMAL' | 'PALETTE' | 'HELP' | 'QUIT' | 'SETTINGS' | 'NOTICES' | 'MODAL',
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
    return frameMessage(
      i18n,
      'notifications.cue.liveOnly',
      'notices:{liveCount}',
      { liveCount },
    );
  }
  if (archivedCount > 0) {
    return frameMessage(
      i18n,
      'notifications.cue.archivedOnly',
      'notices:{archivedCount}',
      { archivedCount },
    );
  }
  return undefined;
}

export { FRAME_I18N_CATALOG } from './app-frame-i18n-catalog.js';
