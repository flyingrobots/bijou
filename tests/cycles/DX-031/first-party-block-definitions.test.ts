import { describe, expect, it } from 'vitest';
import {
  appShellBlock,
  defineAppShellComposition,
  inspectorPanelBlock,
  readerSurfaceBlock,
  standardBlockPackageManifest,
  standardBlocks,
  standardBlockStories,
  validateBlockMetadata,
  validateBlockPackageManifest,
} from '../../../packages/bijou/src/index.js';

describe('DX-031C first-party block definitions', () => {
  it('publishes the first standard block set through the public barrel', () => {
    expect(standardBlocks).toEqual([
      appShellBlock,
      readerSurfaceBlock,
      inspectorPanelBlock,
    ]);
    expect(standardBlocks.map((block) => block.metadata.blockName)).toEqual([
      'AppShell',
      'ReaderSurface',
      'InspectorPanel',
    ]);

    for (const block of standardBlocks) {
      expect(validateBlockMetadata(block.metadata).passed).toBe(true);
    }
    expect(validateBlockPackageManifest(standardBlockPackageManifest).passed).toBe(true);
  });

  it('keeps AppShell semantic instead of physical', () => {
    const slotIds = appShellBlock.metadata.slots.map((slot) => slot.id);

    expect(slotIds).toContain('navigation');
    expect(slotIds).toContain('content');
    expect(slotIds).toContain('inspector');
    expect(slotIds).toContain('status');
    expect(slotIds).toContain('overlays');
    expect(slotIds).not.toContain('left');
    expect(slotIds).not.toContain('right');
    expect(slotIds).not.toContain('center');
    expect(slotIds).not.toContain('bottom');
  });

  it('composes declared blocks without rendering them', () => {
    const composition = defineAppShellComposition({
      slots: {
        content: readerSurfaceBlock,
        inspector: inspectorPanelBlock,
        status: appShellBlock,
      },
    });

    expect(composition.blocks()).toEqual([
      readerSurfaceBlock,
      inspectorPanelBlock,
      appShellBlock,
    ]);
    expect(composition.dataContracts()).toEqual([
      readerSurfaceBlock.data,
      inspectorPanelBlock.data,
    ]);
    expect(composition.commandIntents().map((intent) => intent.id)).toContain('shell.focusRegion');
    expect(composition.commandIntents().map((intent) => intent.id)).toContain('reader.selectHeading');
    expect(composition.commandIntents().map((intent) => intent.id)).toContain('inspector.revealSelection');
  });

  it('declares deterministic first-party story coverage in code', () => {
    expect(standardBlockStories.map((story) => story.id)).toEqual([
      'app-shell.ready',
      'app-shell.narrow',
      'app-shell.overlay',
      'reader-surface.ready',
      'reader-surface.loading',
      'reader-surface.stale',
      'reader-surface.empty',
      'reader-surface.error',
      'inspector-panel.ready',
      'inspector-panel.empty',
      'inspector-panel.loading',
      'inspector-panel.stale',
      'inspector-panel.error',
    ]);
    expect(standardBlockStories.map((story) => story.blockName)).toEqual([
      'AppShell',
      'AppShell',
      'AppShell',
      'ReaderSurface',
      'ReaderSurface',
      'ReaderSurface',
      'ReaderSurface',
      'ReaderSurface',
      'InspectorPanel',
      'InspectorPanel',
      'InspectorPanel',
      'InspectorPanel',
      'InspectorPanel',
    ]);
  });
});
