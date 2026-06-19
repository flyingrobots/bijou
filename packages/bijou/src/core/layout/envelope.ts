import { sanitizeNonNegativeInt } from '../numeric.js';

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
  readonly assigned?: AssignedLayoutRect;
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

export function layoutPreference(input: LayoutPreferenceInput = {}): LayoutPreference {
  const minInline = sanitizeNonNegativeInt(input.minInline, 0);
  const minBlock = sanitizeNonNegativeInt(input.minBlock, 0);
  const maxInline = normalizeBound(input.maxInline, minInline);
  const maxBlock = normalizeBound(input.maxBlock, minBlock);

  return Object.freeze({
    minInline,
    preferredInline: normalizePreferred(input.preferredInline, minInline, maxInline),
    maxInline,
    minBlock,
    preferredBlock: normalizePreferred(input.preferredBlock, minBlock, maxBlock),
    maxBlock,
  });
}

export function assignedLayoutRect(input: AssignedLayoutRectInput): AssignedLayoutRect {
  return Object.freeze({
    inlineStart: sanitizeNonNegativeInt(input.inlineStart, 0),
    blockStart: sanitizeNonNegativeInt(input.blockStart, 0),
    inlineSize: sanitizeNonNegativeInt(input.inlineSize, 0),
    blockSize: sanitizeNonNegativeInt(input.blockSize, 0),
  });
}

export function defineLayoutEnvelope(input: LayoutEnvelopeInput): LayoutEnvelope {
  const id = normalizeRequiredText(input.id, 'layout envelope: id is required');
  const role = normalizeRequiredText(input.role, 'layout envelope: role is required');
  const direction = normalizeDirection(input.direction);
  const envelope: LayoutEnvelope = {
    id,
    role,
    direction,
    constraints: input.constraints,
    preference: input.preference,
    ...(input.fit === undefined ? {} : { fit: input.fit }),
  };
  return Object.freeze(envelope);
}

export function assignLayoutChild(
  envelope: LayoutEnvelope,
  assigned: AssignedLayoutRectInput,
  reason: string,
): ResolvedLayoutEnvelope {
  const resolved: ResolvedLayoutEnvelope = {
    ...envelope,
    assigned: assignedLayoutRect(assigned),
    reason: normalizeRequiredText(reason, 'layout assignment: reason is required'),
  };
  return Object.freeze(resolved);
}

export function isResolvedLayoutEnvelope(envelope: LayoutEnvelope): envelope is ResolvedLayoutEnvelope {
  return typeof envelope.assigned === 'object'
    && typeof envelope.reason === 'string'
    && envelope.reason.length > 0;
}

export function renderWithResolvedLayout<Output>(
  envelope: LayoutEnvelope,
  renderer: (input: LayoutRenderInput) => Output,
): LayoutRenderResult<Output> {
  if (!isResolvedLayoutEnvelope(envelope)) {
    throw new Error(`layout render seam: visible node ${envelope.id} requires an assigned layout envelope`);
  }

  const output = renderer({ envelope, assigned: envelope.assigned });
  return Object.freeze({
    envelope,
    assigned: envelope.assigned,
    output,
  });
}

export function contentExtentFromSurface(
  surface: { readonly width: number; readonly height: number },
  facts: readonly LayoutFact[] = [],
): ContentExtent {
  return contentExtent('surface', {
    inlineSize: surface.width,
    blockSize: surface.height,
    facts,
  });
}

export function contentExtentFromBuffer(input: ContentExtentInput): ContentExtent {
  return contentExtent('buffer', {
    inlineSize: input.inlineSize ?? input.width ?? 0,
    blockSize: input.blockSize ?? input.height ?? 0,
    baseline: input.baseline,
    facts: input.facts ?? [],
  });
}

export function measureTextContent(input: MeasureTextContentInput): ContentExtent {
  const measured = input.adapter({
    text: input.text,
    availableInline: sanitizeNonNegativeInt(input.availableInline, 0),
    direction: normalizeDirection(input.direction),
    wrap: input.wrap ?? 'none',
  });
  return contentExtent('text', measured);
}

export function resolveStackLayout(input: StackLayoutInput): StackLayoutResult {
  const children = [...input.children];
  const assigned = assignedLayoutRect(input.rect);
  const axis = input.axis;
  const direction = normalizeDirection(input.direction);
  const gap = sanitizeNonNegativeInt(input.gap, 0);
  const mainSize = axis === 'inline' ? assigned.inlineSize : assigned.blockSize;
  const crossSize = axis === 'inline' ? assigned.blockSize : assigned.inlineSize;
  const totalGap = gap * Math.max(0, children.length - 1);
  const available = Math.max(0, mainSize - totalGap);
  const sizes = resolveStackTrackSizes(children, available);
  const resolvedChildren: ResolvedLayoutEnvelope[] = [];
  let cursor = axis === 'inline' ? assigned.inlineStart : assigned.blockStart;

  for (const [index, child] of children.entries()) {
    const size = sizes[index] ?? 0;
    const rect = axis === 'inline'
      ? {
          inlineStart: cursor,
          blockStart: assigned.blockStart,
          inlineSize: size,
          blockSize: crossSize,
        }
      : {
          inlineStart: assigned.inlineStart,
          blockStart: cursor,
          inlineSize: crossSize,
          blockSize: size,
    };
    const reason = child.track.kind === 'fixed'
      ? `stack ${axis} fixed track ${String(size)} cells`
      : `stack ${axis} flex track ${String(trackWeight(child.track))} resolved by largest-remainder-source-order`;
    resolvedChildren.push(assignLayoutChild(child.envelope, rect, reason));
    cursor += size + (index < children.length - 1 ? gap : 0);
  }

  return Object.freeze({
    id: normalizeRequiredText(input.id, 'stack layout: id is required'),
    role: normalizeRequiredText(input.role, 'stack layout: role is required'),
    axis,
    direction,
    assigned,
    roundingPolicy: 'largest-remainder-source-order' as const,
    children: Object.freeze(resolvedChildren),
  });
}

export function placeInRect(input: PlaceInRectInput): ResolvedLayoutEnvelope {
  const parent = assignedLayoutRect(input.parent);
  const direction = normalizeDirection(input.direction ?? input.envelope.direction);
  const inlineAlign = input.inlineAlign;
  const blockAlign = input.blockAlign;
  const inlineSize = inlineAlign === 'stretch'
    ? parent.inlineSize
    : Math.min(parent.inlineSize, sanitizeNonNegativeInt(input.size.inlineSize, 0));
  const blockSize = blockAlign === 'stretch'
    ? parent.blockSize
    : Math.min(parent.blockSize, sanitizeNonNegativeInt(input.size.blockSize, 0));
  const inlineOffset = resolveInlineOffset(parent.inlineSize, inlineSize, inlineAlign, direction);
  const blockOffset = resolveBlockOffset(parent.blockSize, blockSize, blockAlign);

  return assignLayoutChild(
    input.envelope,
    {
      inlineStart: parent.inlineStart + inlineOffset,
      blockStart: parent.blockStart + blockOffset,
      inlineSize,
      blockSize,
    },
    `place ${direction} inline ${inlineAlign} block ${blockAlign}`,
  );
}

export function layoutExplanationFacts(envelope: ResolvedLayoutEnvelope): readonly LayoutFact[] {
  return Object.freeze([
    fact('node.id', envelope.id),
    fact('role', envelope.role),
    fact('direction', envelope.direction),
    fact('constraints.inline', formatRange(envelope.constraints.minInline, envelope.constraints.maxInline)),
    fact('constraints.block', formatRange(envelope.constraints.minBlock, envelope.constraints.maxBlock)),
    fact('preference.inline', formatPreference(
      envelope.preference.minInline,
      envelope.preference.preferredInline,
      envelope.preference.maxInline,
    )),
    fact('preference.block', formatPreference(
      envelope.preference.minBlock,
      envelope.preference.preferredBlock,
      envelope.preference.maxBlock,
    )),
    fact('assigned', [
      `inline-start ${String(envelope.assigned.inlineStart)}`,
      `block-start ${String(envelope.assigned.blockStart)}`,
      `inline-size ${String(envelope.assigned.inlineSize)}`,
      `block-size ${String(envelope.assigned.blockSize)}`,
    ].join(' ')),
    fact('reason', envelope.reason),
  ]);
}

export function layoutExplanationText(envelope: ResolvedLayoutEnvelope): string {
  const facts = layoutExplanationFacts(envelope);
  return [
    `node ${envelope.id}`,
    ...facts
      .filter((item) => item.key !== 'node.id')
      .map((item) => `${item.key} ${String(item.value)}`),
  ].join('\n');
}

function contentExtent(source: ContentExtent['source'], input: Omit<ContentExtent, 'source'>): ContentExtent {
  const extent: ContentExtent = {
    source,
    inlineSize: sanitizeNonNegativeInt(input.inlineSize, 0),
    blockSize: sanitizeNonNegativeInt(input.blockSize, 0),
    ...(input.baseline === undefined ? {} : { baseline: sanitizeNonNegativeInt(input.baseline, 0) }),
    facts: freezeFacts(input.facts),
  };
  return Object.freeze(extent);
}

function resolveStackTrackSizes(
  children: readonly StackLayoutChildInput[],
  available: number,
): number[] {
  const sizes = new Array<number>(children.length).fill(0);
  let fixed = 0;
  let totalFlex = 0;

  for (const [index, child] of children.entries()) {
    const track = child.track;
    if (track.kind === 'fixed') {
      const size = sanitizeNonNegativeInt(track.size, 0);
      sizes[index] = size;
      fixed += size;
    } else {
      totalFlex += trackWeight(track);
    }
  }

  if (fixed > available) {
    let remaining = available;
    for (const [index, child] of children.entries()) {
      if (child.track.kind !== 'fixed') continue;
      const next = Math.min(sizes[index] ?? 0, remaining);
      sizes[index] = next;
      remaining = Math.max(0, remaining - next);
    }
    return sizes;
  }

  const remaining = Math.max(0, available - fixed);
  if (totalFlex <= 0 || remaining <= 0) return sizes;

  let assigned = 0;
  const fractionalShares: { readonly index: number; readonly remainder: number }[] = [];
  for (const [index, child] of children.entries()) {
    const track = child.track;
    if (track.kind !== 'flex') continue;
    const raw = (remaining * trackWeight(track)) / totalFlex;
    const whole = Math.floor(raw);
    sizes[index] = whole;
    assigned += whole;
    fractionalShares.push({ index, remainder: raw - whole });
  }

  let leftover = remaining - assigned;
  fractionalShares.sort((left, right) => right.remainder - left.remainder || left.index - right.index);
  for (const share of fractionalShares) {
    if (leftover <= 0) break;
    sizes[share.index] = (sizes[share.index] ?? 0) + 1;
    leftover -= 1;
  }

  return sizes;
}

function trackWeight(track: StackTrack): number {
  if (track.kind !== 'flex') return 0;
  const weight = track.weight ?? 1;
  if (!Number.isFinite(weight) || weight <= 0) return 1;
  return Math.max(1, Math.floor(weight));
}

function resolveInlineOffset(
  parentSize: number,
  childSize: number,
  align: LogicalAlign,
  direction: LayoutDirection,
): number {
  const remaining = Math.max(0, parentSize - childSize);
  if (align === 'stretch') return 0;
  if (align === 'center') return Math.floor(remaining / 2);
  if (direction === 'rtl') {
    return align === 'start' ? remaining : 0;
  }
  return align === 'start' ? 0 : remaining;
}

function resolveBlockOffset(parentSize: number, childSize: number, align: LogicalAlign): number {
  const remaining = Math.max(0, parentSize - childSize);
  if (align === 'stretch' || align === 'start') return 0;
  if (align === 'center') return Math.floor(remaining / 2);
  return remaining;
}

function normalizeBound(value: LayoutBound | undefined, min: number): LayoutBound {
  if (value === 'unbounded' || value === undefined) return 'unbounded';
  return Math.max(min, sanitizeNonNegativeInt(value, min));
}

function normalizePreferred(value: number | undefined, min: number, max: LayoutBound): number {
  const preferred = sanitizeNonNegativeInt(value, min);
  if (max === 'unbounded') return Math.max(min, preferred);
  return Math.max(min, Math.min(max, preferred));
}

function normalizeDirection(direction: LayoutDirection | undefined): LayoutDirection {
  return direction ?? 'ltr';
}

function normalizeRequiredText(value: string, message: string): string {
  const normalized = value.trim();
  if (normalized.length === 0) throw new Error(message);
  return normalized;
}

function freezeFacts(facts: readonly LayoutFact[]): readonly LayoutFact[] {
  return Object.freeze(
    facts.map((item) => Object.freeze({
      kind: item.kind,
      key: item.key,
      value: item.value,
    })),
  );
}

function fact(key: string, value: LayoutFact['value']): LayoutFact {
  return Object.freeze({ kind: 'layout', key, value });
}

function formatRange(min: number, max: LayoutBound): string {
  return `${String(min)}..${formatBound(max)}`;
}

function formatPreference(min: number, preferred: number, max: LayoutBound): string {
  return `min ${String(min)} preferred ${String(preferred)} max ${formatBound(max)}`;
}

function formatBound(bound: LayoutBound): string {
  return bound === 'unbounded' ? 'unbounded' : String(bound);
}
