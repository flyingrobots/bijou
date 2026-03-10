import { createSurface, type Surface, type Cell, type LayoutNode } from '../../ports/surface.js';
import type { WritePort, StylePort } from '../../ports/index.js';
import type { TokenValue } from '../theme/tokens.js';
import { stripAnsi } from '../text/index.js';

/**
 * Convert a multi-line string into a Surface.
 * 
 * Note: This is a legacy migration helper. It currently strips ANSI
 * and treats all characters as the default style.
 * 
 * @param text - The string to convert.
 * @param width - Desired width.
 * @param height - Desired height.
 * @returns A new Surface populated with characters from the string.
 */
export function stringToSurface(text: string, width: number, height: number): Surface {
  const surface = createSurface(width, height);
  const plainText = stripAnsi(text);
  const lines = plainText.split('\n');

  for (let y = 0; y < Math.min(height, lines.length); y++) {
    const line = lines[y]!;
    for (let x = 0; x < Math.min(width, line.length); x++) {
      surface.set(x, y, { char: line[x]!, empty: false });
    }
  }

  return surface;
}

/**
 * Convert a Surface into a multi-line string with ANSI escape codes.
 * 
 * Note: This is a legacy migration helper.
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

      // If we are not at the expected cursor position, move it
      if (x !== cursorX || y !== cursorY) {
        output += moveCursor(x, y);
      }

      // Find how many contiguous cells have the SAME style as this one
      // and also NEED to be updated.
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

      // Render the batch
      const token: TokenValue = {
        hex: targetCell.fg ?? '#ffffff',
        bg: targetCell.bg,
        modifiers: targetCell.modifiers as any,
      };

      output += style.styled(token, batchText);

      // Advance our internal cursor tracking
      const batchWidth = batchX - x;
      cursorX = x + batchWidth;
      cursorY = y;
      
      // Advance loop index
      x = batchX;

      // Flush if the buffer is getting large
      if (output.length > 4096) {
        io.write(output);
        output = '';
      }
    }
  }

  if (output.length > 0) {
    io.write(output);
  }
}

/**
 * Compare two cells for style equality only.
 */
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
