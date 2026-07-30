import { createSurface, type Cell, type Surface } from '../../ports/surface.js';
import {
  ANSI_OSC8_RE,
  sanitizeTerminalText,
  segmentGraphemes,
} from '../text/index.js';
import { sgrByteHex } from './safe-read.js';
import { writeSurfaceGrapheme } from './differ-string.js';

const ANSI_ESCAPE = String.fromCharCode(0x1b);

interface AnsiStyle {
  fg: string | undefined;
  bg: string | undefined;
  readonly modifiers: Set<string>;
}

export function parseAnsiToSurface(
  text: string,
  width: number,
  height: number,
): Surface {
  const surface = createSurface(width, height);
  const safeText = sanitizeTerminalText(text, {
    allowAnsiStyling: true,
    allowHyperlinks: true,
  });
  const lines = safeText.replace(ANSI_OSC8_RE, '').split('\n');
  const ansiPattern = new RegExp(`${ANSI_ESCAPE}\\[([0-9;]*)m`, 'g');
  for (let y = 0; y < Math.min(height, lines.length); y++) {
    const line = lines[y] ?? '';
    const style: AnsiStyle = {
      fg: undefined,
      bg: undefined,
      modifiers: new Set<string>(),
    };
    let x = 0;
    let lastIndex = 0;
    for (const match of line.matchAll(ansiPattern)) {
      x = writeText(
        surface,
        x,
        y,
        width,
        line.slice(lastIndex, match.index),
        style,
      );
      applyAnsiCodes(style, match[1] ?? '');
      lastIndex = match.index + match[0].length;
    }
    writeText(surface, x, y, width, line.slice(lastIndex), style);
  }
  return surface;
}

function writeText(
  surface: Surface,
  startX: number,
  y: number,
  width: number,
  text: string,
  style: AnsiStyle,
): number {
  let x = startX;
  for (const char of segmentGraphemes(text)) {
    if (x >= width) break;
    const cellStyle: Pick<Cell, 'fg' | 'bg' | 'modifiers'> = {
      fg: style.fg,
      bg: style.bg,
      modifiers: [...style.modifiers],
    };
    x += writeSurfaceGrapheme(surface, x, y, char, cellStyle);
  }
  return x;
}

function applyAnsiCodes(style: AnsiStyle, codeText: string): void {
  if (codeText === '0' || codeText === '') {
    resetStyle(style);
    return;
  }
  const parts = codeText.split(';');
  for (let index = 0; index < parts.length; index++) {
    const code = parts[index] ?? '';
    if (code === '0') resetStyle(style);
    else if (code === '1') style.modifiers.add('bold');
    else if (code === '2') style.modifiers.add('dim');
    else if (code === '3') style.modifiers.add('italic');
    else if (code === '4') style.modifiers.add('underline');
    else if (code === '7') style.modifiers.add('inverse');
    else if (code === '9') style.modifiers.add('strike');
    else if (code === '22') {
      style.modifiers.delete('bold');
      style.modifiers.delete('dim');
    } else if (code === '23') style.modifiers.delete('italic');
    else if (code === '24') style.modifiers.delete('underline');
    else if (code === '27') style.modifiers.delete('inverse');
    else if (code === '29') style.modifiers.delete('strike');
    else if (code === '39') style.fg = undefined;
    else if (code === '49') style.bg = undefined;
    else if ((code === '38' || code === '48') && parts[index + 1] === '2') {
      const color =
        `#${sgrByteHex(parts, index + 2)}` +
        `${sgrByteHex(parts, index + 3)}${sgrByteHex(parts, index + 4)}`;
      if (code === '38') style.fg = color;
      else style.bg = color;
      index += 4;
    }
  }
}

function resetStyle(style: AnsiStyle): void {
  style.fg = undefined;
  style.bg = undefined;
  style.modifiers.clear();
}
