import {
  dividerBlock,
  explainabilityWalkthroughBlock,
  formattedDocumentBlock,
  framedGroupBlock,
  linkDestinationBlock,
  textEntryBlock,
} from '../../../packages/bijou/src/index.js';

const DESIGN_DOC = 'docs/design/DF-039-component-family-standard-blocks.md';

const COMPONENT_FAMILY_BLOCKS = [
  framedGroupBlock,
  explainabilityWalkthroughBlock,
  formattedDocumentBlock,
  linkDestinationBlock,
  dividerBlock,
  textEntryBlock,
] as const;

export { COMPONENT_FAMILY_BLOCKS, DESIGN_DOC };
