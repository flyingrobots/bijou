import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import ts from 'typescript';

const IGNORED_DIRECTORIES = new Set([
  '.git',
  'coverage',
  'dist',
  'node_modules',
]);

export function listProjectTypeScriptFiles(root: string): readonly string[] {
  const files: string[] = [];
  const visit = (directory: string): void => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!IGNORED_DIRECTORIES.has(entry.name)) {
          visit(resolve(directory, entry.name));
        }
        continue;
      }
      if (
        entry.isFile()
        && /\.tsx?$/u.test(entry.name)
        && !entry.name.endsWith('.d.ts')
      ) {
        files.push(resolve(directory, entry.name));
      }
    }
  };
  visit(root);
  return files.sort();
}

export function findRuntimeCyclesTouching(
  files: readonly string[],
  touchedFiles: readonly string[],
): readonly string[] {
  const candidates = new Set(files);
  const touched = new Set(touchedFiles);
  const graph = new Map(
    files.map((file) => [file, runtimeImports(file, candidates)]),
  );
  const state = new Map<string, 'active' | 'complete'>();
  const stack: string[] = [];
  const cycles: string[] = [];

  const visit = (file: string): void => {
    state.set(file, 'active');
    stack.push(file);
    for (const dependency of graph.get(file) ?? []) {
      if (state.get(dependency) === 'active') {
        const cycle = [...stack.slice(stack.indexOf(dependency)), dependency];
        if (cycle.some((item) => touched.has(item))) {
          cycles.push(cycle.join(' -> '));
        }
      } else if (state.get(dependency) == null) {
        visit(dependency);
      }
    }
    stack.pop();
    state.set(file, 'complete');
  };

  for (const file of files) {
    if (state.get(file) == null) visit(file);
  }
  return cycles;
}

function runtimeImports(
  file: string,
  candidates: ReadonlySet<string>,
): readonly string[] {
  const source = ts.createSourceFile(
    file,
    readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  );
  return source.statements.flatMap((statement) => {
    const specifier = runtimeModuleSpecifier(statement);
    if (specifier?.startsWith('.') !== true) return [];
    const base = resolve(
      dirname(file),
      specifier.replace(/\.(?:c|m)?js$/u, ''),
    );
    const target = [
      `${base}.ts`,
      `${base}.tsx`,
      resolve(base, 'index.ts'),
      resolve(base, 'index.tsx'),
    ].find((candidate) => existsSync(candidate) && candidates.has(candidate));
    return target == null ? [] : [target];
  });
}

function runtimeModuleSpecifier(statement: ts.Statement): string | undefined {
  if (ts.isImportDeclaration(statement)) {
    if (!ts.isStringLiteral(statement.moduleSpecifier)) return undefined;
    const clause = statement.importClause;
    const hasRuntimeBinding =
      clause == null
      || clause.name != null
      || clause.namedBindings == null
      || ts.isNamespaceImport(clause.namedBindings)
      || clause.namedBindings.elements.some((element) => !element.isTypeOnly);
    return clause?.phaseModifier === ts.SyntaxKind.TypeKeyword
      || !hasRuntimeBinding
      ? undefined
      : statement.moduleSpecifier.text;
  }
  if (
    !ts.isExportDeclaration(statement)
    || statement.moduleSpecifier == null
    || !ts.isStringLiteral(statement.moduleSpecifier)
    || statement.isTypeOnly
  ) {
    return undefined;
  }
  const clause = statement.exportClause;
  if (
    clause != null
    && ts.isNamedExports(clause)
    && clause.elements.every((element) => element.isTypeOnly)
  ) {
    return undefined;
  }
  return statement.moduleSpecifier.text;
}
