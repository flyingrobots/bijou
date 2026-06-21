import type { StandardSectionSpec } from './types.js';
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
