import {
  createSurface,
  isPackedSurface,
  type Cell,
  type Surface,
} from '../../ports/surface.js';
import type { StylePort } from '../../ports/index.js';
import { colorRgb } from '../theme/color.js';
import {
  graphemeClusterWidth,
  sanitizeTerminalText,
  segmentGraphemes,
} from '../text/index.js';
import { cellToken } from './safe-read.js';
import { hasVisibleStyle } from './differ-cell.js';

export function stringToSurface(
  text: string,
  width: number,
  height: number,
): Surface {
  const surface = createSurface(width, height);
  const lines = sanitizeTerminalText(text).split('\n');
  for (let y = 0; y < Math.min(height, lines.length); y++) {
    let x = 0;
    for (const char of segmentGraphemes(lines[y] ?? '')) {
      if (x >= width) break;
      x += writeSurfaceGrapheme(surface, x, y, char);
    }
  }
  return surface;
}

export function surfaceToString(surface: Surface, style: StylePort): string {
  const lines: string[] = [];
  for (let y = 0; y < surface.height; y++) {
    let line = '';
    for (let x = 0; x < surface.width; x++) {
      const cell = surface.get(x, y);
      line += hasVisibleStyle(cell)
        ? style.styled(cellToken(cell), cell.char)
        : cell.char;
    }
    lines.push(line);
  }
  return lines.join('\n');
}

export function writeSurfaceGrapheme(
  surface: Surface,
  x: number,
  y: number,
  char: string,
  style?: Pick<Cell, 'fg' | 'bg' | 'modifiers'>,
): number {
  if (x >= surface.width) return 0;
  const width = Math.max(1, graphemeClusterWidth(char));
  if (isPackedSurface(surface) && (style?.fg || style?.bg)) {
    const fg = colorRgb(style.fg);
    let fgR = -1;
    let fgG = 0;
    let fgB = 0;
    if (fg) [fgR, fgG, fgB] = fg;
    const bg = colorRgb(style.bg);
    let bgR = -1;
    let bgG = 0;
    let bgB = 0;
    if (bg) [bgR, bgG, bgB] = bg;
    surface.setRGB(x, y, char, fgR, fgG, fgB, bgR, bgG, bgB);
    for (let offset = 1; offset < width && x + offset < surface.width; offset++) {
      surface.setRGB(x + offset, y, '', fgR, fgG, fgB, bgR, bgG, bgB);
    }
  } else {
    surface.set(x, y, { char, ...style, empty: false });
    for (let offset = 1; offset < width && x + offset < surface.width; offset++) {
      surface.set(x + offset, y, { char: '', ...style, empty: false });
    }
  }
  return width;
}
