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
  surfaceText,
} from './standard-blocks.test-support.js';

describe('first-party standard block definitions', () => {
it('renders nested standard blocks through the explicit block tree renderer', () => {
    const rendered = renderBlockTree(blockRenderNode(appShellBlock, {
      mode: 'interactive',
      config: { width: 72 },
      slots: {
        navigation: 'Blocks nav',
        content: blockRenderNode(readerSurfaceBlock, {
          slots: {
            content: 'Nested reader content from a child block.',
            outline: ['Overview', 'Lowering'],
          },
        }),
        inspector: blockRenderNode(inspectorPanelBlock, {
          slots: {
            selection: 'ReaderSurface',
            details: ['schema-bound', 'provider-ready'],
          },
        }),
        status: 'ready',
      },
    }));

    if (!isSurfaceOutput(rendered)) {
      throw new Error('interactive block tree output should be a surface');
    }

    const text = surfaceText(rendered.output);
    expect(text).toContain('AppShell');
    expect(text).toContain('ReaderSurface');
    expect(text).toContain('Nested reader content from a child block.');
    expect(text).toContain('InspectorPanel');
    expect(text).toContain('schema-bound; provider-ready');
    expect(rendered.facts).toEqual(expect.arrayContaining([
      { kind: 'entity', key: 'block', value: 'AppShell' },
      { kind: 'entity', key: 'block', value: 'ReaderSurface' },
      { kind: 'entity', key: 'block', value: 'InspectorPanel' },
    ]));
  });
});

describe('first-party standard block definitions', () => {
it('preserves child surface cells when visual blocks render nested block output', () => {
    const childSurface = createSurface(1, 1);
    childSurface.set(0, 0, {
      char: 'X',
      fg: '#00ff00',
      bg: '#ff00ff',
      modifiers: ['bold'],
    });
    const childBlock = defineBlock({
      metadata: {
        packageName: '@flyingrobots/bijou-test',
        blockName: 'StyledChild',
        family: 'test',
        scale: 'control',
        modes: ['interactive', 'static', 'pipe', 'accessible'],
        docs: { summary: 'Styled child test block.' },
        slots: [{ id: 'content', required: false }],
      },
      render: ({ mode }) => ({
        output: mode === 'interactive' || mode === 'static'
          ? childSurface
          : 'X',
      }),
    });

    const rendered = renderBlockTree(blockRenderNode(appShellBlock, {
      mode: 'interactive',
      config: { width: 48 },
      slots: {
        content: blockRenderNode(childBlock),
      },
    }));

    if (!isSurfaceOutput(rendered)) {
      throw new Error('interactive nested block output should be a surface');
    }

    const cell = findCell(rendered.output, 'X');

    expect(cell).toMatchObject({
      fg: '#00ff00',
      bg: '#ff00ff',
      modifiers: ['bold'],
    });
  });
});

describe('first-party standard block definitions', () => {
it('fits oversized child surfaces within parent visual sections', () => {
    const wideChild = createSurface(96, 1);
    wideChild.set(0, 0, { char: 'A' });
    wideChild.set(95, 0, { char: 'Z' });
    const wideBlock = defineBlock({
      metadata: {
        packageName: '@flyingrobots/bijou-test',
        blockName: 'WideChild',
        family: 'test',
        scale: 'control',
        modes: ['interactive', 'static', 'pipe', 'accessible'],
        docs: { summary: 'Oversized child surface test block.' },
        slots: [{ id: 'content', required: false }],
      },
      render: ({ mode }) => ({
        output: mode === 'interactive' || mode === 'static'
          ? wideChild
          : 'A',
      }),
    });
    const rendered = renderBlockTree(blockRenderNode(appShellBlock, {
      mode: 'interactive',
      config: { width: 40 },
      slots: {
        content: blockRenderNode(wideBlock),
      },
    }));

    if (!isSurfaceOutput(rendered)) {
      throw new Error('interactive nested block output should be a surface');
    }

    expect(rendered.output.width).toBe(40);
    expect(findCell(rendered.output, 'A')).toBeDefined();
    expect(findCell(rendered.output, 'Z')).toBeUndefined();
  });
});
