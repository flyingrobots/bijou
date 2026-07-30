import { readdirSync } from 'node:fs';
import { posix as posixPath } from 'node:path';
import ts from 'typescript';
import type {
  DogfoodI18nDebtSource,
} from './i18n-debt-contract.js';
import { repoUrl } from './i18n-debt-io.js';
import { DOGFOOD_I18N_DEBT_SOURCE_EXCLUSIONS } from './i18n-debt-source-exclusions.js';
const DOGFOOD_I18N_DEBT_ROOT = 'examples/docs';

export { DOGFOOD_I18N_DEBT_SOURCE_EXCLUSIONS } from './i18n-debt-source-exclusions.js';

const SURFACE_NAMES: Readonly<Record<string, string>> = {
  'examples/docs/app.ts': 'docs-app',
  'examples/docs/locale.ts': 'dogfood-locale',
  'examples/docs/stories.ts': 'component-stories',
  'examples/docs/storybook-app.ts': 'storybook-app',
  'examples/docs/storybook-workstation.ts': 'storybook-workstation',
  'examples/docs/storybook.ts': 'storybook-entrypoint',
};

export function discoverDogfoodI18nDebtSources(
  options: {
    readonly rootPath?: string;
    readonly paths?: readonly string[];
  } = {},
): readonly DogfoodI18nDebtSource[] {
  const rootPath = options.rootPath ?? DOGFOOD_I18N_DEBT_ROOT;
  const excludedPaths = new Set(
    DOGFOOD_I18N_DEBT_SOURCE_EXCLUSIONS.map((entry) => entry.path),
  );
  const paths = options.paths ?? listRepoTypescriptFiles(rootPath);
  return Object.freeze(
    paths
      .filter((path) => path.startsWith(`${rootPath}/`))
      .filter(isTypescriptSource)
      .filter((path) => !excludedPaths.has(path))
      .sort()
      .map((path) =>
        Object.freeze({ surface: surfaceName(path, rootPath), path }),
      ),
  );
}

export const DOGFOOD_I18N_DEBT_SOURCES: readonly DogfoodI18nDebtSource[] = discoverDogfoodI18nDebtSources();
function listRepoTypescriptFiles(rootPath: string): readonly string[] {
  const files: string[] = [];
  function visit(repoPath: string): void {
    for (const entry of readdirSync(repoUrl(repoPath), { withFileTypes: true })) {
      const entryPath = posixPath.join(repoPath, entry.name);
      if (entry.isDirectory()) {
        visit(entryPath);
      } else if (entry.isFile() && isTypescriptSource(entry.name)) {
        files.push(entryPath);
      }
    }
  }
  visit(rootPath);
  return Object.freeze(files.sort());
}

function isTypescriptSource(path: string): boolean {
  return path.endsWith('.tsx')
    || (path.endsWith('.ts') && !path.endsWith('.d.ts'));
}

function surfaceName(path: string, rootPath: string): string {
  const explicit = SURFACE_NAMES[path];
  if (explicit != null) return explicit;
  return path.slice(rootPath.length + 1)
    .replace(/(\.part\d+)?\.tsx?$/, '').replaceAll('/', '-');
}

export function isThemeTokenFamilyIdentifier(node: ts.Node): boolean {
  const families = ['semantic', 'surface', 'border', 'ui', 'status', 'gradient'];
  if (!ts.isStringLiteralLike(node) || !families.includes(node.text)) {
    return false;
  }
  for (let current = node.parent; !ts.isSourceFile(current); current = current.parent) {
    if (!ts.isArrayLiteralExpression(current)) continue;
    const expression = expressionUsedByParent(current);
    return (
      ts.isForOfStatement(expression.parent) &&
      expression.parent.expression === expression &&
      isInsideNamedFunction(expression.parent, 'themePaletteRows')
    );
  }
  return false;
}

function expressionUsedByParent(node: ts.Expression): ts.Expression {
  let current = node;
  while (
    (ts.isAsExpression(current.parent) ||
      ts.isTypeAssertionExpression(current.parent)) &&
    current.parent.expression === current
  ) {
    current = current.parent;
  }
  return current;
}

function isInsideNamedFunction(node: ts.Node, name: string): boolean {
  for (let current = node.parent; !ts.isSourceFile(current); current = current.parent) {
    if (ts.isFunctionDeclaration(current) && current.name?.text === name) {
      return true;
    }
    if (
      (ts.isFunctionExpression(current) || ts.isArrowFunction(current)) &&
      ts.isVariableDeclaration(current.parent) &&
      ts.isIdentifier(current.parent.name) &&
      current.parent.name.text === name
    ) {
      return true;
    }
  }
  return false;
}
