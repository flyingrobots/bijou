import type { DogfoodI18nDebtSourceExclusion } from './i18n-debt-contract.js';

const IMPLEMENTATION_REASON =
  'localization debt scanner implementation, not a DOGFOOD product surface';
const IMPLEMENTATION_PATHS = [
  'examples/docs/i18n-debt.ts',
  'examples/docs/i18n-debt-contract.ts',
  'examples/docs/i18n-debt-lineage-contract.ts',
  'examples/docs/i18n-debt-lineage-stories.ts',
  'examples/docs/i18n-debt-lineages.ts',
  'examples/docs/i18n-debt-source-exclusions.ts',
  'examples/docs/i18n-debt-sources.ts',
  'examples/docs/i18n-debt-ratchet.ts',
  'examples/docs/i18n-debt-source-scan.ts',
  'examples/docs/i18n-debt-source-context.ts',
  'examples/docs/i18n-debt-markdown-discovery.ts',
  'examples/docs/i18n-debt-markdown-spec.ts',
  'examples/docs/i18n-debt-markdown-ratchet.ts',
  'examples/docs/i18n-debt-io.ts',
] as const;

export const DOGFOOD_I18N_DEBT_SOURCE_EXCLUSIONS: readonly DogfoodI18nDebtSourceExclusion[] =
  Object.freeze([
    ...IMPLEMENTATION_PATHS.map((path) =>
      Object.freeze({ path, reason: IMPLEMENTATION_REASON }),
    ),
    exclusion(
      'examples/docs/i18n-debt-baseline.ts',
      'localization debt baseline data, not a DOGFOOD product surface',
    ),
    exclusion(
      'examples/docs/i18n-debt-baseline-stories.ts',
      'localization debt baseline data, not a DOGFOOD product surface',
    ),
    exclusion(
      'examples/docs/i18n-debt-touched.ts',
      'localization touched-file ratchet implementation, not a DOGFOOD product surface',
    ),
  ]);

function exclusion(
  path: string,
  reason: string,
): DogfoodI18nDebtSourceExclusion {
  return Object.freeze({ path, reason });
}
