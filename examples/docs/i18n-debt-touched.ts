import type { DogfoodI18nDebtInventory } from './i18n-debt.js';

export interface DogfoodTouchedI18nDebtResult {
  readonly ok: boolean;
  readonly touchedPaths: readonly string[];
  readonly violations: readonly string[];
}

export function evaluateDogfoodTouchedI18nDebt(
  inventory: DogfoodI18nDebtInventory,
  touchedPaths: readonly string[],
  baseInventory?: DogfoodI18nDebtInventory,
): DogfoodTouchedI18nDebtResult {
  const touched = new Set(touchedPaths);
  const currentCounts = debtCountsByPath(inventory);
  const baseCounts = baseInventory === undefined ? undefined : debtCountsByPath(baseInventory);
  const violations = [...touched].flatMap((path) => {
    const currentCount = currentCounts.get(path) ?? 0;
    if (currentCount === 0) return [];
    if (baseCounts === undefined) {
      return [`touched DOGFOOD source ${path} has ${String(currentCount)} raw string debt entr${currentCount === 1 ? 'y' : 'ies'}`];
    }

    const baseCount = baseCounts.get(path) ?? 0;
    if (currentCount < baseCount) return [];
    if (baseCount === 0) {
      return [`new DOGFOOD source ${path} has ${String(currentCount)} raw string debt entr${currentCount === 1 ? 'y' : 'ies'}`];
    }
    return [`touched DOGFOOD source ${path} has ${String(currentCount)} raw string debt entries; expected fewer than base ${String(baseCount)}`];
  });

  return Object.freeze({
    ok: violations.length === 0,
    touchedPaths: Object.freeze([...touched].sort()),
    violations: Object.freeze(violations),
  });
}

function debtCountsByPath(inventory: DogfoodI18nDebtInventory): ReadonlyMap<string, number> {
  const counts = new Map<string, number>();
  for (const entry of inventory.entries) {
    counts.set(entry.path, (counts.get(entry.path) ?? 0) + 1);
  }
  return counts;
}
