import {
  commandIntent,
  defineDataRequirement,
  defineViewData,
  type BindingFact,
  type DeepReadonly,
} from './binding.js';
import {
  defineBlock,
  defineBlockPackage,
  isBlockDefinition,
  type BlockDefinition,
  type BlockMetadata,
  type BlockPackageManifest,
  type BlockRenderInput,
  type BlockRenderResult,
} from './block-metadata.js';
import type { OutputMode } from './detect/tty.js';
import {
  defineBlockSchemaAdapter,
  defineSchemaBlock,
  type BlockSchemaAdapter,
  type BlockSchemaResult,
  type SchemaBoundBlockDefinition,
} from './schema-block.js';
import { boxSurface } from './components/box-v3.js';
import { createTextSurface } from './components/surface-text.js';
import { createSurface, type Surface } from '../ports/surface.js';

const BIJOU_PACKAGE = '@flyingrobots/bijou';
const ALL_OUTPUT_MODES = Object.freeze([
  'interactive',
  'static',
  'pipe',
  'accessible',
] as const);

export type StandardBlockName =
  | 'AppShell'
  | 'ReaderSurface'
  | 'InspectorPanel'
  | 'InlineStatusBlock'
  | 'InFlowStatusBlock'
  | 'TransientOverlayBlock'
  | 'ActivityStreamBlock'
  | 'ShortcutCueBlock'
  | 'ProgressIndicatorBlock';
export type StandardBlockStoryState =
  | 'ready'
  | 'narrow'
  | 'overlay'
  | 'loading'
  | 'stale'
  | 'empty'
  | 'error';

export interface StandardBlockStory {
  readonly id: string;
  readonly blockName: StandardBlockName;
  readonly label: string;
  readonly state: StandardBlockStoryState;
  readonly facts: readonly BindingFact[];
}

export interface ReaderSurfaceSchemaData {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly outline?: readonly ReaderSurfaceOutlineItem[];
}

export interface ReaderSurfaceOutlineItem {
  readonly id: string;
  readonly label: string;
}

export interface InspectorPanelSchemaData {
  readonly selectionId: string;
  readonly label: string;
  readonly details?: readonly string[];
}

export interface InlineStatusSchemaData {
  readonly label: string;
  readonly status: string;
  readonly message?: string;
}

export interface InFlowStatusSchemaData {
  readonly severity: string;
  readonly source?: string;
  readonly message: string;
  readonly action?: string;
}

export interface TransientOverlaySchemaData {
  readonly priority?: string;
  readonly message: string;
  readonly dismiss?: string;
}

export interface ActivityStreamSchemaData {
  readonly events: readonly string[];
  readonly selected?: string;
}

export interface ShortcutCueSchemaData {
  readonly shortcuts: readonly string[];
  readonly scope?: string;
}

export interface ProgressIndicatorSchemaData {
  readonly label: string;
  readonly value?: string | number;
  readonly total?: string | number;
  readonly percent: string;
}

const shellFocusRegion = commandIntent<{ readonly region: string }>('shell.focusRegion', {
  label: 'Focus region',
  description: 'Move focus to a named AppShell region.',
  facts: [{ kind: 'entity', key: 'block.command', value: 'AppShell' }],
});
const shellToggleInspector = commandIntent('shell.toggleInspector', {
  label: 'Toggle inspector',
  description: 'Request inspector visibility change.',
  facts: [{ kind: 'entity', key: 'block.command', value: 'AppShell' }],
});
const shellOpenOverlay = commandIntent<{ readonly overlayId: string }>('shell.openOverlay', {
  label: 'Open overlay',
  description: 'Request a shell overlay by id.',
  facts: [{ kind: 'entity', key: 'block.command', value: 'AppShell' }],
});

const readerArticleRequirement = defineDataRequirement({
  id: 'reader.article',
  resource: 'reader.article',
  label: 'Article',
  description: 'Primary readable article content.',
  facts: [{ kind: 'entity', key: 'block.data', value: 'ReaderSurface' }],
});
const readerOutlineRequirement = defineDataRequirement({
  id: 'reader.outline',
  resource: 'reader.outline',
  label: 'Outline',
  description: 'Optional article outline for navigation.',
  optional: true,
  facts: [{ kind: 'entity', key: 'block.data', value: 'ReaderSurface' }],
});
const readerSurfaceData = defineViewData({
  id: 'reader-surface.data',
  label: 'ReaderSurface data',
  description: 'Boundary data required to render a readable content surface.',
  requirements: [
    { name: 'article', requirement: readerArticleRequirement },
    { name: 'outline', requirement: readerOutlineRequirement },
  ],
});
const readerSelectHeading = commandIntent<{ readonly headingId: string }>('reader.selectHeading', {
  label: 'Select heading',
  description: 'Select a heading inside the reader outline.',
  facts: [{ kind: 'entity', key: 'block.command', value: 'ReaderSurface' }],
});
const readerOpenReference = commandIntent<{ readonly referenceId: string }>('reader.openReference', {
  label: 'Open reference',
  description: 'Open a referenced document or citation from reader content.',
  facts: [{ kind: 'entity', key: 'block.command', value: 'ReaderSurface' }],
});

const inspectorSelectionRequirement = defineDataRequirement({
  id: 'inspector.selection',
  resource: 'inspector.selection',
  label: 'Selection',
  description: 'The active entity selected elsewhere in the app.',
  facts: [{ kind: 'entity', key: 'block.data', value: 'InspectorPanel' }],
});
const inspectorDetailsRequirement = defineDataRequirement({
  id: 'inspector.details',
  resource: 'inspector.details',
  label: 'Selection details',
  description: 'Optional detail facts for the selected entity.',
  optional: true,
  facts: [{ kind: 'entity', key: 'block.data', value: 'InspectorPanel' }],
});
const inspectorPanelData = defineViewData({
  id: 'inspector-panel.data',
  label: 'InspectorPanel data',
  description: 'Boundary data required to explain the current selection.',
  requirements: [
    { name: 'selection', requirement: inspectorSelectionRequirement },
    { name: 'details', requirement: inspectorDetailsRequirement },
  ],
});
const inspectorRevealSelection = commandIntent<{ readonly selectionId: string }>('inspector.revealSelection', {
  label: 'Reveal selection',
  description: 'Request navigation to the selected source entity.',
  facts: [{ kind: 'entity', key: 'block.command', value: 'InspectorPanel' }],
});
const inspectorFocusSource = commandIntent<{ readonly sourceId: string }>('inspector.focusSource', {
  label: 'Focus source',
  description: 'Request focus for the source associated with the active selection.',
  facts: [{ kind: 'entity', key: 'block.command', value: 'InspectorPanel' }],
});

const inlineStatusSections: readonly StandardSectionSpec[] = Object.freeze([
  { id: 'label', label: 'Label', required: true },
  { id: 'status', label: 'Status', required: true },
  { id: 'message', label: 'Message', required: false },
]);
const inFlowStatusSections: readonly StandardSectionSpec[] = Object.freeze([
  { id: 'severity', label: 'Severity', required: true },
  { id: 'source', label: 'Source', required: false },
  { id: 'message', label: 'Message', required: true },
  { id: 'action', label: 'Action', required: false },
]);
const transientOverlaySections: readonly StandardSectionSpec[] = Object.freeze([
  { id: 'priority', label: 'Priority', required: false },
  { id: 'message', label: 'Message', required: true },
  { id: 'dismiss', label: 'Dismiss', required: false },
]);
const activityStreamSections: readonly StandardSectionSpec[] = Object.freeze([
  { id: 'events', label: 'Events', required: true },
  { id: 'selected', label: 'Selected', required: false },
]);
const shortcutCueSections: readonly StandardSectionSpec[] = Object.freeze([
  { id: 'shortcuts', label: 'Shortcuts', required: true },
  { id: 'scope', label: 'Scope', required: false },
]);
const progressIndicatorSections: readonly StandardSectionSpec[] = Object.freeze([
  { id: 'label', label: 'Label', required: true },
  { id: 'value', label: 'Value', required: false },
  { id: 'total', label: 'Total', required: false },
  { id: 'percent', label: 'Percent', required: true },
]);

const inlineStatusData = standardBlockData('inline-status', 'InlineStatusBlock', [
  {
    name: 'status',
    label: 'Inline status facts',
    description: 'Label, status key, and optional status message.',
  },
]);
const inFlowStatusData = standardBlockData('in-flow-status', 'InFlowStatusBlock', [
  {
    name: 'status',
    label: 'In-flow status message',
    description: 'Durable in-flow severity, message, source, and action facts.',
  },
]);
const transientOverlayData = standardBlockData('transient-overlay', 'TransientOverlayBlock', [
  {
    name: 'overlay',
    label: 'Transient overlay event',
    description: 'Short-lived overlay message plus priority and dismissal facts.',
  },
]);
const activityStreamData = standardBlockData('activity-stream', 'ActivityStreamBlock', [
  {
    name: 'events',
    label: 'Activity events',
    description: 'Chronological event records and selected event state.',
  },
]);
const shortcutCueData = standardBlockData('shortcut-cue', 'ShortcutCueBlock', [
  {
    name: 'shortcuts',
    label: 'Shortcut cues',
    description: 'Keyboard shortcuts, action labels, and active scope facts.',
  },
]);
const progressIndicatorData = standardBlockData('progress-indicator', 'ProgressIndicatorBlock', [
  {
    name: 'progress',
    label: 'Progress state',
    description: 'Progress label, current value, total value, and percent facts.',
  },
]);

export const appShellBlock: BlockDefinition = defineBlock({
  metadata: appShellMetadata(),
  commands: [
    shellFocusRegion,
    shellToggleInspector,
    shellOpenOverlay,
  ],
  render: renderAppShellBlock,
});

export const readerSurfaceBlock: BlockDefinition = defineBlock({
  metadata: readerSurfaceMetadata(),
  data: readerSurfaceData,
  commands: [
    readerSelectHeading,
    readerOpenReference,
  ],
  render: renderReaderSurfaceBlock,
});

export const inspectorPanelBlock: BlockDefinition = defineBlock({
  metadata: inspectorPanelMetadata(),
  data: inspectorPanelData,
  commands: [
    inspectorRevealSelection,
    inspectorFocusSource,
  ],
  render: renderInspectorPanelBlock,
});

export const inlineStatusBlock: BlockDefinition = defineBlock({
  metadata: inlineStatusMetadata(),
  data: inlineStatusData,
  commands: standardFeedbackCommands('InlineStatusBlock'),
  render: (input) => renderStandardSectionBlock(
    input,
    'InlineStatusBlock',
    inlineStatusSections,
  ),
});

export const inFlowStatusBlock: BlockDefinition = defineBlock({
  metadata: inFlowStatusMetadata(),
  data: inFlowStatusData,
  commands: standardFeedbackCommands('InFlowStatusBlock'),
  render: (input) => renderStandardSectionBlock(
    input,
    'InFlowStatusBlock',
    inFlowStatusSections,
  ),
});

export const transientOverlayBlock: BlockDefinition = defineBlock({
  metadata: transientOverlayMetadata(),
  data: transientOverlayData,
  commands: standardFeedbackCommands('TransientOverlayBlock'),
  render: (input) => renderStandardSectionBlock(
    input,
    'TransientOverlayBlock',
    transientOverlaySections,
  ),
});

export const activityStreamBlock: BlockDefinition = defineBlock({
  metadata: activityStreamMetadata(),
  data: activityStreamData,
  commands: standardFeedbackCommands('ActivityStreamBlock'),
  render: (input) => renderStandardSectionBlock(
    input,
    'ActivityStreamBlock',
    activityStreamSections,
  ),
});

export const shortcutCueBlock: BlockDefinition = defineBlock({
  metadata: shortcutCueMetadata(),
  data: shortcutCueData,
  commands: standardFeedbackCommands('ShortcutCueBlock'),
  render: (input) => renderStandardSectionBlock(
    input,
    'ShortcutCueBlock',
    shortcutCueSections,
  ),
});

export const progressIndicatorBlock: BlockDefinition = defineBlock({
  metadata: progressIndicatorMetadata(),
  data: progressIndicatorData,
  commands: standardFeedbackCommands('ProgressIndicatorBlock'),
  render: (input) => renderStandardSectionBlock(
    input,
    'ProgressIndicatorBlock',
    progressIndicatorSections,
  ),
});

export const readerSurfaceSchemaAdapter: BlockSchemaAdapter<ReaderSurfaceSchemaData> =
  defineBlockSchemaAdapter({
    id: 'reader-surface.article',
    parse(input) {
      if (!isReaderSurfaceSchemaData(input)) {
        return schemaError('reader.article.invalid', 'Reader article data is required.');
      }

      return {
        ok: true,
        data: {
          id: input.id,
          title: input.title,
          body: input.body,
          ...(input.outline === undefined ? {} : { outline: input.outline }),
        },
      };
    },
    describe: () => ({
      requiredFields: ['id', 'title', 'body'],
      optionalFields: ['outline'],
      facts: [{ kind: 'entity', key: 'block.schema', value: 'ReaderSurface' }],
    }),
  });

export const inspectorPanelSchemaAdapter: BlockSchemaAdapter<InspectorPanelSchemaData> =
  defineBlockSchemaAdapter({
    id: 'inspector-panel.selection',
    parse(input) {
      if (!isInspectorPanelSchemaData(input)) {
        return schemaError('inspector.selection.invalid', 'Inspector selection data is required.');
      }

      return {
        ok: true,
        data: {
          selectionId: input.selectionId,
          label: input.label,
          ...(input.details === undefined ? {} : { details: input.details }),
        },
      };
    },
    describe: () => ({
      requiredFields: ['selectionId', 'label'],
      optionalFields: ['details'],
      facts: [{ kind: 'entity', key: 'block.schema', value: 'InspectorPanel' }],
    }),
  });

export const inlineStatusSchemaAdapter: BlockSchemaAdapter<InlineStatusSchemaData> =
  defineStandardSectionSchemaAdapter({
    id: 'inline-status.status',
    blockName: 'InlineStatusBlock',
    sections: inlineStatusSections,
    parse: parseInlineStatusSchemaData,
  });

export const inFlowStatusSchemaAdapter: BlockSchemaAdapter<InFlowStatusSchemaData> =
  defineStandardSectionSchemaAdapter({
    id: 'in-flow-status.status',
    blockName: 'InFlowStatusBlock',
    sections: inFlowStatusSections,
    parse: parseInFlowStatusSchemaData,
  });

export const transientOverlaySchemaAdapter: BlockSchemaAdapter<TransientOverlaySchemaData> =
  defineStandardSectionSchemaAdapter({
    id: 'transient-overlay.event',
    blockName: 'TransientOverlayBlock',
    sections: transientOverlaySections,
    parse: parseTransientOverlaySchemaData,
  });

export const activityStreamSchemaAdapter: BlockSchemaAdapter<ActivityStreamSchemaData> =
  defineStandardSectionSchemaAdapter({
    id: 'activity-stream.events',
    blockName: 'ActivityStreamBlock',
    sections: activityStreamSections,
    parse: parseActivityStreamSchemaData,
  });

export const shortcutCueSchemaAdapter: BlockSchemaAdapter<ShortcutCueSchemaData> =
  defineStandardSectionSchemaAdapter({
    id: 'shortcut-cue.shortcuts',
    blockName: 'ShortcutCueBlock',
    sections: shortcutCueSections,
    parse: parseShortcutCueSchemaData,
  });

export const progressIndicatorSchemaAdapter: BlockSchemaAdapter<ProgressIndicatorSchemaData> =
  defineStandardSectionSchemaAdapter({
    id: 'progress-indicator.progress',
    blockName: 'ProgressIndicatorBlock',
    sections: progressIndicatorSections,
    parse: parseProgressIndicatorSchemaData,
  });

export const readerSurfaceSchemaBlock: SchemaBoundBlockDefinition<ReaderSurfaceSchemaData> =
  defineSchemaBlock({
    block: readerSurfaceBlock,
    schema: readerSurfaceSchemaAdapter,
    bind: (article) => ({
      input: {
        slots: {
          content: article.body,
          ...(article.outline === undefined
            ? {}
            : { outline: article.outline.map((item) => item.label) }),
        },
      },
      facts: [
        { kind: 'entity', key: 'article', value: article.id },
        { kind: 'label', key: 'article.title', value: article.title },
      ],
    }),
  });

export const inspectorPanelSchemaBlock: SchemaBoundBlockDefinition<InspectorPanelSchemaData> =
  defineSchemaBlock({
    block: inspectorPanelBlock,
    schema: inspectorPanelSchemaAdapter,
    bind: (selection) => ({
      input: {
        slots: {
          selection: selection.label,
          ...(selection.details === undefined ? {} : { details: selection.details }),
        },
      },
      facts: [
        { kind: 'entity', key: 'selection', value: selection.selectionId },
        { kind: 'label', key: 'selection.label', value: selection.label },
      ],
    }),
  });

export const inlineStatusSchemaBlock: SchemaBoundBlockDefinition<InlineStatusSchemaData> =
  defineSchemaBlock({
    block: inlineStatusBlock,
    schema: inlineStatusSchemaAdapter,
    bind: (status) => bindStandardSectionSchemaData(
      'InlineStatusBlock',
      status as Readonly<Record<string, unknown>>,
      inlineStatusSections,
    ),
  });

export const inFlowStatusSchemaBlock: SchemaBoundBlockDefinition<InFlowStatusSchemaData> =
  defineSchemaBlock({
    block: inFlowStatusBlock,
    schema: inFlowStatusSchemaAdapter,
    bind: (status) => bindStandardSectionSchemaData(
      'InFlowStatusBlock',
      status as Readonly<Record<string, unknown>>,
      inFlowStatusSections,
    ),
  });

export const transientOverlaySchemaBlock: SchemaBoundBlockDefinition<TransientOverlaySchemaData> =
  defineSchemaBlock({
    block: transientOverlayBlock,
    schema: transientOverlaySchemaAdapter,
    bind: (overlay) => bindStandardSectionSchemaData(
      'TransientOverlayBlock',
      overlay as Readonly<Record<string, unknown>>,
      transientOverlaySections,
    ),
  });

export const activityStreamSchemaBlock: SchemaBoundBlockDefinition<ActivityStreamSchemaData> =
  defineSchemaBlock({
    block: activityStreamBlock,
    schema: activityStreamSchemaAdapter,
    bind: (stream) => bindStandardSectionSchemaData(
      'ActivityStreamBlock',
      stream as Readonly<Record<string, unknown>>,
      activityStreamSections,
    ),
  });

export const shortcutCueSchemaBlock: SchemaBoundBlockDefinition<ShortcutCueSchemaData> =
  defineSchemaBlock({
    block: shortcutCueBlock,
    schema: shortcutCueSchemaAdapter,
    bind: (cue) => bindStandardSectionSchemaData(
      'ShortcutCueBlock',
      cue as Readonly<Record<string, unknown>>,
      shortcutCueSections,
    ),
  });

export const progressIndicatorSchemaBlock: SchemaBoundBlockDefinition<ProgressIndicatorSchemaData> =
  defineSchemaBlock({
    block: progressIndicatorBlock,
    schema: progressIndicatorSchemaAdapter,
    bind: (progress) => bindStandardSectionSchemaData(
      'ProgressIndicatorBlock',
      progress as Readonly<Record<string, unknown>>,
      progressIndicatorSections,
    ),
  });

export const standardBlocks = Object.freeze([
  appShellBlock,
  readerSurfaceBlock,
  inspectorPanelBlock,
  inlineStatusBlock,
  inFlowStatusBlock,
  transientOverlayBlock,
  activityStreamBlock,
  shortcutCueBlock,
  progressIndicatorBlock,
]);

export const standardBlockStories: readonly StandardBlockStory[] = Object.freeze([
  standardBlockStory('app-shell.ready', 'AppShell', 'Ready shell', 'ready'),
  standardBlockStory('app-shell.narrow', 'AppShell', 'Narrow shell', 'narrow'),
  standardBlockStory('app-shell.overlay', 'AppShell', 'Overlay shell', 'overlay'),
  standardBlockStory('reader-surface.ready', 'ReaderSurface', 'Reader ready', 'ready'),
  standardBlockStory('reader-surface.loading', 'ReaderSurface', 'Reader loading', 'loading'),
  standardBlockStory('reader-surface.stale', 'ReaderSurface', 'Reader stale', 'stale'),
  standardBlockStory('reader-surface.empty', 'ReaderSurface', 'Reader empty', 'empty'),
  standardBlockStory('reader-surface.error', 'ReaderSurface', 'Reader error', 'error'),
  standardBlockStory('inspector-panel.ready', 'InspectorPanel', 'Inspector ready', 'ready'),
  standardBlockStory('inspector-panel.empty', 'InspectorPanel', 'Inspector empty', 'empty'),
  standardBlockStory('inspector-panel.loading', 'InspectorPanel', 'Inspector loading', 'loading'),
  standardBlockStory('inspector-panel.stale', 'InspectorPanel', 'Inspector stale', 'stale'),
  standardBlockStory('inspector-panel.error', 'InspectorPanel', 'Inspector error', 'error'),
  standardBlockStory('inline-status.ready', 'InlineStatusBlock', 'Inline status ready', 'ready'),
  standardBlockStory('in-flow-status.ready', 'InFlowStatusBlock', 'In-flow status ready', 'ready'),
  standardBlockStory('transient-overlay.ready', 'TransientOverlayBlock', 'Transient overlay ready', 'ready'),
  standardBlockStory('activity-stream.ready', 'ActivityStreamBlock', 'Activity stream ready', 'ready'),
  standardBlockStory('shortcut-cue.ready', 'ShortcutCueBlock', 'Shortcut cue ready', 'ready'),
  standardBlockStory('progress-indicator.ready', 'ProgressIndicatorBlock', 'Progress indicator ready', 'ready'),
]);

export const standardBlockPackageManifest: BlockPackageManifest = defineBlockPackage({
  packageName: BIJOU_PACKAGE,
  version: '5.0.0',
  bijouPeerRange: '^5.0.0',
  blocks: standardBlocks.map((block) => block.metadata.blockName),
  docs: [
    'docs/design-system/blocks.md',
    'docs/design/DX-031-standard-bijou-blocks.md',
  ],
  tags: ['standard-blocks', 'dx-031', 'first-party'],
});

function appShellMetadata(): BlockMetadata {
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

function readerSurfaceMetadata(): BlockMetadata {
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

function inspectorPanelMetadata(): BlockMetadata {
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

function inlineStatusMetadata(): BlockMetadata {
  return standardFeedbackMetadata({
    blockName: 'InlineStatusBlock',
    family: 'status',
    scale: 'inline',
    summary: 'Attaches concise status facts to labels, rows, and command hints without relying on color-only meaning.',
    useWhen: ['Showing compact status beside a label, command, row, or fact.'],
    avoidWhen: ['The message needs durable body copy, action text, or a review history.'],
    slots: inlineStatusSections,
    storyIds: ['inline-status.ready'],
    composedComponents: ['Badge', 'StatusToken', 'Text'],
    tags: ['standard', 'status', 'inline', 'df-031'],
    relatedDocs: ['docs/design/DF-031-status-feedback-standard-blocks.md'],
  });
}

function inFlowStatusMetadata(): BlockMetadata {
  return standardFeedbackMetadata({
    blockName: 'InFlowStatusBlock',
    family: 'status',
    scale: 'section',
    summary: 'Shows durable in-flow status messages with severity, source, action, and lower-mode facts.',
    useWhen: ['A page needs status copy that remains in the normal reading flow.'],
    avoidWhen: ['The feedback should disappear automatically or interrupt as an overlay.'],
    slots: inFlowStatusSections,
    storyIds: ['in-flow-status.ready'],
    composedComponents: ['Alert', 'Callout', 'StatusToken'],
    tags: ['standard', 'status', 'in-flow', 'df-032'],
    relatedDocs: ['docs/design/DF-031-status-feedback-standard-blocks.md'],
  });
}

function transientOverlayMetadata(): BlockMetadata {
  return standardFeedbackMetadata({
    blockName: 'TransientOverlayBlock',
    family: 'overlay',
    scale: 'overlay',
    summary: 'Announces short-lived state with priority, dismissal, and accessible text facts.',
    useWhen: ['A low-level toast or temporary overlay needs consistent semantics.'],
    avoidWhen: ['The feedback needs durable notification history or blocking confirmation.'],
    slots: transientOverlaySections,
    storyIds: ['transient-overlay.ready'],
    composedComponents: ['Toast', 'OverlayLayer', 'StatusToken'],
    tags: ['standard', 'overlay', 'transient', 'df-033'],
    relatedDocs: ['docs/design/DF-031-status-feedback-standard-blocks.md'],
  });
}

function activityStreamMetadata(): BlockMetadata {
  return standardFeedbackMetadata({
    blockName: 'ActivityStreamBlock',
    family: 'activity',
    scale: 'section',
    summary: 'Renders chronological events with selected-event and lower-mode facts.',
    useWhen: ['A view needs accumulating activity, event history, or release progress logs.'],
    avoidWhen: ['Only one inline status or one temporary overlay is needed.'],
    slots: activityStreamSections,
    storyIds: ['activity-stream.ready'],
    composedComponents: ['Timeline', 'Log', 'StatusToken'],
    tags: ['standard', 'activity', 'timeline', 'df-035'],
    relatedDocs: ['docs/design/DF-031-status-feedback-standard-blocks.md'],
  });
}

function shortcutCueMetadata(): BlockMetadata {
  return standardFeedbackMetadata({
    blockName: 'ShortcutCueBlock',
    family: 'shortcut',
    scale: 'inline',
    summary: 'Renders inline shortcut hints with key, action, scope, and lower-mode semantics.',
    useWhen: ['A page or shell needs compact keyboard hints near a command surface.'],
    avoidWhen: ['The user needs a complete grouped help reference.'],
    slots: shortcutCueSections,
    storyIds: ['shortcut-cue.ready'],
    composedComponents: ['Kbd', 'KeyMap', 'HelpHint'],
    tags: ['standard', 'shortcut', 'keyboard', 'df-037'],
    relatedDocs: ['docs/design/DF-031-status-feedback-standard-blocks.md'],
  });
}

function progressIndicatorMetadata(): BlockMetadata {
  return standardFeedbackMetadata({
    blockName: 'ProgressIndicatorBlock',
    family: 'progress',
    scale: 'section',
    summary: 'Exposes progress label, value, total, percent, and lower-mode progress facts.',
    useWhen: ['A task, release checklist, or operation needs explicit progress state.'],
    avoidWhen: ['The view only needs a static status label without completion state.'],
    slots: progressIndicatorSections,
    storyIds: ['progress-indicator.ready'],
    composedComponents: ['ProgressBar', 'Stepper', 'StatusToken'],
    tags: ['standard', 'progress', 'feedback', 'df-038'],
    relatedDocs: ['docs/design/DF-031-status-feedback-standard-blocks.md'],
  });
}

interface StandardFeedbackMetadataOptions {
  readonly blockName: StandardBlockName;
  readonly family: string;
  readonly scale: BlockMetadata['scale'];
  readonly summary: string;
  readonly useWhen: readonly string[];
  readonly avoidWhen: readonly string[];
  readonly slots: readonly StandardSectionSpec[];
  readonly storyIds: readonly string[];
  readonly composedComponents: readonly string[];
  readonly tags: readonly string[];
  readonly relatedDocs: readonly string[];
}

function standardFeedbackMetadata(options: StandardFeedbackMetadataOptions): BlockMetadata {
  const readyStoryId = firstFeedbackStoryId(options);

  return {
    packageName: BIJOU_PACKAGE,
    blockName: options.blockName,
    family: options.family,
    scale: options.scale,
    modes: ALL_OUTPUT_MODES,
    docs: {
      summary: options.summary,
      useWhen: options.useWhen,
      avoidWhen: options.avoidWhen,
      relatedDocs: options.relatedDocs,
    },
    sourcePath: 'packages/bijou/src/core/standard-blocks.ts',
    slots: options.slots,
    variants: [
      {
        id: 'ready',
        label: 'Ready',
        requiredSlots: options.slots
          .filter((slot) => slot.required)
          .map((slot) => slot.id),
        optionalSlots: options.slots
          .filter((slot) => !slot.required)
          .map((slot) => slot.id),
        facts: [{ kind: 'state', key: 'story.state', value: 'ready' }],
      },
    ],
    composedComponents: options.composedComponents,
    semanticFacts: [{ kind: 'entity', key: 'block', value: options.blockName }],
    storyIds: options.storyIds,
    examples: [{
      id: `${readyStoryId}.example`,
      label: `${options.blockName} ready example`,
    }],
    tags: options.tags,
  };
}

function firstFeedbackStoryId(options: StandardFeedbackMetadataOptions): string {
  const [storyId] = options.storyIds;
  if (typeof storyId !== 'string' || storyId.trim() === '') {
    throw new Error(`${options.blockName} standard metadata requires a story id`);
  }
  return storyId;
}

function standardBlockStory(
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

interface StandardBlockDataRequirementInput {
  readonly name: string;
  readonly label: string;
  readonly description: string;
  readonly optional?: boolean;
}

function standardBlockData(
  blockKey: string,
  blockName: StandardBlockName,
  requirements: readonly StandardBlockDataRequirementInput[],
) {
  return defineViewData({
    id: `${blockKey}.data`,
    label: `${blockName} data`,
    description: `Boundary data required to render ${blockName}.`,
    requirements: requirements.map((requirement) => ({
      name: requirement.name,
      requirement: defineDataRequirement({
        id: `${blockKey}.${requirement.name}`,
        resource: `blocks.${blockKey}.${requirement.name}`,
        label: requirement.label,
        description: requirement.description,
        optional: requirement.optional,
        facts: [{ kind: 'entity', key: 'block.data', value: blockName }],
      }),
    })),
  });
}

function standardFeedbackCommands(blockName: StandardBlockName) {
  const prefix = commandPrefix(blockName);
  return Object.freeze([
    commandIntent(`${prefix}.select`, {
      label: 'Select',
      description: `Request focus for ${blockName}.`,
      facts: [{ kind: 'entity', key: 'block.command', value: blockName }],
    }),
    commandIntent(`${prefix}.copyFacts`, {
      label: 'Copy facts',
      description: `Copy semantic facts from ${blockName}.`,
      facts: [{ kind: 'entity', key: 'block.command', value: blockName }],
    }),
    commandIntent(`${prefix}.openStory`, {
      label: 'Open story',
      description: `Open the DOGFOOD story for ${blockName}.`,
      facts: [{ kind: 'entity', key: 'block.command', value: blockName }],
    }),
  ]);
}

function commandPrefix(blockName: StandardBlockName): string {
  const withoutBlock = blockName.replace(/Block$/, '');
  return withoutBlock.charAt(0).toLowerCase() + withoutBlock.slice(1);
}

function standardBlockKey(blockName: StandardBlockName): string {
  return blockName
    .replace(/Block$/, '')
    .replace(
      /[A-Z]/g,
      (letter, index) => `${index === 0 ? '' : '-'}${letter.toLowerCase()}`,
    );
}

interface StandardSectionSchemaAdapterOptions<Data extends object> {
  readonly id: string;
  readonly blockName: StandardBlockName;
  readonly sections: readonly StandardSectionSpec[];
  readonly parse: (input: unknown) => Data | undefined;
}

function defineStandardSectionSchemaAdapter<Data extends object>(
  options: StandardSectionSchemaAdapterOptions<Data>,
): BlockSchemaAdapter<Data> {
  return defineBlockSchemaAdapter({
    id: options.id,
    parse(input) {
      const data = options.parse(input);
      if (data === undefined) {
        return schemaError(
          `${standardBlockKey(options.blockName)}.data.invalid`,
          `${options.blockName} data is required.`,
        );
      }

      return {
        ok: true,
        data: data as DeepReadonly<Data>,
      };
    },
    describe: () => ({
      requiredFields: options.sections
        .filter((section) => section.required)
        .map((section) => section.id),
      optionalFields: options.sections
        .filter((section) => !section.required)
        .map((section) => section.id),
      facts: [{ kind: 'entity', key: 'block.schema', value: options.blockName }],
    }),
  });
}

function bindStandardSectionSchemaData(
  blockName: StandardBlockName,
  data: Readonly<Record<string, unknown>>,
  sections: readonly StandardSectionSpec[],
) {
  const slots: Record<string, unknown> = {};
  const facts: BindingFact[] = [
    { kind: 'entity', key: 'block.schema', value: blockName },
  ];

  for (const section of sections) {
    const value = ownDataProperty(data as Record<string, unknown>, section.id);
    if (value === undefined) {
      continue;
    }

    slots[section.id] = value;
    const text = slotValueText(value);
    if (text !== undefined) {
      facts.push({ kind: 'label', key: `semanticValue.${section.id}`, value: text });
    }
  }

  return {
    input: { slots },
    facts,
  };
}

function renderAppShellBlock(input: BlockRenderInput): BlockRenderResult<string | Surface> {
  const mode = normalizeOutputMode(input.mode);
  const sections: readonly RenderSection[] = [
    renderSection('navigation', 'Navigation', ownSlotValue(input.slots, 'navigation'), false),
    renderSection('content', 'Content', ownSlotValue(input.slots, 'content'), true),
    renderSection('inspector', 'Inspector', ownSlotValue(input.slots, 'inspector'), false),
    renderSection('status', 'Status', ownSlotValue(input.slots, 'status'), false),
    renderSection('overlays', 'Overlays', ownSlotValue(input.slots, 'overlays'), false),
  ].filter((section) => section.required || section.present);

  return renderedBlockResult({
    output: mode === 'accessible'
      ? renderAccessibleSections('AppShell', sections)
      : mode === 'pipe'
        ? renderPipeSections('AppShell', sections)
        : renderVisualSectionsSurface('AppShell', sections, renderSurfaceBounds(input)),
    facts: renderFacts('AppShell', sections, 'region', mode),
  });
}

function renderReaderSurfaceBlock(input: BlockRenderInput): BlockRenderResult<string | Surface> {
  const mode = normalizeOutputMode(input.mode);
  const sections: readonly RenderSection[] = [
    renderSection('navigation', 'Navigation', ownSlotValue(input.slots, 'navigation'), false),
    renderSection('content', 'Content', ownSlotValue(input.slots, 'content'), true),
    renderSection('outline', 'Outline', ownSlotValue(input.slots, 'outline'), false),
  ].filter((section) => section.required || section.present);

  return renderedBlockResult({
    output: mode === 'accessible'
      ? renderAccessibleSections('ReaderSurface', sections)
      : mode === 'pipe'
        ? renderPipeSections('ReaderSurface', sections)
        : renderVisualSectionsSurface('ReaderSurface', sections, renderSurfaceBounds(input)),
    facts: renderFacts('ReaderSurface', sections, 'slot', mode),
  });
}

function renderInspectorPanelBlock(input: BlockRenderInput): BlockRenderResult<string | Surface> {
  const mode = normalizeOutputMode(input.mode);
  const sections: readonly RenderSection[] = [
    renderSection('selection', 'Selection', ownSlotValue(input.slots, 'selection'), true),
    renderSection('details', 'Details', ownSlotValue(input.slots, 'details'), false),
    renderSection('actions', 'Actions', ownSlotValue(input.slots, 'actions'), false),
  ].filter((section) => section.required || section.present);

  return renderedBlockResult({
    output: mode === 'accessible'
      ? renderAccessibleSections('InspectorPanel', sections)
      : mode === 'pipe'
        ? renderPipeSections('InspectorPanel', sections)
        : renderVisualSectionsSurface('InspectorPanel', sections, renderSurfaceBounds(input)),
    facts: renderFacts('InspectorPanel', sections, 'slot', mode),
  });
}

function renderStandardSectionBlock(
  input: BlockRenderInput,
  blockName: StandardBlockName,
  sectionSpecs: readonly StandardSectionSpec[],
): BlockRenderResult<string | Surface> {
  const mode = normalizeOutputMode(input.mode);
  const sections = sectionSpecs
    .map((section) => renderSection(
      section.id,
      section.label,
      ownSlotValue(input.slots, section.id),
      section.required,
    ))
    .filter((section) => section.required || section.present);

  return renderedBlockResult({
    output: mode === 'accessible'
      ? renderAccessibleSections(blockName, sections)
      : mode === 'pipe'
        ? renderPipeSections(blockName, sections)
        : renderVisualSectionsSurface(blockName, sections, renderSurfaceBounds(input)),
    facts: renderFacts(blockName, sections, 'slot', mode),
  });
}

interface StandardSectionSpec {
  readonly id: string;
  readonly label: string;
  readonly required: boolean;
  readonly description?: string;
}

interface RenderSection {
  readonly id: string;
  readonly label: string;
  readonly content: string;
  readonly visualContent: string | Surface;
  readonly required: boolean;
  readonly present: boolean;
}

interface RenderedBlockOptions {
  readonly output: string | Surface;
  readonly facts: readonly BindingFact[];
}

interface RenderSurfaceBounds {
  readonly width: number;
  readonly sectionHeight?: number;
}

function renderedBlockResult(options: RenderedBlockOptions): BlockRenderResult<string | Surface> {
  const facts = Object.freeze(options.facts.map((fact) => Object.freeze({ ...fact })));
  return Object.freeze({
    output: options.output,
    facts,
  });
}

function renderSection(
  id: string,
  label: string,
  value: unknown,
  required: boolean,
): RenderSection {
  const content = slotValueText(value);
  const visualContent = slotValueVisualContent(value, content);
  const present = content !== undefined || visualContent !== undefined;
  const fallbackContent = required ? `(missing required ${id})` : '';
  return Object.freeze({
    id,
    label,
    content: content ?? fallbackContent,
    visualContent: visualContent ?? fallbackContent,
    required,
    present,
  });
}

function renderPipeSections(blockName: StandardBlockName, sections: readonly RenderSection[]): string {
  return [
    blockName,
    ...sections.map((section) => formatSectionLine(section.id, section.content)),
  ].join('\n');
}

function renderAccessibleSections(blockName: StandardBlockName, sections: readonly RenderSection[]): string {
  return [
    blockName,
    ...sections.map((section) => formatSectionLine(section.label, section.content)),
  ].join('\n');
}

function renderVisualSectionsSurface(
  blockName: StandardBlockName,
  sections: readonly RenderSection[],
  bounds: RenderSurfaceBounds,
): Surface {
  const safeWidth = Math.max(30, Math.floor(bounds.width));
  const sectionWidth = Math.max(24, safeWidth - 4);
  const sectionContentWidth = Math.max(1, sectionWidth - 4);
  const sectionSurfaces = sections.map((section) => {
    const content = fitVisualContent(section.visualContent, sectionContentWidth, bounds.sectionHeight);
    return boxSurface(content, {
      title: section.label,
      width: sectionWidth,
      padding: { left: 1, right: 1 },
    });
  });

  return boxSurface(stackSurfaces(sectionSurfaces, 1), {
    title: blockName,
    width: safeWidth,
    padding: { left: 1, right: 1 },
  });
}

function formatSectionLine(label: string, content: string): string {
  if (content.includes('\n')) {
    return `${label}:\n${indentBlock(content)}`;
  }

  return `${label}: ${content}`;
}

function indentBlock(content: string): string {
  return content
    .split('\n')
    .map((line) => `  ${line}`)
    .join('\n');
}

function renderFacts(
  blockName: StandardBlockName,
  sections: readonly RenderSection[],
  sectionFactPrefix: 'region' | 'slot',
  mode: OutputMode,
): readonly BindingFact[] {
  const identity = standardBlockRenderIdentity(blockName);
  const facts: BindingFact[] = [
    { kind: 'entity', key: 'block', value: blockName },
    { kind: 'state', key: 'block.rendered', value: true },
    { kind: 'entity', key: 'block.family', value: identity.family },
    { kind: 'state', key: 'block.variant', value: identity.variant },
    { kind: 'state', key: 'block.mode', value: mode, required: false },
  ];
  const selectedSection = sections.find((section) => section.id === 'selected' && section.present);
  if (selectedSection !== undefined) {
    facts.push({ kind: 'entity', key: 'block.selected', value: selectedSection.content });
  }

  for (const section of sections) {
    if (section.present) {
      facts.push({
        kind: 'entity',
        key: `${sectionFactPrefix}.${section.id}`,
        value: 'present',
      });
      facts.push({
        kind: 'label',
        key: `${sectionFactPrefix}.${section.id}.value`,
        value: section.content,
      });
      facts.push({
        kind: 'label',
        key: `semanticValue.${section.id}`,
        value: section.content,
      });
    }
  }

  return facts;
}

interface StandardBlockRenderIdentity {
  readonly family: string;
  readonly variant: string;
}

function standardBlockRenderIdentity(blockName: StandardBlockName): StandardBlockRenderIdentity {
  switch (blockName) {
    case 'AppShell':
      return { family: 'app-structure', variant: 'wide' };
    case 'ReaderSurface':
      return { family: 'content-reading', variant: 'article' };
    case 'InspectorPanel':
      return { family: 'inspection', variant: 'selection' };
    case 'InlineStatusBlock':
    case 'InFlowStatusBlock':
      return { family: 'status', variant: 'ready' };
    case 'TransientOverlayBlock':
      return { family: 'overlay', variant: 'ready' };
    case 'ActivityStreamBlock':
      return { family: 'activity', variant: 'ready' };
    case 'ShortcutCueBlock':
      return { family: 'shortcut', variant: 'ready' };
    case 'ProgressIndicatorBlock':
      return { family: 'progress', variant: 'ready' };
  }
}

function normalizeOutputMode(mode: OutputMode | undefined): OutputMode {
  return ALL_OUTPUT_MODES.includes(mode as OutputMode) ? mode as OutputMode : 'interactive';
}

function renderSurfaceBounds(input: BlockRenderInput): RenderSurfaceBounds {
  const config = input.config;
  let width = 78;
  let sectionHeight: number | undefined;
  if (isPlainRecord(config)) {
    const widthValue = ownDataProperty(config, 'width');
    if (typeof widthValue === 'number' && Number.isFinite(widthValue)) {
      width = Math.max(30, Math.min(120, Math.floor(widthValue)));
    }

    const sectionHeightValue = ownDataProperty(config, 'sectionHeight');
    if (typeof sectionHeightValue === 'number' && Number.isFinite(sectionHeightValue)) {
      sectionHeight = Math.max(1, Math.min(40, Math.floor(sectionHeightValue)));
    }
  }

  return sectionHeight === undefined ? { width } : { width, sectionHeight };
}

function stackSurfaces(surfaces: readonly Surface[], gap = 0): Surface {
  if (surfaces.length === 0) {
    return createTextSurface('');
  }

  const safeGap = Math.max(0, Math.floor(gap));
  const width = Math.max(1, ...surfaces.map((surface) => surface.width));
  const height = surfaces.reduce((sum, surface) => sum + surface.height, 0)
    + (safeGap * Math.max(0, surfaces.length - 1));
  const result = createSurface(width, height);
  let y = 0;

  surfaces.forEach((surface, index) => {
    if (index > 0) {
      y += safeGap;
    }
    result.blit(surface, 0, y);
    y += surface.height;
  });

  return result;
}

function ownSlotValue(slots: Readonly<Record<string, unknown>> | undefined, key: string): unknown {
  if (!isPlainRecord(slots)) {
    return undefined;
  }

  const descriptor = Object.getOwnPropertyDescriptor(slots, key);
  return descriptor !== undefined && 'value' in descriptor ? descriptor.value : undefined;
}

function slotValueText(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (isSurfaceSlotValue(value)) {
    return surfaceSlotText(value);
  }

  if (Array.isArray(value)) {
    const parts = value
      .map((item) => slotValueText(item))
      .filter((item): item is string => item !== undefined && item.trim() !== '');
    return parts.length === 0 ? undefined : parts.join('; ');
  }

  if (isBlockDefinition(value)) {
    return value.metadata.blockName;
  }

  switch (typeof value) {
    case 'string':
      return value;
    case 'number':
    case 'boolean':
      return String(value);
    case 'object':
      return recordSlotText(value);
    default:
      return undefined;
  }
}

function slotValueVisualContent(value: unknown, textContent: string | undefined): string | Surface | undefined {
  if (isSurfaceSlotValue(value)) {
    return value;
  }

  return textContent;
}

function isSurfaceSlotValue(value: unknown): value is Surface {
  return Boolean(
    value
      && typeof value === 'object'
      && typeof (value as Surface).width === 'number'
      && typeof (value as Surface).height === 'number'
      && typeof (value as Surface).get === 'function',
  );
}

function surfaceSlotText(surface: Surface): string | undefined {
  const lines: string[] = [];
  for (let y = 0; y < surface.height; y++) {
    let line = '';
    for (let x = 0; x < surface.width; x++) {
      line += surface.get(x, y).char || ' ';
    }
    lines.push(line.trimEnd());
  }

  const text = lines.join('\n').trim();
  return text === '' ? undefined : text;
}

function recordSlotText(value: object): string | undefined {
  if (!isPlainRecord(value)) {
    return undefined;
  }

  const entries = Object.entries(Object.getOwnPropertyDescriptors(value))
    .flatMap(([key, descriptor]) => {
      if (!('value' in descriptor)) {
        return [];
      }

      const text = slotValueText(descriptor.value);
      return text === undefined ? [] : [`${key}: ${text}`];
    });
  return entries.length === 0 ? undefined : entries.join('; ');
}

function fitVisualContent(content: string | Surface, width: number, height?: number): string | Surface {
  if (typeof content === 'string') {
    return height === undefined ? content : content.split('\n').slice(0, height).join('\n');
  }

  const safeHeight = height === undefined ? content.height : Math.min(content.height, height);
  if (content.width <= width && content.height <= safeHeight) {
    return content;
  }

  const clipped = createSurface(width, safeHeight);
  clipped.blit(content, 0, 0);
  return clipped;
}

function schemaError<Data = never>(code: string, message: string): BlockSchemaResult<Data> {
  return {
    ok: false,
    issues: [{
      severity: 'error' as const,
      code,
      message,
    }],
  };
}

function parseInlineStatusSchemaData(input: unknown): InlineStatusSchemaData | undefined {
  if (!isPlainRecord(input)) {
    return undefined;
  }

  const label = textDataProperty(input, 'label');
  const status = textDataProperty(input, 'status');
  const message = textDataProperty(input, 'message');
  if (label === undefined || status === undefined) {
    return undefined;
  }

  return {
    label,
    status,
    ...(message === undefined ? {} : { message }),
  };
}

function parseInFlowStatusSchemaData(input: unknown): InFlowStatusSchemaData | undefined {
  if (!isPlainRecord(input)) {
    return undefined;
  }

  const severity = textDataProperty(input, 'severity');
  const source = textDataProperty(input, 'source');
  const message = textDataProperty(input, 'message');
  const action = textDataProperty(input, 'action');
  if (severity === undefined || message === undefined) {
    return undefined;
  }

  return {
    severity,
    ...(source === undefined ? {} : { source }),
    message,
    ...(action === undefined ? {} : { action }),
  };
}

function parseTransientOverlaySchemaData(input: unknown): TransientOverlaySchemaData | undefined {
  if (!isPlainRecord(input)) {
    return undefined;
  }

  const priority = textDataProperty(input, 'priority');
  const message = textDataProperty(input, 'message');
  const dismiss = textDataProperty(input, 'dismiss');
  if (message === undefined) {
    return undefined;
  }

  return {
    ...(priority === undefined ? {} : { priority }),
    message,
    ...(dismiss === undefined ? {} : { dismiss }),
  };
}

function parseActivityStreamSchemaData(input: unknown): ActivityStreamSchemaData | undefined {
  if (!isPlainRecord(input)) {
    return undefined;
  }

  const events = textArrayDataProperty(input, 'events');
  const selected = textDataProperty(input, 'selected');
  if (events === undefined) {
    return undefined;
  }

  return {
    events,
    ...(selected === undefined ? {} : { selected }),
  };
}

function parseShortcutCueSchemaData(input: unknown): ShortcutCueSchemaData | undefined {
  if (!isPlainRecord(input)) {
    return undefined;
  }

  const shortcuts = textArrayDataProperty(input, 'shortcuts');
  const scope = textDataProperty(input, 'scope');
  if (shortcuts === undefined) {
    return undefined;
  }

  return {
    shortcuts,
    ...(scope === undefined ? {} : { scope }),
  };
}

function parseProgressIndicatorSchemaData(input: unknown): ProgressIndicatorSchemaData | undefined {
  if (!isPlainRecord(input)) {
    return undefined;
  }

  const label = textDataProperty(input, 'label');
  const value = textOrNumberDataProperty(input, 'value');
  const total = textOrNumberDataProperty(input, 'total');
  const percent = textDataProperty(input, 'percent');
  if (label === undefined || percent === undefined) {
    return undefined;
  }

  return {
    label,
    ...(value === undefined ? {} : { value }),
    ...(total === undefined ? {} : { total }),
    percent,
  };
}

function isReaderSurfaceSchemaData(input: unknown): input is ReaderSurfaceSchemaData {
  if (!isPlainRecord(input)) {
    return false;
  }

  if (
    typeof ownDataProperty(input, 'id') !== 'string'
    || typeof ownDataProperty(input, 'title') !== 'string'
    || typeof ownDataProperty(input, 'body') !== 'string'
  ) {
    return false;
  }

  const outline = ownDataProperty(input, 'outline');
  return outline === undefined
    || (Array.isArray(outline) && outline.every(isReaderSurfaceOutlineItem));
}

function isReaderSurfaceOutlineItem(input: unknown): input is ReaderSurfaceOutlineItem {
  return isPlainRecord(input)
    && typeof ownDataProperty(input, 'id') === 'string'
    && typeof ownDataProperty(input, 'label') === 'string';
}

function isInspectorPanelSchemaData(input: unknown): input is InspectorPanelSchemaData {
  if (!isPlainRecord(input)) {
    return false;
  }

  if (
    typeof ownDataProperty(input, 'selectionId') !== 'string'
    || typeof ownDataProperty(input, 'label') !== 'string'
  ) {
    return false;
  }

  const details = ownDataProperty(input, 'details');
  return details === undefined
    || (Array.isArray(details) && details.every((detail) => typeof detail === 'string'));
}

function isPlainRecord(input: unknown): input is Record<string, unknown> {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(input);
  return prototype === Object.prototype || prototype === null;
}

function ownDataProperty(input: Record<string, unknown>, key: string): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(input, key);
  return descriptor !== undefined && 'value' in descriptor ? descriptor.value : undefined;
}

function textDataProperty(input: Record<string, unknown>, key: string): string | undefined {
  const value = ownDataProperty(input, key);
  return typeof value === 'string' ? value : undefined;
}

function textOrNumberDataProperty(input: Record<string, unknown>, key: string): string | number | undefined {
  const value = ownDataProperty(input, key);
  return typeof value === 'string' || typeof value === 'number' ? value : undefined;
}

function textArrayDataProperty(input: Record<string, unknown>, key: string): readonly string[] | undefined {
  const value = ownDataProperty(input, key);
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
    ? value
    : undefined;
}
