import type { BlockRenderInput, BlockRenderResult } from '@flyingrobots/bijou';
import { s } from './dogfood-block-common.js';
import type { NavigationListBlockConfig } from './dogfood-block-navigation-list.js';

export function renderNavigationListBlock(
  input: BlockRenderInput<NavigationListBlockConfig>,
): BlockRenderResult<string> {
  const items = input.config?.items ?? [];
  const activeItemId = input.config?.activeItemId;
  const activeItem = items.find((item) => item.id === activeItemId);
  const itemCount = input.config?.itemCount ?? items.length;
  const activeLabel = input.config?.activeLabel ?? activeItem?.label ?? 'none';

  if (items.length > 0) {
    return {
      output: items
        .map((item) => {
          const marker = item.id === activeItemId ? '>' : '-';
          const indent = '  '.repeat(Math.max(0, Math.floor(item.depth ?? 0)));
          return `${indent}${marker} ${item.label}`;
        })
        .join('\n'),
      facts: [
        { kind: 'entity', key: 'dogfood.block', value: 'NavigationListBlock' },
        { kind: 'state', key: 'dogfood.navigation.itemCount', value: s(itemCount) },
      ],
    };
  }

  if (input.mode === 'pipe' || input.mode === 'accessible') {
    return {
      output: `Navigation items: ${s(itemCount)}; active: ${activeLabel}`,
      facts: [
        { kind: 'entity', key: 'dogfood.block', value: 'NavigationListBlock' },
        { kind: 'state', key: 'dogfood.navigation.itemCount', value: s(itemCount) },
      ],
    };
  }

  return {
    output: [
      'NavigationListBlock',
      `items: ${s(itemCount)}`,
      `active: ${activeLabel}`,
      'Intents: select item; expand group; collapse group',
    ].join('\n'),
    facts: [
      { kind: 'entity', key: 'dogfood.block', value: 'NavigationListBlock' },
      { kind: 'state', key: 'dogfood.navigation.itemCount', value: s(itemCount) },
    ],
  };
}
