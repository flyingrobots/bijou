import { defineBlock } from '../block-metadata.js';

import type { BlockDefinition } from '../block-metadata.js';

import { appShellMetadata, inspectorPanelMetadata, readerSurfaceMetadata } from './metadata-custom.js';

import { activityStreamMetadata, inFlowStatusMetadata, inlineStatusMetadata, progressIndicatorMetadata, shortcutCueMetadata, transientOverlayMetadata } from './metadata-standard.js';

import { activityStreamData, activityStreamSections, inFlowStatusData, inFlowStatusSections, inlineStatusData, inlineStatusSections, inspectorFocusSource, inspectorPanelData, inspectorRevealSelection, progressIndicatorData, progressIndicatorSections, readerOpenReference, readerSelectHeading, readerSurfaceData, shellFocusRegion, shellOpenOverlay, shellToggleInspector, shortcutCueData, shortcutCueSections, standardSectionCommands, transientOverlayData, transientOverlaySections } from './sections.js';

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
