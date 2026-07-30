import type { I18nFormatterPort } from './runtime-contract.js';

const numberFormatters = new Map<string, Intl.NumberFormat>();
const listFormatters = new Map<string, Intl.ListFormat>();

export const DEFAULT_FORMATTER: I18nFormatterPort = {
  formatNumber(value, locale) {
    return cachedFormatter(
      numberFormatters,
      locale,
      () => new Intl.NumberFormat(locale),
    ).format(value);
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
    return cachedFormatter(
      listFormatters,
      locale,
      () => new Intl.ListFormat(
        locale,
        { style: 'long', type: 'conjunction' },
      ),
    ).format(values);
  },
};

function cachedFormatter<T>(
  cache: Map<string, T>,
  locale: string,
  create: () => T,
): T {
  let formatter = cache.get(locale);
  if (formatter === undefined) {
    formatter = create();
    cache.set(locale, formatter);
  }
  return formatter;
}

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
