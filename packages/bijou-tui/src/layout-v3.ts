import { createSurface, type Surface } from '@flyingrobots/bijou';

/**
 * Vertical stack for Surfaces.
 */
export function vstackV3(...surfaces: Surface[]): Surface {
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
 * Horizontal stack for Surfaces with optional gap.
 */
export function hstackV3(gap: number, ...surfaces: Surface[]): Surface {
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
