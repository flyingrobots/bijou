import { defineBlock, type BlockDefinition } from '../block-metadata.js';
import { appShellMetadata } from './metadata-custom.js';
import { readerSurfaceMetadata, inspectorPanelMetadata } from './metadata-custom.js';
import { activityStreamMetadata, binaryDecisionMetadata, brandEmphasisMetadata, denseComparisonMetadata, dividerMetadata, explainabilityWalkthroughMetadata, explorationListMetadata, formattedDocumentMetadata, framedGroupMetadata, hierarchyMetadata, inFlowStatusMetadata, inlineStatusMetadata, linkDestinationMetadata, modeAwarePrimitiveMetadata, multipleChoiceMetadata, pathProgressMetadata, peerNavigationMetadata, progressIndicatorMetadata, progressiveDisclosureMetadata, shortcutCueMetadata, singleChoiceMetadata, temporalDependencyMetadata, textEntryMetadata, transientOverlayMetadata } from './metadata-standard.js';
import { activityStreamSections, binaryDecisionSections, brandEmphasisSections, denseComparisonSections, dividerSections, explainabilityWalkthroughSections, explorationListSections, formattedDocumentSections, framedGroupSections, hierarchySections, inFlowStatusSections, inlineStatusSections, linkDestinationSections, modeAwarePrimitiveSections, multipleChoiceSections, pathProgressSections, peerNavigationSections, progressIndicatorSections, progressiveDisclosureSections, shortcutCueSections, singleChoiceSections, temporalDependencySections, textEntrySections, transientOverlaySections } from './sections.js';
import { activityStreamData, binaryDecisionData, brandEmphasisData, denseComparisonData, dividerData, explorationListData, explainabilityWalkthroughData, formattedDocumentData, framedGroupData, hierarchyData, inFlowStatusData, inlineStatusData, inspectorFocusSource, inspectorPanelData, inspectorRevealSelection, linkDestinationData, modeAwarePrimitiveData, multipleChoiceData, pathProgressData, peerNavigationData, progressIndicatorData, progressiveDisclosureData, readerOpenReference, readerSelectHeading, readerSurfaceData, shellFocusRegion, shellOpenOverlay, shellToggleInspector, shortcutCueData, singleChoiceData, standardSectionCommands, temporalDependencyData, textEntryData, transientOverlayData } from './sections.js';
import { renderAppShellBlock, renderInspectorPanelBlock, renderReaderSurfaceBlock, renderStandardSectionBlock } from './render.js';

export const appShellBlock: BlockDefinition = defineBlock({
  metadata: appShellMetadata(),
  commands: [
    shellFocusRegion,
    shellToggleInspector,
    shellOpenOverlay,
  ],
  render: renderAppShellBlock,
});

export const readerSurfaceBlock: BlockDefinition = defineBlock({
  metadata: readerSurfaceMetadata(),
  data: readerSurfaceData,
  commands: [
    readerSelectHeading,
    readerOpenReference,
  ],
  render: renderReaderSurfaceBlock,
});

export const inspectorPanelBlock: BlockDefinition = defineBlock({
  metadata: inspectorPanelMetadata(),
  data: inspectorPanelData,
  commands: [
    inspectorRevealSelection,
    inspectorFocusSource,
  ],
  render: renderInspectorPanelBlock,
});

export const inlineStatusBlock: BlockDefinition = defineBlock({
  metadata: inlineStatusMetadata(),
  data: inlineStatusData,
  commands: standardSectionCommands('InlineStatusBlock'),
  render: (input) => renderStandardSectionBlock(
    input,
    'InlineStatusBlock',
    inlineStatusSections,
  ),
});

export const inFlowStatusBlock: BlockDefinition = defineBlock({
  metadata: inFlowStatusMetadata(),
  data: inFlowStatusData,
  commands: standardSectionCommands('InFlowStatusBlock'),
  render: (input) => renderStandardSectionBlock(
    input,
    'InFlowStatusBlock',
    inFlowStatusSections,
  ),
});

export const transientOverlayBlock: BlockDefinition = defineBlock({
  metadata: transientOverlayMetadata(),
  data: transientOverlayData,
  commands: standardSectionCommands('TransientOverlayBlock'),
  render: (input) => renderStandardSectionBlock(
    input,
    'TransientOverlayBlock',
    transientOverlaySections,
  ),
});

export const activityStreamBlock: BlockDefinition = defineBlock({
  metadata: activityStreamMetadata(),
  data: activityStreamData,
  commands: standardSectionCommands('ActivityStreamBlock'),
  render: (input) => renderStandardSectionBlock(
    input,
    'ActivityStreamBlock',
    activityStreamSections,
  ),
});

export const shortcutCueBlock: BlockDefinition = defineBlock({
  metadata: shortcutCueMetadata(),
  data: shortcutCueData,
  commands: standardSectionCommands('ShortcutCueBlock'),
  render: (input) => renderStandardSectionBlock(
    input,
    'ShortcutCueBlock',
    shortcutCueSections,
  ),
});

export const progressIndicatorBlock: BlockDefinition = defineBlock({
  metadata: progressIndicatorMetadata(),
  data: progressIndicatorData,
  commands: standardSectionCommands('ProgressIndicatorBlock'),
  render: (input) => renderStandardSectionBlock(
    input,
    'ProgressIndicatorBlock',
    progressIndicatorSections,
  ),
});

export const framedGroupBlock: BlockDefinition = defineBlock({
  metadata: framedGroupMetadata(),
  data: framedGroupData,
  commands: standardSectionCommands('FramedGroupBlock'),
  render: (input) => renderStandardSectionBlock(
    input,
    'FramedGroupBlock',
    framedGroupSections,
  ),
});

export const explainabilityWalkthroughBlock: BlockDefinition = defineBlock({
  metadata: explainabilityWalkthroughMetadata(),
  data: explainabilityWalkthroughData,
  commands: standardSectionCommands('ExplainabilityWalkthroughBlock'),
  render: (input) => renderStandardSectionBlock(
    input,
    'ExplainabilityWalkthroughBlock',
    explainabilityWalkthroughSections,
  ),
});

export const formattedDocumentBlock: BlockDefinition = defineBlock({
  metadata: formattedDocumentMetadata(),
  data: formattedDocumentData,
  commands: standardSectionCommands('FormattedDocumentBlock'),
  render: (input) => renderStandardSectionBlock(
    input,
    'FormattedDocumentBlock',
    formattedDocumentSections,
  ),
});

export const linkDestinationBlock: BlockDefinition = defineBlock({
  metadata: linkDestinationMetadata(),
  data: linkDestinationData,
  commands: standardSectionCommands('LinkDestinationBlock'),
  render: (input) => renderStandardSectionBlock(
    input,
    'LinkDestinationBlock',
    linkDestinationSections,
  ),
});

export const dividerBlock: BlockDefinition = defineBlock({
  metadata: dividerMetadata(),
  data: dividerData,
  commands: standardSectionCommands('DividerBlock'),
  render: (input) => renderStandardSectionBlock(
    input,
    'DividerBlock',
    dividerSections,
  ),
});

export const textEntryBlock: BlockDefinition = defineBlock({
  metadata: textEntryMetadata(),
  data: textEntryData,
  commands: standardSectionCommands('TextEntryBlock'),
  render: (input) => renderStandardSectionBlock(
    input,
    'TextEntryBlock',
    textEntrySections,
  ),
});

export const singleChoiceBlock: BlockDefinition = defineBlock({
  metadata: singleChoiceMetadata(),
  data: singleChoiceData,
  commands: standardSectionCommands('SingleChoiceBlock'),
  render: (input) => renderStandardSectionBlock(
    input,
    'SingleChoiceBlock',
    singleChoiceSections,
  ),
});

export const multipleChoiceBlock: BlockDefinition = defineBlock({
  metadata: multipleChoiceMetadata(),
  data: multipleChoiceData,
  commands: standardSectionCommands('MultipleChoiceBlock'),
  render: (input) => renderStandardSectionBlock(
    input,
    'MultipleChoiceBlock',
    multipleChoiceSections,
  ),
});

export const binaryDecisionBlock: BlockDefinition = defineBlock({
  metadata: binaryDecisionMetadata(),
  data: binaryDecisionData,
  commands: standardSectionCommands('BinaryDecisionBlock'),
  render: (input) => renderStandardSectionBlock(
    input,
    'BinaryDecisionBlock',
    binaryDecisionSections,
  ),
});

export const peerNavigationBlock: BlockDefinition = defineBlock({
  metadata: peerNavigationMetadata(),
  data: peerNavigationData,
  commands: standardSectionCommands('PeerNavigationBlock'),
  render: (input) => renderStandardSectionBlock(
    input,
    'PeerNavigationBlock',
    peerNavigationSections,
  ),
});

export const progressiveDisclosureBlock: BlockDefinition = defineBlock({
  metadata: progressiveDisclosureMetadata(),
  data: progressiveDisclosureData,
  commands: standardSectionCommands('ProgressiveDisclosureBlock'),
  render: (input) => renderStandardSectionBlock(
    input,
    'ProgressiveDisclosureBlock',
    progressiveDisclosureSections,
  ),
});

export const pathProgressBlock: BlockDefinition = defineBlock({
  metadata: pathProgressMetadata(),
  data: pathProgressData,
  commands: standardSectionCommands('PathProgressBlock'),
  render: (input) => renderStandardSectionBlock(
    input,
    'PathProgressBlock',
    pathProgressSections,
  ),
});

export const brandEmphasisBlock: BlockDefinition = defineBlock({
  metadata: brandEmphasisMetadata(),
  data: brandEmphasisData,
  commands: standardSectionCommands('BrandEmphasisBlock'),
  render: (input) => renderStandardSectionBlock(
    input,
    'BrandEmphasisBlock',
    brandEmphasisSections,
  ),
});

export const modeAwarePrimitiveBlock: BlockDefinition = defineBlock({
  metadata: modeAwarePrimitiveMetadata(),
  data: modeAwarePrimitiveData,
  commands: standardSectionCommands('ModeAwarePrimitiveBlock'),
  render: (input) => renderStandardSectionBlock(
    input,
    'ModeAwarePrimitiveBlock',
    modeAwarePrimitiveSections,
  ),
});

export const denseComparisonBlock: BlockDefinition = defineBlock({
  metadata: denseComparisonMetadata(),
  data: denseComparisonData,
  commands: standardSectionCommands('DenseComparisonBlock'),
  render: (input) => renderStandardSectionBlock(
    input,
    'DenseComparisonBlock',
    denseComparisonSections,
  ),
});

export const hierarchyBlock: BlockDefinition = defineBlock({
  metadata: hierarchyMetadata(),
  data: hierarchyData,
  commands: standardSectionCommands('HierarchyBlock'),
  render: (input) => renderStandardSectionBlock(
    input,
    'HierarchyBlock',
    hierarchySections,
  ),
});

export const explorationListBlock: BlockDefinition = defineBlock({
  metadata: explorationListMetadata(),
  data: explorationListData,
  commands: standardSectionCommands('ExplorationListBlock'),
  render: (input) => renderStandardSectionBlock(
    input,
    'ExplorationListBlock',
    explorationListSections,
  ),
});

export const temporalDependencyBlock: BlockDefinition = defineBlock({
  metadata: temporalDependencyMetadata(),
  data: temporalDependencyData,
  commands: standardSectionCommands('TemporalDependencyBlock'),
  render: (input) => renderStandardSectionBlock(
    input,
    'TemporalDependencyBlock',
    temporalDependencySections,
  ),
});
