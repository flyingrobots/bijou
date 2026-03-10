import type { RenderMiddleware } from '../pipeline.js';

/**
 * Creates a post-processing middleware that converts all colors in the
 * target surface to grayscale luminance values.
 * 
 * @returns A RenderMiddleware for the 'PostProcess' stage.
 */
export function grayscaleFilter(): RenderMiddleware {
  return (state, next) => {
    const { targetSurface } = state;
    
    for (let i = 0; i < targetSurface.cells.length; i++) {
      const cell = targetSurface.cells[i]!;
      
      if (cell.fg) {
        cell.fg = hexToGrayscale(cell.fg);
      }
      if (cell.bg) {
        cell.bg = hexToGrayscale(cell.bg);
      }
    }
    
    next();
  };
}

/** Convert a #RRGGBB hex string to a grayscale hex string based on luminance. */
function hexToGrayscale(hex: string): string {
  if (hex.length !== 7 || hex[0] !== '#') return hex;
  
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  
  // Standard luminance formula
  const lum = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  
  const hexLum = lum.toString(16).padStart(2, '0');
  return `#${hexLum}${hexLum}${hexLum}`;
}
