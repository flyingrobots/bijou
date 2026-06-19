import { createSurface, type Cell, type Surface } from '@flyingrobots/bijou';

export type SurfaceDiffCellKind = 'char' | 'style';
export type SurfaceDiffRenderMode = 'side-by-side' | 'overlay';

export interface SurfaceDiffBounds {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface SurfaceDiffCell {
  readonly x: number;
  readonly y: number;
  readonly kind: SurfaceDiffCellKind;
  readonly before: Cell;
  readonly after: Cell;
}

export interface SurfaceDiff {
  readonly width: number;
  readonly height: number;
  readonly beforeWidth: number;
  readonly beforeHeight: number;
  readonly afterWidth: number;
  readonly afterHeight: number;
  readonly changedCells: number;
  readonly charChanges: number;
  readonly styleOnlyChanges: number;
  readonly bounds: SurfaceDiffBounds | undefined;
  readonly cells: readonly SurfaceDiffCell[];
}

export interface SurfaceDiffRenderOptions {
  readonly mode?: SurfaceDiffRenderMode;
}

const EMPTY_CELL: Cell = Object.freeze({ char: ' ', empty: true });

export function diffSurfaces(before: Surface, after: Surface): SurfaceDiff {
  const width = Math.max(before.width, after.width);
  const height = Math.max(before.height, after.height);
  const cells: SurfaceDiffCell[] = [];
  let charChanges = 0;
  let styleOnlyChanges = 0;
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const beforeCell = cellAt(before, x, y);
      const afterCell = cellAt(after, x, y);
      const charChanged = cellGlyphKey(beforeCell) !== cellGlyphKey(afterCell);
      const styleChanged = cellStyleKey(beforeCell) !== cellStyleKey(afterCell);

      if (!charChanged && !styleChanged) {
        continue;
      }

      const kind: SurfaceDiffCellKind = charChanged ? 'char' : 'style';
      if (kind === 'char') {
        charChanges++;
      } else {
        styleOnlyChanges++;
      }

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      cells.push({ x, y, kind, before: beforeCell, after: afterCell });
    }
  }

  const bounds = cells.length === 0
    ? undefined
    : {
        x: minX,
        y: minY,
        width: maxX - minX + 1,
        height: maxY - minY + 1,
      };

  return {
    width,
    height,
    beforeWidth: before.width,
    beforeHeight: before.height,
    afterWidth: after.width,
    afterHeight: after.height,
    changedCells: cells.length,
    charChanges,
    styleOnlyChanges,
    bounds,
    cells,
  };
}

export function surfaceDiffSurface(
  before: Surface,
  after: Surface,
  options: SurfaceDiffRenderOptions = {},
): Surface {
  const diff = diffSurfaces(before, after);
  const mode = options.mode ?? 'side-by-side';
  const lines = mode === 'overlay'
    ? overlayLines(diff, after)
    : sideBySideLines(diff, before, after);

  return linesToSurface(lines, diff);
}

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
      lines.push(`(${xy(cell.x, cell.y)}) char ${quoteChar(cell.before)} -> ${quoteChar(cell.after)}`);
    } else {
      lines.push(`(${xy(cell.x, cell.y)}) style ${styleLabel(cell.before)} -> ${styleLabel(cell.after)}`);
    }
  }

  return lines.join('\n');
}

function cellAt(surface: Surface, x: number, y: number): Cell {
  if (x < 0 || y < 0 || x >= surface.width || y >= surface.height) {
    return EMPTY_CELL;
  }
  return surface.get(x, y);
}

function cellGlyphKey(cell: Cell): string {
  return `${cell.empty === true ? 'empty' : 'paint'}:${cell.char}`;
}

function cellStyleKey(cell: Cell): string {
  return JSON.stringify({
    fg: cell.fg ?? null,
    bg: cell.bg ?? null,
    fgRGB: cell.fgRGB ?? null,
    bgRGB: cell.bgRGB ?? null,
    modifiers: cell.modifiers ?? null,
    opacity: cell.opacity ?? null,
  });
}

function sideBySideLines(diff: SurfaceDiff, before: Surface, after: Surface): readonly string[] {
  const beforeWidth = Math.max(6, before.width);
  const afterWidth = Math.max(5, after.width);
  const lines = [
    summary(diff),
    bounds(diff),
    `${'before'.padEnd(beforeWidth)} | ${'after'.padEnd(afterWidth)}`,
  ];

  for (let y = 0; y < diff.height; y++) {
    lines.push(`${surfaceRow(before, y, beforeWidth).trimEnd()} | ${surfaceRow(after, y, afterWidth).trimEnd()}`);
  }

  return lines;
}

function overlayLines(diff: SurfaceDiff, after: Surface): readonly string[] {
  const overlayWidth = Math.max(1, diff.width);
  const lines = [
    summary(diff),
    bounds(diff),
    'overlay',
  ];
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

function linesToSurface(lines: readonly string[], diff: SurfaceDiff): Surface {
  const width = Math.max(1, ...lines.map((line) => line.length));
  const surface = createSurface(width, lines.length);
  const changed = new Map(diff.cells.map((c) => [xy(c.x, c.y), c.kind]));
  const overlayStart = lines.indexOf('overlay') + 1;

  for (let y = 0; y < lines.length; y++) {
    const line = lines[y] ?? '';
    for (let x = 0; x < line.length; x++) {
      const style = overlayStart > 0 && y >= overlayStart && ((y - overlayStart) % 2 === 0)
        ? markerStyle(changed.get(xy(x, Math.floor((y - overlayStart) / 2))))
        : {};
      surface.set(x, y, { char: line[x] ?? ' ', empty: false, ...style });
    }
  }

  return surface;
}

function markerStyle(kind: SurfaceDiffCellKind | undefined): Pick<Cell, 'fg' | 'bg'> {
  if (kind === 'char') return { fg: '#111111', bg: '#ffcc00' };
  if (kind === 'style') return { fg: '#111111', bg: '#66ccff' };
  return {};
}

function surfaceRow(surface: Surface, y: number, width: number): string {
  let row = '';
  for (let x = 0; x < width; x++) {
    row += glyph(cellAt(surface, x, y));
  }
  return row;
}

function glyph(cell: Cell): string {
  return cell.empty === true || cell.char === '' ? ' ' : cell.char;
}

function summary(diff: SurfaceDiff): string {
  return ['surface diff:', diff.changedCells, 'changed,', diff.charChanges, 'char,', diff.styleOnlyChanges, 'style'].join(' ');
}

function bounds(diff: SurfaceDiff): string {
  if (diff.bounds === undefined) return 'bounds: none';
  return ['bounds: x=', diff.bounds.x, ' y=', diff.bounds.y, ' w=', diff.bounds.width, ' h=', diff.bounds.height].join('');
}

function quoteChar(cell: Cell): string {
  return JSON.stringify(glyph(cell));
}

function styleLabel(cell: Cell): string {
  return [
    `fg=${colorLabel(cell.fg)}`,
    `bg=${colorLabel(cell.bg)}`,
    `fgRGB=${rgbLabel(cell.fgRGB)}`,
    `bgRGB=${rgbLabel(cell.bgRGB)}`,
    `modifiers=${cell.modifiers?.join('+') ?? 'none'}`,
    `opacity=${cell.opacity?.toString() ?? 'default'}`,
  ].join(' ');
}

function xy(x: number, y: number): string { return [x, y].join(','); }

function colorLabel(value: Cell['fg']): string {
  if (value == null) return 'default';
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}

function rgbLabel(value: Cell['fgRGB']): string {
  return value === undefined ? 'default' : value.join(',');
}
