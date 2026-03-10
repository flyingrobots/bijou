import { createSurface, type Surface, type Cell, type LayoutNode } from '../../ports/surface.js';
import type { WritePort, StylePort } from '../../ports/index.js';
import type { TokenValue } from '../theme/tokens.js';
import { segmentGraphemes } from '../text/index.js';

/**
 * Convert a multi-line string into a Surface.
 */
export function stringToSurface(text: string, width: number, height: number): Surface {
  return parseAnsiToSurface(text, width, height);
}

/**
 * Robust ANSI-aware string to Surface conversion.
 */
export function parseAnsiToSurface(text: string, width: number, height: number): Surface {
  const surface = createSurface(width, height);
  const lines = text.split(/\r?\n/);

  const ANSI_RE = /\x1b\[([0-9;]*)m/g;

  for (let y = 0; y < Math.min(height, lines.length); y++) {
    const line = lines[y]!;
    let x = 0;
    
    let currentFg: string | undefined;
    let currentBg: string | undefined;
    let currentMods: any[] = [];

    // Find all matches and their indices
    const matches = Array.from(line.matchAll(ANSI_RE));
    let lastIndex = 0;

    for (const match of matches) {
      const matchIndex = match.index!;
      // Content before this escape sequence
      const part = line.slice(lastIndex, matchIndex);
      const gs = segmentGraphemes(part);
      for (const char of gs) {
        if (x < width) {
          surface.set(x, y, { char, fg: currentFg, bg: currentBg, modifiers: currentMods });
          x++;
        }
      }

      // Update state based on ANSI code
      const code = match[1]!;
      if (code === '0' || code === '') {
        currentFg = undefined;
        currentBg = undefined;
        currentMods = [];
      } else if (code.startsWith('38;2;')) {
        const parts = code.split(';');
        const r = parseInt(parts[2]!, 10).toString(16).padStart(2, '0');
        const g = parseInt(parts[3]!, 10).toString(16).padStart(2, '0');
        const b = parseInt(parts[4]!, 10).toString(16).padStart(2, '0');
        currentFg = '#' + r + g + b;
      } else if (code.startsWith('48;2;')) {
        const parts = code.split(';');
        const r = parseInt(parts[2]!, 10).toString(16).padStart(2, '0');
        const g = parseInt(parts[3]!, 10).toString(16).padStart(2, '0');
        const b = parseInt(parts[4]!, 10).toString(16).padStart(2, '0');
        currentBg = '#' + r + g + b;
      }
      
      lastIndex = matchIndex + match[0].length;
    }

    // Remaining content
    const remaining = line.slice(lastIndex);
    const gs = segmentGraphemes(remaining);
    for (const char of gs) {
      if (x < width) {
        surface.set(x, y, { char, fg: currentFg, bg: currentBg, modifiers: currentMods });
        x++;
      }
    }
  }
  return surface;
}

/**
 * Convert a Surface into a multi-line string with ANSI escape codes.
 */
export function surfaceToString(surface: Surface, style: StylePort): string {
  const lines: string[] = [];
  for (let y = 0; y < surface.height; y++) {
    let line = '';
    for (let x = 0; x < surface.width; x++) {
      const cell = surface.get(x, y);
      const token: TokenValue = {
        hex: cell.fg ?? '#ffffff',
        bg: cell.bg,
        modifiers: cell.modifiers as any,
      };
      line += style.styled(token, cell.char);
    }
    lines.push(line);
  }
  return lines.join('\n');
}

/**
 * Paint a LayoutNode tree onto a Surface.
 */
export function paintLayoutNode(target: Surface, node: LayoutNode): void {
  if (node.surface) {
    target.blit(node.surface, node.rect.x, node.rect.y);
  }
  for (const child of node.children) {
    paintLayoutNode(target, child);
  }
}

/**
 * Compare two cells for equality (content and style).
 */
export function isSameCell(a: Cell, b: Cell): boolean {
  if (a.char !== b.char) return false;
  if (a.fg !== b.fg) return false;
  if (a.bg !== b.bg) return false;
  if (a.empty !== b.empty) return false;
  const aMods = a.modifiers ?? [];
  const bMods = b.modifiers ?? [];
  if (aMods.length !== bMods.length) return false;
  for (let i = 0; i < aMods.length; i++) {
    if (aMods[i] !== bMods[i]) return false;
  }
  return true;
}

function moveCursor(x: number, y: number): string {
  return `\x1b[${y + 1};${x + 1}H`;
}

export function renderDiff(
  current: Surface,
  target: Surface,
  io: WritePort,
  style: StylePort,
): void {
  const width = target.width;
  const height = target.height;
  let output = '';
  let cursorX = -1;
  let cursorY = -1;

  for (let y = 0; y < height; y++) {
    let x = 0;
    while (x < width) {
      const targetCell = target.get(x, y);
      const currentCell = current.get(x, y);
      if (isSameCell(targetCell, currentCell)) {
        x++;
        continue;
      }
      if (x !== cursorX || y !== cursorY) {
        output += moveCursor(x, y);
      }
      let batchX = x;
      let batchText = '';
      while (batchX < width) {
        const c = target.get(batchX, y);
        const curr = current.get(batchX, y);
        if (batchX > x && !isSameStyle(c, targetCell)) break;
        if (isSameCell(c, curr)) break;
        batchText += c.char;
        batchX++;
      }
      const token: TokenValue = {
        hex: targetCell.fg ?? '#ffffff',
        bg: targetCell.bg,
        modifiers: targetCell.modifiers as any,
      };
      output += style.styled(token, batchText);
      const batchWidth = batchX - x;
      cursorX = x + batchWidth;
      cursorY = y;
      x = batchX;
      if (output.length > 4096) {
        io.write(output);
        output = '';
      }
    }
  }
  if (output.length > 0) io.write(output);
}

function isSameStyle(a: Cell, b: Cell): boolean {
  if (a.fg !== b.fg) return false;
  if (a.bg !== b.bg) return false;
  const aMods = a.modifiers ?? [];
  const bMods = b.modifiers ?? [];
  if (aMods.length !== bMods.length) return false;
  for (let i = 0; i < aMods.length; i++) {
    if (aMods[i] !== bMods[i]) return false;
  }
  return true;
}
