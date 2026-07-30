import { posix as posixPath } from 'node:path';
import ts from 'typescript';
import type {
  DogfoodI18nDebtSource,
  DogfoodMarkdownFileReader,
  DogfoodMarkdownLocalizationDocument,
} from './i18n-debt-contract.js';
import { uniqueStringList } from './i18n-debt-io.js';

export function collectDogfoodMarkdownDocuments(
  source: DogfoodI18nDebtSource,
  templateValues: Readonly<Record<string, string>>,
  readFile: DogfoodMarkdownFileReader,
): readonly DogfoodMarkdownLocalizationDocument[] {
  const text = source.text ?? readFile(source.path);
  const sourceFile = ts.createSourceFile(
    source.path,
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const documents: DogfoodMarkdownLocalizationDocument[] = [];
  function visit(node: ts.Node): void {
    if (ts.isCallExpression(node)) {
      const callName = callExpressionName(node, sourceFile);
      if (
        callName === 'readMarkdownDoc' ||
        callName === 'readMarkdownDocExcerpt'
      ) {
        const rawPath = markdownPathArgumentText(
          node.arguments[0],
          sourceFile,
          templateValues,
        );
        if (rawPath?.endsWith('.md') === true) {
          const position = sourceFile.getLineAndCharacterOfPosition(
            node.getStart(sourceFile),
          );
          documents.push(
            Object.freeze({
              surface: source.surface,
              path: resolveRepoRelativeMarkdownPath(source.path, rawPath),
              line: position.line + 1,
              column: position.character + 1,
              reader: callName,
            }),
          );
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return documents;
}

export function uniqueMarkdownDocuments(
  documents: readonly DogfoodMarkdownLocalizationDocument[],
): readonly DogfoodMarkdownLocalizationDocument[] {
  const seen = new Map<string, DogfoodMarkdownLocalizationDocument>();
  for (const document of documents) {
    const key = `${document.surface}:${document.path}`;
    if (!seen.has(key)) seen.set(key, document);
  }
  return Object.freeze(
    [...seen.values()].sort(
      (left, right) =>
        left.surface.localeCompare(right.surface) ||
        left.path.localeCompare(right.path) ||
        left.line - right.line ||
        left.column - right.column,
    ),
  );
}

export function localizedMarkdownCandidatePaths(
  sourcePath: string,
  locale: string,
  explicitPath?: string,
): readonly string[] {
  const parsed = posixPath.parse(sourcePath);
  return uniqueStringList([
    ...(explicitPath == null
      ? []
      : [resolveRepoRelativeMarkdownPath(sourcePath, explicitPath)]),
    posixPath.join(parsed.dir, `${parsed.name}.${locale}${parsed.ext}`),
    posixPath.join(parsed.dir, locale, parsed.base),
  ]);
}

function markdownPathArgumentText(
  node: ts.Node | undefined,
  sourceFile: ts.SourceFile,
  templateValues: Readonly<Record<string, string>>,
): string | undefined {
  if (node == null) return undefined;
  if (
    ts.isStringLiteralLike(node) ||
    ts.isNoSubstitutionTemplateLiteral(node)
  ) {
    return node.text;
  }
  if (!ts.isTemplateExpression(node)) return undefined;
  let value = node.head.text;
  for (const span of node.templateSpans) {
    const replacement = templateValues[span.expression.getText(sourceFile)];
    if (replacement == null) return undefined;
    value += replacement;
    value += span.literal.text;
  }
  return value;
}

function resolveRepoRelativeMarkdownPath(
  sourcePath: string,
  rawPath: string,
): string {
  return posixPath.normalize(
    posixPath.join(posixPath.dirname(sourcePath), rawPath),
  );
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
