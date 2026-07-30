import { DOGFOOD_I18N_DEBT_BASELINE } from './i18n-debt-baseline.js';
import ts from 'typescript';
import type {
  DogfoodI18nDebtBaseline,
  DogfoodI18nDebtEntry,
  DogfoodI18nDebtInventory,
  DogfoodI18nDebtRatchetResult,
  DogfoodI18nDebtSource,
} from './i18n-debt-contract.js';
import { freezeInventory, readRepoFile } from './i18n-debt-io.js';
import { maybeAddEntry } from './i18n-debt-source-scan.js';
import { DOGFOOD_I18N_DEBT_SOURCES } from './i18n-debt-sources.js';

export function collectDogfoodI18nDebt(
  options: { readonly sources?: readonly DogfoodI18nDebtSource[] } = {},
): DogfoodI18nDebtInventory {
  const sources = options.sources ?? DOGFOOD_I18N_DEBT_SOURCES;
  const entries = sources.flatMap(collectDogfoodSourceDebt);
  const bySurface = sources
    .map((source) => ({
      surface: source.surface,
      count: entries.filter(
        (entry) => entry.surface === source.surface,
      ).length,
    }))
    .filter((entry) => entry.count > 0);
  return freezeInventory({
    entries,
    bySurface,
    total: entries.length,
  });
}

function collectDogfoodSourceDebt(
  source: DogfoodI18nDebtSource,
): readonly DogfoodI18nDebtEntry[] {
  const text = source.text ?? readRepoFile(source.path);
  const sourceFile = ts.createSourceFile(
    source.path,
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const entries: DogfoodI18nDebtEntry[] = [];
  function visit(node: ts.Node): void {
    if (ts.isStringLiteralLike(node)) {
      maybeAddEntry(source, sourceFile, node, node.text, entries);
      return;
    }
    if (ts.isTemplateExpression(node)) {
      maybeAddEntry(source, sourceFile, node.head, node.head.text, entries);
      for (const span of node.templateSpans) {
        maybeAddEntry(
          source,
          sourceFile,
          span.literal,
          span.literal.text,
          entries,
        );
      }
      return;
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return entries.sort(
    (left, right) =>
      left.path.localeCompare(right.path) ||
      left.line - right.line ||
      left.column - right.column ||
      left.value.localeCompare(right.value),
  );
}

export function evaluateDogfoodI18nDebtRatchet(
  inventory: DogfoodI18nDebtInventory,
  baseline: DogfoodI18nDebtBaseline = DOGFOOD_I18N_DEBT_BASELINE,
): DogfoodI18nDebtRatchetResult {
  const violations: string[] = [];
  if (inventory.total > baseline.total) {
    violations.push(
      `total ${String(inventory.total)} exceeds baseline ${String(baseline.total)}`,
    );
  }
  for (const surface of inventory.bySurface) {
    const limit = baseline.bySurface[surface.surface] ?? 0;
    if (surface.count > limit) {
      violations.push(
        `${surface.surface} ${String(surface.count)} exceeds baseline ${String(limit)}`,
      );
    }
  }
  return Object.freeze({
    ok: violations.length === 0,
    total: inventory.total,
    baseline,
    violations: Object.freeze(violations),
  });
}

export function assertDogfoodI18nDebtRatchet(
  inventory: DogfoodI18nDebtInventory,
  baseline: DogfoodI18nDebtBaseline = DOGFOOD_I18N_DEBT_BASELINE,
): DogfoodI18nDebtRatchetResult {
  const result = evaluateDogfoodI18nDebtRatchet(inventory, baseline);
  if (!result.ok) {
    throw new Error(
      `DOGFOOD i18n debt ratchet failed: ${result.violations.join('; ')}`,
    );
  }
  return result;
}
