import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import { DOGFOOD_I18N_NAMESPACE } from './i18n/dogfood-catalog.js';

export function interpolateFallbackText(
  fallback: string,
  values: Readonly<Record<string, unknown>> = {},
): string {
  return fallback.replace(/\{([^}]+)\}/g, (_match, rawKey: string) => String(values[rawKey] ?? `{${rawKey}}`));
}

export function localizedText(
  localization: LocalizationPort | undefined,
  namespace: string,
  id: string,
  fallback: string,
  values: Readonly<Record<string, unknown>> = {},
): string {
  if (localization == null) {
    return interpolateFallbackText(fallback, values);
  }

  try {
    const resolved = localization.resolve<string>({
      key: { namespace, id },
      values,
    });
    return typeof resolved.value === 'string'
      ? resolved.value
      : interpolateFallbackText(fallback, values);
  } catch {
    return interpolateFallbackText(fallback, values);
  }
}

export function dogfoodLocalizedText(
  localization: LocalizationPort | undefined,
  id: string,
  fallback: string,
  values: Readonly<Record<string, unknown>> = {},
): string {
  return localizedText(localization, DOGFOOD_I18N_NAMESPACE, id, fallback, values);
}

export function formatLocalizedList(
  localization: LocalizationPort | undefined,
  values: readonly string[],
): string {
  if (localization == null) {
    return values.join(', ');
  }

  try {
    return localization.formatList(values);
  } catch {
    return values.join(', ');
  }
}
