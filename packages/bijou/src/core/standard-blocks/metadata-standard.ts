import type { BindingFact } from '../binding.js';
import type { BlockMetadata } from '../block-metadata.js';
import { ALL_OUTPUT_MODES, BIJOU_PACKAGE, type StandardBlockName, type StandardBlockStory, type StandardBlockStoryState, type StandardSectionSpec } from './types.js';
import { activityStreamSections, binaryDecisionSections, brandEmphasisSections, denseComparisonSections, dividerSections, explorationListSections, explainabilityWalkthroughSections, formattedDocumentSections, framedGroupSections, hierarchySections, inFlowStatusSections, inlineStatusSections, linkDestinationSections, modeAwarePrimitiveSections, multipleChoiceSections, pathProgressSections, peerNavigationSections, progressiveDisclosureSections, progressIndicatorSections, shortcutCueSections, singleChoiceSections, temporalDependencySections, textEntrySections, transientOverlaySections } from './sections.js';

export function inlineStatusMetadata(): BlockMetadata {
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

export function inFlowStatusMetadata(): BlockMetadata {
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

export function transientOverlayMetadata(): BlockMetadata {
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

export function activityStreamMetadata(): BlockMetadata {
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

export function shortcutCueMetadata(): BlockMetadata {
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

export function progressIndicatorMetadata(): BlockMetadata {
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

export function framedGroupMetadata(): BlockMetadata {
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

export function explainabilityWalkthroughMetadata(): BlockMetadata {
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

export function formattedDocumentMetadata(): BlockMetadata {
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

export function linkDestinationMetadata(): BlockMetadata {
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

export function dividerMetadata(): BlockMetadata {
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

export function textEntryMetadata(): BlockMetadata {
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

export function singleChoiceMetadata(): BlockMetadata {
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

export function multipleChoiceMetadata(): BlockMetadata {
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

export function binaryDecisionMetadata(): BlockMetadata {
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

export function peerNavigationMetadata(): BlockMetadata {
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

export function progressiveDisclosureMetadata(): BlockMetadata {
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

export function pathProgressMetadata(): BlockMetadata {
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

export function brandEmphasisMetadata(): BlockMetadata {
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

export function modeAwarePrimitiveMetadata(): BlockMetadata {
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
