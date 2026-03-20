import { parseAnsiToSurface, stripAnsi, type Surface } from '@flyingrobots/bijou';

/**
 * Explicit string-to-surface bridge for runtime views that still compose
 * styled text before crossing a pure V4 shell boundary.
 */
export function ansiContentSurface(text: string): Surface {
  const lines = text.split(/\r?\n/);
  const width = Math.max(1, ...lines.map((line) => stripAnsi(line).length));
  const height = Math.max(1, lines.length);
  return parseAnsiToSurface(text, width, height);
}
