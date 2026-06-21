import { commandIntent, defineDataRequirement, defineViewData } from '../binding.js';

import type { StandardSectionSpec } from './types.js';

import { readerArticleRequirement, readerOutlineRequirement } from './sections.part01.js';
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
