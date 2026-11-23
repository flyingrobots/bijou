import {
  createRuntimeLocalizationPort,
  type LocalizationPort,
} from '../../packages/bijou-i18n/src/index.js';
import { createDocsI18nRuntime } from './app-i18n-runtime.js';
import type { DocsAppOptions } from './app-model.js';

/** Resolves a localization port for a DOGFOOD locale other than the active one. */
export type DocsLocaleLocalization = (locale: string) => LocalizationPort;

/**
 * Builds localization ports for locales the app is about to switch to, such as
 * the language-change notice, which must speak the language being chosen.
 *
 * Each port loads the same catalogs as the app, including `extraI18nCatalogs`
 * and the missing-localization markers, and is created once per locale.
 */
export function createDocsLocaleLocalization(
  options: DocsAppOptions = {},
): DocsLocaleLocalization {
  const ports = new Map<string, LocalizationPort>();
  return (locale) => {
    const cached = ports.get(locale);
    if (cached !== undefined) return cached;
    const port = createRuntimeLocalizationPort(
      createDocsI18nRuntime({ ...options, locale }),
    );
    ports.set(locale, port);
    return port;
  };
}
