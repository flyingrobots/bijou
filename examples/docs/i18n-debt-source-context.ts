import ts from 'typescript';
import { isThemeTokenFamilyIdentifier } from './i18n-debt-sources.js';

export const NONLOCALIZABLE_PROPERTY_NAMES = new Set([
  'aliases', 'command', 'colorMode', 'coverageFamilyIds', 'direction',
  'family', 'familyId', 'fit', 'bg', 'fg', 'hex', 'id', 'ids',
  'importPath', 'key', 'kind', 'align', 'mode', 'modifiers', 'namespace',
  'overflowX', 'packageName', 'path', 'pageId', 'pipeFormat', 'renderer',
  'sourceLocale', 'scrollbarMode', 'supportsModes', 'tags', 'tone',
  'type', 'variant', 'version',
]);

export function isStaticNonlocalizableContext(
  node: ts.Node,
  sourceFile: ts.SourceFile,
): boolean {
  if (hasAncestor(node, isImportOrExportDeclaration)) return true;
  if (hasAncestor(node, ts.isLiteralTypeNode)) return true;
  if (
    hasAncestor(
      node,
      (ancestor) =>
        ts.isNoSubstitutionTemplateLiteral(ancestor) &&
        ts.isLiteralTypeNode(ancestor.parent),
    )
  ) {
    return true;
  }
  if (hasAncestor(node, (ancestor) => isNodeEnvComparison(ancestor, sourceFile))) {
    return true;
  }
  if (
    isControlLiteral(node) ||
    isCaseClauseExpression(node) ||
    isDiscriminantComparison(node) ||
    isThemeTokenFamilyIdentifier(node)
  ) {
    return true;
  }
  if (hasAncestor(node, (ancestor) => isOutputModeDeclaration(ancestor, sourceFile))) {
    return true;
  }
  return hasAncestor(
    node,
    (ancestor) => isTypedControlVocabulary(ancestor, sourceFile),
  );
}

function isNodeEnvComparison(
  node: ts.Node,
  sourceFile: ts.SourceFile,
): boolean {
  if (!ts.isBinaryExpression(node)) return false;
  const kind = node.operatorToken.kind;
  if (
    kind !== ts.SyntaxKind.EqualsEqualsEqualsToken &&
    kind !== ts.SyntaxKind.ExclamationEqualsEqualsToken
  ) {
    return false;
  }
  return (
    node.left.getText(sourceFile) === 'process.env.NODE_ENV' ||
    node.right.getText(sourceFile) === 'process.env.NODE_ENV'
  );
}

function isControlLiteral(node: ts.Node): boolean {
  if (!ts.isStringLiteralLike(node) || !ts.isBinaryExpression(node.parent)) {
    return false;
  }
  const binary = node.parent;
  const other = binary.left === node ? binary.right : binary.left;
  return binary.operatorToken.kind === ts.SyntaxKind.InKeyword
    ? binary.left === node
    : ts.isTypeOfExpression(other);
}

function isCaseClauseExpression(node: ts.Node): boolean {
  return ts.isCaseClause(node.parent) && node.parent.expression === node;
}

function isDiscriminantComparison(node: ts.Node): boolean {
  if (!ts.isBinaryExpression(node.parent)) return false;
  const binary = node.parent;
  const kind = binary.operatorToken.kind;
  if (
    kind !== ts.SyntaxKind.EqualsEqualsEqualsToken &&
    kind !== ts.SyntaxKind.ExclamationEqualsEqualsToken
  ) {
    return false;
  }
  const other =
    binary.left === node
      ? binary.right
      : binary.right === node
        ? binary.left
        : undefined;
  if (other == null) return false;
  return ts.isPropertyAccessExpression(other)
    && ['action', 'kind', 'mode', 'status', 'type'].includes(other.name.text);
}

function isOutputModeDeclaration(
  node: ts.Node,
  sourceFile: ts.SourceFile,
): boolean {
  return (
    ts.isVariableDeclaration(node) &&
    node.type?.getText(sourceFile).includes('OutputMode') === true
  );
}

function isTypedControlVocabulary(
  node: ts.Node,
  sourceFile: ts.SourceFile,
): boolean {
  return (
    ts.isSatisfiesExpression(node) &&
    /\b[A-Za-z0-9]+(?:Command|Family|Mode|Kind|Status|Type|Id)\b/.test(
      node.type.getText(sourceFile),
    )
  );
}

function hasAncestor(
  node: ts.Node,
  predicate: (ancestor: ts.Node) => boolean,
): boolean {
  for (let current = node.parent; !ts.isSourceFile(current); current = current.parent) {
    if (predicate(current)) return true;
  }
  return false;
}

function isImportOrExportDeclaration(node: ts.Node): boolean {
  return (
    ts.isImportDeclaration(node) ||
    ts.isImportEqualsDeclaration(node) ||
    ts.isExportDeclaration(node) ||
    ts.isExternalModuleReference(node)
  );
}
