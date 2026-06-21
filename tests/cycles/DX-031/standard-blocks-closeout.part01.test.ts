import {
  describe,
  expect,
  it,
  renderSlotsFor,
  standardBlocks,
  standardBlockStories,
} from './standard-blocks-closeout.test-support.js';

describe('DX-031 standard blocks closeout', () => {
  it('keeps the first standard block set concrete and mode-aware', () => {
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
    ]);

    for (const block of standardBlocks) {
      expect(block.metadata.modes).toEqual([
        'interactive',
        'static',
        'pipe',
        'accessible',
      ]);
      expect(block.metadata.storyIds ?? []).not.toHaveLength(0);

      for (const mode of block.metadata.modes) {
        const rendered = block.render({
          mode,
          slots: renderSlotsFor(block.metadata.blockName),
        });

        expect(rendered.output).toBeDefined();
        expect(rendered.facts).toContainEqual({
          kind: 'entity',
          key: 'block',
          value: block.metadata.blockName,
        });
      }
    }
  });
});

describe('DX-031 standard blocks closeout', () => {
  it('keeps first-party story coverage in release scope', () => {
    const storyStates = new Map(
      standardBlocks.map((block) => [
        block.metadata.blockName,
        standardBlockStories
          .filter((story) => story.blockName === block.metadata.blockName)
          .map((story) => story.state),
      ]),
    );

    expect(storyStates.get('AppShell')).toEqual(['ready', 'narrow', 'overlay']);
    expect(storyStates.get('ReaderSurface')).toEqual([
      'ready',
      'loading',
      'stale',
      'empty',
      'error',
    ]);
    expect(storyStates.get('InspectorPanel')).toEqual([
      'ready',
      'empty',
      'loading',
      'stale',
      'error',
    ]);
    expect(storyStates.get('InlineStatusBlock')).toEqual(['ready']);
    expect(storyStates.get('InFlowStatusBlock')).toEqual(['ready']);
    expect(storyStates.get('TransientOverlayBlock')).toEqual(['ready']);
    expect(storyStates.get('ActivityStreamBlock')).toEqual(['ready']);
    expect(storyStates.get('ShortcutCueBlock')).toEqual(['ready']);
    expect(storyStates.get('ProgressIndicatorBlock')).toEqual(['ready']);
    expect(storyStates.get('FramedGroupBlock')).toEqual(['ready']);
    expect(storyStates.get('ExplainabilityWalkthroughBlock')).toEqual(['ready']);
    expect(storyStates.get('FormattedDocumentBlock')).toEqual(['ready']);
    expect(storyStates.get('LinkDestinationBlock')).toEqual(['ready']);
    expect(storyStates.get('DividerBlock')).toEqual(['ready']);
    expect(storyStates.get('TextEntryBlock')).toEqual(['ready']);
    expect(storyStates.get('SingleChoiceBlock')).toEqual(['ready']);
    expect(storyStates.get('MultipleChoiceBlock')).toEqual(['ready']);
    expect(storyStates.get('BinaryDecisionBlock')).toEqual(['ready']);
    expect(storyStates.get('PeerNavigationBlock')).toEqual(['ready']);
    expect(storyStates.get('ProgressiveDisclosureBlock')).toEqual(['ready']);
    expect(storyStates.get('PathProgressBlock')).toEqual(['ready']);
    expect(storyStates.get('BrandEmphasisBlock')).toEqual(['ready']);
    expect(storyStates.get('ModeAwarePrimitiveBlock')).toEqual(['ready']);
    expect(storyStates.get('DenseComparisonBlock')).toEqual(['ready']);
    expect(storyStates.get('HierarchyBlock')).toEqual(['ready']);
    expect(storyStates.get('ExplorationListBlock')).toEqual(['ready']);
    expect(storyStates.get('TemporalDependencyBlock')).toEqual(['ready']);
  });
});
