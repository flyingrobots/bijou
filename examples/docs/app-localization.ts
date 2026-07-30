import type {
  Cmd,
} from '../../packages/bijou-tui/src/index.js';
import { FRAME_I18N_CATALOG } from '../../packages/bijou-tui/src/index.js';
import type {
  I18nRuntime,
  LocalizationPort,
} from '../../packages/bijou-i18n/src/index.js';
import {
  DEFAULT_LOCALE,
  dogfoodLocaleLabel,
  dogfoodLocaleOptionsText,
  resolveDogfoodLocale,
} from './locale.js';
import {
  DOGFOOD_I18N_NAMESPACE,
  dogfoodI18nCatalogsForLocale,
} from './i18n/dogfood-catalog.js';
import { dogfoodLocalizedText, localizedText } from './localization.js';
import type { DocsAppOptions, ExplorerMsg } from './app-model.js';

export function shellText(
  localization: LocalizationPort | undefined,
  id: string,
  fallback: string,
  values: Readonly<Record<string, unknown>> = {},
): string {
  return localizedText(
    localization,
    FRAME_I18N_CATALOG.namespace,
    id,
    fallback,
    values,
  );
}

export function dogfoodText(
  localization: LocalizationPort | undefined,
  id: string,
  fallback: string,
  values: Readonly<Record<string, unknown>> = {},
): string {
  return dogfoodLocalizedText(localization, id, fallback, values);
}

export function applyDogfoodLocale(
  i18n: I18nRuntime,
  options: Pick<DocsAppOptions, 'direction' | 'extraI18nCatalogs'>,
  locale: string,
): Promise<string> {
  const resolved = resolveDogfoodLocale(locale);
  loadDogfoodRuntimeCatalogs(
    i18n,
    resolved.id,
    options.extraI18nCatalogs ?? [],
  );
  return i18n
    .setLocale(resolved.id, options.direction ?? resolved.direction)
    .then(() => resolved.id);
}

export function activateDogfoodLocale(
  i18n: I18nRuntime,
  options: Pick<
    DocsAppOptions,
    'direction' | 'extraI18nCatalogs' | 'localePort'
  >,
  locale: string,
): Cmd<ExplorerMsg> {
  return async () => {
    const activatedLocale = await applyDogfoodLocale(i18n, options, locale);
    try {
      await options.localePort?.savePreferredLocale?.(activatedLocale);
    } catch {
      // Preference persistence is best-effort; the activated runtime locale wins.
    }
    return { type: 'locale-activated', locale: activatedLocale };
  };
}

export function loadDogfoodRuntimeCatalogs(
  i18n: I18nRuntime,
  locale: string,
  extraCatalogs: DocsAppOptions['extraI18nCatalogs'] = [],
): void {
  i18n.unloadCatalog(DOGFOOD_I18N_NAMESPACE);
  if (locale !== DEFAULT_LOCALE.id) {
    for (const catalog of dogfoodI18nCatalogsForLocale(locale)) {
      i18n.loadCatalog(catalog);
    }
  }
  for (const catalog of extraCatalogs) i18n.loadCatalog(catalog);
}

export function shouldShowMissingLocalizationMarkers(
  options: Pick<DocsAppOptions, 'showMissingLocalizationMarkers'>,
): boolean {
  return options.showMissingLocalizationMarkers ?? false;
}

export function dogfoodLocaleSettingDescription(
  currentLocale: string,
  localization?: LocalizationPort,
): string {
  return dogfoodText(
    localization,
    'settings.language.description',
    'Current language: {language}. Options: {options}.',
    {
      language: dogfoodLocaleLabel(currentLocale, localization),
      options: dogfoodLocaleOptionsText(localization),
    },
  );
}
