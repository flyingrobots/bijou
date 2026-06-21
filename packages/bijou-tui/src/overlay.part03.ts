import { graphemeClusterWidth, isPackedSurface, shouldApplyBg, surfaceToString } from '@flyingrobots/bijou';

import type { BijouContext, Surface, TokenValue } from '@flyingrobots/bijou';

import type { CellStyle } from './overlay.part02.js';
export function styleFromToken(token: TokenValue | undefined, ctx: BijouContext | undefined): CellStyle {
  if (!ctx || token == null) return {};
  const style: CellStyle = {
    fg: token.hex,
    bg: token.bg,
    modifiers: token.modifiers ? [...token.modifiers] : undefined,
  };
  if (token.fgRGB) style.fgRGB = token.fgRGB;
  if (token.bgRGB) style.bgRGB = token.bgRGB;
  return style;
}
export function backgroundStyleFromToken(token: TokenValue | undefined, ctx: BijouContext | undefined): CellStyle {
  if (!ctx || !shouldApplyBg(ctx) || !token?.bg) return {};
  const style: CellStyle = { bg: token.bg };
  if (token.bgRGB) style.bgRGB = token.bgRGB;
  return style;
}
export function mergeStyles(base: CellStyle, extra: CellStyle): CellStyle {
  const modifiers = [...(base.modifiers ?? []), ...(extra.modifiers ?? [])];
  const fg = extra.fg ?? base.fg;
  const bg = extra.bg ?? base.bg;
  return {
    fg,
    bg,
    // When extra.fg overrides base.fg, use extra's fgRGB (may be
    // undefined — correctly clearing the pre-parsed cache so the
    // differ falls back to inlineHexRGB for the new hex string).
    // When extra.fg is absent, inherit base's fgRGB if available.
    fgRGB: extra.fg != null ? extra.fgRGB : (extra.fgRGB ?? base.fgRGB),
    bgRGB: extra.bg != null ? extra.bgRGB : (extra.bgRGB ?? base.bgRGB),
    modifiers: modifiers.length > 0 ? Array.from(new Set(modifiers)) : undefined,
  };
}
export function withFallbackBackground(style: CellStyle, background: Pick<CellStyle, 'bg' | 'bgRGB'>): CellStyle {
  if (style.bg != null || style.bgRGB != null) return style;
  if (background.bg == null && background.bgRGB == null) return style;
  return {
    ...style,
    bg: background.bg,
    bgRGB: background.bgRGB,
  };
}
export function plainSurfaceToString(surface: Surface): string {
  const lines: string[] = [];
  for (let y = 0; y < surface.height; y++) {
    let line = '';
    for (let x = 0; x < surface.width; x++) {
      line += surface.get(x, y).char;
    }
    lines.push(line);
  }
  return lines.join('\n');
}
export function overlayContentFromSurface(surface: Surface, ctx: BijouContext | undefined): string {
  return ctx ? surfaceToString(surface, ctx.style) : plainSurfaceToString(surface);
}
export function setStyledCell(surface: Surface, x: number, y: number, char: string, style: CellStyle, numStyle?: { fR: number; fG: number; fB: number; bR: number; bG: number; bB: number; fl: number }): void {
  if (numStyle && isPackedSurface(surface)) {
    surface.setRGB(x, y, char, numStyle.fR, numStyle.fG, numStyle.fB, numStyle.bR, numStyle.bG, numStyle.bB, numStyle.fl);
  } else {
    surface.set(x, y, { char, ...style, empty: false });
  }
}
export function setStyledGrapheme(surface: Surface, x: number, y: number, char: string, style: CellStyle, numStyle?: { fR: number; fG: number; fB: number; bR: number; bG: number; bB: number; fl: number }): number {
  if (x >= surface.width) return 0;

  const width = Math.max(1, graphemeClusterWidth(char));
  setStyledCell(surface, x, y, char, style, numStyle);
  for (let offset = 1; offset < width && x + offset < surface.width; offset++) {
    setStyledCell(surface, x + offset, y, '', style);
  }
  return width;
}
