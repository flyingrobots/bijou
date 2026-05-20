import type { I18nDirection, I18nRuntime } from '../../packages/bijou-i18n/src/index.js';

export interface DogfoodLocalePort {
  preferredLocale(): string | undefined;
}

export interface DogfoodLocaleOption {
  readonly id: string;
  readonly label: string;
  readonly nativeLabel: string;
  readonly direction: I18nDirection;
  readonly aliases: readonly string[];
}

export const DOGFOOD_LOCALE_OPTIONS: readonly DogfoodLocaleOption[] = Object.freeze([
  {
    id: 'en',
    label: 'English',
    nativeLabel: 'English',
    direction: 'ltr',
    aliases: Object.freeze(['en', 'en-us', 'en-gb']),
  },
  {
    id: 'fr',
    label: 'French',
    nativeLabel: 'Français',
    direction: 'ltr',
    aliases: Object.freeze(['fr', 'fr-fr', 'fr-ca']),
  },
  {
    id: 'es',
    label: 'Spanish',
    nativeLabel: 'Español',
    direction: 'ltr',
    aliases: Object.freeze(['es', 'es-es', 'es-mx']),
  },
  {
    id: 'de',
    label: 'German',
    nativeLabel: 'Deutsch',
    direction: 'ltr',
    aliases: Object.freeze(['de', 'de-de', 'de-at']),
  },
] satisfies readonly DogfoodLocaleOption[]);

const DEFAULT_LOCALE = DOGFOOD_LOCALE_OPTIONS[0]!;

export function normalizeDogfoodLocaleTag(locale: string | undefined): string | undefined {
  const trimmed = locale?.trim();
  if (trimmed == null || trimmed === '') return undefined;
  return trimmed
    .split(':')[0]!
    .replace(/[._].*$/, '')
    .replace(/_/g, '-')
    .toLowerCase();
}

function findDogfoodLocale(locale: string | undefined): DogfoodLocaleOption | undefined {
  const normalized = normalizeDogfoodLocaleTag(locale);
  if (normalized == null) return undefined;
  const primary = normalized.split('-')[0]!;
  return DOGFOOD_LOCALE_OPTIONS.find((option) => (
    option.id === normalized
    || option.aliases.includes(normalized)
    || option.id === primary
    || option.aliases.includes(primary)
  ));
}

export function resolveDogfoodLocale(locale: string | undefined): DogfoodLocaleOption {
  return findDogfoodLocale(locale) ?? DEFAULT_LOCALE;
}

export function resolveDogfoodInitialLocale(
  options: {
    readonly locale?: string;
    readonly localePort?: DogfoodLocalePort;
  },
): DogfoodLocaleOption {
  return resolveDogfoodLocale(options.locale ?? options.localePort?.preferredLocale());
}

export function resolveDogfoodRuntimeLocale(
  options: {
    readonly locale?: string;
    readonly localePort?: DogfoodLocalePort;
  },
): string {
  if (options.locale !== undefined) {
    return findDogfoodLocale(options.locale)?.id ?? options.locale;
  }
  return resolveDogfoodInitialLocale(options).id;
}

export function nextDogfoodLocale(currentLocale: string): DogfoodLocaleOption {
  const current = resolveDogfoodLocale(currentLocale);
  const currentIndex = DOGFOOD_LOCALE_OPTIONS.findIndex((option) => option.id === current.id);
  return DOGFOOD_LOCALE_OPTIONS[(currentIndex + 1) % DOGFOOD_LOCALE_OPTIONS.length] ?? DEFAULT_LOCALE;
}

export function dogfoodLocaleLabel(locale: string, i18n?: I18nRuntime): string {
  const option = resolveDogfoodLocale(locale);
  let localizedName = option.label;
  try {
    localizedName = i18n?.t({ namespace: 'bijou.dogfood', id: `settings.language.${option.id}` }) ?? option.label;
  } catch {
    localizedName = option.label;
  }
  return localizedName === option.nativeLabel ? localizedName : `${localizedName} / ${option.nativeLabel}`;
}

export function dogfoodLocaleOptionsText(i18n?: I18nRuntime): string {
  const labels = DOGFOOD_LOCALE_OPTIONS.map((option) => dogfoodLocaleLabel(option.id, i18n));
  return i18n?.formatList(labels, i18n.locale) ?? labels.join(', ');
}
