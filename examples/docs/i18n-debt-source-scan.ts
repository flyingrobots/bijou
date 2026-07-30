import ts from 'typescript';
import type {
  DogfoodI18nDebtEntry,
  DogfoodI18nDebtSource,
} from './i18n-debt-contract.js';
import {
  NONLOCALIZABLE_PROPERTY_NAMES,
  isStaticNonlocalizableContext,
} from './i18n-debt-source-context.js';
import { normalizeLocalizableText } from './i18n-debt-io.js';

const LOCALIZED_MESSAGE_FUNCTIONS = new Set(['dogfoodMessage']);
const LOCALIZED_FALLBACK_FUNCTIONS = new Set(['dogfoodText', 'shellText']);
const PATH_FUNCTIONS = new Set([
  'join', 'readMarkdownDoc', 'readMarkdownDocExcerpt', 'readFileSync',
  'writeFileSync',
]);

export function maybeAddEntry(
  source: DogfoodI18nDebtSource,
  sourceFile: ts.SourceFile,
  node: ts.Node,
  rawValue: string,
  entries: DogfoodI18nDebtEntry[],
): void {
  const value = normalizeLocalizableText(rawValue);
  if (value == null || isNonlocalizableContext(node, sourceFile)) return;
  const position = sourceFile.getLineAndCharacterOfPosition(
    node.getStart(sourceFile),
  );
  entries.push(
    Object.freeze({
      surface: source.surface,
      path: source.path,
      line: position.line + 1,
      column: position.character + 1,
      value,
    }),
  );
}

function isNonlocalizableContext(
  node: ts.Node,
  sourceFile: ts.SourceFile,
): boolean {
  if (
    isStaticNonlocalizableContext(node, sourceFile) ||
    isErrorConstructorArgument(node)
  ) {
    return true;
  }
  const propertyName = nearestPropertyName(node);
  if (
    propertyName != null &&
    NONLOCALIZABLE_PROPERTY_NAMES.has(propertyName)
  ) {
    return true;
  }
  return isLocalizedCallArgument(node, sourceFile);
}

function isLocalizedCallArgument(
  node: ts.Node,
  sourceFile: ts.SourceFile,
): boolean {
  const call = nearestCallExpression(node);
  if (call == null) return false;
  const callName = callExpressionName(call, sourceFile);
  const argumentIndex = call.arguments.findIndex(
    (argument) => argument === node || containsNode(argument, node),
  );
  if (callName != null && LOCALIZED_MESSAGE_FUNCTIONS.has(callName)) return true;
  if (
    callName != null &&
    LOCALIZED_FALLBACK_FUNCTIONS.has(callName) &&
    (argumentIndex === 1 || argumentIndex === 2)
  ) {
    return true;
  }
  if (callName === 'dogfoodI18nCatalogsForLocale' && argumentIndex === 0) {
    return true;
  }
  if (callName === 'bind' && argumentIndex === 0) return true;
  if (callName === 'themeTokenRecordEntries' && argumentIndex === 0) return true;
  if (callName != null && PATH_FUNCTIONS.has(callName)) return true;
  return call.expression.kind === ts.SyntaxKind.ImportKeyword;
}

function nearestPropertyName(node: ts.Node): string | undefined {
  for (let current = node.parent; !ts.isSourceFile(current); current = current.parent) {
    if (!ts.isPropertyAssignment(current)) continue;
    if (
      ts.isIdentifier(current.name) ||
      ts.isStringLiteral(current.name) ||
      ts.isNumericLiteral(current.name)
    ) {
      return current.name.text;
    }
    return undefined;
  }
  return undefined;
}

function nearestCallExpression(node: ts.Node): ts.CallExpression | undefined {
  for (let current = node.parent; !ts.isSourceFile(current); current = current.parent) {
    if (ts.isCallExpression(current)) return current;
  }
  return undefined;
}

function callExpressionName(
  call: ts.CallExpression,
  sourceFile: ts.SourceFile,
): string | undefined {
  if (ts.isIdentifier(call.expression)) return call.expression.text;
  if (ts.isPropertyAccessExpression(call.expression)) {
    return call.expression.name.text;
  }
  return call.expression.getText(sourceFile);
}

function isErrorConstructorArgument(node: ts.Node): boolean {
  for (let current = node.parent; !ts.isSourceFile(current); current = current.parent) {
    if (
      ts.isNewExpression(current) &&
      current.expression.getText() === 'Error' &&
      current.arguments?.some(
        (argument) => argument === node || containsNode(argument, node),
      ) === true
    ) {
      return true;
    }
  }
  return false;
}

function containsNode(parent: ts.Node, target: ts.Node): boolean {
  let found = false;
  parent.forEachChild((child) => {
    if (child === target || containsNode(child, target)) found = true;
  });
  return found;
}
