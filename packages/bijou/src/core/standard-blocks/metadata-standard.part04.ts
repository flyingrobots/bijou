import type { BindingFact } from '../binding.js';
import type { BlockMetadata } from '../block-metadata.js';
import type { StandardBlockName, StandardBlockStory, StandardBlockStoryState } from './types.js';
import { denseComparisonSections, explorationListSections, hierarchySections, temporalDependencySections } from './sections.js';
import { standardSectionMetadata } from './metadata-standard.part01.js';

export function denseComparisonMetadata(): BlockMetadata {
  return standardSectionMetadata({
    blockName: 'DenseComparisonBlock',
    family: 'comparison',
    scale: 'workspace',
    summary: 'Publishes dense comparison rows with metric, left value, right value, delta, and selected row facts.',
    useWhen: ['A workspace needs compact side-by-side comparison data that survives narrow and lower modes.'],
    avoidWhen: ['The view is a scalar progress state or a free-form document.'],
    slots: denseComparisonSections,
    storyIds: ['dense-comparison.ready'],
    composedComponents: ['Table', 'MetricGrid', 'ComparisonRow'],
    tags: ['standard', 'comparison', 'dense', 'df-056'],
    relatedDocs: ['docs/design/DF-054-late-family-standard-blocks.md'],
  });
}

export function hierarchyMetadata(): BlockMetadata {
  return standardSectionMetadata({
    blockName: 'HierarchyBlock',
    family: 'hierarchy',
    scale: 'section',
    summary: 'Describes tree state with root, nodes, selected node, parent, depth, and expansion facts.',
    useWhen: ['A docs tree, file tree, or outline must expose hierarchy without relying on indentation alone.'],
    avoidWhen: ['The surface is only peer navigation or a flat exploratory list.'],
    slots: hierarchySections,
    storyIds: ['hierarchy.ready'],
    composedComponents: ['Tree', 'Outline', 'Explorer'],
    tags: ['standard', 'hierarchy', 'tree', 'df-057'],
    relatedDocs: ['docs/design/DF-054-late-family-standard-blocks.md'],
  });
}

export function explorationListMetadata(): BlockMetadata {
  return standardSectionMetadata({
    blockName: 'ExplorationListBlock',
    family: 'list',
    scale: 'workspace',
    summary: 'Combines title, facet, items, selected item, and preview detail into a browsing Block.',
    useWhen: ['A workspace needs filtered exploration with selectable rows and preview context.'],
    avoidWhen: ['The list is a strict hierarchy, timeline, or dense metric comparison.'],
    slots: explorationListSections,
    storyIds: ['exploration-list.ready'],
    composedComponents: ['List', 'FacetBar', 'PreviewPane'],
    tags: ['standard', 'list', 'exploration', 'df-058'],
    relatedDocs: ['docs/design/DF-054-late-family-standard-blocks.md'],
  });
}

export function temporalDependencyMetadata(): BlockMetadata {
  return standardSectionMetadata({
    blockName: 'TemporalDependencyBlock',
    family: 'graph',
    scale: 'workspace',
    summary: 'Shows timeline and dependency facts with sequence, selected event, and depends-on semantics.',
    useWhen: ['A workflow needs time ordering and dependency meaning in one lowerable view.'],
    avoidWhen: ['The surface only needs unordered activity, scalar progress, or a static list.'],
    slots: temporalDependencySections,
    storyIds: ['temporal-dependency.ready'],
    composedComponents: ['Timeline', 'DependencyGraph', 'ActivityStream'],
    tags: ['standard', 'graph', 'temporal', 'dependency', 'df-059'],
    relatedDocs: ['docs/design/DF-054-late-family-standard-blocks.md'],
  });
}

export function standardBlockStory(
  id: string,
  blockName: StandardBlockName,
  label: string,
  state: StandardBlockStoryState,
): StandardBlockStory {
  const facts: readonly BindingFact[] = Object.freeze([
    Object.freeze({ kind: 'entity', key: 'block', value: blockName }),
    Object.freeze({ kind: 'state', key: 'story.state', value: state }),
  ]);

  return Object.freeze({
    id,
    blockName,
    label,
    state,
    facts,
  });
}
