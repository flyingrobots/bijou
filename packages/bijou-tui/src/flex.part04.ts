import type { BijouContext, Surface } from '@flyingrobots/bijou';
import { createSurface, makeBgFill } from '@flyingrobots/bijou';
import type { ResolvedChild, SurfaceFlexChild } from './flex.part01.js';
import { fitWidth, renderContent, renderSurfaceContent } from './flex.part02.js';
import { alignCross, alignOffset, createRegionSurface, inheritBackground, renderTextSurface, resolveBackgroundColor } from './flex.part03.js';

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

export { renderChildSurface, renderColumn, renderRow };
