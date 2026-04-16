import {
  createSurface,
  FULL_MASK,
  parseAnsiToSurface,
  sanitizePositiveInt,
  type BijouContext,
  type CellMask,
  type Surface,
} from '@flyingrobots/bijou';
import { clipToWidth, tokenizeAnsi, visibleLength } from './viewport.js';

const PRESERVE_BG_MASK: CellMask = {
  ...FULL_MASK,
  bg: false,
};
const MARQUEE_CACHE_LIMIT = 128;
const marqueeLineCache = new Map<string, CachedMarqueeLine>();

interface CachedMarqueeLine {
  readonly visibleWidth: number;
  readonly cells: readonly string[];
}

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
    readonly selectedRowOverflow?: SelectedRowOverflow;
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
    const selected = row === options.selectedRowIndex;
    const paintSelectedBg = selected && selectedBg != null;
    if (paintSelectedBg) {
      surface.fill({ char: ' ', bg: selectedBg, empty: false }, 0, row, safeWidth, 1);
    }

    const lineText = resolveRowText(lines[row]!, innerWidth, selected, options.selectedRowOverflow);
    const lineSurface = parseAnsiToSurface(lineText, innerWidth, 1);
    surface.blit(
      lineSurface,
      startCol,
      row,
      0,
      0,
      innerWidth,
      1,
      paintSelectedBg ? PRESERVE_BG_MASK : FULL_MASK,
    );
  }

  return surface;
}

export type SelectedRowOverflow =
  | 'clip'
  | {
    readonly mode: 'marquee';
    readonly elapsedMs: number;
    readonly stepMs?: number;
    readonly startDelayMs?: number;
    readonly endDelayMs?: number;
  };

function resolveRowText(
  line: string,
  innerWidth: number,
  selected: boolean,
  overflow: SelectedRowOverflow | undefined,
): string {
  if (!selected || overflow == null || overflow === 'clip') {
    return clipToWidth(line, innerWidth);
  }
  if (overflow.mode !== 'marquee') {
    return clipToWidth(line, innerWidth);
  }
  return marqueeToWidth(line, innerWidth, overflow);
}

function marqueeToWidth(
  line: string,
  width: number,
  options: Exclude<SelectedRowOverflow, 'clip'>,
): string {
  if (width <= 0) return '';

  const cached = getCachedMarqueeLine(line);
  if (cached.visibleWidth <= width) return clipToWidth(line, width);

  const overflow = cached.visibleWidth - width;
  const stepMs = Math.max(1, Math.floor(options.stepMs ?? 220));
  const startPauseSteps = Math.max(1, Math.round(Math.max(0, options.startDelayMs ?? 700) / stepMs));
  const endPauseSteps = Math.max(1, Math.round(Math.max(0, options.endDelayMs ?? 900) / stepMs));
  const forwardSteps = overflow;
  const reverseSteps = Math.max(0, overflow - 1);
  const cycleLength = startPauseSteps + forwardSteps + endPauseSteps + reverseSteps;
  const stepIndex = Math.floor(Math.max(0, options.elapsedMs) / stepMs) % cycleLength;

  let offset = 0;
  if (stepIndex < startPauseSteps) {
    offset = 0;
  } else if (stepIndex < startPauseSteps + forwardSteps) {
    offset = stepIndex - startPauseSteps + 1;
  } else if (stepIndex < startPauseSteps + forwardSteps + endPauseSteps) {
    offset = overflow;
  } else {
    const reverseIndex = stepIndex - startPauseSteps - forwardSteps - endPauseSteps;
    offset = overflow - 1 - reverseIndex;
  }

  return cached.cells.slice(offset, offset + width).join('');
}

function resolveSelectedRowBg(ctx: BijouContext | undefined): string | undefined {
  return ctx?.surface('elevated').bg
    ?? ctx?.surface('secondary').bg
    ?? ctx?.surface('muted').bg;
}

function getCachedMarqueeLine(line: string): CachedMarqueeLine {
  const cached = marqueeLineCache.get(line);
  if (cached != null) {
    marqueeLineCache.delete(line);
    marqueeLineCache.set(line, cached);
    return cached;
  }

  const visibleWidth = visibleLength(line);
  const next: CachedMarqueeLine = {
    visibleWidth,
    cells: tokenizeAnsi(line, visibleWidth),
  };
  marqueeLineCache.set(line, next);

  if (marqueeLineCache.size > MARQUEE_CACHE_LIMIT) {
    const oldestKey = marqueeLineCache.keys().next().value;
    if (typeof oldestKey === 'string') {
      marqueeLineCache.delete(oldestKey);
    }
  }

  return next;
}
