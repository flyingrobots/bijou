import { searchPanelBlock } from './dogfood-blocks.js';

export function renderDocsSearchTitle(title: string): string {
  return searchPanelBlock.render({
    config: { title },
    mode: 'accessible',
  }).output;
}
