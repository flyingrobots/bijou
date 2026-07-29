import type { I18nFormatterPort } from './runtime-contract.js';

export const DEFAULT_FORMATTER: I18nFormatterPort = {
  formatNumber(value, locale) {
    return new Intl.NumberFormat(locale).format(value);
  },
  formatDate(value, locale) {
    return new Intl.DateTimeFormat(
      locale,
      { dateStyle: 'medium' },
    ).format(value);
  },
  formatTime(value, locale) {
    return new Intl.DateTimeFormat(
      locale,
      { timeStyle: 'short' },
    ).format(value);
  },
  formatList(values, locale) {
    return new Intl.ListFormat(
      locale,
      { style: 'long', type: 'conjunction' },
    ).format(values);
  },
};

export function interpolate(
  template: string,
  values: Readonly<Record<string, unknown>>,
): string {
  return template.replace(/\{([^}]+)\}/g, (_match, rawKey: string) => {
    const value = values[rawKey];
    return stringifyInterpolationValue(value) ?? `{${rawKey}}`;
  });
}

function stringifyInterpolationValue(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  if (value === null) return 'null';
  if (typeof value === 'string') return value;
  if (
    typeof value === 'number'
    || typeof value === 'boolean'
    || typeof value === 'bigint'
  ) {
    return String(value);
  }
  if (typeof value === 'symbol') {
    return value.description ?? '';
  }
  return JSON.stringify(value);
}
