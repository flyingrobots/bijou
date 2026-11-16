import type { DogfoodI18nDebtInventory } from './i18n-debt.js';
import type { DogfoodTouchedI18nDebtLineage } from './i18n-debt-lineages.js';
import { canonicalDogfoodDebtPath } from './i18n-debt-touched-path.js';

/**
 * Change-scoped half of the DL-037 rule: a touched file (or split lineage) may
 * not introduce raw visible-copy values that its base did not already carry.
 * Modified copy appears as a new value, so it must be localized too.
 */
export function addedRawStringViolations(
  inventory: DogfoodI18nDebtInventory,
  baseInventory: DogfoodI18nDebtInventory,
  touched: ReadonlySet<string>,
  lineages: readonly DogfoodTouchedI18nDebtLineage[],
): readonly string[] {
  const groupOf = new Map<string, string>();
  for (const lineage of lineages) {
    for (const path of [lineage.rootPath, ...lineage.childPaths]) groupOf.set(path, lineage.rootPath);
  }
  const groupFor = (path: string): string => groupOf.get(path) ?? path;
  const baseValues = valuesByGroup(baseInventory, groupFor);
  const touchedGroups = new Set([...touched].map(groupFor));
  const violations: string[] = [];
  for (const [group, values] of valuesByGroup(inventory, groupFor)) {
    const base = baseValues.get(group);
    if (!touchedGroups.has(group) || base === undefined) continue;
    const remaining = new Map<string, number>();
    for (const value of base) remaining.set(value, (remaining.get(value) ?? 0) + 1);
    for (const value of values) {
      const left = remaining.get(value) ?? 0;
      if (left > 0) {
        remaining.set(value, left - 1);
        continue;
      }
      violations.push(
        `touched DOGFOOD source ${group} adds raw string ${JSON.stringify(value)}; localize added or modified copy`,
      );
    }
  }
  return violations;
}

function valuesByGroup(
  inventory: DogfoodI18nDebtInventory,
  groupFor: (path: string) => string,
): ReadonlyMap<string, readonly string[]> {
  const groups = new Map<string, string[]>();
  for (const entry of inventory.entries) {
    const group = groupFor(canonicalDogfoodDebtPath(entry.path));
    const values = groups.get(group) ?? [];
    values.push(entry.value);
    groups.set(group, values);
  }
  return groups;
}
