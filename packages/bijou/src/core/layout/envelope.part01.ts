export type LayoutBound = number | 'unbounded';
export type LayoutDirection = 'ltr' | 'rtl' | 'auto';
export type LogicalAxis = 'inline' | 'block';
export type LogicalAlign = 'start' | 'center' | 'end' | 'stretch';
export type LayoutFitPolicy =
  | 'fixed'
  | 'shrink'
  | 'grow'
  | 'truncate'
  | 'wrap'
  | 'overflow'
  | 'clip'
  | 'priority';
export interface LayoutConstraints {
  readonly minInline: number;
  readonly maxInline: LayoutBound;
  readonly minBlock: number;
  readonly maxBlock: LayoutBound;
}
export interface LayoutConstraintsInput {
  readonly minInline?: number;
  readonly maxInline?: LayoutBound;
  readonly minBlock?: number;
  readonly maxBlock?: LayoutBound;
}
export interface LayoutPreference {
  readonly minInline: number;
  readonly preferredInline: number;
  readonly maxInline: LayoutBound;
  readonly minBlock: number;
  readonly preferredBlock: number;
  readonly maxBlock: LayoutBound;
}
export interface LayoutPreferenceInput {
  readonly minInline?: number;
  readonly preferredInline?: number;
  readonly maxInline?: LayoutBound;
  readonly minBlock?: number;
  readonly preferredBlock?: number;
  readonly maxBlock?: LayoutBound;
}
export interface AssignedLayoutRect {
  readonly inlineStart: number;
  readonly blockStart: number;
  readonly inlineSize: number;
  readonly blockSize: number;
}
export interface AssignedLayoutRectInput {
  readonly inlineStart?: number;
  readonly blockStart?: number;
  readonly inlineSize?: number;
  readonly blockSize?: number;
}
export interface LayoutEnvelope {
  readonly id: string;
  readonly role: string;
  readonly direction: LayoutDirection;
  readonly constraints: LayoutConstraints;
  readonly preference: LayoutPreference;
  readonly fit?: LayoutFitPolicy;
  readonly assigned?: AssignedLayoutRect | null;
  readonly reason?: string;
}
export interface ResolvedLayoutEnvelope extends LayoutEnvelope {
  readonly assigned: AssignedLayoutRect;
  readonly reason: string;
}
export interface LayoutEnvelopeInput {
  readonly id: string;
  readonly role: string;
  readonly direction?: LayoutDirection;
  readonly constraints: LayoutConstraints;
  readonly preference: LayoutPreference;
  readonly fit?: LayoutFitPolicy;
}
export interface LayoutFact {
  readonly kind: string;
  readonly key: string;
  readonly value: string | number | boolean;
}
export interface ContentExtent {
  readonly source: 'surface' | 'buffer' | 'text';
  readonly inlineSize: number;
  readonly blockSize: number;
  readonly baseline?: number;
  readonly facts: readonly LayoutFact[];
}
export interface ContentExtentInput {
  readonly width?: number;
  readonly height?: number;
  readonly inlineSize?: number;
  readonly blockSize?: number;
  readonly baseline?: number;
  readonly facts?: readonly LayoutFact[];
}
