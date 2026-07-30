import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import ts from 'typescript';

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

export function publicExportNames(
  root: string,
  relativePath: string,
): readonly string[] {
  const source = ts.createSourceFile(
    relativePath,
    readFileSync(resolve(root, relativePath), 'utf8'),
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
