import type {
  DogfoodI18nDebtSource,
  DogfoodMarkdownFileReader,
  DogfoodMarkdownLocalizationBaseline,
  DogfoodMarkdownLocalizationEntry,
  DogfoodMarkdownLocalizationInventory,
  DogfoodMarkdownLocalizationRatchetResult,
} from './i18n-debt-contract.js';
import {
  collectDogfoodMarkdownDocuments,
  localizedMarkdownCandidatePaths,
  uniqueMarkdownDocuments,
} from './i18n-debt-markdown-discovery.js';
import { readDogfoodMarkdownLocalizationSpec } from './i18n-debt-markdown-spec.js';
import {
  defaultMarkdownTemplateValues,
  freezeMarkdownLocalizationInventory,
  readRepoFile,
  repoFileExists,
  uniqueStringList,
} from './i18n-debt-io.js';
import { DOGFOOD_I18N_DEBT_SOURCES } from './i18n-debt-sources.js';
import { DEFAULT_LOCALE, DOGFOOD_LOCALE_OPTIONS } from './locale.js';

export const DOGFOOD_MARKDOWN_LOCALIZATION_BASELINE: DogfoodMarkdownLocalizationBaseline =
  Object.freeze({
    total: 78,
    byLocale: Object.freeze({ fr: 26, es: 26, de: 26 }),
  });

export function collectDogfoodMarkdownLocalizationDebt(
  options: {
    readonly sources?: readonly DogfoodI18nDebtSource[];
    readonly locales?: readonly string[];
    readonly defaultLocale?: string;
    readonly fileExists?: (path: string) => boolean;
    readonly readFile?: DogfoodMarkdownFileReader;
    readonly templateValues?: Readonly<Record<string, string>>;
  } = {},
): DogfoodMarkdownLocalizationInventory {
  const sources = options.sources ?? DOGFOOD_I18N_DEBT_SOURCES;
  const locales =
    options.locales ??
    DOGFOOD_LOCALE_OPTIONS.map((option) => option.id);
  const defaultLocale = options.defaultLocale ?? DEFAULT_LOCALE.id;
  const targetLocales = locales.filter(
    (locale) => locale !== defaultLocale,
  );
  const fileExists = options.fileExists ?? repoFileExists;
  const readFile = options.readFile ?? readRepoFile;
  const templateValues =
    options.templateValues ?? defaultMarkdownTemplateValues();
  const documents = uniqueMarkdownDocuments(
    sources.flatMap((source) =>
      collectDogfoodMarkdownDocuments(source, templateValues, readFile),
    ),
  );
  const entries: DogfoodMarkdownLocalizationEntry[] = [];
  for (const document of documents) {
    const spec = readDogfoodMarkdownLocalizationSpec(
      document.path,
      readFile,
    );
    const sourceLocale = spec?.sourceLocale ?? defaultLocale;
    const documentLocales = uniqueStringList(
      spec?.locales ?? locales,
    ).filter((locale) => locale !== sourceLocale);
    for (const locale of documentLocales) {
      const candidates = localizedMarkdownCandidatePaths(
        document.path,
        locale,
        spec?.localizedPaths[locale],
      );
      if (candidates.some((candidate) => fileExists(candidate))) continue;
      entries.push(
        Object.freeze({
          surface: document.surface,
          path: document.path,
          locale,
          line: document.line,
          column: document.column,
          candidates: Object.freeze(candidates),
        }),
      );
    }
  }
  const localeOrder = uniqueStringList([
    ...targetLocales,
    ...entries.map((entry) => entry.locale),
  ]);
  const byLocale = localeOrder
    .map((locale) => ({
      locale,
      count: entries.filter((entry) => entry.locale === locale).length,
    }))
    .filter((entry) => entry.count > 0);
  return freezeMarkdownLocalizationInventory({
    documents,
    entries,
    byLocale,
    total: entries.length,
  });
}

export function evaluateDogfoodMarkdownLocalizationRatchet(
  inventory: DogfoodMarkdownLocalizationInventory,
  baseline: DogfoodMarkdownLocalizationBaseline =
    DOGFOOD_MARKDOWN_LOCALIZATION_BASELINE,
): DogfoodMarkdownLocalizationRatchetResult {
  const violations: string[] = [];
  if (inventory.total > baseline.total) {
    violations.push(
      `markdown total ${String(inventory.total)} exceeds baseline ${String(baseline.total)}`,
    );
  }
  for (const locale of inventory.byLocale) {
    const limit = baseline.byLocale[locale.locale] ?? 0;
    if (locale.count > limit) {
      violations.push(
        `markdown ${locale.locale} ${String(locale.count)} exceeds baseline ${String(limit)}`,
      );
    }
  }
  return Object.freeze({
    ok: violations.length === 0,
    total: inventory.total,
    baseline,
    violations: Object.freeze(violations),
  });
}

export function assertDogfoodMarkdownLocalizationRatchet(
  inventory: DogfoodMarkdownLocalizationInventory,
  baseline: DogfoodMarkdownLocalizationBaseline =
    DOGFOOD_MARKDOWN_LOCALIZATION_BASELINE,
): DogfoodMarkdownLocalizationRatchetResult {
  const result = evaluateDogfoodMarkdownLocalizationRatchet(
    inventory,
    baseline,
  );
  if (!result.ok) {
    throw new Error(
      `DOGFOOD Markdown localization ratchet failed: ${result.violations.join('; ')}`,
    );
  }
  return result;
}
