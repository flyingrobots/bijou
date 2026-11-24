import type {
  DogfoodI18nDebtEntry,
  DogfoodI18nDebtSurfaceCount,
} from './i18n-debt-contract.js';

/**
 * Count entries per logical surface, one row per surface, in the order each
 * surface first appears. Every entry is counted under the surface it carries,
 * so a part file of an unknown surface is reported rather than dropped.
 */
export function aggregateDogfoodI18nDebtSurfaces(
  entries: readonly DogfoodI18nDebtEntry[],
): readonly DogfoodI18nDebtSurfaceCount[] {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    counts.set(entry.surface, (counts.get(entry.surface) ?? 0) + 1);
  }
  return [...counts].map(([surface, count]) => ({ surface, count }));
}
