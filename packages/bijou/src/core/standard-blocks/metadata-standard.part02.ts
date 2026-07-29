import type { BlockMetadata } from '../block-metadata.js';
import { dividerSections, explainabilityWalkthroughSections, formattedDocumentSections, framedGroupSections, linkDestinationSections, progressIndicatorSections, shortcutCueSections, textEntrySections } from './sections.js';
import { standardSectionMetadata } from './metadata-standard.part01.js';

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
