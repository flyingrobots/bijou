/**
 * Rich shader-based canvas primitive for procedural character art.
 * 
 * Supports high-resolution plotting via Braille and Quad characters,
 * with normalized UV mapping and full color/styling support.
 */

import { createSurface, isPackedSurface, type Surface, type PackedSurface, type Cell } from '@flyingrobots/bijou';
import { parseHex, encodeModifiers } from '@flyingrobots/bijou/perf';

type RGB = readonly [number, number, number];

interface ColorAccumulator {
  r: number;
  g: number;
  b: number;
  count: number;
}

interface StyleAccumulator {
  fg: ColorAccumulator;
  bg: ColorAccumulator;
}

function resolvedColorRgb(ref: unknown): readonly [number, number, number] | undefined {
  return typeof ref === 'object'
    && ref !== null
    && 'kind' in ref
    && (ref as { kind?: unknown }).kind === 'resolved-color'
    && 'rgb' in ref
    ? (ref as { rgb: readonly [number, number, number] }).rgb
    : undefined;
}

function resolvedColorHex(ref: unknown): string | undefined {
  if (typeof ref === 'string') return ref;
  return typeof ref === 'object'
    && ref !== null
    && 'kind' in ref
    && (ref as { kind?: unknown }).kind === 'resolved-color'
    && 'hex' in ref
    ? (ref as { hex: string }).hex
    : undefined;
}

function resolveCellColor(rgb: RGB | undefined, ref: Cell['fg'] | Cell['bg']): RGB | undefined {
  if (rgb !== undefined) return rgb;

  const resolvedRgb = resolvedColorRgb(ref);
  if (resolvedRgb !== undefined) return resolvedRgb;

  const hex = resolvedColorHex(ref);
  return hex === undefined ? undefined : parseHex(hex);
}

function createColorAccumulator(): ColorAccumulator {
  return { r: 0, g: 0, b: 0, count: 0 };
}

function createStyleAccumulator(): StyleAccumulator {
  return {
    fg: createColorAccumulator(),
    bg: createColorAccumulator()
  };
}

function accumulateColor(accumulator: ColorAccumulator, rgb: RGB): void {
  accumulator.r += rgb[0]!;
  accumulator.g += rgb[1]!;
  accumulator.b += rgb[2]!;
  accumulator.count++;
}

function accumulateResolvedColor(accumulator: ColorAccumulator, rgb: RGB | undefined, ref: Cell['fg'] | Cell['bg']): void {
  const resolved = resolveCellColor(rgb, ref);
  if (resolved !== undefined) accumulateColor(accumulator, resolved);
}

function accumulateCellStyle(accumulator: StyleAccumulator, cell: Cell): void {
  accumulateResolvedColor(accumulator.fg, cell.fgRGB, cell.fg);
  accumulateResolvedColor(accumulator.bg, cell.bgRGB, cell.bg);
}

function averagedColor(accumulator: ColorAccumulator): RGB | undefined {
  if (accumulator.count === 0) return undefined;
  return [
    Math.round(accumulator.r / accumulator.count),
    Math.round(accumulator.g / accumulator.count),
    Math.round(accumulator.b / accumulator.count)
  ];
}

function averagedCellStyle(accumulator: StyleAccumulator): Pick<Cell, 'fgRGB' | 'bgRGB'> {
  const style: Pick<Cell, 'fgRGB' | 'bgRGB'> = {};
  const fgRGB = averagedColor(accumulator.fg);
  const bgRGB = averagedColor(accumulator.bg);
  if (fgRGB !== undefined) style.fgRGB = fgRGB;
  if (bgRGB !== undefined) style.bgRGB = bgRGB;
  return style;
}

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
 * (non-space = on) and available foreground/background colors are averaged
 * across sampled sub-pixels.
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

function setCellFast(surface: Surface, packed: boolean, x: number, y: number, cell: Cell): void {
  if (packed && (cell.fgRGB != null || cell.fg != null || cell.bgRGB != null || cell.bg != null)) {
    let fR = -1, fG = 0, fB = 0;
    const fg = resolveCellColor(cell.fgRGB, cell.fg);
    if (fg) { [fR, fG, fB] = fg; }

    let bR = -1, bG = 0, bB = 0;
    const bg = resolveCellColor(cell.bgRGB, cell.bg);
    if (bg) { [bR, bG, bB] = bg; }

    if (fg || bg) {
      (surface as PackedSurface).setRGB(x, y, cell.char, fR, fG, fB, bR, bG, bB, encodeModifiers(cell.modifiers));
      return;
    }
  }
  surface.set(x, y, cell);
}

function renderCellResolution(surface: Surface, shader: ShaderFn, time: number, uniforms: Record<string, any>) {
  const { width, height } = surface;
  const packed = isPackedSurface(surface);
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
  const packed = isPackedSurface(surface);
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
      const styleAccumulator = createStyleAccumulator();

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
          accumulateCellStyle(styleAccumulator, cell);
          
          if (cell.char !== ' ') {
            mask |= (1 << (sy * 2 + sx));
            if (!firstStyledCell) firstStyledCell = cell;
          }
        }
      }

      setCellFast(surface, packed, x, y, {
        ...(firstStyledCell || { char: ' ' }),
        ...averagedCellStyle(styleAccumulator),
        char: QUAD_CHARS[mask] || ' '
      });
    }
  }
}

function renderBrailleResolution(surface: Surface, shader: ShaderFn, time: number, uniforms: Record<string, any>) {
  const { width, height } = surface;
  const packed = isPackedSurface(surface);
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
      const styleAccumulator = createStyleAccumulator();

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
          accumulateCellStyle(styleAccumulator, cell);
          
          if (cell.char !== ' ') {
            code |= DOT_MAP[sy]![sx]!;
            if (!firstStyledCell) firstStyledCell = cell;
          }
        }
      }

      setCellFast(surface, packed, x, y, {
        ...(firstStyledCell || { char: ' ' }),
        ...averagedCellStyle(styleAccumulator),
        char: String.fromCharCode(0x2800 + code)
      });
    }
  }
}
