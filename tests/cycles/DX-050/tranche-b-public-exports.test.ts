import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { TRANCHE_B_CLEARED_PATHS } from './tranche-b-paths.js';

const ROOT = resolve(import.meta.dirname, '../../..');
const FIXTURE_PATH = resolve(
  ROOT,
  'tests/fixtures/DX-050/tranche-b-public-exports.json',
);

function exportedDeclarationNames(
  statement: ts.Statement,
): readonly string[] {
  const exported = ts.canHaveModifiers(statement)
    && ts.getModifiers(statement)?.some(
      (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
    ) === true;
  if (!exported) return [];
  if (
    ts.isFunctionDeclaration(statement)
    || ts.isClassDeclaration(statement)
    || ts.isInterfaceDeclaration(statement)
    || ts.isTypeAliasDeclaration(statement)
    || ts.isEnumDeclaration(statement)
  ) {
    return statement.name == null ? [] : [statement.name.text];
  }
  if (ts.isVariableStatement(statement)) {
    return statement.declarationList.declarations.flatMap((declaration) =>
      ts.isIdentifier(declaration.name) ? [declaration.name.text] : [],
    );
  }
  return [];
}

function publicExportNames(path: string): readonly string[] {
  const source = ts.createSourceFile(
    path,
    readFileSync(resolve(ROOT, path), 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  );
  const names = source.statements.flatMap((statement) => {
    const declarations = exportedDeclarationNames(statement);
    if (ts.isExportAssignment(statement)) return [...declarations, 'default'];
    if (!ts.isExportDeclaration(statement)) return declarations;
    const clause = statement.exportClause;
    if (clause != null && ts.isNamedExports(clause)) {
      return [
        ...declarations,
        ...clause.elements.map((element) => element.name.text),
      ];
    }
    return statement.moduleSpecifier == null
      ? declarations
      : [...declarations, `*:${statement.moduleSpecifier.getText()}`];
  });
  return [...new Set(names)].sort();
}

function expectedExports(): Readonly<Record<string, readonly string[]>> {
  const parsed: unknown = JSON.parse(readFileSync(FIXTURE_PATH, 'utf8'));
  if (parsed == null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('invalid tranche-B public-export fixture');
  }
  return Object.fromEntries(
    Object.entries(parsed).map(([path, names]) => {
      if (
        !Array.isArray(names)
        || names.some((name) => typeof name !== 'string')
      ) {
        throw new Error(`invalid public-export fixture entry ${path}`);
      }
      return [path, names as readonly string[]];
    }),
  );
}

describe('DX-050 tranche B public compatibility facades', () => {
  it('preserves every pre-split public export name', () => {
    const expected = expectedExports();
    expect(Object.keys(expected).sort()).toEqual(
      [...TRANCHE_B_CLEARED_PATHS].sort(),
    );
    for (const path of TRANCHE_B_CLEARED_PATHS) {
      expect(publicExportNames(path), path).toEqual(expected[path]);
    }
  });
});
