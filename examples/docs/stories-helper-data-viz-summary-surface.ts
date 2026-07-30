import { column, line } from './stories-runtime.js';
import type { Surface } from './stories-runtime.js';

export function dataVizSummarySurface(width: number, lines: readonly string[]): Surface {
  return column(lines.map((entry) => line(entry, Math.max(20, width))));
}
