import { createSurface, type Surface, type Cell, type LayoutNode } from '../../ports/surface.js';
import type { WritePort, StylePort } from '../../ports/index.js';
import { graphemeClusterWidth, stripAnsi, segmentGraphemes } from '../text/index.js';

const EMPTY_CELL: Cell = { char: ' ', empty: true };
const EMPTY_MODIFIERS: readonly string[] = [];

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
  const lines = text.split(/\r?\n/);

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
  surface.set(x, y, { char, ...style, empty: false });

  for (let offset = 1; offset < width && x + offset < surface.width; offset++) {
    surface.set(x + offset, y, { char: '', ...style, empty: false });
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

      // If we are not at the expected cursor position, move it
      if (x !== cursorX || y !== cursorY) {
        output += moveCursor(x, y);
      }

      // Find how many contiguous cells have the SAME style as this one
      // and also NEED to be updated.
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

      // Render the batch
      if (hasVisibleStyle(targetCell)) {
        token.hex = targetCell.fg;
        token.bg = targetCell.bg;
        token.modifiers = targetCell.modifiers as any;
        output += style.styled(token as any, batchText);
      } else {
        output += batchText;
      }

      // Advance our internal cursor tracking
      const batchWidth = batchX - x;
      cursorX = x + batchWidth;
      cursorY = y;
      
      // Advance loop index
      x = batchX;

    }
  }

  if (output.length > 0) {
    io.write(output);
  }
}
