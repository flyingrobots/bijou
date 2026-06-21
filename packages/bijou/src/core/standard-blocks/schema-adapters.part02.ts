import type { BlockSchemaAdapter } from '../schema-block.js';

import type { BinaryDecisionSchemaData, BrandEmphasisSchemaData, DividerSchemaData, ExplainabilityWalkthroughSchemaData, FormattedDocumentSchemaData, FramedGroupSchemaData, LinkDestinationSchemaData, MultipleChoiceSchemaData, PathProgressSchemaData, PeerNavigationSchemaData, ProgressiveDisclosureSchemaData, SingleChoiceSchemaData, TextEntrySchemaData } from './types.js';

import { defineStandardSectionSchemaAdapter } from './schema-helpers.js';

import { parseBinaryDecisionSchemaData, parseDividerSchemaData, parseExplainabilityWalkthroughSchemaData, parseFormattedDocumentSchemaData, parseFramedGroupSchemaData, parseLinkDestinationSchemaData, parseMultipleChoiceSchemaData, parseSingleChoiceSchemaData, parseTextEntrySchemaData } from './schema-parsers-core.js';

import { parseBrandEmphasisSchemaData, parsePathProgressSchemaData, parsePeerNavigationSchemaData, parseProgressiveDisclosureSchemaData } from './schema-parsers-advanced.js';

import { binaryDecisionSections, brandEmphasisSections, dividerSections, explainabilityWalkthroughSections, formattedDocumentSections, framedGroupSections, linkDestinationSections, multipleChoiceSections, pathProgressSections, peerNavigationSections, progressiveDisclosureSections, singleChoiceSections, textEntrySections } from './sections.js';
export const framedGroupSchemaAdapter: BlockSchemaAdapter<FramedGroupSchemaData> =
  defineStandardSectionSchemaAdapter({
    id: 'framed-group.group',
    blockName: 'FramedGroupBlock',
    sections: framedGroupSections,
    parse: parseFramedGroupSchemaData,
  });
export const explainabilityWalkthroughSchemaAdapter:
  BlockSchemaAdapter<ExplainabilityWalkthroughSchemaData> =
  defineStandardSectionSchemaAdapter({
    id: 'explainability-walkthrough.walkthrough',
    blockName: 'ExplainabilityWalkthroughBlock',
    sections: explainabilityWalkthroughSections,
    parse: parseExplainabilityWalkthroughSchemaData,
  });
export const formattedDocumentSchemaAdapter: BlockSchemaAdapter<FormattedDocumentSchemaData> =
  defineStandardSectionSchemaAdapter({
    id: 'formatted-document.document',
    blockName: 'FormattedDocumentBlock',
    sections: formattedDocumentSections,
    parse: parseFormattedDocumentSchemaData,
  });
export const linkDestinationSchemaAdapter: BlockSchemaAdapter<LinkDestinationSchemaData> =
  defineStandardSectionSchemaAdapter({
    id: 'link-destination.link',
    blockName: 'LinkDestinationBlock',
    sections: linkDestinationSections,
    parse: parseLinkDestinationSchemaData,
  });
export const dividerSchemaAdapter: BlockSchemaAdapter<DividerSchemaData> =
  defineStandardSectionSchemaAdapter({
    id: 'divider.divider',
    blockName: 'DividerBlock',
    sections: dividerSections,
    parse: parseDividerSchemaData,
  });
export const textEntrySchemaAdapter: BlockSchemaAdapter<TextEntrySchemaData> =
  defineStandardSectionSchemaAdapter({
    id: 'text-entry.entry',
    blockName: 'TextEntryBlock',
    sections: textEntrySections,
    parse: parseTextEntrySchemaData,
  });
export const singleChoiceSchemaAdapter: BlockSchemaAdapter<SingleChoiceSchemaData> =
  defineStandardSectionSchemaAdapter({
    id: 'single-choice.choice',
    blockName: 'SingleChoiceBlock',
    sections: singleChoiceSections,
    parse: parseSingleChoiceSchemaData,
  });
export const multipleChoiceSchemaAdapter: BlockSchemaAdapter<MultipleChoiceSchemaData> =
  defineStandardSectionSchemaAdapter({
    id: 'multiple-choice.choices',
    blockName: 'MultipleChoiceBlock',
    sections: multipleChoiceSections,
    parse: parseMultipleChoiceSchemaData,
  });
export const binaryDecisionSchemaAdapter: BlockSchemaAdapter<BinaryDecisionSchemaData> =
  defineStandardSectionSchemaAdapter({
    id: 'binary-decision.decision',
    blockName: 'BinaryDecisionBlock',
    sections: binaryDecisionSections,
    parse: parseBinaryDecisionSchemaData,
  });
export const peerNavigationSchemaAdapter: BlockSchemaAdapter<PeerNavigationSchemaData> =
  defineStandardSectionSchemaAdapter({
    id: 'peer-navigation.peers',
    blockName: 'PeerNavigationBlock',
    sections: peerNavigationSections,
    parse: parsePeerNavigationSchemaData,
  });
export const progressiveDisclosureSchemaAdapter:
  BlockSchemaAdapter<ProgressiveDisclosureSchemaData> =
  defineStandardSectionSchemaAdapter({
    id: 'progressive-disclosure.disclosure',
    blockName: 'ProgressiveDisclosureBlock',
    sections: progressiveDisclosureSections,
    parse: parseProgressiveDisclosureSchemaData,
  });
export const pathProgressSchemaAdapter: BlockSchemaAdapter<PathProgressSchemaData> =
  defineStandardSectionSchemaAdapter({
    id: 'path-progress.path',
    blockName: 'PathProgressBlock',
    sections: pathProgressSections,
    parse: parsePathProgressSchemaData,
  });
export const brandEmphasisSchemaAdapter: BlockSchemaAdapter<BrandEmphasisSchemaData> =
  defineStandardSectionSchemaAdapter({
    id: 'brand-emphasis.brand',
    blockName: 'BrandEmphasisBlock',
    sections: brandEmphasisSections,
    parse: parseBrandEmphasisSchemaData,
  });
