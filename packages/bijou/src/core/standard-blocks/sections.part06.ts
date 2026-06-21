import { standardBlockData } from './sections.part01.js';
export const hierarchyData = standardBlockData('hierarchy', 'HierarchyBlock', [
  {
    name: 'hierarchy',
    label: 'Hierarchy facts',
    description: 'Root, node list, selected node, parent, depth, and expansion facts.',
  },
]);
export const explorationListData = standardBlockData('exploration-list', 'ExplorationListBlock', [
  {
    name: 'list',
    label: 'Exploration list facts',
    description: 'List title, facet, item list, selected item, and preview facts.',
  },
]);
export const temporalDependencyData = standardBlockData('temporal-dependency', 'TemporalDependencyBlock', [
  {
    name: 'timeline',
    label: 'Temporal dependency facts',
    description: 'Timeline title, ordered events, dependency summary, selected event, and depends-on facts.',
  },
]);
