import { DOGFOOD_LOCALE_OPTIONS } from '../examples/docs/locale.js';
import {
  type StringTable,
  type StringTableRow,
} from '../packages/bijou-i18n-tools/src/index.js';
import {
  entrySignature,
  indexStringTable,
  issue,
} from './dogfood-i18n-completeness.part03.js';

export interface DogfoodI18nCompletenessIssue {
  readonly namespace: string;
  readonly id: string;
  readonly locale: string;
  readonly reason: string;
}
export interface DogfoodI18nCompletenessResult {
  readonly ok: boolean;
  readonly checked: number;
  readonly issues: readonly DogfoodI18nCompletenessIssue[];
}
export interface DogfoodI18nMissingTranslationBaseline {
  readonly total: number;
  readonly byLocale: Readonly<Record<string, number>>;
}
export interface DogfoodI18nMissingTranslationLocaleCount {
  readonly locale: string;
  readonly count: number;
}
export interface DogfoodI18nMissingTranslationRatchetResult {
  readonly ok: boolean;
  readonly total: number;
  readonly byLocale: readonly DogfoodI18nMissingTranslationLocaleCount[];
  readonly baseline: DogfoodI18nMissingTranslationBaseline;
  readonly violations: readonly string[];
}
export interface DogfoodI18nCompletenessOptions {
  readonly table: StringTable;
  readonly baseTable?: StringTable;
  readonly locales?: readonly string[];
}
export interface DogfoodI18nCompletenessIO {
  readonly args?: readonly string[];
  readonly table?: StringTable;
  readonly baseTable?: StringTable;
  readonly locales?: readonly string[];
  readonly stdout?: (text: string) => void;
  readonly stderr?: (text: string) => void;
}
export interface IndexedEntry {
  readonly source: StringTableRow;
  readonly rowsByLocale: ReadonlyMap<string, StringTableRow>;
}
export const DEFAULT_BASE_REF = 'origin/main';
export const s = String;
export const DOGFOOD_I18N_MISSING_TRANSLATION_BASELINE: DogfoodI18nMissingTranslationBaseline =
  Object.freeze({
    total: 432,
    byLocale: Object.freeze({
      fr: 144,
      es: 144,
      de: 144,
    }),
  });
export function evaluateDogfoodI18nCompleteness(
  options: DogfoodI18nCompletenessOptions,
): DogfoodI18nCompletenessResult {
  const locales =
    options.locales ?? DOGFOOD_LOCALE_OPTIONS.map((locale) => locale.id);
  const currentEntries = indexStringTable(options.table);
  const baseEntries =
    options.baseTable === undefined
      ? undefined
      : indexStringTable(options.baseTable);
  const changedKeys = [...currentEntries.entries()]
    .filter(([key, entry]) => {
      const baseEntry = baseEntries?.get(key);
      return (
        baseEntry === undefined ||
        entrySignature(entry, locales) !== entrySignature(baseEntry, locales)
      );
    })
    .map(([key]) => key)
    .sort((left, right) => left.localeCompare(right));

  const issues: DogfoodI18nCompletenessIssue[] = [];
  for (const key of changedKeys) {
    const entry = currentEntries.get(key);
    if (entry === undefined) continue;
    for (const locale of locales) {
      const row = entry.rowsByLocale.get(locale);
      if (row === undefined) {
        issues.push(issue(entry.source, locale, 'missing locale row'));
        continue;
      }
      if (row.status !== 'current') {
        issues.push(issue(entry.source, locale, `status is ${row.status}`));
        continue;
      }
      if (row.valueKind === '') {
        issues.push(issue(entry.source, locale, 'missing value kind'));
        continue;
      }
      if (row.value === '') {
        issues.push(issue(entry.source, locale, 'missing value'));
      }
    }
  }

  return Object.freeze({
    ok: issues.length === 0,
    checked: changedKeys.length,
    issues: Object.freeze(issues),
  });
}
