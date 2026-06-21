import type { StandardSectionSpec } from './types.js';

import { standardBlockData } from './sections.part01.js';
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
