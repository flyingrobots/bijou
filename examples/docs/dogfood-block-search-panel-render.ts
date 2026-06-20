import type { BlockRenderInput, BlockRenderResult } from '@flyingrobots/bijou';
import { s } from './dogfood-block-common.js';
import type { SearchPanelBlockConfig } from './dogfood-block-search-panel.js';

export function renderSearchPanelBlock(
  input: BlockRenderInput<SearchPanelBlockConfig>,
): BlockRenderResult<string> {
  const title = input.config?.title;
  const query = input.config?.query ?? '';
  const resultCount = input.config?.resultCount ?? 0;
  const activeResultLabel = input.config?.activeResultLabel ?? 'none';
  const queryLabel = query.trim() === '' ? 'empty' : query;
  const titleOnly = title != null
    && query.trim() === ''
    && resultCount === 0
    && activeResultLabel === 'none';
  const facts = [
    { kind: 'entity' as const, key: 'dogfood.block', value: 'SearchPanelBlock' },
    { kind: 'state' as const, key: 'dogfood.search.resultCount', value: s(resultCount) },
  ];

  if (titleOnly) {
    return {
      output: title,
      facts,
    };
  }

  if (input.mode === 'pipe' || input.mode === 'accessible') {
    return {
      output: `Search query: ${queryLabel}; results: ${s(resultCount)}; active: ${activeResultLabel}`,
      facts,
    };
  }

  return {
    output: [
      'SearchPanelBlock',
      `query: ${queryLabel}`,
      `results: ${s(resultCount)}`,
      `active: ${activeResultLabel}`,
      'Intents: submit query; select result; dismiss',
    ].join('\n'),
    facts,
  };
}
