import type { BlockSchemaAdapter } from '../schema-block.js';

import type { DenseComparisonSchemaData, ExplorationListSchemaData, HierarchySchemaData, ModeAwarePrimitiveSchemaData, TemporalDependencySchemaData } from './types.js';

import { defineStandardSectionSchemaAdapter } from './schema-helpers.js';

import { parseDenseComparisonSchemaData, parseExplorationListSchemaData, parseHierarchySchemaData, parseModeAwarePrimitiveSchemaData, parseTemporalDependencySchemaData } from './schema-parsers-advanced.js';

import { denseComparisonSections, explorationListSections, hierarchySections, modeAwarePrimitiveSections, temporalDependencySections } from './sections.js';
export const modeAwarePrimitiveSchemaAdapter: BlockSchemaAdapter<ModeAwarePrimitiveSchemaData> =
  defineStandardSectionSchemaAdapter({
    id: 'mode-aware-primitive.primitive',
    blockName: 'ModeAwarePrimitiveBlock',
    sections: modeAwarePrimitiveSections,
    parse: parseModeAwarePrimitiveSchemaData,
  });
export const denseComparisonSchemaAdapter: BlockSchemaAdapter<DenseComparisonSchemaData> =
  defineStandardSectionSchemaAdapter({
    id: 'dense-comparison.comparison',
    blockName: 'DenseComparisonBlock',
    sections: denseComparisonSections,
    parse: parseDenseComparisonSchemaData,
  });
export const hierarchySchemaAdapter: BlockSchemaAdapter<HierarchySchemaData> =
  defineStandardSectionSchemaAdapter({
    id: 'hierarchy.hierarchy',
    blockName: 'HierarchyBlock',
    sections: hierarchySections,
    parse: parseHierarchySchemaData,
  });
export const explorationListSchemaAdapter: BlockSchemaAdapter<ExplorationListSchemaData> =
  defineStandardSectionSchemaAdapter({
    id: 'exploration-list.list',
    blockName: 'ExplorationListBlock',
    sections: explorationListSections,
    parse: parseExplorationListSchemaData,
  });
export const temporalDependencySchemaAdapter: BlockSchemaAdapter<TemporalDependencySchemaData> =
  defineStandardSectionSchemaAdapter({
    id: 'temporal-dependency.timeline',
    blockName: 'TemporalDependencyBlock',
    sections: temporalDependencySections,
    parse: parseTemporalDependencySchemaData,
  });
