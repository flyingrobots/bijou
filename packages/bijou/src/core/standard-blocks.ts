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
  | 'ProgressIndicatorBlock'
  | 'FramedGroupBlock'
  | 'ExplainabilityWalkthroughBlock'
  | 'FormattedDocumentBlock'
  | 'LinkDestinationBlock'
  | 'DividerBlock'
  | 'TextEntryBlock'
  | 'SingleChoiceBlock'
  | 'MultipleChoiceBlock'
  | 'BinaryDecisionBlock'
  | 'PeerNavigationBlock'
  | 'ProgressiveDisclosureBlock'
  | 'PathProgressBlock'
  | 'BrandEmphasisBlock'
  | 'ModeAwarePrimitiveBlock'
  | 'DenseComparisonBlock'
  | 'HierarchyBlock'
  | 'ExplorationListBlock'
  | 'TemporalDependencyBlock';
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

export interface FramedGroupSchemaData {
  readonly title: string;
  readonly items: readonly string[];
  readonly selected?: string;
  readonly mode?: string;
}

export interface ExplainabilityWalkthroughSchemaData {
  readonly title: string;
  readonly steps: readonly string[];
  readonly evidence?: string;
  readonly decision?: string;
  readonly nextStep?: string;
}

export interface FormattedDocumentSchemaData {
  readonly heading: string;
  readonly body: string;
  readonly callout?: string;
  readonly code?: string;
}

export interface LinkDestinationSchemaData {
  readonly label: string;
  readonly destination: string;
  readonly kind?: string;
  readonly status?: string;
}

export interface DividerSchemaData {
  readonly label: string;
  readonly style?: string;
  readonly density?: string;
}

export interface TextEntrySchemaData {
  readonly field: string;
  readonly value: string;
  readonly placeholder?: string;
  readonly validation?: string;
  readonly results?: string | number;
}

export interface SingleChoiceSchemaData {
  readonly label: string;
  readonly options: readonly string[];
  readonly selected: string;
  readonly mode?: string;
  readonly validation?: string;
}

export interface MultipleChoiceSchemaData {
  readonly label: string;
  readonly checked: readonly string[];
  readonly unchecked: readonly string[];
  readonly selected?: string;
  readonly validation?: string;
}

export interface BinaryDecisionSchemaData {
  readonly label: string;
  readonly selected: string;
  readonly consequence: string;
  readonly confirmation?: string;
  readonly disabledReason?: string;
}

export interface PeerNavigationSchemaData {
  readonly previous: string;
  readonly current: string;
  readonly next: string;
  readonly route?: string;
  readonly status?: string;
}

export interface ProgressiveDisclosureSchemaData {
  readonly label: string;
  readonly state: string;
  readonly hiddenCount: string | number;
  readonly summary?: string;
  readonly details?: readonly string[];
}

export interface PathProgressSchemaData {
  readonly path: readonly string[];
  readonly current: string;
  readonly step: string | number;
  readonly total: string | number;
  readonly status?: string;
}

export interface BrandEmphasisSchemaData {
  readonly brand: string;
  readonly tagline: string;
  readonly decoration: string;
  readonly role?: string;
  readonly selected?: string;
}

export interface ModeAwarePrimitiveSchemaData {
  readonly primitive: string;
  readonly fact: string;
  readonly value: string | number;
  readonly status?: string;
  readonly modeContract?: string;
  readonly selected?: string;
}

export interface DenseComparisonSchemaData {
  readonly title: string;
  readonly metric: string;
  readonly left: string;
  readonly right: string;
  readonly delta: string;
  readonly selected?: string;
}

export interface HierarchySchemaData {
  readonly root: string;
  readonly nodes: readonly string[];
  readonly selected: string;
  readonly parent?: string;
  readonly depth?: string | number;
  readonly expanded?: string;
}

export interface ExplorationListSchemaData {
  readonly title: string;
  readonly facet: string;
  readonly items: readonly string[];
  readonly selected: string;
  readonly preview?: string;
}

export interface TemporalDependencySchemaData {
  readonly title: string;
  readonly events: readonly string[];
  readonly dependency: string;
  readonly selected?: string;
  readonly dependsOn?: string;
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
const framedGroupSections: readonly StandardSectionSpec[] = Object.freeze([
  { id: 'title', label: 'Title', required: true },
  { id: 'items', label: 'Items', required: true },
  { id: 'selected', label: 'Selected', required: false },
  { id: 'mode', label: 'Mode', required: false },
]);
const explainabilityWalkthroughSections: readonly StandardSectionSpec[] = Object.freeze([
  { id: 'title', label: 'Title', required: true },
  { id: 'steps', label: 'Steps', required: true },
  { id: 'evidence', label: 'Evidence', required: false },
  { id: 'decision', label: 'Decision', required: false },
  { id: 'nextStep', label: 'Next step', required: false },
]);
const formattedDocumentSections: readonly StandardSectionSpec[] = Object.freeze([
  { id: 'heading', label: 'Heading', required: true },
  { id: 'body', label: 'Body', required: true },
  { id: 'callout', label: 'Callout', required: false },
  { id: 'code', label: 'Code', required: false },
]);
const linkDestinationSections: readonly StandardSectionSpec[] = Object.freeze([
  { id: 'label', label: 'Label', required: true },
  { id: 'destination', label: 'Destination', required: true },
  { id: 'kind', label: 'Kind', required: false },
  { id: 'status', label: 'Status', required: false },
]);
const dividerSections: readonly StandardSectionSpec[] = Object.freeze([
  { id: 'label', label: 'Label', required: true },
  { id: 'style', label: 'Style', required: false },
  { id: 'density', label: 'Density', required: false },
]);
const textEntrySections: readonly StandardSectionSpec[] = Object.freeze([
  { id: 'field', label: 'Field', required: true },
  { id: 'value', label: 'Value', required: true },
  { id: 'placeholder', label: 'Placeholder', required: false },
  { id: 'validation', label: 'Validation', required: false },
  { id: 'results', label: 'Results', required: false },
]);
const singleChoiceSections: readonly StandardSectionSpec[] = Object.freeze([
  { id: 'label', label: 'Label', required: true },
  { id: 'options', label: 'Options', required: true },
  { id: 'selected', label: 'Selected', required: true },
  { id: 'mode', label: 'Mode', required: false },
  { id: 'validation', label: 'Validation', required: false },
]);
const multipleChoiceSections: readonly StandardSectionSpec[] = Object.freeze([
  { id: 'label', label: 'Label', required: true },
  { id: 'checked', label: 'Checked', required: true },
  { id: 'unchecked', label: 'Unchecked', required: true },
  { id: 'selected', label: 'Selected', required: false },
  { id: 'validation', label: 'Validation', required: false },
]);
const binaryDecisionSections: readonly StandardSectionSpec[] = Object.freeze([
  { id: 'label', label: 'Label', required: true },
  { id: 'selected', label: 'Selected', required: true },
  { id: 'consequence', label: 'Consequence', required: true },
  { id: 'confirmation', label: 'Confirmation', required: false },
  { id: 'disabledReason', label: 'Disabled reason', required: false },
]);
const peerNavigationSections: readonly StandardSectionSpec[] = Object.freeze([
  { id: 'previous', label: 'Previous', required: true },
  { id: 'current', label: 'Current', required: true },
  { id: 'next', label: 'Next', required: true },
  { id: 'route', label: 'Route', required: false },
  { id: 'status', label: 'Status', required: false },
]);
const progressiveDisclosureSections: readonly StandardSectionSpec[] = Object.freeze([
  { id: 'label', label: 'Label', required: true },
  { id: 'state', label: 'State', required: true },
  { id: 'hiddenCount', label: 'Hidden count', required: true },
  { id: 'summary', label: 'Summary', required: false },
  { id: 'details', label: 'Details', required: false },
]);
const pathProgressSections: readonly StandardSectionSpec[] = Object.freeze([
  { id: 'path', label: 'Path', required: true },
  { id: 'current', label: 'Current', required: true },
  { id: 'step', label: 'Step', required: true },
  { id: 'total', label: 'Total', required: true },
  { id: 'status', label: 'Status', required: false },
]);
const brandEmphasisSections: readonly StandardSectionSpec[] = Object.freeze([
  { id: 'brand', label: 'Brand', required: true },
  { id: 'tagline', label: 'Tagline', required: true },
  { id: 'decoration', label: 'Decoration', required: true },
  { id: 'role', label: 'Role', required: false },
  { id: 'selected', label: 'Selected', required: false },
]);
const modeAwarePrimitiveSections: readonly StandardSectionSpec[] = Object.freeze([
  { id: 'primitive', label: 'Primitive', required: true },
  { id: 'fact', label: 'Fact', required: true },
  { id: 'value', label: 'Value', required: true },
  { id: 'status', label: 'Status', required: false },
  { id: 'modeContract', label: 'Mode contract', required: false },
  { id: 'selected', label: 'Selected', required: false },
]);
const denseComparisonSections: readonly StandardSectionSpec[] = Object.freeze([
  { id: 'title', label: 'Title', required: true },
  { id: 'metric', label: 'Metric', required: true },
  { id: 'left', label: 'Left', required: true },
  { id: 'right', label: 'Right', required: true },
  { id: 'delta', label: 'Delta', required: true },
  { id: 'selected', label: 'Selected', required: false },
]);
const hierarchySections: readonly StandardSectionSpec[] = Object.freeze([
  { id: 'root', label: 'Root', required: true },
  { id: 'nodes', label: 'Nodes', required: true },
  { id: 'selected', label: 'Selected', required: true },
  { id: 'parent', label: 'Parent', required: false },
  { id: 'depth', label: 'Depth', required: false },
  { id: 'expanded', label: 'Expanded', required: false },
]);
const explorationListSections: readonly StandardSectionSpec[] = Object.freeze([
  { id: 'title', label: 'Title', required: true },
  { id: 'facet', label: 'Facet', required: true },
  { id: 'items', label: 'Items', required: true },
  { id: 'selected', label: 'Selected', required: true },
  { id: 'preview', label: 'Preview', required: false },
]);
const temporalDependencySections: readonly StandardSectionSpec[] = Object.freeze([
  { id: 'title', label: 'Title', required: true },
  { id: 'events', label: 'Events', required: true },
  { id: 'dependency', label: 'Dependency', required: true },
  { id: 'selected', label: 'Selected', required: false },
  { id: 'dependsOn', label: 'Depends on', required: false },
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
const framedGroupData = standardBlockData('framed-group', 'FramedGroupBlock', [
  {
    name: 'group',
    label: 'Framed grouping facts',
    description: 'Group title, ordered items, selected item, and review mode facts.',
  },
]);
const explainabilityWalkthroughData = standardBlockData(
  'explainability-walkthrough',
  'ExplainabilityWalkthroughBlock',
  [
    {
      name: 'walkthrough',
      label: 'Explainability walkthrough',
      description: 'Decision title, ordered explanation steps, evidence, decision, and next-step facts.',
    },
  ],
);
const formattedDocumentData = standardBlockData('formatted-document', 'FormattedDocumentBlock', [
  {
    name: 'document',
    label: 'Formatted document content',
    description: 'Heading, body, callout, and code facts for persistent prose.',
  },
]);
const linkDestinationData = standardBlockData('link-destination', 'LinkDestinationBlock', [
  {
    name: 'link',
    label: 'Linked destination',
    description: 'Link label, destination, kind, and availability facts.',
  },
]);
const dividerData = standardBlockData('divider', 'DividerBlock', [
  {
    name: 'divider',
    label: 'Divider structure',
    description: 'Divider label, visual style, and density facts.',
  },
]);
const textEntryData = standardBlockData('text-entry', 'TextEntryBlock', [
  {
    name: 'entry',
    label: 'Text entry state',
    description: 'Field label, current value, placeholder, validation, and result-count facts.',
  },
]);
const singleChoiceData = standardBlockData('single-choice', 'SingleChoiceBlock', [
  {
    name: 'choice',
    label: 'Single choice state',
    description: 'Choice label, option list, selected value, mode, and validation facts.',
  },
]);
const multipleChoiceData = standardBlockData('multiple-choice', 'MultipleChoiceBlock', [
  {
    name: 'choices',
    label: 'Multiple choice state',
    description: 'Checklist label, checked options, unchecked options, selected summary, and validation facts.',
  },
]);
const binaryDecisionData = standardBlockData('binary-decision', 'BinaryDecisionBlock', [
  {
    name: 'decision',
    label: 'Binary decision state',
    description: 'Decision label, selected side, consequence, confirmation, and disabled-reason facts.',
  },
]);
const peerNavigationData = standardBlockData('peer-navigation', 'PeerNavigationBlock', [
  {
    name: 'peers',
    label: 'Peer navigation state',
    description: 'Previous, current, next, route, and availability facts.',
  },
]);
const progressiveDisclosureData = standardBlockData(
  'progressive-disclosure',
  'ProgressiveDisclosureBlock',
  [
    {
      name: 'disclosure',
      label: 'Progressive disclosure state',
      description: 'Disclosure label, open or closed state, hidden count, summary, and detail facts.',
    },
  ],
);
const pathProgressData = standardBlockData('path-progress', 'PathProgressBlock', [
  {
    name: 'path',
    label: 'Path progress state',
    description: 'Path labels, current step, ordinal step, total step count, and status facts.',
  },
]);
const brandEmphasisData = standardBlockData('brand-emphasis', 'BrandEmphasisBlock', [
  {
    name: 'brand',
    label: 'Brand emphasis facts',
    description: 'Brand text, tagline, decorative treatment, role, and selected emphasis facts.',
  },
]);
const modeAwarePrimitiveData = standardBlockData('mode-aware-primitive', 'ModeAwarePrimitiveBlock', [
  {
    name: 'primitive',
    label: 'Mode-aware primitive facts',
    description: 'Primitive identity, fact key, value, status, mode contract, and selected primitive facts.',
  },
]);
const denseComparisonData = standardBlockData('dense-comparison', 'DenseComparisonBlock', [
  {
    name: 'comparison',
    label: 'Dense comparison facts',
    description: 'Comparison title, metric, left value, right value, delta, and selected metric facts.',
  },
]);
const hierarchyData = standardBlockData('hierarchy', 'HierarchyBlock', [
  {
    name: 'hierarchy',
    label: 'Hierarchy facts',
    description: 'Root, node list, selected node, parent, depth, and expansion facts.',
  },
]);
const explorationListData = standardBlockData('exploration-list', 'ExplorationListBlock', [
  {
    name: 'list',
    label: 'Exploration list facts',
    description: 'List title, facet, item list, selected item, and preview facts.',
  },
]);
const temporalDependencyData = standardBlockData('temporal-dependency', 'TemporalDependencyBlock', [
  {
    name: 'timeline',
    label: 'Temporal dependency facts',
    description: 'Timeline title, ordered events, dependency summary, selected event, and depends-on facts.',
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
  commands: standardSectionCommands('InlineStatusBlock'),
  render: (input) => renderStandardSectionBlock(
    input,
    'InlineStatusBlock',
    inlineStatusSections,
  ),
});

export const inFlowStatusBlock: BlockDefinition = defineBlock({
  metadata: inFlowStatusMetadata(),
  data: inFlowStatusData,
  commands: standardSectionCommands('InFlowStatusBlock'),
  render: (input) => renderStandardSectionBlock(
    input,
    'InFlowStatusBlock',
    inFlowStatusSections,
  ),
});

export const transientOverlayBlock: BlockDefinition = defineBlock({
  metadata: transientOverlayMetadata(),
  data: transientOverlayData,
  commands: standardSectionCommands('TransientOverlayBlock'),
  render: (input) => renderStandardSectionBlock(
    input,
    'TransientOverlayBlock',
    transientOverlaySections,
  ),
});

export const activityStreamBlock: BlockDefinition = defineBlock({
  metadata: activityStreamMetadata(),
  data: activityStreamData,
  commands: standardSectionCommands('ActivityStreamBlock'),
  render: (input) => renderStandardSectionBlock(
    input,
    'ActivityStreamBlock',
    activityStreamSections,
  ),
});

export const shortcutCueBlock: BlockDefinition = defineBlock({
  metadata: shortcutCueMetadata(),
  data: shortcutCueData,
  commands: standardSectionCommands('ShortcutCueBlock'),
  render: (input) => renderStandardSectionBlock(
    input,
    'ShortcutCueBlock',
    shortcutCueSections,
  ),
});

export const progressIndicatorBlock: BlockDefinition = defineBlock({
  metadata: progressIndicatorMetadata(),
  data: progressIndicatorData,
  commands: standardSectionCommands('ProgressIndicatorBlock'),
  render: (input) => renderStandardSectionBlock(
    input,
    'ProgressIndicatorBlock',
    progressIndicatorSections,
  ),
});

export const framedGroupBlock: BlockDefinition = defineBlock({
  metadata: framedGroupMetadata(),
  data: framedGroupData,
  commands: standardSectionCommands('FramedGroupBlock'),
  render: (input) => renderStandardSectionBlock(
    input,
    'FramedGroupBlock',
    framedGroupSections,
  ),
});

export const explainabilityWalkthroughBlock: BlockDefinition = defineBlock({
  metadata: explainabilityWalkthroughMetadata(),
  data: explainabilityWalkthroughData,
  commands: standardSectionCommands('ExplainabilityWalkthroughBlock'),
  render: (input) => renderStandardSectionBlock(
    input,
    'ExplainabilityWalkthroughBlock',
    explainabilityWalkthroughSections,
  ),
});

export const formattedDocumentBlock: BlockDefinition = defineBlock({
  metadata: formattedDocumentMetadata(),
  data: formattedDocumentData,
  commands: standardSectionCommands('FormattedDocumentBlock'),
  render: (input) => renderStandardSectionBlock(
    input,
    'FormattedDocumentBlock',
    formattedDocumentSections,
  ),
});

export const linkDestinationBlock: BlockDefinition = defineBlock({
  metadata: linkDestinationMetadata(),
  data: linkDestinationData,
  commands: standardSectionCommands('LinkDestinationBlock'),
  render: (input) => renderStandardSectionBlock(
    input,
    'LinkDestinationBlock',
    linkDestinationSections,
  ),
});

export const dividerBlock: BlockDefinition = defineBlock({
  metadata: dividerMetadata(),
  data: dividerData,
  commands: standardSectionCommands('DividerBlock'),
  render: (input) => renderStandardSectionBlock(
    input,
    'DividerBlock',
    dividerSections,
  ),
});

export const textEntryBlock: BlockDefinition = defineBlock({
  metadata: textEntryMetadata(),
  data: textEntryData,
  commands: standardSectionCommands('TextEntryBlock'),
  render: (input) => renderStandardSectionBlock(
    input,
    'TextEntryBlock',
    textEntrySections,
  ),
});

export const singleChoiceBlock: BlockDefinition = defineBlock({
  metadata: singleChoiceMetadata(),
  data: singleChoiceData,
  commands: standardSectionCommands('SingleChoiceBlock'),
  render: (input) => renderStandardSectionBlock(
    input,
    'SingleChoiceBlock',
    singleChoiceSections,
  ),
});

export const multipleChoiceBlock: BlockDefinition = defineBlock({
  metadata: multipleChoiceMetadata(),
  data: multipleChoiceData,
  commands: standardSectionCommands('MultipleChoiceBlock'),
  render: (input) => renderStandardSectionBlock(
    input,
    'MultipleChoiceBlock',
    multipleChoiceSections,
  ),
});

export const binaryDecisionBlock: BlockDefinition = defineBlock({
  metadata: binaryDecisionMetadata(),
  data: binaryDecisionData,
  commands: standardSectionCommands('BinaryDecisionBlock'),
  render: (input) => renderStandardSectionBlock(
    input,
    'BinaryDecisionBlock',
    binaryDecisionSections,
  ),
});

export const peerNavigationBlock: BlockDefinition = defineBlock({
  metadata: peerNavigationMetadata(),
  data: peerNavigationData,
  commands: standardSectionCommands('PeerNavigationBlock'),
  render: (input) => renderStandardSectionBlock(
    input,
    'PeerNavigationBlock',
    peerNavigationSections,
  ),
});

export const progressiveDisclosureBlock: BlockDefinition = defineBlock({
  metadata: progressiveDisclosureMetadata(),
  data: progressiveDisclosureData,
  commands: standardSectionCommands('ProgressiveDisclosureBlock'),
  render: (input) => renderStandardSectionBlock(
    input,
    'ProgressiveDisclosureBlock',
    progressiveDisclosureSections,
  ),
});

export const pathProgressBlock: BlockDefinition = defineBlock({
  metadata: pathProgressMetadata(),
  data: pathProgressData,
  commands: standardSectionCommands('PathProgressBlock'),
  render: (input) => renderStandardSectionBlock(
    input,
    'PathProgressBlock',
    pathProgressSections,
  ),
});

export const brandEmphasisBlock: BlockDefinition = defineBlock({
  metadata: brandEmphasisMetadata(),
  data: brandEmphasisData,
  commands: standardSectionCommands('BrandEmphasisBlock'),
  render: (input) => renderStandardSectionBlock(
    input,
    'BrandEmphasisBlock',
    brandEmphasisSections,
  ),
});

export const modeAwarePrimitiveBlock: BlockDefinition = defineBlock({
  metadata: modeAwarePrimitiveMetadata(),
  data: modeAwarePrimitiveData,
  commands: standardSectionCommands('ModeAwarePrimitiveBlock'),
  render: (input) => renderStandardSectionBlock(
    input,
    'ModeAwarePrimitiveBlock',
    modeAwarePrimitiveSections,
  ),
});

export const denseComparisonBlock: BlockDefinition = defineBlock({
  metadata: denseComparisonMetadata(),
  data: denseComparisonData,
  commands: standardSectionCommands('DenseComparisonBlock'),
  render: (input) => renderStandardSectionBlock(
    input,
    'DenseComparisonBlock',
    denseComparisonSections,
  ),
});

export const hierarchyBlock: BlockDefinition = defineBlock({
  metadata: hierarchyMetadata(),
  data: hierarchyData,
  commands: standardSectionCommands('HierarchyBlock'),
  render: (input) => renderStandardSectionBlock(
    input,
    'HierarchyBlock',
    hierarchySections,
  ),
});

export const explorationListBlock: BlockDefinition = defineBlock({
  metadata: explorationListMetadata(),
  data: explorationListData,
  commands: standardSectionCommands('ExplorationListBlock'),
  render: (input) => renderStandardSectionBlock(
    input,
    'ExplorationListBlock',
    explorationListSections,
  ),
});

export const temporalDependencyBlock: BlockDefinition = defineBlock({
  metadata: temporalDependencyMetadata(),
  data: temporalDependencyData,
  commands: standardSectionCommands('TemporalDependencyBlock'),
  render: (input) => renderStandardSectionBlock(
    input,
    'TemporalDependencyBlock',
    temporalDependencySections,
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

export const framedGroupSchemaAdapter: BlockSchemaAdapter<FramedGroupSchemaData> =
  defineStandardSectionSchemaAdapter({
    id: 'framed-group.group',
    blockName: 'FramedGroupBlock',
    sections: framedGroupSections,
    parse: parseFramedGroupSchemaData,
  });

export const explainabilityWalkthroughSchemaAdapter:
  BlockSchemaAdapter<ExplainabilityWalkthroughSchemaData> =
  defineStandardSectionSchemaAdapter({
    id: 'explainability-walkthrough.walkthrough',
    blockName: 'ExplainabilityWalkthroughBlock',
    sections: explainabilityWalkthroughSections,
    parse: parseExplainabilityWalkthroughSchemaData,
  });

export const formattedDocumentSchemaAdapter: BlockSchemaAdapter<FormattedDocumentSchemaData> =
  defineStandardSectionSchemaAdapter({
    id: 'formatted-document.document',
    blockName: 'FormattedDocumentBlock',
    sections: formattedDocumentSections,
    parse: parseFormattedDocumentSchemaData,
  });

export const linkDestinationSchemaAdapter: BlockSchemaAdapter<LinkDestinationSchemaData> =
  defineStandardSectionSchemaAdapter({
    id: 'link-destination.link',
    blockName: 'LinkDestinationBlock',
    sections: linkDestinationSections,
    parse: parseLinkDestinationSchemaData,
  });

export const dividerSchemaAdapter: BlockSchemaAdapter<DividerSchemaData> =
  defineStandardSectionSchemaAdapter({
    id: 'divider.divider',
    blockName: 'DividerBlock',
    sections: dividerSections,
    parse: parseDividerSchemaData,
  });

export const textEntrySchemaAdapter: BlockSchemaAdapter<TextEntrySchemaData> =
  defineStandardSectionSchemaAdapter({
    id: 'text-entry.entry',
    blockName: 'TextEntryBlock',
    sections: textEntrySections,
    parse: parseTextEntrySchemaData,
  });

export const singleChoiceSchemaAdapter: BlockSchemaAdapter<SingleChoiceSchemaData> =
  defineStandardSectionSchemaAdapter({
    id: 'single-choice.choice',
    blockName: 'SingleChoiceBlock',
    sections: singleChoiceSections,
    parse: parseSingleChoiceSchemaData,
  });

export const multipleChoiceSchemaAdapter: BlockSchemaAdapter<MultipleChoiceSchemaData> =
  defineStandardSectionSchemaAdapter({
    id: 'multiple-choice.choices',
    blockName: 'MultipleChoiceBlock',
    sections: multipleChoiceSections,
    parse: parseMultipleChoiceSchemaData,
  });

export const binaryDecisionSchemaAdapter: BlockSchemaAdapter<BinaryDecisionSchemaData> =
  defineStandardSectionSchemaAdapter({
    id: 'binary-decision.decision',
    blockName: 'BinaryDecisionBlock',
    sections: binaryDecisionSections,
    parse: parseBinaryDecisionSchemaData,
  });

export const peerNavigationSchemaAdapter: BlockSchemaAdapter<PeerNavigationSchemaData> =
  defineStandardSectionSchemaAdapter({
    id: 'peer-navigation.peers',
    blockName: 'PeerNavigationBlock',
    sections: peerNavigationSections,
    parse: parsePeerNavigationSchemaData,
  });

export const progressiveDisclosureSchemaAdapter:
  BlockSchemaAdapter<ProgressiveDisclosureSchemaData> =
  defineStandardSectionSchemaAdapter({
    id: 'progressive-disclosure.disclosure',
    blockName: 'ProgressiveDisclosureBlock',
    sections: progressiveDisclosureSections,
    parse: parseProgressiveDisclosureSchemaData,
  });

export const pathProgressSchemaAdapter: BlockSchemaAdapter<PathProgressSchemaData> =
  defineStandardSectionSchemaAdapter({
    id: 'path-progress.path',
    blockName: 'PathProgressBlock',
    sections: pathProgressSections,
    parse: parsePathProgressSchemaData,
  });

export const brandEmphasisSchemaAdapter: BlockSchemaAdapter<BrandEmphasisSchemaData> =
  defineStandardSectionSchemaAdapter({
    id: 'brand-emphasis.brand',
    blockName: 'BrandEmphasisBlock',
    sections: brandEmphasisSections,
    parse: parseBrandEmphasisSchemaData,
  });

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

export const framedGroupSchemaBlock: SchemaBoundBlockDefinition<FramedGroupSchemaData> =
  defineSchemaBlock({
    block: framedGroupBlock,
    schema: framedGroupSchemaAdapter,
    bind: (group) => bindStandardSectionSchemaData(
      'FramedGroupBlock',
      group as Readonly<Record<string, unknown>>,
      framedGroupSections,
    ),
  });

export const explainabilityWalkthroughSchemaBlock:
  SchemaBoundBlockDefinition<ExplainabilityWalkthroughSchemaData> =
  defineSchemaBlock({
    block: explainabilityWalkthroughBlock,
    schema: explainabilityWalkthroughSchemaAdapter,
    bind: (walkthrough) => bindStandardSectionSchemaData(
      'ExplainabilityWalkthroughBlock',
      walkthrough as Readonly<Record<string, unknown>>,
      explainabilityWalkthroughSections,
    ),
  });

export const formattedDocumentSchemaBlock: SchemaBoundBlockDefinition<FormattedDocumentSchemaData> =
  defineSchemaBlock({
    block: formattedDocumentBlock,
    schema: formattedDocumentSchemaAdapter,
    bind: (document) => bindStandardSectionSchemaData(
      'FormattedDocumentBlock',
      document as Readonly<Record<string, unknown>>,
      formattedDocumentSections,
    ),
  });

export const linkDestinationSchemaBlock: SchemaBoundBlockDefinition<LinkDestinationSchemaData> =
  defineSchemaBlock({
    block: linkDestinationBlock,
    schema: linkDestinationSchemaAdapter,
    bind: (link) => bindStandardSectionSchemaData(
      'LinkDestinationBlock',
      link as Readonly<Record<string, unknown>>,
      linkDestinationSections,
    ),
  });

export const dividerSchemaBlock: SchemaBoundBlockDefinition<DividerSchemaData> =
  defineSchemaBlock({
    block: dividerBlock,
    schema: dividerSchemaAdapter,
    bind: (divider) => bindStandardSectionSchemaData(
      'DividerBlock',
      divider as Readonly<Record<string, unknown>>,
      dividerSections,
    ),
  });

export const textEntrySchemaBlock: SchemaBoundBlockDefinition<TextEntrySchemaData> =
  defineSchemaBlock({
    block: textEntryBlock,
    schema: textEntrySchemaAdapter,
    bind: (entry) => bindStandardSectionSchemaData(
      'TextEntryBlock',
      entry as Readonly<Record<string, unknown>>,
      textEntrySections,
    ),
  });

export const singleChoiceSchemaBlock: SchemaBoundBlockDefinition<SingleChoiceSchemaData> =
  defineSchemaBlock({
    block: singleChoiceBlock,
    schema: singleChoiceSchemaAdapter,
    bind: (choice) => bindStandardSectionSchemaData(
      'SingleChoiceBlock',
      choice as Readonly<Record<string, unknown>>,
      singleChoiceSections,
    ),
  });

export const multipleChoiceSchemaBlock: SchemaBoundBlockDefinition<MultipleChoiceSchemaData> =
  defineSchemaBlock({
    block: multipleChoiceBlock,
    schema: multipleChoiceSchemaAdapter,
    bind: (choices) => bindStandardSectionSchemaData(
      'MultipleChoiceBlock',
      choices as Readonly<Record<string, unknown>>,
      multipleChoiceSections,
    ),
  });

export const binaryDecisionSchemaBlock: SchemaBoundBlockDefinition<BinaryDecisionSchemaData> =
  defineSchemaBlock({
    block: binaryDecisionBlock,
    schema: binaryDecisionSchemaAdapter,
    bind: (decision) => bindStandardSectionSchemaData(
      'BinaryDecisionBlock',
      decision as Readonly<Record<string, unknown>>,
      binaryDecisionSections,
    ),
  });

export const peerNavigationSchemaBlock: SchemaBoundBlockDefinition<PeerNavigationSchemaData> =
  defineSchemaBlock({
    block: peerNavigationBlock,
    schema: peerNavigationSchemaAdapter,
    bind: (peers) => bindStandardSectionSchemaData(
      'PeerNavigationBlock',
      peers as Readonly<Record<string, unknown>>,
      peerNavigationSections,
    ),
  });

export const progressiveDisclosureSchemaBlock:
  SchemaBoundBlockDefinition<ProgressiveDisclosureSchemaData> =
  defineSchemaBlock({
    block: progressiveDisclosureBlock,
    schema: progressiveDisclosureSchemaAdapter,
    bind: (disclosure) => bindStandardSectionSchemaData(
      'ProgressiveDisclosureBlock',
      disclosure as Readonly<Record<string, unknown>>,
      progressiveDisclosureSections,
    ),
  });

export const pathProgressSchemaBlock: SchemaBoundBlockDefinition<PathProgressSchemaData> =
  defineSchemaBlock({
    block: pathProgressBlock,
    schema: pathProgressSchemaAdapter,
    bind: (path) => bindStandardSectionSchemaData(
      'PathProgressBlock',
      path as Readonly<Record<string, unknown>>,
      pathProgressSections,
    ),
  });

export const brandEmphasisSchemaBlock: SchemaBoundBlockDefinition<BrandEmphasisSchemaData> =
  defineSchemaBlock({
    block: brandEmphasisBlock,
    schema: brandEmphasisSchemaAdapter,
    bind: (brand) => bindStandardSectionSchemaData(
      'BrandEmphasisBlock',
      brand as Readonly<Record<string, unknown>>,
      brandEmphasisSections,
    ),
  });

export const modeAwarePrimitiveSchemaBlock:
  SchemaBoundBlockDefinition<ModeAwarePrimitiveSchemaData> =
  defineSchemaBlock({
    block: modeAwarePrimitiveBlock,
    schema: modeAwarePrimitiveSchemaAdapter,
    bind: (primitive) => bindStandardSectionSchemaData(
      'ModeAwarePrimitiveBlock',
      primitive as Readonly<Record<string, unknown>>,
      modeAwarePrimitiveSections,
    ),
  });

export const denseComparisonSchemaBlock: SchemaBoundBlockDefinition<DenseComparisonSchemaData> =
  defineSchemaBlock({
    block: denseComparisonBlock,
    schema: denseComparisonSchemaAdapter,
    bind: (comparison) => bindStandardSectionSchemaData(
      'DenseComparisonBlock',
      comparison as Readonly<Record<string, unknown>>,
      denseComparisonSections,
    ),
  });

export const hierarchySchemaBlock: SchemaBoundBlockDefinition<HierarchySchemaData> =
  defineSchemaBlock({
    block: hierarchyBlock,
    schema: hierarchySchemaAdapter,
    bind: (hierarchy) => bindStandardSectionSchemaData(
      'HierarchyBlock',
      hierarchy as Readonly<Record<string, unknown>>,
      hierarchySections,
    ),
  });

export const explorationListSchemaBlock: SchemaBoundBlockDefinition<ExplorationListSchemaData> =
  defineSchemaBlock({
    block: explorationListBlock,
    schema: explorationListSchemaAdapter,
    bind: (list) => bindStandardSectionSchemaData(
      'ExplorationListBlock',
      list as Readonly<Record<string, unknown>>,
      explorationListSections,
    ),
  });

export const temporalDependencySchemaBlock:
  SchemaBoundBlockDefinition<TemporalDependencySchemaData> =
  defineSchemaBlock({
    block: temporalDependencyBlock,
    schema: temporalDependencySchemaAdapter,
    bind: (timeline) => bindStandardSectionSchemaData(
      'TemporalDependencyBlock',
      timeline as Readonly<Record<string, unknown>>,
      temporalDependencySections,
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
  framedGroupBlock,
  explainabilityWalkthroughBlock,
  formattedDocumentBlock,
  linkDestinationBlock,
  dividerBlock,
  textEntryBlock,
  singleChoiceBlock,
  multipleChoiceBlock,
  binaryDecisionBlock,
  peerNavigationBlock,
  progressiveDisclosureBlock,
  pathProgressBlock,
  brandEmphasisBlock,
  modeAwarePrimitiveBlock,
  denseComparisonBlock,
  hierarchyBlock,
  explorationListBlock,
  temporalDependencyBlock,
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
  standardBlockStory('framed-group.ready', 'FramedGroupBlock', 'Framed group ready', 'ready'),
  standardBlockStory(
    'explainability-walkthrough.ready',
    'ExplainabilityWalkthroughBlock',
    'Explainability walkthrough ready',
    'ready',
  ),
  standardBlockStory('formatted-document.ready', 'FormattedDocumentBlock', 'Formatted document ready', 'ready'),
  standardBlockStory('link-destination.ready', 'LinkDestinationBlock', 'Link destination ready', 'ready'),
  standardBlockStory('divider.ready', 'DividerBlock', 'Divider ready', 'ready'),
  standardBlockStory('text-entry.ready', 'TextEntryBlock', 'Text entry ready', 'ready'),
  standardBlockStory('single-choice.ready', 'SingleChoiceBlock', 'Single choice ready', 'ready'),
  standardBlockStory('multiple-choice.ready', 'MultipleChoiceBlock', 'Multiple choice ready', 'ready'),
  standardBlockStory('binary-decision.ready', 'BinaryDecisionBlock', 'Binary decision ready', 'ready'),
  standardBlockStory('peer-navigation.ready', 'PeerNavigationBlock', 'Peer navigation ready', 'ready'),
  standardBlockStory(
    'progressive-disclosure.ready',
    'ProgressiveDisclosureBlock',
    'Progressive disclosure ready',
    'ready',
  ),
  standardBlockStory('path-progress.ready', 'PathProgressBlock', 'Path progress ready', 'ready'),
  standardBlockStory('brand-emphasis.ready', 'BrandEmphasisBlock', 'Brand emphasis ready', 'ready'),
  standardBlockStory(
    'mode-aware-primitive.ready',
    'ModeAwarePrimitiveBlock',
    'Mode-aware primitive ready',
    'ready',
  ),
  standardBlockStory('dense-comparison.ready', 'DenseComparisonBlock', 'Dense comparison ready', 'ready'),
  standardBlockStory('hierarchy.ready', 'HierarchyBlock', 'Hierarchy ready', 'ready'),
  standardBlockStory('exploration-list.ready', 'ExplorationListBlock', 'Exploration list ready', 'ready'),
  standardBlockStory(
    'temporal-dependency.ready',
    'TemporalDependencyBlock',
    'Temporal dependency ready',
    'ready',
  ),
]);

export const standardBlockPackageManifest: BlockPackageManifest = defineBlockPackage({
  packageName: BIJOU_PACKAGE,
  version: '5.0.0',
  bijouPeerRange: '^5.0.0',
  blocks: standardBlocks.map((block) => block.metadata.blockName),
  docs: [
    'docs/design-system/blocks.md',
    'docs/design/DX-031-standard-bijou-blocks.md',
    'docs/design/DF-039-component-family-standard-blocks.md',
    'docs/design/DF-046-choice-navigation-standard-blocks.md',
    'docs/design/DF-054-late-family-standard-blocks.md',
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
  return standardSectionMetadata({
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
  return standardSectionMetadata({
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
  return standardSectionMetadata({
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
  return standardSectionMetadata({
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
  return standardSectionMetadata({
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
  return standardSectionMetadata({
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

function framedGroupMetadata(): BlockMetadata {
  return standardSectionMetadata({
    blockName: 'FramedGroupBlock',
    family: 'grouping',
    scale: 'section',
    summary: 'Groups related content in a framed region with title, selected item, and lower-mode grouping facts.',
    useWhen: ['A page needs a named group of related rows, checks, or facts that should lower as one unit.'],
    avoidWhen: ['The content is a document section that does not need a framed group boundary.'],
    slots: framedGroupSections,
    storyIds: ['framed-group.ready'],
    composedComponents: ['Box', 'HeaderBox', 'SectionGroup'],
    tags: ['standard', 'grouping', 'framed', 'df-039'],
    relatedDocs: ['docs/design/DF-039-component-family-standard-blocks.md'],
  });
}

function explainabilityWalkthroughMetadata(): BlockMetadata {
  return standardSectionMetadata({
    blockName: 'ExplainabilityWalkthroughBlock',
    family: 'explainability',
    scale: 'section',
    summary: 'Explains why a state changed with ordered steps, evidence, decision, and next action facts.',
    useWhen: ['A workflow needs a durable walkthrough of reasoning, evidence, or change causality.'],
    avoidWhen: ['The view only needs a compact status message or an activity log.'],
    slots: explainabilityWalkthroughSections,
    storyIds: ['explainability-walkthrough.ready'],
    composedComponents: ['Callout', 'Timeline', 'Inspector'],
    tags: ['standard', 'explainability', 'walkthrough', 'df-040'],
    relatedDocs: ['docs/design/DF-039-component-family-standard-blocks.md'],
  });
}

function formattedDocumentMetadata(): BlockMetadata {
  return standardSectionMetadata({
    blockName: 'FormattedDocumentBlock',
    family: 'document',
    scale: 'section',
    summary: 'Publishes persistent prose with heading, body, callout, and code facts that survive lower modes.',
    useWhen: ['A docs or report surface needs formatted prose semantics without owning app navigation.'],
    avoidWhen: ['The content is a one-line label, status, link, or editable input.'],
    slots: formattedDocumentSections,
    storyIds: ['formatted-document.ready'],
    composedComponents: ['Markdown', 'Prose', 'Callout', 'CodeBlock'],
    tags: ['standard', 'document', 'prose', 'df-042'],
    relatedDocs: ['docs/design/DF-039-component-family-standard-blocks.md'],
  });
}

function linkDestinationMetadata(): BlockMetadata {
  return standardSectionMetadata({
    blockName: 'LinkDestinationBlock',
    family: 'navigation',
    scale: 'inline',
    summary: 'Describes a navigable destination with label, target, kind, status, and lower-mode link facts.',
    useWhen: ['A surface needs a concrete destination that can lower to plain text without losing the target.'],
    avoidWhen: ['The interaction changes local state without navigating to an external or document destination.'],
    slots: linkDestinationSections,
    storyIds: ['link-destination.ready'],
    composedComponents: ['Link', 'Breadcrumb', 'CommandItem'],
    tags: ['standard', 'link', 'navigation', 'df-043'],
    relatedDocs: ['docs/design/DF-039-component-family-standard-blocks.md'],
  });
}

function dividerMetadata(): BlockMetadata {
  return standardSectionMetadata({
    blockName: 'DividerBlock',
    family: 'structure',
    scale: 'inline',
    summary: 'Separates sections with a labeled structural rule that remains meaningful in pipe and accessible modes.',
    useWhen: ['A page needs a named break between content regions or evidence groups.'],
    avoidWhen: ['The break is purely decorative and has no semantic label.'],
    slots: dividerSections,
    storyIds: ['divider.ready'],
    composedComponents: ['Rule', 'Separator', 'HeadingRule'],
    tags: ['standard', 'divider', 'structure', 'df-044'],
    relatedDocs: ['docs/design/DF-039-component-family-standard-blocks.md'],
  });
}

function textEntryMetadata(): BlockMetadata {
  return standardSectionMetadata({
    blockName: 'TextEntryBlock',
    family: 'input',
    scale: 'section',
    summary: 'Describes a text input state with field, value, placeholder, validation, and result facts.',
    useWhen: ['A search, filter, or form surface needs inspectable text-entry semantics.'],
    avoidWhen: ['The control is a choice, toggle, or multi-field form that needs its own structured contract.'],
    slots: textEntrySections,
    storyIds: ['text-entry.ready'],
    composedComponents: ['Input', 'SearchBox', 'ValidationMessage'],
    tags: ['standard', 'input', 'text-entry', 'df-045'],
    relatedDocs: ['docs/design/DF-039-component-family-standard-blocks.md'],
  });
}

function singleChoiceMetadata(): BlockMetadata {
  return standardSectionMetadata({
    blockName: 'SingleChoiceBlock',
    family: 'input',
    scale: 'section',
    summary: 'Describes a single-choice control with option list, selected value, mode, and validation facts.',
    useWhen: ['A radio, select, or segmented control needs semantic option and selected-value lowerings.'],
    avoidWhen: ['More than one option can be selected at the same time.'],
    slots: singleChoiceSections,
    storyIds: ['single-choice.ready'],
    composedComponents: ['RadioGroup', 'Select', 'SegmentedControl'],
    tags: ['standard', 'input', 'single-choice', 'df-046'],
    relatedDocs: ['docs/design/DF-046-choice-navigation-standard-blocks.md'],
  });
}

function multipleChoiceMetadata(): BlockMetadata {
  return standardSectionMetadata({
    blockName: 'MultipleChoiceBlock',
    family: 'input',
    scale: 'section',
    summary: 'Describes a checklist with checked, unchecked, selected summary, and validation facts.',
    useWhen: ['A checklist or multi-select surface needs option identity and checked-state lowerings.'],
    avoidWhen: ['The interaction permits exactly one selected option.'],
    slots: multipleChoiceSections,
    storyIds: ['multiple-choice.ready'],
    composedComponents: ['CheckboxGroup', 'Checklist', 'ValidationMessage'],
    tags: ['standard', 'input', 'multiple-choice', 'df-047'],
    relatedDocs: ['docs/design/DF-046-choice-navigation-standard-blocks.md'],
  });
}

function binaryDecisionMetadata(): BlockMetadata {
  return standardSectionMetadata({
    blockName: 'BinaryDecisionBlock',
    family: 'input',
    scale: 'section',
    summary: 'Describes a yes/no decision with selected side, consequence, confirmation, and disabled-reason facts.',
    useWhen: ['A confirmation, destructive action, or merge gate needs explicit binary decision semantics.'],
    avoidWhen: ['The choice has more than two meaningful options or needs a free-form reason field.'],
    slots: binaryDecisionSections,
    storyIds: ['binary-decision.ready'],
    composedComponents: ['ConfirmDialog', 'ButtonGroup', 'DecisionPrompt'],
    tags: ['standard', 'input', 'binary-decision', 'df-048'],
    relatedDocs: ['docs/design/DF-046-choice-navigation-standard-blocks.md'],
  });
}

function peerNavigationMetadata(): BlockMetadata {
  return standardSectionMetadata({
    blockName: 'PeerNavigationBlock',
    family: 'navigation',
    scale: 'section',
    summary: 'Describes sibling navigation with previous, current, next, route, and availability facts.',
    useWhen: ['A document or workflow needs peer navigation without losing previous/current/next relationships.'],
    avoidWhen: ['The navigation is a full tree, global sidebar, or breadcrumb path.'],
    slots: peerNavigationSections,
    storyIds: ['peer-navigation.ready'],
    composedComponents: ['Pager', 'Tabs', 'Breadcrumb'],
    tags: ['standard', 'navigation', 'peer', 'df-050'],
    relatedDocs: ['docs/design/DF-046-choice-navigation-standard-blocks.md'],
  });
}

function progressiveDisclosureMetadata(): BlockMetadata {
  return standardSectionMetadata({
    blockName: 'ProgressiveDisclosureBlock',
    family: 'disclosure',
    scale: 'section',
    summary: 'Describes expandable content with disclosure state, hidden count, summary, and details.',
    useWhen: ['A details region, advanced options group, or expandable explainer needs durable state facts.'],
    avoidWhen: ['The hidden content should be modeled as navigation, pagination, or a modal overlay.'],
    slots: progressiveDisclosureSections,
    storyIds: ['progressive-disclosure.ready'],
    composedComponents: ['Disclosure', 'Details', 'Accordion'],
    tags: ['standard', 'disclosure', 'progressive', 'df-051'],
    relatedDocs: ['docs/design/DF-046-choice-navigation-standard-blocks.md'],
  });
}

function pathProgressMetadata(): BlockMetadata {
  return standardSectionMetadata({
    blockName: 'PathProgressBlock',
    family: 'navigation',
    scale: 'section',
    summary: 'Describes breadcrumb and step progress state with path, current step, ordinal, total, and status facts.',
    useWhen: ['A workflow needs both path context and step progress lowerings.'],
    avoidWhen: ['The surface is a scalar progress meter without path or current-step semantics.'],
    slots: pathProgressSections,
    storyIds: ['path-progress.ready'],
    composedComponents: ['Breadcrumb', 'Stepper', 'ProgressIndicator'],
    tags: ['standard', 'navigation', 'path-progress', 'df-052'],
    relatedDocs: ['docs/design/DF-046-choice-navigation-standard-blocks.md'],
  });
}

function brandEmphasisMetadata(): BlockMetadata {
  return standardSectionMetadata({
    blockName: 'BrandEmphasisBlock',
    family: 'branding',
    scale: 'section',
    summary: 'Describes brand and decorative emphasis with explicit nonessential-decoration semantics.',
    useWhen: ['A product surface needs brand text, tagline, and decorative treatment to lower without color or chrome.'],
    avoidWhen: ['The emphasis is only a structural divider or a navigable destination.'],
    slots: brandEmphasisSections,
    storyIds: ['brand-emphasis.ready'],
    composedComponents: ['LogoLockup', 'AccentRule', 'Heading'],
    tags: ['standard', 'branding', 'emphasis', 'df-054'],
    relatedDocs: ['docs/design/DF-054-late-family-standard-blocks.md'],
  });
}

function modeAwarePrimitiveMetadata(): BlockMetadata {
  return standardSectionMetadata({
    blockName: 'ModeAwarePrimitiveBlock',
    family: 'primitive',
    scale: 'section',
    summary: 'Captures custom primitive output with explicit mode contracts and fact/value semantics.',
    useWhen: ['A custom primitive needs to publish its meaning before DOGFOOD treats it as reusable.'],
    avoidWhen: ['The surface already has a richer family contract such as comparison, hierarchy, or list.'],
    slots: modeAwarePrimitiveSections,
    storyIds: ['mode-aware-primitive.ready'],
    composedComponents: ['Badge', 'Metric', 'PrimitiveAdapter'],
    tags: ['standard', 'primitive', 'mode-aware', 'df-055'],
    relatedDocs: ['docs/design/DF-054-late-family-standard-blocks.md'],
  });
}

function denseComparisonMetadata(): BlockMetadata {
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

function hierarchyMetadata(): BlockMetadata {
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

function explorationListMetadata(): BlockMetadata {
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

function temporalDependencyMetadata(): BlockMetadata {
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

interface StandardSectionMetadataOptions {
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

function standardSectionMetadata(options: StandardSectionMetadataOptions): BlockMetadata {
  const readyStoryId = firstStandardStoryId(options);

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

function firstStandardStoryId(options: StandardSectionMetadataOptions): string {
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

function standardSectionCommands(blockName: StandardBlockName) {
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
    case 'FramedGroupBlock':
      return { family: 'grouping', variant: 'ready' };
    case 'ExplainabilityWalkthroughBlock':
      return { family: 'explainability', variant: 'ready' };
    case 'FormattedDocumentBlock':
      return { family: 'document', variant: 'ready' };
    case 'LinkDestinationBlock':
      return { family: 'navigation', variant: 'ready' };
    case 'DividerBlock':
      return { family: 'structure', variant: 'ready' };
    case 'TextEntryBlock':
      return { family: 'input', variant: 'ready' };
    case 'SingleChoiceBlock':
    case 'MultipleChoiceBlock':
    case 'BinaryDecisionBlock':
      return { family: 'input', variant: 'ready' };
    case 'PeerNavigationBlock':
    case 'PathProgressBlock':
      return { family: 'navigation', variant: 'ready' };
    case 'ProgressiveDisclosureBlock':
      return { family: 'disclosure', variant: 'ready' };
    case 'BrandEmphasisBlock':
      return { family: 'branding', variant: 'ready' };
    case 'ModeAwarePrimitiveBlock':
      return { family: 'primitive', variant: 'ready' };
    case 'DenseComparisonBlock':
      return { family: 'comparison', variant: 'ready' };
    case 'HierarchyBlock':
      return { family: 'hierarchy', variant: 'ready' };
    case 'ExplorationListBlock':
      return { family: 'list', variant: 'ready' };
    case 'TemporalDependencyBlock':
      return { family: 'graph', variant: 'ready' };
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

function parseFramedGroupSchemaData(input: unknown): FramedGroupSchemaData | undefined {
  if (!isPlainRecord(input)) {
    return undefined;
  }

  const title = textDataProperty(input, 'title');
  const items = textArrayDataProperty(input, 'items');
  const selected = textDataProperty(input, 'selected');
  const mode = textDataProperty(input, 'mode');
  if (title === undefined || items === undefined) {
    return undefined;
  }

  return {
    title,
    items,
    ...(selected === undefined ? {} : { selected }),
    ...(mode === undefined ? {} : { mode }),
  };
}

function parseExplainabilityWalkthroughSchemaData(
  input: unknown,
): ExplainabilityWalkthroughSchemaData | undefined {
  if (!isPlainRecord(input)) {
    return undefined;
  }

  const title = textDataProperty(input, 'title');
  const steps = textArrayDataProperty(input, 'steps');
  const evidence = textDataProperty(input, 'evidence');
  const decision = textDataProperty(input, 'decision');
  const nextStep = textDataProperty(input, 'nextStep');
  if (title === undefined || steps === undefined) {
    return undefined;
  }

  return {
    title,
    steps,
    ...(evidence === undefined ? {} : { evidence }),
    ...(decision === undefined ? {} : { decision }),
    ...(nextStep === undefined ? {} : { nextStep }),
  };
}

function parseFormattedDocumentSchemaData(input: unknown): FormattedDocumentSchemaData | undefined {
  if (!isPlainRecord(input)) {
    return undefined;
  }

  const heading = textDataProperty(input, 'heading');
  const body = textDataProperty(input, 'body');
  const callout = textDataProperty(input, 'callout');
  const code = textDataProperty(input, 'code');
  if (heading === undefined || body === undefined) {
    return undefined;
  }

  return {
    heading,
    body,
    ...(callout === undefined ? {} : { callout }),
    ...(code === undefined ? {} : { code }),
  };
}

function parseLinkDestinationSchemaData(input: unknown): LinkDestinationSchemaData | undefined {
  if (!isPlainRecord(input)) {
    return undefined;
  }

  const label = textDataProperty(input, 'label');
  const destination = textDataProperty(input, 'destination');
  const kind = textDataProperty(input, 'kind');
  const status = textDataProperty(input, 'status');
  if (label === undefined || destination === undefined) {
    return undefined;
  }

  return {
    label,
    destination,
    ...(kind === undefined ? {} : { kind }),
    ...(status === undefined ? {} : { status }),
  };
}

function parseDividerSchemaData(input: unknown): DividerSchemaData | undefined {
  if (!isPlainRecord(input)) {
    return undefined;
  }

  const label = textDataProperty(input, 'label');
  const style = textDataProperty(input, 'style');
  const density = textDataProperty(input, 'density');
  if (label === undefined) {
    return undefined;
  }

  return {
    label,
    ...(style === undefined ? {} : { style }),
    ...(density === undefined ? {} : { density }),
  };
}

function parseTextEntrySchemaData(input: unknown): TextEntrySchemaData | undefined {
  if (!isPlainRecord(input)) {
    return undefined;
  }

  const field = textDataProperty(input, 'field');
  const value = textDataProperty(input, 'value');
  const placeholder = textDataProperty(input, 'placeholder');
  const validation = textDataProperty(input, 'validation');
  const results = textOrNumberDataProperty(input, 'results');
  if (field === undefined || value === undefined) {
    return undefined;
  }

  return {
    field,
    value,
    ...(placeholder === undefined ? {} : { placeholder }),
    ...(validation === undefined ? {} : { validation }),
    ...(results === undefined ? {} : { results }),
  };
}

function parseSingleChoiceSchemaData(input: unknown): SingleChoiceSchemaData | undefined {
  if (!isPlainRecord(input)) {
    return undefined;
  }

  const label = textDataProperty(input, 'label');
  const options = textArrayDataProperty(input, 'options');
  const selected = textDataProperty(input, 'selected');
  const mode = textDataProperty(input, 'mode');
  const validation = textDataProperty(input, 'validation');
  if (label === undefined || options === undefined || selected === undefined) {
    return undefined;
  }

  return {
    label,
    options,
    selected,
    ...(mode === undefined ? {} : { mode }),
    ...(validation === undefined ? {} : { validation }),
  };
}

function parseMultipleChoiceSchemaData(input: unknown): MultipleChoiceSchemaData | undefined {
  if (!isPlainRecord(input)) {
    return undefined;
  }

  const label = textDataProperty(input, 'label');
  const checked = textArrayDataProperty(input, 'checked');
  const unchecked = textArrayDataProperty(input, 'unchecked');
  const selected = textDataProperty(input, 'selected');
  const validation = textDataProperty(input, 'validation');
  if (label === undefined || checked === undefined || unchecked === undefined) {
    return undefined;
  }

  return {
    label,
    checked,
    unchecked,
    ...(selected === undefined ? {} : { selected }),
    ...(validation === undefined ? {} : { validation }),
  };
}

function parseBinaryDecisionSchemaData(input: unknown): BinaryDecisionSchemaData | undefined {
  if (!isPlainRecord(input)) {
    return undefined;
  }

  const label = textDataProperty(input, 'label');
  const selected = textDataProperty(input, 'selected');
  const consequence = textDataProperty(input, 'consequence');
  const confirmation = textDataProperty(input, 'confirmation');
  const disabledReason = textDataProperty(input, 'disabledReason');
  if (label === undefined || selected === undefined || consequence === undefined) {
    return undefined;
  }

  return {
    label,
    selected,
    consequence,
    ...(confirmation === undefined ? {} : { confirmation }),
    ...(disabledReason === undefined ? {} : { disabledReason }),
  };
}

function parsePeerNavigationSchemaData(input: unknown): PeerNavigationSchemaData | undefined {
  if (!isPlainRecord(input)) {
    return undefined;
  }

  const previous = textDataProperty(input, 'previous');
  const current = textDataProperty(input, 'current');
  const next = textDataProperty(input, 'next');
  const route = textDataProperty(input, 'route');
  const status = textDataProperty(input, 'status');
  if (previous === undefined || current === undefined || next === undefined) {
    return undefined;
  }

  return {
    previous,
    current,
    next,
    ...(route === undefined ? {} : { route }),
    ...(status === undefined ? {} : { status }),
  };
}

function parseProgressiveDisclosureSchemaData(
  input: unknown,
): ProgressiveDisclosureSchemaData | undefined {
  if (!isPlainRecord(input)) {
    return undefined;
  }

  const label = textDataProperty(input, 'label');
  const state = textDataProperty(input, 'state');
  const hiddenCount = textOrNumberDataProperty(input, 'hiddenCount');
  const summary = textDataProperty(input, 'summary');
  const details = textArrayDataProperty(input, 'details');
  if (label === undefined || state === undefined || hiddenCount === undefined) {
    return undefined;
  }

  return {
    label,
    state,
    hiddenCount,
    ...(summary === undefined ? {} : { summary }),
    ...(details === undefined ? {} : { details }),
  };
}

function parsePathProgressSchemaData(input: unknown): PathProgressSchemaData | undefined {
  if (!isPlainRecord(input)) {
    return undefined;
  }

  const path = textArrayDataProperty(input, 'path');
  const current = textDataProperty(input, 'current');
  const step = textOrNumberDataProperty(input, 'step');
  const total = textOrNumberDataProperty(input, 'total');
  const status = textDataProperty(input, 'status');
  if (path === undefined || current === undefined || step === undefined || total === undefined) {
    return undefined;
  }

  return {
    path,
    current,
    step,
    total,
    ...(status === undefined ? {} : { status }),
  };
}

function parseBrandEmphasisSchemaData(input: unknown): BrandEmphasisSchemaData | undefined {
  if (!isPlainRecord(input)) {
    return undefined;
  }

  const brand = textDataProperty(input, 'brand');
  const tagline = textDataProperty(input, 'tagline');
  const decoration = textDataProperty(input, 'decoration');
  const role = textDataProperty(input, 'role');
  const selected = textDataProperty(input, 'selected');
  if (brand === undefined || tagline === undefined || decoration === undefined) {
    return undefined;
  }

  return {
    brand,
    tagline,
    decoration,
    ...(role === undefined ? {} : { role }),
    ...(selected === undefined ? {} : { selected }),
  };
}

function parseModeAwarePrimitiveSchemaData(
  input: unknown,
): ModeAwarePrimitiveSchemaData | undefined {
  if (!isPlainRecord(input)) {
    return undefined;
  }

  const primitive = textDataProperty(input, 'primitive');
  const fact = textDataProperty(input, 'fact');
  const value = textOrNumberDataProperty(input, 'value');
  const status = textDataProperty(input, 'status');
  const modeContract = textDataProperty(input, 'modeContract');
  const selected = textDataProperty(input, 'selected');
  if (primitive === undefined || fact === undefined || value === undefined) {
    return undefined;
  }

  return {
    primitive,
    fact,
    value,
    ...(status === undefined ? {} : { status }),
    ...(modeContract === undefined ? {} : { modeContract }),
    ...(selected === undefined ? {} : { selected }),
  };
}

function parseDenseComparisonSchemaData(input: unknown): DenseComparisonSchemaData | undefined {
  if (!isPlainRecord(input)) {
    return undefined;
  }

  const title = textDataProperty(input, 'title');
  const metric = textDataProperty(input, 'metric');
  const left = textDataProperty(input, 'left');
  const right = textDataProperty(input, 'right');
  const delta = textDataProperty(input, 'delta');
  const selected = textDataProperty(input, 'selected');
  if (
    title === undefined
    || metric === undefined
    || left === undefined
    || right === undefined
    || delta === undefined
  ) {
    return undefined;
  }

  return {
    title,
    metric,
    left,
    right,
    delta,
    ...(selected === undefined ? {} : { selected }),
  };
}

function parseHierarchySchemaData(input: unknown): HierarchySchemaData | undefined {
  if (!isPlainRecord(input)) {
    return undefined;
  }

  const root = textDataProperty(input, 'root');
  const nodes = textArrayDataProperty(input, 'nodes');
  const selected = textDataProperty(input, 'selected');
  const parent = textDataProperty(input, 'parent');
  const depth = textOrNumberDataProperty(input, 'depth');
  const expanded = textDataProperty(input, 'expanded');
  if (root === undefined || nodes === undefined || selected === undefined) {
    return undefined;
  }

  return {
    root,
    nodes,
    selected,
    ...(parent === undefined ? {} : { parent }),
    ...(depth === undefined ? {} : { depth }),
    ...(expanded === undefined ? {} : { expanded }),
  };
}

function parseExplorationListSchemaData(input: unknown): ExplorationListSchemaData | undefined {
  if (!isPlainRecord(input)) {
    return undefined;
  }

  const title = textDataProperty(input, 'title');
  const facet = textDataProperty(input, 'facet');
  const items = textArrayDataProperty(input, 'items');
  const selected = textDataProperty(input, 'selected');
  const preview = textDataProperty(input, 'preview');
  if (title === undefined || facet === undefined || items === undefined || selected === undefined) {
    return undefined;
  }

  return {
    title,
    facet,
    items,
    selected,
    ...(preview === undefined ? {} : { preview }),
  };
}

function parseTemporalDependencySchemaData(
  input: unknown,
): TemporalDependencySchemaData | undefined {
  if (!isPlainRecord(input)) {
    return undefined;
  }

  const title = textDataProperty(input, 'title');
  const events = textArrayDataProperty(input, 'events');
  const dependency = textDataProperty(input, 'dependency');
  const selected = textDataProperty(input, 'selected');
  const dependsOn = textDataProperty(input, 'dependsOn');
  if (title === undefined || events === undefined || dependency === undefined) {
    return undefined;
  }

  return {
    title,
    events,
    dependency,
    ...(selected === undefined ? {} : { selected }),
    ...(dependsOn === undefined ? {} : { dependsOn }),
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
