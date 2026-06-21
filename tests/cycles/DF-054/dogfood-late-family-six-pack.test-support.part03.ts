function storyPrefix(blockName: string): string {
  return blockName
    .replace(/Block$/, '')
    .replace(
      /[A-Z]/g,
      (letter, index) => `${index === 0 ? '' : '-'}${letter.toLowerCase()}`,
    );
}

function commandPrefix(blockName: string): string {
  const withoutBlock = blockName.replace(/Block$/, '');
  return withoutBlock.charAt(0).toLowerCase() + withoutBlock.slice(1);
}

function slotsFor(blockName: string): Readonly<Record<string, unknown>> {
  switch (blockName) {
    case 'BrandEmphasisBlock':
      return {
        brand: 'BIJOU',
        tagline: 'Terminal-native app blocks',
        decoration: 'accent rule',
        role: 'nonessential',
        selected: 'BIJOU',
      };
    case 'ModeAwarePrimitiveBlock':
      return {
        primitive: 'metric badge',
        fact: 'latency-ms',
        value: 42,
        status: 'good',
        modeContract: 'visual and pipe',
        selected: 'metric badge',
      };
    case 'DenseComparisonBlock':
      return {
        title: 'Compare packages',
        metric: 'tests',
        left: '1820',
        right: '640',
        delta: '+12',
        selected: 'tests',
      };
    case 'HierarchyBlock':
      return {
        root: 'docs/',
        nodes: ['design/', 'DX-031.md', 'METHOD.md'],
        selected: 'design/',
        parent: 'docs/',
        depth: 1,
        expanded: 'true',
      };
    case 'ExplorationListBlock':
      return {
        title: 'Explore components',
        facet: 'input',
        items: ['TextEntry field input', 'SingleChoice radio/select'],
        selected: 'TextEntry',
        preview: 'field input',
      };
    case 'TemporalDependencyBlock':
      return {
        title: 'Timeline',
        events: ['09:00 build', '09:05 test', '09:10 publish'],
        dependency: 'publish waits for test',
        selected: 'publish',
        dependsOn: 'test',
      };
    default:
      throw new Error(`missing slots for ${blockName}`);
  }
}

function expectedNeedle(blockName: string): string {
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
      return 'publish waits for test';
    default:
      throw new Error(`missing needle for ${blockName}`);
  }
}

export { commandPrefix, expectedNeedle, slotsFor, storyPrefix };
