import type { BlockMetadata } from '../block-metadata.js';
import { binaryDecisionSections, brandEmphasisSections, modeAwarePrimitiveSections, multipleChoiceSections, pathProgressSections, peerNavigationSections, progressiveDisclosureSections, singleChoiceSections } from './sections.js';
import { standardSectionMetadata } from './metadata-standard.part01.js';

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
