import {
  appShellBlock,
  blockRenderNode,
  createSurface,
  defineBlock,
  describe,
  expect,
  findCell,
  inspectorPanelBlock,
  isSurfaceOutput,
  it,
  readerSurfaceBlock,
  renderBlockTree,
} from './standard-blocks.test-support.js';

describe('first-party standard block definitions', () => {
it('fits tall child surfaces within bounded parent visual sections', () => {
    const tallChild = createSurface(8, 12);
    tallChild.set(0, 0, { char: 'T' });
    tallChild.set(0, 11, { char: 'B' });
    const tallBlock = defineBlock({
      metadata: {
        packageName: '@flyingrobots/bijou-test',
        blockName: 'TallChild',
        family: 'test',
        scale: 'control',
        modes: ['interactive', 'static', 'pipe', 'accessible'],
        docs: { summary: 'Tall child surface test block.' },
        slots: [{ id: 'content', required: false }],
      },
      render: ({ mode }) => ({
        output: mode === 'interactive' || mode === 'static'
          ? tallChild
          : 'T',
      }),
    });
    const rendered = renderBlockTree(blockRenderNode(appShellBlock, {
      mode: 'interactive',
      config: { width: 40, sectionHeight: 4 },
      slots: {
        content: blockRenderNode(tallBlock),
      },
    }));

    if (!isSurfaceOutput(rendered)) {
      throw new Error('interactive nested block output should be a surface');
    }

    expect(findCell(rendered.output, 'T')).toBeDefined();
    expect(findCell(rendered.output, 'B')).toBeUndefined();
    expect(rendered.output.height).toBeLessThan(14);
  });
});

describe('first-party standard block definitions', () => {
it('omits absent optional sections while preserving required section fallback output', () => {
    const shell = appShellBlock.render({
      mode: 'pipe',
      slots: { content: 'Blocks guide' },
    });
    expect(shell.output).toContain('content: Blocks guide');
    expect(shell.output).not.toContain('navigation:');
    expect(shell.output).not.toContain('inspector:');
    expect(shell.output).not.toContain('status:');
    expect(shell.output).not.toContain('overlays:');
    expect(shell.facts).toContainEqual({ kind: 'entity', key: 'region.content', value: 'present' });
    expect(shell.facts).not.toContainEqual({ kind: 'entity', key: 'region.navigation', value: 'present' });

    const reader = readerSurfaceBlock.render({
      mode: 'pipe',
      slots: { content: 'Only the article body' },
    });
    expect(reader.output).toContain('content: Only the article body');
    expect(reader.output).not.toContain('navigation:');
    expect(reader.output).not.toContain('outline:');
    expect(reader.facts).toContainEqual({ kind: 'entity', key: 'slot.content', value: 'present' });
    expect(reader.facts).not.toContainEqual({ kind: 'entity', key: 'slot.outline', value: 'present' });

    const inspector = inspectorPanelBlock.render({
      mode: 'pipe',
      slots: { selection: 'ReaderSurface' },
    });
    expect(inspector.output).toContain('selection: ReaderSurface');
    expect(inspector.output).not.toContain('details:');
    expect(inspector.output).not.toContain('actions:');
    expect(inspector.facts).toContainEqual({ kind: 'entity', key: 'slot.selection', value: 'present' });
    expect(inspector.facts).not.toContainEqual({ kind: 'entity', key: 'slot.details', value: 'present' });

    const missingRequired = readerSurfaceBlock.render({ mode: 'pipe', slots: {} });
    expect(missingRequired.output).toContain('content: (missing required content)');
    expect(missingRequired.output).not.toContain('navigation:');
    expect(missingRequired.output).not.toContain('outline:');
  });
});

describe('first-party standard block definitions', () => {
it('renders ReaderSurface content, navigation, and outline deterministically', () => {
    const outline = Object.freeze(['Why Blocks', 'Lowering']);
    const rendered = readerSurfaceBlock.render({
      mode: 'accessible',
      slots: {
        content: '# Blocks\nBlocks are reusable Bijou view contracts.',
        navigation: 'Components > Blocks',
        outline,
      },
    });

    expect(rendered.output).toContain('ReaderSurface');
    expect(rendered.output).toContain('Navigation: Components > Blocks');
    expect(rendered.output).toContain('Content:');
    expect(rendered.output).toContain('# Blocks');
    expect(rendered.output).toContain('Outline: Why Blocks; Lowering');
    expect(rendered.output).not.toContain('definition placeholder');
    expect(outline).toEqual(['Why Blocks', 'Lowering']);
    expect(rendered.facts).toEqual(expect.arrayContaining([
      { kind: 'entity', key: 'block', value: 'ReaderSurface' },
      { kind: 'state', key: 'block.rendered', value: true },
      { kind: 'entity', key: 'slot.content', value: 'present' },
      { kind: 'entity', key: 'slot.outline', value: 'present' },
    ]));
  });
});
