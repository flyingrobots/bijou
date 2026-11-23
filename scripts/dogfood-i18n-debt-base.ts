import {
  collectDogfoodI18nDebt,
  discoverDogfoodI18nDebtSources,
  type DogfoodI18nDebtInventory,
} from '../examples/docs/i18n-debt.js';
import { DOGFOOD_I18N_DEBT_SPLIT_LINEAGES, type DogfoodTouchedI18nDebtLineage } from '../examples/docs/i18n-debt-lineages.js';
import { canonicalDogfoodDebtPath } from '../examples/docs/i18n-debt-touched-path.js';

/**
 * The changed paths, plus every source file of each split lineage that one of
 * them belongs to. The touched-file rule compares a lineage as a whole,
 * because copy may move between its files, so its base must be whole too.
 */
export function withTouchedLineageFiles(
  changedPaths: readonly string[],
  lineages: readonly DogfoodTouchedI18nDebtLineage[] = DOGFOOD_I18N_DEBT_SPLIT_LINEAGES,
): readonly string[] {
  const touched = new Set(changedPaths.map(canonicalDogfoodDebtPath));
  const members = new Set(lineages
    .map((lineage) => [lineage.rootPath, ...lineage.childPaths])
    .filter((paths) => paths.some((path) => touched.has(path)))
    .flat());
  const lineageFiles = discoverDogfoodI18nDebtSources()
    .map((source) => source.path)
    .filter((path) => members.has(canonicalDogfoodDebtPath(path)));
  return [...new Set([...changedPaths, ...lineageFiles])].sort();
}

export function collectBaseDogfoodI18nDebt(
  baseRef: string,
  changedPaths: readonly string[],
  runGit: (args: readonly string[]) => string,
): DogfoodI18nDebtInventory {
  const comparisonRef = mergeBaseFor(baseRef, runGit) ?? baseRef;
  const sources = discoverDogfoodI18nDebtSources({ paths: withTouchedLineageFiles(changedPaths) }).flatMap((source) => {
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
