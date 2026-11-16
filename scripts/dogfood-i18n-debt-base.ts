import {
  collectDogfoodI18nDebt,
  discoverDogfoodI18nDebtSources,
  type DogfoodI18nDebtInventory,
} from '../examples/docs/i18n-debt.js';
import { DOGFOOD_I18N_DEBT_SPLIT_LINEAGES } from '../examples/docs/i18n-debt-lineages.js';
import { canonicalDogfoodDebtPath } from '../examples/docs/i18n-debt-touched-path.js';

export function collectBaseDogfoodI18nDebt(
  baseRef: string,
  changedPaths: readonly string[],
  runGit: (args: readonly string[]) => string,
): DogfoodI18nDebtInventory {
  const comparisonRef = mergeBaseFor(baseRef, runGit) ?? baseRef;
  const paths = comparisonPaths(comparisonRef, changedPaths, runGit);
  const sources = discoverDogfoodI18nDebtSources({ paths }).flatMap((source) => {
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

/** Read matching base groups; the current inventory already contains every sibling. */
function comparisonPaths(
  comparisonRef: string,
  changedPaths: readonly string[],
  runGit: (args: readonly string[]) => string,
): readonly string[] {
  const groupOf = new Map<string, string>();
  for (const lineage of DOGFOOD_I18N_DEBT_SPLIT_LINEAGES) {
    for (const path of [lineage.rootPath, ...lineage.childPaths]) {
      groupOf.set(canonicalDogfoodDebtPath(path), lineage.rootPath);
    }
  }
  const groupFor = (path: string): string => {
    const canonical = canonicalDogfoodDebtPath(path);
    return groupOf.get(canonical) ?? canonical;
  };
  const groups = new Set(changedPaths.map(groupFor));
  let basePaths: readonly string[];
  try {
    basePaths = runGit(['ls-tree', '-r', '--name-only', comparisonRef, '--', 'examples/docs'])
      .split('\n').filter((path) => path.length > 0);
  } catch {
    // Preserve the existing missing-base fallback: individual show calls below
    // determine which touched sources have historical content available.
    basePaths = [];
  }
  return [...new Set([...changedPaths, ...basePaths.filter((path) => groups.has(groupFor(path)))])];
}

function mergeBaseFor(baseRef: string, runGit: (args: readonly string[]) => string): string | undefined {
  try {
    return runGit(['merge-base', 'HEAD', baseRef]).trim() || baseRef;
  } catch {
    return undefined;
  }
}
