import {
  collectDogfoodI18nDebt,
  discoverDogfoodI18nDebtSources,
  type DogfoodI18nDebtInventory,
} from '../examples/docs/i18n-debt.js';

export function collectBaseDogfoodI18nDebt(
  baseRef: string,
  changedPaths: readonly string[],
  runGit: (args: readonly string[]) => string,
): DogfoodI18nDebtInventory {
  const comparisonRef = mergeBaseFor(baseRef, runGit) ?? baseRef;
  const sources = discoverDogfoodI18nDebtSources({ paths: changedPaths }).flatMap((source) => {
    try {
      return [{
        ...source,
        text: runGit(['show', `${comparisonRef}:${source.path}`]),
      }];
    } catch {
      return [];
    }
  });
  return collectDogfoodI18nDebt({ sources });
}

function mergeBaseFor(baseRef: string, runGit: (args: readonly string[]) => string): string | undefined {
  try {
    return runGit(['merge-base', 'HEAD', baseRef]).trim() || baseRef;
  } catch {
    return undefined;
  }
}
