import {
  breadcrumb,
  createSurface,
  parseAnsiToSurface,
  stripAnsi,
  type BijouContext,
  type Surface,
} from '../../packages/bijou/src/index.js';
import { createStoryProfileContext, storyPreviewSurface, type ComponentStory } from '../_stories/protocol.js';
import { peerTabs } from './library-progress.js';
import { MAX_WIDTH, SLIDE_SEC, wrap, LIBRARY_MODES, type LibraryModel } from './library-model.js';

/* Drawing helpers for the library's body: carousel, variant dots, breadcrumb heading and the mode row. */

export function writeRow(surface: Surface, x: number, y: number, text: string, active: boolean): number {
  const modifiers = active ? ['bold', 'inverse'] : ['dim'];
  Array.from(text).forEach((char, i) => { surface.set(x + i, y, { char, modifiers, empty: false }); });
  return x + Array.from(text).length;
}

/**
 * The one row of chrome the library owns. The output modes are peers with one active, so they are Bijou's
 * tabs(); the info and RTL switches are toggles, not peers, so they sit apart with their state spelled out,
 * beside any scroll hint. Mirrors in RTL.
 */
export function modeRow(surface: Surface, y: number, model: LibraryModel, hint: string, ctx: BijouContext): void {
  const modes = peerTabs(LIBRARY_MODES.map((m, i) => `${String(i + 1)} ${m.label}`), model.modeIndex, surface.width - 40, ctx, model.rtl);
  surface.blit(modes, model.rtl ? surface.width - modes.width - 1 : 1, y);
  const onOff = (on: boolean): string => (on ? 'on' : 'off');
  const toggles = [`i info ${onOff(model.docs)}`, `r RTL ${onOff(model.rtl)}`, ...(hint === '' ? [] : [hint])].join(' · ');
  const width = Array.from(toggles).length;
  writeRow(surface, model.rtl ? 1 : surface.width - width - 1, y, toggles, false);
}

export function renderPreview(story: ComponentStory, variantIndex: number, model: LibraryModel, ctx: BijouContext, w: number, h: number): Surface {
  const libraryMode = LIBRARY_MODES[model.modeIndex] ?? LIBRARY_MODES[0];
  const variant = story.variants[wrap(variantIndex, story.variants.length)];
  if (libraryMode === undefined || variant === undefined) return createSurface(0, 0);
  const previewCtx = createStoryProfileContext(ctx, { id: libraryMode.mode, label: libraryMode.label, mode: libraryMode.mode, width: w }, { width: w, height: h });
  // Static is one honest frame, so its clock stands still; interactive animates.
  const timeMs = libraryMode.mode === 'static' ? 0 : model.time * 1000;
  return storyPreviewSurface(variant.render({ width: w, ctx: previewCtx, state: variant.initialState, timeMs }));
}

/** Carousel: the current variant, sliding in over the previous one for SLIDE_SEC after Tab. */
export function carousel(story: ComponentStory, model: LibraryModel, ctx: BijouContext, width: number, h: number): Surface {
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
  // Slides travel toward the end of the line, which is leftward in RTL.
  const travel = width * model.slide.dir * (model.rtl ? -1 : 1);
  out.blit(previous, centre(previous) - Math.round(travel * eased), 0);
  out.blit(current, centre(current) + Math.round(travel * (1 - eased)), 0);
  return out;
}

/** Variant dots under the carousel: ‹ ○ ● ○ › (the heading names the variant). Reversed in RTL. */
export function dots(story: ComponentStory, model: LibraryModel, width: number, ctx: BijouContext): Surface {
  const tabsRow = peerTabs(story.variants.map((v) => v.label), wrap(model.variantIndex, story.variants.length), width - 8, ctx, model.rtl);
  const surface = createSurface(width, 1);
  surface.blit(tabsRow, Math.max(0, Math.floor((width - tabsRow.width) / 2)), 0);
  return surface;
}

/** Breadcrumb above the component (family › component), drawn with Bijou's breadcrumb(). The variant is a tab, not a place. */
export function heading(story: ComponentStory, model: LibraryModel, ctx: BijouContext, width: number): Surface {
  const items = [story.family, story.title];
  const surface = createSurface(width, 1);
  const text = breadcrumb(items, { ctx, direction: model.rtl ? 'rtl' : 'ltr' });
  const len = Array.from(stripAnsi(text)).length;
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

/**
 * Chrome styling: the footer sits on the muted surface, below the page body, so the two stay
 * distinguishable in every shell theme. The frame header is covered by the progress-bar overlay.
 * Pass it to run() as `css`.
 */
export const LIBRARY_CSS = `
FrameHelp { background: var(surface.muted); }
`;
