import { FRAME_I18N_CATALOG } from '../../packages/bijou-tui/src/index.js';
import {
  createI18nRuntime,
  type I18nRuntime,
} from '../../packages/bijou-i18n/src/index.js';
import {
  DEFAULT_LOCALE,
  resolveDogfoodInitialLocale,
  resolveDogfoodRuntimeLocale,
} from './locale.js';
import { dogfoodMissingLocalizationMessage } from './i18n/missing-localization.js';
import { dogfoodI18nCatalogsForLocale } from './i18n/dogfood-catalog.js';
import {
  loadDogfoodRuntimeCatalogs,
  shouldShowMissingLocalizationMarkers,
} from './app-localization.js';
import type { DocsAppOptions } from './app-model.js';

export function createDocsI18nRuntime(
  options: DocsAppOptions = {},
): I18nRuntime {
  const initialLocale = resolveDogfoodInitialLocale(options);
  const showMissing =
    shouldShowMissingLocalizationMarkers(options);
  const runtime = createI18nRuntime({
    locale: resolveDogfoodRuntimeLocale(options),
    direction: options.direction ?? initialLocale.direction,
    fallbackLocale: DEFAULT_LOCALE.id,
    fallbackCatalogs: dogfoodI18nCatalogsForLocale(
      DEFAULT_LOCALE.id,
    ),
    missingMessage: showMissing
      ? dogfoodMissingLocalizationMessage
      : undefined,
  });
  runtime.loadCatalog(FRAME_I18N_CATALOG);
  loadDogfoodRuntimeCatalogs(
    runtime,
    initialLocale.id,
    options.extraI18nCatalogs ?? [],
  );
  return runtime;
}
