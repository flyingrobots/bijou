import { describe, expect, it } from 'vitest';
import { blockRenderNode, renderBlockTree } from './block-tree-render.js';
import { appShellBlock } from './standard-blocks.js';

describe('block tree rendering', () => {
  it('fails deterministically when nested rendering exceeds the maximum depth', () => {
      const node = blockRenderNode(appShellBlock, {
        mode: 'pipe',
        slots: {
          content: blockRenderNode(appShellBlock, {
            slots: {
              content: blockRenderNode(appShellBlock, {
                slots: {
                  content: blockRenderNode(appShellBlock, {
                    slots: { content: 'leaf' },
                  }),
                },
              }),
            },
          }),
        },
      });

      expect(() => renderBlockTree(node, { maxDepth: 2 })).toThrow(
        'block tree render: maximum depth 2 exceeded at AppShell',
      );
    });
});
