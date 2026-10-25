import { createSurface, parseAnsiToSurface, type BijouContext } from '@flyingrobots/bijou';
import { isKeyMsg, isMouseMsg, isResizeMsg, quit, tick, type App } from '@flyingrobots/bijou-tui';
import type { MarkdownPart } from './render.js';
import { themeColor } from './theme-color.js';

interface DocumentLine { readonly text: string; readonly raster: boolean }
export interface AnimationModel {
  readonly lines: readonly DocumentLine[];
  readonly columns: number;
  readonly rows: number;
  readonly offset: number;
  readonly step: number;
  readonly paused: boolean;
}
interface ColorTick { readonly type: 'color-tick' }

/** Rasterize only at startup/resize; animation changes visible cell colors. */
export function createDocumentAnimation(render: (width: number) => readonly MarkdownPart[], ctx: BijouContext, maxWidth: number): App<AnimationModel, ColorTick> {
  const dimensions = (columns: number, rows: number) => ({
    columns: Math.max(1, Math.min(240, columns)), rows: Math.max(1, Math.min(200, rows)),
  });
  const layout = (width: number): readonly DocumentLine[] => {
    const lines: DocumentLine[] = [];
    for (const [index, part] of render(Math.min(maxWidth, width)).entries()) {
      if (index > 0) lines.push({ text: '', raster: false });
      for (const text of part.text.split('\n')) lines.push({ text, raster: part.raster });
    }
    return lines;
  };
  const initial = dimensions(ctx.runtime.columns, ctx.runtime.rows);
  const initialLines = layout(initial.columns);
  const nextTick = () => tick<ColorTick>(100, { type: 'color-tick' });
  const scroll = (model: AnimationModel, offset: number): AnimationModel => ({
    ...model, offset: Math.max(0, Math.min(Math.max(0, model.lines.length - model.rows + 1), offset)),
  });
  return {
    init: () => [{ ...initial, lines: initialLines, offset: 0, step: 0, paused: false }, [nextTick()]],
    update: (msg, model) => {
      if (msg.type === 'color-tick') return [model.paused ? model : { ...model, step: (model.step + 1) % 200 }, [nextTick()]];
      if (isResizeMsg(msg)) {
        const size = dimensions(msg.columns, msg.rows);
        const resized = { ...model, ...size, lines: layout(size.columns) };
        return [scroll(resized, model.offset), []];
      }
      if (isMouseMsg(msg)) {
        const delta = msg.action === 'scroll-up' ? -3 : msg.action === 'scroll-down' ? 3 : 0;
        return [scroll(model, model.offset + delta), []];
      }
      if (isKeyMsg(msg)) {
        if (msg.key === 'q' || (msg.ctrl && msg.key === 'c')) return [model, [quit()]];
        if (msg.key === 'space' || msg.key === ' ') return [{ ...model, paused: !model.paused }, []];
        if (msg.key === 'down' || msg.key === 'j') return [scroll(model, model.offset + 1), []];
        if (msg.key === 'up' || msg.key === 'k') return [scroll(model, model.offset - 1), []];
        if (msg.key === 'pagedown') return [scroll(model, model.offset + model.rows - 1), []];
        if (msg.key === 'pageup') return [scroll(model, model.offset - model.rows + 1), []];
        if (msg.key === 'home') return [scroll(model, 0), []];
        if (msg.key === 'end') return [scroll(model, model.lines.length), []];
      }
      return [model, []];
    },
    view: (model) => {
      const screen = createSurface(model.columns, model.rows);
      // One color per frame keeps terminal updates compact; geometry stays cached.
      const color = themeColor(ctx, model.step);
      for (let y = 0; y < model.rows - 1; y++) {
        const line = model.lines[model.offset + y];
        if (line === undefined) break;
        const row = parseAnsiToSurface(line.text, model.columns, 1);
        if (line.raster) {
          for (let x = 0; x < model.columns; x++) {
            // Parsed ANSI cells cache RGB channels; replace the cache with the color.
            row.set(x, 0, { ...row.get(x, 0), fgRGB: undefined, fg: color });
          }
        }
        screen.blit(row, 0, y);
      }
      const footer = `↑/↓ scroll · Space ${model.paused ? 'resume' : 'pause'} · q quit`;
      screen.blit(parseAnsiToSurface(footer, model.columns, 1), 0, model.rows - 1);
      return screen;
    },
  };
}
