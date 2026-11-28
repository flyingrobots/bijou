import { createSurface, type Surface } from '../../ports/surface.js';
import { writeSurfaceGrapheme } from '../render/differ-string.js';
import { resolveSafeCtx } from '../resolve-ctx.js';
import { orderForDirection, resolveDirection, type InlineDirection } from '../direction/direction.js';
import { textWidth, wrapSpans, type DrawCell, type DrawSpan, type WrappedLine } from './draw-wrap.js';

/** A slot as a drawing receives it: its text, or the Surface of a nested block. */
export type SlotPart = string | Surface;

/** A row of text spans that wraps to the width, every line starting `indent` columns in. */
export interface TextLine {
  readonly spans: readonly DrawSpan[];
  readonly indent: number;
}

/** A Surface-valued slot, blitted cell by cell `indent` columns in and clipped to the width. */
export interface SurfaceLine {
  readonly surface: Surface;
  readonly indent: number;
}

export type DrawLine = TextLine | SurfaceLine;

/** A span of `text` with optional cell modifiers such as `bold`. */
export function span(text: string, ...modifiers: string[]): DrawSpan {
  return modifiers.length === 0 ? { text } : { text, modifiers };
}

export function textLine(spans: readonly DrawSpan[], indent = 0): TextLine {
  return { spans, indent };
}

/** One slot part on its own line: wrapped text, or a blitted Surface. */
export function partLine(part: SlotPart, indent = 0, ...modifiers: string[]): DrawLine {
  return typeof part === 'string' ? textLine([span(part, ...modifiers)], indent) : { surface: part, indent };
}

/** The text parts of `parts` when none is a Surface; otherwise undefined. */
export function textParts(parts: readonly (SlotPart | undefined)[]): string[] | undefined {
  const present = parts.filter((part): part is SlotPart => part !== undefined && part !== '');
  return present.every((part) => typeof part === 'string') ? present : undefined;
}

/**
 * `parts` joined by `separator` on one wrapping row when all are text; when
 * one is a Surface, each part gets its own line. Absent parts are left out.
 */
export function inlineLines(parts: readonly (SlotPart | undefined)[], separator: string, ...modifiers: string[]): DrawLine[] {
  const texts = textParts(parts);
  if (texts !== undefined) {
    if (texts.length === 0) return [];
    return [textLine(texts.flatMap((text, index) => (index === 0 ? [] : [span(separator, ...modifiers)]).concat(span(text, ...modifiers))))];
  }
  return parts.flatMap((part) => (part === undefined || part === '' ? [] : [partLine(part, 0, ...modifiers)]));
}

/**
 * The inline direction drawings follow: the default context's direction when
 * one is configured, otherwise `ltr`. Block render input carries no context.
 */
export function drawDirection(): InlineDirection {
  return resolveDirection({ ctx: resolveSafeCtx() });
}

/** `text` centred in `width` columns with spaces; `text` must already fit. */
export function centerText(text: string, width: number): string {
  const room = Math.max(0, width - textWidth(text));
  const before = Math.floor(room / 2);
  return ' '.repeat(before) + text + ' '.repeat(room - before);
}

/** A wrapped line's cells in visual order: its spans' fragments reversed under `rtl`, each fragment kept as written. */
function visualCells(line: WrappedLine, direction: InlineDirection): DrawCell[] {
  const fragments: DrawCell[][] = [];
  for (const cell of line) {
    const last = fragments[fragments.length - 1];
    if (last !== undefined && last[0]?.span === cell.span) last.push(cell);
    else fragments.push([cell]);
  }
  return orderForDirection(fragments, direction).flat();
}

type Placed = { readonly kind: 'text'; readonly cells: DrawCell[]; readonly indent: number } | { readonly kind: 'surface'; readonly line: SurfaceLine };

function layout(lines: readonly DrawLine[], width: number, direction: InlineDirection): Placed[] {
  return lines.flatMap((line): Placed[] => {
    if ('surface' in line) return [{ kind: 'surface', line }];
    const room = Math.max(1, width - line.indent);
    return wrapSpans(line.spans, room).map((wrapped) => ({ kind: 'text', cells: visualCells(wrapped, direction), indent: line.indent }));
  });
}

function placeCells(target: Surface, cells: readonly DrawCell[], indent: number, y: number, direction: InlineDirection): void {
  const used = cells.reduce((sum, cell) => sum + cell.width, 0);
  let x = direction === 'rtl' ? Math.max(0, target.width - indent - used) : Math.min(indent, target.width);
  for (const cell of cells) {
    if (x + cell.width > target.width) return;
    const style = cell.modifiers === undefined ? undefined : { modifiers: [...cell.modifiers] };
    x += writeSurfaceGrapheme(target, x, y, cell.grapheme, style);
  }
}

function placeSurface(target: Surface, line: SurfaceLine, y: number, direction: InlineDirection): void {
  const shown = Math.max(0, Math.min(line.surface.width, target.width - line.indent));
  const x = direction === 'rtl' ? target.width - line.indent - shown : line.indent;
  if (shown > 0) target.blit(line.surface, x, y, 0, 0, shown, line.surface.height);
}

/**
 * Draws `lines` into a Surface exactly `width` columns wide. Text wraps between
 * words, so no slot text is lost; Surfaces are blitted clipped to the width.
 * Each line starts at the logical start edge: the left under `ltr`, the right
 * under `rtl`, where a line's spans also run right to left.
 */
export function drawLines(lines: readonly DrawLine[], width: number, direction: InlineDirection): Surface {
  const placed = layout(lines, width, direction);
  const height = placed.reduce((sum, item) => sum + (item.kind === 'text' ? 1 : item.line.surface.height), 0);
  const target = createSurface(width, Math.max(1, height));
  let y = 0;
  for (const item of placed) {
    if (item.kind === 'text') {
      placeCells(target, item.cells, item.indent, y, direction);
      y += 1;
    } else {
      placeSurface(target, item.line, y, direction);
      y += item.line.surface.height;
    }
  }
  return target;
}

export { textWidth };
export type { DrawSpan };
