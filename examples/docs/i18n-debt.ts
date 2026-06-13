import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { posix as posixPath } from 'node:path';
import ts from 'typescript';
import { parse as parseYaml } from 'yaml';
import { DEFAULT_LOCALE, DOGFOOD_LOCALE_OPTIONS } from './locale.js';

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

export interface DogfoodI18nDebtSourceExclusion {
  readonly path: string;
  readonly reason: string;
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

export interface DogfoodMarkdownLocalizationDocument {
  readonly surface: string;
  readonly path: string;
  readonly line: number;
  readonly column: number;
  readonly reader: 'readMarkdownDoc' | 'readMarkdownDocExcerpt';
}

export interface DogfoodMarkdownLocalizationEntry {
  readonly surface: string;
  readonly path: string;
  readonly locale: string;
  readonly line: number;
  readonly column: number;
  readonly candidates: readonly string[];
}

export interface DogfoodMarkdownLocalizationLocaleCount {
  readonly locale: string;
  readonly count: number;
}

export interface DogfoodMarkdownLocalizationInventory {
  readonly documents: readonly DogfoodMarkdownLocalizationDocument[];
  readonly entries: readonly DogfoodMarkdownLocalizationEntry[];
  readonly byLocale: readonly DogfoodMarkdownLocalizationLocaleCount[];
  readonly total: number;
}

export interface DogfoodMarkdownLocalizationBaseline {
  readonly total: number;
  readonly byLocale: Readonly<Record<string, number>>;
}

export interface DogfoodMarkdownLocalizationRatchetResult {
  readonly ok: boolean;
  readonly total: number;
  readonly baseline: DogfoodMarkdownLocalizationBaseline;
  readonly violations: readonly string[];
}

interface DogfoodMarkdownLocalizationSpec {
  readonly sourceLocale?: string;
  readonly locales?: readonly string[];
  readonly localizedPaths: Readonly<Record<string, string>>;
}

type DogfoodMarkdownFileReader = (path: string) => string;

const DOGFOOD_I18N_DEBT_ROOT = 'examples/docs';

export const DOGFOOD_I18N_DEBT_SOURCE_EXCLUSIONS: readonly DogfoodI18nDebtSourceExclusion[] = Object.freeze([
  {
    path: 'examples/docs/i18n-debt.ts',
    reason: 'localization debt scanner implementation, not a DOGFOOD product surface',
  },
]);

const DOGFOOD_I18N_DEBT_SURFACE_NAMES: Readonly<Record<string, string>> = Object.freeze({
  'examples/docs/app.ts': 'docs-app',
  'examples/docs/locale.ts': 'dogfood-locale',
  'examples/docs/stories.ts': 'component-stories',
  'examples/docs/storybook-app.ts': 'storybook-app',
  'examples/docs/storybook-workstation.ts': 'storybook-workstation',
  'examples/docs/storybook.ts': 'storybook-entrypoint',
});

export function discoverDogfoodI18nDebtSources(
  options: {
    readonly rootPath?: string;
    readonly paths?: readonly string[];
  } = {},
): readonly DogfoodI18nDebtSource[] {
  const rootPath = options.rootPath ?? DOGFOOD_I18N_DEBT_ROOT;
  const excludedPaths = new Set(DOGFOOD_I18N_DEBT_SOURCE_EXCLUSIONS.map((entry) => entry.path));
  const paths = options.paths ?? listRepoTypescriptFiles(rootPath);
  return Object.freeze(paths
    .filter((path) => path.startsWith(`${rootPath}/`))
    .filter((path) => /\.tsx?$/.test(path) && !/\.d\.ts$/.test(path))
    .filter((path) => !excludedPaths.has(path))
    .sort()
    .map((path) => Object.freeze({
      surface: dogfoodI18nDebtSurface(path, rootPath),
      path,
    })));
}

export const DOGFOOD_I18N_DEBT_SOURCES: readonly DogfoodI18nDebtSource[] = discoverDogfoodI18nDebtSources();

export const DOGFOOD_I18N_DEBT_BASELINE: DogfoodI18nDebtBaseline = Object.freeze({
  total: 2772,
  bySurface: Object.freeze({
    'capture-main': 17,
    'component-stories': 1631,
    'counter-block-demo': 56,
    coverage: 1,
    'docs-app': 258,
    'dogfood-blocks': 681,
    'dogfood-locale': 12,
    'dogfood-shell-themes': 6,
    'i18n-dogfood-authoring': 1,
    'i18n-dogfood-catalog': 3,
    'i18n-missing-localization': 3,
    localization: 1,
    'node-locale': 7,
    'release-title': 44,
    'storybook-app': 37,
    'storybook-workstation': 7,
    'svg-raster': 2,
    'terminal-guard': 5,
  }),
});

export const DOGFOOD_MARKDOWN_LOCALIZATION_BASELINE: DogfoodMarkdownLocalizationBaseline = Object.freeze({
  total: 78,
  byLocale: Object.freeze({
    fr: 26,
    es: 26,
    de: 26,
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
  'colorMode',
  'coverageFamilyIds',
  'family',
  'familyId',
  'fit',
  'bg',
  'fg',
  'hex',
  'id',
  'ids',
  'importPath',
  'key',
  'kind',
  'align',
  'mode',
  'modifiers',
  'namespace',
  'overflowX',
  'packageName',
  'path',
  'pipeFormat',
  'renderer',
  'sourceLocale',
  'scrollbarMode',
  'supportsModes',
  'tags',
  'tone',
  'type',
  'variant',
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

export function collectDogfoodMarkdownLocalizationDebt(
  options: {
    readonly sources?: readonly DogfoodI18nDebtSource[];
    readonly locales?: readonly string[];
    readonly defaultLocale?: string;
    readonly fileExists?: (path: string) => boolean;
    readonly readFile?: DogfoodMarkdownFileReader;
    readonly templateValues?: Readonly<Record<string, string>>;
  } = {},
): DogfoodMarkdownLocalizationInventory {
  const sources = options.sources ?? DOGFOOD_I18N_DEBT_SOURCES;
  const locales = options.locales ?? DOGFOOD_LOCALE_OPTIONS.map((option) => option.id);
  const defaultLocale = options.defaultLocale ?? DEFAULT_LOCALE.id;
  const targetLocales = locales.filter((locale) => locale !== defaultLocale);
  const fileExists = options.fileExists ?? repoFileExists;
  const readFile = options.readFile ?? readRepoFile;
  const templateValues = options.templateValues ?? defaultMarkdownTemplateValues();
  const documents = uniqueMarkdownDocuments(sources.flatMap((source) => (
    collectDogfoodMarkdownDocuments(source, templateValues, readFile)
  )));
  const entries: DogfoodMarkdownLocalizationEntry[] = [];

  for (const document of documents) {
    const localization = readDogfoodMarkdownLocalizationSpec(document.path, readFile);
    const sourceLocale = localization?.sourceLocale ?? defaultLocale;
    const documentLocales = uniqueStringList(localization?.locales ?? locales).filter((locale) => locale !== sourceLocale);
    for (const locale of documentLocales) {
      const candidates = localizedMarkdownCandidatePaths(document.path, locale, localization?.localizedPaths[locale]);
      if (candidates.some((candidate) => fileExists(candidate))) continue;
      entries.push(Object.freeze({
        surface: document.surface,
        path: document.path,
        locale,
        line: document.line,
        column: document.column,
        candidates: Object.freeze(candidates),
      }));
    }
  }

  const localeOrder = uniqueStringList([...targetLocales, ...entries.map((entry) => entry.locale)]);
  const byLocale = localeOrder
    .map((locale) => ({
      locale,
      count: entries.filter((entry) => entry.locale === locale).length,
    }))
    .filter((entry) => entry.count > 0);

  return freezeMarkdownLocalizationInventory({
    documents,
    entries,
    byLocale,
    total: entries.length,
  });
}

function listRepoTypescriptFiles(rootPath: string): readonly string[] {
  const files: string[] = [];

  function visit(repoPath: string): void {
    for (const entry of readdirSync(repoUrl(repoPath), { withFileTypes: true })) {
      const entryPath = posixPath.join(repoPath, entry.name);
      if (entry.isDirectory()) {
        visit(entryPath);
        continue;
      }
      if (entry.isFile() && /\.tsx?$/.test(entry.name) && !/\.d\.ts$/.test(entry.name)) {
        files.push(entryPath);
      }
    }
  }

  visit(rootPath);
  return Object.freeze(files.sort());
}

function dogfoodI18nDebtSurface(path: string, rootPath: string): string {
  const explicit = DOGFOOD_I18N_DEBT_SURFACE_NAMES[path];
  if (explicit != null) return explicit;
  return path
    .slice(rootPath.length + 1)
    .replace(/\.tsx?$/, '')
    .replaceAll('/', '-');
}

export function evaluateDogfoodMarkdownLocalizationRatchet(
  inventory: DogfoodMarkdownLocalizationInventory,
  baseline: DogfoodMarkdownLocalizationBaseline = DOGFOOD_MARKDOWN_LOCALIZATION_BASELINE,
): DogfoodMarkdownLocalizationRatchetResult {
  const violations: string[] = [];
  if (inventory.total > baseline.total) {
    violations.push(`markdown total ${inventory.total} exceeds baseline ${baseline.total}`);
  }

  for (const locale of inventory.byLocale) {
    const baselineCount = baseline.byLocale[locale.locale] ?? 0;
    if (locale.count > baselineCount) {
      violations.push(`markdown ${locale.locale} ${locale.count} exceeds baseline ${baselineCount}`);
    }
  }

  return Object.freeze({
    ok: violations.length === 0,
    total: inventory.total,
    baseline,
    violations: Object.freeze(violations),
  });
}

export function assertDogfoodMarkdownLocalizationRatchet(
  inventory: DogfoodMarkdownLocalizationInventory,
  baseline: DogfoodMarkdownLocalizationBaseline = DOGFOOD_MARKDOWN_LOCALIZATION_BASELINE,
): DogfoodMarkdownLocalizationRatchetResult {
  const result = evaluateDogfoodMarkdownLocalizationRatchet(inventory, baseline);
  if (!result.ok) {
    throw new Error(`DOGFOOD Markdown localization ratchet failed: ${result.violations.join('; ')}`);
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

function collectDogfoodMarkdownDocuments(
  source: DogfoodI18nDebtSource,
  templateValues: Readonly<Record<string, string>>,
  readFile: DogfoodMarkdownFileReader,
): readonly DogfoodMarkdownLocalizationDocument[] {
  const text = source.text ?? readFile(source.path);
  const sourceFile = ts.createSourceFile(source.path, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const documents: DogfoodMarkdownLocalizationDocument[] = [];

  function visit(node: ts.Node): void {
    if (ts.isCallExpression(node)) {
      const callName = callExpressionName(node, sourceFile);
      if (callName === 'readMarkdownDoc' || callName === 'readMarkdownDocExcerpt') {
        const rawPath = markdownPathArgumentText(node.arguments[0], sourceFile, templateValues);
        if (rawPath != null && rawPath.endsWith('.md')) {
          const position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
          documents.push(Object.freeze({
            surface: source.surface,
            path: resolveRepoRelativeMarkdownPath(source.path, rawPath),
            line: position.line + 1,
            column: position.character + 1,
            reader: callName,
          }));
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return documents;
}

function markdownPathArgumentText(
  node: ts.Node | undefined,
  sourceFile: ts.SourceFile,
  templateValues: Readonly<Record<string, string>>,
): string | undefined {
  if (node == null) return undefined;
  if (ts.isStringLiteralLike(node)) return node.text;
  if (ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (!ts.isTemplateExpression(node)) return undefined;

  let value = node.head.text;
  for (const span of node.templateSpans) {
    const key = span.expression.getText(sourceFile);
    const replacement = templateValues[key];
    if (replacement == null) return undefined;
    value += replacement;
    value += span.literal.text;
  }
  return value;
}

function uniqueMarkdownDocuments(
  documents: readonly DogfoodMarkdownLocalizationDocument[],
): readonly DogfoodMarkdownLocalizationDocument[] {
  const seen = new Map<string, DogfoodMarkdownLocalizationDocument>();
  for (const document of documents) {
    const key = `${document.surface}:${document.path}`;
    if (seen.has(key)) continue;
    seen.set(key, document);
  }
  return Object.freeze([...seen.values()].sort((left, right) => (
    left.surface.localeCompare(right.surface)
    || left.path.localeCompare(right.path)
    || left.line - right.line
    || left.column - right.column
  )));
}

function resolveRepoRelativeMarkdownPath(sourcePath: string, rawPath: string): string {
  return posixPath.normalize(posixPath.join(posixPath.dirname(sourcePath), rawPath));
}

function localizedMarkdownCandidatePaths(
  sourcePath: string,
  locale: string,
  explicitPath?: string,
): readonly string[] {
  const parsed = posixPath.parse(sourcePath);
  return uniqueStringList([
    ...(explicitPath == null ? [] : [resolveRepoRelativeMarkdownPath(sourcePath, explicitPath)]),
    posixPath.join(parsed.dir, `${parsed.name}.${locale}${parsed.ext}`),
    posixPath.join(parsed.dir, locale, parsed.base),
  ]);
}

function readDogfoodMarkdownLocalizationSpec(
  sourcePath: string,
  readFile: DogfoodMarkdownFileReader,
): DogfoodMarkdownLocalizationSpec | undefined {
  let text: string;
  try {
    text = readFile(sourcePath);
  } catch {
    return undefined;
  }

  const yaml = markdownFrontmatterYaml(text);
  if (yaml == null) return undefined;
  const root = objectValue(parseYaml(yaml));
  const dogfood = objectValue(root?.dogfood);
  const localization = objectValue(dogfood?.localization);
  if (localization == null) return undefined;

  return Object.freeze({
    sourceLocale: stringValue(localization.sourceLocale),
    locales: stringListValue(localization.locales),
    localizedPaths: Object.freeze(localizedPathMapValue(localization.localized)),
  });
}

function markdownFrontmatterYaml(text: string): string | undefined {
  const withoutBom = text.replace(/^\uFEFF/, '');
  const opening = withoutBom.match(/^---\r?\n/);
  if (opening == null) return undefined;
  const bodyStart = opening[0].length;
  const body = withoutBom.slice(bodyStart);
  const closingIndex = body.search(/\r?\n---[ \t]*(?:\r?\n|$)/);
  if (closingIndex === -1) return undefined;
  return body.slice(0, closingIndex);
}

function localizedPathMapValue(value: unknown): Record<string, string> {
  const paths: Record<string, string> = {};
  const localized = objectValue(value);
  if (localized == null) return paths;

  for (const [locale, rawPath] of Object.entries(localized)) {
    const path = localizedPathValue(rawPath);
    if (path == null) continue;
    paths[locale] = path;
  }

  return paths;
}

function localizedPathValue(value: unknown): string | undefined {
  const direct = stringValue(value);
  if (direct != null) return direct;
  return stringValue(objectValue(value)?.path);
}

function stringListValue(value: unknown): readonly string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const strings = value.map((entry) => stringValue(entry)).filter((entry): entry is string => entry != null);
  return strings.length === 0 ? undefined : uniqueStringList(strings);
}

function stringValue(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const text = value.trim();
  return text === '' ? undefined : text;
}

function objectValue(value: unknown): Record<string, unknown> | undefined {
  if (typeof value !== 'object' || value == null || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
}

function uniqueStringList(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values)]);
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
  if (/^#[0-9a-f]{3,8}$/i.test(value)) return undefined;
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
  if (isThemeTokenFamilyIdentifier(node)) return true;

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
    if (callName === 'themeTokenRecordEntries' && argumentIndex === 0) return true;
    if (callName != null && PATH_FUNCTIONS.has(callName)) return true;
    if (call.expression.kind === ts.SyntaxKind.ImportKeyword) return true;
  }

  return false;
}

function isThemeTokenFamilyIdentifier(node: ts.Node): boolean {
  if (!ts.isStringLiteralLike(node)) return false;
  if (!['semantic', 'surface', 'border', 'ui', 'status', 'gradient'].includes(node.text)) return false;

  for (let current: ts.Node | undefined = node.parent; current != null; current = current.parent) {
    if (!ts.isArrayLiteralExpression(current)) continue;
    const expression = expressionUsedByParent(current);
    return ts.isForOfStatement(expression.parent)
      && expression.parent.expression === expression
      && isInsideNamedFunction(expression.parent, 'themePaletteRows');
  }

  return false;
}

function isInsideNamedFunction(node: ts.Node, name: string): boolean {
  for (let current: ts.Node | undefined = node.parent; current != null; current = current.parent) {
    if (ts.isFunctionDeclaration(current) && current.name?.text === name) return true;
    if (
      (ts.isFunctionExpression(current) || ts.isArrowFunction(current))
      && ts.isVariableDeclaration(current.parent)
      && ts.isIdentifier(current.parent.name)
      && current.parent.name.text === name
    ) {
      return true;
    }
  }
  return false;
}

function expressionUsedByParent(node: ts.Expression): ts.Expression {
  let current = node;
  while (
    (ts.isAsExpression(current.parent) || ts.isTypeAssertionExpression(current.parent))
    && current.parent.expression === current
  ) {
    current = current.parent;
  }
  return current;
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
  return readFileSync(repoUrl(path), 'utf8');
}

function repoFileExists(path: string): boolean {
  return existsSync(repoUrl(path));
}

function repoUrl(path: string): URL {
  return new URL(`../../${path}`, import.meta.url);
}

function defaultMarkdownTemplateValues(): Readonly<Record<string, string>> {
  const packageJson = JSON.parse(readRepoFile('packages/bijou/package.json')) as { readonly version?: string };
  return Object.freeze({
    BIJOU_VERSION: packageJson.version ?? '',
  });
}

function freezeInventory(inventory: DogfoodI18nDebtInventory): DogfoodI18nDebtInventory {
  return Object.freeze({
    entries: Object.freeze(inventory.entries.map((entry) => Object.freeze({ ...entry }))),
    bySurface: Object.freeze(inventory.bySurface.map((entry) => Object.freeze({ ...entry }))),
    total: inventory.total,
  });
}

function freezeMarkdownLocalizationInventory(
  inventory: DogfoodMarkdownLocalizationInventory,
): DogfoodMarkdownLocalizationInventory {
  return Object.freeze({
    documents: Object.freeze(inventory.documents.map((document) => Object.freeze({ ...document }))),
    entries: Object.freeze(inventory.entries.map((entry) => Object.freeze({
      ...entry,
      candidates: Object.freeze([...entry.candidates]),
    }))),
    byLocale: Object.freeze(inventory.byLocale.map((entry) => Object.freeze({ ...entry }))),
    total: inventory.total,
  });
}
