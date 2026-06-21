function primarySemanticSlot(blockName: string): string {
  switch (blockName) {
    case 'BrandEmphasisBlock':
      return 'brand';
    case 'ModeAwarePrimitiveBlock':
      return 'fact';
    case 'DenseComparisonBlock':
    case 'ExplorationListBlock':
    case 'TemporalDependencyBlock':
      return 'title';
    case 'HierarchyBlock':
      return 'selected';
    default:
      throw new Error(`missing semantic slot for ${blockName}`);
  }
}

function primarySemanticValue(blockName: string): string {
  switch (blockName) {
    case 'BrandEmphasisBlock':
      return 'BIJOU';
    case 'ModeAwarePrimitiveBlock':
      return 'latency-ms';
    case 'DenseComparisonBlock':
      return 'Compare packages';
    case 'HierarchyBlock':
      return 'design/';
    case 'ExplorationListBlock':
      return 'Explore components';
    case 'TemporalDependencyBlock':
      return 'Timeline';
    default:
      throw new Error(`missing semantic value for ${blockName}`);
  }
}

function selectedFactValue(blockName: string): string {
  switch (blockName) {
    case 'BrandEmphasisBlock':
      return 'BIJOU';
    case 'ModeAwarePrimitiveBlock':
      return 'metric badge';
    case 'DenseComparisonBlock':
      return 'tests';
    case 'HierarchyBlock':
      return 'design/';
    case 'ExplorationListBlock':
      return 'TextEntry';
    case 'TemporalDependencyBlock':
      return 'publish';
    default:
      throw new Error(`missing selected fact for ${blockName}`);
  }
}

export { primarySemanticSlot, primarySemanticValue, selectedFactValue };
