import { createSurface, isPackedSurface, type Surface, type Cell } from '@flyingrobots/bijou';
import { fitCellGlyph, type CellGlyphFitOptions } from './cell-glyph-fit.js';
import { accumulateCellStyle, averagedCellStyle, createStyleAccumulator } from './canvas.part01.js';
import type { CanvasOptions, ShaderCell, ShaderFn } from './canvas.part01.js';
import { renderCellResolution, renderQuadResolution, setCellFast } from './canvas.part02.js';

function renderBrailleResolution(surface: Surface, shader: ShaderFn, time: number, uniforms: Record<string, unknown>) {
  const { width, height } = surface;
  const packed = isPackedSurface(surface) ? surface : undefined;
  const subW = width * 2;
  const subH = height * 4;
  const uDenominator = Math.max(1, subW - 1);
  const vDenominator = Math.max(1, subH - 1);

  const DOT_MAP = [
    [0x01, 0x08],
    [0x02, 0x10],
    [0x04, 0x20],
    [0x40, 0x80]
  ];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let code = 0;
      let firstStyledCell: Cell | null = null;
      const styleAccumulator = createStyleAccumulator();

      for (let sy = 0; sy < 4; sy++) {
        for (let sx = 0; sx < 2; sx++) {
          const px = x * 2 + sx;
          const py = y * 4 + sy;
          const result = shader({
            u: px / uDenominator,
            v: py / vDenominator,
            time,
            uniforms
          });
          const cell = typeof result === 'string' ? { char: result } : result;
          accumulateCellStyle(styleAccumulator, cell);

          if (cell.char !== ' ') {
            code |= DOT_MAP[sy]?.[sx] ?? 0;
            firstStyledCell ??= cell;
          }
        }
      }

      setCellFast(surface, packed, x, y, {
        ...(firstStyledCell ?? { char: ' ' }),
        ...averagedCellStyle(styleAccumulator),
        char: String.fromCharCode(0x2800 + code)
      });
    }
  }
}

function clampCoverage(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

function cellCoverage(cell: ShaderCell): number {
  if (cell.coverage !== undefined) return clampCoverage(cell.coverage);
  return cell.char === ' ' ? 0 : 1;
}

function renderGlyphResolution(
  surface: Surface,
  shader: ShaderFn,
  time: number,
  uniforms: Record<string, unknown>,
  glyphFit: CellGlyphFitOptions | undefined,
) {
  const { width, height } = surface;
  const packed = isPackedSurface(surface) ? surface : undefined;
  const subW = width * 2;
  const subH = height * 4;
  const uDenominator = Math.max(1, subW - 1);
  const vDenominator = Math.max(1, subH - 1);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let firstStyledCell: ShaderCell | null = null;
      const coverage: number[] = [];
      const styleAccumulator = createStyleAccumulator();

      for (let sy = 0; sy < 4; sy++) {
        for (let sx = 0; sx < 2; sx++) {
          const px = x * 2 + sx;
          const py = y * 4 + sy;
          const result = shader({
            u: px / uDenominator,
            v: py / vDenominator,
            time,
            uniforms
          });
          const cell = typeof result === 'string' ? { char: result } : result;
          coverage.push(cellCoverage(cell));
          accumulateCellStyle(styleAccumulator, cell);

          if (cell.char !== ' ' && !firstStyledCell) {
            firstStyledCell = cell;
          }
        }
      }

      setCellFast(surface, packed, x, y, {
        ...(firstStyledCell ?? { char: ' ' }),
        ...averagedCellStyle(styleAccumulator),
        char: fitCellGlyph(coverage, glyphFit)
      });
    }
  }
}

export function canvas(
  cols: number,
  rows: number,
  shader: ShaderFn,
  options: CanvasOptions = {},
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

export { renderBrailleResolution, renderGlyphResolution };
