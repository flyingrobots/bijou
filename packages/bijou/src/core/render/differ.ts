import { createSurface, type Surface, type PackedSurface, type Cell, type LayoutNode } from '../../ports/surface.js';
import type { WritePort, StylePort } from '../../ports/index.js';
import { ANSI_OSC8_RE, graphemeClusterWidth, stripAnsi, segmentGraphemes } from '../text/index.js';
import {
  CELL_STRIDE,
  OFF_FG_R,
  FLAG_FG_SET, FLAG_BG_SET, FLAG_EMPTY,
  decodeChar,
} from './packed-cell.js';

const EMPTY_CELL: Cell = { char: ' ', empty: true };
const EMPTY_MODIFIERS: readonly string[] = [];

function isPackedSurface(s: Surface): s is PackedSurface {
  return 'buffer' in s && s.buffer instanceof Uint8Array;
}

function hasVisibleStyle(cell: Cell): boolean {
  return cell.fg !== undefined
    || cell.bg !== undefined
    || (cell.modifiers?.length ?? 0) > 0;
}

/**
 * Convert a multi-line string into a Surface.
 *
 * This is a plain-text bridge. It strips ANSI and treats all characters
 * as the default style.
 */
export function stringToSurface(text: string, width: number, height: number): Surface {
  const surface = createSurface(width, height);
  const plainText = stripAnsi(text);
  const lines = plainText.split(/\r?\n/);

  for (let y = 0; y < Math.min(height, lines.length); y++) {
    const line = lines[y]!;
    const gs = segmentGraphemes(line);
    let x = 0;
    for (const char of gs) {
      if (x >= width) break;
      x += writeSurfaceGrapheme(surface, x, y, char);
    }
  }

  return surface;
}

/**
 * Robust ANSI-aware string to Surface conversion.
 */
export function parseAnsiToSurface(text: string, width: number, height: number): Surface {
  const surface = createSurface(width, height);
  const lines = text.replace(ANSI_OSC8_RE, '').split(/\r?\n/);

  const ANSI_RE = /\x1b\[([0-9;]*)m/g;

  for (let y = 0; y < Math.min(height, lines.length); y++) {
    const line = lines[y]!;
    let x = 0;
    
    let currentFg: string | undefined;
    let currentBg: string | undefined;
    let currentMods = new Set<string>();

    const matches = Array.from(line.matchAll(ANSI_RE));
    let lastIndex = 0;

    for (const match of matches) {
      const matchIndex = match.index!;
      const part = line.slice(lastIndex, matchIndex);
      const gs = segmentGraphemes(part);
      for (const char of gs) {
        if (x >= width) break;
        x += writeSurfaceGrapheme(surface, x, y, char, {
          fg: currentFg,
          bg: currentBg,
          modifiers: Array.from(currentMods),
        });
      }

      const codeStr = match[1]!;
      if (codeStr === '0' || codeStr === '') {
        currentFg = undefined;
        currentBg = undefined;
        currentMods.clear();
      } else {
        const parts = codeStr.split(';');
        let i = 0;
        while (i < parts.length) {
          const code = parts[i]!;
          if (code === '1') currentMods.add('bold');
          else if (code === '2') currentMods.add('dim');
          else if (code === '3') currentMods.add('italic');
          else if (code === '4') currentMods.add('underline');
          else if (code === '7') currentMods.add('inverse');
          else if (code === '9') currentMods.add('strike');
          else if (code === '22') { currentMods.delete('bold'); currentMods.delete('dim'); }
          else if (code === '23') currentMods.delete('italic');
          else if (code === '24') currentMods.delete('underline');
          else if (code === '27') currentMods.delete('inverse');
          else if (code === '29') currentMods.delete('strike');
          else if (code === '38' && parts[i+1] === '2') {
            // Truecolor FG: 38;2;R;G;B
            const r = parseInt(parts[i+2]!, 10).toString(16).padStart(2, '0');
            const g = parseInt(parts[i+3]!, 10).toString(16).padStart(2, '0');
            const b = parseInt(parts[i+4]!, 10).toString(16).padStart(2, '0');
            currentFg = '#' + r + g + b;
            i += 4;
          } else if (code === '48' && parts[i+1] === '2') {
            // Truecolor BG: 48;2;R;G;B
            const r = parseInt(parts[i+2]!, 10).toString(16).padStart(2, '0');
            const g = parseInt(parts[i+3]!, 10).toString(16).padStart(2, '0');
            const b = parseInt(parts[i+4]!, 10).toString(16).padStart(2, '0');
            currentBg = '#' + r + g + b;
            i += 4;
          }
          i++;
        }
      }
      
      lastIndex = matchIndex + match[0].length;
    }

    const remaining = line.slice(lastIndex);
    const gs = segmentGraphemes(remaining);
    for (const char of gs) {
      if (x >= width) break;
      x += writeSurfaceGrapheme(surface, x, y, char, {
        fg: currentFg,
        bg: currentBg,
        modifiers: Array.from(currentMods),
      });
    }
  }
  return surface;
}

function writeSurfaceGrapheme(
  surface: Surface,
  x: number,
  y: number,
  char: string,
  style?: Pick<Cell, 'fg' | 'bg' | 'modifiers'>,
): number {
  if (x >= surface.width) return 0;

  const width = Math.max(1, graphemeClusterWidth(char));

  if (isPackedSurface(surface) && style?.fg) {
    const hd = (c: number): number => c >= 97 ? c - 87 : c >= 65 ? c - 55 : c - 48;
    const fR = (hd(style.fg.charCodeAt(1)) << 4) | hd(style.fg.charCodeAt(2));
    const fG = (hd(style.fg.charCodeAt(3)) << 4) | hd(style.fg.charCodeAt(4));
    const fB = (hd(style.fg.charCodeAt(5)) << 4) | hd(style.fg.charCodeAt(6));
    let bR = -1, bG = 0, bB = 0;
    if (style.bg?.length === 7) { bR = (hd(style.bg.charCodeAt(1)) << 4) | hd(style.bg.charCodeAt(2)); bG = (hd(style.bg.charCodeAt(3)) << 4) | hd(style.bg.charCodeAt(4)); bB = (hd(style.bg.charCodeAt(5)) << 4) | hd(style.bg.charCodeAt(6)); }
    surface.setRGB(x, y, char, fR, fG, fB, bR, bG, bB);
    for (let offset = 1; offset < width && x + offset < surface.width; offset++) {
      surface.setRGB(x + offset, y, '', fR, fG, fB, bR, bG, bB);
    }
  } else {
    surface.set(x, y, { char, ...style, empty: false });
    for (let offset = 1; offset < width && x + offset < surface.width; offset++) {
      surface.set(x + offset, y, { char: '', ...style, empty: false });
    }
  }

  return width;
}

/**
 * Convert a Surface into a multi-line string with ANSI escape codes.
 *
 * This is an explicit bridge for string-first APIs and terminal writes.
 *
 * @param surface - The surface to convert.
 * @param style - The style port to use for color resolution.
 * @returns A string representation of the surface.
 */
export function surfaceToString(surface: Surface, style: StylePort): string {
  const lines: string[] = [];
  for (let y = 0; y < surface.height; y++) {
    let line = '';
    for (let x = 0; x < surface.width; x++) {
      const cell = surface.get(x, y);
      const token = {
        hex: cell.fg,
        bg: cell.bg,
        modifiers: cell.modifiers as any,
      };
      line += style.styled(token as any, cell.char);
    }
    lines.push(line);
  }
  return lines.join('\n');
}

/**
 * Paint a LayoutNode tree onto a Surface.
 * 
 * @param target - The surface to paint onto.
 * @param node - The root layout node to paint.
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
  if (a === b) return true;
  if (a.char !== b.char) return false;
  if (a.fg !== b.fg) return false;
  if (a.bg !== b.bg) return false;
  if (a.empty !== b.empty) return false;
  
  const aMods = a.modifiers ?? [];
  const bMods = b.modifiers ?? [];
  if (aMods === bMods) return true;
  if (aMods.length !== bMods.length) return false;
  for (let i = 0; i < aMods.length; i++) {
    if (aMods[i] !== bMods[i]) return false;
  }
  
  return true;
}

/**
 * Move the terminal cursor to (x, y) using CUP (Cursor Position) escape code.
 * Coordinates are 0-based in Bijou, but 1-based in ANSI.
 */
function moveCursor(x: number, y: number): string {
  return `\x1b[${y + 1};${x + 1}H`;
}

/**
 * Diff two surfaces and write the minimal set of changes to the WritePort.
 * 
 * Optimizations:
 * 1. Skips identical cells.
 * 2. Minimizes CUP (move cursor) commands by detecting contiguous changes.
 * 3. Batches cells with identical styles to minimize SGR codes and keep strings contiguous.
 * 
 * @param current - The surface currently on the terminal.
 * @param target  - The desired surface state.
 * @param io      - The port to write ANSI codes to.
 * @param style   - The port to resolve cell styling.
 */
export function renderDiff(
  current: Surface,
  target: Surface,
  io: WritePort,
  style: StylePort,
): void {
  // Use packed byte path when both surfaces have buffers
  if (isPackedSurface(target) && isPackedSurface(current)) {
    renderDiffPacked(current, target, io, style);
    return;
  }
  renderDiffCells(current, target, io, style);
}

// ── Packed byte-comparison differ ───────────────────────

/** Empty cell encoded as packed bytes for boundary comparison. */
const EMPTY_PACKED = new Uint8Array(CELL_STRIDE);
EMPTY_PACKED[0] = 0x20; // space
EMPTY_PACKED[8] = FLAG_EMPTY; // flags: empty
EMPTY_PACKED[9] = 63; // opacity: 1.0, no fg, no bg

function packedBytesEqual(
  a: Uint8Array, aOff: number,
  b: Uint8Array, bOff: number,
): boolean {
  for (let i = 0; i < CELL_STRIDE; i++) {
    if (a[aOff + i] !== b[bOff + i]) return false;
  }
  return true;
}

function packedStyleBytesEqual(
  a: Uint8Array, aOff: number,
  b: Uint8Array, bOff: number,
): boolean {
  // Compare from OFF_FG_R through end (fg, bg, flags, alpha) — skip char
  for (let i = OFF_FG_R; i < CELL_STRIDE; i++) {
    if (a[aOff + i] !== b[bOff + i]) return false;
  }
  return true;
}

function readCharFromBuf(buf: Uint8Array, off: number, sideTable: readonly string[]): string {
  const code = buf[off]! | (buf[off + 1]! << 8);
  return decodeChar(code, sideTable);
}

function packedHasVisibleStyle(buf: Uint8Array, off: number): boolean {
  const alpha = buf[off + 9]!;
  return (alpha & (FLAG_FG_SET | FLAG_BG_SET)) !== 0
    || (buf[off + 8]! & ~FLAG_EMPTY) !== 0;
}

// --- Direct ANSI SGR emission from packed bytes ---

// Modifier flag → SGR code mapping
const FLAG_SGR: [number, string][] = [
  [0x01, '\x1b[1m'],  // bold
  [0x02, '\x1b[2m'],  // dim
  [0x04, '\x1b[9m'],  // strikethrough
  [0x08, '\x1b[7m'],  // inverse
];
// Underline styles (bits 4-5 of flags byte)
const UNDERLINE_SGR: string[] = [
  '',              // 00 = none
  '\x1b[4m',      // 01 = solid underline
  '\x1b[4:3m',    // 10 = curly underline
  '\x1b[4:4m',    // 11 = dotted (without FLAG_DASHED)
];
const DASHED_SGR = '\x1b[4:5m';
const RESET_SGR = '\x1b[0m';

// SGR cache: maps style bytes (8 bytes from OFF_FG_R through OFF_ALPHA) to pre-built SGR prefix.
const sgrCache = new Map<number, string>();

/** Pack 8 style bytes into two 32-bit numbers for cache key. */
function styleCacheKey(buf: Uint8Array, off: number): number {
  // Use only the style-relevant bytes: fg(3) + bg(3) + flags(1) + alpha(1) = 8 bytes
  // Pack into a single 64-bit-safe integer via two 32-bit halves XORed together
  const a = (buf[off + OFF_FG_R]! << 24) | (buf[off + OFF_FG_R + 1]! << 16)
          | (buf[off + OFF_FG_R + 2]! << 8) | buf[off + 5]!;
  const b = (buf[off + 6]! << 24) | (buf[off + 7]! << 16)
          | (buf[off + 8]! << 8) | buf[off + 9]!;
  // Combine into a single number — may collide for >2^32 unique styles
  // but themes have ~50 unique token values, so collisions are negligible
  return (a * 2654435761) ^ b;
}

function buildSgr(buf: Uint8Array, off: number): string {
  let sgr = RESET_SGR;
  const flags = buf[off + 8]!;
  const alpha = buf[off + 9]!;

  if (alpha & FLAG_FG_SET) {
    sgr += `\x1b[38;2;${buf[off + OFF_FG_R]};${buf[off + OFF_FG_R + 1]};${buf[off + OFF_FG_R + 2]}m`;
  }
  if (alpha & FLAG_BG_SET) {
    sgr += `\x1b[48;2;${buf[off + 5]};${buf[off + 6]};${buf[off + 7]}m`;
  }
  for (const [flag, code] of FLAG_SGR) {
    if (flags & flag) sgr += code;
  }
  const uStyle = (flags >> 4) & 0x03;
  if (uStyle > 0) {
    sgr += (uStyle === 3 && (flags & 0x40)) ? DASHED_SGR : UNDERLINE_SGR[uStyle]!;
  }
  return sgr;
}

/**
 * Emit cached ANSI SGR escape sequences from packed buffer bytes.
 * Caches compiled SGR strings keyed on style bytes — themes have
 * a finite vocabulary of ~50 unique styles, so the cache saturates
 * quickly and subsequent calls are a Map.get() + hash.
 */
function emitSgrFromBuf(buf: Uint8Array, off: number): string {
  const key = styleCacheKey(buf, off);
  let sgr = sgrCache.get(key);
  if (sgr === undefined) {
    sgr = buildSgr(buf, off);
    sgrCache.set(key, sgr);
  }
  return sgr;
}

function renderDiffPacked(
  current: PackedSurface,
  target: PackedSurface,
  io: WritePort,
  _style: StylePort,
): void {
  const width = target.width;
  const height = target.height;
  const tBuf = target.buffer;
  const cBuf = current.buffer;
  const cWidth = current.width;
  const cHeight = current.height;
  const tSide = target.sideTable;

  let output = '';
  let cursorX = -1;
  let cursorY = -1;

  for (let y = 0; y < height; y++) {
    let x = 0;
    while (x < width) {
      const tIdx = y * width + x;
      const tOff = tIdx * CELL_STRIDE;

      const inBounds = y < cHeight && x < cWidth;
      const cOff = inBounds ? (y * cWidth + x) * CELL_STRIDE : -1;

      const same = inBounds
        ? packedBytesEqual(tBuf, tOff, cBuf, cOff)
        : packedBytesEqual(tBuf, tOff, EMPTY_PACKED, 0);

      if (same) {
        x++;
        continue;
      }

      if (x !== cursorX || y !== cursorY) {
        output += moveCursor(x, y);
      }

      let batchX = x;
      let batchText = '';
      while (batchX < width) {
        const bIdx = y * width + batchX;
        const bOff = bIdx * CELL_STRIDE;

        // Style check: does this cell match the batch leader's style?
        if (batchX > x && !packedStyleBytesEqual(tBuf, tOff, tBuf, bOff)) {
          break;
        }

        // Cell changed check
        const bInBounds = y < cHeight && batchX < cWidth;
        const bcOff = bInBounds ? (y * cWidth + batchX) * CELL_STRIDE : -1;
        const cellsMatch = bInBounds
          ? packedBytesEqual(tBuf, bOff, cBuf, bcOff)
          : packedBytesEqual(tBuf, bOff, EMPTY_PACKED, 0);

        if (cellsMatch) break;

        batchText += readCharFromBuf(tBuf, bOff, tSide);
        batchX++;
      }

      // Emit styled batch — direct ANSI from packed bytes, bypasses StylePort
      if (packedHasVisibleStyle(tBuf, tOff)) {
        output += emitSgrFromBuf(tBuf, tOff) + batchText + RESET_SGR;
      } else {
        output += batchText;
      }

      cursorX = batchX;
      cursorY = y;
      x = batchX;
    }
  }

  if (output.length > 0) {
    io.write(output);
  }
}

// ── Legacy cell-based differ (fallback) ─────────────────

function renderDiffCells(
  current: Surface,
  target: Surface,
  io: WritePort,
  style: StylePort,
): void {
  const width = target.width;
  const height = target.height;
  const targetCells = target.cells;
  const currentCells = current.cells;
  const currentWidth = current.width;
  const currentHeight = current.height;

  let output = '';
  let cursorX = -1;
  let cursorY = -1;
  const token: { hex?: string; bg?: string; modifiers?: Cell['modifiers'] } = {};

  for (let y = 0; y < height; y++) {
    const targetRowOffset = y * width;
    const currentRowOffset = y * currentWidth;
    let x = 0;
    while (x < width) {
      const targetCell = targetCells[targetRowOffset + x]!;
      const currentCell = y < currentHeight && x < currentWidth
        ? currentCells[currentRowOffset + x]!
        : EMPTY_CELL;

      const targetMods = targetCell.modifiers ?? EMPTY_MODIFIERS;
      const currentMods = currentCell.modifiers ?? EMPTY_MODIFIERS;
      let sameCell = targetCell === currentCell
        || (
          targetCell.char === currentCell.char
          && targetCell.fg === currentCell.fg
          && targetCell.bg === currentCell.bg
          && targetCell.empty === currentCell.empty
          && targetMods.length === currentMods.length
        );
      if (sameCell && targetCell !== currentCell && targetMods !== currentMods) {
        for (let i = 0; i < targetMods.length; i++) {
          if (targetMods[i] !== currentMods[i]) {
            sameCell = false;
            break;
          }
        }
      }

      if (sameCell) {
        x++;
        continue;
      }

      if (x !== cursorX || y !== cursorY) {
        output += moveCursor(x, y);
      }

      let batchX = x;
      let batchText = '';
      const batchStyleMods = targetMods;
      while (batchX < width) {
        const c = targetCells[targetRowOffset + batchX]!;
        const curr = y < currentHeight && batchX < currentWidth
          ? currentCells[currentRowOffset + batchX]!
          : EMPTY_CELL;

        if (batchX > x) {
          const cellMods = c.modifiers ?? EMPTY_MODIFIERS;
          let sameStyle = c === targetCell
            || (
              c.fg === targetCell.fg
              && c.bg === targetCell.bg
              && cellMods.length === batchStyleMods.length
            );
          if (sameStyle && c !== targetCell && cellMods !== batchStyleMods) {
            for (let i = 0; i < cellMods.length; i++) {
              if (cellMods[i] !== batchStyleMods[i]) {
                sameStyle = false;
                break;
              }
            }
          }
          if (!sameStyle) break;
        }

        const cellMods = c.modifiers ?? EMPTY_MODIFIERS;
        const currMods = curr.modifiers ?? EMPTY_MODIFIERS;
        let cellsMatch = c === curr
          || (
            c.char === curr.char
            && c.fg === curr.fg
            && c.bg === curr.bg
            && c.empty === curr.empty
            && cellMods.length === currMods.length
          );
        if (cellsMatch && c !== curr && cellMods !== currMods) {
          for (let i = 0; i < cellMods.length; i++) {
            if (cellMods[i] !== currMods[i]) {
              cellsMatch = false;
              break;
            }
          }
        }
        if (cellsMatch) break;

        batchText += c.char;
        batchX++;
      }

      if (hasVisibleStyle(targetCell)) {
        token.hex = targetCell.fg;
        token.bg = targetCell.bg;
        token.modifiers = targetCell.modifiers as any;
        output += style.styled(token as any, batchText);
      } else {
        output += batchText;
      }

      const batchWidth = batchX - x;
      cursorX = x + batchWidth;
      cursorY = y;
      x = batchX;
    }
  }

  if (output.length > 0) {
    io.write(output);
  }
}
