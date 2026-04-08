/**
 * Rich shader-based canvas primitive for procedural character art.
 * 
 * Supports high-resolution plotting via Braille and Quad characters,
 * with normalized UV mapping and full color/styling support.
 */

import { createSurface, type Surface, type PackedSurface, type Cell } from '@flyingrobots/bijou';

/**
 * Parameters passed to the shader function.
 */
export interface ShaderParams {
  /** Normalized horizontal coordinate (0.0 to 1.0). */
  u: number;
  /** Normalized vertical coordinate (0.0 to 1.0). */
  v: number;
  /** Animation time value in seconds. */
  time: number;
  /** Custom data bag passed to the shader. */
  uniforms: Record<string, any>;
}

/**
 * Shader function called per "pixel" (cell or sub-pixel).
 * 
 * Returns a Cell defining the character and style. 
 * In high-res modes (Braille/Quad), the character is treated as a boolean 
 * (non-space = on) and styling is taken from the first non-space sub-pixel.
 */
export type ShaderFn = (params: ShaderParams) => Cell | string;

/**
 * Resolution modes for the canvas.
 */
export type CanvasResolution = 'cell' | 'quad' | 'braille';

/**
 * Options for the {@link canvas} renderer.
 */
export interface CanvasOptions {
  /** Animation time value passed to the shader. Default: 0. */
  time?: number;
  /** Plotting resolution. Default: 'cell'. */
  resolution?: CanvasResolution;
  /** Custom data passed to the shader. */
  uniforms?: Record<string, any>;
}

/**
 * Render procedural art using a fragment shader.
 * 
 * @param cols - Grid width in columns.
 * @param rows - Grid height in rows.
 * @param shader - Function called for every pixel/sub-pixel.
 * @param options - Canvas configuration.
 * @returns A Surface containing the rendered art.
 */
export function canvas(
  cols: number,
  rows: number,
  shader: ShaderFn,
  options: CanvasOptions = {}
): Surface {
  const { resolution = 'cell', time = 0, uniforms = {} } = options;
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
  }

  return surface;
}

const _hd = (c: number): number => c >= 97 ? c - 87 : c >= 65 ? c - 55 : c - 48;

function setCellFast(surface: Surface, packed: boolean, x: number, y: number, cell: Cell): void {
  if (packed && cell.fg?.length === 7) {
    const fR = (_hd(cell.fg.charCodeAt(1)) << 4) | _hd(cell.fg.charCodeAt(2));
    const fG = (_hd(cell.fg.charCodeAt(3)) << 4) | _hd(cell.fg.charCodeAt(4));
    const fB = (_hd(cell.fg.charCodeAt(5)) << 4) | _hd(cell.fg.charCodeAt(6));
    let bR = -1, bG = 0, bB = 0;
    if (cell.bg?.length === 7) { bR = (_hd(cell.bg.charCodeAt(1)) << 4) | _hd(cell.bg.charCodeAt(2)); bG = (_hd(cell.bg.charCodeAt(3)) << 4) | _hd(cell.bg.charCodeAt(4)); bB = (_hd(cell.bg.charCodeAt(5)) << 4) | _hd(cell.bg.charCodeAt(6)); }
    (surface as PackedSurface).setRGB(x, y, cell.char, fR, fG, fB, bR, bG, bB);
  } else {
    surface.set(x, y, cell);
  }
}

function renderCellResolution(surface: Surface, shader: ShaderFn, time: number, uniforms: Record<string, any>) {
  const { width, height } = surface;
  const packed: boolean = 'buffer' in surface;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const result = shader({
        u: x / (width - 1 || 1),
        v: y / (height - 1 || 1),
        time,
        uniforms
      });
      const cell = typeof result === 'string' ? { char: result } : result;
      setCellFast(surface, packed, x, y, cell);
    }
  }
}

function renderQuadResolution(surface: Surface, shader: ShaderFn, time: number, uniforms: Record<string, any>) {
  const { width, height } = surface;
  const packed: boolean = 'buffer' in surface;
  const subW = width * 2;
  const subH = height * 2;

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

      for (let sy = 0; sy < 2; sy++) {
        for (let sx = 0; sx < 2; sx++) {
          const px = x * 2 + sx;
          const py = y * 2 + sy;
          const result = shader({
            u: px / (subW - 1 || 1),
            v: py / (subH - 1 || 1),
            time,
            uniforms
          });
          const cell = typeof result === 'string' ? { char: result } : result;
          
          if (cell.char !== ' ') {
            mask |= (1 << (sy * 2 + sx));
            if (!firstStyledCell) firstStyledCell = cell;
          }
        }
      }

      setCellFast(surface, packed, x, y, {
        ...(firstStyledCell || { char: ' ' }),
        char: QUAD_CHARS[mask] || ' '
      });
    }
  }
}

function renderBrailleResolution(surface: Surface, shader: ShaderFn, time: number, uniforms: Record<string, any>) {
  const { width, height } = surface;
  const packed: boolean = 'buffer' in surface;
  const subW = width * 2;
  const subH = height * 4;

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

      for (let sy = 0; sy < 4; sy++) {
        for (let sx = 0; sx < 2; sx++) {
          const px = x * 2 + sx;
          const py = y * 4 + sy;
          const result = shader({
            u: px / (subW - 1 || 1),
            v: py / (subH - 1 || 1),
            time,
            uniforms
          });
          const cell = typeof result === 'string' ? { char: result } : result;
          
          if (cell.char !== ' ') {
            code |= DOT_MAP[sy]![sx]!;
            if (!firstStyledCell) firstStyledCell = cell;
          }
        }
      }

      setCellFast(surface, packed, x, y, {
        ...(firstStyledCell || { char: ' ' }),
        char: String.fromCharCode(0x2800 + code)
      });
    }
  }
}
