import { readDocumentationFile as readFileSync } from '../../scripts/documentation-corpus.js';
import { stripMarkdownFrontmatter } from './app-markdown-text.js';
export { countMarkdownHeadings, stripMarkdownFrontmatter } from './app-markdown-text.js';

export function readMarkdownDoc(path: string): string {
  return stripMarkdownFrontmatter(readFileSync(new URL(path, import.meta.url), 'utf8')).trim();
}

export function readMarkdownDocExcerpt(path: string, stopAtHeadings: readonly string[]): string {
  const content = readMarkdownDoc(path);
  const lines = content.split('\n');
  const stopIndex = lines.findIndex((line) => stopAtHeadings.includes(line.trim()));
  return (stopIndex === -1 ? lines : lines.slice(0, stopIndex)).join('\n').trim();
}
