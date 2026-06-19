import type { BijouContext, TokenValue, Surface } from '@flyingrobots/bijou';
import { createSurface, isPackedSurface, makeBgFill, parseAnsiToSurface, shouldApplyBg } from '@flyingrobots/bijou';
import { parseHex, CELL_STRIDE, OFF_FLAGS, OFF_ALPHA, FLAG_BG_SET, FLAG_EMPTY } from '@flyingrobots/bijou/perf';

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

export type SurfaceFlexRenderable =
  | string
  | Surface
  | ((width: number, height: number) => string | Surface);

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

function visualWidth(s: string): number {
  return visibleLength(s);
}

interface ResolvedChild {
  /** Allocated size along the main axis. */
  allocatedSize: number;
  /** Available size along the cross axis. */
  crossSize: number;
  /** Original child descriptor. */
  child: FlexChild;
}

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

  for (const [i, child] of children.entries()) {
    const flexGrow = child.flex ?? 0;
    if (flexGrow > 0) {
      const raw = totalFlex > 0 ? Math.floor((flexGrow / totalFlex) * remaining) : 0;
      sizes[i] = clampSize(raw, child.minSize, child.maxSize);
    }
  }

  return children.map((child, i) => ({
    allocatedSize: sizes[i] ?? 0,
    crossSize: crossAxisTotal,
    child,
  }));
}

function clampSize(size: number, min?: number, max?: number): number {
  let result = size;
  if (min !== undefined) result = Math.max(result, min);
  if (max !== undefined) result = Math.min(result, max);
  return Math.max(0, result);
}

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
    }
  });
}

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
  // Fast path: packed surface — write bg bytes directly
  const packedSurface = isPackedSurface(next) ? next : undefined;
  const rgb = packedSurface ? parseHex(bg) : undefined;
  if (packedSurface && rgb) {
    const [bgR, bgG, bgB] = rgb;
    const buf = packedSurface.buffer;
    const size = next.width * next.height;
    for (let i = 0; i < size; i++) {
      const off = i * CELL_STRIDE;
      if ((buf[off + OFF_FLAGS] ?? 0) & FLAG_EMPTY) continue;
      if ((buf[off + OFF_ALPHA] ?? 0) & FLAG_BG_SET) continue;
      buf[off + 5] = bgR; buf[off + 6] = bgG; buf[off + 7] = bgB;
      buf[off + OFF_ALPHA] = (buf[off + OFF_ALPHA] ?? 0) | FLAG_BG_SET;
    }
    packedSurface.markAllDirty();
    return next;
  }
  for (let y = 0; y < next.height; y++) {
    for (let x = 0; x < next.width; x++) {
      const cell = next.get(x, y);
      if (!cell.empty && cell.bg === undefined) {
        next.set(x, y, { ...cell, bg });
      }
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
  for (const [i, line] of lines.entries()) {
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
    for (const column of columns) {
      parts.push(column[r] ?? '');
    }
    rows.push(parts.join(spacer));
  }
  return rows.join('\n');
}

function renderColumn(
  items: ResolvedChild[],
  totalWidth: number,
  totalHeight: number,
  gap: number,
  containerBg?: (text: string) => string,
  ctx?: BijouContext,
): string {
  const lines: string[] = [];

  for (const [i, item] of items.entries()) {
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
