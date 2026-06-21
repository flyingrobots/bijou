import { parseAnsiToSurface, renderByMode } from '@flyingrobots/bijou';

import type { BijouContext, Cell } from '@flyingrobots/bijou';

import { resolveBCSSTextToken, toStyleToken } from './css/text-style.js';

import { GUTTER_CHAR, SCROLLBAR_THUMB_CELL, SCROLLBAR_TRACK_CELL, gutterCellCache, scrollbarCellCache } from './focus-area.part01.js';

import type { FocusAreaRenderOptions } from './focus-area.part01.js';
export function resolveGutter(
  focused: boolean,
  ctx: BijouContext | undefined,
  options: FocusAreaRenderOptions | undefined,
): string {
  if (!ctx) return GUTTER_CHAR;

  return renderByMode(ctx.mode, {
    static: () => GUTTER_CHAR,
    interactive: () => {
      const baseToken = focused
        ? (options?.focusedGutterToken ?? ctx.ui('focusGutter'))
        : (options?.unfocusedGutterToken ?? ctx.semantic('muted'));
      const token = resolveBCSSTextToken(
        ctx,
        {
          type: 'FocusArea',
          id: options?.id,
          classes: [...(options?.classes ?? []), focused ? 'focused' : 'unfocused'],
        },
        {
          hex: baseToken.hex,
          bg: baseToken.bg,
          modifiers: baseToken.modifiers,
        },
      );

      return ctx.style.styled(toStyleToken(token), GUTTER_CHAR);
    },
  }, options);
}
export function resolveGutterCell(
  focused: boolean,
  ctx: BijouContext | undefined,
  options: FocusAreaRenderOptions | undefined,
) {
  const key = resolveGutter(focused, ctx, options);
  const cached = gutterCellCache.get(key);
  if (cached != null) return cached;
  const parsed = parseAnsiToSurface(key, 1, 1).get(0, 0);
  gutterCellCache.set(key, parsed);
  return parsed;
}
export function resolveScrollbarCells(
  ctx: BijouContext | undefined,
  options: FocusAreaRenderOptions | undefined,
): { track: Cell; thumb: Cell } {
  return {
    track: resolveScrollbarCell('track', ctx, options),
    thumb: resolveScrollbarCell('thumb', ctx, options),
  };
}
export function resolveScrollbarCell(
  kind: 'track' | 'thumb',
  ctx: BijouContext | undefined,
  options: FocusAreaRenderOptions | undefined,
): Cell {
  if (!ctx) {
    return kind === 'thumb' ? SCROLLBAR_THUMB_CELL : SCROLLBAR_TRACK_CELL;
  }

  const baseToken = kind === 'thumb'
    ? (options?.scrollbarThumbToken ?? ctx.ui('scrollThumb'))
    : (options?.scrollbarTrackToken ?? ctx.ui('scrollTrack'));
  const baseChar = kind === 'thumb' ? SCROLLBAR_THUMB_CELL.char : SCROLLBAR_TRACK_CELL.char;
  const key = `${kind}:${baseChar}:${JSON.stringify(baseToken)}:${options?.id ?? ''}:${(options?.classes ?? []).join(',')}`;
  const cached = scrollbarCellCache.get(key);
  if (cached != null) return cached;

  const token = resolveBCSSTextToken(
    ctx,
    {
      type: kind === 'thumb' ? 'FocusAreaScrollbarThumb' : 'FocusAreaScrollbarTrack',
      id: options?.id,
      classes: [...(options?.classes ?? []), 'scrollbar', `scrollbar-${kind}`],
    },
    {
      hex: baseToken.hex,
      bg: baseToken.bg,
      modifiers: baseToken.modifiers,
    },
  );
  const parsed = parseAnsiToSurface(ctx.style.styled(toStyleToken(token), baseChar), 1, 1).get(0, 0);
  scrollbarCellCache.set(key, parsed);
  return parsed;
}
