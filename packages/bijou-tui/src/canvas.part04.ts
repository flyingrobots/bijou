import { createSurface, type Surface } from '@flyingrobots/bijou';
import type { CanvasOptions, ShaderFn } from './canvas.part01.js';
import { renderCellResolution, renderQuadResolution } from './canvas.part02.js';
import { renderBrailleResolution, renderGlyphResolution } from './canvas.part03.js';

export function canvas(
  cols: number,
  rows: number,
  shader: ShaderFn,
  options: CanvasOptions = {}
): Surface {
  const { resolution = 'cell', time = 0, uniforms = {}, glyphFit } = options;
  const surface = createSurface(cols, rows);

  if (cols <= 0 || rows <= 0) return surface;

  switch (resolution) {
    case 'cell':
      renderCellResolution(surface, shader, time, uniforms);
      break;
    case 'quad':
      renderQuadResolution(surface, shader, time, uniforms);
      break;
    case 'braille':
      renderBrailleResolution(surface, shader, time, uniforms);
      break;
    case 'glyph':
      renderGlyphResolution(surface, shader, time, uniforms, glyphFit);
      break;
  }

  return surface;
}
