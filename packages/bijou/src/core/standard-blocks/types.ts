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
  readonly left: string | number;
  readonly right: string | number;
  readonly delta: string | number;
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

export interface StandardSectionSpec {
  readonly id: string;
  readonly label: string;
  readonly required: boolean;
  readonly description?: string;
}
