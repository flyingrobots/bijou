import {
  activityStreamBlock,
  appShellBlock,
  binaryDecisionBlock,
  brandEmphasisBlock,
  denseComparisonBlock,
  describe,
  dividerBlock,
  expect,
  explainabilityWalkthroughBlock,
  explorationListBlock,
  formattedDocumentBlock,
  framedGroupBlock,
  hierarchyBlock,
  inFlowStatusBlock,
  inlineStatusBlock,
  inspectorPanelBlock,
  it,
  linkDestinationBlock,
  modeAwarePrimitiveBlock,
  multipleChoiceBlock,
  pathProgressBlock,
  peerNavigationBlock,
  progressIndicatorBlock,
  progressiveDisclosureBlock,
  readerSurfaceBlock,
  shortcutCueBlock,
  singleChoiceBlock,
  standardBlockPackageManifest,
  standardBlocks,
  temporalDependencyBlock,
  textEntryBlock,
  transientOverlayBlock,
  validateBlockMetadata,
  validateBlockPackageManifest,
} from './standard-blocks.test-support.js';

describe('first-party standard block definitions', () => {
  it('exports valid first-party standard block definitions', () => {
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
      singleChoiceBlock,
      multipleChoiceBlock,
      binaryDecisionBlock,
      peerNavigationBlock,
      progressiveDisclosureBlock,
      pathProgressBlock,
      brandEmphasisBlock,
      modeAwarePrimitiveBlock,
      denseComparisonBlock,
      hierarchyBlock,
      explorationListBlock,
      temporalDependencyBlock,
    ]);
    expect(Object.isFrozen(standardBlocks)).toBe(true);

    for (const block of standardBlocks) {
      expect(validateBlockMetadata(block.metadata)).toMatchObject({ passed: true });
      expect(Object.isFrozen(block)).toBe(true);
    }

    expect(validateBlockPackageManifest(standardBlockPackageManifest)).toMatchObject({
      passed: true,
    });
    expect(standardBlockPackageManifest.blocks).toEqual([
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
  });
});

describe('first-party standard block definitions', () => {
  it('keeps AppShell slots semantic and content-first', () => {
    const slotIds = appShellBlock.metadata.slots.map((slot) => slot.id);

    expect(slotIds).toEqual([
      'navigation',
      'content',
      'inspector',
      'status',
      'overlays',
    ]);
    expect(appShellBlock.metadata.slots.filter((slot) => slot.required !== false).map((slot) => slot.id)).toEqual([
      'content',
    ]);
    expect(slotIds).not.toContain('left');
    expect(slotIds).not.toContain('right');
    expect(slotIds).not.toContain('center');
    expect(slotIds).not.toContain('bottom');
  });
});
