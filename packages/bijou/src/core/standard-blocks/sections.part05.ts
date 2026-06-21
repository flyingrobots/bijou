import { standardBlockData } from './sections.part01.js';
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
