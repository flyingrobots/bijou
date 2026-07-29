import { isPackedSurface, type Surface, type PackedSurface, type Cell } from '@flyingrobots/bijou';
import { encodeModifiers } from '@flyingrobots/bijou/perf';
import { accumulateCellStyle, averagedCellStyle, createStyleAccumulator, resolveCellColor } from './canvas.part01.js';
import type { ShaderFn } from './canvas.part01.js';

function setCellFast(surface: Surface, packed: PackedSurface | undefined, x: number, y: number, cell: Cell): void {
  if (packed && (cell.fgRGB != null || cell.fg != null || cell.bgRGB != null || cell.bg != null)) {
    let fR = -1, fG = 0, fB = 0;
    const fg = resolveCellColor(cell.fgRGB, cell.fg);
    if (fg) { [fR, fG, fB] = fg; }

    let bR = -1, bG = 0, bB = 0;
    const bg = resolveCellColor(cell.bgRGB, cell.bg);
    if (bg) { [bR, bG, bB] = bg; }

    if (fg || bg) {
      packed.setRGB(x, y, cell.char, fR, fG, fB, bR, bG, bB, encodeModifiers(cell.modifiers));
      return;
    }
  }
  surface.set(x, y, cell);
}

function renderCellResolution(surface: Surface, shader: ShaderFn, time: number, uniforms: Record<string, unknown>) {
  const { width, height } = surface;
  const packed = isPackedSurface(surface) ? surface : undefined;
  const uDenominator = Math.max(1, width - 1);
  const vDenominator = Math.max(1, height - 1);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const result = shader({
        u: x / uDenominator,
        v: y / vDenominator,
        time,
        uniforms
      });
      const cell = typeof result === 'string' ? { char: result } : result;
      setCellFast(surface, packed, x, y, cell);
    }
  }
}

function renderQuadResolution(surface: Surface, shader: ShaderFn, time: number, uniforms: Record<string, unknown>) {
  const { width, height } = surface;
  const packed = isPackedSurface(surface) ? surface : undefined;
  const subW = width * 2;
  const subH = height * 2;
  const uDenominator = Math.max(1, subW - 1);
  const vDenominator = Math.max(1, subH - 1);

  const QUAD_CHARS: Record<number, string> = {
    0: ' ', 1: '▘', 2: '▝', 3: '▀',
    4: '▖', 5: '▌', 6: '▞', 7: '▛',
    8: '▗', 9: '▚', 10: '▐', 11: '▜',
    12: '▄', 13: '▙', 14: '▟', 15: '█'
  };

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let mask = 0;
      let firstStyledCell: Cell | null = null;
      const styleAccumulator = createStyleAccumulator();

      for (let sy = 0; sy < 2; sy++) {
        for (let sx = 0; sx < 2; sx++) {
          const px = x * 2 + sx;
          const py = y * 2 + sy;
          const result = shader({
            u: px / uDenominator,
            v: py / vDenominator,
            time,
            uniforms
          });
          const cell = typeof result === 'string' ? { char: result } : result;
          accumulateCellStyle(styleAccumulator, cell);

          if (cell.char !== ' ') {
            mask |= (1 << (sy * 2 + sx));
            firstStyledCell ??= cell;
          }
        }
      }

      setCellFast(surface, packed, x, y, {
        ...(firstStyledCell ?? { char: ' ' }),
        ...averagedCellStyle(styleAccumulator),
        char: QUAD_CHARS[mask] ?? ' '
      });
    }
  }
}

export { renderCellResolution, renderQuadResolution, setCellFast };
