import { createSurface, isPackedSurface, segmentGraphemes } from '@flyingrobots/bijou';

import type { BijouContext, Surface, TokenValue } from '@flyingrobots/bijou';

import { encodeModifiers, parseHex } from '@flyingrobots/bijou/perf';

import { resolvedColorHex, resolvedColorRgb } from './notification.part01.js';

import type { NotificationTone } from './notification.part01.js';

import type { CellTextStyle } from './notification.part02.js';
export function toneSemanticKey(tone: NotificationTone): 'info' | 'success' | 'warning' | 'error' {
  switch (tone) {
    case 'INFO':
      return 'info';
    case 'SUCCESS':
      return 'success';
    case 'WARNING':
      return 'warning';
    case 'ERROR':
      return 'error';
  }
}
export function defaultBgToken(ctx: BijouContext | undefined): TokenValue | undefined {
  return ctx?.theme.theme.surface.overlay;
}
export function formatTimeLabel(ms: number): string {
  return new Date(ms).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
export function tokenToCellStyle(token: TokenValue | undefined): CellTextStyle {
  if (token == null) return {};
  return {
    fg: token.hex,
    bg: token.bg,
    ...(token.fgRGB ? { fgRGB: token.fgRGB } : {}),
    ...(token.bgRGB ? { bgRGB: token.bgRGB } : {}),
    modifiers: token.modifiers,
  };
}
export function withModifiers(style: CellTextStyle, modifiers: readonly string[]): CellTextStyle {
  const next = new Set(style.modifiers ?? []);
  for (const modifier of modifiers) {
    next.add(modifier);
  }
  return {
    ...style,
    modifiers: next.size === 0 ? undefined : Array.from(next),
  };
}
export function createSegmentSurface(segments: readonly { readonly text: string; readonly style?: CellTextStyle }[]): Surface {
  const graphemeSegments = segments.map((segment) => ({
    graphemes: segmentGraphemes(segment.text),
    style: segment.style,
  }));
  const width = graphemeSegments.reduce((sum, segment) => sum + segment.graphemes.length, 0);
  const surface = createSurface(width, 1);
  let x = 0;

  const packed = isPackedSurface(surface);
  for (const segment of graphemeSegments) {
    const s = segment.style;
    if (packed && s) {
      let fR = -1, fG = 0, fB = 0, bR = -1, bG = 0, bB = 0;
      const fgHex = resolvedColorHex(s.fg);
      const fgRgb = s.fgRGB ?? resolvedColorRgb(s.fg) ?? (fgHex ? parseHex(fgHex) : undefined);
      if (fgRgb) { [fR, fG, fB] = fgRgb; }
      const bgHex = resolvedColorHex(s.bg);
      const bgRgb = s.bgRGB ?? resolvedColorRgb(s.bg) ?? (bgHex ? parseHex(bgHex) : undefined);
      if (bgRgb) { [bR, bG, bB] = bgRgb; }
      const fl = s.modifiers ? encodeModifiers(s.modifiers) : 0;
      for (const char of segment.graphemes) {
        (surface).setRGB(x, 0, char, fR, fG, fB, bR, bG, bB, fl);
        x++;
      }
    } else {
      for (const char of segment.graphemes) {
        surface.set(x, 0, {
          char,
          fg: s?.fg,
          bg: s?.bg,
          fgRGB: s?.fgRGB,
          bgRGB: s?.bgRGB,
          modifiers: s?.modifiers ? [...s.modifiers] : undefined,
          empty: false,
        });
        x++;
      }
    }
  }

  return surface;
}
export function createBlankLineSurface(width: number): Surface {
  return createSurface(Math.max(0, width), 1);
}
