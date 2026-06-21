import { expectedNeedle } from './dogfood-component-family-six-pack.test-support.part03.js';

function primarySemanticSlot(blockName: string): string {
  switch (blockName) {
    case 'FramedGroupBlock':
      return 'title';
    case 'ExplainabilityWalkthroughBlock':
      return 'steps';
    case 'FormattedDocumentBlock':
      return 'heading';
    case 'LinkDestinationBlock':
      return 'destination';
    case 'DividerBlock':
      return 'label';
    case 'TextEntryBlock':
      return 'field';
    default:
      throw new Error(`missing semantic slot for ${blockName}`);
  }
}

function primarySemanticValue(blockName: string): string {
  switch (blockName) {
    case 'ExplainabilityWalkthroughBlock':
      return 'input changed; constraint tightened; preview re-rendered';
    case 'LinkDestinationBlock':
      return 'docs/DOGFOOD.md';
    default:
      return expectedNeedle(blockName);
  }
}

export { primarySemanticSlot, primarySemanticValue };
