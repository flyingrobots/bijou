import { sanitizeNonNegativeInt } from '../numeric.js';

import type { AssignedLayoutRect, AssignedLayoutRectInput, ContentExtent, LayoutConstraints, LayoutConstraintsInput, LayoutDirection, LayoutEnvelope, LogicalAlign, LogicalAxis, ResolvedLayoutEnvelope } from './envelope.part01.js';

import { normalizeBound } from './envelope.part06.js';
export interface TextMeasurementInput {
  readonly text: string;
  readonly availableInline: number;
  readonly direction: LayoutDirection;
  readonly wrap: 'none' | 'word';
}
export type TextMeasurementAdapter = (input: TextMeasurementInput) => Omit<ContentExtent, 'source'>;
export interface MeasureTextContentInput {
  readonly text: string;
  readonly availableInline: number;
  readonly direction?: LayoutDirection;
  readonly wrap?: 'none' | 'word';
  readonly adapter: TextMeasurementAdapter;
}
export type StackTrack =
  | { readonly kind: 'fixed'; readonly size: number }
  | { readonly kind: 'flex'; readonly weight?: number };
export interface StackLayoutChildInput {
  readonly envelope: LayoutEnvelope;
  readonly track: StackTrack;
}
export interface StackLayoutInput {
  readonly id: string;
  readonly role: string;
  readonly axis: LogicalAxis;
  readonly direction?: LayoutDirection;
  readonly rect: AssignedLayoutRectInput;
  readonly gap?: number;
  readonly children: readonly StackLayoutChildInput[];
}
export interface StackLayoutResult {
  readonly id: string;
  readonly role: string;
  readonly axis: LogicalAxis;
  readonly direction: LayoutDirection;
  readonly assigned: AssignedLayoutRect;
  readonly roundingPolicy: 'largest-remainder-source-order';
  readonly children: readonly ResolvedLayoutEnvelope[];
}
export interface PlaceInRectInput {
  readonly envelope: LayoutEnvelope;
  readonly direction?: LayoutDirection;
  readonly parent: AssignedLayoutRectInput;
  readonly size: {
    readonly inlineSize: number;
    readonly blockSize: number;
  };
  readonly inlineAlign: LogicalAlign;
  readonly blockAlign: LogicalAlign;
}
export interface LayoutRenderInput {
  readonly envelope: ResolvedLayoutEnvelope;
  readonly assigned: AssignedLayoutRect;
}
export interface LayoutRenderResult<Output> {
  readonly envelope: ResolvedLayoutEnvelope;
  readonly assigned: AssignedLayoutRect;
  readonly output: Output;
}
export const RE035_LAYOUT_SCOPE = Object.freeze({
  design: 'RE-035',
  status: 'landed',
  included: Object.freeze([
    'layout-envelope',
    'constraint-negotiation',
    'stack',
    'place',
    'content-measurement-seam',
    'render-assignment-seam',
  ]),
  deferred: Object.freeze([
    'RE-036 text measurement and inline flow',
    'RE-037 overflow, viewports, scroll anchoring, and scrollbars',
    'RE-038 box model, chrome regions, hit testing, and focus maps',
    'RE-039 responsive variants, compression, and constraint fallbacks',
    'RE-040 accessible layout semantics',
    'WS-001 workspace tree',
  ]),
});
export function layoutConstraints(input: LayoutConstraintsInput = {}): LayoutConstraints {
  const minInline = sanitizeNonNegativeInt(input.minInline, 0);
  const minBlock = sanitizeNonNegativeInt(input.minBlock, 0);
  return Object.freeze({
    minInline,
    maxInline: normalizeBound(input.maxInline, minInline),
    minBlock,
    maxBlock: normalizeBound(input.maxBlock, minBlock),
  });
}
