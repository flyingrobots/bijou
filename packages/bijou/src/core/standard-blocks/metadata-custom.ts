import type { BlockMetadata } from '../block-metadata.js';
import { ALL_OUTPUT_MODES, BIJOU_PACKAGE } from './types.js';

export function appShellMetadata(): BlockMetadata {
  return {
    packageName: BIJOU_PACKAGE,
    blockName: 'AppShell',
    family: 'app-structure',
    scale: 'app',
    modes: ALL_OUTPUT_MODES,
    docs: {
      summary: 'Composes logical app regions for navigation, content, inspection, status, and overlays.',
      useWhen: ['Building a shell around nested Bijou blocks.'],
      avoidWhen: ['A single section or panel does not need app-level region structure.'],
      relatedDocs: ['docs/design/DX-034-declarative-view-data-binding.md'],
    },
    sourcePath: 'packages/bijou/src/core/standard-blocks.ts',
    slots: [
      { id: 'navigation', required: false, description: 'Navigation or outline blocks.' },
      { id: 'content', required: true, description: 'Primary content block.' },
      { id: 'inspector', required: false, description: 'Contextual inspection blocks.' },
      { id: 'status', required: false, description: 'Status or command feedback blocks.' },
      { id: 'overlays', required: false, description: 'Overlay block declarations.' },
    ],
    variants: [
      {
        id: 'wide',
        label: 'Wide',
        requiredSlots: ['content'],
        optionalSlots: ['navigation', 'inspector', 'status', 'overlays'],
      },
      {
        id: 'narrow',
        label: 'Narrow',
        requiredSlots: ['content'],
        optionalSlots: ['navigation', 'inspector', 'status', 'overlays'],
      },
    ],
    composedComponents: ['AppShellComposition', 'ProviderScope', 'BlockDefinition'],
    semanticFacts: [{ kind: 'entity', key: 'block', value: 'AppShell' }],
    storyIds: ['app-shell.ready', 'app-shell.narrow', 'app-shell.overlay'],
    examples: [{ id: 'app-shell.docs', label: 'Docs shell composition' }],
    tags: ['standard', 'shell', 'composition'],
  };
}

export function readerSurfaceMetadata(): BlockMetadata {
  return {
    packageName: BIJOU_PACKAGE,
    blockName: 'ReaderSurface',
    family: 'content-reading',
    scale: 'section',
    modes: ALL_OUTPUT_MODES,
    docs: {
      summary: 'Composes readable content with optional navigation and outline context.',
      useWhen: ['Rendering provider-backed prose, docs, articles, or reports.'],
      avoidWhen: ['The surface is an editable form or command palette.'],
    },
    sourcePath: 'packages/bijou/src/core/standard-blocks.ts',
    slots: [
      { id: 'content', required: true, description: 'Readable body content.' },
      { id: 'navigation', required: false, description: 'Sibling navigation content.' },
      { id: 'outline', required: false, description: 'Current content outline.' },
    ],
    variants: [
      {
        id: 'article',
        label: 'Article',
        requiredSlots: ['content'],
        optionalSlots: ['navigation', 'outline'],
      },
      {
        id: 'loading',
        label: 'Loading',
        requiredSlots: ['content'],
        optionalSlots: ['navigation', 'outline'],
        facts: [{ kind: 'state', key: 'binding.status', value: 'loading' }],
      },
    ],
    composedComponents: ['Markdown', 'Breadcrumb', 'Tree'],
    semanticFacts: [{ kind: 'entity', key: 'block', value: 'ReaderSurface' }],
    storyIds: [
      'reader-surface.ready',
      'reader-surface.loading',
      'reader-surface.stale',
      'reader-surface.empty',
      'reader-surface.error',
    ],
    examples: [{ id: 'reader-surface.docs', label: 'Docs article reader' }],
    tags: ['standard', 'reader', 'content'],
  };
}

export function inspectorPanelMetadata(): BlockMetadata {
  return {
    packageName: BIJOU_PACKAGE,
    blockName: 'InspectorPanel',
    family: 'inspection',
    scale: 'panel',
    modes: ALL_OUTPUT_MODES,
    docs: {
      summary: 'Explains the current selection with optional facts and source actions.',
      useWhen: ['Showing contextual details for a selected entity.'],
      avoidWhen: ['The view owns primary content rather than selection explanation.'],
    },
    sourcePath: 'packages/bijou/src/core/standard-blocks.ts',
    slots: [
      { id: 'selection', required: true, description: 'Selected entity label or summary.' },
      { id: 'details', required: false, description: 'Facts or properties for the selected entity.' },
      { id: 'actions', required: false, description: 'Selection-specific command affordances.' },
    ],
    variants: [
      {
        id: 'selection',
        label: 'Selection',
        requiredSlots: ['selection'],
        optionalSlots: ['details', 'actions'],
      },
      {
        id: 'empty',
        label: 'Empty',
        requiredSlots: ['selection'],
        optionalSlots: ['details', 'actions'],
        facts: [{ kind: 'state', key: 'binding.status', value: 'empty' }],
      },
    ],
    composedComponents: ['Inspector', 'StatsPanel', 'Log'],
    semanticFacts: [{ kind: 'entity', key: 'block', value: 'InspectorPanel' }],
    storyIds: [
      'inspector-panel.ready',
      'inspector-panel.empty',
      'inspector-panel.loading',
      'inspector-panel.stale',
      'inspector-panel.error',
    ],
    examples: [{ id: 'inspector-panel.selection', label: 'Selection inspector' }],
    tags: ['standard', 'inspector', 'selection'],
  };
}
