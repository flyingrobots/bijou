import {
  appShellBlock,
  describe,
  expect,
  inspectorPanelBlock,
  it,
  lintModeLowering,
  readerSurfaceBlock,
  renderSlotsFor,
  standardBlocks,
} from './rendered-standard-block-proof.test-support.js';

describe('DX-031E rendered standard block proof', () => {
  it('renders the shipped standard blocks as live outputs instead of placeholders', () => {
    const rendered = [
      appShellBlock.render({
        mode: 'pipe',
        slots: {
          navigation: 'Docs nav',
          content: 'Blocks guide',
          inspector: 'ReaderSurface details',
          status: 'Ready',
        },
      }).output,
      readerSurfaceBlock.render({
        mode: 'pipe',
        slots: {
          content: 'Readable block documentation.',
          outline: ['Intro', 'Lowering'],
        },
      }).output,
      inspectorPanelBlock.render({
        mode: 'pipe',
        slots: {
          selection: 'ReaderSurface',
          details: ['schema-aware', 'command-aware'],
        },
      }).output,
    ].join('\n\n');

    expect(rendered).toContain('AppShell');
    expect(rendered).toContain('ReaderSurface');
    expect(rendered).toContain('InspectorPanel');
    expect(rendered).toContain('navigation: Docs nav');
    expect(rendered).toContain('content: Blocks guide');
    expect(rendered).toContain('content: Readable block documentation.');
    expect(rendered).toContain('selection: ReaderSurface');
    expect(rendered).not.toContain('definition placeholder');
  });

  it('keeps rendered block lowering facts stable across modes', () => {
    const modes = ['interactive', 'static', 'pipe', 'accessible'] as const;

    for (const block of standardBlocks) {
      const report = lintModeLowering({
        modes: modes.map((mode) => ({
          mode,
          facts: block.render({
            mode,
            slots: renderSlotsFor(block.metadata.blockName),
          }).facts ?? [],
        })),
      });

      expect(report).toMatchObject({ passed: true });
    }
  });

  it('does not expose provider, subscription, refresh, render-tree traversal, or dispatch handles', () => {
    for (const block of standardBlocks) {
      const rendered = block.render({
        mode: 'pipe',
        slots: renderSlotsFor(block.metadata.blockName),
      });

      expect('provider' in rendered).toBe(false);
      expect('subscribe' in rendered).toBe(false);
      expect('unsubscribe' in rendered).toBe(false);
      expect('refresh' in rendered).toBe(false);
      expect('dispatch' in rendered).toBe(false);
      expect('traverse' in rendered).toBe(false);
    }
  });
});
