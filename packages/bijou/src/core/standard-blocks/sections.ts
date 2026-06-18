import { commandIntent, defineDataRequirement, defineViewData } from '../binding.js';
import type { StandardBlockName, StandardSectionSpec } from './types.js';

interface StandardBlockDataRequirementInput {
  readonly name: string;
  readonly label: string;
  readonly description: string;
  readonly optional?: boolean;
}

export function standardBlockData(
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

export function standardSectionCommands(blockName: StandardBlockName) {
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

export function standardBlockKey(blockName: StandardBlockName): string {
  return blockName
    .replace(/Block$/, '')
    .replace(
      /[A-Z]/g,
      (letter, index) => `${index === 0 ? '' : '-'}${letter.toLowerCase()}`,
    );
}

export const shellFocusRegion = commandIntent<{ readonly region: string }>('shell.focusRegion', {
  label: 'Focus region',
  description: 'Move focus to a named AppShell region.',
  facts: [{ kind: 'entity', key: 'block.command', value: 'AppShell' }],
});
export const shellToggleInspector = commandIntent('shell.toggleInspector', {
  label: 'Toggle inspector',
  description: 'Request inspector visibility change.',
  facts: [{ kind: 'entity', key: 'block.command', value: 'AppShell' }],
});
export const shellOpenOverlay = commandIntent<{ readonly overlayId: string }>('shell.openOverlay', {
  label: 'Open overlay',
  description: 'Request a shell overlay by id.',
  facts: [{ kind: 'entity', key: 'block.command', value: 'AppShell' }],
});

export const readerArticleRequirement = defineDataRequirement({
  id: 'reader.article',
  resource: 'reader.article',
  label: 'Article',
  description: 'Primary readable article content.',
  facts: [{ kind: 'entity', key: 'block.data', value: 'ReaderSurface' }],
});
export const readerOutlineRequirement = defineDataRequirement({
  id: 'reader.outline',
  resource: 'reader.outline',
  label: 'Outline',
  description: 'Optional article outline for navigation.',
  optional: true,
  facts: [{ kind: 'entity', key: 'block.data', value: 'ReaderSurface' }],
});
export const readerSurfaceData = defineViewData({
  id: 'reader-surface.data',
  label: 'ReaderSurface data',
  description: 'Boundary data required to render a readable content surface.',
  requirements: [
    { name: 'article', requirement: readerArticleRequirement },
    { name: 'outline', requirement: readerOutlineRequirement },
  ],
});
export const readerSelectHeading = commandIntent<{ readonly headingId: string }>('reader.selectHeading', {
  label: 'Select heading',
  description: 'Select a heading inside the reader outline.',
  facts: [{ kind: 'entity', key: 'block.command', value: 'ReaderSurface' }],
});
export const readerOpenReference = commandIntent<{ readonly referenceId: string }>('reader.openReference', {
  label: 'Open reference',
  description: 'Open a referenced document or citation from reader content.',
  facts: [{ kind: 'entity', key: 'block.command', value: 'ReaderSurface' }],
});

export const inspectorSelectionRequirement = defineDataRequirement({
  id: 'inspector.selection',
  resource: 'inspector.selection',
  label: 'Selection',
  description: 'The active entity selected elsewhere in the app.',
  facts: [{ kind: 'entity', key: 'block.data', value: 'InspectorPanel' }],
});
export const inspectorDetailsRequirement = defineDataRequirement({
  id: 'inspector.details',
  resource: 'inspector.details',
  label: 'Selection details',
  description: 'Optional detail facts for the selected entity.',
  optional: true,
  facts: [{ kind: 'entity', key: 'block.data', value: 'InspectorPanel' }],
});
export const inspectorPanelData = defineViewData({
  id: 'inspector-panel.data',
  label: 'InspectorPanel data',
  description: 'Boundary data required to explain the current selection.',
  requirements: [
    { name: 'selection', requirement: inspectorSelectionRequirement },
    { name: 'details', requirement: inspectorDetailsRequirement },
  ],
});
export const inspectorRevealSelection = commandIntent<{ readonly selectionId: string }>('inspector.revealSelection', {
  label: 'Reveal selection',
  description: 'Request navigation to the selected source entity.',
  facts: [{ kind: 'entity', key: 'block.command', value: 'InspectorPanel' }],
});
export const inspectorFocusSource = commandIntent<{ readonly sourceId: string }>('inspector.focusSource', {
  label: 'Focus source',
  description: 'Request focus for the source associated with the active selection.',
  facts: [{ kind: 'entity', key: 'block.command', value: 'InspectorPanel' }],
});

export const inlineStatusSections: readonly StandardSectionSpec[] = Object.freeze([
  { id: 'label', label: 'Label', required: true },
  { id: 'status', label: 'Status', required: true },
  { id: 'message', label: 'Message', required: false },
]);
export const inFlowStatusSections: readonly StandardSectionSpec[] = Object.freeze([
  { id: 'severity', label: 'Severity', required: true },
  { id: 'source', label: 'Source', required: false },
  { id: 'message', label: 'Message', required: true },
  { id: 'action', label: 'Action', required: false },
]);
export const transientOverlaySections: readonly StandardSectionSpec[] = Object.freeze([
  { id: 'priority', label: 'Priority', required: false },
  { id: 'message', label: 'Message', required: true },
  { id: 'dismiss', label: 'Dismiss', required: false },
]);
export const activityStreamSections: readonly StandardSectionSpec[] = Object.freeze([
  { id: 'events', label: 'Events', required: true },
  { id: 'selected', label: 'Selected', required: false },
]);
export const shortcutCueSections: readonly StandardSectionSpec[] = Object.freeze([
  { id: 'shortcuts', label: 'Shortcuts', required: true },
  { id: 'scope', label: 'Scope', required: false },
]);
export const progressIndicatorSections: readonly StandardSectionSpec[] = Object.freeze([
  { id: 'label', label: 'Label', required: true },
  { id: 'value', label: 'Value', required: false },
  { id: 'total', label: 'Total', required: false },
  { id: 'percent', label: 'Percent', required: true },
]);
export const framedGroupSections: readonly StandardSectionSpec[] = Object.freeze([
  { id: 'title', label: 'Title', required: true },
  { id: 'items', label: 'Items', required: true },
  { id: 'selected', label: 'Selected', required: false },
  { id: 'mode', label: 'Mode', required: false },
]);
export const explainabilityWalkthroughSections: readonly StandardSectionSpec[] = Object.freeze([
  { id: 'title', label: 'Title', required: true },
  { id: 'steps', label: 'Steps', required: true },
  { id: 'evidence', label: 'Evidence', required: false },
  { id: 'decision', label: 'Decision', required: false },
  { id: 'nextStep', label: 'Next step', required: false },
]);
export const formattedDocumentSections: readonly StandardSectionSpec[] = Object.freeze([
  { id: 'heading', label: 'Heading', required: true },
  { id: 'body', label: 'Body', required: true },
  { id: 'callout', label: 'Callout', required: false },
  { id: 'code', label: 'Code', required: false },
]);
export const linkDestinationSections: readonly StandardSectionSpec[] = Object.freeze([
  { id: 'label', label: 'Label', required: true },
  { id: 'destination', label: 'Destination', required: true },
  { id: 'kind', label: 'Kind', required: false },
  { id: 'status', label: 'Status', required: false },
]);
export const dividerSections: readonly StandardSectionSpec[] = Object.freeze([
  { id: 'label', label: 'Label', required: true },
  { id: 'style', label: 'Style', required: false },
  { id: 'density', label: 'Density', required: false },
]);
export const textEntrySections: readonly StandardSectionSpec[] = Object.freeze([
  { id: 'field', label: 'Field', required: true },
  { id: 'value', label: 'Value', required: true },
  { id: 'placeholder', label: 'Placeholder', required: false },
  { id: 'validation', label: 'Validation', required: false },
  { id: 'results', label: 'Results', required: false },
]);
export const singleChoiceSections: readonly StandardSectionSpec[] = Object.freeze([
  { id: 'label', label: 'Label', required: true },
  { id: 'options', label: 'Options', required: true },
  { id: 'selected', label: 'Selected', required: true },
  { id: 'mode', label: 'Mode', required: false },
  { id: 'validation', label: 'Validation', required: false },
]);
export const multipleChoiceSections: readonly StandardSectionSpec[] = Object.freeze([
  { id: 'label', label: 'Label', required: true },
  { id: 'checked', label: 'Checked', required: true },
  { id: 'unchecked', label: 'Unchecked', required: true },
  { id: 'selected', label: 'Selected', required: false },
  { id: 'validation', label: 'Validation', required: false },
]);
export const binaryDecisionSections: readonly StandardSectionSpec[] = Object.freeze([
  { id: 'label', label: 'Label', required: true },
  { id: 'selected', label: 'Selected', required: true },
  { id: 'consequence', label: 'Consequence', required: true },
  { id: 'confirmation', label: 'Confirmation', required: false },
  { id: 'disabledReason', label: 'Disabled reason', required: false },
]);
export const peerNavigationSections: readonly StandardSectionSpec[] = Object.freeze([
  { id: 'previous', label: 'Previous', required: true },
  { id: 'current', label: 'Current', required: true },
  { id: 'next', label: 'Next', required: true },
  { id: 'route', label: 'Route', required: false },
  { id: 'status', label: 'Status', required: false },
]);
export const progressiveDisclosureSections: readonly StandardSectionSpec[] = Object.freeze([
  { id: 'label', label: 'Label', required: true },
  { id: 'state', label: 'State', required: true },
  { id: 'hiddenCount', label: 'Hidden count', required: true },
  { id: 'summary', label: 'Summary', required: false },
  { id: 'details', label: 'Details', required: false },
]);
export const pathProgressSections: readonly StandardSectionSpec[] = Object.freeze([
  { id: 'path', label: 'Path', required: true },
  { id: 'current', label: 'Current', required: true },
  { id: 'step', label: 'Step', required: true },
  { id: 'total', label: 'Total', required: true },
  { id: 'status', label: 'Status', required: false },
]);
export const brandEmphasisSections: readonly StandardSectionSpec[] = Object.freeze([
  { id: 'brand', label: 'Brand', required: true },
  { id: 'tagline', label: 'Tagline', required: true },
  { id: 'decoration', label: 'Decoration', required: true },
  { id: 'role', label: 'Role', required: false },
  { id: 'selected', label: 'Selected', required: false },
]);
export const modeAwarePrimitiveSections: readonly StandardSectionSpec[] = Object.freeze([
  { id: 'primitive', label: 'Primitive', required: true },
  { id: 'fact', label: 'Fact', required: true },
  { id: 'value', label: 'Value', required: true },
  { id: 'status', label: 'Status', required: false },
  { id: 'modeContract', label: 'Mode contract', required: false },
  { id: 'selected', label: 'Selected', required: false },
]);
export const denseComparisonSections: readonly StandardSectionSpec[] = Object.freeze([
  { id: 'title', label: 'Title', required: true },
  { id: 'metric', label: 'Metric', required: true },
  { id: 'left', label: 'Left', required: true },
  { id: 'right', label: 'Right', required: true },
  { id: 'delta', label: 'Delta', required: true },
  { id: 'selected', label: 'Selected', required: false },
]);
export const hierarchySections: readonly StandardSectionSpec[] = Object.freeze([
  { id: 'root', label: 'Root', required: true },
  { id: 'nodes', label: 'Nodes', required: true },
  { id: 'selected', label: 'Selected', required: true },
  { id: 'parent', label: 'Parent', required: false },
  { id: 'depth', label: 'Depth', required: false },
  { id: 'expanded', label: 'Expanded', required: false },
]);
export const explorationListSections: readonly StandardSectionSpec[] = Object.freeze([
  { id: 'title', label: 'Title', required: true },
  { id: 'facet', label: 'Facet', required: true },
  { id: 'items', label: 'Items', required: true },
  { id: 'selected', label: 'Selected', required: true },
  { id: 'preview', label: 'Preview', required: false },
]);
export const temporalDependencySections: readonly StandardSectionSpec[] = Object.freeze([
  { id: 'title', label: 'Title', required: true },
  { id: 'events', label: 'Events', required: true },
  { id: 'dependency', label: 'Dependency', required: true },
  { id: 'selected', label: 'Selected', required: false },
  { id: 'dependsOn', label: 'Depends on', required: false },
]);

export const inlineStatusData = standardBlockData('inline-status', 'InlineStatusBlock', [
  {
    name: 'status',
    label: 'Inline status facts',
    description: 'Label, status key, and optional status message.',
  },
]);
export const inFlowStatusData = standardBlockData('in-flow-status', 'InFlowStatusBlock', [
  {
    name: 'status',
    label: 'In-flow status message',
    description: 'Durable in-flow severity, message, source, and action facts.',
  },
]);
export const transientOverlayData = standardBlockData('transient-overlay', 'TransientOverlayBlock', [
  {
    name: 'overlay',
    label: 'Transient overlay event',
    description: 'Short-lived overlay message plus priority and dismissal facts.',
  },
]);
export const activityStreamData = standardBlockData('activity-stream', 'ActivityStreamBlock', [
  {
    name: 'events',
    label: 'Activity events',
    description: 'Chronological event records and selected event state.',
  },
]);
export const shortcutCueData = standardBlockData('shortcut-cue', 'ShortcutCueBlock', [
  {
    name: 'shortcuts',
    label: 'Shortcut cues',
    description: 'Keyboard shortcuts, action labels, and active scope facts.',
  },
]);
export const progressIndicatorData = standardBlockData('progress-indicator', 'ProgressIndicatorBlock', [
  {
    name: 'progress',
    label: 'Progress state',
    description: 'Progress label, current value, total value, and percent facts.',
  },
]);
export const framedGroupData = standardBlockData('framed-group', 'FramedGroupBlock', [
  {
    name: 'group',
    label: 'Framed grouping facts',
    description: 'Group title, ordered items, selected item, and review mode facts.',
  },
]);
export const explainabilityWalkthroughData = standardBlockData(
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
export const formattedDocumentData = standardBlockData('formatted-document', 'FormattedDocumentBlock', [
  {
    name: 'document',
    label: 'Formatted document content',
    description: 'Heading, body, callout, and code facts for persistent prose.',
  },
]);
export const linkDestinationData = standardBlockData('link-destination', 'LinkDestinationBlock', [
  {
    name: 'link',
    label: 'Linked destination',
    description: 'Link label, destination, kind, and availability facts.',
  },
]);
export const dividerData = standardBlockData('divider', 'DividerBlock', [
  {
    name: 'divider',
    label: 'Divider structure',
    description: 'Divider label, visual style, and density facts.',
  },
]);
export const textEntryData = standardBlockData('text-entry', 'TextEntryBlock', [
  {
    name: 'entry',
    label: 'Text entry state',
    description: 'Field label, current value, placeholder, validation, and result-count facts.',
  },
]);
export const singleChoiceData = standardBlockData('single-choice', 'SingleChoiceBlock', [
  {
    name: 'choice',
    label: 'Single choice state',
    description: 'Choice label, option list, selected value, mode, and validation facts.',
  },
]);
export const multipleChoiceData = standardBlockData('multiple-choice', 'MultipleChoiceBlock', [
  {
    name: 'choices',
    label: 'Multiple choice state',
    description: 'Checklist label, checked options, unchecked options, selected summary, and validation facts.',
  },
]);
export const binaryDecisionData = standardBlockData('binary-decision', 'BinaryDecisionBlock', [
  {
    name: 'decision',
    label: 'Binary decision state',
    description: 'Decision label, selected side, consequence, confirmation, and disabled-reason facts.',
  },
]);
export const peerNavigationData = standardBlockData('peer-navigation', 'PeerNavigationBlock', [
  {
    name: 'peers',
    label: 'Peer navigation state',
    description: 'Previous, current, next, route, and availability facts.',
  },
]);
export const progressiveDisclosureData = standardBlockData(
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
export const pathProgressData = standardBlockData('path-progress', 'PathProgressBlock', [
  {
    name: 'path',
    label: 'Path progress state',
    description: 'Path labels, current step, ordinal step, total step count, and status facts.',
  },
]);
export const brandEmphasisData = standardBlockData('brand-emphasis', 'BrandEmphasisBlock', [
  {
    name: 'brand',
    label: 'Brand emphasis facts',
    description: 'Brand text, tagline, decorative treatment, role, and selected emphasis facts.',
  },
]);
export const modeAwarePrimitiveData = standardBlockData('mode-aware-primitive', 'ModeAwarePrimitiveBlock', [
  {
    name: 'primitive',
    label: 'Mode-aware primitive facts',
    description: 'Primitive identity, fact key, value, status, mode contract, and selected primitive facts.',
  },
]);
export const denseComparisonData = standardBlockData('dense-comparison', 'DenseComparisonBlock', [
  {
    name: 'comparison',
    label: 'Dense comparison facts',
    description: 'Comparison title, metric, left value, right value, delta, and selected metric facts.',
  },
]);
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
