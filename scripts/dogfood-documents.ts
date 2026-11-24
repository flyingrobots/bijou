import { createHash } from 'node:crypto';
import { collectDogfoodMarkdownDocuments, localizedMarkdownCandidatePaths } from '../examples/docs/i18n-debt-markdown-discovery.js';
import { defaultMarkdownTemplateValues, readRepoFile, repoFileExists } from '../examples/docs/i18n-debt-io.js';
import { readDogfoodMarkdownLocalizationSpec } from '../examples/docs/i18n-debt-markdown-spec.js';
import { DOGFOOD_I18N_DEBT_SOURCES } from '../examples/docs/i18n-debt-sources.js';
import { DEFAULT_LOCALE, DOGFOOD_LOCALE_OPTIONS } from '../examples/docs/locale.js';

/**
 * The documents DOGFOOD reads, by repository-relative key. Every static
 * `readMarkdownDoc('<literal>')` call site comes from the localization
 * inventory's own discovery; each is joined by the translations of it that
 * exist, which the guides pick by locale, and by the one document
 * `coverage.ts` reads.
 */
const COVERAGE_DOCUMENT = 'docs/design-system/component-families.md';

export function discoveredDocumentKeys(): readonly string[] {
  const templateValues = defaultMarkdownTemplateValues();
  const keys = new Set<string>([COVERAGE_DOCUMENT]);
  const locales = DOGFOOD_LOCALE_OPTIONS.map((option) => option.id).filter((id) => id !== DEFAULT_LOCALE.id);
  for (const source of DOGFOOD_I18N_DEBT_SOURCES) {
    for (const document of collectDogfoodMarkdownDocuments(source, templateValues, readRepoFile)) {
      keys.add(document.path);
      const spec = readDogfoodMarkdownLocalizationSpec(document.path, readRepoFile);
      for (const locale of locales) {
        for (const path of localizedMarkdownCandidatePaths(document.path, locale, spec?.localizedPaths[locale])) {
          if (repoFileExists(path)) keys.add(path);
        }
      }
    }
  }
  return [...keys].sort();
}

/** key → exact text, read the way the Node adapter reads it. */
export function documentTable(): Readonly<Record<string, string>> {
  return Object.fromEntries(discoveredDocumentKeys().map((key) => [key, readRepoFile(key)]));
}

/** key → SHA-256 of the text, recorded at generation time. */
export function documentDigests(table: Readonly<Record<string, string>>): Readonly<Record<string, string>> {
  return Object.fromEntries(Object.entries(table).map(([key, text]) => [key, createHash('sha256').update(text).digest('hex')]));
}
