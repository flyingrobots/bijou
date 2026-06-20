import type { DogfoodI18nDebtInventory } from './i18n-debt.js';

export interface DogfoodTouchedI18nDebtResult {
  readonly ok: boolean;
  readonly touchedPaths: readonly string[];
  readonly violations: readonly string[];
}

export interface DogfoodTouchedI18nDebtLineage {
  readonly rootPath: string;
  readonly childPaths: readonly string[];
}

export const DOGFOOD_I18N_DEBT_SPLIT_LINEAGES: readonly DogfoodTouchedI18nDebtLineage[] = Object.freeze([
  {
    rootPath: 'examples/docs/dogfood-blocks.ts',
    childPaths: Object.freeze([
      'examples/docs/dogfood-block-command-palette.ts',
      'examples/docs/dogfood-block-common.ts',
      'examples/docs/dogfood-block-docs-surface-data.ts',
      'examples/docs/dogfood-block-docs-surface-parser.ts',
      'examples/docs/dogfood-block-docs-surface-render.ts',
      'examples/docs/dogfood-block-docs-surface-schema.ts',
      'examples/docs/dogfood-block-docs-surface.ts',
      'examples/docs/dogfood-block-documentation-article.ts',
      'examples/docs/dogfood-block-footer-hint.ts',
      'examples/docs/dogfood-block-guide-inspector-render.ts',
      'examples/docs/dogfood-block-guide-inspector.ts',
      'examples/docs/dogfood-block-help-overlay.ts',
      'examples/docs/dogfood-block-navigation-list-render.ts',
      'examples/docs/dogfood-block-navigation-list.ts',
      'examples/docs/dogfood-block-notification-center.ts',
      'examples/docs/dogfood-block-perf-hud.ts',
      'examples/docs/dogfood-block-preview.ts',
      'examples/docs/dogfood-block-registry-entries.ts',
      'examples/docs/dogfood-block-registry-entry.ts',
      'examples/docs/dogfood-block-registry.ts',
      'examples/docs/dogfood-block-schema-utils.ts',
      'examples/docs/dogfood-block-search-panel-render.ts',
      'examples/docs/dogfood-block-search-panel.ts',
      'examples/docs/dogfood-block-settings-menu-render.ts',
      'examples/docs/dogfood-block-settings-menu.ts',
      'examples/docs/dogfood-block-text.ts',
      'examples/docs/dogfood-block-title-screen.ts',
      'examples/docs/dogfood-block-workbench-render.ts',
      'examples/docs/dogfood-block-workbench.ts',
    ]),
  },
]);

export function evaluateDogfoodTouchedI18nDebt(
  inventory: DogfoodI18nDebtInventory,
  touchedPaths: readonly string[],
  baseInventory?: DogfoodI18nDebtInventory,
  lineages: readonly DogfoodTouchedI18nDebtLineage[] = DOGFOOD_I18N_DEBT_SPLIT_LINEAGES,
): DogfoodTouchedI18nDebtResult {
  const touched = new Set(touchedPaths);
  const currentCounts = debtCountsByPath(inventory);
  const baseCounts = baseInventory === undefined ? undefined : debtCountsByPath(baseInventory);
  const handledPaths = new Set<string>();
  const lineageViolations = baseCounts === undefined
    ? []
    : touchedLineageViolations(lineages, touched, currentCounts, baseCounts, handledPaths);
  const violations = [...touched].flatMap((path) => {
    if (handledPaths.has(path)) return [];
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
    ok: lineageViolations.length === 0 && violations.length === 0,
    touchedPaths: Object.freeze([...touched].sort()),
    violations: Object.freeze([...lineageViolations, ...violations]),
  });
}

function touchedLineageViolations(
  lineages: readonly DogfoodTouchedI18nDebtLineage[],
  touched: ReadonlySet<string>,
  currentCounts: ReadonlyMap<string, number>,
  baseCounts: ReadonlyMap<string, number>,
  handledPaths: Set<string>,
): readonly string[] {
  const violations: string[] = [];
  for (const lineage of lineages) {
    const paths = [lineage.rootPath, ...lineage.childPaths];
    const rootBaseCount = baseCounts.get(lineage.rootPath) ?? 0;
    const activeExtraction = rootBaseCount > 0
      && paths.some((path) => touched.has(path) && (baseCounts.get(path) ?? 0) === 0);
    if (!activeExtraction) continue;

    paths.forEach((path) => handledPaths.add(path));
    const currentCount = sumDebtCounts(paths, currentCounts);
    if (currentCount === 0) continue;

    const baseCount = sumDebtCounts(paths, baseCounts);
    if (currentCount < baseCount) continue;

    violations.push(
      `DOGFOOD i18n split lineage ${lineage.rootPath} has ${String(currentCount)} raw string debt entries across extracted files; expected fewer than base ${String(baseCount)}`,
    );
  }
  return violations;
}

function sumDebtCounts(paths: readonly string[], counts: ReadonlyMap<string, number>): number {
  return paths.reduce((total, path) => total + (counts.get(path) ?? 0), 0);
}

function debtCountsByPath(inventory: DogfoodI18nDebtInventory): ReadonlyMap<string, number> {
  const counts = new Map<string, number>();
  for (const entry of inventory.entries) {
    counts.set(entry.path, (counts.get(entry.path) ?? 0) + 1);
  }
  return counts;
}
