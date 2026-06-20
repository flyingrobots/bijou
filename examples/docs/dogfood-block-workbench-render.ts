import type { BlockRenderInput, BlockRenderResult } from '@flyingrobots/bijou';
import { s } from './dogfood-block-common.js';
import type { BlockLabWorkbenchBlockConfig } from './dogfood-block-workbench.js';

export function renderBlockLabWorkbenchBlock(
  input: BlockRenderInput<BlockLabWorkbenchBlockConfig>,
): BlockRenderResult<string> {
  const storyCount = input.config?.storyCount ?? 0;
  const selectedStoryLabel = input.config?.selectedStoryLabel ?? 'none';
  const profileLabel = input.config?.profileLabel ?? 'default';

  if (input.mode === 'pipe' || input.mode === 'accessible') {
    return {
      output: `BlockLabWorkbench stories: ${s(storyCount)}; selected: ${selectedStoryLabel}; profile: ${profileLabel}`,
      facts: [{ kind: 'entity', key: 'dogfood.block', value: 'BlockLabWorkbenchBlock' }],
    };
  }

  return {
    output: [
      'BlockLabWorkbench',
      `stories: ${s(storyCount)}`,
      `selected: ${selectedStoryLabel}`,
      `profile: ${profileLabel}`,
    ].join('\n'),
    facts: [{ kind: 'entity', key: 'dogfood.block', value: 'BlockLabWorkbenchBlock' }],
  };
}
