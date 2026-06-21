import {
  appShellBlock,
  describe,
  expect,
  inspectorPanelBlock,
  it,
  readerSurfaceBlock,
  standardBlocks,
  standardBlockStories,
} from './standard-blocks.test-support.js';

describe('first-party standard block definitions', () => {
it('declares data contracts and command intents for reader and inspector blocks', () => {
    expect(readerSurfaceBlock.data?.names()).toEqual(['article', 'outline']);
    expect(readerSurfaceBlock.data?.requirementIds()).toEqual([
      'reader.article',
      'reader.outline',
    ]);
    expect(readerSurfaceBlock.commands?.map((command) => command.id)).toEqual([
      'reader.selectHeading',
      'reader.openReference',
    ]);

    expect(inspectorPanelBlock.data?.names()).toEqual(['selection', 'details']);
    expect(inspectorPanelBlock.data?.requirementIds()).toEqual([
      'inspector.selection',
      'inspector.details',
    ]);
    expect(inspectorPanelBlock.commands?.map((command) => command.id)).toEqual([
      'inspector.revealSelection',
      'inspector.focusSource',
    ]);

    expect(appShellBlock.commands?.map((command) => command.id)).toEqual([
      'shell.focusRegion',
      'shell.toggleInspector',
      'shell.openOverlay',
    ]);
  });
});

describe('first-party standard block definitions', () => {
it('publishes deterministic stories and metadata story ids without rendering', () => {
    const storiesByBlock = new Map<string, readonly string[]>(
      [
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
        'SingleChoiceBlock',
        'MultipleChoiceBlock',
        'BinaryDecisionBlock',
        'PeerNavigationBlock',
        'ProgressiveDisclosureBlock',
        'PathProgressBlock',
        'BrandEmphasisBlock',
        'ModeAwarePrimitiveBlock',
        'DenseComparisonBlock',
        'HierarchyBlock',
        'ExplorationListBlock',
        'TemporalDependencyBlock',
      ].map((blockName) => [
        blockName,
        standardBlockStories
          .filter((story) => story.blockName === blockName)
          .map((story) => story.state),
      ]),
    );

    expect(storiesByBlock.get('AppShell')).toEqual([
      'ready',
      'narrow',
      'overlay',
    ]);
    expect(storiesByBlock.get('ReaderSurface')).toEqual([
      'ready',
      'loading',
      'stale',
      'empty',
      'error',
    ]);
    expect(storiesByBlock.get('InspectorPanel')).toEqual([
      'ready',
      'empty',
      'loading',
      'stale',
      'error',
    ]);
    expect(storiesByBlock.get('InlineStatusBlock')).toEqual(['ready']);
    expect(storiesByBlock.get('InFlowStatusBlock')).toEqual(['ready']);
    expect(storiesByBlock.get('TransientOverlayBlock')).toEqual(['ready']);
    expect(storiesByBlock.get('ActivityStreamBlock')).toEqual(['ready']);
    expect(storiesByBlock.get('ShortcutCueBlock')).toEqual(['ready']);
    expect(storiesByBlock.get('ProgressIndicatorBlock')).toEqual(['ready']);
    expect(storiesByBlock.get('FramedGroupBlock')).toEqual(['ready']);
    expect(storiesByBlock.get('ExplainabilityWalkthroughBlock')).toEqual(['ready']);
    expect(storiesByBlock.get('FormattedDocumentBlock')).toEqual(['ready']);
    expect(storiesByBlock.get('LinkDestinationBlock')).toEqual(['ready']);
    expect(storiesByBlock.get('DividerBlock')).toEqual(['ready']);
    expect(storiesByBlock.get('TextEntryBlock')).toEqual(['ready']);
    expect(storiesByBlock.get('SingleChoiceBlock')).toEqual(['ready']);
    expect(storiesByBlock.get('MultipleChoiceBlock')).toEqual(['ready']);
    expect(storiesByBlock.get('BinaryDecisionBlock')).toEqual(['ready']);
    expect(storiesByBlock.get('PeerNavigationBlock')).toEqual(['ready']);
    expect(storiesByBlock.get('ProgressiveDisclosureBlock')).toEqual(['ready']);
    expect(storiesByBlock.get('PathProgressBlock')).toEqual(['ready']);
    expect(storiesByBlock.get('BrandEmphasisBlock')).toEqual(['ready']);
    expect(storiesByBlock.get('ModeAwarePrimitiveBlock')).toEqual(['ready']);
    expect(storiesByBlock.get('DenseComparisonBlock')).toEqual(['ready']);
    expect(storiesByBlock.get('HierarchyBlock')).toEqual(['ready']);
    expect(storiesByBlock.get('ExplorationListBlock')).toEqual(['ready']);
    expect(storiesByBlock.get('TemporalDependencyBlock')).toEqual(['ready']);

    for (const block of standardBlocks) {
      const storyIds = standardBlockStories
        .filter((story) => story.blockName === block.metadata.blockName)
        .map((story) => story.id);
      expect(block.metadata.storyIds).toEqual(storyIds);
    }
  });
});
