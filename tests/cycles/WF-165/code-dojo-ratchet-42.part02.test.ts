import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { createNoise2D } from '../../../examples/perf-gradient/perf-noise.js';
import {
  findRuntimeCyclesTouching,
  listProjectTypeScriptFiles,
} from '../DX-050/runtime-import-cycles.js';
import {
  TRANCHE_B_FAMILY_MEMBERS,
  TRANCHE_B_PUBLIC_EXPORTS,
  TRANCHE_B_ROOTS,
} from './tranche-b-contract.js';

const ROOT = resolve(import.meta.dirname, '../../..');

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

function publicExportNames(relativePath: string): readonly string[] {
  const source = ts.createSourceFile(
    relativePath,
    readFileSync(resolve(ROOT, relativePath), 'utf8'),
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

describe('WF-165 Code Dojo tranche B architecture', () => {
  it('preserves every selected public export name', () => {
    expect(Object.keys(TRANCHE_B_PUBLIC_EXPORTS).sort()).toEqual(
      [...TRANCHE_B_ROOTS].sort(),
    );
    for (const root of TRANCHE_B_ROOTS) {
      expect(publicExportNames(root), root).toEqual(
        [...TRANCHE_B_PUBLIC_EXPORTS[root]].sort(),
      );
    }
  });

  it('keeps every split family out of repository runtime cycles', () => {
    const projectFiles = listProjectTypeScriptFiles(ROOT);
    const trancheFiles = TRANCHE_B_ROOTS.flatMap((entrypoint) =>
      TRANCHE_B_FAMILY_MEMBERS[entrypoint].map((path) => resolve(ROOT, path)),
    );
    expect(findRuntimeCyclesTouching(projectFiles, trancheFiles)).toEqual([]);
  });

  it('preserves the performance-gradient noise field', () => {
    const noise = createNoise2D(42);
    expect([
      noise(0, 0),
      noise(0.03, 0.06),
      noise(1.25, -0.75),
      noise(17.3, 4.2),
    ]).toEqual([
      -7.734549096291505e-66,
      0.010222392083613068,
      -0.467642263695954,
      0.5099932155140692,
    ]);
  });

  it('keeps runtime issue dependencies in top-level type imports', () => {
    const path = 'packages/bijou-tui/src/runtime-contract.ts';
    const source = ts.createSourceFile(
      path,
      readFileSync(resolve(ROOT, path), 'utf8'),
      ts.ScriptTarget.Latest,
      true,
    );
    const importTypes: ts.ImportTypeNode[] = [];
    const visit = (node: ts.Node): void => {
      if (ts.isImportTypeNode(node)) importTypes.push(node);
      ts.forEachChild(node, visit);
    };
    visit(source);

    expect(importTypes).toHaveLength(0);
  });
});
