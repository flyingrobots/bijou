import { readFileSync } from 'node:fs';
import ts from 'typescript';

export interface DogfoodI18nDebtSource {
  readonly surface: string;
  readonly path: string;
  readonly text?: string;
}

export interface DogfoodI18nDebtEntry {
  readonly surface: string;
  readonly path: string;
  readonly line: number;
  readonly column: number;
  readonly value: string;
}

export interface DogfoodI18nDebtSurfaceCount {
  readonly surface: string;
  readonly count: number;
}

export interface DogfoodI18nDebtInventory {
  readonly entries: readonly DogfoodI18nDebtEntry[];
  readonly bySurface: readonly DogfoodI18nDebtSurfaceCount[];
  readonly total: number;
}

export interface DogfoodI18nDebtBaseline {
  readonly total: number;
  readonly bySurface: Readonly<Record<string, number>>;
}

export interface DogfoodI18nDebtRatchetResult {
  readonly ok: boolean;
  readonly total: number;
  readonly baseline: DogfoodI18nDebtBaseline;
  readonly violations: readonly string[];
}

export const DOGFOOD_I18N_DEBT_SOURCES: readonly DogfoodI18nDebtSource[] = Object.freeze([
  { surface: 'docs-app', path: 'examples/docs/app.ts' },
  { surface: 'dogfood-locale', path: 'examples/docs/locale.ts' },
  { surface: 'component-stories', path: 'examples/docs/stories.ts' },
  { surface: 'storybook-app', path: 'examples/docs/storybook-app.ts' },
  { surface: 'storybook-workstation', path: 'examples/docs/storybook-workstation.ts' },
  { surface: 'storybook-entrypoint', path: 'examples/docs/storybook.ts' },
]);

export const DOGFOOD_I18N_DEBT_BASELINE: DogfoodI18nDebtBaseline = Object.freeze({
  total: 2219,
  bySurface: Object.freeze({
    'component-stories': 1753,
    'docs-app': 404,
    'dogfood-locale': 12,
    'storybook-app': 38,
    'storybook-workstation': 12,
  }),
});

const LOCALIZED_MESSAGE_FUNCTIONS = new Set(['dogfoodMessage']);
const LOCALIZED_FALLBACK_FUNCTIONS = new Set(['dogfoodText', 'shellText']);
const PATH_FUNCTIONS = new Set([
  'readMarkdownDoc',
  'readMarkdownDocExcerpt',
  'readFileSync',
]);
const NONLOCALIZABLE_PROPERTY_NAMES = new Set([
  'aliases',
  'command',
  'coverageFamilyIds',
  'family',
  'familyId',
  'id',
  'ids',
  'importPath',
  'key',
  'kind',
  'mode',
  'namespace',
  'overflowX',
  'packageName',
  'path',
  'sourceLocale',
  'supportsModes',
  'tags',
  'tone',
  'type',
  'version',
]);

export function collectDogfoodI18nDebt(
  options: { readonly sources?: readonly DogfoodI18nDebtSource[] } = {},
): DogfoodI18nDebtInventory {
  const sources = options.sources ?? DOGFOOD_I18N_DEBT_SOURCES;
  const entries = sources.flatMap((source) => collectDogfoodSourceDebt(source));
  const bySurface = sources
    .map((source) => ({
      surface: source.surface,
      count: entries.filter((entry) => entry.surface === source.surface).length,
    }))
    .filter((entry) => entry.count > 0);

  return freezeInventory({
    entries,
    bySurface,
    total: entries.length,
  });
}

export function evaluateDogfoodI18nDebtRatchet(
  inventory: DogfoodI18nDebtInventory,
  baseline: DogfoodI18nDebtBaseline = DOGFOOD_I18N_DEBT_BASELINE,
): DogfoodI18nDebtRatchetResult {
  const violations: string[] = [];
  if (inventory.total > baseline.total) {
    violations.push(`total ${inventory.total} exceeds baseline ${baseline.total}`);
  }

  for (const surface of inventory.bySurface) {
    const baselineCount = baseline.bySurface[surface.surface] ?? 0;
    if (surface.count > baselineCount) {
      violations.push(`${surface.surface} ${surface.count} exceeds baseline ${baselineCount}`);
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
    throw new Error(`DOGFOOD i18n debt ratchet failed: ${result.violations.join('; ')}`);
  }
  return result;
}

function collectDogfoodSourceDebt(source: DogfoodI18nDebtSource): readonly DogfoodI18nDebtEntry[] {
  const text = source.text ?? readRepoFile(source.path);
  const sourceFile = ts.createSourceFile(source.path, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const entries: DogfoodI18nDebtEntry[] = [];

  function visit(node: ts.Node): void {
    if (ts.isStringLiteralLike(node)) {
      maybeAddEntry(source, sourceFile, node, node.text, entries);
      return;
    }
    if (ts.isTemplateExpression(node)) {
      maybeAddEntry(source, sourceFile, node.head, node.head.text, entries);
      for (const span of node.templateSpans) {
        maybeAddEntry(source, sourceFile, span.literal, span.literal.text, entries);
      }
      return;
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return entries.sort((left, right) => (
    left.path.localeCompare(right.path)
    || left.line - right.line
    || left.column - right.column
    || left.value.localeCompare(right.value)
  ));
}

function maybeAddEntry(
  source: DogfoodI18nDebtSource,
  sourceFile: ts.SourceFile,
  node: ts.Node,
  rawValue: string,
  entries: DogfoodI18nDebtEntry[],
): void {
  const value = normalizeLocalizableText(rawValue);
  if (value == null) return;
  if (isNonlocalizableContext(node, sourceFile)) return;

  const position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  entries.push(Object.freeze({
    surface: source.surface,
    path: source.path,
    line: position.line + 1,
    column: position.character + 1,
    value,
  }));
}

function normalizeLocalizableText(rawValue: string): string | undefined {
  const value = rawValue.replace(/\s+/g, ' ').trim();
  if (value === '') return undefined;
  if (!/[A-Za-z]/.test(value)) return undefined;
  if (/^--[a-z0-9-]+$/i.test(value)) return undefined;
  if (value.startsWith('.') || value.startsWith('/')) return undefined;
  if (value.startsWith('@')) return undefined;
  if (/\.(gif|js|json|md|tape|ts|txt)$/i.test(value)) return undefined;
  if (/^[a-z0-9._:/-]+$/i.test(value) && /[._:/-]/.test(value)) return undefined;
  return value;
}

function isNonlocalizableContext(node: ts.Node, sourceFile: ts.SourceFile): boolean {
  if (hasAncestor(node, isImportOrExportDeclaration)) return true;
  if (hasAncestor(node, ts.isLiteralTypeNode)) return true;
  if (hasAncestor(node, (ancestor) => ts.isNoSubstitutionTemplateLiteral(ancestor) && ts.isLiteralTypeNode(ancestor.parent))) {
    return true;
  }
  if (hasAncestor(node, (ancestor) => isNodeEnvComparison(ancestor, sourceFile))) return true;
  if (isCaseClauseExpression(node)) return true;
  if (isDiscriminantComparison(node)) return true;
  if (isErrorConstructorArgument(node)) return true;
  if (hasAncestor(node, (ancestor) => isOutputModeDeclaration(ancestor, sourceFile))) return true;

  const propertyName = nearestPropertyName(node);
  if (propertyName != null && NONLOCALIZABLE_PROPERTY_NAMES.has(propertyName)) return true;

  const call = nearestCallExpression(node);
  if (call != null) {
    const callName = callExpressionName(call, sourceFile);
    const argumentIndex = call.arguments.findIndex((argument) => argument === node || containsNode(argument, node));

    if (callName != null && LOCALIZED_MESSAGE_FUNCTIONS.has(callName)) return true;
    if (callName != null && LOCALIZED_FALLBACK_FUNCTIONS.has(callName) && (argumentIndex === 1 || argumentIndex === 2)) {
      return true;
    }
    if (callName === 'bind' && argumentIndex === 0) return true;
    if (callName != null && PATH_FUNCTIONS.has(callName)) return true;
    if (call.expression.kind === ts.SyntaxKind.ImportKeyword) return true;
  }

  return false;
}

function nearestPropertyName(node: ts.Node): string | undefined {
  for (let current: ts.Node | undefined = node.parent; current != null; current = current.parent) {
    if (ts.isPropertyAssignment(current)) {
      if (ts.isIdentifier(current.name) || ts.isStringLiteral(current.name) || ts.isNumericLiteral(current.name)) {
        return current.name.text;
      }
      return undefined;
    }
  }
  return undefined;
}

function nearestCallExpression(node: ts.Node): ts.CallExpression | undefined {
  for (let current: ts.Node | undefined = node.parent; current != null; current = current.parent) {
    if (ts.isCallExpression(current)) return current;
  }
  return undefined;
}

function callExpressionName(call: ts.CallExpression, sourceFile: ts.SourceFile): string | undefined {
  if (ts.isIdentifier(call.expression)) return call.expression.text;
  if (ts.isPropertyAccessExpression(call.expression)) return call.expression.name.text;
  return call.expression.getText(sourceFile);
}

function isNodeEnvComparison(node: ts.Node, sourceFile: ts.SourceFile): boolean {
  if (!ts.isBinaryExpression(node)) return false;
  if (
    node.operatorToken.kind !== ts.SyntaxKind.EqualsEqualsEqualsToken
    && node.operatorToken.kind !== ts.SyntaxKind.ExclamationEqualsEqualsToken
  ) {
    return false;
  }
  return node.left.getText(sourceFile) === 'process.env.NODE_ENV'
    || node.right.getText(sourceFile) === 'process.env.NODE_ENV';
}

function isCaseClauseExpression(node: ts.Node): boolean {
  return ts.isCaseClause(node.parent) && node.parent.expression === node;
}

function isDiscriminantComparison(node: ts.Node): boolean {
  if (!ts.isBinaryExpression(node.parent)) return false;
  const binary = node.parent;
  if (
    binary.operatorToken.kind !== ts.SyntaxKind.EqualsEqualsEqualsToken
    && binary.operatorToken.kind !== ts.SyntaxKind.ExclamationEqualsEqualsToken
  ) {
    return false;
  }

  const otherSide = binary.left === node ? binary.right : binary.right === node ? binary.left : undefined;
  return otherSide != null && ts.isPropertyAccessExpression(otherSide) && isDiscriminantProperty(otherSide.name.text);
}

function isDiscriminantProperty(name: string): boolean {
  return name === 'action'
    || name === 'kind'
    || name === 'mode'
    || name === 'status'
    || name === 'type';
}

function isErrorConstructorArgument(node: ts.Node): boolean {
  for (let current: ts.Node | undefined = node.parent; current != null; current = current.parent) {
    if (!ts.isNewExpression(current)) continue;
    if (current.expression.getText() !== 'Error') continue;
    return current.arguments?.some((argument) => argument === node || containsNode(argument, node)) ?? false;
  }
  return false;
}

function isOutputModeDeclaration(node: ts.Node, sourceFile: ts.SourceFile): boolean {
  if (!ts.isVariableDeclaration(node) || node.type == null) return false;
  return node.type.getText(sourceFile).includes('OutputMode');
}

function containsNode(parent: ts.Node, target: ts.Node): boolean {
  let found = false;
  parent.forEachChild((child) => {
    if (child === target || containsNode(child, target)) {
      found = true;
    }
  });
  return found;
}

function hasAncestor(node: ts.Node, predicate: (ancestor: ts.Node) => boolean): boolean {
  for (let current: ts.Node | undefined = node.parent; current != null; current = current.parent) {
    if (predicate(current)) return true;
  }
  return false;
}

function isImportOrExportDeclaration(node: ts.Node): boolean {
  return ts.isImportDeclaration(node)
    || ts.isImportEqualsDeclaration(node)
    || ts.isExportDeclaration(node)
    || ts.isExternalModuleReference(node);
}

function readRepoFile(path: string): string {
  return readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
}

function freezeInventory(inventory: DogfoodI18nDebtInventory): DogfoodI18nDebtInventory {
  return Object.freeze({
    entries: Object.freeze(inventory.entries.map((entry) => Object.freeze({ ...entry }))),
    bySurface: Object.freeze(inventory.bySurface.map((entry) => Object.freeze({ ...entry }))),
    total: inventory.total,
  });
}
