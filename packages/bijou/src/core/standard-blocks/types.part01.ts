import type { BindingFact } from '../binding.js';
export const BIJOU_PACKAGE = '@flyingrobots/bijou';
export const ALL_OUTPUT_MODES = Object.freeze([
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
