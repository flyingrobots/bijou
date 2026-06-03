import { describe, expect, it } from 'vitest';
import {
  bindSchemaBlockInput,
  brandEmphasisBlock,
  brandEmphasisSchemaBlock,
  denseComparisonBlock,
  denseComparisonSchemaBlock,
  explorationListBlock,
  explorationListSchemaBlock,
  hierarchyBlock,
  hierarchySchemaBlock,
  isSchemaBoundBlockDefinition,
  lintModeLowering,
  modeAwarePrimitiveBlock,
  modeAwarePrimitiveSchemaBlock,
  standardBlockPackageManifest,
  standardBlocks,
  temporalDependencyBlock,
  temporalDependencySchemaBlock,
  validateBlockMetadata,
} from '../../../packages/bijou/src/index.js';
import { readRepoFile } from '../repo.js';

const DESIGN_DOC = 'docs/design/DF-054-late-family-standard-blocks.md';

const LATE_FAMILY_BLOCKS = [
  brandEmphasisBlock,
  modeAwarePrimitiveBlock,
  denseComparisonBlock,
  hierarchyBlock,
  explorationListBlock,
  temporalDependencyBlock,
] as const;

const LATE_FAMILY_SCHEMA_BLOCKS = [
  {
    block: brandEmphasisBlock,
    schemaBlock: brandEmphasisSchemaBlock,
    bind: (input: unknown) => bindSchemaBlockInput(brandEmphasisSchemaBlock, input),
    valid: {
      brand: 'BIJOU',
      tagline: 'Terminal-native app blocks',
      decoration: 'accent rule',
      role: 'nonessential',
      selected: 'BIJOU',
    },
    invalid: { brand: 'BIJOU' },
    requiredFields: ['brand', 'tagline', 'decoration'],
    optionalFields: ['role', 'selected'],
    expectedSlots: {
      brand: 'BIJOU',
      tagline: 'Terminal-native app blocks',
      decoration: 'accent rule',
      role: 'nonessential',
      selected: 'BIJOU',
    },
  },
  {
    block: modeAwarePrimitiveBlock,
    schemaBlock: modeAwarePrimitiveSchemaBlock,
    bind: (input: unknown) => bindSchemaBlockInput(modeAwarePrimitiveSchemaBlock, input),
    valid: {
      primitive: 'metric badge',
      fact: 'latency-ms',
      value: 42,
      status: 'good',
      modeContract: 'visual and pipe',
      selected: 'metric badge',
    },
    invalid: { primitive: 'metric badge' },
    requiredFields: ['primitive', 'fact', 'value'],
    optionalFields: ['status', 'modeContract', 'selected'],
    expectedSlots: {
      primitive: 'metric badge',
      fact: 'latency-ms',
      value: 42,
      status: 'good',
      modeContract: 'visual and pipe',
      selected: 'metric badge',
    },
  },
  {
    block: denseComparisonBlock,
    schemaBlock: denseComparisonSchemaBlock,
    bind: (input: unknown) => bindSchemaBlockInput(denseComparisonSchemaBlock, input),
    valid: {
      title: 'Compare packages',
      metric: 'tests',
      left: '1820',
      right: '640',
      delta: '+12',
      selected: 'tests',
    },
    invalid: { title: 'Compare packages' },
    requiredFields: ['title', 'metric', 'left', 'right', 'delta'],
    optionalFields: ['selected'],
    expectedSlots: {
      title: 'Compare packages',
      metric: 'tests',
      left: '1820',
      right: '640',
      delta: '+12',
      selected: 'tests',
    },
  },
  {
    block: hierarchyBlock,
    schemaBlock: hierarchySchemaBlock,
    bind: (input: unknown) => bindSchemaBlockInput(hierarchySchemaBlock, input),
    valid: {
      root: 'docs/',
      nodes: ['design/', 'DX-031.md', 'METHOD.md'],
      selected: 'design/',
      parent: 'docs/',
      depth: 1,
      expanded: 'true',
    },
    invalid: { root: 'docs/' },
    requiredFields: ['root', 'nodes', 'selected'],
    optionalFields: ['parent', 'depth', 'expanded'],
    expectedSlots: {
      root: 'docs/',
      nodes: ['design/', 'DX-031.md', 'METHOD.md'],
      selected: 'design/',
      parent: 'docs/',
      depth: 1,
      expanded: 'true',
    },
  },
  {
    block: explorationListBlock,
    schemaBlock: explorationListSchemaBlock,
    bind: (input: unknown) => bindSchemaBlockInput(explorationListSchemaBlock, input),
    valid: {
      title: 'Explore components',
      facet: 'input',
      items: ['TextEntry field input', 'SingleChoice radio/select'],
      selected: 'TextEntry',
      preview: 'field input',
    },
    invalid: { title: 'Explore components' },
    requiredFields: ['title', 'facet', 'items', 'selected'],
    optionalFields: ['preview'],
    expectedSlots: {
      title: 'Explore components',
      facet: 'input',
      items: ['TextEntry field input', 'SingleChoice radio/select'],
      selected: 'TextEntry',
      preview: 'field input',
    },
  },
  {
    block: temporalDependencyBlock,
    schemaBlock: temporalDependencySchemaBlock,
    bind: (input: unknown) => bindSchemaBlockInput(temporalDependencySchemaBlock, input),
    valid: {
      title: 'Timeline',
      events: ['09:00 build', '09:05 test', '09:10 publish'],
      dependency: 'publish waits for test',
      selected: 'publish',
      dependsOn: 'test',
    },
    invalid: { title: 'Timeline' },
    requiredFields: ['title', 'events', 'dependency'],
    optionalFields: ['selected', 'dependsOn'],
    expectedSlots: {
      title: 'Timeline',
      events: ['09:00 build', '09:05 test', '09:10 publish'],
      dependency: 'publish waits for test',
      selected: 'publish',
      dependsOn: 'test',
    },
  },
] as const;

describe('DF-054 to DF-059 DOGFOOD late-family Blocks', () => {
  it('publishes the late-family block slice through the standard catalog', () => {
    expect(LATE_FAMILY_BLOCKS.map((block) => block.metadata.blockName)).toEqual([
      'BrandEmphasisBlock',
      'ModeAwarePrimitiveBlock',
      'DenseComparisonBlock',
      'HierarchyBlock',
      'ExplorationListBlock',
      'TemporalDependencyBlock',
    ]);

    expect(LATE_FAMILY_BLOCKS.map((block) => block.metadata.family)).toEqual([
      'branding',
      'primitive',
      'comparison',
      'hierarchy',
      'list',
      'graph',
    ]);
    expect(LATE_FAMILY_BLOCKS.map((block) => block.metadata.scale)).toEqual([
      'section',
      'section',
      'workspace',
      'section',
      'workspace',
      'workspace',
    ]);

    for (const block of LATE_FAMILY_BLOCKS) {
      expect(validateBlockMetadata(block.metadata).passed).toBe(true);
      expect(block.metadata.modes).toEqual([
        'interactive',
        'static',
        'pipe',
        'accessible',
      ]);
      expect(block.metadata.docs.relatedDocs ?? []).toContain(DESIGN_DOC);
      expect(block.metadata.storyIds ?? []).toContain(
        `${storyPrefix(block.metadata.blockName)}.ready`,
      );
      expect(block.data?.names()).not.toHaveLength(0);
      expect(block.commands?.map((command) => command.id)).toEqual([
        `${commandPrefix(block.metadata.blockName)}.select`,
        `${commandPrefix(block.metadata.blockName)}.copyFacts`,
        `${commandPrefix(block.metadata.blockName)}.openStory`,
      ]);
    }

    expect(standardBlocks).toEqual(expect.arrayContaining([...LATE_FAMILY_BLOCKS]));
    expect(standardBlockPackageManifest.blocks).toEqual(expect.arrayContaining([
      'BrandEmphasisBlock',
      'ModeAwarePrimitiveBlock',
      'DenseComparisonBlock',
      'HierarchyBlock',
      'ExplorationListBlock',
      'TemporalDependencyBlock',
    ]));
  });

  it('renders each late-family block across visual and lower modes', () => {
    for (const block of LATE_FAMILY_BLOCKS) {
      const slots = slotsFor(block.metadata.blockName);
      const interactive = block.render({ mode: 'interactive', slots, config: { width: 60 } });
      const staticOutput = block.render({ mode: 'static', slots, config: { width: 60 } });
      const pipe = block.render({ mode: 'pipe', slots });
      const accessible = block.render({ mode: 'accessible', slots });

      expect(typeof interactive.output).toBe('object');
      expect(typeof staticOutput.output).toBe('object');
      expect(String(pipe.output)).toContain(block.metadata.blockName);
      expect(String(accessible.output)).toContain(block.metadata.blockName);
      expect(String(pipe.output)).toContain(expectedNeedle(block.metadata.blockName));
      expect(String(accessible.output)).toContain(expectedNeedle(block.metadata.blockName));
    }
  });

  it('binds schema-validated late-family data to render slots', () => {
    for (const spec of LATE_FAMILY_SCHEMA_BLOCKS) {
      expect(isSchemaBoundBlockDefinition(spec.schemaBlock)).toBe(true);
      expect(spec.schemaBlock.block).toBe(spec.block);
      expect(spec.schemaBlock.schema.describe?.()).toMatchObject({
        requiredFields: spec.requiredFields,
        optionalFields: spec.optionalFields,
        facts: [{ kind: 'entity', key: 'block.schema', value: spec.block.metadata.blockName }],
      });

      const bound = spec.bind(spec.valid);
      expect(bound).toMatchObject({
        ok: true,
        input: { slots: spec.expectedSlots },
      });
      expect(bound.facts).toEqual(expect.arrayContaining([
        { kind: 'entity', key: 'block.schema', value: spec.block.metadata.blockName },
      ]));

      expect(spec.bind(spec.invalid)).toMatchObject({
        ok: false,
        issues: [{
          severity: 'error',
          code: `${storyPrefix(spec.block.metadata.blockName)}.data.invalid`,
        }],
      });
    }
  });

  it('rejects late-family schema accessors without invoking them', () => {
    let getterCalls = 0;
    const accessorEntry = Object.defineProperties({}, {
      title: {
        enumerable: true,
        get() {
          getterCalls += 1;
          return 'Explore components';
        },
      },
      facet: {
        enumerable: true,
        get() {
          getterCalls += 1;
          return 'input';
        },
      },
      items: {
        enumerable: true,
        get() {
          getterCalls += 1;
          return ['TextEntry field input'];
        },
      },
      selected: {
        enumerable: true,
        get() {
          getterCalls += 1;
          return 'TextEntry';
        },
      },
    });

    expect(bindSchemaBlockInput(explorationListSchemaBlock, accessorEntry)).toMatchObject({
      ok: false,
    });
    expect(getterCalls).toBe(0);
  });

  it('preserves required semantic facts in lowerings for the slice', () => {
    for (const block of LATE_FAMILY_BLOCKS) {
      const slots = slotsFor(block.metadata.blockName);
      const report = lintModeLowering({
        modes: block.metadata.modes.map((mode) => ({
          mode,
          facts: block.render({ mode, slots }).facts ?? [],
        })),
      });

      expect(report, block.metadata.blockName).toMatchObject({ passed: true });
      expect(block.render({ mode: 'pipe', slots }).facts).toEqual(expect.arrayContaining([
        { kind: 'entity', key: 'block', value: block.metadata.blockName },
        { kind: 'state', key: 'block.rendered', value: true },
        { kind: 'entity', key: 'block.family', value: block.metadata.family },
        { kind: 'state', key: 'block.variant', value: 'ready' },
        { kind: 'state', key: 'block.mode', value: 'pipe', required: false },
        {
          kind: 'label',
          key: `semanticValue.${primarySemanticSlot(block.metadata.blockName)}`,
          value: primarySemanticValue(block.metadata.blockName),
        },
      ]));
    }

    for (const block of LATE_FAMILY_BLOCKS) {
      expect(block.render({
        mode: 'pipe',
        slots: slotsFor(block.metadata.blockName),
      }).facts).toContainEqual({
        kind: 'entity',
        key: 'block.selected',
        value: selectedFactValue(block.metadata.blockName),
      });
    }
  });

  it('records the six-pack Method design proof with TUI and lower-mode mockups', () => {
    const design = readRepoFile(DESIGN_DOC);
    const changelog = readRepoFile('docs/CHANGELOG.md');

    for (const issue of ['#238', '#239', '#240', '#241', '#242', '#243']) {
      expect(design).toContain(issue);
    }
    for (const blockName of LATE_FAMILY_BLOCKS.map((block) => block.metadata.blockName)) {
      expect(design).toContain(blockName);
      expect(changelog).toContain(blockName);
    }

    expect(design).toContain('## TUI Mockups');
    expect(design).toContain('## Lower Modes');
    expect(design).toContain('Pipe mode');
    expect(design).toContain('Accessible mode');
    expect(design).toContain('Design Thinking');
  });
});

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
