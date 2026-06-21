import {
  binaryDecisionBlock,
  multipleChoiceBlock,
  pathProgressBlock,
  peerNavigationBlock,
  progressiveDisclosureBlock,
  singleChoiceBlock,
} from '../../../packages/bijou/src/index.js';

const DESIGN_DOC = 'docs/design/DF-046-choice-navigation-standard-blocks.md';

const CHOICE_NAVIGATION_BLOCKS = [
  singleChoiceBlock,
  multipleChoiceBlock,
  binaryDecisionBlock,
  peerNavigationBlock,
  progressiveDisclosureBlock,
  pathProgressBlock,
] as const;

export { CHOICE_NAVIGATION_BLOCKS, DESIGN_DOC };
