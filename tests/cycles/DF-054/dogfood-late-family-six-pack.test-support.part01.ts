import {
  brandEmphasisBlock,
  denseComparisonBlock,
  explorationListBlock,
  hierarchyBlock,
  modeAwarePrimitiveBlock,
  temporalDependencyBlock,
} from '../../../packages/bijou/src/index.js';

const DESIGN_DOC = 'docs/design/DF-054-late-family-standard-blocks.md';

const LATE_FAMILY_BLOCKS = [
  brandEmphasisBlock,
  modeAwarePrimitiveBlock,
  denseComparisonBlock,
  hierarchyBlock,
  explorationListBlock,
  temporalDependencyBlock,
] as const;

export { DESIGN_DOC, LATE_FAMILY_BLOCKS };
