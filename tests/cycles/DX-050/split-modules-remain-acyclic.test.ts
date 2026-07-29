import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { TRANCHE_A_CLEARED_PATHS } from './tranche-a-paths.js';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function splitModules(entrypoint: string): readonly string[] {
  const directory = dirname(entrypoint);
  const stem = basename(entrypoint).replace(/\.tsx?$/u, '');
  const pattern = new RegExp(
    `^${escapeRegExp(stem)}(?:\\.part\\d+|-[^.]+)?\\.tsx?$`,
    'u',
  );
  return readdirSync(directory)
    .filter((name) => pattern.test(name))
    .map((name) => resolve(directory, name));
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
  const imports: string[] = [];
  for (const statement of source.statements) {
    if (
      !ts.isImportDeclaration(statement)
      || !ts.isStringLiteral(statement.moduleSpecifier)
      || !statement.moduleSpecifier.text.startsWith('.')
    ) {
      continue;
    }
    const clause = statement.importClause;
    const hasRuntimeBinding =
      clause == null
      || clause.name != null
      || clause.namedBindings == null
      || ts.isNamespaceImport(clause.namedBindings)
      || clause.namedBindings.elements.some(
        (element) => !element.isTypeOnly,
      );
    if (
      clause?.phaseModifier === ts.SyntaxKind.TypeKeyword
      || !hasRuntimeBinding
    ) {
      continue;
    }

    const base = resolve(
      dirname(file),
      statement.moduleSpecifier.text.replace(/\.js$/u, ''),
    );
    const target = [`${base}.ts`, `${base}.tsx`].find(
      (candidate) => existsSync(candidate) && candidates.has(candidate),
    );
    if (target != null) imports.push(target);
  }
  return imports;
}

function findRuntimeCycles(files: readonly string[]): readonly string[] {
  const candidates = new Set(files);
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
        const start = stack.indexOf(dependency);
        cycles.push(
          [...stack.slice(start), dependency].map((item) => basename(item)).join(
            ' -> ',
          ),
        );
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

describe('DX-050 tranche A split-module architecture', () => {
  it('keeps every extracted sibling graph free of runtime import cycles', () => {
    for (const entrypoint of TRANCHE_A_CLEARED_PATHS) {
      const files = splitModules(entrypoint);
      expect(files.length, entrypoint).toBeGreaterThan(1);
      expect(findRuntimeCycles(files), entrypoint).toEqual([]);
    }
  });
});
