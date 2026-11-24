import { posix } from 'node:path';
import ts from 'typescript';

/** Repository-relative POSIX paths and a way to read each one's source text. */
export interface SourceTree {
  readonly files: readonly string[];
  read(file: string): string;
}

/** Module to the sorted, de-duplicated modules it loads at runtime. Keys are sorted. */
export type RuntimeImportGraph = ReadonlyMap<string, readonly string[]>;

/** The files the graph covers: `.ts` and `.tsx` sources, never `.d.ts` declarations. */
export function isRuntimeGraphSource(file: string): boolean {
  return /\.tsx?$/u.test(file) && !file.endsWith('.d.ts');
}

/**
 * The module specifiers a source file loads when it is evaluated, read from
 * TypeScript's own syntax tree (top-level statements only):
 * - an `import` declaration is an edge unless it is `import type`, or every
 *   named specifier carries `type`; a side-effect import is an edge;
 * - an `export ... from` declaration is an edge (including `export *`) unless
 *   it is `export type`, or every named specifier carries `type`;
 * - a dynamic `import()` call, `require()` and `import x = require()` are not.
 */
export function runtimeModuleSpecifiers(file: string, text: string): readonly string[] {
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  return source.statements.flatMap((statement) => {
    const specifier = runtimeModuleSpecifier(statement);
    return specifier == null ? [] : [specifier];
  });
}

/**
 * Resolves a relative specifier the way the packages build: `.js`, `.mjs` and
 * `.cjs` name their TypeScript source, and a directory names its index. Package
 * names, path aliases and specifiers that match no listed source give no edge.
 */
export function resolveRuntimeSpecifier(
  file: string,
  specifier: string,
  sources: ReadonlySet<string>,
): string | undefined {
  if (!specifier.startsWith('./') && !specifier.startsWith('../')) return undefined;
  const exact = posix.normalize(posix.join(posix.dirname(file), specifier));
  const base = exact.replace(/\.(?:c|m)?js$/u, '');
  return [exact, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`]
    .find((candidate) => isRuntimeGraphSource(candidate) && sources.has(candidate));
}

/** Builds the runtime graph. The result does not depend on the order of `tree.files`. */
export function buildRuntimeImportGraph(tree: SourceTree): RuntimeImportGraph {
  const files = [...new Set(tree.files.filter(isRuntimeGraphSource))].sort();
  const sources = new Set(files);
  return new Map(files.map((file) => {
    const targets = runtimeModuleSpecifiers(file, tree.read(file)).flatMap((specifier) => {
      const target = resolveRuntimeSpecifier(file, specifier, sources);
      return target == null ? [] : [target];
    });
    return [file, [...new Set(targets)].sort()];
  }));
}

function runtimeModuleSpecifier(statement: ts.Statement): string | undefined {
  if (ts.isImportDeclaration(statement)) {
    if (!ts.isStringLiteral(statement.moduleSpecifier)) return undefined;
    return importLoadsModule(statement.importClause) ? statement.moduleSpecifier.text : undefined;
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
  if (clause != null && ts.isNamedExports(clause) && clause.elements.every((element) => element.isTypeOnly)) {
    return undefined;
  }
  return statement.moduleSpecifier.text;
}

function importLoadsModule(clause: ts.ImportClause | undefined): boolean {
  if (clause == null) return true;
  if (clause.phaseModifier === ts.SyntaxKind.TypeKeyword) return false;
  if (clause.name != null) return true;
  const bindings = clause.namedBindings;
  return bindings == null
    || ts.isNamespaceImport(bindings)
    || bindings.elements.some((element) => !element.isTypeOnly);
}
