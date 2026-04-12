import {
  createSurface,
  FULL_MASK,
  parseAnsiToSurface,
  sanitizePositiveInt,
  type BijouContext,
  type CellMask,
  type Surface,
} from '@flyingrobots/bijou';
import { clipToWidth } from './viewport.js';

const PRESERVE_BG_MASK: CellMask = {
  ...FULL_MASK,
  bg: false,
};

function rowInsetForWidth(width: number): number {
  return width >= 3 ? 1 : 0;
}

export function insetLineSurface(text: string, width: number): Surface {
  const safeWidth = sanitizePositiveInt(width, 1);
  const startCol = rowInsetForWidth(safeWidth);
  const innerWidth = Math.max(1, safeWidth - (startCol * 2));
  const surface = createSurface(safeWidth, 1, { char: ' ', empty: false });
  const content = parseAnsiToSurface(clipToWidth(text, innerWidth), innerWidth, 1);
  surface.blit(content, startCol, 0);
  return surface;
}

export function collectionRowsSurface(
  lines: readonly string[],
  options: {
    readonly width: number;
    readonly selectedRowIndex?: number;
    readonly ctx?: BijouContext;
  },
): Surface {
  const safeWidth = sanitizePositiveInt(options.width, 1);
  const height = Math.max(1, lines.length);
  const startCol = rowInsetForWidth(safeWidth);
  const innerWidth = Math.max(1, safeWidth - (startCol * 2));
  const selectedBg = resolveSelectedRowBg(options.ctx);
  const surface = createSurface(safeWidth, height, { char: ' ', empty: false });

  for (let row = 0; row < lines.length; row++) {
    const selected = row === options.selectedRowIndex && selectedBg != null;
    if (selected) {
      surface.fill({ char: ' ', bg: selectedBg, empty: false }, 0, row, safeWidth, 1);
    }

    const lineSurface = parseAnsiToSurface(clipToWidth(lines[row]!, innerWidth), innerWidth, 1);
    surface.blit(
      lineSurface,
      startCol,
      row,
      0,
      0,
      innerWidth,
      1,
      selected ? PRESERVE_BG_MASK : FULL_MASK,
    );
  }

  return surface;
}

function resolveSelectedRowBg(ctx: BijouContext | undefined): string | undefined {
  return ctx?.surface('elevated').bg
    ?? ctx?.surface('secondary').bg
    ?? ctx?.surface('muted').bg;
}
