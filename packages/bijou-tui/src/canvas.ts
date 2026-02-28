/**
 * Shader-based canvas primitive for procedural character art.
 *
 * Calls a user-provided shader function for every cell in a grid,
 * producing a string of exactly `rows` lines, each `cols` characters wide.
 */

import type { BijouContext } from '@flyingrobots/bijou';
import { getDefaultContext } from '@flyingrobots/bijou';

/**
 * Shader function called once per cell.
 *
 * @param x    Column index (0-based).
 * @param y    Row index (0-based).
 * @param cols Total number of columns.
 * @param rows Total number of rows.
 * @param time Animation time value.
 * @returns    A single character (or string — only the first char is used).
 */
export type ShaderFn = (
  x: number,
  y: number,
  cols: number,
  rows: number,
  time: number,
) => string;

export interface CanvasOptions {
  /** Animation time value passed to the shader. Default: 0. */
  time?: number;
  /** Bijou context for mode detection. */
  ctx?: BijouContext;
}

/**
 * Render a character grid by calling `shader(x, y, cols, rows, time)` for
 * every cell. Returns a string of exactly `rows` lines, each `cols` chars wide.
 *
 * In pipe or accessible mode, returns empty string (no visual noise).
 * Returns empty string when cols or rows are ≤ 0.
 */
export function canvas(
  cols: number,
  rows: number,
  shader: ShaderFn,
  options?: CanvasOptions,
): string {
  if (cols <= 0 || rows <= 0) return '';

  const ctx = options?.ctx ?? getDefaultContext();
  if (ctx.mode === 'pipe' || ctx.mode === 'accessible') return '';

  const time = options?.time ?? 0;
  const lines: string[] = [];

  for (let y = 0; y < rows; y++) {
    let line = '';
    for (let x = 0; x < cols; x++) {
      const ch = shader(x, y, cols, rows, time);
      // Take first character, or space if empty
      line += ch.length > 0 ? ch[0]! : ' ';
    }
    lines.push(line);
  }

  return lines.join('\n');
}
