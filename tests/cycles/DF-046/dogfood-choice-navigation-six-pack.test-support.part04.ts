import { expectedNeedle } from './dogfood-choice-navigation-six-pack.test-support.part03.js';

function primarySemanticSlot(blockName: string): string {
  switch (blockName) {
    case 'SingleChoiceBlock':
    case 'MultipleChoiceBlock':
    case 'BinaryDecisionBlock':
    case 'ProgressiveDisclosureBlock':
      return 'label';
    case 'PeerNavigationBlock':
    case 'PathProgressBlock':
      return 'current';
    default:
      throw new Error(`missing semantic slot for ${blockName}`);
  }
}

function primarySemanticValue(blockName: string): string {
  switch (blockName) {
    case 'PeerNavigationBlock':
      return 'Blocks';
    case 'PathProgressBlock':
      return 'Blocks';
    default:
      return expectedNeedle(blockName);
  }
}

function selectedFactValue(blockName: string): string {
  switch (blockName) {
    case 'SingleChoiceBlock':
      return 'pipe';
    case 'MultipleChoiceBlock':
      return 'lint; tests';
    case 'BinaryDecisionBlock':
      return 'yes';
    default:
      throw new Error(`missing selected fact for ${blockName}`);
  }
}

export { primarySemanticSlot, primarySemanticValue, selectedFactValue };
