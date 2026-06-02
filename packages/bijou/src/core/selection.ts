import type { LayoutRect } from '../ports/surface.js';
import { sanitizeNonNegativeInt, sanitizePositiveInt } from './numeric.js';

const SELECTION_OWNER_BRAND: unique symbol = Symbol('SelectionOwner');

export type SelectionDragSource = 'mouse' | 'touch' | 'keyboard' | 'unknown';
export type SelectionDirection = 'forward' | 'backward';
export type SelectionPolicy = 'selectable' | 'disabled';
export type SelectionBlockerReason =
  | 'overlay'
  | 'drag-handle'
  | 'component-handler'
  | 'terminal-native';

export interface SelectionPoint {
  readonly x: number;
  readonly y: number;
}

export interface SelectionViewportTransform {
  readonly scrollX?: number;
  readonly scrollY?: number;
}

export interface ProseSelectionContentModel {
  readonly kind: 'prose';
  readonly paragraphs: readonly string[];
}

export interface SurfaceSelectionContentModel {
  readonly kind: 'surface';
  readonly lines: readonly string[];
}

export interface TableSelectionContentModel {
  readonly kind: 'table';
  readonly rows: readonly (readonly string[])[];
  readonly delimiter?: string;
}

export interface MixedSelectionContentRegion {
  readonly id: string;
  readonly rect: LayoutRect;
  readonly content: SelectionContentModel;
}

export interface MixedSelectionContentModel {
  readonly kind: 'mixed';
  readonly regions: readonly MixedSelectionContentRegion[];
  readonly separator?: string;
}

export type SelectionContentModel =
  | ProseSelectionContentModel
  | SurfaceSelectionContentModel
  | TableSelectionContentModel
  | MixedSelectionContentModel;

export interface SelectionOwnerInput {
  readonly id: string;
  readonly layoutNodeId: string;
  readonly rect: LayoutRect;
  readonly viewport?: SelectionViewportTransform;
  readonly policy?: SelectionPolicy;
  readonly zIndex?: number;
  readonly content: SelectionContentModel;
}

export interface SelectionOwner {
  readonly [SELECTION_OWNER_BRAND]: true;
  readonly id: string;
  readonly layoutNodeId: string;
  readonly rect: LayoutRect;
  readonly viewport: Required<SelectionViewportTransform>;
  readonly policy: SelectionPolicy;
  readonly zIndex: number;
  readonly content: SelectionContentModel;
}

export interface SelectionRegion {
  readonly ownerId: string;
  readonly layoutNodeId: string;
  readonly screenRect: LayoutRect;
  readonly contentRect: LayoutRect;
  readonly clippingRect: LayoutRect;
  readonly zIndex: number;
  readonly enabled: boolean;
}

export interface SelectionRangeInput {
  readonly anchor: SelectionPoint;
  readonly focus: SelectionPoint;
  readonly dragSource?: SelectionDragSource;
}

export interface SelectionRange {
  readonly ownerId: string;
  readonly anchor: SelectionPoint;
  readonly focus: SelectionPoint;
  readonly start: SelectionPoint;
  readonly end: SelectionPoint;
  readonly contentRect: LayoutRect;
  readonly direction: SelectionDirection;
  readonly dragSource: SelectionDragSource;
}

export interface SelectionBlocker {
  readonly id: string;
  readonly reason: SelectionBlockerReason;
  readonly rect: LayoutRect;
}

export interface CoordinateSelectionInput {
  readonly owners: readonly SelectionOwner[];
  readonly blockers?: readonly SelectionBlocker[];
  readonly anchor: SelectionPoint;
  readonly focus: SelectionPoint;
  readonly dragSource?: SelectionDragSource;
}

export interface SelectionFact {
  readonly kind: string;
  readonly key: string;
  readonly value: string | number | boolean;
}

export interface SelectionClipboardEffect {
  readonly kind: 'clipboard.write';
  readonly ownerId: string;
  readonly text: string;
  readonly facts: readonly SelectionFact[];
}

export type CoordinateSelectionResult =
  | {
      readonly status: 'selected';
      readonly owner: SelectionOwner;
      readonly range: SelectionRange;
      readonly text: string;
      readonly effect: SelectionClipboardEffect;
    }
  | {
      readonly status: 'blocked';
      readonly reason: SelectionBlockerReason;
      readonly blockerId: string;
    }
  | {
      readonly status: 'fallback';
      readonly reason: 'terminal-native';
    };

export function defineSelectionOwner(input: SelectionOwnerInput): SelectionOwner {
  const id = normalizeRequiredText({
    scope: 'selection owner',
    field: 'id',
    value: input.id,
  });
  const layoutNodeId = normalizeRequiredText({
    scope: 'selection owner',
    field: 'layoutNodeId',
    value: input.layoutNodeId,
  });
  const rect = freezeRect(normalizeRect(input.rect));
  const viewport = Object.freeze({
    scrollX: sanitizeNonNegativeInt(input.viewport?.scrollX),
    scrollY: sanitizeNonNegativeInt(input.viewport?.scrollY),
  });
  const policy = input.policy ?? 'selectable';
  if (policy !== 'selectable' && policy !== 'disabled') {
    throw new Error(`selection owner ${id}: unsupported policy ${String(policy)}`);
  }

  return Object.freeze({
    [SELECTION_OWNER_BRAND]: true as true,
    id,
    layoutNodeId,
    rect,
    viewport,
    policy,
    zIndex: normalizeInt(input.zIndex, 0),
    content: freezeContentModel(input.content),
  });
}

export function isSelectionOwner(value: unknown): value is SelectionOwner {
  return (
    typeof value === 'object'
    && value !== null
    && (value as Partial<SelectionOwner>)[SELECTION_OWNER_BRAND] === true
  );
}

export function selectionRegion(owner: SelectionOwner): SelectionRegion {
  assertSelectionOwner(owner, 'selection region');
  const contentRect = Object.freeze({
    x: owner.viewport.scrollX,
    y: owner.viewport.scrollY,
    width: owner.rect.width,
    height: owner.rect.height,
  });

  return Object.freeze({
    ownerId: owner.id,
    layoutNodeId: owner.layoutNodeId,
    screenRect: owner.rect,
    contentRect,
    clippingRect: owner.rect,
    zIndex: owner.zIndex,
    enabled: owner.policy === 'selectable',
  });
}

export function selectionRange(
  owner: SelectionOwner,
  input: SelectionRangeInput,
): SelectionRange {
  assertSelectionOwner(owner, 'selection range');
  const anchor = screenPointToContentPoint(owner, input.anchor);
  const focus = screenPointToContentPoint(owner, input.focus);
  const direction = comparePoints(anchor, focus) <= 0 ? 'forward' : 'backward';
  const start = direction === 'forward' ? anchor : focus;
  const end = direction === 'forward' ? focus : anchor;

  return Object.freeze({
    ownerId: owner.id,
    anchor,
    focus,
    start,
    end,
    contentRect: selectionRegion(owner).contentRect,
    direction,
    dragSource: input.dragSource ?? 'unknown',
  });
}

export function extractSelectionText(
  content: SelectionContentModel,
  range: SelectionRange,
): string {
  if (content.kind === 'table') {
    return extractTableSelection(content, range);
  }
  if (content.kind === 'mixed') {
    return extractMixedSelection(content, range);
  }

  const lines = content.kind === 'prose' ? content.paragraphs : content.lines;
  return extractLineSelection(lines, range);
}

export function selectionClipboardEffect(
  range: SelectionRange,
  text: string,
): SelectionClipboardEffect {
  return Object.freeze({
    kind: 'clipboard.write',
    ownerId: range.ownerId,
    text,
    facts: Object.freeze([
      Object.freeze({ kind: 'entity', key: 'selection.owner', value: range.ownerId }),
      Object.freeze({ kind: 'state', key: 'clipboard.effect', value: 'pending' }),
    ]),
  });
}

export function coordinateSelection(input: CoordinateSelectionInput): CoordinateSelectionResult {
  const normalizedAnchor = normalizePoint(input.anchor);
  const normalizedFocus = normalizePoint(input.focus);
  const blocker = input.blockers?.find((candidate) => rectContainsPoint(
    candidate.rect,
    normalizedAnchor,
  ));
  if (blocker !== undefined) {
    return Object.freeze({
      status: 'blocked',
      reason: blocker.reason,
      blockerId: blocker.id,
    });
  }

  const owner = pickSelectionOwner(input.owners, normalizedAnchor);
  if (owner === undefined) {
    return Object.freeze({
      status: 'fallback',
      reason: 'terminal-native',
    });
  }

  const range = selectionRange(owner, {
    anchor: normalizedAnchor,
    focus: normalizedFocus,
    dragSource: input.dragSource,
  });
  const text = extractSelectionText(owner.content, range);

  return Object.freeze({
    status: 'selected',
    owner,
    range,
    text,
    effect: selectionClipboardEffect(range, text),
  });
}

function pickSelectionOwner(
  owners: readonly SelectionOwner[],
  anchor: SelectionPoint,
): SelectionOwner | undefined {
  let selectedOwner: SelectionOwner | undefined;
  let selectedIndex = -1;

  owners.forEach((owner, index) => {
    assertSelectionOwner(owner, 'selection coordinator');
    if (owner.policy !== 'selectable' || !rectContainsPoint(owner.rect, anchor)) {
      return;
    }

    if (
      selectedOwner === undefined
      || owner.zIndex > selectedOwner.zIndex
      || (owner.zIndex === selectedOwner.zIndex && index > selectedIndex)
    ) {
      selectedOwner = owner;
      selectedIndex = index;
    }
  });

  return selectedOwner;
}

function extractLineSelection(lines: readonly string[], range: SelectionRange): string {
  if (lines.length === 0) {
    return '';
  }

  const startY = Math.max(range.start.y, 0);
  const endY = Math.min(range.end.y, lines.length - 1);
  if (startY > endY) {
    return '';
  }

  const selected: string[] = [];

  for (let y = startY; y <= endY; y += 1) {
    const line = lines[y] ?? '';
    const startX = y === startY ? range.start.x : range.contentRect.x;
    const endX = y === endY
      ? range.end.x
      : range.contentRect.x + range.contentRect.width - 1;
    selected.push(sliceInclusive(line, startX, endX));
  }

  return selected.join('\n');
}

function extractTableSelection(
  content: TableSelectionContentModel,
  range: SelectionRange,
): string {
  const rowCount = content.rows.length;
  if (rowCount === 0) {
    return '';
  }

  const delimiter = content.delimiter ?? '\t';
  const startRow = clamp(range.start.y, 0, rowCount - 1);
  const endRow = clamp(range.end.y, 0, rowCount - 1);
  const selectedRows: string[] = [];

  const startColumn = Math.min(range.start.x, range.end.x);
  const endColumn = Math.max(range.start.x, range.end.x);

  for (let rowIndex = startRow; rowIndex <= endRow; rowIndex += 1) {
    const row = content.rows[rowIndex] ?? [];
    const rowStartColumn = clamp(startColumn, 0, Math.max(0, row.length - 1));
    const rowEndColumn = clamp(endColumn, 0, Math.max(0, row.length - 1));
    selectedRows.push(row.slice(rowStartColumn, rowEndColumn + 1).join(delimiter));
  }

  return selectedRows.join('\n');
}

function extractMixedSelection(
  content: MixedSelectionContentModel,
  range: SelectionRange,
): string {
  const selectedText = content.regions.flatMap((region) => {
    const childRange = childRangeForRegion(range, region);
    if (childRange === undefined) {
      return [];
    }

    const text = extractSelectionText(region.content, childRange);
    return text.length === 0 ? [] : [text];
  });

  return selectedText.join(content.separator ?? '\n');
}

function screenPointToContentPoint(owner: SelectionOwner, point: SelectionPoint): SelectionPoint {
  const normalizedPoint = normalizePoint(point);
  const clampedScreenX = clamp(
    normalizedPoint.x,
    owner.rect.x,
    owner.rect.x + owner.rect.width - 1,
  );
  const clampedScreenY = clamp(
    normalizedPoint.y,
    owner.rect.y,
    owner.rect.y + owner.rect.height - 1,
  );

  return Object.freeze({
    x: clampedScreenX - owner.rect.x + owner.viewport.scrollX,
    y: clampedScreenY - owner.rect.y + owner.viewport.scrollY,
  });
}

function freezeContentModel(content: SelectionContentModel): SelectionContentModel {
  if (content.kind === 'prose') {
    return Object.freeze({
      kind: 'prose',
      paragraphs: Object.freeze([...content.paragraphs]),
    });
  }
  if (content.kind === 'surface') {
    return Object.freeze({
      kind: 'surface',
      lines: Object.freeze([...content.lines]),
    });
  }
  if (content.kind === 'table') {
    return Object.freeze({
      kind: 'table',
      rows: Object.freeze(content.rows.map((row) => Object.freeze([...row]))),
      delimiter: content.delimiter,
    });
  }
  if (content.kind === 'mixed') {
    return Object.freeze({
      kind: 'mixed',
      regions: Object.freeze(content.regions.map((region) => Object.freeze({
        id: normalizeRequiredText({
          scope: 'selection content region',
          field: 'id',
          value: region.id,
        }),
        rect: freezeRect(normalizeRect(region.rect)),
        content: freezeContentModel(region.content),
      }))),
      separator: content.separator,
    });
  }

  throw new Error('selection owner: unsupported content model');
}

function childRangeForRegion(
  range: SelectionRange,
  region: MixedSelectionContentRegion,
): SelectionRange | undefined {
  const childEndY = region.rect.y + region.rect.height - 1;
  const childEndX = region.rect.x + region.rect.width - 1;
  const startY = Math.max(range.start.y, region.rect.y);
  const endY = Math.min(range.end.y, childEndY);
  if (startY > endY) {
    return undefined;
  }

  const startX = startY === range.start.y
    ? Math.max(range.start.x, region.rect.x)
    : region.rect.x;
  const endX = endY === range.end.y
    ? Math.min(range.end.x, childEndX)
    : childEndX;
  if (startX > childEndX || endX < region.rect.x) {
    return undefined;
  }

  const start = Object.freeze({
    x: Math.max(startX, region.rect.x) - region.rect.x,
    y: startY - region.rect.y,
  });
  const end = Object.freeze({
    x: Math.min(endX, childEndX) - region.rect.x,
    y: endY - region.rect.y,
  });

  return Object.freeze({
    ownerId: `${range.ownerId}:${region.id}`,
    anchor: start,
    focus: end,
    start,
    end,
    contentRect: Object.freeze({
      x: 0,
      y: 0,
      width: region.rect.width,
      height: region.rect.height,
    }),
    direction: 'forward',
    dragSource: range.dragSource,
  });
}

function assertSelectionOwner(owner: SelectionOwner, scope: string): void {
  if (!isSelectionOwner(owner)) {
    throw new Error(`${scope}: owner was not created by defineSelectionOwner()`);
  }
}

function normalizeRequiredText(input: {
  readonly scope: string;
  readonly field: string;
  readonly value: string;
}): string {
  const normalized = input.value.trim();
  if (normalized.length === 0) {
    throw new Error(`${input.scope}: ${input.field} is required`);
  }

  return normalized;
}

function normalizeRect(rect: LayoutRect): LayoutRect {
  return {
    x: sanitizeNonNegativeInt(rect.x),
    y: sanitizeNonNegativeInt(rect.y),
    width: sanitizePositiveInt(rect.width),
    height: sanitizePositiveInt(rect.height),
  };
}

function freezeRect(rect: LayoutRect): LayoutRect {
  return Object.freeze({ ...rect });
}

function normalizePoint(point: SelectionPoint): SelectionPoint {
  return Object.freeze({
    x: sanitizeNonNegativeInt(point.x),
    y: sanitizeNonNegativeInt(point.y),
  });
}

function rectContainsPoint(rect: LayoutRect, point: SelectionPoint): boolean {
  const normalizedRect = normalizeRect(rect);
  return (
    point.x >= normalizedRect.x
    && point.y >= normalizedRect.y
    && point.x < normalizedRect.x + normalizedRect.width
    && point.y < normalizedRect.y + normalizedRect.height
  );
}

function comparePoints(a: SelectionPoint, b: SelectionPoint): number {
  if (a.y !== b.y) {
    return a.y - b.y;
  }

  return a.x - b.x;
}

function sliceInclusive(text: string, start: number, end: number): string {
  if (text.length === 0 || end < 0 || start > end || start >= text.length) {
    return '';
  }

  const safeStart = Math.max(0, start);
  const safeEnd = clamp(end, 0, text.length - 1);
  if (safeStart > safeEnd) {
    return '';
  }

  return text.slice(safeStart, safeEnd + 1);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function normalizeInt(value: number | undefined, fallback: number): number {
  if (value == null || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.floor(value);
}
