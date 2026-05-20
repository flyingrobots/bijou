import {
  commandIntent,
  defineDataRequirement,
  defineViewData,
  type BindingFact,
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

const BIJOU_PACKAGE = '@flyingrobots/bijou';
const ALL_OUTPUT_MODES = Object.freeze([
  'interactive',
  'static',
  'pipe',
  'accessible',
] as const);

export type StandardBlockName = 'AppShell' | 'ReaderSurface' | 'InspectorPanel';
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

export const standardBlocks = Object.freeze([
  appShellBlock,
  readerSurfaceBlock,
  inspectorPanelBlock,
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

function renderAppShellBlock(input: BlockRenderInput): BlockRenderResult<string> {
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
        : renderVisualSections('AppShell', sections),
    facts: renderFacts('AppShell', sections, 'region'),
  });
}

function renderReaderSurfaceBlock(input: BlockRenderInput): BlockRenderResult<string> {
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
        : renderVisualSections('ReaderSurface', sections),
    facts: renderFacts('ReaderSurface', sections, 'slot'),
  });
}

function renderInspectorPanelBlock(input: BlockRenderInput): BlockRenderResult<string> {
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
        : renderVisualSections('InspectorPanel', sections),
    facts: renderFacts('InspectorPanel', sections, 'slot'),
  });
}

interface RenderSection {
  readonly id: string;
  readonly label: string;
  readonly content: string;
  readonly required: boolean;
  readonly present: boolean;
}

interface RenderedBlockOptions {
  readonly output: string;
  readonly facts: readonly BindingFact[];
}

function renderedBlockResult(options: RenderedBlockOptions): BlockRenderResult<string> {
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
  const present = content !== undefined;
  return Object.freeze({
    id,
    label,
    content: content ?? (required ? `(missing required ${id})` : ''),
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

function renderVisualSections(blockName: StandardBlockName, sections: readonly RenderSection[]): string {
  return [
    blockName,
    ...sections.flatMap((section) => [
      `--- ${section.label} ---`,
      indentBlock(section.content),
    ]),
  ].join('\n');
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
): readonly BindingFact[] {
  const facts: BindingFact[] = [
    { kind: 'entity', key: 'block', value: blockName },
    { kind: 'state', key: 'block.rendered', value: true },
  ];

  for (const section of sections) {
    if (section.present) {
      facts.push({ kind: 'entity', key: `${sectionFactPrefix}.${section.id}`, value: 'present' });
    }
  }

  return facts;
}

function normalizeOutputMode(mode: OutputMode | undefined): OutputMode {
  return ALL_OUTPUT_MODES.includes(mode as OutputMode) ? mode as OutputMode : 'interactive';
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
