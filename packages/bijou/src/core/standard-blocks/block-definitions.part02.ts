import { defineBlock } from '../block-metadata.js';

import type { BlockDefinition } from '../block-metadata.js';

import { binaryDecisionMetadata, dividerMetadata, explainabilityWalkthroughMetadata, formattedDocumentMetadata, framedGroupMetadata, linkDestinationMetadata, multipleChoiceMetadata, singleChoiceMetadata, textEntryMetadata } from './metadata-standard.js';

import { binaryDecisionData, binaryDecisionSections, dividerData, dividerSections, explainabilityWalkthroughData, explainabilityWalkthroughSections, formattedDocumentData, formattedDocumentSections, framedGroupData, framedGroupSections, linkDestinationData, linkDestinationSections, multipleChoiceData, multipleChoiceSections, singleChoiceData, singleChoiceSections, standardSectionCommands, textEntryData, textEntrySections } from './sections.js';

import { renderStandardSectionBlock } from './render.js';
import { drawDivider } from './draw-divider.js';
import { drawBinaryDecision } from './draw-binary-decision.js';
import { drawMultipleChoice, drawSingleChoice } from './draw-choice.js';
import { drawTextEntry } from './draw-text-entry.js';
import { drawLinkDestination } from './draw-link-destination.js';
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
    drawLinkDestination,
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
    drawDivider,
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
    drawTextEntry,
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
    drawSingleChoice,
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
    drawMultipleChoice,
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
    drawBinaryDecision,
  ),
});
