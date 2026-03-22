/**
 * Flexbox-style layout for terminal UIs.
 *
 * Distributes available space among children using flex-grow factors,
 * fixed basis sizes, and min/max constraints. Children can be static
 * strings or render functions that receive their allocated dimensions.
 *
 * ```ts
 * flex({ direction: 'row', width: 80, height: 24 },
 *   { basis: 20, content: sidebar },
 *   { flex: 1, content: (w, h) => viewport({ width: w, height: h, content: body }) },
 * )
 * ```
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

import type { BijouContext, TokenValue, Surface } from '@flyingrobots/bijou';
import { createSurface, makeBgFill, parseAnsiToSurface, shouldApplyBg } from '@flyingrobots/bijou';

/**
 * Configuration for the flex layout container.
 */
export interface FlexOptions {
  /** Layout direction. Default: 'row'. */
  readonly direction?: 'row' | 'column';
  /** Available width in columns. */
  readonly width: number;
  /** Available height in rows. */
  readonly height: number;
  /** Gap between children (in the main axis). Default: 0. */
  readonly gap?: number;
  /** Background token applied to the entire flex container (gap + padding areas). Requires `bg` field on the token. */
  readonly bgToken?: TokenValue;
  /** Bijou context for styled output (required for bgToken to take effect). */
  readonly ctx?: BijouContext;
}

/**
 * Descriptor for a single child within a flex layout.
 */
export interface FlexChild {
  /**
   * Content to render. Either a static string, or a function that
   * receives the allocated (width, height) and returns a string.
   */
  readonly content: string | ((width: number, height: number) => string);
  /** Flex-grow factor. Children with flex > 0 share remaining space. Default: 0. */
  readonly flex?: number;
  /** Fixed size along the main axis (columns for row, rows for column). */
  readonly basis?: number;
  /** Minimum size along the main axis. */
  readonly minSize?: number;
  /** Maximum size along the main axis. */
  readonly maxSize?: number;
  /** Cross-axis alignment. Default: 'start'. */
  readonly align?: 'start' | 'center' | 'end';
  /** Background token for this child's allocated region. Requires `bg` field on the token and `ctx` on `FlexOptions`. */
  readonly bgToken?: TokenValue;
}

/**
 * Surface-aware content accepted by {@link flexSurface}.
 */
export type SurfaceFlexRenderable =
  | string
  | Surface
  | ((width: number, height: number) => string | Surface);

/**
 * Descriptor for a surface-native flex child.
 */
export interface SurfaceFlexChild {
  /** Content to render for this allocated region. */
  readonly content: SurfaceFlexRenderable;
  /** Flex-grow factor. Children with flex > 0 share remaining space. Default: 0. */
  readonly flex?: number;
  /** Fixed size along the main axis (columns for row, rows for column). */
  readonly basis?: number;
  /** Minimum size along the main axis. */
  readonly minSize?: number;
  /** Maximum size along the main axis. */
  readonly maxSize?: number;
  /** Cross-axis alignment. Default: 'start'. */
  readonly align?: 'start' | 'center' | 'end';
  /** Background token for this child's allocated region. Requires `bg` field on the token and `ctx` on `FlexOptions`. */
  readonly bgToken?: TokenValue;
}

import { visibleLength, clipToWidth } from './viewport.js';

// ---------------------------------------------------------------------------
// ANSI helpers
// ---------------------------------------------------------------------------

/**
 * Compute the terminal display width of a string.
 *
 * @param s - Input string possibly containing ANSI escapes.
 * @returns Number of visible terminal columns.
 */
function visualWidth(s: string): number {
  return visibleLength(s);
}

// ---------------------------------------------------------------------------
// Size computation
// ---------------------------------------------------------------------------

/**
 * Internal representation of a child after size allocation.
 */
interface ResolvedChild {
  /** Allocated size along the main axis. */
  allocatedSize: number;
  /** Available size along the cross axis. */
  crossSize: number;
  /** Original child descriptor. */
  child: FlexChild;
}

/**
 * Shared flex-child shape for sizing/layout logic.
 */
interface FlexChildLike {
  readonly content: string | Surface | ((width: number, height: number) => string | Surface);
  readonly flex?: number;
  readonly basis?: number;
  readonly minSize?: number;
  readonly maxSize?: number;
  readonly align?: 'start' | 'center' | 'end';
  readonly bgToken?: TokenValue;
}

interface ResolvedFlexChild<T extends FlexChildLike> {
  allocatedSize: number;
  crossSize: number;
  child: T;
}

/**
 * Distribute available main-axis space among children.
 *
 * Fixed-size children (basis or auto-measured) consume space first,
 * then remaining space is divided proportionally among flex children.
 *
 * @param children - Child descriptors to allocate sizes for.
 * @param mainAxisTotal - Total available size along the main axis.
 * @param crossAxisTotal - Total available size along the cross axis.
 * @param gap - Gap size between children on the main axis.
 * @param isRow - True for row direction (main axis = width), false for column.
 * @returns Resolved children with allocated sizes.
 */
function computeSizes<T extends FlexChildLike>(
  children: readonly T[],
  mainAxisTotal: number,
  crossAxisTotal: number,
  gap: number,
  isRow: boolean,
): ResolvedFlexChild<T>[] {
  if (children.length === 0) return [];

  const totalGaps = gap * (children.length - 1);
  const available = Math.max(0, mainAxisTotal - totalGaps);

  // First pass: allocate fixed-size children (basis or content measurement)
  const sizes: number[] = [];
  let usedByFixed = 0;
  let totalFlex = 0;

  for (const child of children) {
    const flexGrow = child.flex ?? 0;
    if (flexGrow > 0) {
      sizes.push(0); // placeholder
      totalFlex += flexGrow;
    } else if (child.basis !== undefined) {
      const clamped = clampSize(child.basis, child.minSize, child.maxSize);
      sizes.push(clamped);
      usedByFixed += clamped;
    } else {
      // Auto-size from content
      const measured = measureContent(child.content, isRow);
      const clamped = clampSize(measured, child.minSize, child.maxSize);
      sizes.push(clamped);
      usedByFixed += clamped;
    }
  }

  // Second pass: distribute remaining space to flex children
  const remaining = Math.max(0, available - usedByFixed);

  for (let i = 0; i < children.length; i++) {
    const flexGrow = children[i]!.flex ?? 0;
    if (flexGrow > 0) {
      const raw = totalFlex > 0 ? Math.floor((flexGrow / totalFlex) * remaining) : 0;
      sizes[i] = clampSize(raw, children[i]!.minSize, children[i]!.maxSize);
    }
  }

  return children.map((child, i) => ({
    allocatedSize: sizes[i]!,
    crossSize: crossAxisTotal,
    child,
  }));
}

/**
 * Clamp a size value within optional min/max bounds, flooring at 0.
 *
 * @param size - Raw size value.
 * @param min - Minimum allowed size (inclusive).
 * @param max - Maximum allowed size (inclusive).
 * @returns Clamped size, never negative.
 */
function clampSize(size: number, min?: number, max?: number): number {
  let result = size;
  if (min !== undefined) result = Math.max(result, min);
  if (max !== undefined) result = Math.min(result, max);
  return Math.max(0, result);
}

/**
 * Measure the intrinsic size of static content along the main axis.
 *
 * Return 0 for render functions (they must use flex or basis).
 *
 * @param content - Static string or render function.
 * @param isRow - True to measure width, false to measure height.
 * @returns Measured size in the main-axis direction.
 */
function measureContent(
  content: string | Surface | ((width: number, height: number) => string | Surface),
  isRow: boolean,
): number {
  if (typeof content === 'function') {
    // Can't measure a render function — treat as 0 (must use flex or basis)
    return 0;
  }
  if (typeof content !== 'string') {
    return isRow ? content.width : content.height;
  }
  const lines = content.split('\n');
  if (isRow) {
    // Width = max visible line width
    return Math.max(0, ...lines.map(visualWidth));
  }
  // Height = number of lines
  return lines.length;
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

/**
 * Render a child's content, invoking its render function if applicable.
 *
 * @param child - Child descriptor whose content to render.
 * @param width - Allocated width in columns.
 * @param height - Allocated height in rows.
 * @returns Rendered content string.
 */
function renderContent(
  child: FlexChild,
  width: number,
  height: number,
): string {
  if (typeof child.content === 'function') {
    return child.content(width, height);
  }
  return child.content;
}

function renderSurfaceContent(
  child: SurfaceFlexChild,
  width: number,
  height: number,
): string | Surface {
  if (typeof child.content === 'function') {
    return child.content(width, height);
  }
  return child.content;
}

/**
 * Clip or pad each content line to an exact visible width.
 *
 * Does NOT pad height — that is handled by {@link alignCross}.
 *
 * @param content - Rendered content string (newline-delimited).
 * @param width - Target visible width in columns.
 * @param align - Horizontal alignment for lines shorter than width. Default: 'start'.
 * @returns Array of lines, each exactly `width` visible columns wide.
 */
function fitWidth(content: string, width: number, align: 'start' | 'center' | 'end' = 'start'): string[] {
  const lines = content.split('\n');
  return lines.map((line) => {
    const vis = visualWidth(line);
    if (vis > width) {
      return clipToWidth(line, width);
    }
    
    const padding = Math.max(0, width - vis);
    switch (align) {
      case 'start':
        return line + ' '.repeat(padding);
      case 'end':
        return ' '.repeat(padding) + line;
      case 'center': {
        const before = Math.floor(padding / 2);
        const after = padding - before;
        return ' '.repeat(before) + line + ' '.repeat(after);
      }
      default: {
        const _exhaustive: never = align;
        throw new Error(`Unknown alignment: ${_exhaustive}`);
      }
    }
  });
}

/**
 * Align content lines along the cross axis by padding with empty lines.
 *
 * Truncate if content exceeds `totalCrossSize`; pad otherwise.
 *
 * @param lines - Rendered lines to align.
 * @param totalCrossSize - Total cross-axis size in lines (height for row layout, character width for column layout).
 * @param align - Cross-axis alignment ('start', 'center', or 'end').
 * @param width - Width of each empty padding line.
 * @returns Array of exactly `totalCrossSize` lines.
 */
function alignCross(
  lines: string[],
  totalCrossSize: number,
  align: 'start' | 'center' | 'end',
  width: number,
): string[] {
  if (lines.length >= totalCrossSize) return lines.slice(0, totalCrossSize);

  const emptyLine = ' '.repeat(Math.max(0, width));
  const padding = totalCrossSize - lines.length;

  switch (align) {
    case 'start':
      return [...lines, ...Array.from<string>({ length: padding }).fill(emptyLine)];
    case 'end':
      return [...Array.from<string>({ length: padding }).fill(emptyLine), ...lines];
    case 'center': {
      const before = Math.floor(padding / 2);
      const after = padding - before;
      return [
        ...Array.from<string>({ length: before }).fill(emptyLine),
        ...lines,
        ...Array.from<string>({ length: after }).fill(emptyLine),
      ];
    }
  }
}

function resolveBackgroundColor(token: TokenValue | undefined, ctx: BijouContext | undefined): string | undefined {
  if (!token?.bg) return undefined;
  return shouldApplyBg(ctx) ? token.bg : undefined;
}

function createRegionSurface(width: number, height: number, bg: string | undefined): Surface {
  return createSurface(
    Math.max(0, width),
    Math.max(0, height),
    bg ? { char: ' ', bg, empty: false } : { char: ' ', empty: false },
  );
}

function inheritBackground(surface: Surface, bg: string | undefined): Surface {
  if (!bg || surface.width === 0 || surface.height === 0) return surface;
  const next = surface.clone();
  for (let i = 0; i < next.cells.length; i++) {
    const cell = next.cells[i]!;
    if (!cell.empty && cell.bg === undefined) {
      next.cells[i] = { ...cell, bg };
    }
  }
  return next;
}

function alignOffset(total: number, size: number, align: 'start' | 'center' | 'end'): number {
  if (size >= total) return 0;
  const spare = total - size;
  switch (align) {
    case 'start':
      return 0;
    case 'end':
      return spare;
    case 'center':
      return Math.floor(spare / 2);
  }
}

function renderTextSurface(
  content: string,
  width: number,
  height: number,
  hAlign: 'start' | 'center' | 'end',
  vAlign: 'start' | 'center' | 'end',
): Surface {
  const result = createSurface(Math.max(0, width), Math.max(0, height));
  if (width <= 0 || height <= 0) return result;

  const rawLines = content.split('\n');
  const lines = rawLines
    .map((line) => {
      const vis = visualWidth(line);
      return vis > width ? clipToWidth(line, width) : line;
    })
    .slice(0, height);

  const yOffset = alignOffset(height, lines.length, vAlign);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const lineWidth = visualWidth(line);
    if (lineWidth <= 0) continue;
    const lineSurface = parseAnsiToSurface(line, lineWidth, 1);
    const xOffset = alignOffset(width, lineSurface.width, hAlign);
    result.blit(lineSurface, xOffset, yOffset + i);
  }

  return result;
}

function fitSurface(
  content: Surface,
  width: number,
  height: number,
  hAlign: 'start' | 'center' | 'end',
  vAlign: 'start' | 'center' | 'end',
): Surface {
  const result = createSurface(Math.max(0, width), Math.max(0, height));
  if (width <= 0 || height <= 0) return result;

  const xOffset = alignOffset(width, content.width, hAlign);
  const yOffset = alignOffset(height, content.height, vAlign);
  result.blit(content, xOffset, yOffset, 0, 0, Math.min(content.width, width), Math.min(content.height, height));
  return result;
}

function renderChildSurface(
  child: SurfaceFlexChild,
  width: number,
  height: number,
  isRow: boolean,
  containerBg: string | undefined,
  ctx: BijouContext | undefined,
): Surface {
  const bg = resolveBackgroundColor(child.bgToken, ctx) ?? containerBg;
  const region = createRegionSurface(width, height, bg);
  const rendered = renderSurfaceContent(child, width, height);
  const hAlign = isRow ? 'start' : (child.align ?? 'start');
  const vAlign = isRow ? (child.align ?? 'start') : 'start';
  const contentSurface = typeof rendered === 'string'
    ? renderTextSurface(rendered, width, height, hAlign, vAlign)
    : fitSurface(rendered, width, height, hAlign, vAlign);

  region.blit(inheritBackground(contentSurface, bg), 0, 0);
  return region;
}

// ---------------------------------------------------------------------------
// flex() — main API
// ---------------------------------------------------------------------------

/**
 * Lay out children using flexbox-style rules.
 *
 * Row direction: children are placed side-by-side horizontally.
 * Column direction: children are stacked vertically.
 *
 * ```ts
 * // Sidebar + main content
 * flex({ direction: 'row', width: 80, height: 24, gap: 1 },
 *   { basis: 20, content: sidebarContent },
 *   { flex: 1, content: (w, h) => renderMain(w, h) },
 * )
 *
 * // Header + body + footer
 * flex({ direction: 'column', width: 80, height: 24 },
 *   { basis: 1, content: headerLine },
 *   { flex: 1, content: (w, h) => renderBody(w, h) },
 *   { basis: 1, content: statusLine },
 * )
 * ```
 *
 * @param options - Layout container configuration (direction, dimensions, gap).
 * @param children - Child descriptors with content, flex factors, and constraints.
 * @returns Composed layout string with lines joined by newlines. Empty string if no children.
 */
export function flex(options: FlexOptions, ...children: FlexChild[]): string {
  const { direction = 'row' } = options;
  const width = Math.max(0, Math.floor(options.width));
  const height = Math.max(0, Math.floor(options.height));
  const gap = Math.max(0, Math.floor(options.gap ?? 0));
  const isRow = direction === 'row';
  const containerBg = makeBgFill(options.bgToken, options.ctx);

  const mainAxisTotal = isRow ? width : height;
  const crossAxisTotal = isRow ? height : width;

  if (children.length === 0) return '';

  const resolved = computeSizes(children, mainAxisTotal, crossAxisTotal, gap, isRow);

  if (isRow) {
    return renderRow(resolved, height, gap, containerBg, options.ctx);
  }
  return renderColumn(resolved, width, height, gap, containerBg, options.ctx);
}

/**
 * Lay out children using flexbox-style rules and return a Surface directly.
 *
 * This is the surface-native companion to {@link flex}. It accepts string,
 * surface, or render-function content and keeps the layout boundary structured.
 *
 * @param options - Layout container configuration (direction, dimensions, gap).
 * @param children - Child descriptors with string/surface content.
 * @returns Surface sized to the requested container rectangle.
 */
export function flexSurface(options: FlexOptions, ...children: SurfaceFlexChild[]): Surface {
  const { direction = 'row' } = options;
  const width = Math.max(0, Math.floor(options.width));
  const height = Math.max(0, Math.floor(options.height));
  const gap = Math.max(0, Math.floor(options.gap ?? 0));
  const isRow = direction === 'row';
  const containerBg = resolveBackgroundColor(options.bgToken, options.ctx);

  if (children.length === 0) return createSurface(0, 0);

  const mainAxisTotal = isRow ? width : height;
  const crossAxisTotal = isRow ? height : width;
  const resolved = computeSizes(children, mainAxisTotal, crossAxisTotal, gap, isRow);
  const surface = createRegionSurface(width, height, containerBg);

  if (isRow) {
    let xOffset = 0;
    for (const item of resolved) {
      const childSurface = renderChildSurface(item.child, item.allocatedSize, height, true, containerBg, options.ctx);
      surface.blit(childSurface, xOffset, 0);
      xOffset += item.allocatedSize + gap;
    }
    return surface;
  }

  let yOffset = 0;
  for (const item of resolved) {
    const childSurface = renderChildSurface(item.child, width, item.allocatedSize, false, containerBg, options.ctx);
    surface.blit(childSurface, 0, yOffset);
    yOffset += item.allocatedSize + gap;
  }
  return surface;
}

/**
 * Compose resolved children side-by-side in a horizontal row layout.
 *
 * @param items - Resolved children with allocated widths.
 * @param totalHeight - Total available height in rows.
 * @param gap - Horizontal gap between children in columns.
 * @param containerBg - Optional background fill function for container regions (gaps, padding).
 * @param ctx - Bijou context, used to resolve per-child bgToken fills.
 * @returns Composed row string with lines joined by newlines.
 */
function renderRow(
  items: ResolvedChild[],
  totalHeight: number,
  gap: number,
  containerBg?: (text: string) => string,
  ctx?: BijouContext,
): string {
  // Render each child into a column of lines
  const columns: string[][] = [];

  for (const item of items) {
    const childWidth = item.allocatedSize;
    const rendered = renderContent(item.child, childWidth, totalHeight);
    // In row mode, fitWidth always uses 'start' — align controls cross-axis (vertical) only
    const widthFitted = fitWidth(rendered, childWidth);
    const aligned = alignCross(widthFitted, totalHeight, item.child.align ?? 'start', childWidth);
    // Apply per-child bg fill (overrides container bg for this region)
    const childBg = makeBgFill(item.child.bgToken, ctx) ?? containerBg;
    const filled = childBg ? aligned.map(childBg) : aligned;
    columns.push(filled);
  }

  // Compose columns side-by-side
  const rawSpacer = ' '.repeat(Math.max(0, gap));
  const spacer = containerBg && gap > 0 ? containerBg(rawSpacer) : rawSpacer;
  const rows: string[] = [];
  for (let r = 0; r < totalHeight; r++) {
    const parts: string[] = [];
    for (let c = 0; c < columns.length; c++) {
      parts.push(columns[c]![r]!);
    }
    rows.push(parts.join(spacer));
  }
  return rows.join('\n');
}

/**
 * Stack resolved children vertically in a column layout.
 *
 * @param items - Resolved children with allocated heights.
 * @param totalWidth - Total available width in columns.
 * @param totalHeight - Total available height in rows.
 * @param gap - Vertical gap between children in rows.
 * @param containerBg - Optional background fill function for container regions (gaps, padding).
 * @param ctx - Bijou context, used to resolve per-child bgToken fills.
 * @returns Composed column string with lines joined by newlines.
 */
function renderColumn(
  items: ResolvedChild[],
  totalWidth: number,
  totalHeight: number,
  gap: number,
  containerBg?: (text: string) => string,
  ctx?: BijouContext,
): string {
  const lines: string[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i]!;
    const childHeight = item.allocatedSize;
    const rendered = renderContent(item.child, totalWidth, childHeight);
    const widthFitted = fitWidth(rendered, totalWidth, item.child.align ?? 'start');
    const aligned = alignCross(widthFitted, childHeight, 'start', totalWidth);

    // Apply per-child bg fill
    const childBg = makeBgFill(item.child.bgToken, ctx) ?? containerBg;
    const filled = childBg ? aligned.map(childBg) : aligned;
    lines.push(...filled);

    // Add gap between items
    if (i < items.length - 1 && gap > 0) {
      const rawSpacer = ' '.repeat(Math.max(0, totalWidth));
      const spacer = containerBg ? containerBg(rawSpacer) : rawSpacer;
      for (let g = 0; g < gap; g++) {
        lines.push(spacer);
      }
    }
  }

  // Pad to fill totalHeight if needed
  const rawEmpty = ' '.repeat(Math.max(0, totalWidth));
  const emptyLine = containerBg ? containerBg(rawEmpty) : rawEmpty;
  while (lines.length < totalHeight) {
    lines.push(emptyLine);
  }

  return lines.slice(0, totalHeight).join('\n');
}
