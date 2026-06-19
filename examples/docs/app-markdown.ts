import { readFileSync } from 'node:fs';

export function readMarkdownDoc(path: string): string {
  return stripMarkdownFrontmatter(readFileSync(new URL(path, import.meta.url), 'utf8')).trim();
}

export function readMarkdownDocExcerpt(path: string, stopAtHeadings: readonly string[]): string {
  const content = readMarkdownDoc(path);
  const lines = content.split('\n');
  const stopIndex = lines.findIndex((line) => stopAtHeadings.includes(line.trim()));
  return (stopIndex === -1 ? lines : lines.slice(0, stopIndex)).join('\n').trim();
}

export function stripMarkdownFrontmatter(markdownText: string): string {
  const withoutBom = markdownText.replace(/^\uFEFF/, '');
  const opening = /^---\r?\n/.exec(withoutBom);
  if (opening == null) return markdownText;
  const bodyStart = opening[0].length;
  const body = withoutBom.slice(bodyStart);
  const closingMatch = /\r?\n---[ \t]*(?:\r?\n|$)/.exec(body);
  if (closingMatch?.index == null) return markdownText;
  return body.slice(closingMatch.index + closingMatch[0].length);
}

export function countMarkdownHeadings(markdownText: string): number {
  return markdownText
    .split('\n')
    .filter((lineText) => /^#{1,6}\s+\S/.test(lineText.trim()))
    .length;
}
