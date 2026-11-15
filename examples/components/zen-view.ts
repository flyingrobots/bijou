import {
  breadcrumb,
  createSurface,
  parseAnsiToSurface,
  stripAnsi,
  type BijouContext,
  type Surface,
  type TokenValue,
} from '../../packages/bijou/src/index.js';
import { createStoryProfileContext, storyPreviewSurface, type ComponentStory } from '../_stories/protocol.js';
import { MAX_WIDTH, SLIDE_SEC, wrap, ZEN_MODES, type ZenModel } from './zen-model.js';

/* Drawing helpers for Zen's body: carousel, variant dots, breadcrumb heading and the mode row. */

export function writeRow(surface: Surface, x: number, y: number, text: string, active: boolean): number {
  const modifiers = active ? ['bold', 'inverse'] : ['dim'];
  Array.from(text).forEach((char, i) => { surface.set(x + i, y, { char, modifiers, empty: false }); });
  return x + Array.from(text).length;
}

/** The one row of chrome Zen owns: which lowering is active, docs on or off, and scroll hints. */
export function modeRow(surface: Surface, y: number, model: ZenModel, hint: string): void {
  let x = 1;
  ZEN_MODES.forEach((m, i) => { x = writeRow(surface, x, y, ` ${String(i + 1)} ${m.label} `, i === model.modeIndex) + 1; });
  x = writeRow(surface, x + 2, y, ' i info ', model.docs);
  if (hint !== '') writeRow(surface, Math.max(x + 2, surface.width - Array.from(hint).length - 1), y, hint, false);
}

export function renderPreview(story: ComponentStory, variantIndex: number, model: ZenModel, ctx: BijouContext, w: number, h: number): Surface {
  const zenMode = ZEN_MODES[model.modeIndex] ?? ZEN_MODES[0];
  const variant = story.variants[wrap(variantIndex, story.variants.length)];
  if (zenMode === undefined || variant === undefined) return createSurface(0, 0);
  const previewCtx = createStoryProfileContext(ctx, { id: zenMode.mode, label: zenMode.label, mode: zenMode.mode, width: w }, { width: w, height: h });
  // Static is one honest frame, so its clock stands still; TUI animates.
  const timeMs = zenMode.mode === 'static' ? 0 : model.time * 1000;
  return storyPreviewSurface(variant.render({ width: w, ctx: previewCtx, state: variant.initialState, timeMs }));
}

/** Carousel: the current variant, sliding in over the previous one for SLIDE_SEC after Tab. */
export function carousel(story: ComponentStory, model: ZenModel, ctx: BijouContext, width: number, h: number): Surface {
  const w = Math.min(width - 8, MAX_WIDTH);
  const current = renderPreview(story, model.variantIndex, model, ctx, w, h);
  const t = model.slide === undefined ? 1 : Math.min(1, (model.time - model.slide.at) / SLIDE_SEC);
  const centre = (s: Surface): number => Math.floor((width - s.width) / 2);
  if (model.slide === undefined || t >= 1) {
    const lane = createSurface(width, Math.max(current.height, 1));
    lane.blit(current, centre(current), 0);
    return lane;
  }
  const eased = 1 - (1 - t) ** 3;
  const previous = renderPreview(story, model.slide.from, model, ctx, w, h);
  const out = createSurface(width, Math.max(current.height, previous.height, 1));
  const travel = width * model.slide.dir;
  out.blit(previous, centre(previous) - Math.round(travel * eased), 0);
  out.blit(current, centre(current) + Math.round(travel * (1 - eased)), 0);
  return out;
}

/** Variant dots under the carousel: ‹ ○ ● ○ › (the heading names the variant). */
export function dots(story: ComponentStory, model: ZenModel, width: number): Surface {
  const current = wrap(model.variantIndex, story.variants.length);
  const text = `‹ ${story.variants.map((_, i) => (i === current ? '●' : '○')).join(' ')} ›  tab`;
  const surface = createSurface(width, 1);
  writeRow(surface, Math.max(0, Math.floor((width - Array.from(text).length) / 2)), 0, text, false);
  return surface;
}

/** Breadcrumb above the component — family › component › variant — drawn with Bijou's breadcrumb(). */
export function heading(story: ComponentStory, model: ZenModel, ctx: BijouContext, width: number): Surface {
  const variant = story.variants[wrap(model.variantIndex, story.variants.length)]?.label;
  const items = variant === undefined ? [story.family, story.title] : [story.family, story.title, variant];
  const text = breadcrumb(items, { ctx });
  const len = Array.from(stripAnsi(text)).length;
  const surface = createSurface(width, 1);
  surface.blit(parseAnsiToSurface(text, Math.min(len, width), 1), Math.max(0, Math.floor((width - len) / 2)), 0);
  return surface;
}

export function stack(parts: readonly Surface[], width: number): Surface {
  const height = parts.reduce((n, p) => n + p.height, 0) + Math.max(0, parts.length - 1);
  const out = createSurface(width, height);
  let y = 0;
  for (const part of parts) {
    out.blit(part, Math.max(0, Math.floor((width - part.width) / 2)), y);
    y += part.height + 1;
  }
  return out;
}

/** Zen has one pane, so the frame's focus bar carries no information: paint it in the background colour. */
export function hiddenGutter(ctx: BijouContext): TokenValue {
  const bg = ctx.surface('primary');
  return { hex: bg.bg ?? bg.hex, bg: bg.bg ?? bg.hex };
}
