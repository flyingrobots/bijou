import { describe, expect, it } from 'vitest';
import {
  blockRenderNode,
  isBlockRenderNode,
  renderBlockTree,
} from './block-tree-render.js';
import {
  defineBlock,
  type BlockMetadata,
} from './block-metadata.js';
import {
  appShellBlock,
  readerSurfaceBlock,
} from './standard-blocks.js';

describe('block tree rendering', () => {
  it('renders nested block nodes into parent slots instead of showing only child names', () => {
    const rendered = renderBlockTree(blockRenderNode(appShellBlock, {
      mode: 'pipe',
      slots: {
        navigation: 'Blocks nav',
        content: blockRenderNode(readerSurfaceBlock, {
          slots: {
            content: 'Nested reader content',
            outline: ['Intro', 'Lowering'],
          },
        }),
        status: 'ready',
      },
    }));

    expect(rendered.output).toContain('AppShell');
    expect(rendered.output).toContain('content:');
    expect(rendered.output).toContain('ReaderSurface');
    expect(rendered.output).toContain('Nested reader content');
    expect(rendered.output).toContain('outline: Intro; Lowering');
    expect(rendered.facts).toEqual(expect.arrayContaining([
      { kind: 'entity', key: 'block', value: 'AppShell' },
      { kind: 'entity', key: 'block', value: 'ReaderSurface' },
    ]));
    expect(Object.isFrozen(rendered)).toBe(true);
    expect(Object.isFrozen(rendered.facts)).toBe(true);
  });

  it('inherits the effective output mode when rendering child blocks', () => {
    let observedMode: string | undefined;
    const child = defineBlock({
      metadata: childMetadata('ModeSpyChild'),
      render: ({ mode }) => {
        observedMode = mode;
        return { output: `child:${mode ?? 'none'}` };
      },
    });
    const parent = defineBlock({
      metadata: childMetadata('ModeSpyParent'),
      render: ({ slots }) => ({ output: String(slots?.content ?? '') }),
    });

    const rendered = renderBlockTree(blockRenderNode(parent, {
      mode: 'accessible',
      slots: { content: blockRenderNode(child) },
    }));

    expect(rendered.output).toBe('child:accessible');
    expect(observedMode).toBe('accessible');
  });

  it('rejects loose render-node-shaped objects', () => {
    const looseBlock = {
      metadata: appShellBlock.metadata,
      render: () => ({ output: 'not branded' }),
    };

    expect(() => blockRenderNode(looseBlock as never)).toThrow(
      'block render node: block must be created by defineBlock()',
    );
    expect(() => renderBlockTree({ block: appShellBlock, input: {} } as never)).toThrow(
      'block tree render: target must be a BlockDefinition or BlockRenderNode',
    );
    expect(isBlockRenderNode({ block: appShellBlock, input: {} })).toBe(false);
  });

  it('does not invoke accessors while resolving nested slot records', () => {
    let getterCalls = 0;
    const accessorSlots = Object.defineProperty({}, 'content', {
      enumerable: true,
      get() {
        getterCalls += 1;
        return 'unsafe accessor content';
      },
    });

    const rendered = renderBlockTree(blockRenderNode(appShellBlock, {
      mode: 'pipe',
      slots: {
        content: blockRenderNode(readerSurfaceBlock, {
          slots: accessorSlots,
        }),
      },
    }));

    expect(getterCalls).toBe(0);
    expect(rendered.output).toContain('content:');
    expect(rendered.output).toContain('(missing required content)');
    expect(rendered.output).not.toContain('unsafe accessor content');
  });

  it('fails deterministically when nested rendering exceeds the maximum depth', () => {
    const slots: Record<string, unknown> = {};
    const node = blockRenderNode(appShellBlock, {
      mode: 'pipe',
      slots,
    });
    slots.content = node;

    expect(() => renderBlockTree(node, { maxDepth: 2 })).toThrow(
      'block tree render: maximum depth 2 exceeded at AppShell',
    );
  });
});

function childMetadata(blockName: string): BlockMetadata {
  return {
    packageName: '@flyingrobots/bijou-test',
    blockName,
    family: 'test',
    scale: 'panel',
    modes: ['interactive', 'static', 'pipe', 'accessible'],
    docs: { summary: `${blockName} summary.` },
    slots: [{ id: 'content', required: false }],
  };
}
