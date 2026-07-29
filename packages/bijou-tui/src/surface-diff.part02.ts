import { createSurface, type Cell, type Surface } from '@flyingrobots/bijou';
import {
  type SurfaceDiff,
  type SurfaceDiffCellKind,
  type SurfaceDiffRenderOptions,
} from './surface-diff.part01.js';
import { cellAt, diffSurfaces } from './surface-diff-engine.js';
import {
  bounds,
  glyph,
  quoteChar,
  styleLabel,
  summary,
  surfaceRow,
  xy,
} from './surface-diff.part03.js';

export function surfaceDiffText(
  before: Surface,
  after: Surface,
  options: SurfaceDiffRenderOptions = {},
): string {
  const diff = diffSurfaces(before, after);
  const lines = [
    summary(diff),
    bounds(diff),
    `mode: ${options.mode ?? 'side-by-side'}`,
  ];

  for (const cell of diff.cells) {
    if (cell.kind === 'char') {
      lines.push(
        `(${xy(cell.x, cell.y)}) char ${quoteChar(cell.before)} -> ${quoteChar(cell.after)}`,
      );
    } else {
      lines.push(
        `(${xy(cell.x, cell.y)}) style ${styleLabel(cell.before)} -> ${styleLabel(cell.after)}`,
      );
    }
  }

  return lines.join('\n');
}
export function sideBySideLines(
  diff: SurfaceDiff,
  before: Surface,
  after: Surface,
): readonly string[] {
  const beforeWidth = Math.max(6, before.width);
  const afterWidth = Math.max(5, after.width);
  const lines = [
    summary(diff),
    bounds(diff),
    `${'before'.padEnd(beforeWidth)} | ${'after'.padEnd(afterWidth)}`,
  ];

  for (let y = 0; y < diff.height; y++) {
    lines.push(
      `${surfaceRow(before, y, beforeWidth).trimEnd()} | ${surfaceRow(after, y, afterWidth).trimEnd()}`,
    );
  }

  return lines;
}
export function overlayLines(
  diff: SurfaceDiff,
  after: Surface,
): readonly string[] {
  const overlayWidth = Math.max(1, diff.width);
  const lines = [summary(diff), bounds(diff), 'overlay'];
  const changed = new Map(diff.cells.map((c) => [xy(c.x, c.y), c.kind]));

  for (let y = 0; y < diff.height; y++) {
    let row = '';
    let markers = '';
    for (let x = 0; x < overlayWidth; x++) {
      row += glyph(cellAt(after, x, y));
      const kind = changed.get(xy(x, y));
      markers += kind === 'char' ? '!' : kind === 'style' ? '~' : '.';
    }
    lines.push(row, markers);
  }

  return lines;
}
export function linesToSurface(
  lines: readonly string[],
  diff: SurfaceDiff,
): Surface {
  const width = Math.max(1, ...lines.map((line) => line.length));
  const surface = createSurface(width, lines.length);
  const changed = new Map(diff.cells.map((c) => [xy(c.x, c.y), c.kind]));
  const overlayStart = lines.indexOf('overlay') + 1;

  for (let y = 0; y < lines.length; y++) {
    const line = lines[y] ?? '';
    for (let x = 0; x < line.length; x++) {
      const style =
        overlayStart > 0 && y >= overlayStart && (y - overlayStart) % 2 === 0
          ? markerStyle(changed.get(xy(x, Math.floor((y - overlayStart) / 2))))
          : {};
      surface.set(x, y, { char: line[x] ?? ' ', empty: false, ...style });
    }
  }

  return surface;
}
export function markerStyle(
  kind: SurfaceDiffCellKind | undefined,
): Pick<Cell, 'fg' | 'bg'> {
  if (kind === 'char') return { fg: '#111111', bg: '#ffcc00' };
  if (kind === 'style') return { fg: '#111111', bg: '#66ccff' };
  return {};
}
