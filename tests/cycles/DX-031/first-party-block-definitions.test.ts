import { describe, expect, it } from 'vitest';
import {
  activityStreamBlock,
  appShellBlock,
  dividerBlock,
  defineBlock,
  defineAppShellComposition,
  explainabilityWalkthroughBlock,
  formattedDocumentBlock,
  framedGroupBlock,
  inFlowStatusBlock,
  inlineStatusBlock,
  inspectorPanelBlock,
  linkDestinationBlock,
  progressIndicatorBlock,
  readerSurfaceBlock,
  shortcutCueBlock,
  standardBlockPackageManifest,
  standardBlocks,
  standardBlockStories,
  textEntryBlock,
  transientOverlayBlock,
  validateBlockMetadata,
  validateBlockPackageManifest,
} from '../../../packages/bijou/src/index.js';

describe('DX-031C first-party block definitions', () => {
  it('publishes the first standard block set through the public barrel', () => {
    expect(standardBlocks).toEqual([
      appShellBlock,
      readerSurfaceBlock,
      inspectorPanelBlock,
      inlineStatusBlock,
      inFlowStatusBlock,
      transientOverlayBlock,
      activityStreamBlock,
      shortcutCueBlock,
      progressIndicatorBlock,
      framedGroupBlock,
      explainabilityWalkthroughBlock,
      formattedDocumentBlock,
      linkDestinationBlock,
      dividerBlock,
      textEntryBlock,
    ]);
    expect(standardBlocks.map((block) => block.metadata.blockName)).toEqual([
      'AppShell',
      'ReaderSurface',
      'InspectorPanel',
      'InlineStatusBlock',
      'InFlowStatusBlock',
      'TransientOverlayBlock',
      'ActivityStreamBlock',
      'ShortcutCueBlock',
      'ProgressIndicatorBlock',
      'FramedGroupBlock',
      'ExplainabilityWalkthroughBlock',
      'FormattedDocumentBlock',
      'LinkDestinationBlock',
      'DividerBlock',
      'TextEntryBlock',
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
    const renderCalls: string[] = [];
    const spyReaderSurfaceBlock = defineBlock({
      metadata: readerSurfaceBlock.metadata,
      data: readerSurfaceBlock.data,
      commands: readerSurfaceBlock.commands,
      render: (input) => {
        renderCalls.push('ReaderSurface');
        return readerSurfaceBlock.render(input);
      },
    });
    const spyInspectorPanelBlock = defineBlock({
      metadata: inspectorPanelBlock.metadata,
      data: inspectorPanelBlock.data,
      commands: inspectorPanelBlock.commands,
      render: (input) => {
        renderCalls.push('InspectorPanel');
        return inspectorPanelBlock.render(input);
      },
    });
    const spyAppShellBlock = defineBlock({
      metadata: appShellBlock.metadata,
      data: appShellBlock.data,
      commands: appShellBlock.commands,
      render: (input) => {
        renderCalls.push('AppShell');
        return appShellBlock.render(input);
      },
    });
    const composition = defineAppShellComposition({
      slots: {
        content: spyReaderSurfaceBlock,
        inspector: spyInspectorPanelBlock,
        status: spyAppShellBlock,
      },
    });

    expect(composition.blocks()).toEqual([
      spyReaderSurfaceBlock,
      spyInspectorPanelBlock,
      spyAppShellBlock,
    ]);
    expect(composition.dataContracts()).toEqual([
      spyReaderSurfaceBlock.data,
      spyInspectorPanelBlock.data,
    ]);
    expect(composition.commandIntents().map((intent) => intent.id)).toContain('shell.focusRegion');
    expect(composition.commandIntents().map((intent) => intent.id)).toContain('reader.selectHeading');
    expect(composition.commandIntents().map((intent) => intent.id)).toContain('inspector.revealSelection');
    expect(renderCalls).toEqual([]);
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
      'inline-status.ready',
      'in-flow-status.ready',
      'transient-overlay.ready',
      'activity-stream.ready',
      'shortcut-cue.ready',
      'progress-indicator.ready',
      'framed-group.ready',
      'explainability-walkthrough.ready',
      'formatted-document.ready',
      'link-destination.ready',
      'divider.ready',
      'text-entry.ready',
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
      'InlineStatusBlock',
      'InFlowStatusBlock',
      'TransientOverlayBlock',
      'ActivityStreamBlock',
      'ShortcutCueBlock',
      'ProgressIndicatorBlock',
      'FramedGroupBlock',
      'ExplainabilityWalkthroughBlock',
      'FormattedDocumentBlock',
      'LinkDestinationBlock',
      'DividerBlock',
      'TextEntryBlock',
    ]);
  });
});
