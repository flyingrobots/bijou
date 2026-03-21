import { createSurface, type Surface } from '@flyingrobots/bijou';
import type { PlaceOptions } from './layout.js';

/**
 * Vertical stack for surfaces.
 */
export function vstackSurface(...surfaces: Surface[]): Surface {
  if (surfaces.length === 0) return createSurface(0, 0);

  const width = Math.max(...surfaces.map(s => s.width));
  const height = surfaces.reduce((acc, s) => acc + s.height, 0);

  const result = createSurface(width, height);
  let yOffset = 0;

  for (const s of surfaces) {
    result.blit(s, 0, yOffset);
    yOffset += s.height;
  }

  return result;
}

/**
 * Horizontal stack for surfaces with an optional gap.
 */
export function hstackSurface(gap: number, ...surfaces: Surface[]): Surface {
  if (surfaces.length === 0) return createSurface(0, 0);

  const width = surfaces.reduce((acc, s) => acc + s.width, 0) + (surfaces.length - 1) * gap;
  const height = Math.max(...surfaces.map(s => s.height));

  const result = createSurface(width, height);
  let xOffset = 0;

  for (let i = 0; i < surfaces.length; i++) {
    const s = surfaces[i]!;
    result.blit(s, xOffset, 0);
    xOffset += s.width + gap;
  }

  return result;
}

/**
 * Place a surface within a fixed-size rectangle using horizontal and vertical alignment.
 *
 * Content that exceeds the available width or height is clipped to the top-left visible
 * region, mirroring the string-based `place()` behavior. When the content is smaller than
 * the target rectangle, it is aligned within the blank result surface.
 */
export function placeSurface(content: Surface, options: PlaceOptions): Surface {
  const width = Math.max(0, Math.floor(options.width));
  const height = Math.max(0, Math.floor(options.height));
  const hAlign = options.hAlign ?? 'left';
  const vAlign = options.vAlign ?? 'top';

  if (width === 0 || height === 0) return createSurface(0, 0);

  const result = createSurface(width, height);
  const clipWidth = Math.min(width, content.width);
  const clipHeight = Math.min(height, content.height);

  let col = 0;
  if (content.width < width) {
    switch (hAlign) {
      case 'right':
        col = width - content.width;
        break;
      case 'center':
        col = Math.floor((width - content.width) / 2);
        break;
      case 'left':
      default:
        col = 0;
        break;
    }
  }

  let row = 0;
  if (content.height < height) {
    switch (vAlign) {
      case 'bottom':
        row = height - content.height;
        break;
      case 'middle':
        row = Math.floor((height - content.height) / 2);
        break;
      case 'top':
      default:
        row = 0;
        break;
    }
  }

  if (clipWidth > 0 && clipHeight > 0) {
    result.blit(content, Math.max(0, col), Math.max(0, row), 0, 0, clipWidth, clipHeight);
  }

  return result;
}
