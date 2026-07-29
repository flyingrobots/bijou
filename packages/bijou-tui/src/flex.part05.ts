import type { Surface } from '@flyingrobots/bijou';
import { createSurface, makeBgFill } from '@flyingrobots/bijou';
import type { FlexChild, FlexOptions, SurfaceFlexChild } from './flex.part01.js';
import { computeSizes } from './flex.part02.js';
import { createRegionSurface, resolveBackgroundColor } from './flex.part03.js';
import { renderChildSurface, renderColumn, renderRow } from './flex.part04.js';

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
