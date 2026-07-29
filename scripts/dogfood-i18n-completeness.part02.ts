import { DOGFOOD_LOCALE_OPTIONS } from '../examples/docs/locale.js';
import { dogfoodStringTable } from '../examples/docs/i18n/dogfood-authoring.js';
import { type StringTable } from '../packages/bijou-i18n-tools/src/index.js';
import {
  type DogfoodI18nCompletenessIO,
  type DogfoodI18nMissingTranslationBaseline,
  type DogfoodI18nMissingTranslationRatchetResult,
  DEFAULT_BASE_REF,
  DOGFOOD_I18N_MISSING_TRANSLATION_BASELINE,
  evaluateDogfoodI18nCompleteness,
  s,
} from './dogfood-i18n-completeness.part01.js';
import { readBaseStringTable } from './dogfood-i18n-completeness.part03.js';

export function evaluateDogfoodI18nMissingTranslationRatchet(options: {
  readonly table: StringTable;
  readonly locales?: readonly string[];
  readonly baseline?: DogfoodI18nMissingTranslationBaseline;
}): DogfoodI18nMissingTranslationRatchetResult {
  const baseline =
    options.baseline ?? DOGFOOD_I18N_MISSING_TRANSLATION_BASELINE;
  const locales =
    options.locales ?? DOGFOOD_LOCALE_OPTIONS.map((locale) => locale.id);
  const completeness = evaluateDogfoodI18nCompleteness({
    table: options.table,
    locales,
  });
  const byLocale = locales
    .map((locale) => ({
      locale,
      count: completeness.issues.filter((issue) => issue.locale === locale)
        .length,
    }))
    .filter((entry) => entry.count > 0);
  const total = byLocale.reduce((sum, entry) => sum + entry.count, 0);
  const violations: string[] = [];

  if (total > baseline.total) {
    violations.push(
      `missing translations ${s(total)} exceeds baseline ${s(baseline.total)}`,
    );
  }

  for (const locale of byLocale) {
    const baselineCount = baseline.byLocale[locale.locale] ?? 0;
    if (locale.count > baselineCount) {
      violations.push(
        `missing translations ${locale.locale} ${s(locale.count)} exceeds baseline ${s(baselineCount)}`,
      );
    }
  }

  return Object.freeze({
    ok: violations.length === 0,
    total,
    byLocale: Object.freeze(byLocale),
    baseline,
    violations: Object.freeze(violations),
  });
}
export function runDogfoodI18nCompleteness(
  io: DogfoodI18nCompletenessIO = {},
): number {
  const args = io.args ?? process.argv.slice(2);
  const stdout = io.stdout ?? ((text: string) => process.stdout.write(text));
  const stderr = io.stderr ?? ((text: string) => process.stderr.write(text));
  if (args.includes('--help')) {
    stdout(
      [
        'Usage: npm run dogfood:i18n:complete [-- --base <ref> | --all]',
        '',
        'Checks DOGFOOD localization rows changed relative to a git base ref.',
        'Every changed source string must have current values for all supported locales.',
        '',
      ].join('\n'),
    );
    return 0;
  }

  try {
    const table = io.table ?? dogfoodStringTable();
    const baseTable =
      io.baseTable ??
      (args.includes('--all')
        ? undefined
        : readBaseStringTable(baseRefFromArgs(args)));
    const result = evaluateDogfoodI18nCompleteness({
      table,
      baseTable,
      locales: io.locales,
    });
    const missingResult = evaluateDogfoodI18nMissingTranslationRatchet({
      table,
      locales: io.locales,
    });
    if (result.ok && missingResult.ok) {
      stdout(
        `dogfood-i18n-completeness: ok (${s(result.checked)} changed localization keys; ${s(missingResult.total)} missing translations; baseline ${s(missingResult.baseline.total)})\n`,
      );
      return 0;
    }

    stderr(
      [
        `dogfood-i18n-completeness: failed (${s(result.checked)} changed localization keys; ${s(result.issues.length)} issues; ${s(missingResult.total)} missing translations; baseline ${s(missingResult.baseline.total)})`,
        ...result.issues.map(
          (entry) =>
            `- ${entry.namespace}:${entry.id} [${entry.locale}] ${entry.reason}`,
        ),
        ...missingResult.violations.map((violation) => `- ${violation}`),
        '',
      ].join('\n'),
    );
    return 1;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    stderr(`dogfood-i18n-completeness: ${message}\n`);
    return 1;
  }
}
export function baseRefFromArgs(args: readonly string[]): string {
  const explicitBaseIndex = args.indexOf('--base');
  if (explicitBaseIndex >= 0 && args[explicitBaseIndex + 1] === undefined) {
    throw new Error('missing value for --base');
  }
  const explicitBase =
    explicitBaseIndex >= 0 ? args[explicitBaseIndex + 1] : undefined;
  return explicitBase ?? process.env.DOGFOOD_I18N_BASE_REF ?? DEFAULT_BASE_REF;
}
