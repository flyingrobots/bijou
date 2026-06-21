

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
