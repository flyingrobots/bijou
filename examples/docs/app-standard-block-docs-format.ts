import { standardBlocks } from '../../packages/bijou/src/index.js';

export function standardBlockCatalogIndexMarkdown(): string {
  const names = standardBlocks.map((block) => block.metadata.blockName);
  if (names.length <= 18) {
    return names.map((name) => `- ${name}`).join('\n');
  }

  const columns = 2;
  const rows = Math.ceil(names.length / columns);
  const leftColumnWidth = Math.max(...names.slice(0, rows).map((name) => name.length));
  return Array.from({ length: rows }, (_, row) => {
    const left = names[row] ?? '';
    const right = names[row + rows];
    if (right === undefined) {
      return `- ${left}`;
    }

    return `- ${left.padEnd(leftColumnWidth)}    - ${right}`;
  }).join('\n');
}

export function formatDocsList(values: readonly string[]): string {
  return values.length === 0 ? '-' : values.join(', ');
}
